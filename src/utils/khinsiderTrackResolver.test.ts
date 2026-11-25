import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractKhinsiderMp3Url,
  MAX_PAYNE_DIRECT_MP3_FALLBACK_URL,
  MAX_PAYNE_KHINSIDER_PAGE_URL,
  parseByteRangeHeader,
} from './khinsiderTrackResolver';

test('extractKhinsiderMp3Url prefers <audio src> over page links', () => {
  const html = `
    <html>
      <body>
        <link rel="canonical" href="${MAX_PAYNE_KHINSIDER_PAGE_URL}" />
        <audio id="audio" controls src="https://nu.vgmtreasurechest.com/soundtracks/max-payne-2001/ikkkynmkio/23.%20Max%20Theme%20Short.mp3"></audio>
      </body>
    </html>
  `;
  assert.equal(
    extractKhinsiderMp3Url(html),
    'https://nu.vgmtreasurechest.com/soundtracks/max-payne-2001/ikkkynmkio/23.%20Max%20Theme%20Short.mp3'
  );
});

test('extractKhinsiderMp3Url skips khinsider HTML album URL and extracts CDN mp3 link', () => {
  const html = `
    <a href="${MAX_PAYNE_KHINSIDER_PAGE_URL}">Page</a>
    <a href="${MAX_PAYNE_DIRECT_MP3_FALLBACK_URL}">Click here to download as MP3</a>
  `;
  assert.equal(extractKhinsiderMp3Url(html), MAX_PAYNE_DIRECT_MP3_FALLBACK_URL);
});

test('extractKhinsiderMp3Url returns null when no mp3 link exists', () => {
  assert.equal(extractKhinsiderMp3Url('<html><body>No audio here</body></html>'), null);
});

test('parseByteRangeHeader handles full response, open-ended range, bounded range, and invalid range', () => {
  const full = parseByteRangeHeader(undefined, 1000);
  assert.deepEqual(full, { start: 0, end: 999, length: 1000, isPartial: false });

  const openEnded = parseByteRangeHeader('bytes=0-', 1000);
  assert.deepEqual(openEnded, { start: 0, end: 999, length: 1000, isPartial: true });

  const bounded = parseByteRangeHeader('bytes=100-249', 1000);
  assert.deepEqual(bounded, { start: 100, end: 249, length: 150, isPartial: true });

  const suffix = parseByteRangeHeader('bytes=-200', 1000);
  assert.deepEqual(suffix, { start: 800, end: 999, length: 200, isPartial: true });

  const clamped = parseByteRangeHeader('bytes=900-5000', 1000);
  assert.deepEqual(clamped, { start: 900, end: 999, length: 100, isPartial: true });

  assert.equal(parseByteRangeHeader('bytes=1200-1500', 1000), null);
});
