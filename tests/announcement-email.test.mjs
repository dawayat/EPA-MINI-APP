import test from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import { announcementEmail } from '../api/_email.js';
import handler from '../api/announcements.js';
import { createAdminSession } from '../api/_admin.js';

const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=';
const venueUrl = 'https://maps.app.goo.gl/test-venue';
const announcement = {
  title: 'Annual Conference & General Assembly', type: 'Event',
  content: 'Dear EPA Members,\n\n**Event Details**\n• **Date:** October 17\n\n<script>unsafe</script>',
  attachments: [{ type: 'cover', url: pixel }, { type: 'location', url: venueUrl, name: 'Venue & Hall', address: 'Addis Ababa', map_image_url: pixel }]
};

test('images are inline MIME parts in individual and grouped messages', async () => {
  const email = announcementEmail('EPA Member', announcement);
  assert.equal(email.attachments.length, 2);
  assert.ok(email.html.includes('<strong>Event Details</strong>'));
  assert.ok(email.html.includes('&lt;script&gt;unsafe&lt;/script&gt;'));
  assert.ok(!email.html.includes('Hello EPA Member'));
  assert.ok(!email.html.includes('data:image'));
  assert.ok(email.text.includes(venueUrl));
  assert.equal((email.html.match(/href="https:\/\/maps.app.goo.gl\/test-venue"/g) || []).length, 3);
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
  for (const bcc of [undefined, 'member@example.org']) {
    const result = await transport.sendMail({ from: 'epa@example.org', to: 'test@example.org', bcc, ...email });
    const mime = result.message.toString();
    assert.ok(mime.includes('multipart/related'));
    assert.ok(mime.includes('Content-ID: <location-map@epa>'));
    assert.ok(mime.includes('Content-ID: <venue@epa>'));
  }
});

test('invalid links and missing map images fail before sending', () => {
  for (const url of ['javascript:alert(1)', 'https://google.com.evil.example/maps', 'http://maps.google.com/maps', 'https://user:pass@maps.google.com/maps']) {
    assert.throws(() => announcementEmail('Member', { ...announcement, attachments: [{ type: 'location', url, map_image_url: pixel }] }));
  }
  assert.throws(() => announcementEmail('Member', { ...announcement, attachments: [{ type: 'location', url: venueUrl }] }));
  assert.ok(announcementEmail('Member', announcement, { preview: true }).html.includes(pixel));
});

test('test email contacts only its one recipient and never persists or broadcasts', async () => {
  const keys = ['EPA_ADMIN_USERNAME', 'EPA_ADMIN_PASSWORD', 'EPA_ADMIN_SESSION_SECRET', 'GMAIL_USER', 'GMAIL_APP_PASSWORD'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  Object.assign(process.env, { EPA_ADMIN_USERNAME: 'test-admin', EPA_ADMIN_PASSWORD: 'test-password', EPA_ADMIN_SESSION_SECRET: 'test-session-secret', GMAIL_USER: 'sender@example.org', GMAIL_APP_PASSWORD: 'test-app-password' });
  const originalTransport = nodemailer.createTransport;
  const originalFetch = globalThis.fetch;
  let sent;
  nodemailer.createTransport = () => ({ sendMail: async options => { sent = options; return { messageId: 'test-message-id' }; } });
  globalThis.fetch = async () => { throw new Error('A test must not access the database, Telegram, or broadcast APIs'); };
  try {
    const res = { statusCode: 0, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ method: 'POST', headers: { authorization: `Bearer ${createAdminSession().token}` }, body: { ...announcement, test_email: 'dawitaynalem92@gmail.com', publish_to_telegram: true } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(sent.to, 'dawitaynalem92@gmail.com');
    assert.equal(sent.bcc, undefined);
    assert.equal(sent.attachments.length, 2);
    assert.ok(sent.subject.startsWith('[TEST — not sent to members]'));
    assert.equal(res.body.recipient, sent.to);
    sent = undefined;
    await handler({ method: 'POST', headers: { authorization: `Bearer ${createAdminSession().token}` }, body: { ...announcement, test_email: 'first@example.org,second@example.org' } }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(sent, undefined);
    await handler({ method: 'POST', headers: {}, body: { ...announcement, test_email: 'test@example.org' } }, res);
    assert.equal(res.statusCode, 401);
    assert.equal(sent, undefined);
  } finally {
    nodemailer.createTransport = originalTransport;
    globalThis.fetch = originalFetch;
    for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
  }
});
