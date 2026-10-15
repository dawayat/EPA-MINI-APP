import React, { useEffect, useMemo, useRef, useState } from 'react';
import { appreciationAmharic, appreciationEnglish, certificateOrganizations, certificateVerificationUrl, renderCertificate } from '../lib/certificate';
import { adminHeaders } from '../lib/admin';
import { createCertificatePdf } from '../lib/certificatePdf';
import './certificate.css';

export function CertificateGenerator() {
  const [organizationId, setOrganizationId] = useState('abrihot');
  const [english, setEnglish] = useState(appreciationEnglish);
  const [amharic, setAmharic] = useState(appreciationAmharic);
  const [signature, setSignature] = useState('');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [rendering, setRendering] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [issuedId, setIssuedId] = useState('');
  const [exportError, setExportError] = useState('');
  const certificateId = useMemo(() => crypto.randomUUID(), [organizationId, english, amharic, signature]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const organization = certificateOrganizations.find(item => item.id === organizationId)!;
  useEffect(() => {
    let active = true;
    setRendering(true); setError(''); canvasRef.current = null;
    const timer = window.setTimeout(() => {
      if (!english.trim() || !amharic.trim()) { setError('Enter both appreciation messages.'); setRendering(false); return; }
      void renderCertificate({ organization, english, amharic, signature, certificateId }).then(canvas => {
        if (active) { canvasRef.current = canvas; setPreview(canvas.toDataURL('image/png')); }
      }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Could not create preview.'); })
        .finally(() => { if (active) setRendering(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [organization, english, amharic, signature, certificateId]);
  async function download() {
    const canvas = canvasRef.current;
    if (!canvas || rendering || downloading) return;
    setDownloading(true); setExportError('');
    try {
      const image = canvas.toDataURL('image/png');
      // Prepare the PDF before registering, so a PDF preparation error cannot
      // create an issuance record that the administrator cannot download.
      const pdf = createCertificatePdf(image, certificateId, organization.name);
      const response = await fetch('/api/announcements?action=certificates', {
        method: 'POST', headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: certificateId, organizationId, english, amharic, image }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || result.id !== certificateId) throw new Error(result?.error || 'Could not register the certificate. No PDF was issued.');
      setIssuedId(certificateId);
      pdf.save(`EPA-appreciation-${organization.id}-${certificateId}.pdf`);
    } catch (e) { setExportError(e instanceof Error ? e.message : 'The PDF could not be downloaded. Please try again.'); }
    finally { setDownloading(false); }
  }
  async function uploadSignature(file?: File) {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024) { setError('Choose a PNG or JPEG signature under 2 MB.'); return; }
    try {
      const data = await new Promise<string>((resolve,reject) => { const reader = new FileReader(); reader.onload=()=>resolve(String(reader.result)); reader.onerror=()=>reject(); reader.readAsDataURL(file); });
      const img = new Image(); img.src = data; await img.decode(); setSignature(data); setError('');
    } catch { setError('This signature image could not be opened.'); }
  }
  return <section className="certificate-generator" aria-label="Certificate generator">
    <div className="certificate-controls">
      <h2>Certificates of appreciation</h2>
      <p>Choose an organization and personalize both languages. English appears on the left and Amharic on the right.</p>
      <label>Organization<select value={organizationId} onChange={e=>setOrganizationId(e.target.value)} disabled={downloading}>{certificateOrganizations.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>English appreciation message<textarea rows={7} maxLength={650} value={english} onChange={e=>setEnglish(e.target.value)} disabled={downloading}/></label>
      <label>የአማርኛ የምስጋና መልእክት<textarea lang="am" rows={7} maxLength={650} value={amharic} onChange={e=>setAmharic(e.target.value)} disabled={downloading}/></label>
      <p><strong>Issue date:</strong> October 17, 2026<br/><span lang="am">ጥቅምት 7፣ 2019 ዓ.ም.</span></p>
      <label>President’s signature (optional)<input type="file" accept="image/png,image/jpeg" disabled={downloading} onChange={e=>{ void uploadSignature(e.target.files?.[0]); e.target.value=''; }}/></label>
      <p>Upload the authorized signature as a PNG or JPEG, up to 2 MB. Without an image, the certificate has a blank signature line.</p>
      {signature && <button type="button" onClick={()=>setSignature('')} disabled={downloading}>Remove signature</button>}
      <button type="button" className="certificate-download" disabled={rendering || downloading || !canvasRef.current || Boolean(error)} onClick={()=>void download()}>{downloading?'Registering and creating PDF…':rendering?'Updating preview…':issuedId === certificateId ? 'Download issued certificate PDF' : 'Issue & download certificate PDF'}</button>
      {error && <p role="alert" className="certificate-error">{error}</p>}
      {exportError && <p role="alert" className="certificate-error">{exportError}</p>}
      {issuedId === certificateId && <p role="status">Registered with EPA. <a href={certificateVerificationUrl(certificateId)} target="_blank" rel="noreferrer">Open certificate verification</a></p>}
    </div>
    <div className="certificate-preview" aria-busy={rendering}>
      <div className="certificate-preview-heading"><strong>Live preview</strong><span>A4 landscape · English + አማርኛ</span></div>
      {preview ? <img src={preview} alt={`Bilingual certificate of appreciation for ${organization.name}`} style={{ opacity: rendering || error ? 0.5 : 1 }}/> : <p>Preparing certificate…</p>}
      <p>{issuedId === certificateId ? 'Issued certificate' : 'Draft preview — not yet issued'}. The QR code verifies this specific certificate and displays the saved original. Issuing publishes the recipient, appreciation messages, date, and certificate image on its verification page.</p>
    </div>
  </section>;
}
