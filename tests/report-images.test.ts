import test from 'node:test';
import assert from 'node:assert/strict';
import { reportImageDataUrl } from '../src/lib/reportImages';

test('report embeds readable raster images and rejects images that could taint export', async () => {
  const originalFetch = globalThis.fetch;
  const originalReader = globalThis.FileReader;
  const requests: RequestInit[] = [];
  class Reader {
    result: string | null = null;
    onload?: () => void;
    async readAsDataURL(blob: Blob) {
      this.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`;
      this.onload?.();
    }
  }
  globalThis.FileReader = Reader as any;
  try {
    globalThis.fetch = async (_source, options) => {
      requests.push(options!);
      return new Response('photo-bytes', { headers: { 'Content-Type': 'image/png' } });
    };
    assert.equal(await reportImageDataUrl('/api/media?kind=member-photo&id=1'), 'data:image/png;base64,cGhvdG8tYnl0ZXM=');
    assert.equal(requests[0].mode, 'cors');
    assert.equal(requests[0].credentials, 'same-origin');
    assert.ok(requests[0].signal);
    globalThis.fetch = async () => { throw new TypeError('CORS denied after redirect'); };
    assert.equal(await reportImageDataUrl('/redirect-to-external-photo'), null);
    globalThis.fetch = async () => ({ ok: true, type: 'opaque' }) as Response;
    assert.equal(await reportImageDataUrl('/opaque-photo'), null);
    globalThis.fetch = async () => new Response('<svg/>', { headers: { 'Content-Type': 'image/svg+xml' } });
    assert.equal(await reportImageDataUrl('/svg-with-external-resources'), null);
    globalThis.fetch = async () => new Response('', { status: 404 });
    assert.equal(await reportImageDataUrl('/missing-photo'), null);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.FileReader = originalReader;
  }
});
