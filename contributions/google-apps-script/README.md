# Google Forms-first contributions

**WhatsApp → Google Form → private reviewer queue → approved JSON → GitHub Pages**

Use one form directly. Pin the same responder link in every year's WhatsApp group.
The website only links to that form. The browser checker and preview are deferred
until a manual pilot identifies the preparation errors worth addressing.

This repository contains setup scripts and shareable files, not live Google resources.
Use the Google account that will own the form/uploads. Keep the queue and source
folders restricted. Students do not need GitHub accounts.

## Create the form and private queue

1. Run `npm run contribution:kit`. This copies the course catalog into `Catalog.gs`,
   `contributions/course-catalog.json`, and `contributions/course-choices.txt`, and
   produces one AI instruction/example pair per course in `contributions/volunteer-kit`.
2. Create a standalone [Apps Script project](https://script.google.com/). Add both
   `Code.gs` and the generated `Catalog.gs`, then run `setupContributionSystem` under
   the intended owner. It creates an unpublished form, linked response workbook,
   separate Queue/Courses/Routing/Guide/Errors tabs and a restricted prepared-JSON folder.
   Resource IDs are saved in Script Properties. Recover partial setup from those IDs
   rather than rerunning setup and creating duplicates.
3. The form starts with one required **Course** dropdown populated from the catalog:

   ```text
   CS3608 — Operating Systems — Year 3
   CS3713 — Programming Languages — Year 3
   …
   Course missing / Not sure
   ```

   Multiple editions of a course receive an extra collection-year label to avoid
   ambiguous choices. Original academic/exam year is a separate optional field.
   Only Year 3 courses currently exist in the catalog; register other courses with
   verified academic placement before inviting their groups.
4. Keep the three submission branches. Add upload questions manually at the marked
   placeholders, then remove the placeholder headers:

   | Path | Fields and upload configuration |
   | --- | --- |
   | Send original material | Course/title, optional original exam year, PDF/photos (up to 5 × 10 MB) or source link, description/notes |
   | Send prepared JSON | Course/title, required unrestricted JSON upload (1 file), original source upload/link, optional review notes |
   | Correct/update existing material | Required existing quiz URL, question number/text, explanation/evidence, optional replacement JSON/source |

   Google uploads require sign-in and are stored in the form owner's Drive. Keep the
   form out of Shared Drives. JSON uploads must allow **any file type**; reviewers
   check the actual file. For originals and evidence, verify that at least an upload
   or source link was supplied; cross-field “either/or” is a reviewer check.
5. Run `listFormItems`, then update Script Property `ITEM_IDS.uploads` with numeric
   IDs of every added upload question. Preserve the other IDs. These are intake item
   IDs; public prefill entry IDs are unnecessary in this workflow.
6. Keep repeated submissions allowed, response editing disabled and public response
   summaries disabled. Verify each branch submits directly without entering another.
   Choose responder access suitable for students. Share the workbook, upload folders
   and prepared-output folder with reviewers, while restricting form editing to
   maintainers. Test that reviewers can open newly uploaded files and unrelated
   accounts cannot open the queue/files.
7. Fill the private Routing tab: `year:1` … `year:4` map to year teams; optional course
   keys override year routing. Reviewers claim work in `assigned_reviewer`. Missing,
   unrecognized or ambiguous courses go to a general coordinator (`General triage`).
8. Run `printPublicConfig` and copy its single `responderUrl` into
   `src/data/contribution-config.ts`. Publish/open the form, validate/deploy the site,
   and pin **that same form URL** in every WhatsApp group. Website links go directly
   to it; until configured, the old contribution route shows an availability notice.
   Never commit workbook/folder IDs, responses, contacts or credentials.

Google documents [dropdown items](https://developers.google.com/apps-script/reference/forms/list-item),
[manually added upload questions](https://developers.google.com/apps-script/samples/automations/upload-files),
and [stable response IDs](https://developers.google.com/apps-script/reference/forms/form-response).

## Start with manual queue work

Keep the original form response tab unchanged. Use ordinary physical Queue rows:

| Requested field | Queue column |
| --- | --- |
| Submission ID | `submission_id` |
| Course | `course_key`, with original choice in `course_entered` |
| Assigned year team | `assigned_team` |
| Assigned reviewer | `assigned_reviewer` |
| Status | `status` |
| Source files | `source_links` |
| Prepared JSON | `prepared_json_link` |
| Review notes | `notes` |
| Existing quiz URL | `existing_quiz_url` |
| Published URL | `published_url` |

Additional columns preserve response identity, source year, reviewer, PR URL and
publication time. Use a coordinator-generated UUID for manual submission IDs, such
as `MANUAL-<UUID>`; never derive permanent identity from row numbers. Record the
Form response ID where available. Before enabling reconciliation, match manual rows
to their response IDs so they will not be imported again.

The course determines the team; an available reviewer then claims the row. Use:

**Received → Preparing → Reviewing → Ready → Publishing → Published**

Prepared JSON can skip Preparing but must pass Reviewing. Side states are
Needs information, Duplicate and Declined. Create filtered views for each year team,
unassigned work and Ready items. These views organize work: anyone with spreadsheet
access can still see other rows. Sort whole physical rows; never attach editable
statuses to dynamic FILTER/QUERY results.

A Ready item requires a recognized course, available original source, valid JSON,
checked answers, honest uncertainty, a named checker and a new-file/update decision.
Share the course's AI instructions and valid JSON example with volunteers. Reviewers
can check files using `npm run check:quiz -- file.json --course subject/2026`.

Pilot one course with a PDF/photo, prepared JSON, correction, duplicate and missing
course. Test repeated submissions, phones, reviewer file permissions and both
website languages. Do not enable intake automation until this process works.

## Add routing automation later

After the manual pilot, run `installIntakeTrigger`. Setup does **not** install it.
The installable Form-submit trigger reads stored item IDs, obtains the stable response
ID, locks duplicate-check/row creation, resolves the course and routes to its team.
It appends physical rows with literal text and does not overwrite reviewer edits.
Unknown courses remain in General triage. Errors are recorded without response bodies.

Run `reconcileMissingSubmissions` after trigger failures; it imports only missing
response IDs and can be safely rerun after its time budget. Standalone projects run
commands in the editor; Form-bound projects also have a CS Vault menu.

When courses change, usually once per semester: update `src/data/subjects.json`, run
`npm run contribution:kit`, update the private Courses snapshot from the JSON export
(or run `refreshCourses` after the public catalog export is deployed), then run
`syncCourseDropdown`. Review choices before sharing. A refresh failure retains the
last valid snapshot; dropdown updates are a separate explicit step. Do not delete
old course mappings while they still have submissions to resolve.

Installable triggers run under their creator. During handover, the successor must
recreate and authorize the trigger; see [Google's trigger guide](https://developers.google.com/apps-script/guides/triggers/installable).
Keep the manual import procedure available.

## Corrections, publication and storage

- Typo, explanation or corrected answer: update the existing file and keep its URL,
  original publication `date` and existing question IDs. New questions get new IDs;
  optional `updatedAt` records an update separately. Use `--original existing-file.json`
  with the local quiz-check command for correction checks.
- A different exam normally becomes a new quiz. Duplicate submissions link to the
  original item. Substantial revisions require a recorded replacement-versus-new-quiz
  decision. Every correction receives its own submission ID even when its target is
  the same existing quiz.
- Store approved JSON at `src/content/quizzes/<subject>/<catalog-year>/<filename>.json`.
  Use lowercase hyphenated filenames; reserve `all-questions`. Publisher sets the
  actual publication date for new content, opens a PR, waits for validation, merges,
  confirms deployment and opens the final URL before marking Published. A failed
  deployment stays Publishing with notes. Require the `validate` check through
  GitHub branch protection settings.
- Keep original PDFs/photos in restricted Google Drive folders. Publish only reviewed
  JSON and lightweight notes through GitHub Pages. Source files usually consume far
  more storage than JSON. Monitor Drive usage each semester and remove confirmed
  duplicates only after checking the retained archive is complete. Keep queue/source
  backups and test ownership handover before maintainers leave.
