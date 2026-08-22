"""Ingest curated source files from the local inbox.

    python -m pipeline.ingest

Walks pipeline/data/inbox/ recursively, SHA-256s each file, and inserts a
files row. Files are curated here by hand — there is no Drive fetch. PDFs
and images get status 'downloaded'; anything else is 'skipped' with the
reason in error. Nothing is ever moved or deleted.

Re-running inserts nothing new: file_hash is the primary key and inserts
use ON CONFLICT DO NOTHING, so identical bytes (even under two filenames)
collapse to one row.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

from pipeline.db import DB_PATH, connect

INBOX_DIR = DB_PATH.parent / "inbox"

# Extensions that go to the vision model. Everything else is skipped.
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff",
              ".bmp", ".gif", ".heic", ".heif"}
SUPPORTED_EXTS = {".pdf"} | IMAGE_EXTS

_CHUNK = 1 << 20  # 1 MiB


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(_CHUNK), b""):
            h.update(chunk)
    return h.hexdigest()


def ingest() -> None:
    INBOX_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(p for p in INBOX_DIR.rglob("*") if p.is_file())
    if not files:
        print(f"inbox empty: {INBOX_DIR}")
        print("  drop curated PDFs/images there, then re-run.")
        return

    conn = connect()
    inserted = existing = 0
    by_status: dict[str, int] = {}
    try:
        for path in files:
            ext = path.suffix.lower()
            if ext in SUPPORTED_EXTS:
                status, error = "downloaded", None
            else:
                status, error = "skipped", f"unsupported extension: {ext or '(none)'}"

            cur = conn.execute(
                """
                INSERT INTO files
                    (file_hash, filename, source, source_ref, local_path, status, error)
                VALUES (?, ?, 'inbox', ?, ?, ?, ?)
                ON CONFLICT (file_hash) DO NOTHING
                """,
                (
                    sha256(path),
                    path.name,
                    str(path.relative_to(INBOX_DIR).as_posix()),
                    str(path),
                    status,
                    error,
                ),
            )
            if cur.rowcount:
                inserted += 1
                by_status[status] = by_status.get(status, 0) + 1
            else:
                existing += 1
        conn.commit()
    finally:
        conn.close()

    print(f"scanned {len(files)} file(s) in {INBOX_DIR}")
    print(f"  inserted {inserted}, already present {existing}")
    for status, n in sorted(by_status.items()):
        print(f"    {status}: {n}")


if __name__ == "__main__":
    ingest()
