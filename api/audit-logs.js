import { dbSelect, dbInsert, cors } from './_db.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const rows = await dbSelect('audit_logs', 'order=created_at.desc&limit=500');
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const log = req.body;
      await dbInsert('audit_logs', {
        id: log.id,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id || null,
        admin_username: log.admin_username || 'system'
      });
      return res.status(201).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[audit-logs]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
