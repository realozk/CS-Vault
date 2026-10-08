# CS-Vault

A small study site made by students for Computer Science students. Browse course
notes and practice quizzes in an English or Arabic interface. Study material
currently follows the English lecture terminology.

Built with Astro, TypeScript, and Tailwind. Pages are static and hosted on
[GitHub Pages](https://realozk.github.io/CS-Vault/). No backend or accounts are needed.

## Run locally

Use Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

Open `http://localhost:4321/CS-Vault/`.

```sh
npm run build    # Validate content and generate dist/
npm run preview  # Preview the production build
node --experimental-strip-types --test tests/quiz-state.test.mjs
```

## Where things live

| Path | Purpose |
| --- | --- |
| `src/data/subjects.json` | Course catalog and English/Arabic subject names |
| `src/content/summaries/` | Lecture notes in Markdown |
| `src/content/quizzes/` | One lightweight JSON file per quiz |
| `src/content.config.ts` | Content validation rules |
| `src/pages/` | English and Arabic routes |
| `src/components/`, `src/layouts/` | Reusable interface and page layout |
| `src/scripts/` | Search, progress, and quiz behavior |
| `src/i18n/ui.ts` | English/Arabic interface text |
| `src/styles/`, `public/` | Styles and static assets |
| `tests/` | Quiz state tests |
| `pipeline/` | Optional local Python tool; separate from the website |

`astro.config.mjs` sets the GitHub Pages URL/base path, language routing, and
Tailwind integration. `tsconfig.json` enables strict TypeScript checks.
`package-lock.json` pins dependencies for reproducible installations.
`.github/workflows/deploy.yml` builds and deploys pushes to `main`.

Generated folders (`node_modules/`, `dist/`, `.astro/`) and local caches are
ignored by Git. They are created automatically when installing or building.

## Study material

The catalog contains six third-year, first-semester courses. Programming
Languages includes Lecture 1 notes, three generated practice exams, and a
highlighted practice exam transcribed from `languages.pdf`. Operating Systems
includes notes and three practice quizzes for Chapters 1 and 2.

Generated questions are study aids, not official exams or approved answer keys.
Explanations identify inferred answers and reference source slides or PDF pages.
The highlighted exam is a revision priority, not a confirmed exam prediction.

Practice mode gives immediate feedback. Exam mode reveals answers on submission
and supports an optional timer (20 minutes by default, adjustable or disabled).
Questions and choices shuffle between attempts. Results include explanations,
missed questions, and topic totals. Saved mistakes and reading progress stay in
the student's browser; active attempts are not restored after a reload.

For content formats and contribution steps, see [CONTRIBUTING.md](CONTRIBUTING.md).
For the optional local tool, see [pipeline/README.md](pipeline/README.md).
