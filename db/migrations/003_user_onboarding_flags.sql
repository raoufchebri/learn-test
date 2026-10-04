-- Welcome modal: shown after sign-in until the learner picks Replit 101, browses courses, or closes it.
ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_dismissed_at timestamptz;
-- Browser-saved progress is imported once per learner; afterwards the database is the only source of truth.
ALTER TABLE users ADD COLUMN IF NOT EXISTS progress_imported_at timestamptz;
