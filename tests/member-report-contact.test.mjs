import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/members.js';
import { createAdminSession } from '../api/_admin.js';

test('admin report member summaries include phone numbers and require authentication', async () => {
  const env = { ...process.env };
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, {
    EPA_ADMIN_USERNAME: 'test-admin', EPA_ADMIN_PASSWORD: 'test-password',
    EPA_ADMIN_SESSION_SECRET: 'test-admin-secret',
    SUPABASE_URL: 'https://database.test', SUPABASE_SERVICE_ROLE_KEY: 'test-key',
  });
  let reads = 0;
  globalThis.fetch = async url => {
    reads++;
    const fields = new URL(url).searchParams.get('select').split(',');
    assert.ok(fields.includes('phone'));
    assert.ok(!fields.includes('phone_password'));
    const record = { id: 'member-1', first_name: 'Alem', phone: '0911223344' };
    return Response.json([Object.fromEntries(Object.entries(record).filter(([key]) => fields.includes(key)))]);
  };
  const request = async token => {
    const res = { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
    await handler({ method: 'GET', query: {}, headers: token ? { authorization: 'Bearer ' + token } : {} }, res);
    return res;
  };
  try {
    assert.equal((await request()).code, 401);
    assert.equal(reads, 0);
    const result = await request(createAdminSession().token);
    assert.equal(result.code, 200);
    assert.equal(result.data[0].phone, '0911223344');
    assert.equal(reads, 1);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
  }
});
