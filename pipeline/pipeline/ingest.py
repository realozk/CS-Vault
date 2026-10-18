"""Ingest curated source files from the local inbox.

    python -m pipeline.ingest

Walks pipeline/data/inbox/ recursively, SHA-256s each file, and inserts a
files row. Files are curated here by hand — there is no Drive fetch. PDFs
and images get status 'downloaded'; anything else is 'skipped' with the
reason in error. Nothing is ever moved or deleted.

Identical bytes (even under two filenames) collapse to one row. Re-running
refreshes moved source paths and retries skipped/failed files when a supported
source is available, while preserving extracted or committed work.
"""

from __future__ import annotations

import hashlib
from pathlib import Path
import sqlite3

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


def _refresh_existing_file(
    conn: sqlite3.Connection, path: Path, file_hash: str, status: str, error: str | None
) -> None:
    previous_path, previous_status, previous_error = conn.execute(
        "SELECT local_path, status, error FROM files WHERE file_hash = ?",
        (file_hash,),
    ).fetchone()
    old_path = Path(previous_path) if previous_path else None
    try:
        old_path_matches = old_path is not None and (
            old_path == path or (old_path.is_file() and sha256(old_path) == file_hash)
        )
    except OSError:
        old_path_matches = False

    supported = status == "downloaded"
    # Prefer a usable source over an unsupported duplicate. A path can still
    # exist after its contents have changed, so existence alone is insufficient.
    refresh_path = (
        old_path == path
        or not old_path_matches
        or (supported and old_path is not None and old_path.suffix.lower() not in SUPPORTED_EXTS)
    )
    retry = supported and previous_status in {"skipped", "failed"}
    next_status = "downloaded" if retry else previous_status
    next_error = None if retry else previous_error
    if previous_status == "skipped" and not supported and refresh_path:
        next_error = error

    if refresh_path:
        conn.execute(
            """
            UPDATE files
            SET filename = ?, source = 'inbox', source_ref = ?, local_path = ?,
                status = ?, error = ?
            WHERE file_hash = ?
            """,
            (path.name, path.relative_to(INBOX_DIR).as_posix(), str(path),
             next_status, next_error, file_hash),
        )
    elif retry:
        conn.execute(
            "UPDATE files SET status = ?, error = ? WHERE file_hash = ?",
            (next_status, next_error, file_hash),
        )


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
            file_hash = sha256(path)
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
                    file_hash,
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
                _refresh_existing_file(conn, path, file_hash, status, error)
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
