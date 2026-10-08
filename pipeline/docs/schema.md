# Data model

The SQLite schema is implemented. Extraction, review, and export below describe
future work; use `src/content.config.ts` for the current website content contract.

Two layers, and keeping them separate is the whole design:

- **Working DB** — `pipeline/data/pipeline.db`, SQLite, local only,
  gitignored. Messy state: raw model output, failures, duplicates,
  unreviewed questions. Never deployed, never committed.
- **Published content** — JSON under `src/content/quizzes/`,
  committed, validated by Zod, served statically. Only approved,
  deduplicated questions land here.

The working DB exists so re-running the pipeline is safe and so
nothing depends on a mutable counter.

---

## Part 1 — Working DB (SQLite)

### exams
The true deduplication unit. A question appearing in three different
exams is important; the same exam uploaded three times is not.

| column    | type | notes                    |
|-----------|------|--------------------------|
| id        | TEXT | PK, uuid                 |
| subject   | TEXT | matches site subject slug|
| year      | INT  |                          |
| term      | TEXT |                          |
| exam_type | TEXT | midterm / final / quiz   |

Unique on `(subject, year, term, exam_type)`.

### files
One row per source file. `exam_id` is nullable — files import first
and get assigned later. Never block ingestion on assignment.

Files are curated by hand into `pipeline/data/inbox/` — there is no
Google Drive fetch. `(source, source_ref)` records where each file came
from (this pair replaced the old `drive_id` column).

| column     | type | notes                                                 |
|------------|------|-------------------------------------------------------|
| file_hash  | TEXT | PK, SHA-256 of raw bytes                              |
| exam_id    | TEXT | FK → exams, NULLABLE                                  |
| filename   | TEXT |                                                       |
| source     | TEXT | origin tag, e.g. `inbox`                             |
| source_ref | TEXT | stable id within source (inbox: path relative to it) |
| local_path | TEXT | on-disk path the bytes were read from                |
| status     | TEXT | downloaded / extracted / committed / skipped / failed |
| error      | TEXT | last failure message, nullable                       |

Ingest triages by extension: `.pdf` and image types get
`status='downloaded'`; anything else gets `'skipped'` with the reason in
`error`. Nothing is moved or deleted.

**Skip only on `committed`.** Skipping on row-exists means a crash
mid-extraction marks the file permanently done and it never retries.

### extractions
Raw model output, kept forever. Lets you re-parse after a prompt
change without re-paying for inference — and you will change the
prompt many times.

| column         | type | notes                    |
|----------------|------|--------------------------|
| id             | TEXT | PK                       |
| file_hash      | TEXT | FK → files               |
| page_number    | INT  |                          |
| model          | TEXT | e.g. gemini-flash-latest |
| prompt_version | TEXT | e.g. v3                  |
| raw_response   | TEXT | verbatim, unparsed       |
| created_at     | TEXT | ISO8601                  |

Unique on `(file_hash, page_number, model, prompt_version)` — without
it, re-runs append duplicate raw rows and you can't tell which
produced which question.

### questions

| column         | type | notes                                        |
|----------------|------|----------------------------------------------|
| id             | TEXT | PK                                           |
| text           | TEXT |                                              |
| choices        | TEXT | JSON array of strings                        |
| correct_answer | TEXT | must match one entry in choices              |
| answer_source  | TEXT | marked_in_document / inferred                |
| code           | TEXT | code snippet, nullable — site already supports|
| has_figure     | INT  | 0/1                                          |
| figure_path    | TEXT | path under public/figures/, nullable         |
| review_status  | TEXT | auto_ok / needs_review / approved / rejected |
| flags          | TEXT | JSON array, e.g. ["negation","answer_mismatch"] |
| norm_hash      | TEXT | normalized-text hash, for cheap exact dedup  |
| embedding      | BLOB | nullable                                     |

### occurrences

| column      | type | notes          |
|-------------|------|----------------|
| question_id | TEXT | FK → questions |
| file_hash   | TEXT | FK → files     |
| page_number | INT  |                |

Unique on `(question_id, file_hash, page_number)`. Without this
constraint a restarted script silently re-inflates repetition counts —
the exact bug the occurrences model exists to prevent.

### duplicate_candidates
Suspected pairs awaiting human judgement. Never auto-merged.

| column     | type | notes                          |
|------------|------|--------------------------------|
| question_a | TEXT | FK → questions                 |
| question_b | TEXT | FK → questions                 |
| similarity | REAL |                                |
| verdict    | TEXT | pending / merge / keep_separate|

### Repetition count

```sql
SELECT COUNT(DISTINCT e.id)
FROM occurrences o
JOIN files f ON f.file_hash = o.file_hash
JOIN exams e ON e.id = f.exam_id
WHERE o.question_id = ?;
```

Counting `file_hash` here is the easy mistake and produces a wrong
badge that nobody notices. Computed at export time and baked into the
JSON, since the site is static and can't query anything.

---

## Part 2 — Published content contract

`src/content.config.ts` already defines the `quizzes` collection. The
pipeline writes to `src/content/quizzes/<subject>/<year>/<slug>.json`
and its output must satisfy that Zod schema.

Fields to add — all optional with defaults, so the three existing
quiz files keep validating:

| field           | type                                | default            |
|-----------------|-------------------------------------|--------------------|
| `answerSource`  | `'marked' \| 'inferred' \| 'manual'`| `'manual'`         |
| `repetition`    | number, distinct exams              | `0`                |
| `figure`        | string, path under `public/figures/`| omitted            |
| `sourceExams`   | string[], human-readable labels     | `[]`               |

`correctAnswer ∈ options` is already enforced by the existing
refinement — that's one of the validators below, already shipped.

Figures go to `public/figures/<hash>.png` and are referenced through
`import.meta.env.BASE_URL`, never as a bare `/figures/...` path.

---

## Validators → review queue

Deterministic, free, and actually correlated with errors. Set
`review_status = 'needs_review'` and append to `flags` when:

- `choices` length ≠ 4 (or the subject's standard)
- `correct_answer` matches no entry in `choices`
- `text` ends mid-sentence / no terminal punctuation
- negation present: `NOT`, `EXCEPT` — the highest-error class in MCQ
  extraction
- `has_figure` is true
- two extraction passes disagree

The model's self-reported confidence is **not** a routing signal. It
will report 95 on a hallucinated answer.

## Deduplication order

1. **Exact.** Normalize (collapse whitespace, drop choice lettering
   `A. ` / `a) `, sort choices), hash, compare. Free, zero false
   positives, catches a large share.
2. **Fuzzy.** Embed the remainder, retrieve candidates above ~0.85
   cosine. MCQ stems on one topic share heavy vocabulary, so this
   threshold is a starting guess, not a merge decision.
3. **Adjudicate.** Cheap LLM call on the pair, or straight to review.
   Same stem with *different* answers is the most valuable signal you
   have — one source is wrong. Route it to review; never merge or drop.

## LLM output schema

Enforced via the API's native `response_schema` parameter, not prompt
text.

```json
{
  "questions": [{
    "question_text": "...",
    "choices": ["...", "...", "...", "..."],
    "correct_answer": "...",
    "answer_source": "marked_in_document",
    "has_figure": false
  }]
}
```

Rule stated in the prompt: if the answer is not circled, highlighted,
or otherwise marked on the paper, `answer_source` must be `inferred`.
