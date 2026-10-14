import React, { useEffect, useState } from 'react';
import { adminHeaders } from '../lib/admin';
import { parseEmailContacts } from '../../shared/announcement-recipients.js';

export function AnnouncementContactsManager() {
  const [contacts, setContacts] = useState<{ email: string; display_name: string }[]>([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('Loading announcement contacts…');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/announcement-contacts', { headers: adminHeaders(), signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load contacts.');
      setContacts(data.contacts);
      setStatus('');
    }).catch(error => { if (!controller.signal.aborted) setStatus('Additional contacts are unavailable. Existing member delivery remains available.'); });
    return () => controller.abort();
  }, []);
  const parsed = parseEmailContacts(text);
  async function save() {
    if (!parsed.length) return;
    setSaving(true);
    try {
      const response = await fetch('/api/announcement-contacts', { method: 'POST', headers: { ...adminHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ contacts: parsed }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not add contacts.');
      const refreshed = await fetch('/api/announcement-contacts', { headers: adminHeaders() });
      const data = await refreshed.json();
      if (refreshed.ok) setContacts(data.contacts);
      setText('');
      setStatus(`${result.added.length} contacts added; ${result.skipped.length} duplicate addresses skipped. No emails were sent.`);
    } catch (error) { setStatus((error as Error).message); }
    finally { setSaving(false); }
  }
  return <details className="rounded-xl border border-emerald-200 bg-white p-3 dark:border-white/15 dark:bg-neutral-950">
    <summary className="cursor-pointer text-xs font-bold">Additional announcement contacts ({contacts.length})</summary>
    <p className="mt-3 text-xs leading-5 text-neutral-500">Included when you choose “All active members + contacts.” These are email contacts, with no member account or voting access. Duplicate addresses receive one email.</p>
    {contacts.length > 0 && <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-xs">{contacts.map(contact => <li key={contact.email}>{contact.display_name ? `${contact.display_name} · ` : ''}{contact.email}</li>)}</ul>}
    <label className="mt-3 block text-xs font-bold">Add email contacts<textarea value={text} onChange={event => setText(event.target.value)} rows={4} placeholder="Paste email addresses or Name <email> here, one per line." className="mt-2 w-full rounded-lg border border-gray-200 bg-white p-3 text-xs font-normal text-gray-900 dark:border-white/15 dark:bg-black dark:text-white" /></label>
    <button type="button" disabled={saving || !parsed.length} onClick={() => void save()} className="mt-2 rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{saving ? 'Saving contacts…' : `Add ${parsed.length || ''} contacts without sending email`}</button>
    {status && <p role="status" className="mt-2 text-xs leading-5 text-neutral-500">{status}</p>}
  </details>;
}
