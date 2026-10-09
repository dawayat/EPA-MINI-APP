import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/members.js';
import mediaHandler from '../api/media.js';
import { createAdminSession } from '../api/_admin.js';
import { createMemberSession } from '../api/_member_session.js';

test('admin photo uploads enforce permissions, validate input, and persist only the photo', async () => {
  const env = { ...process.env };
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, {
    EPA_ADMIN_USERNAME: 'test-admin', EPA_ADMIN_PASSWORD: 'test-password',
    EPA_ADMIN_SESSION_SECRET: 'test-admin-secret', EPA_MEMBER_SESSION_SECRET: 'test-member-secret',
    SUPABASE_URL: 'https://database.test', SUPABASE_SERVICE_ROLE_KEY: 'test-key',
  });
  let saved = { id: 'member-1', first_name: 'Test', phone_password: 'private' };
  let writes = 0;
  let ignoreWrite = false;
  globalThis.fetch = async (url, options) => {
    assert.ok(String(url).startsWith('https://database.test/rest/v1/members?'));
    if (options.method === 'PATCH') {
      const update = JSON.parse(options.body);
      assert.deepEqual(Object.keys(update), ['photo_url']);
      if (!ignoreWrite) saved = { ...saved, ...update };
      writes++;
      return new Response(null, { status: 204 });
    }
    return Response.json(String(url).includes('id=eq.missing') ? [] : [saved]);
  };
  const request = async (token, overrides = {}) => {
    const res = { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
    await handler({ method: 'PATCH', headers: token ? { authorization: 'Bearer ' + token } : {}, body: {
      id: 'member-1', action: 'admin-update-profile-photo', photo_url: 'data:image/png;base64,aGVsbG8=', ...overrides,
    } }, res);
    return res;
  };
  const readPhoto = async () => {
    const res = { code: 200, headers: {}, setHeader(name, value) { this.headers[name] = value; }, status(code) { this.code = code; return this; }, send(body) { this.body = body; return this; }, end() { return this; } };
    await mediaHandler({ method: 'GET', query: { kind: 'member-photo', id: 'member-1' } }, res);
    assert.equal(res.code, 200);
    assert.match(res.headers['Cache-Control'], /no-store/);
    assert.equal(res.headers['Vercel-CDN-Cache-Control'], 'no-store');
    return res.body.toString();
  };
  const readOwnPhoto = async (token, id = 'member-1') => {
    const res = { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
    await handler({ method: 'GET', query: { view: 'profile-photo', id }, headers: { authorization: 'Bearer ' + token } }, res);
    return res;
  };
  try {
    const admin = createAdminSession().token;
    const member = createMemberSession('member-1').token;
    assert.equal((await request()).code, 401);
    assert.equal((await request(member)).code, 401);
    assert.equal((await request(admin, { photo_url: 'https://example.com/photo.jpg' })).code, 400);
    assert.equal((await request(admin, { photo_url: 'data:image/png;base64,' + 'a'.repeat(2 * 1024 * 1024) })).code, 400);
    assert.equal((await request(admin, { id: 'missing' })).code, 404);
    assert.equal(writes, 0);
    const success = await request(admin);
    assert.equal(success.code, 200);
    assert.equal(saved.photo_url, 'data:image/png;base64,aGVsbG8=');
    assert.equal(success.data.member.phone_password, undefined);
    assert.equal(writes, 1);
    assert.equal(await readPhoto(), 'hello');
    assert.equal((await readOwnPhoto(member)).data.photo_url, saved.photo_url);
    assert.equal((await readOwnPhoto(member, 'someone-else')).code, 401);
    assert.equal((await readOwnPhoto('')).code, 401);
    const replacement = 'data:image/png;base64,dXBkYXRlZA==';
    assert.equal((await request(member, { action: 'update-profile-photo', photo_url: replacement })).code, 200);
    assert.equal(await readPhoto(), 'updated');
    assert.equal((await readOwnPhoto(member)).data.photo_url, replacement);
    ignoreWrite = true;
    assert.equal((await request(admin)).code, 500);
    assert.equal((await request(member, { action: 'update-profile-photo' })).code, 500);
    assert.equal((await request(member, { action: 'update-profile-photo', id: 'someone-else' })).code, 401);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
  }
});
