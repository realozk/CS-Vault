# Foundation implementation record — 18 October 2026

Scope: the `ztest` student-site foundation, following the
[original audit](reviews/2026-10-18-ztest-readiness.md). Form activation and team
onboarding remain the final phase, as requested. These changes are local on
`ztest`; the live `main` deployment has not been changed.

## Implemented

| Area | Result |
| --- | --- |
| Summary progress | Reconciles current storage before edits and refreshes across tabs, language pages and cached Back navigation. Check/uncheck operations survive failed writes during the current visit. |
| Summary navigation | Language switching retains query/fragment and the selected summary. Switching study modes preserves the selected lecture. |
| Summary rendering | Heading IDs and local/accessibility references are scoped per summary, including authored HTML. Content headings sit below the summary title while retaining established styling. The build rejects duplicate IDs. |
| Search | Actual course codes and both English/Arabic course names are indexed for course, summary and quiz results. Code spacing/hyphens are tolerated. |
| Academic years | Populated years determine the initial tab. Selected year is shareable in `?year=`. Names resolve by collection year, and cards distinguish editions when necessary. |
| Content organization | Explicit optional section/order metadata replaces the course-specific filename ordering list. Existing titles/filenames remain supported. New courses and years use shared pages. |
| Combined quizzes | Exact identity includes code, case, meaningful whitespace and fixed choice order. Generated IDs remain stable as new source quizzes are added. Each question retains its actual source filename, original question ID, language and localized origin link. |
| Question review | Disputed source answers remain inspectable and are excluded from practice, exams, saved review and scores. The known tutorial question 22 is withheld pending clarification; its supplied answer and original ID remain intact. |
| Choice ordering | Position-dependent questions preserve original choices. Authors can explicitly set `shuffleOptions: false`; fixed ordering also participates in saved-answer validation. Original PDF letters in tutorial explanations are clearly identified. |
| Saved mistakes | Short review is accessible from quiz setup, prioritizes due questions and caps sessions at five. Failed writes and failed clears keep the correct in-memory state during the visit. |
| Timer | Editing the inactive phase preserves the active timer. State refreshes across pages/tabs, and overdue phases advance from their saved deadlines rather than restarting on wake. |
| Local ingestion | Stale file locations refresh, supported skipped/failed files can retry, and extracted/committed work remains intact. |
| Build dependencies | Astro 7.4.0 with updated compatible dependencies; Node 22.22+ required. Existing Markdown and whitespace behavior is retained explicitly. |
| CI/deployment | Complete validation, isolated expansion build, local-pipeline tests and high/critical dependency auditing occur before artifact upload. Deployment is limited to `main`. |

The framework migration follows the [Astro 7 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v7/).
The lockfile pins installations; CI uses the current Node 22 release from `.nvmrc`.

## Verification

- Node **22.23.3**, matching the deployment major: **75 site tests passed**;
  zero type errors, warnings or hints; **67 pages built**; links, anchors, assets
  and duplicate-ID checks passed.
- The expansion check builds temporary synthetic courses for Years 1, 2 and 4
  alongside existing Year 3, both semesters, and 2026/2027 editions of one course.
  English/Arabic subject, source quiz and aggregate routes, catalog/search names
  and repeated summary headings all passed. The fixtures never enter real content.
- **Seven Python regression tests passed**, using temporary files/databases.
- Dependency audit after the upgrade: **zero advisories**, including development
  dependencies, at verification time.
- Browser verification: desktop, **390 × 844** and **320 × 740** viewports;
  course-code search, direct summary links, language switching, progress after
  Back navigation, combined counts, disputed-content inspection, source filename/
  original-question links, and quiz answers preserved across language routes.
- Final clean Node 22 installation and validation are recorded with the evidence
  below. GitHub-hosted Actions have not been run from this local change.

Evidence: [Node 22 validation](reviews/assets/foundation-node22-validation.txt),
[dependency audit](reviews/assets/foundation-dependency-audit.json),
[Python tests](reviews/assets/foundation-pipeline-tests.txt),
[fixed search](reviews/assets/foundation-search-fixed.png),
[mobile summary](reviews/assets/foundation-mobile-summary.png),
[Arabic quiz provenance](reviews/assets/foundation-quiz-source.png).

## Remaining final phase and operating limits

Form/Drive setup, contributor access, team assignments and the submission pilot
are deferred. The original audit's Apps Script recovery and label-mapping issues,
plus the summary handoff, belong to that final contribution phase; the private
intake system is not declared ready by this foundation work.

Adding another year requires its official catalog entries and reviewed sources,
then `npm run contribution:kit` and `npm run validate`. It does not require new
year-specific components. The optional Python tool still registers sources only;
automatic extraction/export is outside this site's foundation.

Content format validation cannot establish academic correctness. The source
files are still needed for human review. Browser storage can preserve data only
on the same origin/device; failed writes are reported and cannot survive closing
or reloading the page. There is no account-based sync or recovery service.

Saved attempts/scores are intentionally invalidated when their question bank
changes. The aggregate identity correction and exclusion of disputed tutorial
question 22 can reset affected old attempts/review entries or hide stale scores.
Individual source quiz filenames, public URLs, publication dates and question IDs
are preserved.

This foundation supports expansion through content changes. Dependency security
updates, content corrections and occasional compatibility maintenance remain
normal work after launch.
