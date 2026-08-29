import { getDb, ensureSchema, cors } from './_db.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getDb();
  await ensureSchema(db);

  if (req.method === 'GET') {
    const { rows } = await db.query('SELECT * FROM announcements ORDER BY published_at DESC');
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const a = req.body;
    try {
      await db.query(`
        INSERT INTO announcements (id, title, content, type, published_at, author_name, status, attachments, target_audience)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, content=EXCLUDED.content, status=EXCLUDED.status
      `, [
        a.id, a.title, a.content || '', a.type || 'General',
        a.published_at || new Date().toISOString(),
        a.author_name || 'EPA Executive Directorate',
        a.status || 'PUBLISHED',
        a.attachments ? JSON.stringify(a.attachments) : null,
        a.target_audience || null
      ]);
      return res.status(201).json({ success: true });
    } catch (err) {
      console.error('Error inserting announcement:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
