import { dbSelect, dbInsert, dbUpdate, cors } from './_db.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const rows = await dbSelect('applications', 'order=submitted_at.desc');
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const app = req.body;

      // Build clean row - only include fields that have values
      const row = {};
      const fields = [
        'id','application_number','telegram_id','membership_type','status',
        'first_name','father_name','grandfather_name','amharic_full_name',
        'gender','date_of_birth','phone','email','city','national_id_number',
        'photo_url','current_workplace','current_specialty','years_of_experience',
        'license_number','degree_certificate_url','id_document_url',
        'agreed_to_ethics','student_profile','corporate_profile','qualifications','payment',
        'phone_password','email_verified','rejection_reason','admin_notes',
        'submitted_at','updated_at'
      ];
      for (const f of fields) {
        if (app[f] !== undefined && app[f] !== null && app[f] !== '') {
          row[f] = app[f];
        }
      }
      if (!row.status || row.status === 'UNDER_REVIEW') row.status = 'SUBMITTED';
      if (!row.submitted_at) row.submitted_at = new Date().toISOString();
      if (!row.updated_at) row.updated_at = new Date().toISOString();

      await dbInsert('applications', row);
      return res.status(201).json({ success: true });
    }

    if (req.method === 'PATCH') {
      const { id, status, admin_notes } = req.body;
      await dbUpdate('applications', { status, admin_notes, updated_at: new Date().toISOString() }, 'id', id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[applications]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
