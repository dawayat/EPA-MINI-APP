import { dbSelect, dbUpdate, cors } from './_db.js';

/**
 * POST /api/auth
 * Body: { identifier: string, password: string }
 * Returns: { success: true, member: {...} } | { success: false, error: string }
 * 
 * Simple phone + password login lookup against members table.
 * Passwords are stored as plaintext (simple hashing not available in edge runtime).
 * For production, upgrade to bcrypt via a standard Node.js function.
 */
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { identifier, phone, password, currentPassword, newPassword, memberId, telegramId, action } = req.body || {};
    const loginIdentifier = String(identifier || phone || '').trim();

    const findMember = async (value) => {
      if (value.includes('@')) return (await dbSelect('members', `email=eq.${encodeURIComponent(value.toLowerCase())}&limit=1`))[0];
      const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
      const last9 = cleanPhone.slice(-9);
      if (last9.length < 9) throw new Error('Enter a valid phone number or email address.');
      return (await dbSelect('members', `phone=like.*${last9}&limit=1`))[0];
    };

    if (action === 'bind-telegram') {
      if (!memberId || !telegramId) return res.status(400).json({ success: false, error: 'Member and Telegram identifiers are required.' });
      await dbUpdate('members', { telegram_id: String(telegramId) }, 'id', memberId);
      return res.status(200).json({ success: true });
    }

    if (action === 'change-password') {
      if (!loginIdentifier || !currentPassword || !newPassword) return res.status(400).json({ success: false, error: 'Current and new passwords are required.' });
      if (newPassword.length < 8) return res.status(400).json({ success: false, error: 'Use a password with at least 8 characters.' });
      const member = await findMember(loginIdentifier);
      if (!member || member.phone_password !== currentPassword) return res.status(401).json({ success: false, error: 'Your current password is incorrect.' });
      await dbUpdate('members', { phone_password: newPassword, must_change_password: false }, 'id', member.id);
      return res.status(200).json({ success: true, member: { ...member, phone_password: undefined, must_change_password: false } });
    }

    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, error: 'Email or phone number and password are required' });
    }

    if (action === 'login') {
      const member = await findMember(loginIdentifier);
      if (!member) return res.status(401).json({ success: false, error: 'No approved member was found with those credentials. Please check your email or phone number.' });
      if (!member.phone_password) {
        return res.status(401).json({ success: false, error: 'No password set for this account. Please contact EPA admin.' });
      }
      if (member.phone_password !== password) {
        return res.status(401).json({ success: false, error: 'Incorrect password.' });
      }
      return res.status(200).json({ success: true, member: { ...member, phone_password: undefined } });
    }

    return res.status(400).json({ success: false, error: 'Unknown action' });
  } catch (err) {
    console.error('[auth]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
