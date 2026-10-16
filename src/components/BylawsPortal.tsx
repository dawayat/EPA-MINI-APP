import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronRight, ShieldCheck, X, LockKeyhole, RefreshCw } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Member } from '../types';
import { adminHeaders } from '../lib/admin';
import type { MemberSession } from '../lib/api';
import './bylaws.css';

const endpoint = '/api/announcements?action=bylaws';
async function request(url: string, headers: Record<string, string>, body?: object) {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(12000), headers: { ...headers, 'Content-Type': 'application/json' }, ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to load the articles.');
  return data;
}
type ArticleDocument = { paragraphs: { text: string; style: string | null; label: string; level: number }[]; watermark: string; issuedAt: string };

function Reader({ member, session, onClose, lang }: { member: Member; session: MemberSession; onClose: () => void; lang: 'EN' | 'AM' }) {
  const [documentData, setDocumentData] = useState<ArticleDocument | null>(null);
  const [message, setMessage] = useState('Loading your reading session…');
  const [paused, setPaused] = useState(false);
  const [section, setSection] = useState(0);
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const contentArea = useRef<HTMLDivElement>(null);
  const lastEvent = useRef<Record<string, number>>({});
  const url = `${endpoint}&memberId=${encodeURIComponent(member.id)}`;
  useEffect(() => {
    let active = true;
    let expiryTimer: ReturnType<typeof setTimeout>;
    const headers = { Authorization: `Bearer ${session.token}` };
    const event = (name: string) => {
      if (Date.now() - (lastEvent.current[name] || 0) < 5000) return;
      lastEvent.current[name] = Date.now();
      void request(url, headers, { event: name }).catch(() => {});
    };
    const refresh = async (initial = false) => {
      try {
        const data = await request(`${url}&view=content`, headers);
        if (!active) return;
        setDocumentData(data);
        clearTimeout(expiryTimer);
        // Fail closed if the next permission check stalls or the device loses connectivity.
        expiryTimer = setTimeout(() => { setDocumentData(null); setMessage('Connection interrupted. Close and reopen the reader to verify access.'); }, 25000);
        if (initial) event('opened');
      } catch (error: any) {
        if (active) { setDocumentData(null); setMessage(error.message); }
      }
    };
    void refresh(true);
    const interval = setInterval(() => void refresh(), 15000);
    const previousFocus = window.document.activeElement as HTMLElement | null;
    const previousOverflow = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const visibility = () => { setPaused(window.document.hidden); if (!window.document.hidden) void refresh(); };
    const blur = () => setPaused(true);
    const focus = () => { setPaused(false); void refresh(); };
    const keyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab') {
        const items = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select, a[href], [tabindex="0"]');
        if (items?.length) {
          const first = items[0], last = items[items.length - 1];
          if (e.shiftKey && window.document.activeElement === first) { e.preventDefault(); last.focus(); }
          if (!e.shiftKey && window.document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ['p', 's', 'c', 'x'].includes(key)) {
        e.preventDefault(); event(key === 'p' ? 'print_attempt' : key === 's' ? 'save_attempt' : 'copy_attempt');
      }
      if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(key))) {
        setPaused(true); event('capture_shortcut');
      }
    };
    const print = () => event('print_attempt');
    window.addEventListener('keydown', keyboard, true);
    window.addEventListener('blur', blur);
    window.addEventListener('focus', focus);
    window.addEventListener('beforeprint', print);
    window.document.addEventListener('visibilitychange', visibility);
    return () => {
      active = false; clearInterval(interval); clearTimeout(expiryTimer);
      window.removeEventListener('keydown', keyboard, true);
      window.removeEventListener('blur', blur); window.removeEventListener('focus', focus);
      window.removeEventListener('beforeprint', print);
      window.document.removeEventListener('visibilitychange', visibility);
      window.document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [url, session.token, onClose]);

  const paragraphs = documentData?.paragraphs.filter(p => !p.style?.startsWith('TOC') && p.text !== 'Table of Content') || [];
  const headings = paragraphs.map((p, index) => ({ ...p, index })).filter(p => p.style === 'Heading1');
  const jump = (index: number) => { setSection(index); contentArea.current?.querySelector(`#bylaws-p-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return createPortal(<div className="bylaws-overlay" onContextMenu={e => e.preventDefault()} onCopy={e => e.preventDefault()} onCut={e => e.preventDefault()} onDragStart={e => e.preventDefault()}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="bylaws-title" className="bylaws-dialog bg-white dark:bg-[#121214] text-neutral-900 dark:text-white">
      <header className="flex items-start justify-between gap-4 border-b border-black/10 dark:border-white/10 p-5 sm:p-7">
        <div><div className="text-[10px] font-black tracking-[.2em] uppercase text-green-700 dark:text-[#d4ff00]">EPA · Governance library</div><h2 id="bylaws-title" className="font-syne text-xl sm:text-2xl font-black mt-2">{lang === 'AM' ? 'የማኅበሩ መተዳደሪያ ደንብ' : 'Articles of Association'}</h2><p className="text-xs text-neutral-500 mt-2">September 2026 · In-portal reading · Personal watermarked copy</p></div>
        <button ref={closeButton} onClick={onClose} aria-label="Close articles" className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10"><X size={22} /></button>
      </header>
      {documentData && <div className="px-5 py-3 border-b border-black/10 dark:border-white/10"><label className="text-xs font-bold flex items-center gap-3"><BookOpen size={16} />Jump to article<select aria-label="Jump to article" value={section} onChange={e => jump(Number(e.target.value))} className="min-w-0 flex-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 p-2 text-xs"><option value={0}>Cover</option>{headings.map(h => <option key={h.index} value={h.index}>{h.text}</option>)}</select></label></div>}
      <div className="px-5 py-3 text-[11px] text-neutral-500 border-b border-black/10 dark:border-white/10">Copying, printing and saving are restricted. Reader activity is logged. Device screenshots and recordings cannot be reliably detected or blocked.</div>
      <div ref={contentArea} className="bylaws-scroll" tabIndex={0} aria-label="Articles content">
        {!documentData ? <div role="status" className="p-10 text-center text-sm text-neutral-500">{message}</div> : paused ? <div className="p-12 text-center"><LockKeyhole className="mx-auto mb-4" /><h3 className="font-bold">Reading paused</h3><p className="text-sm text-neutral-500 mt-2">The document is hidden while this window is inactive.</p><button className="bylaws-button mt-5" onClick={() => setPaused(false)}>Resume reading</button></div> : <article className="bylaws-paper">
          {paragraphs.map((p, i) => <section id={`bylaws-p-${i}`} key={i} className="bylaws-paragraph">
            <span aria-hidden="true" className="bylaws-watermark">EPA · {documentData.watermark} · {new Date(documentData.issuedAt).toLocaleDateString()}</span>
            {p.style === 'Heading1' ? <h3 className="font-syne font-black text-xl mt-8 mb-4">{p.label && <span>{p.label} </span>}{p.text}</h3> : <p style={{ paddingLeft: `${Math.min(p.level, 3) * .45}rem` }} className="leading-[1.9] text-[15px] mb-4 whitespace-pre-wrap">{p.label && <span className="font-bold mr-2">{p.label}</span>}{p.text}</p>}
          </section>)}
        </article>}
      </div>
      <footer className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-t border-black/10 dark:border-white/10">Ethiopian Psychologists’ Association · Members’ reading room</footer>
    </div>
  </div>, document.body);
}

export const BylawsPortal: React.FC<{ member: Member; session: MemberSession | null; lang: 'EN' | 'AM' }> = ({ member, session, lang }) => {
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!session) return;
    let active = true;
    const check = () => request(`${endpoint}&memberId=${encodeURIComponent(member.id)}`, { Authorization: `Bearer ${session.token}` }).then(data => { if (active) { setAvailable(data.available); if (!data.available) setOpen(false); } }).catch(() => { if (active) { setAvailable(false); setOpen(false); } });
    void check(); const interval = setInterval(check, 15000);
    return () => { active = false; clearInterval(interval); };
  }, [member.id, session?.token]);
  if (!available || !session) return null;
  return <><button onClick={() => setOpen(true)} className="bylaws-banner w-full text-left mb-6 group">
    <span className="rounded-2xl bg-[#d4ff00] text-black p-3"><BookOpen size={25} /></span><span className="flex-1"><span className="block text-[10px] font-black uppercase tracking-[.2em] text-[#d4ff00] mb-1">Governance · Now available</span><span className="block text-xl font-black font-syne">{lang === 'AM' ? 'የማኅበሩ መተዳደሪያ ደንብ' : 'Our association. Our shared foundation.'}</span><span className="block text-xs text-neutral-400 mt-2">{lang === 'AM' ? 'የማኅበሩን ደንብ እዚህ ያንብቡ።' : 'Read the EPA Articles of Association inside your portal.'}</span></span><ChevronRight className="shrink-0 group-hover:translate-x-1 transition-transform" /></button>{open && <Reader member={member} session={session} lang={lang} onClose={close} />}</>;
}

type Activity = { id: string; member_id: string | null; actor: string; event: string; created_at: string };
type Controls = { enabled: boolean; access: { member_id: string }[]; events: Activity[] };
const eventNames: Record<string, string> = { opened: 'Opened reader', copy_attempt: 'Copy shortcut observed', print_attempt: 'Print action observed', save_attempt: 'Save shortcut observed', capture_shortcut: 'Capture shortcut observed (unverified)', activated: 'Activated for all', deactivated: 'Deactivated for all', restricted: 'Access restricted', restored: 'Access restored' };
export function BylawsAdmin({ members }: { members: Member[] }) {
  const [data, setData] = useState<Controls | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const load = useCallback(async () => { setData(await request(`${endpoint}&admin=true`, adminHeaders())); }, []);
  useEffect(() => { let active = true; void request(`${endpoint}&admin=true`, adminHeaders()).then(value => { if (active) setData(value); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, []);
  const change = async (body: object) => { setBusy(true); setError(''); try { await request(`${endpoint}&admin=true`, adminHeaders(), body); await load(); } catch (e: any) { setError(e.message); } finally { setBusy(false); } };
  const restricted = new Set(data?.access.map(a => a.member_id));
  const selectedMember = members.find(m => m.id === selected);
  const matching = members.filter(m => `${m.first_name} ${m.father_name} ${m.membership_number}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="space-y-6">
    <div className="bylaws-banner"><ShieldCheck size={32} className="text-[#d4ff00] shrink-0" /><div className="flex-1"><p className="text-[10px] uppercase tracking-[.2em] text-[#d4ff00] font-black">Governance library · Admin controls</p><h2 className="font-syne text-2xl font-black mt-2">Articles of Association</h2><p className="text-xs text-neutral-400 mt-2">September 2026 · Student, full member and corporate portals</p></div></div>
    {error && <p role="alert" className="p-4 rounded-xl bg-red-500/10 text-red-600 text-sm">{error}</p>}
    <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 bg-white dark:bg-white/5"><div className="flex flex-wrap items-center justify-between gap-4"><div><h3 className="font-black">Member visibility <span className="text-xs ml-2 text-neutral-500">{data ? data.enabled ? 'LIVE' : 'HIDDEN' : 'Loading…'}</span></h3><p className="text-sm text-neutral-500 mt-2">Activation adds a prominent reading card to every member portal.</p></div><button disabled={!data || busy} className="bylaws-button disabled:opacity-40" onClick={() => change({ operation: 'activation', enabled: !data?.enabled })}>{data?.enabled ? 'Deactivate for everyone' : 'Activate for all portals'}</button></div><p className="text-xs text-neutral-500 mt-4">Changes reach open readers within 15 seconds under normal connectivity. Access closes if verification fails. Previously viewed content cannot be recalled.</p></div>
    <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 space-y-4"><h3 className="font-black">Individual access</h3><input aria-label="Find member" placeholder="Search by name or membership number" value={query} onChange={e => setQuery(e.target.value)} className="w-full rounded-xl border border-black/10 dark:border-white/10 p-3 bg-transparent text-sm" /><div className="flex flex-wrap gap-3"><select aria-label="Select member" value={selected} onChange={e => setSelected(e.target.value)} className="min-w-0 flex-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 p-3 text-sm"><option value="">Choose a member</option>{matching.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.father_name} · {m.membership_number}{restricted.has(m.id) ? ' · Restricted' : ''}</option>)}</select><button disabled={busy || !data || !selectedMember} className="bylaws-button disabled:opacity-40" onClick={() => change({ operation: 'access', memberId: selected, restricted: !restricted.has(selected) })}>{restricted.has(selected) ? 'Restore access' : 'Restrict access'}</button></div><p className="text-xs text-neutral-500">{restricted.size} member(s) restricted. Restrictions apply only to the articles reader.</p></div>
    <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6"><div className="flex items-center justify-between mb-4"><h3 className="font-black">Reader activity · Latest 100 events</h3><button aria-label="Refresh activity" disabled={busy} onClick={async () => { setBusy(true); try { await load(); setError(''); } catch (e: any) { setError(e.message); } finally { setBusy(false); } }} className="p-2"><RefreshCw size={18} /></button></div><p className="text-xs text-neutral-500 mb-5">Shortcut events are browser reports, not proof of a screenshot or recording. Browsers cannot reliably detect or block device capture. Review evidence before restricting a member.</p><div className="max-h-96 overflow-auto">{data?.events.length === 0 && <p className="text-sm text-neutral-500 py-8 text-center">No reading activity yet.</p>}{data?.events.map(e => <div key={e.id} className="border-t border-black/5 dark:border-white/10 py-4 flex flex-wrap items-center justify-between gap-2 text-sm"><div><p className="font-bold">{e.actor}</p><p className="text-xs text-neutral-500 mt-1">{eventNames[e.event] || e.event} · {new Date(e.created_at).toLocaleString()}</p></div>{e.member_id && <button disabled={busy} onClick={() => change({ operation: 'access', memberId: e.member_id, restricted: !restricted.has(e.member_id!) })} className="text-xs font-bold underline disabled:opacity-40">{restricted.has(e.member_id) ? 'Restore access' : 'Restrict access'}</button>}</div>)}</div></div>
  </section>;
}
