-- Neon / PostgreSQL: run once on your existing database (Neon SQL Editor, or psql).
-- Safe to re-run: uses IF NOT EXISTS.

BEGIN;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS follow_up_snooze_until TIMESTAMPTZ;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS follow_up_contacted BOOLEAN DEFAULT false;

-- Rows created before this migration may have NULL; treat like "not contacted"
UPDATE jobs SET follow_up_contacted = false WHERE follow_up_contacted IS NULL;

COMMIT;
