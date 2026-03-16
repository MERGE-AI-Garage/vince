-- ABOUTME: Adds soft-delete support to creative_studio_generations.
-- ABOUTME: archived_at NULL = active; populated = archived (hidden from main view).

ALTER TABLE creative_studio_generations ADD COLUMN IF NOT EXISTS archived_at timestamptz;
