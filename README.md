# CS-Vault

A small study site made by students for Computer Science students. Browse course
notes and practice quizzes in an English or Arabic interface. Study material
currently follows the English lecture terminology.

Built with Astro Pages are static and hosted on
[GitHub Pages](https://realozk.github.io/CS-Vault/).

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

Generated questions are study aids, not official exams or approved answer keys.
Explanations identify inferred answers and reference source slides or PDF pages.
Quiz labels identify the source in both languages: red for instructor material,
orange for collected/older questions, and regular styling for AI-generated
practice. Source categories do not predict what will appear in an exam.


For content formats and contribution steps, see [CONTRIBUTING.md](CONTRIBUTING.md).
For the optional local tool, see [pipeline/README.md](pipeline/README.md).
