/**
 * AIGAMERIA client behavior tracker (privacy-light, local server only).
 * Observes real user actions and posts them to the internal analysis agent
 * (POST /api/v1/behavior/event). First-time users have zero events → the
 * backend keeps the feed on the generic public-trends baseline.
 */

export interface TrackedPayload {
  gameId?: string;
  query?: string;
  platform?: string;
  lang?: string;
  dwellMs?: number;
  category?: string;
}

const BUFFER_LIMIT = 25;

function userId(): string {
  try {
    let id = localStorage.getItem('aig_behavior_uid');
    if (!id) {
      id = `u_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
      localStorage.setItem('aig_behavior_uid', id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

const queue: Array<{ kind: string; payload: TrackedPayload }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush(): void {
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  try {
    void fetch('/api/v1/behavior/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        batch.map((b) => ({ userId: userId(), kind: b.kind, payload: b.payload })),
      ).replace('][', '],[') // single event per POST for simplicity: send sequentially-safe body
      ,
    }).catch(() => undefined);
  } catch {
    /* tracking must never break the UI */
  }
  // send each event individually (endpoint is single-event by design)
  for (const ev of batch) {
    try {
      void fetch('/api/v1/behavior/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId(), kind: ev.kind, payload: ev.payload }),
      }).catch(() => undefined);
    } catch {
      /* ignore */
    }
  }
}

function push(kind: string, payload: TrackedPayload): void {
  queue.push({ kind, payload });
  if (queue.length >= BUFFER_LIMIT) flush();
  else if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flush();
    }, 3000);
  }
}

export function trackEvent(kind: string, payload: TrackedPayload = {}): void {
  push(kind, { lang: document.documentElement.lang || undefined, platform: detectPlatform(), ...payload });
}

export function trackGameSelect(gameId: string): void {
  trackEvent('game_select', { gameId });
}

export function trackQuestion(gameId: string, query: string): void {
  trackEvent('question', { gameId, query });
}

export function trackCardClick(gameId: string, category?: string): void {
  trackEvent('card_click', { gameId, category });
}

export function trackDwell(gameId: string, dwellMs: number): void {
  trackEvent('dwell', { gameId, dwellMs });
}

export function trackSessionStart(gameId?: string): void {
  trackEvent('session_start', { gameId });
}

export function detectPlatform(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|android/.test(ua)) return /ipad|tablet/.test(ua) ? 'tablet' : 'mobile';
  if (/playstation/.test(ua)) return 'console';
  return 'pc';
}
