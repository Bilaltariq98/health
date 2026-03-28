-- Migration: replace day_type (string enum) with session_index (int) + preferred_day (string)
--
-- SQLite doesn't support DROP COLUMN in older versions, so we recreate the table.
-- Existing rows: day_type "tuesday"→0, "wednesday"→1, "friday"→2, anything else→0.

PRAGMA foreign_keys = OFF;

CREATE TABLE sessions_new (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  session_index INTEGER NOT NULL DEFAULT 0,
  preferred_day TEXT NOT NULL DEFAULT 'Tuesday',
  intent TEXT NOT NULL,
  programme_version TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration_seconds INTEGER,
  notes TEXT
);

INSERT INTO sessions_new (
  id, date, session_index, preferred_day, intent,
  programme_version, started_at, completed_at, duration_seconds, notes
)
SELECT
  id,
  date,
  CASE day_type
    WHEN 'tuesday'   THEN 0
    WHEN 'wednesday' THEN 1
    WHEN 'friday'    THEN 2
    ELSE 0
  END,
  CASE day_type
    WHEN 'tuesday'   THEN 'Tuesday'
    WHEN 'wednesday' THEN 'Wednesday'
    WHEN 'friday'    THEN 'Friday'
    ELSE 'Tuesday'
  END,
  intent,
  programme_version,
  started_at,
  completed_at,
  duration_seconds,
  notes
FROM sessions;

DROP TABLE sessions;
ALTER TABLE sessions_new RENAME TO sessions;

PRAGMA foreign_keys = ON;
