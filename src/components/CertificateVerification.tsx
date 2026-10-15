import React, { useEffect, useState } from 'react';
import { certificateIdPattern } from '../../shared/certificates.js';
import { createCertificatePdf } from '../lib/certificatePdf';
import './certificate.css';

interface IssuedCertificate {
  id: string; organization: { id: string; name: string; am: string }; english: string; amharic: string;
  awardDate: string; registeredAt: string; president: string; issuer: string; image: string;
}
export function CertificateVerification({ id }: { id: string }) {
  const [record, setRecord] = useState<IssuedCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [retry, setRetry] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setRecord(null); setError(''); setNotFound(false);
    if (!certificateIdPattern.test(id)) { setNotFound(true); setLoading(false); return; }
    void (async () => {
      try {
        const response = await fetch(`/api/announcements?action=certificates&id=${encodeURIComponent(id)}`, { signal: controller.signal, cache: 'no-store' });
        if (response.status === 404) { setNotFound(true); return; }
        const data = await response.json();
        if (!response.ok || !data.verified || data.certificate?.id !== id) throw new Error('Verification is temporarily unavailable. Please try again.');
        setRecord(data.certificate);
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Could not verify certificate.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [id, retry]);
  async function download() {
    if (!record || downloading) return;
    setDownloading(true); setDownloadError('');
    try {
      const pdf = createCertificatePdf(record.image, id, record.organization.name);
      pdf.save(`EPA-certificate-${id}.pdf`);
    } catch { setDownloadError('The certificate could not be downloaded. Please try again.'); }
    finally { setDownloading(false); }
  }
  return <main className="certificate-verification">
    <header><a href="/" aria-label="EPA home"><img src="/epa-logo.png" alt="EPA logo"/></a><div><strong>Ethiopian Psychologists' Association</strong><p lang="am">የኢትዮጵያ ሳይኮሎጂ ባላሙያዎች ማኅበር</p></div></header>
    {loading ? <section aria-live="polite"><h1>Verifying certificate…</h1><p>Checking EPA’s issuance registry.</p></section> : notFound ? <section role="alert"><h1>Certificate not found</h1><p lang="am">ይህ የምስክር ወረቀት በማኅበሩ መዝገብ አልተገኘም።</p><p>This ID has no issued certificate in EPA’s registry. Please check the QR code or contact EPA.</p><code>{id}</code></section> : error ? <section role="alert"><h1>Unable to verify right now</h1><p>{error}</p><button onClick={()=>setRetry(n=>n+1)}>Try again</button></section> : record ? <>
      <section>
        <div className="certificate-verified-badge">✓ VERIFIED · የተረጋገጠ</div>
        <h1>Official EPA certificate</h1>
        <p>This certificate is registered as issued by the Ethiopian Psychologists' Association. Compare the recipient, date, message, and image below with the certificate you received.</p>
        <p lang="am">ይህ የምስክር ወረቀት በማኅበሩ መዝገብ ተመዝግቧል። የተቀባዩን ስም፣ ቀንና መልእክት ከተቀበሉት የምስክር ወረቀት ጋር ያነጻጽሩ።</p>
        <dl><div><dt>Recipient / ተቀባይ</dt><dd>{record.organization.name}<br/><span lang="am">{record.organization.am}</span></dd></div><div><dt>Award date / ቀን</dt><dd>October 17, 2026<br/><span lang="am">ጥቅምት 7፣ 2019 ዓ.ም.</span></dd></div><div><dt>Certificate ID</dt><dd><code>{record.id}</code></dd></div><div><dt>President</dt><dd>{record.president}</dd></div><div><dt>Registered with EPA</dt><dd>{new Date(record.registeredAt).toLocaleString('en-GB', { timeZone: 'Africa/Addis_Ababa' })} (Addis Ababa)</dd></div></dl>
        <button disabled={downloading} onClick={()=>void download()}>{downloading?'Preparing PDF…':'Download registered certificate'}</button>
        {downloadError && <p role="alert">{downloadError}</p>}
      </section>
      <section><h2>Registered original</h2><img className="certificate-original" src={record.image} alt={`Original issued certificate for ${record.organization.name}`}/><div className="certificate-record-messages"><p>{record.english}</p><p lang="am">{record.amharic}</p></div></section>
    </> : null}
    <footer><a href="/">EPA portal</a> · Certificate verification</footer>
  </main>;
}
