import { dbSelect, dbInsert, dbUpdate, cors } from './_db.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const rows = await dbSelect('members', 'order=created_at.desc');
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const m = req.body;
      const row = {};
      const fields = [
        'id','membership_number','verification_token','telegram_id',
        'first_name','father_name','grandfather_name','amharic_full_name',
        'photo_url','email','phone','city','membership_type','status',
        'specialty','workplace','bio','cpd_points','issued_at','expires_at',
        'is_verified','license_number','phone_password','corporate_profile','student_profile'
      ];
      for (const f of fields) {
        if (m[f] !== undefined && m[f] !== null) row[f] = m[f];
      }
      await dbInsert('members', row);
      return res.status(201).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Member id required' });
      const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
      const delRes = await fetch(`${base}/rest/v1/members?id=eq.${id}`, {
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
    console.error('[members]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
