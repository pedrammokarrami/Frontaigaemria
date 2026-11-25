import { buildEnglishQuery } from './liveWebIntel';
import { webSearch } from './webSearchEngine';
import type { LobbyGameId } from '../utils/lobbySkillCatalog';

/**
 * Three-layer query architecture (user spec):
 *   L1 — Persian → English + "newest 2026 version" normalization
 *   L2 — local SQLite (FTS5 RAG DB + knowledge_cards store)
 *   L3 — miss → automatic free-API web search, results are STORED back into
 *        the local DB so the memory keeps growing ("هر چقدر منبع هست ذخیره شه").
 */

/** Map older franchise releases onto the newest one (2026 rules). */
const VERSION_BUMPS: Array<[RegExp, string]> = [
  [/fc ?2[0-6]|fifa ?2[0-3]/gi, 'FC 27'],
  [/nba ?2k2[0-6]/gi, 'NBA 2K27'],
  [/mw2?0?1?9?|modern warfare [12]/gi, 'Modern Warfare'],
  [/f1 ?2[0-4]/gi, 'F1 25'],
  [/efootball ?20(2[0-6])/gi, 'eFootball'],
  [/mlb the show 2[0-6]/gi, 'MLB The Show 27'],
  [/pes ?20(1[0-9]|2[0-6])/gi, 'eFootball'],
];

export function normalizeQuery2026(query: string): { en: string; bumped: string } {
  const en = buildEnglishQuery(query);
  let bumped = en;
  for (const [pattern, replacement] of VERSION_BUMPS) bumped = bumped.replace(pattern, replacement);
  return { en, bumped };
}

interface LocalHit {
  gameId: string;
  kind: string;
  title: string;
  body: string;
  sourceUrl: string;
  layer: 'L2-ftsr' | 'L2-cards';
}

async function queryLocalFts(query: string, platform?: string): Promise<LocalHit[]> {
  try {
    const { DatabaseSync } = await import('node:sqlite');
    const ragPath = new URL('../../backend/knowledge_engine/knowledge_10k.db', import.meta.url);
    const rag = new DatabaseSync(ragPath.pathname.replace(/^\/(\w:)/, '$1'), { readOnly: true });
    const tokens = query.toLowerCase().match(/[\w\u0600-\u06FF]+/g) ?? [];
    if (tokens.length === 0) return [];
    const match = tokens.map((t) => `"${t}"`).join(' ');
    const rows = rag
      .prepare(
        `SELECT m.game_id, m.kind, m.title, m.body, m.source_url, bm25(chunks_fts) AS rank
         FROM chunks_fts f JOIN chunks_meta m ON m.id = f.rowid
         WHERE chunks_fts MATCH ? ${platform ? 'AND m.platform LIKE ?' : ''} ORDER BY rank LIMIT 6`
      )
      .all(...(platform ? [match, `%${platform}%`] : [match]));
    return rows.map((r) => ({
      gameId: String(r.game_id ?? ''), kind: String(r.kind ?? ''), title: String(r.title ?? ''),
      body: String(r.body ?? ''), sourceUrl: String(r.source_url ?? ''), layer: 'L2-ftsr' as const,
    }));
  } catch {
    return [];
  }
}

async function storeWebHits(gameId: string, query: string, hits: Awaited<ReturnType<typeof webSearch>>): Promise<void> {
  try {
    const { getDb } = await import('../server/db');
    const db = getDb();
    const now = new Date().toISOString();
    for (const hit of hits.slice(0, 8)) {
      const key = (hit.url ?? hit.title ?? '').slice(0, 120);
      if (!key) continue;
      db.prepare(`
        INSERT INTO knowledge_cards (game_id, kind, dedupe_key, title, body, source, url, created_at, updated_at)
        VALUES (?, 'trick', ?, ?, ?, 'web-auto', ?, ?, ?)
        ON CONFLICT(game_id, kind, dedupe_key) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at
      `).run(gameId, key, (hit.title ?? '').slice(0, 200), (hit.snippet ?? '').slice(0, 400), hit.url ?? '', now, now);
    }
  } catch {
    // store is best-effort
  }
}

export interface TriLayerResult {
  layer: 'L1' | 'L2' | 'L3';
  normalizedEn: string;
  bumpedEn: string;
  local: LocalHit[];
  web: Array<{ title: string; url: string; source: string; body?: string }>;
  tookMs: number;
}

export async function triLayerQuery(
  rawQuery: string,
  gameId: LobbyGameId,
  platform?: string
): Promise<TriLayerResult> {
  const t0 = Date.now();
  // L1 — normalize Persian → English + bump old versions to the 2026 newest release
  const { en, bumped } = normalizeQuery2026(rawQuery);
  const query = bumped || en || rawQuery;

  // L2 — local SQLite (FTS5 engine DB + knowledge_cards)
  const [fts, cards] = await Promise.all([
    queryLocalFts(query, platform),
    queryKnowledgeCards(gameId, rawQuery),
  ]);
  const local = [...fts, ...cards];
  if (local.length >= 3) {
    return { layer: 'L2', normalizedEn: en, bumpedEn: bumped, local, web: [], tookMs: Date.now() - t0 };
  }

  // L3 — free-API web search, then persist hits so the memory grows
  const [hits, wikiHits] = await Promise.all([
    webSearch(`${query} ${gameId} guide tips 2026`, { limit: 8 }),
    queryWikipedia(query),
  ]);
  const merged = [...hits, ...wikiHits];
  await storeWebHits(gameId, query, merged as Parameters<typeof storeWebHits>[2]);
  return {
    layer: 'L3',
    normalizedEn: en,
    bumpedEn: bumped,
    local,
    web: merged.map((h) => ({ title: h.title ?? '', url: h.url ?? '', source: ('engine' in h ? h.engine : 'wikipedia') ?? 'web', body: h.snippet })),
    tookMs: Date.now() - t0,
  };
}

/** Keyless Wikipedia opensearch — always available, real URLs. */
async function queryWikipedia(query: string): Promise<Array<{ title: string; url: string; snippet: string; engine: 'wikipedia' }>> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=4&format=json&origin=*`;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 4000);
    const res = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'AIPETROS/1.0' } });
    clearTimeout(timer);
    if (!res.ok) return [];
    const body = await res.json();
    return (body?.query?.search ?? []).map((s: { title: string; snippet: string }) => ({
      title: s.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(s.title.replace(/ /g, '_'))}`,
      snippet: String(s.snippet ?? '').replace(/<[^>]+>/g, ''),
      engine: 'wikipedia' as const,
    }));
  } catch {
    return [];
  }
}

async function queryKnowledgeCards(gameId: string, query: string): Promise<LocalHit[]> {
  try {
    const { getDb } = await import('../server/db');
    const db = getDb();
    const tokens = query.toLowerCase().split(/\s+/).filter((t) => t.length >= 3);
    const rows = db.prepare('SELECT kind, title, body, url FROM knowledge_cards WHERE game_id = ? ORDER BY updated_at DESC LIMIT 400').all(gameId);
    const scored = rows
      .map((r) => {
        const hay = `${r.title} ${r.body}`.toLowerCase();
        let score = 0;
        for (const t of tokens) if (hay.includes(t)) score += 2;
        // 'qa' cards are curated 101-game answers — always valuable when the
        // question touches their topic at all.
        if (r.kind === 'qa') score += 3;
        if (r.kind === 'meta') score += 1;
        return { r, score };
      })
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score);
    // Fallback: when nothing matches, surface the game's curated QA cards
    // (skills / maps / meta / glitches / tips) — real answers, never blank.
    const usable = scored.length > 0
      ? scored
      : rows.filter((r) => r.kind === 'qa' || r.kind === 'meta').map((r) => ({ r, score: 1 }));
    return usable.slice(0, 6).map((e) => ({
      gameId, kind: String(e.r.kind ?? 'trick'), title: String(e.r.title ?? ''), body: String(e.r.body ?? ''),
      sourceUrl: String(e.r.url ?? ''), layer: 'L2-cards' as const,
    }));
  } catch {
    return [];
  }
}
