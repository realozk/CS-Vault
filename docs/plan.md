# Build plan

One slice per session. Commit between slices. Clear context between
slices — stale pipeline context actively degrades a frontend session.

Slices 1–3 are the spike. **Do not build 4+ until the spike has been
graded by hand.** If Arabic handwriting extraction fails, everything
downstream changes.

---

## [x] Slice 0 — Scaffold

`pipeline/` at repo root: `pyproject.toml` or `requirements.txt`,
`.env.example`, `data/` (gitignored), package layout. Add to
`.gitignore`: `pipeline/.env`, `pipeline/data/`, `pipeline/__pycache__/`,
`pipeline/.venv/`.

No `.ts` files under `pipeline/` — `tsconfig.json` globs `**/*` and
they'd fall under strict typecheck.

## [x] Slice 1 — SQLite schema

Every table in `docs/schema.md` Part 1, with the unique constraints.
A `migrate.py` that's idempotent. Nothing else — no fetching, no AI.

Done when: the DB creates clean and the repetition-count query runs
against empty tables.

## [x] Slice 2 — Local inbox ingest

Walk `pipeline/data/inbox/` recursively — files are curated there by
hand, there is no Drive fetch — SHA-256 each file, insert `files` rows.
Triage by extension: `.pdf` and image types get `status='downloaded'`;
anything else gets `'skipped'` with the reason in `error`. Nothing is
moved or deleted. Inserts are `ON CONFLICT(file_hash) DO NOTHING`, so a
second run inserts nothing new. No AI yet.

Done when: the inbox files land in the table and a second run inserts
nothing.

## [ ] Slice 3 — Rasterize + extract raw

PyMuPDF → 200 DPI PNG per page, over the `status='downloaded'` files
from the inbox. Async Gemini calls with a semaphore (~10–20). Content is
English, so the vision prompt targets English MCQs (no Arabic handling).
Write the verbatim response to `extractions`. Do not parse. Set
`status='extracted'`.

Done when: raw JSON exists for every page of every downloaded file.

### ⇢ SPIKE GRADING — manual, before slice 4

Read the raw output yourself against the original scans. Record three
separate rates, not one blended number:

- **text fidelity** — is the question text correct, including "NOT"?
- **choice completeness** — all options captured, none merged or lost?
- **answer correctness** — and was `answer_source` honest about it?

A question with perfect text and a wrong answer isn't 75% right; it's
harmful. 90% across 4,000 questions still puts 400 wrong items in
front of students.

Iterate on the prompt (bump `prompt_version`, re-parse from
`extractions` rather than re-calling where possible). Record here:

```
prompt v_  |  text __%  choices __%  answers __%   (n=___)
```

---

## [ ] Slice 4 — Parse, validate, commit

Parse `extractions` → `questions` + `occurrences`. Run every validator
from `docs/schema.md`, set `review_status` and `flags`. Compute
`norm_hash`. Crop figures, write to `pipeline/data/figures/`, set
`figure_path`. Set `status='committed'`.

Idempotent: re-running over the same extractions must not create
duplicate occurrence rows.

## [ ] Slice 5 — Deduplication

Exact `norm_hash` pass first. Then embeddings + retrieval on the
remainder. Write pairs to `duplicate_candidates` with
`verdict='pending'`. **No auto-merge.**

## [ ] Slice 6 — Local review tool

Runs on your machine only, never deployed. Minimal local web UI
(FastAPI + plain HTML is enough) because you need the page image side
by side with the extracted text.

- review queue: `needs_review`, showing which flags tripped
- duplicate adjudication: merge / keep separate
- exam assignment: bulk-assign files where `exam_id IS NULL`
- approve / reject → sets `review_status`

This is a triage station, not a data-entry form. Manual entry is the
least important feature; build it last if at all.

## [ ] Slice 7 — Export to content collections

`python -m pipeline.export` writes
`src/content/quizzes/<subject>/<year>/<slug>.json`.

- only `review_status='approved'` (and `auto_ok`, once you trust it)
- compute `repetition` from distinct exams, bake it into the JSON
- copy figures to `public/figures/`
- emit both `lang: en` and `lang: ar` files where available
- **must validate against the existing Zod schema** — run
  `npm run build` as the check

Export is deterministic: same DB state produces byte-identical JSON.
That makes the git diff reviewable.

## [ ] Slice 8 — Site updates

Extend `src/content.config.ts` per `docs/schema.md` Part 2, keeping
the three existing quiz files valid (new fields optional + defaults).
Then in `QuizWidget.astro`:

- "Highly Repeated" badge where `repetition > 3`
- mandatory warning wherever `answerSource === 'inferred'` — AI
  suggested this, it wasn't marked on the paper, verify it
- render `figure` through `import.meta.env.BASE_URL`
- add the new strings to `src/i18n/ui.ts` for both `en` and `ar`

---

## Session prompt template

```
Read CLAUDE.md and docs/schema.md.
We're on slice N. Everything before it is done; nothing after
it exists yet.
Plan mode first — show me the approach before writing code.
```

## Open decisions

- [ ] Exact Gemini model + pricing — check the current lineup, tiers moved
- [ ] Embedding model — verify retrieval quality before committing
      (content is English-only)
- [ ] Standard choice count per subject (a validator depends on it)
- [ ] Figure questions: exported, or held for manual handling?
- [ ] Subject slugs — pipeline output must match the site's existing
      `cs101` / `ds101` naming, not invent new ones
- [ ] Academic clearance. The site is already world-readable on GitHub
      Pages, so this is live now rather than at launch. Write down who
      confirmed it and when — or write it down as your inference. Same
      rule you're applying to answers.
