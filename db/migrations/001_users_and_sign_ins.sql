-- Who signed in, and when. Users are keyed by their Replit OIDC subject.
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  username text NOT NULL,
  first_name text,
  email text,
  email_verified boolean NOT NULL DEFAULT false,
  profile_image_url text,
  first_signed_in_at timestamptz NOT NULL DEFAULT now(),
  last_signed_in_at timestamptz NOT NULL DEFAULT now(),
  sign_in_count integer NOT NULL DEFAULT 1
);

-- One row per completed sign-in.
CREATE TABLE IF NOT EXISTS sign_ins (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signed_in_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sign_ins_user_time_idx ON sign_ins (user_id, signed_in_at DESC);
