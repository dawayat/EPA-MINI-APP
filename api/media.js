import { cachePublic, cors, dbSelect } from './_db.js';

const ACTIVE_MEMBER_ID = /^[A-Za-z0-9_-]{1,100}$/;
const DATA_IMAGE = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i;

/**
 * Public, cacheable media for records already visible in the public member
 * directory. Keeping the binary data out of directory JSON responses means a
 * member's photo is downloaded only when an image element actually needs it.
 */
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const kind = String(req.query.kind || '');
  const id = String(req.query.id || '').trim();
  if (kind !== 'member-photo' || !ACTIVE_MEMBER_ID.test(id)) {
    return res.status(400).json({ error: 'A valid public media reference is required.' });
  }

  try {
    const rows = await dbSelect(
      'members',
      `id=eq.${encodeURIComponent(id)}&status=eq.ACTIVE&select=photo_url&limit=1`
    );
    const photo = rows[0]?.photo_url;
    if (!photo || typeof photo !== 'string') return res.status(404).end();

    // Existing records can use a direct object-storage URL. Redirecting avoids
    // proxying that file through a Vercel function.
    if (/^https?:\/\//i.test(photo)) {
      cachePublic(res, 86_400, 604_800);
      return res.redirect(302, photo);
    }

    const match = photo.match(DATA_IMAGE);
    if (!match) return res.status(404).end();
    const body = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
    if (!body.length) return res.status(404).end();

    cachePublic(res, 86_400, 604_800);
    res.setHeader('Content-Type', match[1].toLowerCase());
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(body);
  } catch (error) {
    console.error('[media]', error.message);
    return res.status(500).json({ error: 'Unable to load media.' });
  }
}
