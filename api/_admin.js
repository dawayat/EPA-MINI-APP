import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function configuredAdmin() {
  const username = String(process.env.EPA_ADMIN_USERNAME || '').trim();
  const password = String(process.env.EPA_ADMIN_PASSWORD || '');
  const secret = String(process.env.EPA_ADMIN_SESSION_SECRET || '');
  if (!username || !password || !secret) {
    const error = new Error('Admin login is not configured. Set EPA_ADMIN_USERNAME, EPA_ADMIN_PASSWORD, and EPA_ADMIN_SESSION_SECRET in Vercel.');
    error.statusCode = 503;
    throw error;
  }
  return { username, password, secret };
}

function equal(left, right) {
  const leftBytes = Buffer.from(String(left));
  const rightBytes = Buffer.from(String(right));
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function signature(value, secret) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function decodeSession(token) {
  const [encoded, providedSignature] = String(token || '').split('.');
  if (!encoded || !providedSignature) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  return { encoded, providedSignature, payload };
}

export function authenticateAdmin(username, password) {
  const configured = configuredAdmin();
  return equal(username, configured.username) && equal(password, configured.password);
}

export function createAdminSession() {
  const { username, secret } = configuredAdmin();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const encoded = Buffer.from(JSON.stringify({ username, expiresAt })).toString('base64url');
  return { token: `${encoded}.${signature(encoded, secret)}`, expiresAt };
}

/** Throws a 401/503 error when the request does not hold a valid admin session. */
export function requireAdmin(req) {
  const authorization = String(req.headers?.authorization || '');
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const decoded = decodeSession(token);
  if (!decoded) {
    const error = new Error('Admin authentication is required.');
    error.statusCode = 401;
    throw error;
  }

  const { username, secret } = configuredAdmin();
  const expectedSignature = signature(decoded.encoded, secret);
  if (!equal(decoded.providedSignature, expectedSignature) || decoded.payload?.username !== username || Number(decoded.payload?.expiresAt) <= Date.now()) {
    const error = new Error('Your admin session has expired. Please sign in again.');
    error.statusCode = 401;
    throw error;
  }
  return { username, expiresAt: Number(decoded.payload.expiresAt) };
}
