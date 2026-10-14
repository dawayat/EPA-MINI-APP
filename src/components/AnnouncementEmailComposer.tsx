import React, { useMemo, useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, MapPin, Mail, UploadCloud } from 'lucide-react';
import { Announcement } from '../types';
import { uploadFile, previewAnnouncementEmail } from '../lib/api';
import { renderAnnouncementEmail, validateAnnouncementLocation } from '../../shared/announcement-email.js';

interface Props {
  value: Partial<Announcement>;
  onChange: (patch: Partial<Announcement>) => void;
  onBusyChange: (busy: boolean) => void;
}

const inputClass = 'mt-1.5 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-600 dark:border-white/15 dark:bg-neutral-950 dark:text-white';

export function AnnouncementEmailComposer({ value, onChange, onBusyChange }: Props) {
  const photoInput = useRef<HTMLInputElement>(null);
  const mapInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<'photo' | 'map' | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [testEmail, setTestEmail] = useState('dawitaynalem92@gmail.com');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; text: string } | null>(null);

  const { html, locationError } = useMemo(() => {
    const attachments = [];
    if (value.cover_photo_url) attachments.push({ type: 'cover', url: value.cover_photo_url });
    const hasLocation = Boolean(value.location_url || value.location_name || value.map_image_url || value.location_address);
    const location = { type: 'location', url: value.location_url || '', name: value.location_name, address: value.location_address, map_image_url: value.map_image_url };
    if (hasLocation) attachments.push(location);
    let locationError = '';
    if (hasLocation) {
      try { validateAnnouncementLocation({ attachments: [location] }); }
      catch (error) { locationError = (error as Error).message; }
    }
    return {
      html: renderAnnouncementEmail('EPA Member', { title: value.title || 'Your announcement title', content: value.content || '', category: value.category, attachments }, { preview: true, baseUrl: window.location.origin }).html,
      locationError
    };
  }, [value.title, value.content, value.category, value.cover_photo_url, value.location_url, value.location_name, value.location_address, value.map_image_url]);

  const messageReady = Boolean(value.title?.trim() && value.content?.trim());
  const emailValid = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(testEmail.trim());
  const readyToTest = messageReady && !locationError && emailValid && !uploading;

  async function prepareImage(file: File | undefined, kind: 'photo' | 'map') {
    if (!file) return;
    setUploadError('');
    if (!file.type.startsWith('image/')) { setUploadError('Choose an image file for the venue photo or map.'); return; }
    setUploading(kind);
    onBusyChange(true);
    try {
      const url = await uploadFile(file);
      onChange(kind === 'photo' ? { cover_photo_url: url } : { map_image_url: url });
      setTestResult(null);
    } catch {
      setUploadError(`Could not prepare the ${kind === 'photo' ? 'venue photo' : 'map screenshot'}. Please choose another image.`);
    } finally {
      setUploading(null);
      onBusyChange(false);
    }
  }

  async function sendTest() {
    if (!readyToTest) return;
    setSendingTest(true);
    setTestResult(null);
    try {
      const recipient = await previewAnnouncementEmail(value, testEmail.trim());
      setTestResult({ success: true, text: `Test email accepted for delivery to ${recipient}. Check your inbox and spam folder. No announcement was published and no members were emailed.` });
    } catch (error) {
      setTestResult({ success: false, text: (error as Error).message });
    } finally {
      setSendingTest(false);
    }
  }

  return <div className="space-y-5">
    <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white dark:border-emerald-800 dark:bg-neutral-950" aria-labelledby="venue-section-title">
      <div className="bg-emerald-50 p-5 dark:bg-emerald-950/40">
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Step 2 · Show members where to go</span>
        <h4 id="venue-section-title" className="mt-1 text-lg font-bold">Venue photo &amp; location</h4>
        <p className="mt-1 text-xs leading-5 text-neutral-600 dark:text-neutral-400">The venue photo shows the place. The map screenshot shows how to find it. Upload them separately below.</p>
      </div>
      <div className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset className="min-w-0 rounded-xl border border-gray-200 p-3 dark:border-white/15">
            <legend className="px-1 text-sm font-bold">Venue photo</legend>
            <p className="mb-3 text-xs leading-5 text-neutral-500">A photo of the hotel, entrance, or meeting hall. Optional.</p>
            <input ref={photoInput} type="file" accept="image/*" aria-label="Upload venue photo" className="hidden" disabled={Boolean(uploading)} onChange={e => { void prepareImage(e.target.files?.[0], 'photo'); e.target.value = ''; }} />
            {value.cover_photo_url ? <img src={value.cover_photo_url} alt="Your uploaded venue photo" className="mb-3 h-auto w-full rounded-lg" /> : <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30"><ImagePlus className="h-8 w-8 text-emerald-600" /></div>}
            <button type="button" disabled={Boolean(uploading)} onClick={() => photoInput.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-3 py-3 text-xs font-bold text-white disabled:opacity-50"><UploadCloud className="h-4 w-4" />{uploading === 'photo' ? 'Preparing photo…' : value.cover_photo_url ? 'Replace venue photo' : 'Upload venue photo'}</button>
            {value.cover_photo_url && <button type="button" disabled={Boolean(uploading)} onClick={() => onChange({ cover_photo_url: '' })} className="mt-2 text-xs text-red-600">Remove venue photo</button>}
          </fieldset>
          <fieldset className="min-w-0 rounded-xl border border-gray-200 p-3 dark:border-white/15">
            <legend className="px-1 text-sm font-bold">Map screenshot</legend>
            <p className="mb-3 text-xs leading-5 text-neutral-500">A Google Maps screenshot with the venue pin visible.</p>
            <input ref={mapInput} type="file" accept="image/*" aria-label="Upload map screenshot" className="hidden" disabled={Boolean(uploading)} onChange={e => { void prepareImage(e.target.files?.[0], 'map'); e.target.value = ''; }} />
            {value.map_image_url ? <img src={value.map_image_url} alt="Your uploaded map screenshot" className="mb-3 h-auto w-full rounded-lg" /> : <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/30"><MapPin className="h-8 w-8 text-sky-600" /></div>}
            <button type="button" disabled={Boolean(uploading)} onClick={() => mapInput.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-800 px-3 py-3 text-xs font-bold text-white disabled:opacity-50"><UploadCloud className="h-4 w-4" />{uploading === 'map' ? 'Preparing map…' : value.map_image_url ? 'Replace map screenshot' : 'Upload map screenshot'}</button>
            {value.map_image_url && <button type="button" disabled={Boolean(uploading)} onClick={() => onChange({ map_image_url: '' })} className="mt-2 text-xs text-red-600">Remove map screenshot</button>}
          </fieldset>
        </div>
        {uploadError && <p role="alert" className="text-xs text-red-600">{uploadError}</p>}
        <label className="block text-xs font-bold">Venue name<input value={value.location_name || ''} onChange={e => onChange({ location_name: e.target.value })} placeholder="e.g. Sapphire Addis Hotel" className={inputClass} /></label>
        <label className="block text-xs font-bold">Address<input value={value.location_address || ''} onChange={e => onChange({ location_address: e.target.value })} placeholder="Street or landmark, Addis Ababa" className={inputClass} /></label>
        <label className="block text-xs font-bold">Google Maps link<input type="url" value={value.location_url || ''} onChange={e => onChange({ location_url: e.target.value })} placeholder="Paste the Google Maps share link here" className={inputClass} /></label>
        <p className="text-xs leading-5 text-neutral-500">Both the map image and “Open location” button will open this link.</p>
        {locationError ? <p role="status" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">{locationError}</p> : value.location_url ? <a href={value.location_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300"><MapPin className="h-4 w-4" />Check location link ↗</a> : null}
      </div>
    </section>
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/15 dark:bg-neutral-950" aria-labelledby="email-preview-title">
      <div className="p-5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Step 3 · Review before sending</span>
        <div className="mt-1 flex items-center justify-between gap-3"><h4 id="email-preview-title" className="text-lg font-bold">Your email preview</h4><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">● Updates as you type</span></div>
        <p className="mt-2 text-xs leading-5 text-neutral-500">This is the same layout used in the sent email. Your message appears first, followed by the venue photo and map.</p>
        {!messageReady && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Add a title and announcement message in Step 1 before sending a test.</p>}
      </div>
      <iframe title="Live announcement email preview" sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={html} className="h-[760px] w-full border-y border-gray-200 bg-white dark:border-white/15" />
      <div className="space-y-3 p-5">
        <div className="flex items-start gap-3"><Mail className="mt-1 h-5 w-5 text-emerald-700" /><div><h5 className="text-sm font-bold">Send yourself a test</h5><p className="mt-1 text-xs leading-5 text-neutral-500">Only the address below receives the test. Members will receive nothing until you publish.</p></div></div>
        <label className="block text-xs font-bold">Test email address<input type="email" value={testEmail} onChange={e => { setTestEmail(e.target.value); setTestResult(null); }} className={inputClass} /></label>
        <button type="button" disabled={!readyToTest || sendingTest} onClick={() => void sendTest()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 p-3.5 text-sm font-bold text-white disabled:opacity-40"><Mail className="h-4 w-4" />{sendingTest ? 'Sending your test…' : 'Send test to this address only'}</button>
        {testResult && <div role={testResult.success ? 'status' : 'alert'} className={`rounded-xl p-3 text-xs leading-5 ${testResult.success ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'}`}>{testResult.success && <CheckCircle2 className="mb-1 h-4 w-4" />}{testResult.text}</div>}
      </div>
    </section>
  </div>;
}
