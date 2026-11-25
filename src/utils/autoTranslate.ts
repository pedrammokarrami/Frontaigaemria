import { useEffect, useRef, useState } from 'react';

/**
 * Auto-translate English coach text into Persian for the Persian-first UI.
 * Zero external AI APIs: uses AIPETROS' own keyless proxy (`/api/translate`,
 * MyMemory primary + Google gtx secondary) with a server-side cache.
 * Falls back to the original text on any failure.
 */

const cache = new Map<string, string>();

export function isMostlyEnglish(text: string): boolean {
  if (!text) return false;
  const letters = text.replace(/[^\p{L}]/gu, '');
  if (letters.length < 3) return false;
  const latin = text.replace(/[^A-Za-z]/g, '').length;
  return latin / letters.length > 0.55;
}

export function useAutoTranslateFa(text: string, enabled: boolean): string {
  const [out, setOut] = useState(text);
  const inflightRef = useRef<string | null>(null);

  useEffect(() => {
    const key = text;
    if (!enabled || !key || !isMostlyEnglish(key)) {
      setOut(key);
      inflightRef.current = null;
      return;
    }
    const cached = cache.get(key);
    if (cached) {
      setOut(cached);
      return;
    }
    inflightRef.current = key;
    let cancelled = false;
    fetch(`/api/translate?to=fa&q=${encodeURIComponent(key.slice(0, 480))}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: { ok?: boolean; text?: string }) => {
        if (cancelled || inflightRef.current !== key) return;
        if (data?.ok && data.text) {
          cache.set(key, data.text);
          setOut(data.text);
        } else {
          setOut(key); // graceful fallback to the original English tip
        }
      })
      .catch(() => {
        if (!cancelled && inflightRef.current === key) setOut(key);
      });
    return () => {
      cancelled = true;
    };
  }, [text, enabled]);

  return out;
}
