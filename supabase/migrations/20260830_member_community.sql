-- Shared comments, draft votes, and member-to-member messages.
-- This migration is additive and safe to run on the existing production schema.

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS announcement_comments (
  id text PRIMARY KEY,
  announcement_id text NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  member_id text NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

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

CREATE INDEX IF NOT EXISTS announcement_comments_announcement_idx
  ON announcement_comments(announcement_id, created_at);
CREATE INDEX IF NOT EXISTS member_messages_sender_idx
  ON member_messages(sender_id, created_at);
CREATE INDEX IF NOT EXISTS member_messages_recipient_idx
  ON member_messages(recipient_id, created_at);

ALTER TABLE announcement_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_announcement_comments" ON announcement_comments;
CREATE POLICY "open_announcement_comments" ON announcement_comments FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_announcement_votes" ON announcement_votes;
CREATE POLICY "open_announcement_votes" ON announcement_votes FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_member_messages" ON member_messages;
CREATE POLICY "open_member_messages" ON member_messages FOR ALL USING (true) WITH CHECK (true);
