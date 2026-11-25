import type { NextFunction, Request, RequestHandler, Response } from 'express';
import dns from 'node:dns';
import net from 'node:net';
import { randomUUID } from 'node:crypto';
import { logSecurityEvent } from './db';

/** Request id + structured request/response logging. */
export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) ?? randomUUID();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  const started = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - started;
    if (ms > 1000 || res.statusCode >= 500) {
      console.warn(JSON.stringify({ requestId, method: req.method, path: req.originalUrl, status: res.statusCode, ms }));
    }
  });
  next();
}

/** Security headers (CSP, clickjacking, MIME sniffing, referrer, HSTS). */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  const isAnalyzEmbed = req.path.startsWith('/analyz');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      // Vite dev + inline styling needs unsafe-inline for styles; scripts stay self (+ blob for HLS)
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : ''} blob:`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://fonts.googleapis.com https://fonts.gstatic.com https:",
      "media-src 'self' blob: data: https:",
      "connect-src 'self' blob: data: ws: wss: https:",
      // the vendored analyz stage is embedded as an iframe on our own origin
      isAnalyzEmbed ? "frame-ancestors 'self'" : "frame-ancestors 'none'",
      'base-uri \'self\'',
      "form-action 'self'",
    ].join('; ')
  );
  if (!isAnalyzEmbed) res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  if (req.secure || process.env.FORCE_HSTS === '1') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

/** Restrictive CORS: same-origin by default, explicit allowlist via CORS_ORIGINS. */
export function corsGuard(allowedOrigins: string[]): RequestHandler {
  return (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  };
}

/* ------------------------------------------------------------------ */
/* Rate limiting (fixed-window, per bucket, in-memory)                 */
/* ------------------------------------------------------------------ */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(opts: { windowMs: number; max: number; keyBy?: (req: Request) => string }): RequestHandler {
  return (req, res, next) => {
    const keyPart = opts.keyBy ? opts.keyBy(req) : clientIp(req);
    const bucketKey = `${req.baseUrl || req.path}:${keyPart}`;
    const now = Date.now();
    let bucket = buckets.get(bucketKey);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + opts.windowMs };
      buckets.set(bucketKey, bucket);
    }
    bucket.count += 1;
    if (buckets.size > 10000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    res.setHeader('X-RateLimit-Limit', String(opts.max));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > opts.max) {
      const retrySec = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retrySec));
      res.status(429).json(errorEnvelope(res.locals.requestId, 'RATE_LIMITED', `Too many requests. Retry in ${retrySec}s.`));
      return;
    }
    next();
  };
}

export function clientIp(req: Request): string {
  // trust proxy is disabled; the socket address is the only trustworthy IP
  return req.socket.remoteAddress ?? 'unknown';
}

/* ------------------------------------------------------------------ */
/* SSRF guard — allow only public http(s) targets                       */
/* ------------------------------------------------------------------ */

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true; // loopback/private/this-network
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
    if (a === 192 && b === 168) return true; // 192.168/16
    if (a === 169 && b === 254) return true; // link-local
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::' || lower.startsWith('fc') || lower.startsWith('fd')) return true; // v6 loopback/ULA
  if (lower.startsWith('fe80')) return true; // v6 link-local
  // IPv4-mapped IPv6 (::ffff:10.x etc.)
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIp(mapped[1]);
  return false;
}

function resolveHost(host: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    dns.lookup(host, { all: true, verbatim: true }, (err, addresses) => {
      if (err) reject(err);
      else resolve(addresses.map((a) => a.address));
    });
  });
}

/**
 * Validates a user-supplied URL before any server-side fetch.
 * Blocks non-http(s) schemes, credentials in URL, and private/loopback targets
 * (checked both for IP literals and after DNS resolution — DNS pinning safe).
 */
export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SsrfError('Malformed URL.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SsrfError(`Blocked scheme "${parsed.protocol}". Only http/https is allowed.`);
  }
  if (parsed.username || parsed.password) {
    throw new SsrfError('URLs with embedded credentials are not allowed.');
  }
  const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (!host) throw new SsrfError('URL has no hostname.');

  // block obvious metadata/internal hostnames before DNS
  if (host === 'metadata.google.internal' || host.endsWith('.internal') || host.endsWith('.local') || host === 'localhost') {
    throw new SsrfError(`Blocked internal host "${host}".`);
  }

  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new SsrfError(`Blocked private IP target "${host}".`);
    return parsed;
  }

  let addresses: string[];
  try {
    addresses = await resolveHost(host);
  } catch {
    throw new SsrfError(`Host "${host}" could not be resolved.`);
  }
  if (addresses.length === 0) throw new SsrfError(`Host "${host}" has no addresses.`);
  for (const ip of addresses) {
    if (isPrivateIp(ip)) throw new SsrfError(`Blocked: "${host}" resolves to private IP ${ip}.`);
  }
  return parsed;
}

export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SsrfError';
  }
}

/* ------------------------------------------------------------------ */
/* Input sanitization                                                  */
/* ------------------------------------------------------------------ */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Strips control chars + trims; rendering stays React-escaped (XSS-safe by design). */
export function sanitizeText(input: string, maxLength = 4000): string {
  return String(input)
    .replace(CONTROL_CHARS, '')
    .slice(0, maxLength)
    .trim();
}

/** Escape for contexts where text is embedded into non-React markup. */
export function escapeHtml(input: string): string {
  return String(input)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/* ------------------------------------------------------------------ */
/* Standard API envelope                                               */
/* ------------------------------------------------------------------ */

export interface ApiMeta {
  requestId: string;
  page?: number;
  pageSize?: number;
  total?: number;
  cached?: boolean;
  [k: string]: unknown;
}

export function successEnvelope(requestId: string, data: unknown, meta: Partial<ApiMeta> = {}): unknown {
  return { success: true, data, error: null, meta: { requestId, ...meta } };
}

export function errorEnvelope(requestId: string, code: string, message: string, meta: Partial<ApiMeta> = {}): unknown {
  return { success: false, data: null, error: { code, message }, meta: { requestId, ...meta } };
}

/** Wrap an async handler so rejections become structured 500s. */
export function asyncRoute(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch((err) => {
      const code = (err as { code?: string }).code ?? 'INTERNAL_ERROR';
      const status = (err as { statusCode?: number }).statusCode ?? 500;
      if (status >= 500) console.error('route error:', err);
      res.status(status).json(errorEnvelope(res.locals.requestId, code, err instanceof Error ? err.message : 'Unexpected error'));
    });
  };
}

export function badRequest(res: Response, code: string, message: string): void {
  res.status(400).json(errorEnvelope(res.locals.requestId, code, message));
}

export function unauthorized(res: Response, message = 'Authentication required.'): void {
  res.status(401).json(errorEnvelope(res.locals.requestId, 'UNAUTHORIZED', message));
}

export function forbidden(res: Response, message = 'You do not have access to this resource.'): void {
  res.status(403).json(errorEnvelope(res.locals.requestId, 'FORBIDDEN', message));
}

export function notFound(res: Response, message = 'Resource not found.'): void {
  res.status(404).json(errorEnvelope(res.locals.requestId, 'NOT_FOUND', message));
}

/** Parse + clamp pagination params. */
export function parsePagination(query: Record<string, unknown>, defaults = { page: 1, pageSize: 20, maxPageSize: 100 }): { page: number; pageSize: number; offset: number } {
  const page = Math.max(1, Math.floor(Number(query.page) || defaults.page));
  const pageSize = Math.min(defaults.maxPageSize, Math.max(1, Math.floor(Number(query.pageSize) || defaults.pageSize)));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function logAudit(event: string, req: Request, userId?: string | null, detail?: string): void {
  logSecurityEvent(event, { userId: userId ?? res_userId(req), ip: clientIp(req), detail });
}

function res_userId(req: Request): string | null {
  return (req as unknown as { user?: { id: string } }).user?.id ?? null;
}
