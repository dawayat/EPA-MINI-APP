import { dbSelect, dbInsert, cors } from './_db.js';

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
      const row = {
        id: a.id,
        title: a.title,
        content: a.content || '',
        type: a.type || 'General',
        published_at: a.published_at || new Date().toISOString(),
        author_name: a.author_name || 'EPA Executive Directorate',
        status: a.status || 'PUBLISHED',
      };
      if (a.attachments) row.attachments = a.attachments;
      if (a.target_audience) row.target_audience = a.target_audience;

      await dbInsert('announcements', row);
      return res.status(201).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[announcements]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
