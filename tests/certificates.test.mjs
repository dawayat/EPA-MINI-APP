import test from 'node:test';
import assert from 'node:assert/strict';
import handleCertificates from '../api/_certificates.js';
import { createAdminSession } from '../api/_admin.js';

test('certificate issuance is admin-only, persistent, immutable, idempotent, and publicly verifiable', async () => {
  const previousEnv = { ...process.env }, previousFetch = globalThis.fetch;
  Object.assign(process.env, { EPA_ADMIN_USERNAME: 'test-admin', EPA_ADMIN_PASSWORD: 'test-password', EPA_ADMIN_SESSION_SECRET: 'test-secret', SUPABASE_URL: 'https://registry.test', SUPABASE_SERVICE_ROLE_KEY: 'test-service-key' });
  const objects = new Map(); let bucketExists = false, writes = 0, storageFails = false;
  globalThis.fetch = async (input, options = {}) => {
    if (storageFails) return Response.json({ message: 'Storage unavailable', statusCode: '503' }, { status: 503 });
    const url = new URL(String(input));
    assert.equal(url.hostname, 'registry.test');
    const method = options.method || 'GET';
    if (url.pathname === '/storage/v1/bucket/epa-issued-certificates') return bucketExists ? Response.json({ id: 'epa-issued-certificates', public: false }) : Response.json({ message: 'Bucket not found', statusCode: '404' }, { status: 404 });
    if (url.pathname === '/storage/v1/bucket') {
      const body = JSON.parse(options.body); assert.equal(body.public, false); bucketExists = true;
      return Response.json({ name: body.id });
    }
    const path = url.pathname.replace('/object/authenticated/', '/object/');
    if (method === 'POST' && path.includes('/object/')) {
      writes++;
      assert.equal(new Headers(options.headers).get('x-upsert'), 'false');
      if (objects.has(path)) return Response.json({ message: 'Already exists', statusCode: '409' }, { status: 409 });
      objects.set(path, Buffer.from(options.body).toString());
      return Response.json({ Key: path, Id: 'object-id' });
    }
    if (objects.has(path)) return new Response(objects.get(path), { headers: { 'Content-Type': 'application/json' } });
    return Response.json({ message: 'Object not found', statusCode: '404' }, { status: 404 });
  };
  async function request(method, body, id, token) {
    const response = { code: 200, headers: {}, setHeader(name, value) { this.headers[name] = value; }, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
    await handleCertificates({ method, body, query: { id }, headers: token ? { authorization: `Bearer ${token}` } : {} }, response);
    return response;
  }
  try {
    const token = createAdminSession().token;
    const id = '66666666-6666-4666-8666-666666666666';
    const bytes = Buffer.alloc(24); Buffer.from('89504e470d0a1a0a', 'hex').copy(bytes); bytes.writeUInt32BE(2400, 16); bytes.writeUInt32BE(1697, 20);
    const body = { id, organizationId: 'abrihot', english: 'Thank you.', amharic: 'እናመሰግናለን።', image: `data:image/png;base64,${bytes.toString('base64')}` };
    assert.equal((await request('POST', body)).code, 401);
    assert.equal(writes, 0);
    assert.equal((await request('GET', null, 'invalid')).code, 404);
    assert.equal((await request('GET', null, id)).code, 404);
    const issued = await request('POST', body, null, token);
    assert.equal(issued.code, 201);
    assert.equal(issued.data.verificationUrl, `https://epa-mini-app.vercel.app/?certificate=${id}`);
    assert.equal(writes, 1);
    const verified = await request('GET', null, id);
    assert.equal(verified.code, 200); assert.equal(verified.data.verified, true);
    assert.equal(verified.data.certificate.organization.name, 'Abrihot Specialized Psychological Center');
    assert.equal(verified.data.certificate.image, body.image);
    assert.equal(verified.data.certificate.english, body.english);
    assert.equal(verified.data.certificate.awardDate, '2026-10-17');
    assert.match(verified.headers['Cache-Control'], /no-store/);
    assert.equal((await request('POST', body, null, token)).code, 200);
    assert.equal(writes, 1, 're-download does not create a second issuance');
    assert.equal((await request('POST', { ...body, english: 'Changed text' }, null, token)).code, 409);
    assert.equal((await request('POST', { ...body, organizationId: 'unknown' }, null, token)).code, 400);
    assert.equal((await request('POST', { ...body, image: 'data:image/png;base64,aGVsbG8=' }, null, token)).code, 400);
    const key = [...objects.keys()][0], original = objects.get(key), altered = JSON.parse(original);
    altered.record.english = 'Forged certificate'; objects.set(key, JSON.stringify(altered));
    const forged = await request('GET', null, id);
    assert.equal(forged.code, 503); assert.equal(forged.data.verified, undefined);
    objects.set(key, original); storageFails = true;
    assert.equal((await request('GET', null, id)).code, 503);
    assert.equal((await request('POST', { ...body, id: '77777777-7777-4777-8777-777777777777' }, null, token)).code, 503);
  } finally { globalThis.fetch = previousFetch; process.env = previousEnv; }
});
