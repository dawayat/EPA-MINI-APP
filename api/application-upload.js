import { cors } from './_db.js';
import { createApplicationUpload } from './_application_media.js';

/**
 * Authorizes a tiny JSON request and returns a signed Supabase Storage upload
 * URL. The selected file itself goes from the browser to Supabase directly.
 */
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    const { email, verificationCode, contentType, size } = req.body || {};
    const upload = await createApplicationUpload({ email, verificationCode, contentType, size });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ success: true, ...upload });
  } catch (error) {
    console.error('[application-upload]', error.message);
    return res.status(error.statusCode || 500).json({ success: false, error: error.message || 'Could not prepare document upload.' });
  }
}
