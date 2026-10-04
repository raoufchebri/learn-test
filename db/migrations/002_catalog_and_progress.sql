-- Catalog mirrored from src/course-structure.ts by scripts/db-sync-catalog.mjs. Content lives in code; rows are never deleted.
CREATE TABLE IF NOT EXISTS courses (
  id text PRIMARY KEY,                 -- permanent, e.g. 'discover' (Replit 101)
  title text NOT NULL,
  position integer NOT NULL,
  published boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modules (
  id text PRIMARY KEY,                 -- permanent, e.g. 'replit-101'
  course_id text NOT NULL REFERENCES courses(id),
  title text NOT NULL,
  position integer NOT NULL,
  archived_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pages (
  id text PRIMARY KEY,                 -- permanent, e.g. 'replit-101/what-you-can-do-with-replit'
  module_id text NOT NULL REFERENCES modules(id),
  title text NOT NULL,
  url_path text NOT NULL,
  position integer NOT NULL,
  has_quiz boolean NOT NULL DEFAULT false,
  archived_at timestamptz,             -- set when a page leaves the course; progress history is kept
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pages_module_position_idx ON pages (module_id, position);

-- One row per learner per page they have opened. completed_at is set when the page's quiz is passed.
CREATE TABLE IF NOT EXISTS user_page_progress (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_id text NOT NULL REFERENCES pages(id),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  PRIMARY KEY (user_id, page_id)
);
CREATE INDEX IF NOT EXISTS user_page_progress_completed_idx ON user_page_progress (user_id) WHERE completed_at IS NOT NULL;

-- Last page a learner opened in each course.
CREATE TABLE IF NOT EXISTS user_course_state (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id text NOT NULL REFERENCES courses(id),
  last_page_id text NOT NULL REFERENCES pages(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);
