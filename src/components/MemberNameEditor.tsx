import React, { useState } from 'react';
import { Member } from '../types';

export type MemberNames = Pick<Member, 'first_name' | 'father_name' | 'grandfather_name' | 'amharic_full_name'>;

export function MemberNameEditor({ member, onSave, onToast }: {
  member: Member;
  onSave: (names: MemberNames) => Promise<void>;
  onToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [names, setNames] = useState<MemberNames>({ first_name: '', father_name: '', grandfather_name: '', amharic_full_name: '' });
  const fields = [['first_name', 'First name'], ['father_name', 'Father name'], ['grandfather_name', 'Grandfather name (optional)'], ['amharic_full_name', 'Amharic full name (optional)']] as const;
  return <span className="inline-block">
    <button type="button" className="px-3 py-2 rounded-lg text-xs font-bold border border-gray-300 dark:border-white/20" onClick={() => { setNames({ first_name: member.first_name, father_name: member.father_name, grandfather_name: member.grandfather_name || '', amharic_full_name: member.amharic_full_name || '' }); setOpen(true); }}>Edit name</button>
    {open && <div className="fixed inset-0 z-[150] bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Edit member name">
      <form className="w-full max-w-md max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-neutral-900 text-gray-900 dark:text-white p-6 space-y-4" onSubmit={async event => {
        event.preventDefault(); setBusy(true);
        try { await onSave(names); setOpen(false); onToast('Name updated.', 'success'); }
        catch (error) { onToast(error instanceof Error ? error.message : 'Could not save name.', 'error'); }
        finally { setBusy(false); }
      }}>
        <h2 className="text-lg font-bold">Edit member name</h2>
        {fields.map(([key, label], index) => <label key={key} className="block text-sm">{label}<input autoFocus={index === 0} required={index < 2} maxLength={160} value={names[key] || ''} onChange={event => setNames(previous => ({ ...previous, [key]: event.target.value }))} className="block mt-1 w-full rounded-lg border border-gray-300 dark:border-white/20 bg-transparent p-2" /></label>)}
        <div className="flex gap-3"><button disabled={busy} type="submit" className="bg-[#d4ff00] text-black rounded-lg px-4 py-2 font-bold disabled:opacity-50">{busy ? 'Saving…' : 'Save name'}</button><button disabled={busy} type="button" onClick={() => setOpen(false)}>Cancel</button></div>
      </form>
    </div>}
  </span>;
}
