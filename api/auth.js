import { dbSelect, dbUpdate, cors } from './_db.js';

/**
 * POST /api/auth
 * Body: { phone: string, password: string }
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
    const { phone, password, action } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, error: 'Phone and password are required' });
    }

    // Clean the phone number (strip spaces, dashes)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    if (action === 'login') {
      // Find member by phone number
      const rows = await dbSelect('members', `phone=eq.${encodeURIComponent(cleanPhone)}`);
      
      if (!rows || rows.length === 0) {
        // Try with leading zero variant (e.g. 0911... vs 911...)
        const altPhone = cleanPhone.startsWith('0') ? cleanPhone.slice(1) : '0' + cleanPhone;
        const altRows = await dbSelect('members', `phone=eq.${encodeURIComponent(altPhone)}`);
        
        if (!altRows || altRows.length === 0) {
          return res.status(401).json({ success: false, error: 'No approved member found with this phone number. Please contact EPA.' });
        }
        
        const member = altRows[0];
        if (!member.phone_password) {
          return res.status(401).json({ success: false, error: 'No password set for this account. Please contact EPA admin.' });
        }
        if (member.phone_password !== password) {
          return res.status(401).json({ success: false, error: 'Incorrect password.' });
        }
        return res.status(200).json({ success: true, member });
      }

      const member = rows[0];
      if (!member.phone_password) {
        return res.status(401).json({ success: false, error: 'No password set for this account. Please contact EPA admin.' });
      }
      if (member.phone_password !== password) {
        return res.status(401).json({ success: false, error: 'Incorrect password.' });
      }
      return res.status(200).json({ success: true, member });
    }

    return res.status(400).json({ success: false, error: 'Unknown action' });
  } catch (err) {
    console.error('[auth]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
