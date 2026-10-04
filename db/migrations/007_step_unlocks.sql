-- New unlock kind: "step" is a button that gates a lesson step without a prompt (for example "open Google Calendar").
ALTER TABLE lesson_unlocks DROP CONSTRAINT IF EXISTS lesson_unlocks_kind_check;
ALTER TABLE lesson_unlocks ADD CONSTRAINT lesson_unlocks_kind_check CHECK (kind IN ('entry', 'prompt', 'reveal', 'step', 'activity'));
