# CS Vaulte

CS Vaulte is a static, serverless educational repository for Computer Science university courses. It hosts student-focused subject summaries and interactive self-assessment practice quizzes.

## Key Features

- **Static Site Generation:** Pre-rendered HTML paths built at compilation time using Astro.
- **Client-Side Island Architecture:** Framework-free client components yielding zero client-side JavaScript framework overhead.
- **Content Collections Data Layer:** Type-safe structured content validated via Zod schemas at build time.
- **Minimalist Theme Support:** Responsive, clean dark and light UI theme system.

---

## Project Structure

Inside the repository, files are organized as follows:

```text
/
├── public/                 # Static assets (favicons, manifests)
├── src/
│   ├── content/            # Git-based content collections (JSON/Markdown)
│   │   ├── summaries/      # Subject markdown summary documents (e.g., cs101/2026/db-basics.md)
│   │   └── quizzes/        # Subject quiz data files (e.g., cs101/2026/db-quiz.json)
│   ├── components/         # Reusable UI widgets (e.g., QuizWidget.astro)
│   ├── layouts/            # Global page shell wrappers (e.g., Layout.astro)
│   ├── pages/              # Routing modules (Home, course dashboards, quiz routes)
│   └── styles/             # Global Tailwind stylesheets
├── package.json            # Project dependencies and script declarations
├── tsconfig.json           # TypeScript configuration settings
└── astro.config.mjs        # Astro engine configurations
```

---

## Adding Course Content

### Course catalog

Register courses in `src/data/subjects.json`. Each entry has a URL-safe
`slug`, display `name`, calendar `year`, academic `year_level` (1–4), and
`semester` (1–2). Courses appear in the directory and get dashboards even
before material is uploaded. Content folders must match the slug/year,
and content year-level/semester metadata must match the catalog.

The current catalog contains the six third-year, first-semester courses
for 2026. Programming Languages has a Lecture 1 revision guide and three
20-question practice exams, plus a highlighted 20-question Lecture 1 exam
transcribed from `languages.pdf`. The remaining courses await study material.
Practice questions are generated study aids based on the supplied lecture,
not official past exams or an instructor-approved answer key. The PDF exam
uses visible answer markings; duplicate questions and topics beyond Lecture 1
are omitted. Its likely-exam highlight is a revision priority, not a verified
prediction. Three missing choice sets and explanations were added for practice.

Keep one JSON file per exam: the static site embeds only that exam's
questions on its quiz page. The home search index contains metadata,
not the full question bank. No backend or additional frontend framework
is required.

Data is entirely file-based and loaded dynamically through Astro Content Collections:

### 1. Subject Summaries
Summaries are written in Markdown and located under `src/content/summaries/[subject]/[year]/[filename].md`. Each file must declare frontmatter metadata:

```markdown
---
title: "Introduction to Relational Databases"
description: "A comprehensive summary covering database concepts and Entity-Relationship models."
author: "Author Name"
date: 2026-06-21
subject_code: "CS101"
year_level: 3
semester: 1
lang: "en"
---

# Introduction to Relational Databases
Content markdown goes here...
```

### 2. Practice Quizzes
Quizzes are structured JSON documents located under `src/content/quizzes/[subject]/[year]/[filename].json`. The schema enforces strict validation:

```json
{
  "title": "Relational Databases Fundamentals",
  "subject": "Introduction to Databases",
  "year": 2026,
  "year_level": 3,
  "semester": 1,
  "lang": "en",
  "questions": [
    {
      "id": 1,
      "question": "Which of the following uniquely identifies a row in a relational database table?",
      "code": "Optional raw code snippet block if required",
      "options": [
        "Foreign Key",
        "Primary Key",
        "Index Key",
        "Super Key"
      ],
      "correctAnswer": "Primary Key",
      "explanation": "A Primary Key is a minimal set of attributes that uniquely specifies a tuple in a relation."
    }
  ]
}
```

Optional quiz fields: `description` (scope/instructions), `source` (source
document name), `sourceKind` (`generated` or `provided`), and `featured`
(default false; highlighted and listed first on subject pages). Optional
question fields: `sourcePage` (one-based PDF page), `optionsSource`
(`provided` or `generated`), `sourceSlide` (one-based source
slide number), `answerSource` (`manual`, `marked`, or `inferred`; default
`manual`). Answers inferred by AI must use `inferred`; the widget shows
a verification warning with the explanation. Options must be distinct,
question IDs must be unique, and quizzes must not be empty.

The Arabic route translates the interface; the current study material
is English, matching the lecture and exam terminology.

---

## Development Commands

All commands should be executed from the root directory:

| Command | Action |
| :--- | :--- |
| `npm install` | Install project dependencies |
| `npm run dev` | Start the local development server at `localhost:4321` |
| `npm run build` | Build the optimized production bundle to the `./dist/` directory |
| `npm run preview` | Run a local preview server on the production build output |

## Quiz modes and student review

Practice mode gives immediate feedback with no timer. Exam mode allows
previous/next navigation and answer changes, hides feedback until submission,
and optionally uses a configurable 1–180 minute timer (20 minutes by default).
Unanswered questions count as incorrect; an expired timer submits current answers.
The timer uses an absolute deadline, including time spent in a background tab.

Results show missed/unanswered questions with explanations, provenance and
source slides, plus per-topic totals. Questions may have an optional `topic`
string; questions without one use the General category. The current Lecture 1
questions use `reasons-domains`, `evaluation`, `architecture-paradigms`,
`design-tradeoffs`, and `implementation-tools`. New topic strings work without
additional code; translated display labels can be added to `src/i18n/ui.ts`.

Saved mistakes and due dates use localStorage, keyed by the content entry ID
(shared between interface languages). No accounts, network requests, or new
runtime dependencies are involved. Short revision selects up to five questions
from the current exam, prioritizing the earliest review dates. Correct scheduled
reviews move from tomorrow to three days later, then seven days later; the third
scheduled success removes the question. A mistake resets the schedule. Early
practice does not advance it. Invalid/obsolete saved entries are ignored, and
changed question text, code, choices or answers invalidate saved reviews.

Storage failures leave the current session usable. Active attempts are not
restored after a page reload; only submitted review data is saved. The timer is
for self-assessment, not proctoring. The 20-minute default is not an official
midterm duration.

Run focused state tests with Node >=22.12:

```sh
node --experimental-strip-types --test tests/quiz-state.test.mjs
```
