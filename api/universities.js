import { cachePublic, dbSelect, cors } from './_db.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const rows = await dbSelect('universities', 'order=name.asc');
      // The university registry changes rarely. Serving it from the edge avoids
      // one database request for every visitor and registration form open.
      cachePublic(res, 86_400, 604_800);
      return res.status(200).json(rows);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[universities]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
