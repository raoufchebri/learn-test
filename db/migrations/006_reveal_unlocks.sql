-- New unlock kind: "reveal" shows Replit's example answer after the learner copies the prompt.
ALTER TABLE lesson_unlocks DROP CONSTRAINT IF EXISTS lesson_unlocks_kind_check;
ALTER TABLE lesson_unlocks ADD CONSTRAINT lesson_unlocks_kind_check CHECK (kind IN ('entry', 'prompt', 'reveal', 'activity'));
