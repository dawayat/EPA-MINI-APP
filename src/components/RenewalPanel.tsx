import React, { useRef, useState } from 'react';
import { CheckCircle2, CreditCard, UploadCloud } from 'lucide-react';
import { submitRenewal, uploadFile } from '../lib/api';
import { Member } from '../types';

interface RenewalPanelProps {
  member: Member;
  lang: 'EN' | 'AM';
  onToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const feeFor = (type: Member['membership_type']) => type === 'STUDENT' ? 150 : type === 'CORPORATE' ? 10000 : 1500;

export const RenewalPanel: React.FC<RenewalPanelProps> = ({ member, lang, onToast }) => {
  const [reference, setReference] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(member.renewal_request?.status === 'PENDING');
  const inputRef = useRef<HTMLInputElement>(null);
  const fee = feeFor(member.membership_type);

  const uploadReceipt = async (file?: File) => {
    if (!file) return;
    setSaving(true);
    try {
      setReceiptUrl(await uploadFile(file));
      onToast(lang === 'EN' ? 'CBE receipt attached.' : 'የCBE ደረሰኝ ተያይዟል።', 'success');
    } catch (error: any) {
      onToast(error.message || 'Could not upload the CBE receipt.', 'error');
    } finally { setSaving(false); }
  };

  const submit = async () => {
    if (!reference.trim() || !receiptUrl) { onToast('Enter the CBE transaction number and attach the receipt.', 'error'); return; }
    setSaving(true);
    try {
      const result = await submitRenewal(member.id, reference.trim(), receiptUrl, fee);
      if (!result.success) throw new Error(result.error || 'Could not submit the renewal.');
      setSubmitted(true);
      onToast(lang === 'EN' ? 'Renewal sent to EPA for CBE verification.' : 'የማደሻ ጥያቄዎ ለማረጋገጥ ተልኳል።', 'success');
    } catch (error: any) {
      onToast(error.message || 'Could not submit the renewal.', 'error');
    } finally { setSaving(false); }
  };

  if (submitted || member.renewal_request?.status === 'PENDING') {
    return <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300/50 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>Renewal under review.</strong> EPA will activate your membership after verifying the CBE payment.</span></div>;
  }

  return <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-black/20">
    <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-green-700 dark:text-[#d4ff00]" /><h4 className="text-xs font-black uppercase text-gray-900 dark:text-white">Renew with CBE — ETB {fee.toLocaleString()}</h4></div>
    <p className="mt-1 text-[11px] text-neutral-600 dark:text-neutral-400">Pay through CBE, then add the transaction number and payment receipt for EPA verification.</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
      <input value={reference} onChange={event => setReference(event.target.value)} placeholder="CBE transaction number" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#d4ff00] dark:border-white/10 dark:bg-black dark:text-white" />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={saving} className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-white dark:hover:bg-white/10"><UploadCloud className="h-4 w-4" />{receiptUrl ? 'Receipt attached' : 'Attach receipt'}</button>
      <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={event => void uploadReceipt(event.target.files?.[0])} />
    </div>
    <button type="button" onClick={() => void submit()} disabled={saving} className="mt-3 w-full rounded-xl bg-[#d4ff00] py-3 text-xs font-black uppercase tracking-wide text-black disabled:opacity-60">{saving ? 'Saving…' : 'Submit CBE renewal'}</button>
  </div>;
};
