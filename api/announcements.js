import { dbSelect, dbInsert, dbUpdate, cors } from './_db.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const rows = await dbSelect('announcements', 'order=published_at.desc');
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const a = req.body;
      const row = {};
      const fields = [
        'id','title','content','type','status','published_at','author_name',
        'attachments','target_audience','is_draft'
      ];
      for (const f of fields) {
        if (a[f] !== undefined && a[f] !== null) row[f] = a[f];
      }
      await dbInsert('announcements', row);
      return res.status(201).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Announcement id required' });
      const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
      const delRes = await fetch(`${base}/rest/v1/announcements?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        }
      });
      if (!delRes.ok && delRes.status !== 204) {
        const text = await delRes.text();
        throw new Error(`DELETE failed: ${text}`);
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[announcements]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
