import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function sessionSecret() {
  // EPA_MEMBER_SESSION_SECRET is intentionally separate from the admin
  // credential. The temporary fallback preserves existing installations until
  // the new variable is added, without exposing either secret to the browser.
  const secret = String(process.env.EPA_MEMBER_SESSION_SECRET || process.env.EPA_ADMIN_SESSION_SECRET || '');
  if (!secret) {
    const error = new Error('Member sessions are not configured. Set EPA_MEMBER_SESSION_SECRET in Vercel.');
    error.statusCode = 503;
    throw error;
  }
  return secret;
}

function equal(left, right) {
  const leftBytes = Buffer.from(String(left));
  const rightBytes = Buffer.from(String(right));
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function sign(value, secret) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function readToken(token) {
  const [encoded, suppliedSignature] = String(token || '').split('.');
  if (!encoded || !suppliedSignature) return null;
  try {
    return { encoded, suppliedSignature, payload: JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) };
  } catch {
    return null;
  }
}

export function createMemberSession(memberId) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const encoded = Buffer.from(JSON.stringify({ kind: 'member', memberId: String(memberId), expiresAt })).toString('base64url');
  return { token: `${encoded}.${sign(encoded, sessionSecret())}`, expiresAt };
}

/** Throws unless the bearer token belongs to the member being changed. */
export function requireMemberSession(req, memberId) {
  const authorization = String(req.headers?.authorization || '');
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const decoded = readToken(token);
  if (!decoded) {
    const error = new Error('Member sign-in is required. Please log in again.');
    error.statusCode = 401;
    throw error;
  }
  const expectedSignature = sign(decoded.encoded, sessionSecret());
  if (
    !equal(decoded.suppliedSignature, expectedSignature)
    || decoded.payload?.kind !== 'member'
    || String(decoded.payload?.memberId || '') !== String(memberId || '')
    || Number(decoded.payload?.expiresAt) <= Date.now()
  ) {
    const error = new Error('Your member session has expired. Please log in again.');
    error.statusCode = 401;
    throw error;
  }
  return { memberId: String(memberId), expiresAt: Number(decoded.payload.expiresAt) };
}
