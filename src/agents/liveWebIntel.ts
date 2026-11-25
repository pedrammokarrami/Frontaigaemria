import { stableHash } from '../server/cache';
import { webSearch } from './webSearchEngine.ts';

/**
 * AIPETROS Live Web Intelligence — the agents' gateway to the open web.
 * No AI APIs and no API keys: only free public JSON/HTML endpoints with
 * hard timeouts and SSRF-safe fixed hosts. Deterministic ranking + caching.
 */

export interface LiveSource {
  title: string;
  url: string;
  snippet: string;
  source: 'wikipedia' | 'reddit' | 'hackernews' | 'steamnews' | 'web';
}

export interface LiveIntelResult {
  query: string;
  sources: LiveSource[];
  tookMs: number;
  online: boolean;
}

const REQUEST_TIMEOUT_MS = 2_800;
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_SNIPPET = 220;

const intelCache = new Map<string, { at: number; result: LiveIntelResult }>();

export function clearLiveIntelCache(): void {
  intelCache.clear();
}

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Common Persian gaming/coaching terms → English, so public sources return results. */
const FA_QUERY_TERMS: Array<[RegExp, string]> = [
  [/بهترین/g, 'best'],
  [/ترکیب|چینش/g, 'formation'],
  [/فرماسیون/g, 'formation'],
  [/تاکتیک/g, 'tactics'],
  [/دفاع/g, 'defense'],
  [/حمله|هجوم/g, 'attack'],
  [/شوت/g, 'shooting'],
  [/پاس/g, 'passing'],
  [/دریبل/g, 'dribbling'],
  [/دروازه ?بان|گلر/g, 'goalkeeper'],
  [/ضرب ?هفت/g, 'corner'],
  [/اس‌بی‌سی|اس بی سی/g, 'SBC squad building challenges'],
  [/چلنج/g, 'challenge'],
  [/ایم|ایمنی|هدف ?گیری/g, 'aim'],
  [/اسنایپ|تیرکش/g, 'sniper'],
  [/هفته ?آخری|متا/g, 'meta'],
  [/چترت|تیلت/g, 'tilt'],
  [/اقتصاد/g, 'economy'],
  [/کشیدن ?طناب|طناب ?کشی/g, 'rope pull'],
  [/هریک|سرزنی/gi, 'header'],
  [/دبل ?س/gi, 'double scissor'],
  [/بارسا|بارسلونا/gi, 'Barcelona'],
  [/رئال|ر ?مادرید/gi, 'Real Madrid'],
  [/میلان/gi, 'AC Milan'],
  [/لیورپول/gi, 'Liverpool'],
  [/یوونتوس/gi, 'Juventus'],
  [/با ?یرن/gi, 'Bayern Munich'],
  [/پاری ?سن ?ژرمن/gi, 'PSG'],
  [/فیفا|ف ?ای ?فا/gi, 'FIFA'],
  [/سریع[\s‌]?ترین/g, 'fastest'],
  [/سریع[\s‌]?تر/g, 'fast'],
  [/بازیکن/gi, 'player'],
  [/پوزیشن/gi, 'position'],
  [/مهارت/gi, 'skill'],
  [/ریتینگ|امتیاز/gi, 'rating'],
  [/پچ/gi, 'patch'],
  [/ایجنت/gi, 'agent'],
  [/ویدیو|فیلم/gi, 'video'],
  [/(?<![\w])فی(?![\w])/gi, 'FC'],
];

/** Produce an English-friendly variant of a (possibly Persian) query. */
export function buildEnglishQuery(query: string): string {
  let out = query;
  for (const [pattern, replacement] of FA_QUERY_TERMS) out = out.replace(pattern, replacement);
  // Drop leftover Persian characters — sources cannot match them.
  out = out.replace(/[\u0600-\u06FF]/g, ' ').replace(/\s+/g, ' ').trim();
  return out.length >= 3 ? out : '';
}

/* ---------------- Wikipedia (millions of articles, fa + en) ---------------- */

async function fetchWikipedia(query: string, lang: 'en' | 'fa', fetcher: typeof fetch): Promise<LiveSource[]> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&srprop=snippet`;
    const resp = await fetcher(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!resp.ok) return [];
    const data = (await resp.json()) as { query?: { search?: Array<{ title?: string; snippet?: string }> } };
    const hits = data.query?.search ?? [];
    return hits
      .filter((h) => h.title)
      .map((h) => ({
        title: clean(h.title ?? ''),
        url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(String(h.title).replace(/ /g, '_'))}`,
        snippet: clean(String(h.snippet ?? '').replace(/<[^>]*>/g, '')).slice(0, MAX_SNIPPET),
        source: 'wikipedia' as const,
      }));
  } catch {
    return [];
  }
}

/* ---------------- Reddit (live community, public JSON) ---------------- */

async function fetchReddit(query: string, fetcher: typeof fetch): Promise<LiveSource[]> {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=4&raw_json=1`;
    const resp = await fetcher(url, {
      headers: { 'User-Agent': 'AIPETROS-Live-Intel/1.0 (+https://aipetros.app)' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!resp.ok) return [];
    const data = (await resp.json()) as { data?: { children?: Array<{ data?: { title?: string; selftext?: string; permalink?: string; subreddit?: string } }> } };
    const children = data.data?.children ?? [];
    return children
      .map((c) => c.data)
      .filter((d) => d?.title)
      .map((d) => ({
        title: clean(String(d?.title ?? '')).slice(0, 140),
        url: `https://www.reddit.com${String(d?.permalink ?? '')}`,
        snippet: clean(String(d?.selftext ?? '')).slice(0, MAX_SNIPPET) || `Community discussion in r/${d?.subreddit ?? 'gaming'}`,
        source: 'reddit' as const,
      }));
  } catch {
    return [];
  }
}

/* ---------------- Hacker News Algolia (millions of indexed links) ---------------- */

async function fetchHackerNews(query: string, fetcher: typeof fetch): Promise<LiveSource[]> {
  try {
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=3`;
    const resp = await fetcher(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!resp.ok) return [];
    const data = (await resp.json()) as { hits?: Array<{ title?: string; url?: string; story_text?: string; objectID?: string }> };
    return (data.hits ?? [])
      .filter((h) => h.title)
      .map((h) => ({
        title: clean(String(h.title)).slice(0, 140),
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        snippet: clean(String(h.story_text ?? '').replace(/<[^>]*>/g, '')).slice(0, MAX_SNIPPET) || 'Community-indexed discussion',
        source: 'hackernews' as const,
      }));
  } catch {
    return [];
  }
}

/* ---------------- Steam news (per-game live updates) ---------------- */

async function fetchSteamNews(gameName: string, fetcher: typeof fetch): Promise<LiveSource[]> {
  try {
    const searchResp = await fetcher(
      `https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(gameName)}`,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    );
    if (!searchResp.ok) return [];
    const apps = (await searchResp.json()) as Array<{ appid?: number; name?: string }>;
    const appid = apps?.[0]?.appid;
    if (!appid) return [];
    const newsResp = await fetcher(
      `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appid}&count=2&maxlength=250&format=json`,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    );
    if (!newsResp.ok) return [];
    const news = (await newsResp.json()) as { appnews?: { newsitems?: Array<{ title?: string; url?: string; contents?: string }> } };
    return (news.appnews?.newsitems ?? [])
      .filter((n) => n.title)
      .map((n) => ({
        title: clean(String(n.title)).slice(0, 140),
        url: String(n.url ?? `https://store.steampowered.com/news/app/${appid}`),
        snippet: clean(String(n.contents ?? '')).slice(0, MAX_SNIPPET) || 'Official game news',
        source: 'steamnews' as const,
      }));
  } catch {
    return [];
  }
}

/** Rank sources by keyword overlap with the query (deterministic). */
function rankByRelevance(query: string, sources: LiveSource[]): LiveSource[] {
  const tokens = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 3);
  if (tokens.length === 0) return sources;
  const scored = sources.map((s) => {
    const hay = `${s.title} ${s.snippet}`.toLowerCase();
    let score = 0;
    for (const t of tokens) if (hay.includes(t)) score += 2;
    // prefer primary reference sources on ties
    if (s.source === 'wikipedia') score += 1;
    if (s.source === 'web') score += 1;
    return { s, score };
  });
  return scored.sort((a, b) => b.score - a.score).map((x) => x.s);
}

/**
 * Gather live web intelligence for a coach question.
 * Parallel fan-out to all sources with hard timeouts; always resolves
 * (offline → sources=[]), so agents never block or crash on the network.
 */
export async function gatherLiveWebIntel(
  query: string,
  options: { gameName?: string; fetcher?: typeof fetch; timeoutBudgetMs?: number } = {}
): Promise<LiveIntelResult> {
  const started = Date.now();
  const cleanQuery = query.trim();
  if (!cleanQuery) return { query: cleanQuery, sources: [], tookMs: 0, online: false };

  const cacheKey = stableHash({ q: cleanQuery, g: options.gameName ?? '' });
  const cached = intelCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { ...cached.result, tookMs: Date.now() - started };
  }

  const fetcher = options.fetcher ?? globalThis.fetch;
  const isFa = /[\u0600-\u06FF]/.test(cleanQuery);
  const gameName = options.gameName ?? '';
  // Sources understand English far better — build an English variant for them.
  const sourceQuery = buildEnglishQuery(cleanQuery) || cleanQuery;

  const [wikiEn, wikiFa, reddit, hn, steam, webHits] = await Promise.all([
    fetchWikipedia(sourceQuery, 'en', fetcher),
    isFa ? fetchWikipedia(cleanQuery, 'fa', fetcher) : Promise.resolve([]),
    fetchReddit(`${gameName ? gameName + ' ' : ''}${sourceQuery}`, fetcher),
    fetchHackerNews(sourceQuery, fetcher),
    gameName ? fetchSteamNews(gameName, fetcher) : Promise.resolve([]),
    webSearch(sourceQuery, { fetcher, limit: 5 }),
  ]);

  const merged = [
    ...webHits.map((h) => ({ title: h.title, url: h.url, snippet: h.snippet, source: 'web' as const })),
    ...wikiEn,
    ...wikiFa,
    ...steam,
    ...reddit,
    ...hn,
  ];
  const deduped: LiveSource[] = [];
  const seenUrls = new Set<string>();
  for (const s of merged) {
    if (seenUrls.has(s.url)) continue;
    seenUrls.add(s.url);
    deduped.push(s);
  }

  const ranked = rankByRelevance(cleanQuery, deduped).slice(0, 6);
  const result: LiveIntelResult = {
    query: cleanQuery,
    sources: ranked,
    tookMs: Date.now() - started,
    online: ranked.length > 0,
  };
  intelCache.set(cacheKey, { at: Date.now(), result });
  return result;
}

/** Compose the live-intel section of a coach answer (bilingual). */
export function formatLiveIntelSection(intel: LiveIntelResult, isFa: boolean): string {
  if (!intel.online) return '';
  const header = isFa
    ? '🌐 تازه‌ترین اطلاعات آنلاین (منابع زنده):'
    : '🌐 Latest live web intel:';
  const parts: string[] = [header];
  for (const s of intel.sources.slice(0, 4)) {
    const badge =
      s.source === 'wikipedia' ? 'Wikipedia' : s.source === 'reddit' ? 'Reddit' : s.source === 'steamnews' ? 'Steam News' : s.source === 'web' ? 'Web' : 'HN';
    const snippet = s.snippet ? ' — ' + s.snippet.slice(0, 140) : '';
    parts.push('• [' + badge + '] ' + s.title + snippet);
    parts.push('  ' + s.url);
  }
  return parts.join('\n');
}

