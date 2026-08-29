import { getDb, ensureSchema, cors } from './_db.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getDb();
  await ensureSchema(db);

  if (req.method === 'GET') {
    const { rows } = await db.query('SELECT * FROM applications ORDER BY submitted_at DESC');
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const app = req.body;
    try {
      await db.query(`
        INSERT INTO applications (
          id, application_number, telegram_id, membership_type, status,
          first_name, father_name, grandfather_name, amharic_full_name,
          gender, date_of_birth, phone, email, city, national_id_number,
          photo_url, current_workplace, current_specialty, years_of_experience,
          license_number, degree_certificate_url, id_document_url,
          agreed_to_ethics, student_profile, corporate_profile, qualifications, payment,
          submitted_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
        ) ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          admin_notes = EXCLUDED.admin_notes,
          updated_at = now()
      `, [
        app.id, app.application_number, app.telegram_id || null, app.membership_type, app.status || 'SUBMITTED',
        app.first_name, app.father_name, app.grandfather_name || null, app.amharic_full_name || null,
        app.gender || null, app.date_of_birth || null, app.phone || null, app.email || null,
        app.city || null, app.national_id_number || null,
        app.photo_url || null, app.current_workplace || null, app.current_specialty || null,
        app.years_of_experience || null, app.license_number || null,
        app.degree_certificate_url || null, app.id_document_url || null,
        app.agreed_to_ethics || false,
        app.student_profile ? JSON.stringify(app.student_profile) : null,
        app.corporate_profile ? JSON.stringify(app.corporate_profile) : null,
        app.qualifications ? JSON.stringify(app.qualifications) : null,
        app.payment ? JSON.stringify(app.payment) : null,
        app.submitted_at || new Date().toISOString(),
        new Date().toISOString()
      ]);
      return res.status(201).json({ success: true });
    } catch (err) {
      console.error('Error inserting application:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'PATCH') {
    const { id, status, admin_notes } = req.body;
    await db.query(
      'UPDATE applications SET status=$1, admin_notes=$2, updated_at=now() WHERE id=$3',
      [status, admin_notes || null, id]
    );
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
