import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/announcements.js';
import { createAdminSession } from '../api/_admin.js';

test('Telegram-only publication never queries recipients, saves a portal row, or sends email', async () => {
  const env = { ...process.env }, originalFetch = globalThis.fetch;
  Object.assign(process.env, { EPA_ADMIN_USERNAME: 'test', EPA_ADMIN_PASSWORD: 'test-password', EPA_ADMIN_SESSION_SECRET: 'test-secret', TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHANNEL_ID: '@test-channel' });
  const calls = []; let telegramFails = false;
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://api.telegram.org/bottest-token/sendMessage', 'No database or email request is allowed');
    calls.push(JSON.parse(options.body));
    return Response.json(telegramFails ? { ok: false, description: 'Channel permission denied' } : { ok: true, result: { message_id: 123 } });
  };
  const invoke = async (token, extra = {}) => {
    const res = { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {}, body: {
      title: 'Channel news', content: 'Test message', telegram_only: true, publish_to_telegram: false,
      email_notify: true, test_email: 'must-not-send@example.org', recipient_member_ids: ['private-member'], ...extra,
    } }, res);
    return res;
  };
  try {
    assert.equal((await invoke()).code, 401); assert.equal(calls.length, 0);
    const token = createAdminSession().token;
    const result = await invoke(token);
    assert.equal(result.code, 201); assert.equal(result.body.emailed, 0); assert.deepEqual(result.body.emailReport, []);
    assert.equal(result.body.telegram.posted, true); assert.equal(calls.length, 1);
    assert.equal(calls[0].chat_id, '@test-channel'); assert.match(calls[0].text, /Channel news/);
    telegramFails = true;
    const failed = await invoke(token); assert.equal(failed.code, 502); assert.equal(failed.body.success, false);
    assert.match(failed.body.error, /Channel permission denied/);
    assert.equal((await invoke(token, { title: '' })).code, 400);
    delete process.env.TELEGRAM_BOT_TOKEN;
    const unconfigured = await invoke(token); assert.equal(unconfigured.code, 503); assert.equal(unconfigured.body.success, false);
  } finally { process.env = env; globalThis.fetch = originalFetch; }
});
