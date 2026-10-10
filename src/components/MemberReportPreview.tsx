import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import type { Member } from '../types';
import { memberPhotoUrl } from '../lib/media';
import { reportImageDataUrl } from '../lib/reportImages';
import './member-report.css';

const fullName = (m: Member) => [m.first_name, m.father_name, m.grandfather_name].filter(Boolean).join(' ');
const date = (value?: string) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Addis_Ababa' }) : 'Not recorded';
const value = (text?: string | number) => text === undefined || text === '' ? 'Not recorded' : text;

function ReportPhoto({ member }: { member: Member }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const source = member.photo_url || memberPhotoUrl(member.id);
  useEffect(() => {
    let active = true;
    setLoading(true); setPhoto(null);
    void reportImageDataUrl(source).then(result => { if (active) { setPhoto(result); setLoading(false); } });
    return () => { active = false; };
  }, [source]);
  return photo ? <img className="report-photo" src={photo} alt={fullName(member)} onError={() => setPhoto(null)} /> : <div className="report-photo report-initials" data-photo-loading={loading || undefined}>{[member.first_name, member.father_name].map(n => n?.[0] || '').join('')}<small>{loading ? 'Loading' : 'No photo'}</small></div>;
}

export function MemberReportPreview({ members, onClose }: { members: Member[]; onClose: () => void }) {
  // Freeze the directory at opening so the preview and export describe the same snapshot.
  const [snapshot] = useState(() => ({ members: [...members].sort((a, b) => fullName(a).localeCompare(fullName(b))), generated: new Date() }));
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const busy = Boolean(progress);
  const pages = Array.from({ length: Math.ceil(snapshot.members.length / 3) }, (_, i) => snapshot.members.slice(i * 3, i * 3 + 3));

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);

  async function download() {
    if (!root.current || busy) return;
    setError(''); setProgress('Preparing report…');
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
      await document.fonts.ready;
      // Photo fetches have a bounded timeout; wait for the same images shown in preview.
      while ((root.current as HTMLDivElement).querySelector('[data-photo-loading]')) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await Promise.all(Array.from((root.current as HTMLDivElement).querySelectorAll('img')).map(img => img.decode().catch(() => undefined)));
      // Let unavailable photos render their initials before capturing.
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const sheets = Array.from((root.current as HTMLDivElement).querySelectorAll<HTMLElement>('.report-sheet'));
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      pdf.setProperties({ title: 'EPA Membership Directory', author: "Ethiopian Psychologists’ Association", subject: 'Current member report' });
      for (let i = 0; i < sheets.length; i++) {
        setProgress(`Creating page ${i + 1} of ${sheets.length}…`);
        const canvas = await html2canvas(sheets[i], {
          scale: 2, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', windowWidth: 1200,
          onclone: async doc => {
            doc.querySelectorAll<HTMLElement>('.report-sheet').forEach(sheet => { sheet.style.transform = 'none'; });
            // Also embed branding assets. Only data URLs reach the renderer, including
            // when a same-origin media endpoint redirects to external storage.
            await Promise.all(Array.from(doc.querySelectorAll<HTMLImageElement>(`[data-report-page="${i}"] img`)).map(async img => {
              const embedded = await reportImageDataUrl(img.src);
              if (!embedded) { img.remove(); return; }
              img.removeAttribute('srcset'); img.src = embedded;
              await img.decode().catch(() => { img.remove(); });
            }));
          },
        });
        if (i) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297);
        canvas.width = 0; canvas.height = 0;
      }
      pdf.save(`EPA-members-${snapshot.generated.toLocaleDateString('en-CA', { timeZone: 'Africa/Addis_Ababa' })}.pdf`);
    } catch (e) {
      setError('The PDF could not be created. Please try again. ' + (e instanceof Error ? e.message : ''));
    } finally { setProgress(''); }
  }

  return <div className="member-report-overlay" role="dialog" aria-modal="true" aria-labelledby="member-report-title" onKeyDown={event => {
    if (event.key === 'Escape' && !busy) onClose();
    if (event.key === 'Tab') {
      const buttons = Array.from((event.currentTarget as HTMLDivElement).querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}>
    <header className="report-toolbar">
      <button ref={closeButton} onClick={onClose} disabled={busy} className="report-back"><ArrowLeft size={18} /> Back to members</button>
      <div><h2 id="member-report-title">Member report preview</h2><p>{snapshot.members.length} members · {pages.length} A4 pages · All current records</p></div>
      <button className="report-download" onClick={() => void download()} disabled={busy || !pages.length}>{busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}{busy ? progress : 'Download PDF'}</button>
    </header>
    <div className="report-scroll">
      <p className="report-preview-note"><FileText size={16} /> Your PDF will use this layout, including photos and complete member names.</p>
      {error && <p className="report-error" role="alert">{error}</p>}
      <div ref={root} className="report-pages">
        {!pages.length && <div className="report-empty">No member records are available yet.</div>}
        {pages.map((page, index) => <article className="report-sheet" data-report-page={index} key={index}>
          <header className="report-brand"><img src="/epa-logo.png" alt="EPA logo" /><div><span>ETHIOPIAN PSYCHOLOGISTS’ ASSOCIATION</span><p>Connecting professionals. Advancing psychology.</p></div><b>EPA<br /><small>MEMBER REGISTER</small></b></header>
          <div className="report-heading"><div className="report-eyebrow">OFFICIAL REGISTER / {snapshot.generated.getFullYear()}</div><h1>Membership directory<span>.</span></h1><p>Professional profiles & membership records</p><span className="report-edition">EPA / {String(index + 1).padStart(2, '0')}</span></div>
          <div className="report-summary"><div><strong>{snapshot.members.length}</strong><span>Total members</span></div><div><strong>{snapshot.members.filter(m => m.status === 'ACTIVE').length}</strong><span>Active status</span></div><div><strong>{date(snapshot.generated.toISOString())}</strong><span>Report generated · Addis Ababa</span></div></div>
          <div className="report-section-label"><span>REGISTERED MEMBERS</span><span>{String(index * 3 + 1).padStart(3, '0')} — {String(index * 3 + page.length).padStart(3, '0')}</span></div>
          <section className="report-records">{page.map((m, row) => <div className="report-member" key={m.id}>
            <div className="report-member-top"><ReportPhoto member={m} /><div className="report-identity"><span className="report-record-number">MEMBER {String(index * 3 + row + 1).padStart(3, '0')}</span><h2>{fullName(m)}</h2>{m.amharic_full_name && <p>{m.amharic_full_name}</p>}<div className="report-id">{value(m.membership_number)}</div></div><div className="report-badges"><span className={m.status === 'ACTIVE' ? 'report-active' : ''}>{m.status}</span><span>{m.membership_type}</span></div></div>
            <dl className="report-details">{[
              ['Email', m.email], ['Phone', m.phone], ['City', m.city],
              ['Specialty', m.specialty || m.student_profile?.field_of_study], ['Workplace / institution', m.workplace || m.student_profile?.university_name || m.corporate_profile?.organization_name], ['License number', m.license_number],
              ['Issued', date(m.issued_at)], ['Expires', date(m.expires_at)], ['CPD points', m.cpd_points ?? 0],
            ].map(([label, text]) => <div key={label}><dt>{label}</dt><dd>{value(text)}</dd></div>)}</dl>
          </div>)}</section>
          <footer className="report-footer"><span>EPA · Administrative member report</span><span>Confidential · {index + 1} / {pages.length}</span></footer>
        </article>)}
      </div>
    </div>
  </div>;
}

