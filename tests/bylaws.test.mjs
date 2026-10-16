import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/_bylaws.js';
import { createMemberSession } from '../api/_member_session.js';
import { createAdminSession } from '../api/_admin.js';

test('bylaws enforce identity, global activation, per-member access and trusted audit attribution', async () => {
  process.env.EPA_MEMBER_SESSION_SECRET = 'test-member-secret';
  process.env.EPA_ADMIN_SESSION_SECRET = 'test-admin-secret';
  process.env.EPA_ADMIN_USERNAME = 'admin';
  process.env.EPA_ADMIN_PASSWORD = 'test-password';
  let enabled = false, restricted = false;
  const events = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, options = {}) => {
    const address = String(url);
    const body = options.body ? JSON.parse(options.body) : null;
    if (address.includes('/bylaws_settings')) {
      if (body) enabled = body.enabled;
      return Response.json([{ id: 'articles', enabled }]);
    }
    if (address.includes('/bylaws_access')) {
      if (body) restricted = body.restricted;
      return Response.json([{ member_id: 'm1', restricted }]);
    }
    if (address.includes('/bylaws_events')) {
      if (body) events.push(body);
      return Response.json(events);
    }
    if (address.includes('/members')) return Response.json([{ id: 'm1', first_name: 'Ada', father_name: 'Test', membership_number: 'EPA-001', status: 'ACTIVE' }]);
    throw new Error('Unexpected fetch');
  };
  const call = async ({ token, admin, memberId = 'm1', view, body } = {}) => {
    const res = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
    await handler({ method: body ? 'POST' : 'GET', query: { admin: admin ? 'true' : '', memberId, view }, headers: token ? { authorization: `Bearer ${token}` } : {}, body }, res, () => ({ paragraphs: [{ text: 'Test document clause', label: '6.1.' }] }));
    assert.match(res.headers['Cache-Control'], /no-store/);
    return res;
  };
  try {
    const member = createMemberSession('m1').token;
    const admin = createAdminSession().token;
    assert.equal((await call({ view: 'content' })).code, 401);
    assert.equal((await call({ token: member, memberId: 'm2', view: 'content' })).code, 401);
    assert.equal((await call({ token: member, admin: true })).code, 401);
    assert.deepEqual((await call({ token: member })).data, { available: false });
    assert.equal((await call({ token: member, view: 'content' })).code, 403);
    assert.equal((await call({ token: admin, admin: true, body: { operation: 'activation', enabled: true } })).code, 200);
    const content = await call({ token: member, view: 'content' });
    assert.equal(content.code, 200);
    assert.equal(content.data.watermark, 'Ada Test · EPA-001');
    assert.equal(content.data.paragraphs[0].text, 'Test document clause');
    assert.ok(content.data.paragraphs.some(p => p.label === '6.1.'));
    await call({ token: member, body: { event: 'capture_shortcut', actor: 'someone else', member_id: 'm2' } });
    assert.equal(events.at(-1).member_id, 'm1');
    assert.equal(events.at(-1).actor, 'Ada Test · EPA-001');
    assert.equal((await call({ token: member, body: { event: 'screenshot_confirmed' } })).code, 400);
    await call({ token: admin, admin: true, body: { operation: 'access', memberId: 'm1', restricted: true } });
    assert.equal((await call({ token: member, view: 'content' })).code, 403);
    await call({ token: admin, admin: true, body: { operation: 'access', memberId: 'm1', restricted: false } });
    assert.equal((await call({ token: member, view: 'content' })).code, 200);
    await call({ token: admin, admin: true, body: { operation: 'activation', enabled: false } });
    assert.equal((await call({ token: member, view: 'content' })).code, 403);
  } finally { global.fetch = originalFetch; }
});
