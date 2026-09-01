-- Telegram channel media is delivered directly to Telegram when an announcement
-- is published. The Mini App never reads it back, so retaining a base64 copy in
-- announcements.attachments only increases database storage and PostgREST egress.
-- This preserves cover and file attachments and is safe to run once on production.

UPDATE announcements
SET attachments = COALESCE(
  (
    SELECT jsonb_agg(item)
    FROM jsonb_array_elements(attachments) AS item
    WHERE COALESCE(item->>'type', '') <> 'telegram_media'
  ),
  '[]'::jsonb
)
WHERE jsonb_typeof(attachments) = 'array'
  AND attachments @> '[{"type":"telegram_media"}]'::jsonb;

-- Comments retain the author's member ID, so an embedded avatar copy is not
-- required. New API responses already omit this column; clearing old base64
-- values reduces storage and prevents accidental future egress regressions.
UPDATE announcement_comments
SET author_photo_url = NULL
WHERE author_photo_url LIKE 'data:image/%';
