/**
 * sanitizeUiText — visible UI strings must never leak Persian characters or
 * raw debug tokens into the English UI (zero mixed-language mandate).
 */
const DEBUG_TOKEN_RX =
  /\b(?:isFa|isPlaying|debug|undefined|null|NaN|\$4|gameId=|RENDER_STAGE)\b/g;

export function sanitizeUiText(text: string, lang: string): string {
  if (!text) return '';
  let out = text;
  if (lang && !lang.startsWith('fa')) {
    // English (and every non-Persian) UI: strip Persian/Arabic script chars.
    out = out.replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
  }
  out = out.replace(DEBUG_TOKEN_RX, '').replace(/\s{2,}/g, ' ').trim();
  return out;
}
