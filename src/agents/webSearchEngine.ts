import { stableHash } from '../server/cache';

/**
 * AIPETROS Free Web Search — zero API keys, zero cost.
 * Fan-out across open search engines with graceful fallback:
 *   1. DuckDuckGo HTML endpoint
 *   2. DuckDuckGo Lite endpoint
 *   3. SearXNG public instances (JSON enabled)
 * Deterministic ranking + 5-min cache. Never throws.
 *
 * Reference open-source projects (same approach, no keys):
 *   - github.com/searxng/searxng      → self-hosted metasearch, JSON output
 *   - github.com/benbusby/whoogle-search → self-hosted Google proxy
 *   - github.com/nickclyde/duckduckgo-search (py) → DDG scraping lib
 */

export interface WebSearchHit {
  title: string;
  url: string;
  snippet: string;
  engine: 'ddg' | 'ddg-lite' | 'searxng' | 'github';
}

const REQUEST_TIMEOUT_MS = 3_000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_SNIPPET = 260;

/** Public SearXNG instances that historically allow JSON output. Checked best-effort. */
const SEARXNG_INSTANCES = [
  'https://searx.be',
  'https://paulgo.io',
  'https://search.bus-hit.me',
  'https://opnxng.com',
];

/** Local self-hosted SearXNG (documented in DEPLOY.md) is always tried first. */
const LOCAL_SEARXNG_URLS: string[] = [
  process.env.SEARXNG_URL ?? '',
  'http://localhost:8888/search',
].filter((u) => u.length > 0);

const searchCache = new Map<string, { at: number; hits: WebSearchHit[] }>();

export function clearWebSearchCache(): void {
  searchCache.clear();
}

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Decode DDG's redirect links: /l/?uddg=https%3A%2F%2F...&rut=... */
function decodeDdgUrl(href: string): string {
  try {
    const url = new URL(href, 'https://duckduckgo.com');
    const uddg = url.searchParams.get('uddg');
    if (uddg) return uddg;
    return url.toString();
  } catch {
    return href;
  }
}

/* ---------------- DuckDuckGo HTML (html.duckduckgo.com) ---------------- */

async function searchDuckDuckGo(query: string, fetcher: typeof fetch): Promise<WebSearchHit[]> {
  try {
    const resp = await fetcher('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36',
      },
      body: `q=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!resp.ok) return [];
    const html = await resp.text();
    const hits: WebSearchHit[] = [];
    const linkRegex = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let match: RegExpExecArray | null;
    const snippets = [...html.matchAll(/<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => m[1]);
    let idx = 0;
    while ((match = linkRegex.exec(html)) !== null && hits.length < 8) {
      const title = clean(match[2].replace(/<[^>]*>/g, ''));
      const url = decodeDdgUrl(match[1]);
      if (!title || !url.startsWith('http')) continue;
      const snippet = clean(String(snippets[idx] ?? '').replace(/<[^>]*>/g, '')).slice(0, MAX_SNIPPET);
      idx += 1;
      hits.push({ title, url, snippet, engine: 'ddg' });
    }
    return hits;
  } catch {
    return [];
  }
}

/* ---------------- DuckDuckGo Lite (lite.duckduckgo.com) ---------------- */

async function searchDuckDuckGoLite(query: string, fetcher: typeof fetch): Promise<WebSearchHit[]> {
  try {
    const resp = await fetcher(`https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!resp.ok) return [];
    const html = await resp.text();
    const hits: WebSearchHit[] = [];
    const rowRegex = /<a[^>]+class="result-link"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let match: RegExpExecArray | null;
    while ((match = rowRegex.exec(html)) !== null && hits.length < 8) {
      const title = clean(match[2].replace(/<[^>]*>/g, ''));
      const url = decodeDdgUrl(match[1]);
      if (!title || !url.startsWith('http')) continue;
      hits.push({ title, url, snippet: '', engine: 'ddg-lite' });
    }
    return hits;
  } catch {
    return [];
  }
}

/* ---------------- Local / public SearXNG (JSON) ---------------- */

async function searchLocalSearxng(query: string, fetcher: typeof fetch): Promise<WebSearchHit[]> {
  for (const base of LOCAL_SEARXNG_URLS) {
    try {
      const url = base.includes('?') ? `${base}=${encodeURIComponent(query)}&format=json` : `${base}?q=${encodeURIComponent(query)}&format=json`;
      const resp = await fetcher(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!resp.ok) continue;
      const data = (await resp.json()) as { results?: Array<{ title?: string; url?: string; content?: string }> };
      const hits = (data.results ?? [])
        .filter((r) => r.title && r.url)
        .slice(0, 8)
        .map((r) => ({
          title: clean(String(r.title)).slice(0, 140),
          url: String(r.url),
          snippet: clean(String(r.content ?? '')).slice(0, MAX_SNIPPET),
          engine: 'searxng' as const,
        }));
      if (hits.length > 0) return hits;
    } catch {
      continue;
    }
  }
  return [];
}

async function searchSearxng(query: string, fetcher: typeof fetch): Promise<WebSearchHit[]> {
  const local = await searchLocalSearxng(query, fetcher);
  if (local.length > 0) return local;
  for (const base of SEARXNG_INSTANCES) {
    try {
      const resp = await fetcher(
        `${base}/search?q=${encodeURIComponent(query)}&format=json&language=auto&safesearch=1`,
        { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
      );
      if (!resp.ok) continue;
      const data = (await resp.json()) as { results?: Array<{ title?: string; url?: string; content?: string }> };
      const hits = (data.results ?? [])
        .filter((r) => r.title && r.url)
        .slice(0, 8)
        .map((r) => ({
          title: clean(String(r.title)).slice(0, 140),
          url: String(r.url),
          snippet: clean(String(r.content ?? '')).slice(0, MAX_SNIPPET),
          engine: 'searxng' as const,
        }));
      if (hits.length > 0) return hits;
    } catch {
      continue;
    }
  }
  return [];
}

/* ---------------- GitHub repository search (anonymous, 10 req/min) ---------------- */

async function searchGithub(query: string, fetcher: typeof fetch): Promise<WebSearchHit[]> {
  try {
    const resp = await fetcher(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=4&sort=best-match`,
      { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'AIPETROS-Live-Intel/1.0' }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    );
    if (!resp.ok) return [];
    const data = (await resp.json()) as { items?: Array<{ full_name?: string; html_url?: string; description?: string; stargazers_count?: number }> };
    return (data.items ?? [])
      .filter((r) => r.full_name && r.html_url)
      .map((r) => ({
        title: `${r.full_name}${r.stargazers_count ? ` (★${r.stargazers_count})` : ''}`,
        url: String(r.html_url),
        snippet: clean(String(r.description ?? '')).slice(0, MAX_SNIPPET),
        engine: 'github' as const,
      }));
  } catch {
    return [];
  }
}

/**
 * Rank hits by token overlap with the query (deterministic), drop duplicates.
 */
function rankHits(query: string, hits: WebSearchHit[]): WebSearchHit[] {
  const tokens = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 3);
  const seen = new Set<string>();
  const unique = hits.filter((h) => {
    if (seen.has(h.url)) return false;
    seen.add(h.url);
    return true;
  });
  if (tokens.length === 0) return unique;
  return unique
    .map((h) => {
      const hay = `${h.title} ${h.snippet}`.toLowerCase();
      let score = 0;
      for (const t of tokens) if (hay.includes(t)) score += 2;
      return { h, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.h);
}

/**
 * Free multi-engine web search. Engines run in parallel; results merge,
 * dedupe, and rank. Always resolves (offline → []).
 */
export async function webSearch(
  query: string,
  options: { limit?: number; fetcher?: typeof fetch } = {}
): Promise<WebSearchHit[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const cacheKey = stableHash({ ws: cleanQuery });
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.hits.slice(0, options.limit ?? 6);
  }

  const fetcher = options.fetcher ?? globalThis.fetch;
  const [ddg, lite, searx, github] = await Promise.all([
    searchDuckDuckGo(cleanQuery, fetcher),
    searchDuckDuckGoLite(cleanQuery, fetcher),
    searchSearxng(cleanQuery, fetcher),
    searchGithub(cleanQuery, fetcher),
  ]);

  // Prefer snippet-rich results first, then fill from the others.
  const merged = [...ddg, ...searx, ...github, ...lite];
  const ranked = rankHits(cleanQuery, merged).slice(0, options.limit ?? 6);
  searchCache.set(cacheKey, { at: Date.now(), hits: ranked });
  return ranked;
}
