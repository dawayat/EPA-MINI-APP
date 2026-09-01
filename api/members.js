import { cachePublic, dbSelect, dbInsert, dbUpdate, noStore, cors } from './_db.js';
import { isEmailConfigured, memberInviteEmail, sendEmail } from './_email.js';

const importId = () => `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const token = () => `epa_tok_${Math.random().toString(36).slice(2, 10)}`;
const dateValue = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const safeMember = (member) => member ? { ...member, phone_password: undefined } : member;
const isCurrentlyActive = (member) => member?.status === 'ACTIVE' && (!member.expires_at || new Date(member.expires_at).getTime() >= Date.now());

const directorySelect = [
  'id', 'membership_number', 'verification_token',
  'first_name', 'father_name', 'grandfather_name', 'amharic_full_name',
  'city', 'membership_type', 'status', 'specialty', 'workplace', 'bio', 'cpd_points',
  'issued_at', 'expires_at', 'is_verified', 'license_number',
  'student_university:student_profile->>university_name',
  'student_field:student_profile->>field_of_study',
  'student_year:student_profile->>academic_year',
  'corporate_name:corporate_profile->>organization_name',
  'corporate_type:corporate_profile->>org_type',
  'corporate_city:corporate_profile->>headquarters_city'
].join(',');

const publicMemberSelect = [
  'id', 'membership_number', 'first_name', 'father_name', 'grandfather_name',
  'amharic_full_name', 'membership_type', 'specialty', 'workplace',
  'status', 'issued_at', 'expires_at', 'is_verified'
].join(',');

function directoryMember(row) {
  const {
    student_university, student_field, student_year,
    corporate_name, corporate_type, corporate_city,
    ...member
  } = row;
  if (student_university || student_field || student_year) {
    member.student_profile = {
      university_name: student_university || '',
      field_of_study: student_field || '',
      academic_year: Number(student_year) || 0
    };
  }
  if (corporate_name || corporate_type || corporate_city) {
    member.corporate_profile = {
      organization_name: corporate_name || '',
      org_type: corporate_type || '',
      headquarters_city: corporate_city || ''
    };
  }
  return member;
}

const adminMemberSelect = [
  'id', 'membership_number', 'verification_token', 'telegram_id',
  'first_name', 'father_name', 'grandfather_name', 'amharic_full_name',
  'email', 'city', 'membership_type', 'status', 'specialty', 'workplace',
  'cpd_points', 'issued_at', 'expires_at', 'is_verified', 'license_number',
  'email_verified', 'must_change_password', 'onboarding_completed',
  'renewal_status:renewal_request->>status',
  'renewal_transaction:renewal_request->payment->>transaction_number'
].join(',');

function adminMemberSummary(row) {
  const { renewal_status, renewal_transaction, ...member } = row;
  if (renewal_status || renewal_transaction) {
    member.renewal_request = {
      status: renewal_status || 'PENDING',
      payment: { transaction_number: renewal_transaction || '' }
    };
  }
  return member;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const view = String(req.query.view || '').trim();
      if (view === 'directory') {
        const rows = await dbSelect(
          'members',
          `status=eq.ACTIVE&select=${directorySelect}&order=created_at.desc`
        );
        // Directory data contains no contact details, credentials, payments, or
        // documents. Edge caching prevents repeated directory reads for visitors.
        cachePublic(res, 600);
        return res.status(200).json(rows.map(directoryMember));
      }

      if (view === 'verify') {
        const query = String(req.query.query || '').trim();
        if (!/^[A-Za-z0-9_-]{2,100}$/.test(query)) {
          return res.status(400).json({ success: false, error: 'Enter a valid membership reference.' });
        }
        const value = encodeURIComponent(query);
        const rows = await dbSelect(
          'members',
          `status=eq.ACTIVE&or=(verification_token.ilike.${value},membership_number.ilike.${value},id.ilike.${value})&select=${publicMemberSelect}&limit=1`
        );
        cachePublic(res, 300);
        return res.status(200).json(rows[0] || null);
      }

      // The member table can contain base64 profile photos and renewal
      // receipts. The admin list only needs a compact summary; sensitive
      // details are fetched by the action that needs them (for example,
      // approve-renewal fetches its one record above).
      const rows = await dbSelect('members', `select=${adminMemberSelect}&order=created_at.desc`);
      noStore(res);
      return res.status(200).json(rows.map(adminMemberSummary).map(safeMember));
    }

    if (req.method === 'POST') {
      const m = req.body;
      if (m.action === 'record-attendance') {
        const token = String(m.token || '').trim();
        const membershipNumber = String(m.membership_number || '').trim();
        const eventName = String(m.event_name || '').trim();
        if ((!token && !membershipNumber) || !eventName) return res.status(400).json({ success: false, error: 'A scanned ID and event name are required.' });
        let member = token ? (await dbSelect('members', `verification_token=eq.${encodeURIComponent(token)}&limit=1`))[0] : null;
        if (!member && membershipNumber) member = (await dbSelect('members', `membership_number=eq.${encodeURIComponent(membershipNumber)}&limit=1`))[0];
        if (!member) return res.status(404).json({ success: false, error: 'No EPA membership record was found for this ID.' });
        if (!isCurrentlyActive(member)) return res.status(409).json({ success: false, error: 'This EPA membership is expired, suspended, or inactive. Attendance was not recorded.', member: safeMember(member) });
        const attendance = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          member_id: member.id,
          membership_number: member.membership_number,
          event_name: eventName,
          checked_in_by: String(m.checked_in_by || 'EPA admin')
        };
        await dbInsert('member_attendance', attendance);
        return res.status(201).json({ success: true, member: safeMember(member), attendance: { ...attendance, checked_in_at: new Date().toISOString() } });
      }
      if (m.action === 'submit-renewal') {
        const memberId = String(m.memberId || '').trim();
        const reference = String(m.transaction_number || '').trim();
        const receipt = String(m.receipt_url || '').trim();
        if (!memberId || !reference || !receipt) return res.status(400).json({ success: false, error: 'CBE transaction reference and receipt are required for renewal.' });
        const member = (await dbSelect('members', `id=eq.${encodeURIComponent(memberId)}&limit=1`))[0];
        if (!member) return res.status(404).json({ success: false, error: 'Member account was not found.' });
        const renewal_request = {
          status: 'PENDING', requested_at: new Date().toISOString(),
          payment: { id: `renew-${Date.now()}`, amount: Number(m.amount || 1500), currency: 'ETB', provider: 'CBE', transaction_number: reference, payment_date: new Date().toISOString().slice(0, 10), status: 'PENDING', receipt_url: receipt }
        };
        await dbUpdate('members', { renewal_request }, 'id', memberId);
        return res.status(200).json({ success: true, renewal_request });
      }
      if (m.action === 'approve-renewal') {
        const memberId = String(m.memberId || '').trim();
        const member = (await dbSelect('members', `id=eq.${encodeURIComponent(memberId)}&limit=1`))[0];
        if (!member?.renewal_request || member.renewal_request.status !== 'PENDING') return res.status(400).json({ success: false, error: 'No pending renewal was found for this member.' });
        const currentExpiry = new Date(member.expires_at || 0);
        const base = Number.isNaN(currentExpiry.getTime()) || currentExpiry.getTime() < Date.now() ? new Date() : currentExpiry;
        const expiresAt = new Date(base); expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        const renewal_request = { ...member.renewal_request, status: 'APPROVED', reviewed_at: new Date().toISOString(), payment: { ...member.renewal_request.payment, status: 'VERIFIED' } };
        await dbUpdate('members', { status: 'ACTIVE', expires_at: expiresAt.toISOString(), renewal_request }, 'id', memberId);
        return res.status(200).json({ success: true, member: safeMember({ ...member, status: 'ACTIVE', expires_at: expiresAt.toISOString(), renewal_request }) });
      }
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
