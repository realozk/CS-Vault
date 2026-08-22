"""SQLite connection helper for the local working DB.

The DB lives at pipeline/data/pipeline.db — gitignored, local only. All
access goes through connect() so foreign keys are enforced consistently;
SQLite leaves PRAGMA foreign_keys OFF by default, which would make every
REFERENCES clause in schema.sql decorative.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

# pipeline/pipeline/db.py -> parents[1] is pipeline/, so data/ is a sibling
# of the package. Lands inside the gitignored pipeline/data/.
DB_PATH = Path(__file__).resolve().parents[1] / "data" / "pipeline.db"


def connect(db_path: Path | str = DB_PATH) -> sqlite3.Connection:
    """Open a connection with foreign-key enforcement turned on."""
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")
    return conn
