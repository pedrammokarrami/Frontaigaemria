import { z } from 'zod';
import { getDb, logSecurityEvent, nowIso, uuid } from './db';
import { cacheInvalidateTag } from './cache';
import { assertPublicHttpUrl, SsrfError, sanitizeText } from './security';
import { stableHash } from './cache';
import type { AuthUser } from './auth';

/**
 * Ingest & Publish pipeline:
 *   POST /ingest  → pending → processing → published | failed
 *   - kind: link (SSRF-guarded server fetch, meta extraction) or text (user content)
 *   - enrichment via the internal deterministic analyzer agent (no external AI)
 *   - every stage is persisted; the item exposes a real public publish URL
 */

export const ingestSchema = z
  .object({
    kind: z.enum(['link', 'text']),
    title: z.string().trim().min(1).max(120),
    sourceUrl: z.string().trim().url().max(2048).optional(),
    content: z.string().trim().max(20000).optional(),
  })
  .refine((v) => (v.kind === 'link' ? Boolean(v.sourceUrl) : Boolean(v.content)), {
    message: 'kind=link requires sourceUrl; kind=text requires content.',
  });

export interface IngestDto {
  id: string;
  kind: string;
  title: string;
  sourceUrl: string | null;
  status: 'pending' | 'processing' | 'published' | 'failed';
  statusError: string | null;
  enrichment: Record<string, unknown> | null;
  publishedUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface IngestRow {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  source_url: string | null;
  content: string | null;
  status: string;
  status_error: string | null;
  enriched_json: string | null;
  published_url: string | null;
  created_at: string;
  updated_at: string;
}

function toDto(row: IngestRow): IngestDto {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    sourceUrl: row.source_url,
    status: row.status as IngestDto['status'],
    statusError: row.status_error,
    enrichment: row.enriched_json ? (JSON.parse(row.enriched_json) as Record<string, unknown>) : null,
    publishedUrl: row.published_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* ------------------------------------------------------------------ */
/* Internal deterministic content analyzer agent (no external AI)      */
/* ------------------------------------------------------------------ */

export interface ContentEnrichment {
  agent: 'InternalContentAnalyzer';
  traceId: string;
  language: 'fa' | 'en' | 'mixed';
  wordCount: number;
  readingSeconds: number;
  summaryLine: string;
  keywords: string[];
  safety: { riskLevel: 'low' | 'medium' | 'high'; flags: string[] };
  score: number;
}

const RISK_PATTERNS: Array<{ flag: string; re: RegExp; level: 'medium' | 'high' }> = [
  { flag: 'credential-phishing', re: /\b(password|passwd|رمز[\s‌]*عبور)\b.{0,40}\b(enter|send|share|وارد|بفرست)\b/iu, level: 'high' },
  { flag: 'crypto-scam', re: /\b(giveaway|double your|سود[\s‌]*تضمینی|استخراج[\s‌]*رایگان)\b/iu, level: 'high' },
  { flag: 'malware-hint', re: /\b(crack|keygen|patcher|نصب[\s‌]*کرک)\b/iu, level: 'medium' },
  { flag: 'adult-content', re: /\b(porn|nsfw)\b/iu, level: 'medium' },
];

const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'you', 'your', 'from', 'have', 'are', 'was', 'not', 'but', 'its', 'into', 'over', 'game', 'games', 'و', 'در', 'به', 'از', 'که', 'این', 'را', 'با', 'برای', 'است', 'می', 'تا', 'هم']);

function analyzeContent(title: string, text: string): ContentEnrichment {
  const traceId = `agent_ing_${Date.now().toString(36)}_${stableHash({ title, text }).slice(0, 6)}`;
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const hasFa = /[\u0600-\u06FF]/.test(text);
  const hasEn = /[a-zA-Z]/.test(text);
  const language: ContentEnrichment['language'] = hasFa && hasEn ? 'mixed' : hasFa ? 'fa' : 'en';

  const flags: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  for (const rule of RISK_PATTERNS) {
    if (rule.re.test(text)) {
      flags.push(rule.flag);
      if (rule.level === 'high') riskLevel = 'high';
      else if (riskLevel === 'low') riskLevel = 'medium';
    }
  }

  const freq = new Map<string, number>();
  for (const raw of words) {
    const w = raw.toLowerCase().replace(/[^\p{L}\p{N}#]+/gu, '');
    if (w.length < 3 || STOPWORDS.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const keywords = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([w]) => w);

  const summaryLine = text.split(/\n|\.|!/)[0]?.trim().slice(0, 140) || title;
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        55 +
          Math.min(15, wordCount / 20) + // substance
          (riskLevel === 'low' ? 20 : riskLevel === 'medium' ? 0 : -30) + // safety
          Math.min(10, keywords.length * 2) // keyword richness
      )
    )
  );

  return {
    agent: 'InternalContentAnalyzer',
    traceId,
    language,
    wordCount,
    readingSeconds: Math.max(3, Math.round((wordCount / 200) * 60)),
    summaryLine,
    keywords,
    safety: { riskLevel, flags },
    score,
  };
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                            */
/* ------------------------------------------------------------------ */

const FETCH_TIMEOUT_MS = 6000;
const MAX_FETCH_BYTES = 2_000_000;

async function fetchAndExtractMeta(url: URL): Promise<{ title: string | null; text: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AIPETROS-Ingest/1.0 (+https://aipetros.app)', Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
    });
    if (!resp.ok) throw new Error(`Upstream returned HTTP ${resp.status}.`);
    const contentType = resp.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      throw new Error(`Unsupported content type "${contentType.split(';')[0]}".`);
    }
    const raw = await resp.text();
    const html = raw.slice(0, MAX_FETCH_BYTES);
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? sanitizeText(titleMatch[1].replace(/\s+/g, ' '), 120) : null;
    const text = sanitizeText(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' '),
      20000
    );
    return { title, text };
  } finally {
    clearTimeout(timer);
  }
}

export function listIngestItems(user: AuthUser, opts: { page: number; pageSize: number }): { items: IngestDto[]; total: number; page: number; pageSize: number } {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) AS n FROM ingest_items WHERE user_id = ?').get(user.id) as { n: number }).n;
  const rows = db
    .prepare('SELECT * FROM ingest_items WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(user.id, opts.pageSize, (opts.page - 1) * opts.pageSize) as unknown as IngestRow[];
  return { items: rows.map(toDto), total, page: opts.page, pageSize: opts.pageSize };
}

export function getIngestItem(user: AuthUser, id: string): IngestDto {
  const row = getDb().prepare('SELECT * FROM ingest_items WHERE id = ? AND user_id = ?').get(id, user.id) as unknown as IngestRow | undefined;
  if (!row) {
    const err = new Error('Ingest item not found.');
    (err as { statusCode?: number }).statusCode = 404;
    (err as { code?: string }).code = 'NOT_FOUND';
    throw err;
  }
  return toDto(row);
}

/**
 * Full synchronous ingest run. The status machine is persisted at every step so
 * interrupted runs are observable: pending → processing → published | failed.
 */
export async function runIngest(user: AuthUser, input: z.infer<typeof ingestSchema>, ip: string | null): Promise<IngestDto> {
  const db = getDb();
  const id = uuid('ing');
  const ts = nowIso();
  db.prepare('INSERT INTO ingest_items (id, user_id, kind, title, source_url, content, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id,
    user.id,
    input.kind,
    sanitizeText(input.title, 120),
    input.sourceUrl ?? null,
    input.content ? sanitizeText(input.content, 20000) : null,
    'pending',
    ts,
    ts
  );
  logSecurityEvent('ingest.created', { userId: user.id, ip, detail: `${input.kind}:${sanitizeText(input.title, 60)}` });

  const setStatus = (status: string, error: string | null, enriched: string | null, publishedUrl: string | null): void => {
    db.prepare('UPDATE ingest_items SET status = ?, status_error = ?, enriched_json = ?, published_url = ?, updated_at = ? WHERE id = ?').run(
      status,
      error,
      enriched,
      publishedUrl,
      nowIso(),
      id
    );
  };

  setStatus('processing', null, null, null);

  try {
    let analysisText = '';
    if (input.kind === 'link' && input.sourceUrl) {
      // SSRF-hardened server-side fetch
      let url: URL;
      try {
        url = await assertPublicHttpUrl(input.sourceUrl);
      } catch (err) {
        if (err instanceof SsrfError) {
          setStatus('failed', `SSRF guard: ${err.message}`, null, null);
          logSecurityEvent('ingest.ssrf_blocked', { userId: user.id, ip, detail: input.sourceUrl });
          const err2 = new Error(`SSRF guard: ${err.message}`);
          (err2 as { statusCode?: number }).statusCode = 400;
          (err2 as { code?: string }).code = 'SSRF_BLOCKED';
          throw err2;
        }
        throw err;
      }
      const meta = await fetchAndExtractMeta(url);
      analysisText = sanitizeText(meta.text ?? '', 20000);
      if (meta.title) {
        db.prepare('UPDATE ingest_items SET title = ? WHERE id = ?').run(sanitizeText(meta.title, 120), id);
      }
      if (!analysisText) {
        setStatus('failed', 'No readable text content at the given URL.', null, null);
        const err = new Error('No readable text content at the given URL.');
        (err as { statusCode?: number }).statusCode = 422;
        (err as { code?: string }).code = 'EMPTY_CONTENT';
        throw err;
      }
    } else {
      analysisText = sanitizeText(input.content ?? '', 20000);
    }

    // Internal deterministic enrichment agent
    const enrichment = analyzeContent(sanitizeText(input.title, 120), analysisText);
    const publishedUrl = `/api/v1/ingest/${id}/published`;
    const status = enrichment.safety.riskLevel === 'high' ? 'failed' : 'published';
    if (status === 'failed') {
      setStatus('failed', `Safety agent rejected content: ${enrichment.safety.flags.join(', ')}`, JSON.stringify(enrichment), null);
    } else {
      setStatus('published', null, JSON.stringify(enrichment), publishedUrl);
    }
    logSecurityEvent(`ingest.${status}`, { userId: user.id, ip, detail: enrichment.traceId });
    cacheInvalidateTag(`ingest:${user.id}`);
    return getIngestItem(user, id);
  } catch (err) {
    // ensure any unexpected error still marks the item failed
    const row = getDb().prepare('SELECT status FROM ingest_items WHERE id = ?').get(id) as { status: string } | undefined;
    if (row && row.status !== 'failed') {
      setStatus('failed', err instanceof Error ? err.message : 'Unexpected ingest failure.', null, null);
    }
    if ((err as { statusCode?: number }).statusCode) throw err;
    const wrapped = new Error(err instanceof Error ? err.message : 'Unexpected ingest failure.');
    (wrapped as { statusCode?: number }).statusCode = 502;
    (wrapped as { code?: string }).code = 'INGEST_FAILED';
    throw wrapped;
  }
}
