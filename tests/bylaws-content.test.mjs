import test from 'node:test';
import assert from 'node:assert/strict';
import { createCipheriv, randomBytes } from 'node:crypto';
import { decryptBylaws } from '../api/_bylaws_content.js';

test('encrypted articles require the correct server key and reject tampering', () => {
  const key = randomBytes(32), iv = randomBytes(12);
  const document = { title: 'Test Articles', paragraphs: [{ text: 'Private clause' }] };
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(document)), cipher.final()]);
  const envelope = { version: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), content: encrypted.toString('base64') };
  assert.deepEqual(decryptBylaws(envelope, key.toString('hex')), document);
  assert.throws(() => decryptBylaws(envelope, undefined));
  assert.throws(() => decryptBylaws(envelope, randomBytes(32).toString('hex')));
  assert.throws(() => decryptBylaws({ ...envelope, version: 2 }, key.toString('hex')));
  encrypted[0] ^= 1;
  assert.throws(() => decryptBylaws({ ...envelope, content: encrypted.toString('base64') }, key.toString('hex')));
});
