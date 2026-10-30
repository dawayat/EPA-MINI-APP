import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/members.js';
import { createAdminSession } from '../api/_admin.js';
import { createMemberSession } from '../api/_member_session.js';
import { renewalExpiry } from '../shared/membership-renewal.js';
import { renewalApprovalEmail } from '../api/_email.js';

test('renewal dates preserve remaining time, restart expired terms, and clamp leap days', () => {
  const now = new Date('2026-10-30T12:00:00Z');
  assert.equal(renewalExpiry('2026-09-10T00:00:00Z', now), '2027-10-30T12:00:00.000Z');
  assert.equal(renewalExpiry('2027-03-01T00:00:00Z', now), '2028-03-01T00:00:00.000Z');
  assert.equal(renewalExpiry('invalid', now), '2027-10-30T12:00:00.000Z');
  assert.equal(renewalExpiry('2028-02-29T00:00:00Z', now), '2029-02-28T00:00:00.000Z');
});

test('renewals and name changes enforce permissions, save dates, and notify members', async () => {
  const env = { ...process.env }, originalFetch = globalThis.fetch;
  Object.assign(process.env, { EPA_ADMIN_USERNAME: 'admin', EPA_ADMIN_PASSWORD: 'password', EPA_ADMIN_SESSION_SECRET: 'admin-secret', EPA_MEMBER_SESSION_SECRET: 'member-secret', SUPABASE_URL: 'https://database.test', SUPABASE_SERVICE_ROLE_KEY: 'key', RESEND_API_KEY: 'test-resend', EMAIL_FROM: 'EPA <epa@example.com>' });
  delete process.env.GMAIL_USER; delete process.env.GMAIL_APP_PASSWORD;
  let saved = { id: 'm1', first_name: 'Alem', father_name: 'Tesfaye', membership_number: 'EPA-1', email: 'member@example.com', status: 'ACTIVE', expires_at: '2027-01-31T00:00:00.000Z', issued_at: '2020-01-01T00:00:00Z', phone_password: 'private', renewal_request: { status: 'PENDING', payment: { receipt_url: 'data:image/png;base64,aGVsbG8=', transaction_number: 'CBE123' } } };
  let writes = 0, emails = 0, failEmail = false, loseRace = false;
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).includes('api.resend.com')) {
      emails++;
      const body = JSON.parse(options.body);
      assert.deepEqual(body.to, [saved.email]);
      assert.match(body.text, /Valid until:/);
      return failEmail ? new Response('delivery unavailable', { status: 500 }) : Response.json({ id: 'email-1' });
    }
    const parsed = new URL(url);
    assert.equal(parsed.hostname, 'database.test');
    if (options.method === 'PATCH') {
      writes++;
      const changes = JSON.parse(options.body);
      if (loseRace) return Response.json([]);
      if (parsed.searchParams.has('expires_at')) {
        assert.equal(parsed.searchParams.get('expires_at'), 'eq.' + saved.expires_at);
        assert.equal(changes.issued_at, undefined);
      }
      saved = { ...saved, ...changes };
      return options.headers.Prefer === 'return=representation' ? Response.json([saved]) : new Response(null, { status: 204 });
    }
    return Response.json([saved]);
  };
  const request = async (method, token, body = {}, query = {}) => {
    const res = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
    await handler({ method, headers: token ? { authorization: `Bearer ${token}` } : {}, body, query }, res);
    return res;
  };
  try {
    const admin = createAdminSession().token, member = createMemberSession('m1').token;
    const approval = { action: 'approve-renewal', memberId: 'm1' };
    assert.equal((await request('POST', member, approval)).code, 401);
    assert.equal((await request('GET', member, {}, { view: 'renewal', id: 'm1' })).code, 401);
    const detail = await request('GET', admin, {}, { view: 'renewal', id: 'm1' });
    assert.match(detail.data.payment.receipt_url, /^data:image/);
    assert.match(detail.headers['Cache-Control'], /no-store/);
    assert.equal(writes, 0);
    loseRace = true;
    assert.equal((await request('POST', admin, approval)).code, 409);
    assert.equal(emails, 0);
    loseRace = false;
    const result = await request('POST', admin, approval);
    assert.equal(result.code, 200); assert.equal(result.data.emailed, true);
    assert.equal(saved.expires_at, '2028-01-31T00:00:00.000Z');
    assert.equal(saved.status, 'ACTIVE'); assert.equal(emails, 1);
    assert.equal(result.data.member.phone_password, undefined);
    assert.equal((await request('POST', admin, approval)).code, 409);
    assert.equal(emails, 1);
    const manual = { action: 'admin-renew', memberId: 'm1', expected_expires_at: saved.expires_at, transaction_number: 'OFFLINE456', amount: 1500, payment_date: '2026-01-01' };
    assert.equal((await request('POST', member, manual)).code, 401);
    assert.equal((await request('POST', admin, { ...manual, amount: -1 })).code, 400);
    assert.equal((await request('POST', admin, { ...manual, expected_expires_at: 'old' })).code, 409);
    failEmail = true;
    const offline = await request('POST', admin, manual);
    assert.equal(offline.code, 200); assert.equal(offline.data.emailed, false); assert.ok(offline.data.emailError);
    assert.equal(saved.expires_at, '2029-01-31T00:00:00.000Z');
    assert.equal(saved.renewal_request.source, 'ADMIN');
    assert.equal(saved.renewal_request.reviewed_by, 'admin');
    assert.equal((await request('POST', admin, manual)).code, 409);
    failEmail = false;
    const expiryBeforeResend = saved.expires_at;
    const writesBeforeResend = writes;
    assert.equal((await request('POST', member, { action: 'resend-renewal-email', memberId: 'm1' })).code, 401);
    assert.equal((await request('POST', admin, { action: 'resend-renewal-email', memberId: 'm1' })).data.emailed, true);
    assert.equal(saved.expires_at, expiryBeforeResend);
    assert.equal(writes, writesBeforeResend);
    const names = { action: 'update-name', id: 'm1', first_name: '  New  ', father_name: 'Name', grandfather_name: '', amharic_full_name: '', status: 'SUSPENDED' };
    assert.equal((await request('PATCH', createMemberSession('other').token, names)).code, 401);
    assert.equal((await request('PATCH', member, { ...names, first_name: ' ' })).code, 400);
    const renamed = await request('PATCH', member, names);
    assert.equal(renamed.code, 200); assert.equal(saved.first_name, 'New'); assert.equal(saved.status, 'ACTIVE');
    assert.equal(renamed.data.member.phone_password, undefined);
    assert.equal((await request('PATCH', member, { ...names, action: 'admin-update-name' })).code, 401);
    assert.equal((await request('PATCH', admin, { ...names, action: 'admin-update-name' })).code, 200);
    assert.equal((await request('POST', '', { action: 'submit-renewal', memberId: 'm1' })).code, 401);
    const email = renewalApprovalEmail({ ...saved, first_name: '<script>' });
    assert.ok(email.html.includes('&lt;script&gt;')); assert.ok(!email.html.includes('<script>'));
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
  }
});
