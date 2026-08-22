"""Create the working-DB schema. Idempotent — safe to run repeatedly.

    python -m pipeline.migrate

Loads schema.sql, applies it, then verifies by running the exact
repetition-count query from docs/schema.md against the (empty) tables. If
that query executes and the expected tables exist, the schema is sound.
"""

from __future__ import annotations

from pathlib import Path

from pipeline.db import DB_PATH, connect

SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"

# Verbatim from docs/schema.md — counts DISTINCT exams, never files. Run
# here against empty tables purely to prove it parses and executes.
REPETITION_QUERY = """
SELECT COUNT(DISTINCT e.id)
FROM occurrences o
JOIN files f ON f.file_hash = o.file_hash
JOIN exams e ON e.id = f.exam_id
WHERE o.question_id = ?;
"""

EXPECTED_TABLES = [
    "exams",
    "files",
    "extractions",
    "questions",
    "occurrences",
    "duplicate_candidates",
]


def migrate() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")

    conn = connect()
    try:
        conn.executescript(schema_sql)
        conn.commit()

        # Verify every expected table exists.
        rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table'"
        ).fetchall()
        present = {name for (name,) in rows}
        missing = [t for t in EXPECTED_TABLES if t not in present]
        if missing:
            raise SystemExit(f"schema incomplete, missing tables: {missing}")

        # Verify the repetition-count query runs against empty tables.
        (count,) = conn.execute(REPETITION_QUERY, ("nonexistent",)).fetchone()
        if count != 0:
            raise SystemExit(f"repetition query returned {count}, expected 0")
    finally:
        conn.close()

    print(f"schema OK at {DB_PATH}")
    print(f"  tables: {', '.join(EXPECTED_TABLES)}")
    print("  repetition-count query runs against empty tables (= 0)")


if __name__ == "__main__":
    migrate()
