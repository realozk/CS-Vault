"""Exercise ingestion only against temporary inboxes and databases."""

from contextlib import redirect_stdout
import io
from pathlib import Path
import sqlite3
import sys
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

# Allow discovery from both the repository root and the pipeline directory.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pipeline import db, ingest  # noqa: E402


class IngestTests(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.inbox = self.root / "inbox"
        self.inbox.mkdir()
        self.db_path = self.root / "pipeline.db"
        with db.connect(self.db_path) as conn:
            schema = Path(ingest.__file__).with_name("schema.sql")
            conn.executescript(schema.read_text(encoding="utf-8"))
        self.patches = [
            patch.object(ingest, "INBOX_DIR", self.inbox),
            patch.object(ingest, "connect", lambda: db.connect(self.db_path)),
        ]
        for mocked in self.patches:
            mocked.start()
            self.addCleanup(mocked.stop)

    def run_ingest(self):
        with redirect_stdout(io.StringIO()):
            ingest.ingest()

    def source(self, name="document.pdf", data=b"curated source bytes"):
        path = self.inbox / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return path

    def rows(self):
        with db.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            return [dict(row) for row in conn.execute("SELECT * FROM files ORDER BY filename")]

    def test_unsupported_file_renamed_to_pdf_is_retried_with_fresh_metadata(self):
        original = self.source("document.tmp")
        self.run_ingest()
        before = self.rows()[0]
        self.assertEqual(before["status"], "skipped")
        renamed = self.inbox / "lectures" / "document.pdf"
        renamed.parent.mkdir()
        original.rename(renamed)
        self.run_ingest()
        self.run_ingest()
        rows = self.rows()
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["file_hash"], before["file_hash"])
        self.assertEqual(rows[0]["filename"], renamed.name)
        self.assertEqual(rows[0]["source_ref"], "lectures/document.pdf")
        self.assertEqual(rows[0]["local_path"], str(renamed))
        self.assertEqual(rows[0]["status"], "downloaded")
        self.assertIsNone(rows[0]["error"])

    def test_failed_source_can_retry_when_renamed_to_supported_file(self):
        original = self.source()
        self.run_ingest()
        with db.connect(self.db_path) as conn:
            conn.execute("UPDATE files SET status = 'failed', error = 'interrupted'")
        renamed = original.with_name("renamed.PDF")
        original.rename(renamed)
        self.run_ingest()
        row = self.rows()[0]
        self.assertEqual(row["status"], "downloaded")
        self.assertIsNone(row["error"])
        self.assertEqual(row["local_path"], str(renamed))

    def test_move_preserves_extracted_committed_work_and_exam_assignment(self):
        original = self.source()
        self.run_ingest()
        for status in ("extracted", "committed"):
            with self.subTest(status=status):
                file_hash = self.rows()[0]["file_hash"]
                with db.connect(self.db_path) as conn:
                    conn.execute("INSERT OR IGNORE INTO exams (id, subject) VALUES ('exam-1', 'os')")
                    conn.execute("UPDATE files SET status = ?, exam_id = 'exam-1', error = 'review note'", (status,))
                    conn.execute("INSERT OR IGNORE INTO extractions (id, file_hash, raw_response) VALUES ('raw-1', ?, 'preserved')", (file_hash,))
                renamed = original.with_name(f"{status}.png")
                original.rename(renamed)
                self.run_ingest()
                row = self.rows()[0]
                self.assertEqual(row["status"], status)
                self.assertEqual(row["exam_id"], "exam-1")
                self.assertEqual(row["error"], "review note")
                self.assertEqual(row["local_path"], str(renamed))
                with db.connect(self.db_path) as conn:
                    self.assertEqual(conn.execute("SELECT raw_response FROM extractions").fetchall(), [("preserved",)])
                original = renamed

    def test_unsupported_duplicate_never_downgrades_or_replaces_a_valid_source(self):
        supported = self.source("z-source.pdf")
        self.run_ingest()
        before = self.rows()[0]
        # This filename sorts first, exercising both traversal orders.
        self.source("a-copy.tmp", supported.read_bytes())
        self.run_ingest()
        self.assertEqual(self.rows(), [before])
        self.run_ingest()
        self.assertEqual(self.rows(), [before])

    def test_supported_duplicate_is_preferred_even_if_unsupported_copy_still_exists(self):
        unsupported = self.source("a-source.tmp")
        self.run_ingest()
        supported = self.source("z-source.pdf", unsupported.read_bytes())
        self.run_ingest()
        row = self.rows()[0]
        self.assertEqual(row["status"], "downloaded")
        self.assertEqual(row["local_path"], str(supported))
        self.assertIsNone(row["error"])
        self.run_ingest()
        self.assertEqual(self.rows(), [row])

    def test_existing_path_with_changed_bytes_does_not_keep_the_old_hash_location(self):
        original = self.source("z-original.pdf")
        self.run_ingest()
        original_hash = self.rows()[0]["file_hash"]
        moved = self.source("a-moved.pdf", original.read_bytes())
        original.write_bytes(b"different source content")
        self.run_ingest()
        by_hash = {row["file_hash"]: row for row in self.rows()}
        self.assertEqual(len(by_hash), 2)
        self.assertEqual(by_hash[original_hash]["local_path"], str(moved))
        self.assertEqual(by_hash[ingest.sha256(original)]["local_path"], str(original))

    def test_moved_unsupported_copy_preserves_an_existing_successful_status(self):
        original = self.source()
        self.run_ingest()
        renamed = original.with_suffix(".tmp")
        original.rename(renamed)
        self.run_ingest()
        row = self.rows()[0]
        self.assertEqual(row["status"], "downloaded")
        self.assertIsNone(row["error"])
        self.assertEqual(row["local_path"], str(renamed))


if __name__ == "__main__":
    unittest.main()
