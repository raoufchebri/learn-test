-- Unlock buttons inside lessons (entry link, copy-the-prompt, activity confirmation), mirrored from the code.
-- Module and course come through the lesson. Rows are archived, never deleted.
CREATE TABLE IF NOT EXISTS lesson_unlocks (
  id text PRIMARY KEY,                 -- permanent, e.g. 'replit-101/from-conversation-to-outcome:prompt-0'
  lesson_id text NOT NULL REFERENCES lessons(id),
  kind text NOT NULL CHECK (kind IN ('entry', 'prompt', 'activity')),
  label text NOT NULL,
  position integer NOT NULL,           -- order within the lesson
  archived_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lesson_unlocks_lesson_idx ON lesson_unlocks (lesson_id, position);

-- Which learner unlocked which button, recorded once.
CREATE TABLE IF NOT EXISTS user_unlocks (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unlock_id text NOT NULL REFERENCES lesson_unlocks(id),
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, unlock_id)
);
