# CS-Vault

Static study site for Umm Al-Qura CS students: Markdown summaries and
interactive quizzes, English + Arabic.

Two halves, one repo:
- `src/` — Astro static site, already built, deployed to GitHub Pages
- `pipeline/` — Python batch extractor, **runs locally only**, new

The pipeline turns past-exam PDFs and photos from Google Drive into
quiz JSON that lands in `src/content/quizzes/`. It is a build-time
tool, not a service. The site never calls it and has no runtime.

Progress and slice order: `docs/plan.md`. Data model: `docs/schema.md`.

## Stack

- Astro ^6.4.7, static output, no adapter. TypeScript strict.
- Tailwind v4 via `@tailwindcss/vite`. Dark mode classes in use.
- npm, `"type": "module"`, Node >= 22.12.0.
- Content: Astro Content Collections + Zod (`src/content.config.ts`),
  collections `summaries` (md) and `quizzes` (json).
- i18n: `en` default unprefixed, `ar` prefixed. Strings in `src/i18n/ui.ts`.
- Deploy: GitHub Actions → GitHub Pages. `base: '/CS-Vault/'`.
- Pipeline: Python 3.11, asyncio, PyMuPDF, google-api-python-client,
  SQLite (stdlib). Gemini vision with native `response_schema`.

## Commands

- `npm run dev` / `npm run build` / `npm run preview`
- No lint or test script defined.
- `cd pipeline && python -m pipeline.run --limit 20`
- `cd pipeline && python -m pipeline.export`

## Hard rules — do not violate these

1. **Rasterize, never text-extract.** Past-exam scans are photos and
   image-only PDFs with no reliable text layer; text extraction yields
   garbage or nothing at all. PyMuPDF renders pages to 200 DPI PNG; the
   image goes to the vision model.
2. **Count exams, not files.** Repetition = distinct `exams.id`, via
   occurrences → files → exams. Counting files inflates it and makes
   the "Highly Repeated" badge lie.
3. **Never auto-merge duplicates.** Embeddings retrieve candidates
   only; suspected pairs go to the local review queue.
4. **Never render an answer without its `answer_source`.** If
   `inferred`, the warning label is mandatory.
5. **Never trust the model's self-reported confidence.** Review
   routing uses the deterministic validators in `docs/schema.md`.
6. **Only approved questions get exported.** `needs_review` and
   `rejected` never reach `src/content/`.
7. **The pipeline stays local.** No secrets in the repo, nothing
   under `pipeline/` imported by the site, no inbound endpoint.
   `pipeline/.env` and `pipeline/data/` are gitignored.
8. **Content collections stay the source of truth for the site.** The
   pipeline's output is JSON files, not a database the site queries.
9. **Recreating the DB is only safe while `extractions` is empty.**
   Once slice 3 has run, that table holds paid-for model output. Schema
   changes after that use `ALTER TABLE`, never a drop-and-recreate.

## Astro specifics that bite

- Env prefix is `PUBLIC_`, not `NEXT_PUBLIC_`. This is not Next.js.
- Any asset URL must go through `import.meta.env.BASE_URL` — the site
  is served under `/CS-Vault/`, so hardcoded `/figures/x.png` 404s.
- Changing the Zod schema in `src/content.config.ts` must keep the
  three existing quiz files valid. New fields are optional with
  defaults.
- `tsconfig.json` has `"include": ["**/*"]`. Don't add `.ts` files
  under `pipeline/` — they'd fall under strict typecheck.

## Working style

- One slice per session (see `docs/plan.md`). Commit between slices.
- Plan mode first; I read the approach before you write code.
- Don't scaffold ahead — no stubs for slices we haven't reached.
- Update the checkboxes in `docs/plan.md` when a slice lands.
