-- Shared comments, draft votes, and member-to-member messages.
-- This migration is additive and safe to run on the existing production schema.

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT true;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS email_verifications (
  id text PRIMARY KEY,
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);
CREATE INDEX IF NOT EXISTS email_verifications_lookup_idx ON email_verifications(email, created_at DESC);

CREATE TABLE IF NOT EXISTS announcement_comments (
  id text PRIMARY KEY,
  announcement_id text NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  member_id text NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_photo_url text,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE announcement_comments ADD COLUMN IF NOT EXISTS author_photo_url text;

CREATE TABLE IF NOT EXISTS announcement_votes (
  announcement_id text NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  member_id text NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  choice text NOT NULL CHECK (choice IN ('approve', 'adjust')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, member_id)
);

CREATE TABLE IF NOT EXISTS member_messages (
  id text PRIMARY KEY,
  sender_id text NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  recipient_id text NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);

CREATE TABLE IF NOT EXISTS research_submissions (
  id text PRIMARY KEY,
  member_id text NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_membership_number text NOT NULL,
  author_email text,
  author_phone text,
  title text NOT NULL,
  abstract text NOT NULL CHECK (char_length(abstract) BETWEEN 1 AND 5000),
  keywords text[] NOT NULL DEFAULT '{}',
  publication_type text NOT NULL DEFAULT 'Research Paper',
  file_url text NOT NULL,
  file_name text NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'SUBMITTED',
  review_notes text
);

CREATE INDEX IF NOT EXISTS announcement_comments_announcement_idx
  ON announcement_comments(announcement_id, created_at);
CREATE INDEX IF NOT EXISTS member_messages_sender_idx
  ON member_messages(sender_id, created_at);
CREATE INDEX IF NOT EXISTS member_messages_recipient_idx
  ON member_messages(recipient_id, created_at);
CREATE INDEX IF NOT EXISTS research_submissions_status_idx
  ON research_submissions(status, submitted_at DESC);

ALTER TABLE announcement_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_announcement_comments" ON announcement_comments;
CREATE POLICY "open_announcement_comments" ON announcement_comments FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_announcement_votes" ON announcement_votes;
CREATE POLICY "open_announcement_votes" ON announcement_votes FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_member_messages" ON member_messages;
CREATE POLICY "open_member_messages" ON member_messages FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_research_submissions" ON research_submissions;
CREATE POLICY "open_research_submissions" ON research_submissions FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_email_verifications" ON email_verifications;
