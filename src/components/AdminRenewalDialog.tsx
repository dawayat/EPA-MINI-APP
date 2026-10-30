import React, { useState } from 'react';
import { Member } from '../types';
import { adminHeaders } from '../lib/admin';
import { renewalExpiry } from '../../shared/membership-renewal.js';

export function AdminRenewalDialog({ member, review = false, onSaved, onToast, renderReceipt }: {
  member: Member; review?: boolean; onSaved: () => Promise<void>;
  onToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  renderReceipt: (url: string) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<Member['renewal_request']>();
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Addis_Ababa' }));
  const [amount, setAmount] = useState(member.membership_type === 'STUDENT' ? '150' : member.membership_type === 'CORPORATE' ? '10000' : '1500');
  async function show() {
    setOpen(true); setError('');
    if (!review) return;
    setBusy(true); setLoaded(false); setDetail(undefined);
    try {
      const response = await fetch(`/api/members?view=renewal&id=${encodeURIComponent(member.id)}`, { headers: adminHeaders(), cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load receipt.');
      setDetail(result); setLoaded(true);
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not load receipt.'); }
    finally { setBusy(false); }
  }
  return <>
    <button type="button" onClick={() => void show()} className="px-3 py-2 rounded-lg bg-[#d4ff00] text-black text-xs font-bold">{review ? 'Review renewal' : 'Renew for member'}</button>
    {open && <div className="fixed inset-0 z-[150] bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Membership renewal">
      <form className="w-full max-w-xl max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-neutral-900 text-gray-900 dark:text-white p-6 space-y-4" onSubmit={async event => {
        event.preventDefault(); setBusy(true); setError('');
        try {
          const response = await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json', ...adminHeaders() }, body: JSON.stringify({ action: review ? 'approve-renewal' : 'admin-renew', memberId: member.id, transaction_number: reference, payment_date: date, amount: Number(amount), expected_expires_at: member.expires_at }) });
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error(result.error || 'Could not renew membership.');
          setOpen(false);
          onToast(result.emailed ? 'Membership renewed. Approval email sent.' : `Membership renewed. Approval email was not sent: ${result.emailError || 'Delivery failed.'}`, result.emailed ? 'success' : 'info');
          await onSaved();
        } catch (error) { setError(error instanceof Error ? error.message : 'Could not renew membership.'); }
        finally { setBusy(false); }
      }}>
        <h2 className="text-lg font-bold">{review ? 'Review renewal payment' : 'Renew for member'}</h2>
        <p>{member.first_name} {member.father_name} · {member.membership_number}</p>
        <p className="text-sm">After approval: Active until <strong>{new Date(renewalExpiry(member.expires_at)).toLocaleDateString('en-GB')}</strong>. One year is added from today or the existing expiry, whichever is later. The original issue date stays the same.</p>
        {review ? <>{busy && !loaded && <p role="status">Loading receipt…</p>}{loaded && <><p>Reference: {detail?.payment?.transaction_number || 'Not provided'}</p><p>Paid: {detail?.payment?.payment_date} · ETB {detail?.payment?.amount}</p>{detail?.payment?.receipt_url ? renderReceipt(detail.payment.receipt_url) : <p className="text-amber-600">No receipt is attached. Verify payment independently before approving.</p>}</>}</> : <>
          <p className="text-sm">Record a payment you have already verified. The member does not need to submit a website renewal request.</p>
          <label className="block text-sm">Payment reference<input required maxLength={160} value={reference} onChange={e => setReference(e.target.value)} className="block w-full mt-1 rounded-lg border bg-transparent p-2" /></label>
          <label className="block text-sm">Payment date<input required type="date" max={new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Addis_Ababa' })} value={date} onChange={e => setDate(e.target.value)} className="block w-full mt-1 rounded-lg border bg-transparent p-2" /></label>
          <label className="block text-sm">Amount (ETB)<input required type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="block w-full mt-1 rounded-lg border bg-transparent p-2" /></label>
        </>}
        {error && <p role="alert" className="text-red-600">{error}</p>}
        <div className="flex gap-3"><button type="submit" disabled={busy || (review && !loaded)} className="bg-[#d4ff00] text-black rounded-lg px-4 py-2 font-bold disabled:opacity-50">{busy ? 'Please wait…' : 'Confirm payment and renew'}</button><button type="button" disabled={busy} onClick={() => setOpen(false)}>Cancel</button>{review && !loaded && !busy && <button type="button" onClick={() => void show()}>Retry</button>}</div>
      </form>
    </div>}
  </>;
}
