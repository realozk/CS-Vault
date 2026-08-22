-- CS-Vault working DB — SQLite, local only, gitignored.
-- Idempotent: every statement is CREATE ... IF NOT EXISTS, so migrate.py
-- can run repeatedly. See docs/schema.md Part 1 for the rationale.

-- exams: the true deduplication unit. Same exam uploaded twice is not
-- repetition; a question across two distinct exams is.
CREATE TABLE IF NOT EXISTS exams (
    id          TEXT PRIMARY KEY,
    subject     TEXT NOT NULL,
    year        INTEGER,
    term        TEXT,
    exam_type   TEXT,
    UNIQUE (subject, year, term, exam_type)
);

-- files: one row per source file. exam_id is nullable — files import
-- first and get assigned later; never block ingestion on assignment.
-- Files are curated into pipeline/data/inbox/ locally, not fetched from
-- Drive: (source, source_ref) records where each came from.
CREATE TABLE IF NOT EXISTS files (
    file_hash   TEXT PRIMARY KEY,               -- SHA-256 of raw bytes
    exam_id     TEXT REFERENCES exams (id),
    filename    TEXT,
    source      TEXT,                           -- origin tag, e.g. 'inbox'
    source_ref  TEXT,                           -- stable id within source (inbox: relative path)
    local_path  TEXT,                           -- on-disk path the bytes were read from
    status      TEXT NOT NULL
                CHECK (status IN ('downloaded', 'extracted', 'committed', 'skipped', 'failed')),
    error       TEXT
);

-- extractions: raw model output, kept forever. Lets us re-parse after a
-- prompt change without re-paying for inference.
CREATE TABLE IF NOT EXISTS extractions (
    id              TEXT PRIMARY KEY,
    file_hash       TEXT NOT NULL REFERENCES files (file_hash),
    page_number     INTEGER,
    model           TEXT,
    prompt_version  TEXT,
    raw_response    TEXT,                        -- verbatim, unparsed
    created_at      TEXT,                        -- ISO8601
    UNIQUE (file_hash, page_number, model, prompt_version)
);

-- questions: parsed, validated, dedup-tagged. choices and flags are
-- JSON-encoded TEXT; embedding is a nullable BLOB.
CREATE TABLE IF NOT EXISTS questions (
    id              TEXT PRIMARY KEY,
    text            TEXT,
    choices         TEXT,                        -- JSON array of strings
    correct_answer  TEXT,                        -- must match one entry in choices
    answer_source   TEXT CHECK (answer_source IN ('marked_in_document', 'inferred')),
    code            TEXT,                        -- code snippet, nullable
    has_figure      INTEGER NOT NULL DEFAULT 0,  -- 0/1
    figure_path     TEXT,
    review_status   TEXT CHECK (review_status IN ('auto_ok', 'needs_review', 'approved', 'rejected')),
    flags           TEXT,                        -- JSON array
    norm_hash       TEXT,                        -- normalized-text hash, cheap exact dedup
    embedding       BLOB
);

-- occurrences: which (file, page) a question appeared on. The UNIQUE
-- constraint is what stops a restarted run from re-inflating repetition.
CREATE TABLE IF NOT EXISTS occurrences (
    question_id     TEXT NOT NULL REFERENCES questions (id),
    file_hash       TEXT NOT NULL REFERENCES files (file_hash),
    page_number     INTEGER,
    UNIQUE (question_id, file_hash, page_number)
);

-- duplicate_candidates: suspected pairs awaiting human judgement. Never
-- auto-merged. CHECK (question_a < question_b) enforces a canonical
-- ordering in the schema itself, so (A,B) and (B,A) can't both exist and
-- the UNIQUE below actually catches reverse-order dupes.
CREATE TABLE IF NOT EXISTS duplicate_candidates (
    question_a      TEXT NOT NULL REFERENCES questions (id),
    question_b      TEXT NOT NULL REFERENCES questions (id),
    similarity      REAL,
    verdict         TEXT CHECK (verdict IN ('pending', 'merge', 'keep_separate')),
    CHECK (question_a < question_b),
    UNIQUE (question_a, question_b)
);

-- Performance indexes (no behavior change):
--   norm_hash    → exact-dedup lookups (slice 5)
--   question_id  → the repetition-count query
CREATE INDEX IF NOT EXISTS idx_questions_norm_hash ON questions (norm_hash);
CREATE INDEX IF NOT EXISTS idx_occurrences_question ON occurrences (question_id);
