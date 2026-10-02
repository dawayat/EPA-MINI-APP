import { dbSelect, dbInsert, dbUpdate, cors } from './_db.js';
import { authenticateAdmin, createAdminSession } from './_admin.js';
import { createMemberSession } from './_member_session.js';
import { isEmailConfigured, sendEmail, passwordResetEmail } from './_email.js';

/**
 * POST /api/auth
 * Handles admin-login, telegram-login, bind-telegram, change-password,
 * forgot-password-request, forgot-password-reset, and standard login.
 */
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { identifier, phone, password, currentPassword, newPassword, memberId, telegramId, action, username, code } = req.body || {};
    const loginIdentifier = String(identifier || phone || '').trim();

    if (action === 'admin-login') {
      if (!authenticateAdmin(String(username || '').trim(), String(password || ''))) {
        return res.status(401).json({ success: false, error: 'Invalid administrator username or password.' });
      }
      return res.status(200).json({ success: true, session: createAdminSession() });
    }

    const findMember = async (value) => {
      if (value.includes('@')) return (await dbSelect('members', `email=eq.${encodeURIComponent(value.toLowerCase())}&limit=1`))[0];
      const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
      const last9 = cleanPhone.slice(-9);
      if (last9.length < 9) throw new Error('Enter a valid phone number or email address.');
      return (await dbSelect('members', `phone=like.*${last9}&limit=1`))[0];
    };

    if (action === 'telegram-login') {
      const cleanTelegramId = String(telegramId || '').trim();
      if (!/^\d+$/.test(cleanTelegramId)) {
        return res.status(400).json({ success: false, error: 'A valid Telegram account is required.' });
      }
      const member = (await dbSelect('members', `telegram_id=eq.${encodeURIComponent(cleanTelegramId)}&status=eq.ACTIVE&limit=1`))[0];
      if (!member) {
        return res.status(401).json({ success: false, error: 'No active EPA member account is linked to this Telegram profile yet.' });
      }
      return res.status(200).json({ success: true, member: { ...member, phone_password: undefined }, session: createMemberSession(member.id) });
    }

    if (action === 'bind-telegram') {
      const cleanTelegramId = String(telegramId || '').trim();
      if (!memberId || !/^\d+$/.test(cleanTelegramId)) return res.status(400).json({ success: false, error: 'Member and Telegram identifiers are required.' });
      const member = (await dbSelect('members', `id=eq.${encodeURIComponent(memberId)}&limit=1`))[0];
      if (!member) return res.status(404).json({ success: false, error: 'Member account was not found.' });
      if (member.telegram_id && String(member.telegram_id) !== cleanTelegramId) {
        return res.status(409).json({ success: false, error: 'This EPA account is already linked to another Telegram profile. Please contact EPA support if this needs to change.' });
      }
      await dbUpdate('members', { telegram_id: cleanTelegramId }, 'id', memberId);
      return res.status(200).json({ success: true, member: { ...member, telegram_id: cleanTelegramId, phone_password: undefined } });
    }

    if (action === 'change-password') {
      if (!loginIdentifier || !currentPassword || !newPassword) return res.status(400).json({ success: false, error: 'Current and new passwords are required.' });
      if (newPassword.length < 8) return res.status(400).json({ success: false, error: 'Use a password with at least 8 characters.' });
      const member = await findMember(loginIdentifier);
      if (!member || member.phone_password !== currentPassword) return res.status(401).json({ success: false, error: 'Your current password is incorrect.' });
      await dbUpdate('members', { phone_password: newPassword, must_change_password: false }, 'id', member.id);
      return res.status(200).json({ success: true, member: { ...member, phone_password: undefined, must_change_password: false }, session: createMemberSession(member.id) });
    }

    if (action === 'forgot-password-request') {
      if (!loginIdentifier) return res.status(400).json({ success: false, error: 'Enter your registered email address or phone number.' });
      if (!isEmailConfigured()) return res.status(503).json({ success: false, error: 'Email service is currently offline. Please contact the EPA admin.' });
      const member = await findMember(loginIdentifier);
      if (!member) {
        return res.status(404).json({ success: false, error: 'No EPA member account was found with that email or phone number.' });
      }
      if (!member.email) {
        return res.status(400).json({ success: false, error: 'Your account does not have a registered email address. Please contact the EPA Secretariat for assistance.' });
      }

      const email = member.email.trim().toLowerCase();
      const resetCode = String(Math.floor(100000 + Math.random() * 900000));
      const verificationId = `pwd-reset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      await dbInsert('email_verifications', {
        id: verificationId,
        email,
        code: resetCode,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      });

      const emailPayload = passwordResetEmail(`${member.first_name} ${member.father_name}`, resetCode);
      await sendEmail({ to: email, ...emailPayload });

      // Mask email for user privacy (e.g. j***e@domain.com)
      const parts = email.split('@');
      const namePart = parts[0] || '';
      const domainPart = parts[1] || '';
      const maskedName = namePart.length <= 2 ? namePart[0] + '***' : namePart.slice(0, 2) + '***' + namePart.slice(-1);
      const maskedEmail = `${maskedName}@${domainPart}`;

      return res.status(200).json({
        success: true,
        maskedEmail,
        message: `A 6-digit password reset code has been sent to ${maskedEmail}.`
      });
    }

    if (action === 'forgot-password-reset') {
      if (!loginIdentifier) return res.status(400).json({ success: false, error: 'Email or phone number is required.' });
      const submittedCode = String(code || '').trim();
      if (!/^\d{6}$/.test(submittedCode)) return res.status(400).json({ success: false, error: 'Enter the 6-digit confirmation code.' });
      if (!newPassword || newPassword.length < 8) return res.status(400).json({ success: false, error: 'New password must be at least 8 characters long.' });

      const member = await findMember(loginIdentifier);
      if (!member) return res.status(404).json({ success: false, error: 'Member record not found.' });
      if (!member.email) return res.status(400).json({ success: false, error: 'No email address registered for this account.' });

      const email = member.email.trim().toLowerCase();
      const rows = await dbSelect('email_verifications', `email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=10`);
      const now = Date.now();
      const record = rows.find(r => String(r.code || '') === submittedCode && new Date(r.expires_at).getTime() >= now && !r.verified_at);

      if (!record) {
        return res.status(400).json({ success: false, error: 'That reset code is invalid or has expired. Please request a new code.' });
      }

      // Mark verification code as used
      await dbUpdate('email_verifications', { verified_at: new Date().toISOString() }, 'id', record.id);

      // Update member password and remove must_change_password flag
      await dbUpdate('members', { phone_password: newPassword, must_change_password: false }, 'id', member.id);

      return res.status(200).json({
        success: true,
        member: { ...member, phone_password: undefined, must_change_password: false },
        session: createMemberSession(member.id),
        message: 'Password reset successfully! Logging you in...'
      });
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
      return res.status(200).json({ success: true, member: { ...member, phone_password: undefined }, session: createMemberSession(member.id) });
    }

    return res.status(400).json({ success: false, error: 'Unknown action' });
  } catch (err) {
    console.error('[auth]', err.message);
    return res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
}
