import { dbInsert, dbSelect, dbUpdate, cors } from './_db.js';
import { applicationReceivedEmail, applicationStatusEmail, isEmailConfigured, memberInviteEmail, sendEmail, verificationEmail } from './_email.js';

const validEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
const code = () => String(Math.floor(100000 + Math.random() * 900000));
const id = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    const { action, email, name, applicationNumber, status, note, membershipNumber, temporaryPassword, verificationCode } = req.body || {};
    if (!isEmailConfigured()) return res.status(503).json({ success: false, error: 'Email delivery is not configured yet.' });
    if (!validEmail(email)) return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    const address = email.trim().toLowerCase();

    if (action === 'send-verification') {
      const verificationCode = code();
      await dbInsert('email_verifications', { id: id('email'), email: address, code: verificationCode, expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), created_at: new Date().toISOString() });
      const message = verificationEmail(name, verificationCode);
      await sendEmail({ to: address, ...message });
      return res.status(200).json({ success: true });
    }
    if (action === 'verify-email') {
      const submittedCode = String(verificationCode || '').trim();
      if (!/^\d{6}$/.test(submittedCode)) return res.status(400).json({ success: false, error: 'Enter the six-digit verification code from the email.' });

      // Do not filter only unverified rows. The client verifies the code before
      // creating the application; if that later insert fails, the applicant
      // must be able to retry with the same still-valid code instead of being
      // locked out by a code already marked verified.
      const rows = await dbSelect('email_verifications', `email=eq.${encodeURIComponent(address)}&order=created_at.desc&limit=10`);
      const now = Date.now();
      const record = rows.find(candidate => (
        String(candidate.code || '') === submittedCode
        && new Date(candidate.expires_at).getTime() >= now
      ));
      if (!record) return res.status(400).json({ success: false, error: 'That verification code is invalid or has expired.' });
      if (!record.verified_at) await dbUpdate('email_verifications', { verified_at: new Date().toISOString() }, 'id', record.id);
      return res.status(200).json({ success: true, alreadyVerified: Boolean(record.verified_at) });
    }
    let message;
    if (action === 'application-received') message = applicationReceivedEmail(name, applicationNumber);
    if (action === 'application-status') message = applicationStatusEmail(name, applicationNumber, status, note);
    if (action === 'member-invite') message = memberInviteEmail(name, membershipNumber, temporaryPassword);
    if (!message) return res.status(400).json({ success: false, error: 'Unknown email action.' });
    await sendEmail({ to: address, ...message });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[email]', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
