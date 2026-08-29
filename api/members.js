import { getDb, ensureSchema, cors } from './_db.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getDb();
  await ensureSchema(db);

  if (req.method === 'GET') {
    const { rows } = await db.query('SELECT * FROM members ORDER BY created_at DESC');
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const m = req.body;
    try {
      await db.query(`
        INSERT INTO members (
          id, membership_number, verification_token, telegram_id,
          first_name, father_name, grandfather_name, amharic_full_name,
          photo_url, email, phone, city, membership_type, status,
          specialty, workplace, bio, cpd_points, issued_at, expires_at,
          is_verified, license_number
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
        ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status, cpd_points=EXCLUDED.cpd_points
      `, [
        m.id, m.membership_number, m.verification_token || null, m.telegram_id || null,
        m.first_name, m.father_name, m.grandfather_name || null, m.amharic_full_name || null,
        m.photo_url || null, m.email || null, m.phone || null, m.city || null,
        m.membership_type, m.status || 'PENDING',
        m.specialty || null, m.workplace || null, m.bio || null,
        m.cpd_points || 0, m.issued_at || new Date().toISOString(), m.expires_at || null,
        m.is_verified || false, m.license_number || null
      ]);
      return res.status(201).json({ success: true });
    } catch (err) {
      console.error('Error inserting member:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
