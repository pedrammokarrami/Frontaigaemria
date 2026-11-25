import { getDb } from './db';
import { nowIso } from './db';

/**
 * AIGAMERIA Internal Behavioral & Context Analysis Agent
 * =====================================================
 * Observes real user actions (clicks, dwell, queries, game switches,
 * platform cues, language, scenario transitions), persists them, and builds
 * a progressive profile that lets the UI move from the GENERIC public-trends
 * baseline (first-time users, zero pre-seeded bias) to hyper-relevant,
 * fresh, game-specific content.
 *
 * Design rules (user-mandated):
 *  - Zero pre-seeded preferences: a profile with no events is `baseline`,
 *    and the UI must serve generic trends across all categories.
 *  - Freshness: only events from the last FRESH_WINDOW_DAYS shape weights;
 *    stale content is explicitly filtered by `freshnessCutoff`.
 *  - Deterministic + explainable: every profile field carries a confidence
 *    and the top evidence behind it.
 */

export type BehaviorEventKind =
  | 'card_click'
  | 'chip_click'
  | 'question'
  | 'game_select'
  | 'dwell'
  | 'scroll'
  | 'platform_cue'
  | 'language_cue'
  | 'session_start';

export interface BehaviorEvent {
  userId: string;
  kind: BehaviorEventKind;
  /** normalized payload: { gameId?, realm?, category?, query?, platform?, lang?, dwellMs?, ts? } */
  payload: Record<string, unknown>;
}

export interface BehaviorProfile {
  userId: string;
  scenario:
    | 'baseline' // first-time / no interactions → generic trends only
    | 'engaged' // light signals, generic-first with soft lean
    | 'focused' // clear game + category preference
    | 'pivot'; // user suddenly moved to a new game
  topGames: Array<{ gameId: string; weight: number; confidence: number }>;
  topCategories: Array<{ category: string; weight: number; confidence: number }>;
  playstyle: 'casual' | 'regular' | 'hardcore' | 'unknown';
  searchPattern: 'vague' | 'meta' | 'troubleshooting' | 'comparison' | 'unknown';
  ageCue: 'teen' | 'young-adult' | 'adult' | 'unknown';
  language: string;
  platform: string;
  confidence: number; // 0..1 overall
  freshnessCutoffDays: number;
  evidence: string[];
}

const FRESH_WINDOW_DAYS = 30;
const PIVOT_RATIO = 2.2; // new game must outweigh the old by 2.2× to be a pivot
const CONFIDENT_EVENTS = 12; // events needed for full confidence

const GAME_REALM: Record<string, string> = {
  fc27: 'sports',
  nba2k27: 'sports',
  efootball: 'sports',
  cs2: 'shooter',
  valorant: 'shooter',
  cod: 'shooter',
  'warzone': 'shooter',
  apex: 'shooter',
  gta: 'story',
  'red-dead': 'story',
  'elden-ring': 'story',
  cyberpunk: 'story',
  dota2: 'strategy',
  lol: 'strategy',
  starcraft: 'strategy',
  civ: 'strategy',
};

function realmOfGame(gameId: string): string {
  const key = gameId.toLowerCase();
  for (const [needle, realm] of Object.entries(GAME_REALM)) {
    if (key.includes(needle)) return realm;
  }
  return 'unknown';
}

function detectRealmOfQuery(query: string): string | null {
  const q = query.toLowerCase();
  if (/(crosshair|smoke|flash|aim|frag|economy|buy round|counter[- ]?strafe)/.test(q)) return 'shooter';
  if (/(formation|finesse|penalty|pitch|squad|green timing|finesse shot)/.test(q)) return 'sports';
  if (/(heist|mission|story|side quest|open world|rp\b)/.test(q)) return 'story';
  if (/(build order|meta deck|lane|creep|apm|macro)/.test(q)) return 'strategy';
  return null;
}

function detectSearchPattern(query: string): BehaviorProfile['searchPattern'] {
  if (!query) return 'unknown';
  const q = query.toLowerCase();
  if (/(why|fix|not working|bug|error|problem|crash)/.test(q)) return 'troubleshooting';
  if (/(vs\b|versus|compare|better)/.test(q)) return 'comparison';
  if (/(patch|meta|update|nerf|buff|tier)/.test(q)) return 'meta';
  if (q.split(/\s+/).length <= 2) return 'vague';
  return 'meta';
}

function ageCueFromEvent(payload: Record<string, unknown>, current: string): string {
  if (typeof payload.ageCue === 'string') return payload.ageCue;
  return current;
}

function record(userId: string, kind: BehaviorEventKind, payload: Record<string, unknown>): void {
  getDb()
    .prepare(
      'INSERT INTO user_behavior (user_id, kind, payload, created_at) VALUES (?, ?, ?, ?)'
    )
    .run(String(userId).slice(0, 64), kind, JSON.stringify(payload ?? {}).slice(0, 2000), nowIso());
}

/** Weight decay: recent events matter fully, older ones fade linearly. */
function ageWeight(tsMs: number, nowMs: number): number {
  const days = Math.max(0, (nowMs - tsMs) / 86_400_000);
  if (days > FRESH_WINDOW_DAYS) return 0; // stale — explicitly filtered out
  return 1 - days / FRESH_WINDOW_DAYS;
}

export function recordEvent(ev: BehaviorEvent): void {
  record(ev.userId, ev.kind, ev.payload);
}

/** Event time: clients may send `occurredAt` (ISO) for offline-collected
 *  actions; the agent trusts it for freshness math (bounded to now). */
function eventTs(payload: Record<string, unknown>, fallback: string): number {
  const raw = typeof payload.occurredAt === 'string' ? Date.parse(payload.occurredAt) : NaN;
  if (!Number.isNaN(raw)) return Math.min(raw, Date.now());
  return Date.parse(fallback) || Date.now();
}

export function buildProfile(userId: string): BehaviorProfile {
  let rows: Array<{ kind: string; payload: string; created_at: string }> = [];
  try {
    rows = getDb()
      .prepare('SELECT kind, payload, created_at FROM user_behavior WHERE user_id = ? ORDER BY id ASC LIMIT 500')
      .all(String(userId).slice(0, 64)) as typeof rows;
  } catch {
    rows = [];
  }
  const now = Date.now();
  const events = rows.map((r) => {
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(r.payload);
    } catch {
      payload = {};
    }
    const ts = eventTs(payload, r.created_at);
    return { kind: r.kind, payload, ts, decay: ageWeight(ts, now) };
  });

  const evidence: string[] = [];
  if (events.length === 0) {
    return {
      userId,
      scenario: 'baseline',
      topGames: [],
      topCategories: [],
      playstyle: 'unknown',
      searchPattern: 'unknown',
      ageCue: 'unknown',
      language: 'unknown',
      platform: 'unknown',
      confidence: 0,
      freshnessCutoffDays: FRESH_WINDOW_DAYS,
      evidence: ['no interactions yet — serve generic public trends only'],
    };
  }

  // ── game & category weights (freshness-decayed) ─────────────────────────
  const gameW = new Map<string, number>();
  const catW = new Map<string, number>();
  let dwellTotal = 0;
  let dwellCount = 0;
  let platform = 'unknown';
  let language = 'unknown';
  let ageCue = 'unknown';
  const patterns = new Map<string, number>();

  for (const ev of events) {
    const p = ev.payload;
    const gameId = typeof p.gameId === 'string' ? p.gameId.toLowerCase() : null;
    const query = typeof p.query === 'string' ? p.query : '';
    const w = ev.decay;

    if (gameId && (ev.kind === 'game_select' || ev.kind === 'card_click' || ev.kind === 'question')) {
      const base = ev.kind === 'game_select' ? 2.5 : ev.kind === 'question' ? 1.6 : 1.2;
      const w2 = base * w;
      if (w2 > 0) gameW.set(gameId, (gameW.get(gameId) ?? 0) + w2); // stale events add nothing
    }
    const realm = (gameId ? realmOfGame(gameId) : null) ?? detectRealmOfQuery(query);
    if (realm && realm !== 'unknown' && w > 0) {
      catW.set(realm, (catW.get(realm) ?? 0) + w);
    }
    if (ev.kind === 'dwell' && typeof p.dwellMs === 'number') {
      dwellTotal += p.dwellMs;
      dwellCount += 1;
    }
    if (typeof p.platform === 'string' && p.platform) platform = p.platform;
    if (typeof p.lang === 'string' && p.lang) language = p.lang;
    ageCue = ageCueFromEvent(p, ageCue);
    if (ev.kind === 'question') {
      const sp = detectSearchPattern(query);
      if (sp !== 'unknown') patterns.set(sp, (patterns.get(sp) ?? 0) + 1);
    }
  }

  const topGames = [...gameW.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([gameId, weight]) => ({ gameId, weight: Math.round(weight * 10) / 10, confidence: Math.min(1, weight / 6) }));
  const topCategories = [...catW.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, weight]) => ({ category, weight: Math.round(weight * 10) / 10, confidence: Math.min(1, weight / 8) }));

  // ── scenario ──────────────────────────────────────────────────────────────
  let scenario: BehaviorProfile['scenario'] = 'engaged';
  if (topGames.length === 0) {
    scenario = 'baseline';
  } else if (topGames.length >= 2) {
    const [first, second] = topGames;
    if (first.weight < second.weight * PIVOT_RATIO) scenario = 'pivot';
    else scenario = 'focused';
  } else {
    scenario = topGames[0].confidence >= 0.5 ? 'focused' : 'engaged';
  }

  // ── playstyle from dwell + event volume ───────────────────────────────────
  const avgDwell = dwellCount ? dwellTotal / dwellCount : 0;
  const playstyle: BehaviorProfile['playstyle'] =
    avgDwell >= 45_000 || events.length >= 40 ? 'hardcore' : avgDwell >= 12_000 || events.length >= 12 ? 'regular' : events.length >= 3 ? 'casual' : 'unknown';

  // ── search pattern (majority) ─────────────────────────────────────────────
  const topPattern = [...patterns.entries()].sort((a, b) => b[1] - a[1])[0];

  const confidence = Math.min(1, events.length / CONFIDENT_EVENTS);
  if (topGames[0]) evidence.push(`dominant game: ${topGames[0].gameId} (w=${topGames[0].weight})`);
  if (topCategories[0]) evidence.push(`dominant category: ${topCategories[0].category}`);
  if (scenario === 'pivot') evidence.push('pivot detected: new game outweighs previous focus');
  if (topPattern) evidence.push(`search pattern: ${topPattern[0]}`);

  return {
    userId,
    scenario,
    topGames,
    topCategories,
    playstyle,
    searchPattern: (topPattern?.[0] as BehaviorProfile['searchPattern']) ?? 'unknown',
    ageCue: (ageCue as BehaviorProfile['ageCue']) ?? 'unknown',
    language,
    platform,
    confidence: Math.round(confidence * 100) / 100,
    freshnessCutoffDays: FRESH_WINDOW_DAYS,
    evidence,
  };
}

/**
 * What the feed should serve: 'baseline' → generic trends across ALL
 * categories; otherwise the user's top category/games — always fresh-only.
 */
export function feedIntent(profile: BehaviorProfile): {
  mode: 'generic' | 'personalized';
  categories: string[];
  games: string[];
} {
  if (profile.scenario === 'baseline' || profile.confidence < 0.25) {
    return { mode: 'generic', categories: ['sports', 'shooter', 'story', 'strategy'], games: [] };
  }
  return {
    mode: 'personalized',
    categories: profile.topCategories.map((c) => c.category),
    games: profile.topGames.map((g) => g.gameId),
  };
}
