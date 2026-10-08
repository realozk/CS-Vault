# Contributing

You can add lecture notes, practice quizzes, or corrections. Fork the repository,
install dependencies with `npm ci`, and work on a branch.

## Register a course

Add it to `src/data/subjects.json` before adding material:

```json
{
  "slug": "operating-systems",
  "name": "Operating Systems",
  "name_ar": "نظم التشغيل",
  "year": 2026,
  "year_level": 3,
  "semester": 1
}
```

Use a URL-safe slug. Content folders and academic metadata must match the catalog.
Courses may be registered before any material is available.

## Add notes

Create `src/content/summaries/<subject>/<year>/<filename>.md`:

```markdown
---
title: "Lecture 1 — Introduction"
description: "Main concepts from Lecture 1."
author: "Your name"
date: 2026-10-08
subject_code: "OS"
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

Optional quiz fields include `description` and `featured` (default false).
`sourceKind` is `generated` or `provided`. Optional question fields include
`code`, `topic`, `sourceSlide`, `sourcePage`, and `optionsSource`
(`provided` or `generated`). Source page/slide numbers start at 1.
`answerSource` is `manual`, `marked`, or `inferred`; AI-inferred answers must use
`inferred`. See `src/content.config.ts` for the complete validation rules.

## Check and submit

Run `npm run build` to validate content and generate the site. For quiz behavior
changes, also run:

```sh
node --experimental-strip-types --test tests/quiz-state.test.mjs
```

Check the affected pages in both English and Arabic, including mobile layout.
Open a pull request with a short description of the material or correction.
