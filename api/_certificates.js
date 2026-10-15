import { createClient } from '@supabase/supabase-js';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { requireAdmin } from './_admin.js';
import { noStore } from './_db.js';
import { certificateOrganizations, certificateDate, certificateIdPattern, certificateVerificationUrl } from '../shared/certificates.js';

const BUCKET = 'epa-issued-certificates';
const MAX_BYTES = 3_500_000;
function fail(statusCode, message) { return Object.assign(new Error(message), { statusCode }); }
function client() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || !process.env.EPA_ADMIN_SESSION_SECRET) throw fail(503, 'Certificate verification storage is not configured.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
function mac(record) {
  return createHmac('sha256', process.env.EPA_ADMIN_SESSION_SECRET).update('epa-issued-certificate-v1\n').update(JSON.stringify(record)).digest('hex');
}
async function read(storage, id) {
  const { data, error } = await storage.from(BUCKET).download(`${id}.json`);
  if (error) {
    const status = Number(error.statusCode || error.status);
    if (status === 404 || /not found|does not exist/i.test(error.message)) return null;
    throw fail(503, 'Certificate verification is temporarily unavailable. Please try again.');
  }
  let saved;
  try { saved = JSON.parse(await data.text()); } catch { throw fail(503, 'This certificate record could not be verified.'); }
  const { record, signature } = saved;
  if (!record || record.id !== id || !/^[0-9a-f]{64}$/.test(signature || '') || !timingSafeEqual(Buffer.from(mac(record)), Buffer.from(signature))) {
    throw fail(503, 'The authenticity of this certificate record could not be confirmed.');
  }
  return record;
}
async function ensureBucket(storage) {
  const found = await storage.getBucket(BUCKET);
  if (found.data) {
    if (found.data.public) throw fail(503, 'Certificate registry must use private storage.');
    return;
  }
  if (found.error && !/not found|does not exist/i.test(found.error.message) && Number(found.error.status) !== 404 && Number(found.error.statusCode) !== 404) throw fail(503, 'Could not open the certificate registry.');
  const created = await storage.createBucket(BUCKET, { public: false, fileSizeLimit: MAX_BYTES, allowedMimeTypes: ['application/json'] });
  if (created.error && !/already exists|duplicate/i.test(created.error.message)) throw fail(503, 'Could not prepare the certificate registry.');
  // Recheck in the race where another request created the bucket first.
  const confirmed = await storage.getBucket(BUCKET);
  if (!confirmed.data || confirmed.data.public) throw fail(503, 'Certificate registry must use private storage.');
}

export default async function handleCertificates(req, res) {
  noStore(res);
  try {
    if (req.method === 'GET') {
      const id = String(req.query?.id || '');
      if (!certificateIdPattern.test(id)) return res.status(404).json({ error: 'Certificate not found in EPA’s issuance registry.' });
      const storage = client().storage;
      await ensureBucket(storage);
      const record = await read(storage, id);
      if (!record) return res.status(404).json({ error: 'Certificate not found in EPA’s issuance registry.' });
      return res.status(200).json({ verified: true, certificate: record });
    }
    if (req.method === 'POST') {
      requireAdmin(req);
      const body = req.body || {};
      const organization = certificateOrganizations.find(item => item.id === body.organizationId);
      const { id, english, amharic, image } = body;
      if (!certificateIdPattern.test(String(id || '')) || !organization || typeof english !== 'string' || typeof amharic !== 'string' || !english.trim() || !amharic.trim() || english.length > 650 || amharic.length > 650) throw fail(400, 'Provide a valid certificate ID, organization, and both certificate messages.');
      if (typeof image !== 'string' || image.length > 3_300_000 || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) throw fail(400, 'A certificate PNG under 2.4 MB is required. Try a smaller signature image.');
      const png = Buffer.from(image.split(',')[1], 'base64');
      if (png.length < 24 || png.subarray(0,8).toString('hex') !== '89504e470d0a1a0a' || png.readUInt32BE(16) !== 2400 || png.readUInt32BE(20) !== 1697) throw fail(400, 'The certificate image is invalid. Please regenerate it.');
      const imageSha256 = createHash('sha256').update(png).digest('hex');
      const storage = client().storage;
      await ensureBucket(storage);
      const previous = await read(storage, id);
      const matches = record => record.organization.id === organization.id && record.english === english && record.amharic === amharic && record.imageSha256 === imageSha256;
      if (previous) {
        if (!matches(previous)) throw fail(409, 'This certificate ID has already been issued with different content. Refresh the editor to create a new certificate.');
        return res.status(200).json({ success: true, id, verificationUrl: certificateVerificationUrl(id), registeredAt: previous.registeredAt });
      }
      const record = { id, organization, english, amharic, certificateType: 'CORPORATE_MEMBERSHIP', membershipYear: '2026/2027', membershipYearAmharic: '2019 ዓ.ም.', awardDate: certificateDate, registeredAt: new Date().toISOString(), president: 'Dr. Getahun Tibebu', issuer: "Ethiopian Psychologists' Association", image, imageSha256 };
      const bytes = Buffer.from(JSON.stringify({ record, signature: mac(record) }));
      if (bytes.length > MAX_BYTES) throw fail(400, 'The certificate is too large. Use a smaller signature image.');
      const uploaded = await storage.from(BUCKET).upload(`${id}.json`, bytes, { contentType: 'application/json', upsert: false });
      if (uploaded.error) {
        // Concurrent retries can safely reuse the same immutable record.
        const existing = await read(storage, id);
        if (!existing || !matches(existing)) throw fail(503, 'The certificate could not be registered. Please try again.');
      }
      const confirmed = await read(storage, id);
      if (!confirmed || !matches(confirmed)) throw fail(503, 'The issuance record could not be confirmed. Please try again.');
      return res.status(201).json({ success: true, id, verificationUrl: certificateVerificationUrl(id), registeredAt: confirmed.registeredAt });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error('[certificates]', error.statusCode || 500);
    return res.status(error.statusCode || 503).json({ error: error.statusCode ? error.message : 'Certificate verification is temporarily unavailable. Please try again.' });
  }
}
