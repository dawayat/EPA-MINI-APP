export const validRecipientEmail = value => /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(String(value || '').trim());

export function announcementRecipients(members, contacts = [], selectedIds) {
  const recipients = new Map();
  const selected = Array.isArray(selectedIds) ? new Set(selectedIds) : null;
  for (const member of members) {
    if (selected && !selected.has(member.id)) continue;
    const email = String(member.email || '').trim().toLowerCase();
    if (!validRecipientEmail(email) || recipients.has(email)) continue;
    recipients.set(email, { ...member, email, name: [member.first_name, member.father_name].filter(Boolean).join(' ') || 'EPA Member' });
  }
  // Choosing specific members must never silently add other recipients.
  if (!selected) for (const contact of contacts) {
    const email = String(contact.email || '').trim().toLowerCase();
    if (contact.is_active === false || !validRecipientEmail(email) || recipients.has(email)) continue;
    recipients.set(email, { email, name: contact.display_name || 'EPA Member' });
  }
  return [...recipients.values()];
}

export function parseEmailContacts(text) {
  const records = new Map();
  for (const line of String(text || '').split(/\n|,(?=\s*(?:[^<\n]*<|[^\s@]+@))/)) {
    const match = line.match(/([^\s<>"\\,;]+@[^\s<>"\\,;]+\.[^\s<>"\\,;]+)/);
    if (!match) continue;
    const email = match[1].toLowerCase();
    if (!validRecipientEmail(email)) continue;
    const name = line.slice(0, match.index).replace(/^[\s\d.\-]+/, '').replace(/["<>\\]/g, '').trim();
    if (!records.has(email)) records.set(email, { email, display_name: name.includes('@') ? '' : name });
  }
  return [...records.values()];
}
