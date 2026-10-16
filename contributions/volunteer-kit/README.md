# Volunteer preparation kit

The [contribution page](https://realozk.github.io/CS-Vault/contribute/) also offers
general instructions and a schema-checked example. Its sample course is explicitly
labelled as an example: contributors must use their own course's catalog metadata.
Downloads remain available before the Google Form opens.

Share the course's `.instructions.md` and `.example.json` together with volunteers.
Each pair is generated from the authoritative course catalog and uses valid quiz
metadata. The example question is a placeholder: replace it with source material.
Its date is a **draft**; the publisher sets the actual publication date for new content.

Use your preferred AI tool with these files and the original PDF/photos. Preserve
wording, code and choices; record inferred answers honestly. Put uncertain or
unreadable items in separate reviewer notes. Then use the shared Google Form,
select the course and **Send prepared JSON**, and attach JSON plus original evidence.
No browser checker or preview is required. A reviewer checks format and answers.

For corrections, start from the existing repository JSON instead of a new example.
Keep its filename, original publication date and existing question IDs. Give new
questions new IDs. Every correction gets a separate form submission/queue record.

Maintainers: regenerate these files, the course-choice list, and `Catalog.gs` after
updating `src/data/subjects.json`:

```sh
npm run contribution:kit
```

Before publishing, reviewers can run `npm run check:quiz -- file.json --course subject/2026`
(and `--original existing-file.json` for a correction), followed by `npm run validate`.
