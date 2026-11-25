/**
 * iOS-like device detection for playback policy.
 * iPadOS reports as Macintosh with touch points; matches it too.
 */
export function isIosLikeDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iP(hone|ad|od)/.test(ua) || /iPad/.test(ua)) return true;
  return navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1;
}
