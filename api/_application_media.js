import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { dbSelect } from './_db.js';

// Identity documents and payment receipts must never be exposed through a
// public Storage URL. The browser uploads directly to this private bucket so
// Vercel never has to receive a multi-megabyte base64 JSON request.
export const APPLICATION_MEDIA_BUCKET = 'epa-application-documents';
const STORAGE_REFERENCE_PREFIX = `storage://${APPLICATION_MEDIA_BUCKET}/`;
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

let bucketReady;

function storageConfig() {
  const url = String(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  // Do not use the anon key here. Creating signed uploads/URLs for private
  // identity data requires the server-only service role key.
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '').trim();
  if (!url || !serviceRoleKey) {
    const error = new Error('Secure document storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.');
    error.statusCode = 503;
    throw error;
  }
  return { url, serviceRoleKey };
}

function storageClient() {
  const { url, serviceRoleKey } = storageConfig();
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function ensureBucket(client) {
  if (!bucketReady) {
    bucketReady = (async () => {
      const existing = await client.storage.getBucket(APPLICATION_MEDIA_BUCKET);
      if (existing.data) return;

      const created = await client.storage.createBucket(APPLICATION_MEDIA_BUCKET, {
        public: false,
        fileSizeLimit: MAX_UPLOAD_BYTES,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      });
      if (created.error && !/already exists|duplicate/i.test(created.error.message || '')) {
        throw new Error(`Could not create secure document storage: ${created.error.message}`);
      }
    })();
  }
  return bucketReady;
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

async function requireVerifiedCode(email, verificationCode) {
  const address = String(email || '').trim().toLowerCase();
  const code = String(verificationCode || '').trim();
  if (!validEmail(address) || !/^\d{6}$/.test(code)) {
    const error = new Error('Verify your email with the six-digit code before uploading documents.');
    error.statusCode = 400;
    throw error;
  }

  const rows = await dbSelect('email_verifications', `email=eq.${encodeURIComponent(address)}&order=created_at.desc&limit=10`);
  const now = Date.now();
  const matchingRecord = rows.find(record => (
    String(record.code || '') === code
    && Boolean(record.verified_at)
    && new Date(record.expires_at).getTime() >= now
  ));
  if (!matchingRecord) {
    const error = new Error('Your email verification has expired. Request a new code and try again.');
    error.statusCode = 403;
    throw error;
  }
  return address;
}

function fileExtension(contentType) {
  return {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  }[contentType] || 'bin';
}

export function isApplicationMediaReference(value) {
  return typeof value === 'string' && value.startsWith(STORAGE_REFERENCE_PREFIX);
}

function mediaPathFromReference(reference) {
  if (!isApplicationMediaReference(reference)) return null;
  const path = reference.slice(STORAGE_REFERENCE_PREFIX.length);
  // Signed URLs are generated only for paths issued by this application. This
  // also prevents a malformed database value from escaping its bucket.
  return /^pending\/[0-9a-f-]+\.(?:jpg|png|webp|pdf)$/i.test(path) ? path : null;
}

/** Creates a short-lived, direct-to-Storage upload URL after email verification. */
export async function createApplicationUpload({ email, verificationCode, contentType, size }) {
  await requireVerifiedCode(email, verificationCode);
  const bytes = Number(size);
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > MAX_UPLOAD_BYTES) {
    const error = new Error('Each document must be between 1 byte and 50 MB.');
    error.statusCode = 400;
    throw error;
  }
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    const error = new Error('Only JPEG, PNG, WebP, and PDF documents can be uploaded.');
    error.statusCode = 400;
    throw error;
  }

  const client = storageClient();
  await ensureBucket(client);
  const path = `pending/${randomUUID()}.${fileExtension(contentType)}`;
  const signed = await client.storage.from(APPLICATION_MEDIA_BUCKET).createSignedUploadUrl(path);
  if (signed.error || !signed.data?.signedUrl) {
    throw new Error(`Could not prepare secure document upload: ${signed.error?.message || 'unknown storage error'}`);
  }
  return {
    signedUrl: signed.data.signedUrl,
    storageRef: `${STORAGE_REFERENCE_PREFIX}${signed.data.path}`,
  };
}

async function signedMediaUrl(value, storage) {
  const path = mediaPathFromReference(value);
  if (!path) return value;
  const signed = await storage.from(APPLICATION_MEDIA_BUCKET).createSignedUrl(path, 20 * 60);
  if (signed.error || !signed.data?.signedUrl) {
    throw new Error(`Could not open a secure application document: ${signed.error?.message || 'unknown storage error'}`);
  }
  return signed.data.signedUrl;
}

/** Replaces private storage references only in an authenticated admin dossier response. */
export async function hydrateApplicationMedia(application) {
  if (!application) return application;
  const values = [
    application.degree_certificate_url,
    application.id_document_url,
    application.payment?.receipt_url,
    application.student_profile?.student_id_url,
    application.corporate_profile?.registration_cert_url,
    application.corporate_profile?.logo_url,
    application.tin_cert_url,
  ];
  if (!values.some(isApplicationMediaReference)) return application;

  const storage = storageClient().storage;
  const [degree, identity, receipt, studentId, registration, logo, tin] = await Promise.all(
    values.map(value => signedMediaUrl(value, storage))
  );
  return {
    ...application,
    degree_certificate_url: degree,
    id_document_url: identity,
    payment: application.payment ? { ...application.payment, receipt_url: receipt } : application.payment,
    student_profile: application.student_profile ? { ...application.student_profile, student_id_url: studentId } : application.student_profile,
    corporate_profile: application.corporate_profile ? {
      ...application.corporate_profile,
      registration_cert_url: registration,
      logo_url: logo,
    } : application.corporate_profile,
    tin_cert_url: tin,
  };
}
