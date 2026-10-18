# Optional local content tool

This Python tool is separate from the website. It currently creates a SQLite
working database and registers PDFs/images placed in `data/inbox/`.
It does not yet extract questions or export quiz JSON.

Python 3.11 or later is sufficient; the current scripts use only the standard
library. No API keys, virtual environment, or pip installation are required.

From this directory:

```sh
python -m pipeline.migrate
python -m pipeline.ingest
```

The database and inbox stay local and are ignored by Git. Ingesting files does
not move or delete them. Repeated imports of the same bytes do not add duplicates.
Moved files refresh stale locations. Supported files can retry earlier skipped or
failed imports; extracted/committed work and exam assignments are preserved.

From the repository root, run `npm run test:pipeline` for the temporary-database
regression checks. Python 3.11 or later is required; no source files or real
working database are changed by the tests.

[Data model and proposed extraction design](docs/schema.md) documents the working
database and future work. The site continues to read Markdown and JSON from
`src/content/`; it never imports this tool or queries its database.
