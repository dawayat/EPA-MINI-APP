import { cors, dbInsert, dbSelect, noStore } from './_db.js';
import { requireAdmin } from './_admin.js';
import { validRecipientEmail } from '../shared/announcement-recipients.js';

export default async function handler(req, res) {
  cors(res);
  noStore(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    requireAdmin(req);
    if (req.method === 'GET') {
      const contacts = await dbSelect('announcement_email_contacts', 'is_active=eq.true&select=email,display_name&order=created_at.desc');
      return res.status(200).json({ contacts });
    }
    if (req.method === 'POST') {
      const rows = req.body?.contacts;
      if (!Array.isArray(rows) || !rows.length || rows.length > 200) return res.status(400).json({ error: 'Provide between 1 and 200 announcement contacts.' });
      const normalized = new Map();
      for (const row of rows) {
        const email = String(row.email || '').trim().toLowerCase();
        if (!validRecipientEmail(email)) return res.status(400).json({ error: 'One of the contact emails is invalid. No contacts were added.' });
        normalized.set(email, { email, display_name: String(row.display_name || '').trim().slice(0, 150) });
      }
      const existing = await dbSelect('announcement_email_contacts', 'select=email');
      const known = new Set(existing.map(contact => contact.email.toLowerCase()));
      const members = await dbSelect('members', 'status=eq.ACTIVE&email=not.is.null&select=email');
      for (const member of members) known.add(String(member.email).trim().toLowerCase());
      const added = [];
      const newContacts = [];
      const skipped = [];
      for (const contact of normalized.values()) {
        if (known.has(contact.email)) { skipped.push(contact.email); continue; }
        newContacts.push(contact);
        added.push(contact.email);
      }
      if (newContacts.length) await dbInsert('announcement_email_contacts', newContacts);
      return res.status(201).json({ success: true, added, skipped });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
}
