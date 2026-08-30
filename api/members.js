import { dbSelect, dbInsert, dbUpdate, cors } from './_db.js';
import { isEmailConfigured, memberInviteEmail, sendEmail } from './_email.js';

const importId = () => `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const token = () => `epa_tok_${Math.random().toString(36).slice(2, 10)}`;
const dateValue = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

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
      if (m.action === 'bulk-import') {
        if (!Array.isArray(m.rows) || m.rows.length === 0) return res.status(400).json({ success: false, error: 'Choose a CSV with at least one member row.' });
        if (m.rows.length > 200) return res.status(400).json({ success: false, error: 'Import a maximum of 200 members at a time.' });
        const created = [];
        const errors = [];
        for (const [index, source] of m.rows.entries()) {
          const rowNumber = index + 2;
          const email = String(source.email || '').trim().toLowerCase();
          const firstName = String(source.first_name || '').trim();
          const fatherName = String(source.father_name || '').trim();
          const membershipNumber = String(source.membership_number || '').trim();
          const password = String(source.temporary_password || '').trim();
          const membershipStart = dateValue(source.membership_start_date);
          const membershipType = String(source.membership_type || '').trim().toUpperCase();
          if (!email || !firstName || !fatherName || !membershipNumber || !password || !membershipStart || !['STUDENT', 'FULL', 'CORPORATE'].includes(membershipType)) {
            errors.push({ row: rowNumber, error: 'Required fields: email, names, membership number, temporary password, valid membership start date, and membership type.' });
            continue;
          }
          const existing = await dbSelect('members', `or=(email.eq.${encodeURIComponent(email)},membership_number.eq.${encodeURIComponent(membershipNumber)})&select=id&limit=1`);
          if (existing.length) {
            errors.push({ row: rowNumber, error: 'A member with this email or membership number already exists.' });
            continue;
          }
          const expiry = dateValue(source.membership_expiry_date) || new Date(new Date(membershipStart).setFullYear(new Date(membershipStart).getFullYear() + 1)).toISOString();
          const member = {
            id: importId(), membership_number: membershipNumber, verification_token: token(), email, phone: String(source.phone || '').trim() || null,
            first_name: firstName, father_name: fatherName, grandfather_name: String(source.grandfather_name || '').trim() || null,
            city: String(source.city || '').trim() || null, gender: String(source.gender || '').trim() || null, date_of_birth: String(source.date_of_birth || '').trim() || null,
            membership_type: membershipType, status: 'ACTIVE',
            specialty: membershipType === 'STUDENT' ? null : (String(source.specialty || '').trim() || null), workplace: String(source.workplace || '').trim() || null,
            license_number: String(source.license_number || '').trim() || null, cpd_points: Number(source.cpd_points || 0) || 0,
            issued_at: membershipStart, expires_at: expiry, is_verified: true, phone_password: password, email_verified: true,
            must_change_password: true, onboarding_completed: false
          };
          try {
            await dbInsert('members', member);
            let invitationSent = false;
            if (isEmailConfigured()) {
              try {
                const invitation = memberInviteEmail(`${firstName} ${fatherName}`, membershipNumber, password);
                await sendEmail({ to: email, ...invitation });
                invitationSent = true;
              } catch (emailError) {
                errors.push({ row: rowNumber, error: `Member created, but invitation email failed: ${emailError.message}` });
              }
            }
            created.push({ email, membership_number: membershipNumber, invitation_sent: invitationSent });
          } catch (error) {
            errors.push({ row: rowNumber, error: error.message });
          }
        }
        return res.status(201).json({ success: true, created, errors });
      }
      const row = {};
      const fields = [
        'id','membership_number','verification_token','telegram_id',
        'first_name','father_name','grandfather_name','amharic_full_name',
        'photo_url','email','phone','city','gender','date_of_birth','membership_type','status',
        'specialty','workplace','bio','cpd_points','issued_at','expires_at',
        'is_verified','license_number','phone_password','email_verified','must_change_password','onboarding_completed','corporate_profile','student_profile'
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

    if (req.method === 'PATCH') {
      const { id, action, photo_url, phone, city, workplace, specialty, gender, date_of_birth, bio, student_profile, corporate_profile } = req.body || {};
      if (action !== 'complete-onboarding' || !id) return res.status(400).json({ error: 'A valid member profile is required.' });
      const existing = (await dbSelect('members', `id=eq.${encodeURIComponent(id)}&limit=1`))[0];
      if (!existing) return res.status(404).json({ success: false, error: 'Member account was not found.' });

      const memberType = existing.membership_type;
      const value = (incoming, saved) => String(incoming ?? saved ?? '').trim();
      const requireValue = (label, incoming, saved) => {
        const result = value(incoming, saved);
        if (!result) throw new Error(`${label} is required to complete your member profile.`);
        return result;
      };
      const mergedStudent = { ...(existing.student_profile || {}), ...(student_profile || {}) };
      const mergedCorporate = { ...(existing.corporate_profile || {}), ...(corporate_profile || {}) };

      const update = {
        photo_url: requireValue('Profile photo', photo_url, existing.photo_url),
        phone: requireValue('Phone number', phone, existing.phone),
        city: requireValue('City', city, existing.city),
        bio: value(bio, existing.bio) || null,
        onboarding_completed: true
      };
      if (memberType !== 'CORPORATE') {
        update.gender = requireValue('Gender', gender, existing.gender);
        update.date_of_birth = requireValue('Date of birth', date_of_birth, existing.date_of_birth);
      }
      if (memberType === 'FULL') {
        update.workplace = requireValue('Workplace', workplace, existing.workplace);
        update.specialty = requireValue('Professional field', specialty, existing.specialty);
      }
      if (memberType === 'STUDENT') {
        update.student_profile = {
          ...mergedStudent,
          university_name: requireValue('University', mergedStudent.university_name),
          field_of_study: requireValue('Programme or degree', mergedStudent.field_of_study),
          academic_year: Number(requireValue('Academic year', mergedStudent.academic_year)),
          student_id_number: requireValue('Student ID number', mergedStudent.student_id_number),
          expected_graduation_year: Number(requireValue('Expected graduation year', mergedStudent.expected_graduation_year))
        };
      }
      if (memberType === 'CORPORATE') {
        update.corporate_profile = {
          ...mergedCorporate,
          organization_name: requireValue('Organisation name', mergedCorporate.organization_name),
          org_type: requireValue('Organisation type', mergedCorporate.org_type),
          tin_number: requireValue('TIN number', mergedCorporate.tin_number),
          contact_person: requireValue('Contact person', mergedCorporate.contact_person),
          contact_title: requireValue('Contact title', mergedCorporate.contact_title),
          contact_phone: requireValue('Contact phone', mergedCorporate.contact_phone),
          contact_email: requireValue('Contact email', mergedCorporate.contact_email),
          staff_count: Number(requireValue('Staff count', mergedCorporate.staff_count)),
          headquarters_city: requireValue('Headquarters city', mergedCorporate.headquarters_city),
          services_description: requireValue('Services description', mergedCorporate.services_description)
        };
      }
      await dbUpdate('members', update, 'id', id);
      const members = await dbSelect('members', `id=eq.${id}&limit=1`);
      return res.status(200).json({ success: true, member: members[0] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[members]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
