/**
 * Debug endpoint - shows DB status, env vars, and Telegram matching.
 * Call: GET /api/debug?telegram_id=YOUR_TG_ID&phone=YOUR_PHONE
 */
import { dbSelect, cors } from './_db.js';

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}
function getServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { telegram_id, phone } = req.query;

  const report = {
    env: {
      SUPABASE_URL: getSupabaseUrl() ? '✅ SET' : '❌ MISSING',
      SUPABASE_SERVICE_ROLE_KEY: getServiceKey() ? '✅ SET' : '❌ MISSING',
    },
    members_count: 0,
    members: [],
    applications_count: 0,
    applications: [],
    telegram_match: null,
    phone_match: null,
  };

  try {
    const members = await dbSelect('members', 'order=created_at.desc&limit=20');
    report.members_count = members.length;
    report.members = members.map(m => ({
      id: m.id,
      name: `${m.first_name} ${m.father_name}`,
      phone: m.phone,
      telegram_id: m.telegram_id,
      status: m.status,
      has_password: !!m.phone_password,
      membership_number: m.membership_number,
    }));

    if (telegram_id) {
      report.telegram_match = members.find(m =>
        m.telegram_id === telegram_id ||
        m.telegram_id === String(telegram_id) ||
        String(m.telegram_id) === String(telegram_id)
      ) || 'NO MATCH';
    }

    if (phone) {
      const last9 = String(phone).replace(/[\s\-\(\)\+]/g, '').slice(-9);
      report.phone_match = members.find(m => 
        m.phone && String(m.phone).replace(/[\s\-\(\)\+]/g, '').slice(-9) === last9
      ) || 'NO MATCH';
    }
  } catch (e) {
    report.members_error = e.message;
  }

  try {
    const apps = await dbSelect('applications', 'order=submitted_at.desc&limit=20');
    report.applications_count = apps.length;
    report.applications = apps.map(a => ({
      id: a.id,
      name: `${a.first_name} ${a.father_name}`,
      phone: a.phone,
      telegram_id: a.telegram_id,
      status: a.status,
      has_password: !!a.phone_password,
      application_number: a.application_number,
    }));
  } catch (e) {
    report.applications_error = e.message;
  }

  return res.status(200).json(report);
}
