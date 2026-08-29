import { getDb, ensureSchema, cors } from './_db.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getDb();
  await ensureSchema(db);

  if (req.method === 'GET') {
    const { rows } = await db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500');
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const log = req.body;
    try {
      await db.query(
        'INSERT INTO audit_logs (id, action, entity_type, entity_id, admin_username) VALUES ($1,$2,$3,$4,$5)',
        [log.id, log.action, log.entity_type, log.entity_id || null, log.admin_username || 'system']
      );
      return res.status(201).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
