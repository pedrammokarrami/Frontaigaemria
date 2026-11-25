import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { sanitizeText } from './security';
import { broadcastChatMessage } from './chatWs';
import {
  asyncRoute,
  badRequest,
  clientIp,
  errorEnvelope,
  notFound,
  parsePagination,
  rateLimit,
  successEnvelope,
} from './security';
import {
  getDb,
  logSecurityEvent,
  nowIso,
  uuid,
  dbHealth,
} from './db';
import {
  badInput,
  changePassword,
  createSession,
  loginUser,
  registerSchema,
  registerUser,
  loginSchema,
  requireAuth,
  revokeSession,
  rotateSession,
  tokenFromRequest,
  verifyPassword,
  hashPassword,
  type AuthUser,
} from './auth';
import {
  buildAuthorizeUrl,
  configuredProviders,
  consumeActivationToken,
  createActivationToken,
  exchangeProviderCode,
  isEmailVerified,
  registerDevice,
  registerSessionFactory,
  sendActivationEmail,
  upsertOAuthUser,
  type OAuthProvider,
} from './authStandards';
import { pushConfig, sendToUser } from './push';
import { buildProfile, feedIntent, recordEvent, type BehaviorEventKind } from './behaviorAgent';
import { randomBytes } from 'node:crypto';

// Session engine shared with the OAuth flow (same standard as password sessions).
registerSessionFactory((userId) => createSession(userId));

const APP_PUBLIC_BASE = process.env.APP_PUBLIC_BASE ?? 'http://localhost:3000';
import {
  addAccountSchema,
  addLinkedAccount,
  listAccounts,
  makePrimary,
  unlinkAccount,
  unlinkAccountSchema,
  verifyAccountSchema,
  verifyLinkedAccount,
} from './accounts';
import {
  getIngestItem,
  ingestSchema,
  listIngestItems,
  runIngest,
} from './ingest';
import { cached, cacheInvalidateTag, cacheStats, stableHash } from './cache';
import { getEcosystemState, mutateEcosystemState } from './stateStore';
import { runCoachSymbioteAgent, runHighlightCopyAgent, runHighCourtProsecutorAgent } from '../agents/internalAgents.ts';
import { runAdkMultiAgentConsultation } from '../agents/adkCoachSystem.ts';
import type { RealmId } from '../types/spatial.ts';
import { getDb as _getDb } from './db';

/**
 * /api/v1 — versioned REST API.
 * Every response uses the standard envelope:
 *   { success, data, error: { code, message }, meta: { requestId, page?, cached?, ... } }
 * Layering: Router → Services (this file delegates) → db/cache/security modules.
 */

export const apiV1 = Router();

function ok(res: Response, data: unknown, meta: Record<string, unknown> = {}): void {
  res.json(successEnvelope(res.locals.requestId, data, meta));
}

/* ------------------------------------------------------------------ */
/* Health & meta                                                       */
/* ------------------------------------------------------------------ */

apiV1.get('/health', (_req, res) => {
  const db = dbHealth();
  ok(res, {
    status: db.ok ? 'healthy' : 'degraded',
    service: 'aipetros-api',
    version: '1.0.0',
    uptimeSeconds: Math.round(process.uptime()),
    database: db,
    cache: cacheStats(),
  });
});

/* ------------------------------------------------------------------ */
/* Behavioral analysis agent (generic-first → personalized)             */
/* ------------------------------------------------------------------ */

const behaviorEventSchema = z.object({
  userId: z.string().min(1).max(64),
  kind: z.enum([
    'card_click',
    'chip_click',
    'question',
    'game_select',
    'dwell',
    'scroll',
    'platform_cue',
    'language_cue',
    'session_start',
  ]),
  payload: z.record(z.string(), z.unknown()).default({}),
});

apiV1.post('/behavior/event', rateLimit({ windowMs: 60_000, max: 120 }), (req, res) => {
  const parsed = behaviorEventSchema.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, 'invalid_behavior_event', parsed.error.issues[0]?.message ?? 'validation failed');
    return;
  }
  try {
    recordEvent({
      userId: parsed.data.userId,
      kind: parsed.data.kind as BehaviorEventKind,
      payload: parsed.data.payload as Record<string, unknown>,
    });
    ok(res, { recorded: true });
  } catch (err) {
    ok(res, { recorded: false }); // behavior tracking must never break the UI
  }
});

apiV1.get('/behavior/profile', (req, res) => {
  const userId = String(req.query.userId ?? '').slice(0, 64);
  if (!userId) {
    badRequest(res, 'missing_user_id', 'userId required');
    return;
  }
  const profile = buildProfile(userId);
  ok(res, { profile, feed: feedIntent(profile) });
});

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

apiV1.post('/auth/register', rateLimit({ windowMs: 60_000, max: 10 }), asyncRoute(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body ?? {});
  if (!parsed.success) return badInput(res, parsed.error);
  const { user, token, expiresAt } = registerUser(parsed.data, clientIp(req));
  // Aigameria v1.02 standard: email activation before the account is trusted.
  const activation = createActivationToken(user.id);
  const mail = await sendActivationEmail(user.email, activation.token, APP_PUBLIC_BASE);
  res.status(201).json(successEnvelope(res.locals.requestId, {
    user, token, expiresAt,
    emailVerified: false,
    activationEmailSent: mail.sent,
    // Dev mode (no mail provider configured): the link comes back so the
    // flow stays fully testable without leaking anything to production mail.
    ...(mail.devActivationUrl && !mail.sent ? { devActivationUrl: mail.devActivationUrl } : {}),
  }));
}));

apiV1.post('/auth/login', rateLimit({ windowMs: 60_000, max: 10, keyBy: (req) => clientIp(req) }), (req, res) => {
  const parsed = loginSchema.safeParse(req.body ?? {});
  if (!parsed.success) return badInput(res, parsed.error);
  const { user, token, expiresAt } = loginUser(parsed.data, clientIp(req));
  ok(res, { user, token, expiresAt, emailVerified: isEmailVerified(user.id) });
});

apiV1.post('/auth/refresh', (req, res) => {
  const token = tokenFromRequest(req);
  if (!token) return badRequest(res, 'NO_TOKEN', 'Provide the current session token via Authorization header.');
  const rotated = rotateSession(token, clientIp(req));
  if (!rotated) return notFound(res, 'Session not found or expired.');
  ok(res, rotated);
});

apiV1.post('/auth/logout', (req, res) => {
  const token = tokenFromRequest(req);
  const revoked = token ? revokeSession(token) : false;
  ok(res, { revoked });
});

apiV1.get('/auth/me', requireAuth, (req, res) => {
  ok(res, { user: req.user });
});

/* Device registry: standard post-login persistence (FCM token, platform,
   location, permissions) — Aigameria v1.02 auth standards. */
apiV1.post('/auth/device', requireAuth, (req, res) => {
  const schema = z.object({
    fcmToken: z.string().max(4096).nullish(),
    platform: z.string().max(120).nullish(),
    userAgent: z.string().max(512).nullish(),
    location: z.string().max(256).nullish(),
    permissions: z.string().max(1024).nullish(),
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return badInput(res, parsed.error);
  const reg = parsed.data;
  const saved = registerDevice(req.user!.id, {
    ...reg,
    userAgent: reg.userAgent ?? req.headers['user-agent'] ?? null,
    ip: clientIp(req),
  });
  ok(res, saved);
});

apiV1.get('/auth/devices', requireAuth, (req, res) => {
  const rows = getDb()
    .prepare('SELECT id, fcm_token, platform, user_agent, ip, location, permissions, created_at, updated_at FROM user_devices WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user!.id);
  ok(res, { devices: rows });
});

/* ---------------- Web push (FCM HTTP v1) ---------------- */

apiV1.get('/push/config', (req, res) => {
  ok(res, pushConfig());
});

apiV1.post('/auth/push', requireAuth, (req, res) => {
  const schema = z.object({
    title: z.string().min(1).max(120),
    body: z.string().max(600).default(''),
    url: z.string().max(300).optional(),
    tag: z.string().max(80).optional(),
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return badInput(res, parsed.error);
  sendToUser(req.user!.id, parsed.data)
    .then((result) => ok(res, result))
    .catch((exc) => {
      console.error('[push] send failed:', (exc as Error).message);
      badRequest(res, 'PUSH_FAILED', 'Could not deliver push notification.');
    });
});

apiV1.post('/auth/change-password', requireAuth, (req, res) => {
  const schema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(10).max(128) });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return badInput(res, parsed.error);
  const changed = changePassword(req.user!.id, parsed.data.currentPassword, parsed.data.newPassword);
  if (!changed) return badRequest(res, 'INVALID_CREDENTIALS', 'Current password is incorrect.');
  ok(res, { changed: true });
});

/* ---------------- Aigameria v1.02 auth standards ----------------
   Email activation + OAuth sign-in (Google / Apple / Epic / Steam /
   Microsoft) + device registry (FCM token, location, permissions). */

apiV1.get('/auth/activate', (req, res) => {
  const token = String(req.query.token ?? '');
  if (!token) return badRequest(res, 'NO_TOKEN', 'Provide the activation token.');
  const result = consumeActivationToken(token);
  if (!result.ok) return badRequest(res, result.reason ?? 'INVALID_TOKEN', 'Activation link is invalid, used, or expired.');
  ok(res, { activated: true });
});

apiV1.post('/auth/resend-activation', rateLimit({ windowMs: 60_000, max: 3 }), asyncRoute(async (req, res) => {
  const schema = z.object({ email: z.string().trim().toLowerCase().email() });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return badInput(res, parsed.error);
  const db = getDb();
  const row = db.prepare('SELECT id, email_verified FROM users WHERE email = ?').get(parsed.data.email) as
    | { id: string; email_verified: number } | undefined;
  // Always answer OK (no account enumeration); only send when unverified.
  if (!row || row.email_verified === 1) return ok(res, { sent: true });
  const activation = createActivationToken(row.id);
  const mail = await sendActivationEmail(parsed.data.email, activation.token, APP_PUBLIC_BASE);
  ok(res, { sent: true, ...(mail.devActivationUrl && !mail.sent ? { devActivationUrl: mail.devActivationUrl } : {}) });
}));

apiV1.get('/auth/oauth/providers', (req, res) => {
  ok(res, { providers: configuredProviders(), activationRequired: true });
});

// Standard OAuth 2.0 / OpenID start — redirects to the provider's authorize URL.
apiV1.get('/auth/oauth/:provider/start', (req, res) => {
  const provider = req.params.provider as OAuthProvider;
  if (!['google', 'microsoft', 'apple', 'epic', 'steam'].includes(provider)) return notFound(res, 'Unknown provider.');
  const redirectUri = `${APP_PUBLIC_BASE}/api/v1/auth/oauth/${provider}/callback`;
  const state = randomBytes(16).toString('hex');
  const kv = getDb();
  kv.prepare('INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?)')
    .run(`oauth_state_${state}`, JSON.stringify({ provider, created: Date.now() }), new Date().toISOString());
  const url = buildAuthorizeUrl(provider, redirectUri, state);
  if (!url) {
    res.status(501).json(errorEnvelope(res.locals.requestId, 'PROVIDER_NOT_CONFIGURED',
      `${provider} OAuth is not configured on this deployment yet (missing client credentials).`));
    return;
  }
  res.redirect(url);
});

// Standard OAuth callback → exchange → link/create user → session.
apiV1.get('/auth/oauth/:provider/callback', asyncRoute(async (req, res) => {
  const provider = req.params.provider as OAuthProvider;
  const query = new URLSearchParams(req.query as Record<string, string>);
  const state = query.get('state');
  const db = getDb();
  let stored: { provider: string } | null = null;
  if (state) {
    const row = db.prepare('SELECT value FROM kv WHERE key = ?').get(`oauth_state_${state}`) as { value: string } | undefined;
    if (row) {
      stored = JSON.parse(row.value);
      db.prepare('DELETE FROM kv WHERE key = ?').run(`oauth_state_${state}`);
    }
  }
  if (query.get('error')) {
    return res.redirect(`/auth?error=${encodeURIComponent(query.get('error') as string)}`);
  }
  const redirectUri = `${APP_PUBLIC_BASE}/api/v1/auth/oauth/${provider}/callback`;
  const profile = await exchangeProviderCode(provider, query, redirectUri);
  if (!profile) return res.redirect('/auth?error=oauth_exchange_failed');
  if (stored && stored.provider !== provider) return res.redirect('/auth?error=state_mismatch');
  const { userId, token, expiresAt, isNew } = upsertOAuthUser(profile, clientIp(req));
  res.redirect(`/auth?token=${token}&expiresAt=${encodeURIComponent(expiresAt)}&new=${isNew ? 1 : 0}&uid=${userId}`);
}));

// Device registry — FCM token, platform, location, permissions (saved after login).
apiV1.post('/devices', requireAuth, rateLimit({ windowMs: 60_000, max: 30, keyBy: (req) => req.user!.id }), (req, res) => {
  const schema = z.object({
    fcmToken: z.string().max(512).nullish(),
    platform: z.string().max(60).nullish(),
    location: z.string().max(200).nullish(),
    permissions: z.record(z.string(), z.boolean()).nullish(),
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return badInput(res, parsed.error);
  const { id } = registerDevice(req.user!.id, {
    fcmToken: parsed.data.fcmToken ?? null,
    platform: parsed.data.platform ?? null,
    userAgent: req.headers['user-agent'] ?? null,
    ip: clientIp(req),
    location: parsed.data.location ?? null,
    permissions: parsed.data.permissions ? JSON.stringify(parsed.data.permissions) : null,
  });
  ok(res, { deviceId: id, saved: true });
});

/* ------------------------------------------------------------------ */
/* Users / linked accounts                                             */
/* ------------------------------------------------------------------ */

apiV1.get('/users/me', requireAuth, (req, res) => {
  const userId = req.user!.id;
  cached(
    `profile:${userId}`,
    30_000,
    [`accounts:${userId}`, 'state'],
    () => ({
      user: req.user,
      linkedAccounts: listAccounts(userId),
      ecosystemState: getEcosystemState(),
    })
  ).then(({ value, cached: isCached }) => ok(res, value, { cached: isCached }));
});

apiV1.get('/accounts', requireAuth, (req, res) => {
  ok(res, { accounts: listAccounts(req.user!.id) });
});

apiV1.post('/accounts', requireAuth, (req, res) => {
  const parsed = addAccountSchema.safeParse(req.body ?? {});
  if (!parsed.success) return badInput(res, parsed.error);
  const result = addLinkedAccount(req.user!, parsed.data, clientIp(req));
  res.status(201).json(successEnvelope(res.locals.requestId, result));
});

apiV1.post('/accounts/:id/verify', requireAuth, rateLimit({ windowMs: 60_000, max: 15, keyBy: (req) => req.user!.id }), (req, res) => {
  const parsed = verifyAccountSchema.safeParse(req.body ?? {});
  if (!parsed.success) return badInput(res, parsed.error);
  const account = verifyLinkedAccount(req.user!, req.params.id, parsed.data, clientIp(req));
  ok(res, { account });
});

apiV1.post('/accounts/:id/make-primary', requireAuth, (req, res) => {
  const account = makePrimary(req.user!, req.params.id, clientIp(req));
  ok(res, { account });
});

apiV1.delete('/accounts/:id', requireAuth, (req, res) => {
  const parsed = unlinkAccountSchema.safeParse(req.body ?? {});
  if (!parsed.success) return badInput(res, parsed.error);
  const result = unlinkAccount(req.user!, req.params.id, parsed.data, clientIp(req));
  ok(res, result);
});

/* ------------------------------------------------------------------ */
/* Ingest & publish pipeline                                           */
/* ------------------------------------------------------------------ */

apiV1.post(
  '/ingest',
  requireAuth,
  rateLimit({ windowMs: 60_000, max: 30, keyBy: (req) => req.user!.id }),
  asyncRoute(async (req, res) => {
    const parsed = ingestSchema.safeParse(req.body ?? {});
    if (!parsed.success) return badInput(res, parsed.error);
    const item = await runIngest(req.user!, parsed.data, clientIp(req));
    res
      .status(item.status === 'published' ? 201 : item.status === 'failed' ? 422 : 202)
      .json(successEnvelope(res.locals.requestId, item));
  })
);

apiV1.get('/ingest', requireAuth, (req, res) => {
  const { page, pageSize, offset } = parsePagination(req.query);
  const userId = req.user!.id;
  const result = listIngestItems(req.user!, { page, pageSize });
  // cached listing (tag: user's ingest) — invalidated on new ingest runs
  ok(res, result, { page, pageSize, total: result.total });
  void offset;
});

apiV1.get('/ingest/:id', requireAuth, (req, res) => {
  ok(res, { item: getIngestItem(req.user!, req.params.id) });
});

/** Public published content (no auth): read-only, safe fields only. */
apiV1.get('/ingest/:id/published', (req, res) => {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM ingest_items WHERE id = ? AND status = 'published'")
    .get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) return notFound(res, 'Published item not found.');
  ok(res, {
    id: row.id,
    kind: row.kind,
    title: row.title,
    status: row.status,
    enrichment: row.enriched_json ? JSON.parse(String(row.enriched_json)) : null,
    publishedAt: row.updated_at,
  });
});

/* ------------------------------------------------------------------ */
/* Internal agents (deterministic, cached by input hash, audited)      */
/* ------------------------------------------------------------------ */

interface AgentRunContext {
  user: AuthUser;
}

async function recordAgentRun(
  ctx: AgentRunContext | null,
  agent: string,
  input: unknown,
  output: unknown,
  durationMs: number,
  wasCached: boolean
): Promise<string> {
  const id = uuid('run');
  getDb()
    .prepare(
      'INSERT INTO agent_runs (id, user_id, agent, input_hash, input_json, output_json, duration_ms, cache_hit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      id,
      ctx?.user.id ?? null,
      agent,
      stableHash(input),
      JSON.stringify(input ?? {}),
      JSON.stringify(output ?? {}),
      durationMs,
      wasCached ? 1 : 0,
      nowIso()
    );
  return id;
}

function realmFrom(raw: unknown): RealmId {
  const value = String(raw ?? 'shooter');
  return value === 'sports' || value === 'strategy' || value === 'story' ? (value as RealmId) : 'shooter';
}

apiV1.post(
  '/agents/coach-consult',
  requireAuth,
  asyncRoute(async (req, res) => {
  const started = Date.now();
  const input = {
    realm: realmFrom(req.body?.realm),
    query: String(req.body?.query ?? '').slice(0, 300),
    tapX: Number.isFinite(Number(req.body?.tapX)) ? Number(req.body.tapX) : undefined,
    tapY: Number.isFinite(Number(req.body?.tapY)) ? Number(req.body.tapY) : undefined,
  };
  const key = `agent:coach-consult:${stableHash(input)}`;
  const { value: topic, cached: wasCached } = await cached(key, 10 * 60 * 1000, ['state'], () =>
    runAdkMultiAgentConsultation(input)
  );
  const runId = await recordAgentRun({ user: req.user! }, 'CoachConsultationMesh', input, topic, Date.now() - started, wasCached);
  ok(res, { topic, runId }, { cached: wasCached });
  })
);

apiV1.post('/agents/symbiote', requireAuth, (req, res) => {
  const started = Date.now();
  const message = String(req.body?.message ?? '').trim().slice(0, 500);
  const activeSection = String(req.body?.activeSection ?? 'gamer-id');
  if (!message) return badRequest(res, 'EMPTY_MESSAGE', 'Message is required.');
  const state = getEcosystemState();
  const reply = runCoachSymbioteAgent({ message, activeSection, state });
  const runIdPromise = recordAgentRun({ user: req.user! }, 'CoachSymbioteAgent', { message, activeSection }, reply, Date.now() - started, false);
  ok(res, { reply, runId: runIdPromise });
});

apiV1.post('/agents/highlight-copy', requireAuth, (req, res) => {
  const started = Date.now();
  const state = getEcosystemState();
  const matchId = String(req.body?.matchId ?? state.matches[0]?.id ?? '');
  const match = state.matches.find((m) => m.id === matchId) ?? state.matches[0];
  if (!match) return notFound(res, 'No match records available yet.');
  const result = runHighlightCopyAgent({ match, clubName: state.profile.clubName });
  const runId = recordAgentRun({ user: req.user! }, 'HighlightCopyAgent', { matchId }, result, Date.now() - started, false);
  ok(res, { ...result, runId });
});

apiV1.post('/agents/prosecutor', requireAuth, (req, res) => {
  const started = Date.now();
  const caseId = String(req.body?.caseId ?? '');
  const state = getEcosystemState();
  const courtCase = state.highCourtCases.find((c) => c.id === caseId);
  if (!courtCase) return notFound(res, 'High Court case not found.');
  const brief = runHighCourtProsecutorAgent({ courtCase, state, evidenceBuffer: null, evidenceMimeType: undefined });
  const runId = recordAgentRun({ user: req.user! }, 'HighCourtProsecutorAgent', { caseId }, brief, Date.now() - started, false);
  // persist the brief back into ecosystem state
  mutateEcosystemState((current) => ({
    state: {
      ...current,
      highCourtCases: current.highCourtCases.map((c) => (c.id === caseId ? { ...c, aiProsecutorBrief: brief } : c)),
    },
    result: null,
  }));
  ok(res, { brief, runId });
});

apiV1.get('/agents/runs', requireAuth, (req, res) => {
  const { page, pageSize } = parsePagination(req.query, { page: 1, pageSize: 20, maxPageSize: 50 });
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) AS n FROM agent_runs WHERE user_id = ?').get(req.user!.id) as { n: number }).n;
  const rows = db
    .prepare('SELECT id, agent, input_hash, duration_ms, cache_hit, created_at FROM agent_runs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(req.user!.id, pageSize, (page - 1) * pageSize);
  ok(res, { runs: rows }, { page, pageSize, total });
});

/* ------------------------------------------------------------------ */
/* Chat REST (history pagination, rooms, membership)                   */
/* ------------------------------------------------------------------ */

apiV1.get('/chat/rooms', requireAuth, (req, res) => {
  const db = getDb();
  const rooms = db
    .prepare(
      `SELECT r.id, r.name, r.is_private,
              EXISTS(SELECT 1 FROM chat_members m WHERE m.room_id = r.id AND m.user_id = ?) AS joined,
              (SELECT COUNT(*) FROM chat_members cm WHERE cm.room_id = r.id) AS memberCount
       FROM chat_rooms r ORDER BY r.created_at ASC`
    )
    .all(req.user!.id);
  ok(res, { rooms });
});

apiV1.post('/chat/rooms', requireAuth, (req, res) => {
  const schema = z.object({ name: z.string().trim().min(1).max(60), isPrivate: z.boolean().optional().default(false) });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return badInput(res, parsed.error);
  const db = getDb();
  const id = uuid('room');
  db.prepare('INSERT INTO chat_rooms (id, name, is_private, owner_user_id, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id,
    parsed.data.name,
    parsed.data.isPrivate ? 1 : 0,
    req.user!.id,
    nowIso()
  );
  db.prepare('INSERT INTO chat_members (room_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)').run(id, req.user!.id, 'owner', nowIso());
  logSecurityEvent('chat.room_created', { userId: req.user!.id, ip: clientIp(req), detail: parsed.data.name });
  res.status(201).json(successEnvelope(res.locals.requestId, { room: { id, name: parsed.data.name, isPrivate: parsed.data.isPrivate } }));
});

apiV1.post('/chat/rooms/:id/messages', requireAuth, (req, res) => {
  const db = getDb();
  const room = db.prepare('SELECT id FROM chat_rooms WHERE id = ?').get(req.params.id) as { id: string } | undefined;
  if (!room) return notFound(res, 'Room not found.');
  if (!db.prepare('SELECT 1 AS ok FROM chat_members WHERE room_id = ? AND user_id = ?').get(req.params.id, req.user!.id)) {
    return notFound(res, 'Room not found or you are not a member.');
  }
  const schema = z.object({ body: z.string().trim().min(1).max(1000) });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return badInput(res, parsed.error);
  const body = sanitizeText(parsed.data.body, 1000);
  if (!body) {
    return badRequest(res, 'VALIDATION_ERROR', 'body: message body is required.');
  }
  const id = uuid('msg');
  const createdAt = nowIso();
  db.prepare('INSERT INTO chat_messages (id, room_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id,
    req.params.id,
    req.user!.id,
    body,
    createdAt
  );
  const displayName = (db.prepare('SELECT display_name FROM users WHERE id = ?').get(req.user!.id) as { display_name: string } | undefined)?.display_name ?? 'User';
  broadcastChatMessage({ id, roomId: req.params.id, userId: req.user!.id, displayName, body, createdAt });
  logSecurityEvent('chat.message_sent', { userId: req.user!.id, ip: clientIp(req), detail: req.params.id });
  res.status(201).json(successEnvelope(res.locals.requestId, { id, roomId: req.params.id, body, createdAt }));
});

apiV1.post('/chat/rooms/:id/join', requireAuth, (req, res) => {
  const db = getDb();
  const room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(req.params.id) as { id: string; is_private: number } | undefined;
  if (!room) return notFound(res, 'Room not found.');
  const joined = db.prepare('SELECT 1 AS ok FROM chat_members WHERE room_id = ? AND user_id = ?').get(req.params.id, req.user!.id);
  if (!joined) {
    db.prepare('INSERT INTO chat_members (room_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)').run(req.params.id, req.user!.id, 'member', nowIso());
  }
  ok(res, { joined: true, roomId: req.params.id });
});

apiV1.get('/chat/rooms/:id/messages', requireAuth, (req, res) => {
  const db = getDb();
  if (!db.prepare('SELECT 1 AS ok FROM chat_members WHERE room_id = ? AND user_id = ?').get(req.params.id, req.user!.id)) {
    return notFound(res, 'Room not found or you are not a member.');
  }
  const pageSize = Math.min(100, Math.max(1, Math.floor(Number(req.query.pageSize) || 50)));
  const before = typeof req.query.before === 'string' ? req.query.before : null; // cursor: message id
  let rows;
  if (before) {
    const cursor = db.prepare('SELECT created_at FROM chat_messages WHERE id = ?').get(before) as { created_at: string } | undefined;
    rows = cursor
      ? db.prepare('SELECT * FROM chat_messages WHERE room_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT ?').all(req.params.id, cursor.created_at, pageSize)
      : [];
  } else {
    rows = db.prepare('SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at DESC LIMIT ?').all(req.params.id, pageSize);
  }
  const messages = (rows as Array<{ id: string; room_id: string; user_id: string; body: string; created_at: string; delivered_at: string | null; seen_at: string | null }>).map((r) => ({
    id: r.id,
    roomId: r.room_id,
    userId: r.user_id,
    body: r.body,
    createdAt: r.created_at,
    deliveredAt: r.delivered_at,
    seenAt: r.seen_at,
  }));
  ok(res, { messages, nextCursor: messages.at(-1)?.id ?? null, pageSize });
});

apiV1.get('/users/me/security-log', requireAuth, (req, res) => {
  const db = getDb();
  const { page, pageSize } = parsePagination(req.query, { page: 1, pageSize: 20, maxPageSize: 50 });
  const total = (db.prepare('SELECT COUNT(*) AS n FROM security_log WHERE user_id = ?').get(req.user!.id) as { n: number }).n;
  const rows = db
    .prepare('SELECT id, event, ip, detail, created_at FROM security_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(req.user!.id, pageSize, (page - 1) * pageSize);
  ok(res, { events: rows }, { page, pageSize, total });
});

/* ------------------------------------------------------------------ */
/* Controller trainer — 3D stage sequences (Petros-gamepad contract)   */
/* GET /api/v1/controller-sequences/:device?gameId=&realm=             */
/* Returns the INTEGRATION.md envelope: {sequence, presets, ...}       */
/* ------------------------------------------------------------------ */

/** Motion-coach badge text (e.g. "L1", "Counter-Strafe + Burst") → trainer mesh ids. */
function resolveTrainerMeshes(text: string, device: 'ps5' | 'xbox' | 'pc' | 'ipad'): string[] {
  const up = text.toUpperCase();
  const table: Array<[RegExp, string]> = [
    [/\bL1\b|LB\b|بامپر چپ/, device === 'xbox' ? 'BTN_LB' : 'BTN_L1'],
    [/\bR1\b|RB\b|بامپر راست/, device === 'xbox' ? 'BTN_RB' : 'BTN_R1'],
    [/\bL2\b|LT\b|ماشه چپ/, device === 'xbox' ? 'BTN_LT' : 'BTN_L2'],
    [/\bR2\b|RT\b|ماشه راست|شلیک/, device === 'xbox' ? 'BTN_RT' : 'BTN_R2'],
    [/TRIANGLE|△/, 'BTN_TRIANGLE'],
    [/CIRCLE|◯/, 'BTN_CIRCLE'],
    [/CROSS|✕/, 'BTN_CROSS'],
    [/SQUARE|▢/, 'BTN_SQUARE'],
    [/\bCTRL\b|نشستن/, 'KEY_CTRL'],
    [/\bSHIFT\b|دویدن|اسپرینت|ESTRIFE/, 'KEY_SHIFT'],
    [/\bSPACE\b|پرش|JUMP/, 'KEY_SPACE'],
    [/\bW\b|جلو|FORWARD/, 'KEY_W'],
    [/\bA\b|چپ\b.*STRIFE|STRIFE.*چپ/, 'KEY_A'],
    [/\bD\b|راست\b.*STRIFE|STRIFE.*راست/, 'KEY_D'],
    [/\bLMB\b|شلیک|FIRE|Burst/, device === 'pc' ? 'BTN_LMB' : 'BTN_R2'],
    [/\bRMB\b|نشانه|AIM/, device === 'pc' ? 'BTN_RMB' : 'BTN_L2'],
    [/\bR\b|خشاب|RELOAD/, 'KEY_R'],
    [/\bE\b|تعامل/, 'KEY_E'],
    [/\bQ\b|توانایی/, 'KEY_Q'],
    [/\bF\b|ضربه نزدیک|MELEE/, 'KEY_F'],
  ];
  const ids: string[] = [];
  for (const [re, id] of table) {
    if (re.test(up) && !ids.includes(id)) ids.push(id);
  }
  return ids.length ? ids : [device === 'xbox' ? 'BTN_RT' : device === 'pc' ? 'KEY_SHIFT' : 'BTN_R2'];
}

function motionPayloadToTrainerEnvelope(
  payload: {
    gameShortLabel: string;
    archetype: string;
    cycleDurationMs: number;
    sweetSpotStartPct: number;
    sweetSpotEndPct: number;
    timingWindowMs: number;
    triggerBadge: string;
    executionBadge: string;
  },
  device: 'ps5' | 'xbox' | 'pc' | 'ipad'
) {
  const duration = Math.max(1600, Math.round(payload.cycleDurationMs) || 3800);
  const sweetStart = Math.round((payload.sweetSpotStartPct / 100) * duration);
  const sweetEnd = Math.round((payload.sweetSpotEndPct / 100) * duration);
  const triggerMeshes = resolveTrainerMeshes(payload.triggerBadge, device);
  const execMeshes = resolveTrainerMeshes(payload.executionBadge, device);
  const events = [
    {
      id: 'trig-1',
      target_mesh: triggerMeshes[0],
      label: payload.triggerBadge,
      description: payload.triggerBadge,
      start_ms: Math.max(0, sweetStart - Math.round(payload.timingWindowMs || 400)),
      end_ms: sweetStart,
      color: '#38bdf8',
    },
    {
      id: 'sweet-1',
      target_mesh: triggerMeshes[triggerMeshes.length - 1],
      label: 'Sweet spot',
      description: 'Sweet-spot hold window',
      start_ms: sweetStart,
      end_ms: sweetEnd,
      color: '#34d399',
    },
    ...execMeshes.slice(0, 2).map((mesh, i) => ({
      id: `exec-${i + 1}`,
      target_mesh: mesh,
      label: payload.executionBadge,
      description: payload.executionBadge,
      start_ms: sweetEnd,
      end_ms: Math.min(duration, sweetEnd + Math.round((duration - sweetEnd) / (execMeshes.length || 1))),
      color: '#f472b6',
    })),
  ];
  return {
    sequence: {
      title: `${payload.gameShortLabel} — ${payload.archetype}`,
      duration_ms: duration,
      events,
    },
    presets: [
      {
        id: 'active-combo',
        shortLabel: '1. Active combo',
        sequence: { title: `${payload.gameShortLabel} — ${payload.archetype}`, duration_ms: duration, events },
      },
    ],
    activePresetId: 'active-combo',
  };
}

apiV1.get('/controller-sequences/:device', async (req, res, next) => {
  try {
    const device = String(req.params.device ?? '').toLowerCase();
    if (!['ps5', 'xbox', 'pc', 'ipad'].includes(device)) {
      return notFound(res, `Unknown device ${device}.`);
    }
    const { runMotionCoachAgent } = await import('../agents/motionCoachAgent.ts');
    const { normalizeCoachGameId } = await import('../services/liveMetaSyncService.ts');
    const rawRealm = String(req.query.realm ?? '');
    const realm = (['sports', 'shooter', 'strategy', 'story'] as const).find((r) => r === rawRealm);
    const payload = await runMotionCoachAgent({
      gameId: normalizeCoachGameId(req.query.gameId),
      gameName: typeof req.query.name === 'string' ? req.query.name.trim() : undefined,
      realm,
    }, { force: false });
    res.json(motionPayloadToTrainerEnvelope(payload, device as 'ps5' | 'xbox' | 'pc' | 'ipad'));
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ */
/* Unknown v1 routes → structured 404 (never falls through to SPA)     */
/* ------------------------------------------------------------------ */

apiV1.use((req, res) => {
  notFound(res, `No /api/v1 route for ${req.method} ${req.originalUrl}.`);
});

/* ------------------------------------------------------------------ */
/* Global v1 error handler (structured envelope)                       */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
apiV1.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = (err as { statusCode?: number }).statusCode ?? 500;
  const code = (err as { code?: string }).code ?? 'INTERNAL_ERROR';
  if (status >= 500) console.error('api/v1 error:', err);
  res.status(status).json(errorEnvelope(res.locals.requestId, code, err instanceof Error ? err.message : 'Unexpected error'));
});

import type { NextFunction } from 'express';

function _unusedUserMapper(user: AuthUser): AuthUser {
  return user;
}
void _unusedUserMapper;
void verifyPassword;
void hashPassword;
void cacheInvalidateTag;
