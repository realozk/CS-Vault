# CS-Vault pipeline

Local-only batch extractor. Turns past-exam PDFs and photos from Google
Drive into quiz JSON under `src/content/quizzes/`. Build-time tool, not a
service — the site never calls it and nothing here is imported by `src/`.

See `docs/plan.md` (slice order) and `docs/schema.md` (data model) at the
repo root.

## Setup

```sh
cd pipeline
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then fill in the values
```

## Run

```sh
python -m pipeline.run --limit 20
python -m pipeline.export
```

(Those entry points arrive in later slices.)

## Rules

`.env`, `data/`, `__pycache__/`, and `.venv/` are gitignored. No secrets
in the repo, no inbound endpoint, nothing under `pipeline/` imported by
the site.
