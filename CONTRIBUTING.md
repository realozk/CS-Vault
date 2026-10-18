# Contributing

Students submit original material, prepared JSON, or corrections through one shared
Google Form. Choose your course in its required dropdown, or “Course missing / Not sure”.
Original exam year is a separate optional field. Submissions enter a private reviewer
queue and are published only after review; students do not need GitHub accounts.
The form is not created yet: maintainers must complete the
[Google Forms-first setup](contributions/google-apps-script/README.md) and set the
public responder URL in `src/data/contribution-config.ts` before opening intake.

Share the same form link in every WhatsApp group. The [contribution page](https://realozk.github.io/CS-Vault/contribute/)
offers a simple choice between sending original material and preparing a quiz, with
downloadable instructions and a valid illustrative JSON example available even while
submissions are closed. Use your own course metadata from the included catalog.
Volunteers can also use the
[AI instructions and valid examples](contributions/volunteer-kit/README.md).
The browser checker and preview are deferred until the manual process has been tested.

To contribute through GitHub, fork the repository,
install dependencies with `npm ci`, and work on a branch.

## Register a course

Add it to `src/data/subjects.json` before adding material:

```json
{
  "slug": "operating-systems",
  "name": "Operating Systems",
  "name_ar": "نظم التشغيل",
  "subject_code": "CS3608",
  "year": 2026,
  "year_level": 3,
  "semester": 1
}
```

Use a URL-safe slug. Content folders and academic metadata must match the catalog.
Courses may be registered before any material is available. The New/جديد badge
automatically follows the newest quiz or summary publication `date` for that
course and stays visible for seven days (168 hours). Date-only values start at
midnight UTC. The badge is checked when the page opens, including when returning
with Back/Forward, so it expires without another deployment. Keep a file's
original publication date when fixing typos; use the actual publication date
when adding new material. No catalog flag is needed.

## Add notes

Create `src/content/summaries/<subject>/<year>/<filename>.md`:

```markdown
---
title: "Lecture 1 — Introduction"
description: "Main concepts from Lecture 1."
author: "Your name"
date: 2026-10-08
subject_code: "CS3608"
year_level: 3
semester: 1
lang: "en"
---

Lecture notes go here.
```

## Add a quiz

Create `src/content/quizzes/<subject>/<year>/<filename>.json`:

```json
{
  "title": "Lecture 1 — Practice",
  "date": "2026-10-16",
  "subject": "Operating Systems",
  "year": 2026,
  "year_level": 3,
  "semester": 1,
  "lang": "en",
  "source": "Lecture1.pdf",
  "sourceKind": "generated",
  "questions": [
    {
      "id": 1,
      "question": "Which component manages hardware resources?",
      "options": ["Operating system", "Text editor", "Browser", "Spreadsheet"],
      "correctAnswer": "Operating system",
      "explanation": "The operating system manages hardware resources.",
      "answerSource": "inferred",
      "sourcePage": 2
    }
  ]
}
```

Keep question IDs unique and choices distinct. `correctAnswer` must exactly match
one choice. Check every answer against the source before submitting.

Optional quiz fields include `description`, `featured` (default false),
`sourceAcademicYear` (a string such as `2023–2024`), `sourceTerm`, and `updatedAt`
(an ISO date). Catalog `year` identifies the course collection, not the source exam year.
`sourceKind` is `instructor` (red: instructor/Blackboard), `provided` (orange:
collected or older material), or `generated` (regular: fully AI-generated).
Classify by the origin of the questions; keep `answerSource` separate to identify
how each answer was determined. Optional question fields include
`code`, `topic`, `sourceSlide`, `sourcePage`, and `optionsSource`
(`provided` or `generated`). Source page/slide numbers start at 1.
`answerSource` is `manual`, `marked`, or `inferred`; AI-inferred answers must use
`inferred`. See `src/lib/quiz-schema.ts` for the complete validation rules.

For a known unresolved source key, keep the existing question ID and original
source answer, set `status: "disputed"`, and provide `reviewNote`. The question
remains available for inspection but is excluded from practice, exam scores and
saved reviews. Only use `status: "reviewed"` after actual source review; legacy
questions need no status field. Do not resolve academic disputes by guessing.

Set a question's `shuffleOptions: false` when its choices depend on their original
order or labels. Common references such as “Both A and B” and “All of the above”
also preserve order automatically. Check less common references explicitly.
Combined question IDs and origin links are generated; do not author `origin` data.

Quizzes and summaries can optionally set `section: { "kind": "lecture", "number": 1 }`
(or `chapter`) and a nonnegative numeric `order` for ordering within that section.
Use `{ "kind": "mixed" }` for mixed material. Existing lecture/chapter titles and
filenames provide fallback grouping; explicit metadata also supports other languages.
Summary heading IDs and local links are automatically scoped to each summary,
so repeated headings across lectures remain safe.

## Check and submit

Use lowercase hyphenated filenames, without paths; `all-questions` is reserved.
For corrections preserve filename, public URL, publication `date`, and existing question IDs.
Use new IDs for genuinely new questions. Set `updatedAt` separately; it does not restart
any New badge. For new quizzes the starter date is a draft: the publisher sets the
actual date only when publishing.

Run `npm run validate` to check types, tests, content, build and links. A single
quiz can also be checked with `npm run check:quiz -- file.json --course subject/2026`
(and `--original existing-file.json` for corrections). For quiz behavior
changes, also run:

```sh
node --experimental-strip-types --test tests/quiz-state.test.mjs
```

Check the affected pages in both English and Arabic, including mobile layout.
Open a pull request with a short description of the material or correction.
