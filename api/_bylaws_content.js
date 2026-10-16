import { readFileSync } from 'node:fs';
import { createDecipheriv } from 'node:crypto';

export function decryptBylaws(envelope, encodedKey) {
  if (!/^[a-f0-9]{64}$/i.test(encodedKey || '')) throw new Error('Bylaws decryption is not configured.');
  if (envelope.version !== 1) throw new Error('Unsupported bylaws document version.');
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(encodedKey, 'hex'), Buffer.from(envelope.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.content, 'base64')), decipher.final()]).toString('utf8'));
}

export function readBylawsDocument() {
  const envelope = JSON.parse(readFileSync(new URL('../server-data/bylaws.encrypted.json', import.meta.url), 'utf8'));
  return decryptBylaws(envelope, process.env.EPA_BYLAWS_CONTENT_KEY);
}
