# Year 3 volunteer team — proposed charter and first backlog

Snapshot: 18 October 2026. Scope: the six registered Year 3, Semester 1 courses in collection `2026`.
This is an onboarding plan. No volunteers have been recruited or assigned, no live queue has been created by this document, and no persistent AI helpers have been started.
Years 1, 2 and 4 are deferred until their official course lists and source files are supplied.

## Current inventory

Counts cover committed source files, excluding generated **All Questions** quizzes.

| Code | Course | Collection key | Summaries | Source quizzes | Questions | Course owner |
| --- | --- | --- | ---: | ---: | ---: | --- |
| CS2107 | Algorithm Analysis | `algorithm-analysis/2026` | 5 | 5 | 125 | Unassigned |
| CEN3011 | Computer Networks | `computer-networks/2026` | 0 | 0 | 0 | Unassigned |
| CS3809 | Engineering Software Products | `engineering-software-products/2026` | 0 | 0 | 0 | Unassigned |
| CS3608 | Operating Systems | `operating-systems/2026` | 2 | 3 | 60 | Unassigned |
| CS3713 | Programming Languages | `programming-languages/2026` | 1 | 5 | 109 | Unassigned |
| CS3810 | Web Development | `web-development/2026` | 4 | 8 | 160 | Unassigned |
| **Total** | **6 courses** | | **12** | **21** | **454** | |

Lecture PDFs, original exam files and instructor slides referenced by this content are absent from the repository.
The included font-license PDF and decorative images are not course evidence.
Existing explanations and page references help review, but do not establish that answers have been independently checked.
Computer Networks and Engineering Software Products are registered placeholders; their teaching scope is still needed.

## Proposed responsibilities

| Role | Assignment | Responsibility |
| --- | --- | --- |
| Year coordinator | Unassigned | Confirm volunteers, course ownership and weekly priorities; resolve unclaimed work. |
| Course owners | Unassigned; one per course above | Obtain the current syllabus, lecture list and source evidence; define each task's scope. |
| Source steward | Unassigned | Maintain restricted source access and stable evidence links; record edition, term and pages. |
| Summary author | Unassigned per task | Draft a source-grounded Markdown summary with examples and explicit scope. |
| Quiz author | Unassigned per task | Prepare JSON, preserve source wording and identities, and record answer provenance. |
| Independent human reviewer | Unassigned per task | Check every statement and answer against evidence; record corrections and sign-off. |
| Publisher | Unassigned | Validate, review the change, set publication metadata, publish and record the public URL. |

An author may cover both preparation roles. The reviewer must be a different person from the author.
AI assistance follows [the AI helper workflow](ai-workflow.md); an AI check cannot replace human approval.
Assignments become real only when a volunteer accepts a named task in the private queue.

## First pilot and backlog

Start with **Operating Systems, Chapter 1**: one existing summary and its 20-question practice quiz.
The small, already paired scope makes source comparison and a correction trial concrete.
This choice does not imply that the current material is verified.

| ID | Proposed task | Responsible role | Starting condition / completion evidence |
| --- | --- | --- | --- |
| Y3-01 | Confirm coordinator, publisher and one OS author/reviewer pair. | Year coordinator | All unassigned; record each volunteer's acceptance privately. |
| Y3-02 | Obtain `Chapter1_And_2 (1).pdf` and the current OS scope. | OS course owner / source steward | Needs information; reviewer can open the retained source and identify the chapter pages. |
| Y3-03 | Prepare the shared Form and private manual queue using the existing setup guide. | Coordinator / publisher | Public responder URL is currently empty; test file access and record course/team routing. |
| Y3-04 | Audit `chapter-01.md` and all 20 `chapter-01-practice.json` questions against the source. | OS author + independent reviewer | Needs Y3-02; supply a question-by-question review log and tracked corrections. |
| Y3-05 | Pilot receipt, preparation, review, publication and one correction. | Publisher | Needs Y3-01–04; retain validation output, reviewer sign-off and published URLs. |
| Y3-06 | Collect current syllabi and missing teaching sources for all six courses. | Course owners | Produce a lecture coverage list; prioritize Networks and Software Products without inventing content. |
| Y3-07 | Extend reviewed coverage one lecture at a time after the OS pilot. | Coordinator / course owners | Confirm the next bounded source packet, accepted owners and reviewer before drafting. |

No new course material should be generated merely to fill an empty card.
Use new collection content only after confirming the actual course scope and evidence.

## Intake, routing and publication

Follow the [Google Forms and reviewer queue guide](../google-apps-script/README.md).
The website's responder URL is blank, so public intake is not open yet.
Configure and test the shared form before distributing its link; keep contacts and original files private.

1. Record a stable submission ID, course key, source link, title, type and scope in the private queue.
2. Route recognized Year 3 courses to `Year 3 team` using the existing `year:3` routing row, unless a course-specific team is configured.
3. A named reviewer claims the work; missing or uncertain courses stay in General triage.
4. Use **Received → Preparing → Reviewing → Ready → Publishing → Published**. Prepared JSON can skip Preparing, never Reviewing.
5. Use **Needs information**, **Duplicate** or **Declined** where appropriate; record why and the next action.
6. Record reviewer identity, evidence, new-file/update decision, PR URL and published URL before closing the task.

Begin with manual routing and a complete pilot. Enable the optional intake trigger only after the manual process works.
Neither queue status nor a successful format check is evidence that an answer is correct.

## Material format and identity

Use `src/content/summaries/<slug>/2026/<filename>.md` for summaries and
`src/content/quizzes/<slug>/2026/<filename>.json` for source quizzes.
For the pilot these are `src/content/summaries/operating-systems/2026/chapter-01.md` and
`src/content/quizzes/operating-systems/2026/chapter-01-practice.json`.
Use lowercase hyphenated filenames; `all-questions` is reserved for automatic aggregation.

Summary frontmatter must satisfy [`src/content.config.ts`](../../src/content.config.ts):

```yaml
---
title: "Chapter 1 — Introduction"
description: "Scope and key concepts verified against the supplied chapter."
author: "Accepted volunteer's display name"
date: 2026-10-18
subject_code: "CS3608"
year_level: 3
semester: 1
lang: "en"
source: "Chapter1_And_2 (1).pdf, verified chapter pages"
---
```

This is a format example, not a prepared publication. Replace its title, source pages, author and date with reviewed values.
Write the substantive summary below the frontmatter; preserve source language and label any added examples.
Optional frontmatter includes `sourceAcademicYear`, `sourceTerm` and `updatedAt`.
Use [CONTRIBUTING.md](../../CONTRIBUTING.md) and the [volunteer kits](../volunteer-kit/README.md) for quiz JSON and source labels.

`year: 2026` identifies the **collection/folder**; `year_level: 3` identifies the **study year**.
`sourceAcademicYear` preserves the original source's edition, such as `2023–2024`; do not substitute it for the collection year.
Record source term/year only when known. On corrections preserve filename, publication date and existing question IDs; use `updatedAt` separately.

## Ready criteria for each pilot item

- The course owner confirms the current lecture scope; the retained source is readable and accessible to the reviewer.
- Every summary claim and quiz answer has evidence by filename and page/slide; added practice is clearly identified.
- A different human checks wording, code, formulas, distractors and answers. Marked, inferred and manually verified answers are labeled honestly.
- New drafts keep unreadable, unsupported or disputed questions in reviewer notes until resolved. An unresolved existing question blocks a correction's publication; preserve its ID because the correction checker rejects removals.
- Summary and quiz metadata match the catalog; question IDs are unique, and `correctAnswer` exactly matches one distinct option.
- The publisher runs `npm run check:quiz -- <file.json> --course operating-systems/2026`; add `--original <existing-file.json>` for a correction.
- The publisher runs `npm run validate` and checks affected English/Arabic pages on mobile, including summary anchors, code and quiz grading.
- The queue contains named human sign-off and the publication record. Original sources, reviewer contacts and private queue data stay out of the public repository.
