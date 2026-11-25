export const MAX_PAYNE_KHINSIDER_PAGE_URL =
  'https://downloads.khinsider.com/game-soundtracks/album/max-payne-2001/23.%2520Max%2520Theme%2520Short.mp3';

export const MAX_PAYNE_DIRECT_MP3_FALLBACK_URL =
  'https://nu.vgmtreasurechest.com/soundtracks/max-payne-2001/ikkkynmkio/23.%20Max%20Theme%20Short.mp3';

export interface ByteRangeSlice {
  start: number;
  end: number;
  length: number;
  isPartial: boolean;
}

/**
 * Extracts the direct audio/mpeg download URL from a downloads.khinsider.com
 * track HTML page (which wraps the CDN MP3 link inside <audio src="..."> and download links).
 */
export function extractKhinsiderMp3Url(html: string): string | null {
  if (!html || typeof html !== 'string') return null;

  // Prefer the embedded <audio id="audio" src="..."> source when present
  const audioTagMatch = html.match(/<audio[^>]+src=["'](https:\/\/[^"']+\.mp3(?:\?[^"']*)?)["']/i);
  if (audioTagMatch?.[1]) {
    return audioTagMatch[1];
  }

  // Fallback to any direct https://*.mp3 download link that is not the khinsider HTML page itself
  const allMatches = html.matchAll(/https:\/\/[^"'<>\s]+\.mp3(?:\?[^"'<>\s]*)?/gi);
  for (const match of allMatches) {
    const candidate = match[0];
    if (!candidate.includes('downloads.khinsider.com/game-soundtracks/album/')) {
      return candidate;
    }
  }

  return null;
}

/**
 * Parses an HTTP Range header (e.g. "bytes=0-1023" or "bytes=1024-") against a known buffer size.
 * Returns null if the requested range is unsatisfiable (should return 416).
 */
export function parseByteRangeHeader(
  rangeHeader: string | undefined,
  totalBytes: number
): ByteRangeSlice | null {
  if (!Number.isFinite(totalBytes) || totalBytes <= 0) {
    return null;
  }

  if (!rangeHeader || !rangeHeader.trim()) {
    return {
      start: 0,
      end: totalBytes - 1,
      length: totalBytes,
      isPartial: false,
    };
  }

  const match = rangeHeader.trim().match(/^bytes=(\d*)-(\d*)$/i);
  if (!match) {
    return {
      start: 0,
      end: totalBytes - 1,
      length: totalBytes,
      isPartial: false,
    };
  }

  const rawStart = match[1];
  const rawEnd = match[2];

  let start: number;
  let end: number;

  if (rawStart === '' && rawEnd !== '') {
    // Suffix byte range: bytes=-500
    const suffixLen = Number(rawEnd);
    if (!Number.isFinite(suffixLen) || suffixLen <= 0) return null;
    start = Math.max(0, totalBytes - suffixLen);
    end = totalBytes - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === '' ? totalBytes - 1 : Math.min(totalBytes - 1, Number(rawEnd));
  }

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    start >= totalBytes ||
    end < start
  ) {
    return null;
  }

  return {
    start,
    end,
    length: end - start + 1,
    isPartial: true,
  };
}
