/**
 * Aigameria v1.02 — auth standards helpers.
 *
 * Email activation + OAuth identity linking + device registry (FCM token,
 * location, permissions). Zero external AI APIs; the only outbound calls are
 * the OAuth providers the operator explicitly configured via env vars and the
 * optional transactional email API.
 *
 * OAuth providers (env-driven, standard flows):
 *   Google     → GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
 *   Microsoft  → MS_CLIENT_ID / MS_CLIENT_SECRET
 *   Apple      → APPLE_CLIENT_ID / APPLE_TEAM_ID / APPLE_KEY_ID / APPLE_PRIVATE_KEY (pem)
 *   Epic Games → EPIC_CLIENT_ID / EPIC_CLIENT_SECRET
 *   Steam      → STEAM_API_KEY (OpenID 2.0 sign-in, no client secret needed)
 *
 * Activation email: RESEND_API_KEY (https://resend.com) or SMTP_URL via a
 * future relay — when neither is configured the activation link is returned
 * in the register response (dev mode) so the flow is still fully testable.
 */
import { createHash, randomBytes } from 'node:crypto';
import { getDb, uuid, nowIso } from './db';

export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

/* ---------------- email activation ---------------- */

export interface ActivationEmailResult {
  sent: boolean;
  /** Absolute URL — returned in dev mode (no mail provider configured). */
  devActivationUrl?: string;
}

export function createActivationToken(userId: string): { token: string } {
  const db = getDb();
  const token = randomBytes(32).toString('hex');
  db.prepare(
    'INSERT INTO auth_activations (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
  ).run(hashToken(token), userId, nowIso(), new Date(Date.now() + 48 * 3600 * 1000).toISOString());
  return { token };
}

export function consumeActivationToken(token: string): { ok: boolean; userId?: string; reason?: string } {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM auth_activations WHERE token_hash = ?')
    .get(hashToken(token)) as
    | { token_hash: string; user_id: string; expires_at: string; used_at: string | null }
    | undefined;
  if (!row) return { ok: false, reason: 'INVALID_TOKEN' };
  if (row.used_at) return { ok: false, reason: 'ALREADY_USED' };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: 'EXPIRED' };
  db.prepare('UPDATE auth_activations SET used_at = ? WHERE token_hash = ?').run(nowIso(), row.token_hash);
  db.prepare('UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?').run(nowIso(), row.user_id);
  return { ok: true, userId: row.user_id };
}

export function isEmailVerified(userId: string): boolean {
  const row = getDb().prepare('SELECT email_verified FROM users WHERE id = ?').get(userId) as
    | { email_verified: number }
    | undefined;
  return row?.email_verified === 1;
}

export async function sendActivationEmail(email: string, token: string, baseUrl: string): Promise<ActivationEmailResult> {
  const url = `${baseUrl}/api/v1/auth/activate?token=${token}`;
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    // Standard transactional email via Resend REST API (no SMTP stack needed).
    const from = process.env.MAIL_FROM ?? 'Aigameria <noreply@aigameria.com>';
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [email],
          subject: 'فعال‌سازی حساب Aigameria — Activate your Aigameria account',
          html: `<div style="font-family:sans-serif;background:#0D091A;color:#F7F4FF;padding:32px">
            <h2 style="color:#FF6B35">Aigameria v1.02</h2>
            <p>برای فعال‌سازی حساب روی دکمه بزن / Click to activate:</p>
            <a href="${url}" style="display:inline-block;background:linear-gradient(90deg,#FF6B35,#FF3E8A);color:#0D091A;font-weight:700;padding:12px 24px;border-radius:12px;text-decoration:none">Activate / فعال‌سازی</a>
            <p style="font-size:12px;color:#9B8FB8">${url}</p></div>`,
        }),
      });
      return { sent: resp.ok, devActivationUrl: resp.ok ? undefined : url };
    } catch {
      return { sent: false, devActivationUrl: url };
    }
  }
  // Dev mode: no mail provider configured — surface the link directly.
  console.log(`[auth] activation email for ${email}: ${url}`);
  return { sent: false, devActivationUrl: url };
}

/* ---------------- OAuth providers ---------------- */

export type OAuthProvider = 'google' | 'microsoft' | 'apple' | 'epic' | 'steam';

export function configuredProviders(): Array<{ id: OAuthProvider; label: string; configured: boolean }> {
  return [
    { id: 'google', label: 'Google', configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) },
    { id: 'apple', label: 'Apple', configured: Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_PRIVATE_KEY) },
    { id: 'epic', label: 'Epic Games', configured: Boolean(process.env.EPIC_CLIENT_ID && process.env.EPIC_CLIENT_SECRET) },
    { id: 'steam', label: 'Steam', configured: Boolean(process.env.STEAM_API_KEY) },
    { id: 'microsoft', label: 'Microsoft', configured: Boolean(process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET) },
  ];
}

/** Standard authorize URLs per provider (OpenID Connect / OpenID 2.0 for Steam). */
export function buildAuthorizeUrl(provider: OAuthProvider, redirectUri: string, state: string): string | null {
  switch (provider) {
    case 'google':
      if (!process.env.GOOGLE_CLIENT_ID) return null;
      return 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        access_type: 'offline',
        prompt: 'consent',
      }).toString();
    case 'microsoft':
      if (!process.env.MS_CLIENT_ID) return null;
      return 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' + new URLSearchParams({
        client_id: process.env.MS_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
      }).toString();
    case 'apple':
      if (!process.env.APPLE_CLIENT_ID) return null;
      return 'https://appleid.apple.com/auth/authorize?' + new URLSearchParams({
        client_id: process.env.APPLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'name email',
        state,
        response_mode: 'form_post',
      }).toString();
    case 'epic':
      if (!process.env.EPIC_CLIENT_ID) return null;
      return 'https://www.epicgames.com/id/authorize?' + new URLSearchParams({
        client_id: process.env.EPIC_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'basic_profile openid',
        state,
      }).toString();
    case 'steam':
      // Steam OpenID 2.0 — needs no client secret, only the return URL.
      return 'https://steamcommunity.com/openid/login?' + new URLSearchParams({
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': redirectUri,
        'openid.realm': new URL(redirectUri).origin,
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
      }).toString();
  }
}

export interface OAuthProfile {
  provider: OAuthProvider;
  externalId: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  emailVerifiedByProvider: boolean;
}

/** Exchanges the provider callback into a normalized profile (standard flows). */
export async function exchangeProviderCode(provider: OAuthProvider, query: URLSearchParams, redirectUri: string): Promise<OAuthProfile | null> {
  // Steam OpenID 2.0: verify the assertion with steamcommunity (check_authentication)
  if (provider === 'steam') {
    const params = new URLSearchParams(query);
    params.set('openid.mode', 'check_authentication');
    const resp = await fetch('https://steamcommunity.com/openid/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
    const body = await resp.text();
    if (!body.includes('is_valid:true')) return null;
    const claimedId = query.get('openid.claimed_id') ?? '';
    const steamId = claimedId.match(/(\d{17})$/)?.[1];
    if (!steamId) return null;
    let name = `Steam ${steamId.slice(-4)}`;
    let avatar: string | null = null;
    if (process.env.STEAM_API_KEY) {
      try {
        const pr = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`);
        const pj = (await pr.json()) as { response?: { players?: Array<{ personaname?: string; avatarfull?: string }> } };
        const player = pj.response?.players?.[0];
        if (player?.personaname) name = player.personaname;
        if (player?.avatarfull) avatar = player.avatarfull;
      } catch { /* profile enrichment optional */ }
    }
    return { provider, externalId: steamId, email: null, displayName: name, avatarUrl: avatar, emailVerifiedByProvider: true };
  }

  const secrets: Record<string, { id?: string; secret?: string; tokenUrl: string; userUrl: string }> = {
    google: {
      id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET,
      tokenUrl: 'https://oauth2.googleapis.com/token', userUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    },
    microsoft: {
      id: process.env.MS_CLIENT_ID, secret: process.env.MS_CLIENT_SECRET,
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token', userUrl: 'https://graph.microsoft.com/oidc/userinfo',
    },
    apple: {
      id: process.env.APPLE_CLIENT_ID, secret: process.env.APPLE_PRIVATE_KEY,
      tokenUrl: 'https://appleid.apple.com/auth/token', userUrl: '',
    },
    epic: {
      id: process.env.EPIC_CLIENT_ID, secret: process.env.EPIC_CLIENT_SECRET,
      tokenUrl: 'https://api.epicgames.com/epic/oauth/v2/token', userUrl: 'https://api.epicgames.com/epic/oauth/v2/userInfo',
    },
  };
  const cfg = secrets[provider];
  if (!cfg?.id) return null;
  const code = query.get('code');
  if (!code) return null;

  const tokenResp = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: cfg.id,
      client_secret: cfg.secret ?? '',
      redirect_uri: redirectUri,
    }).toString(),
  });
  if (!tokenResp.ok) return null;
  const tokenJson = (await tokenResp.json()) as { access_token?: string; id_token?: string };
  if (!tokenJson.access_token) return null;

  if (provider === 'apple') {
    // Apple sends the identity in the id_token (JWT); decode payload without external libs.
    const payload = JSON.parse(Buffer.from((tokenJson.id_token ?? '').split('.')[1] ?? 'e30=', 'base64url').toString('utf8')) as {
      sub?: string; email?: string; email_verified?: boolean | string;
    };
    if (!payload.sub) return null;
    return {
      provider, externalId: payload.sub, email: payload.email ?? null,
      displayName: payload.email?.split('@')[0] ?? 'Apple User', avatarUrl: null,
      emailVerifiedByProvider: payload.email_verified === true || payload.email_verified === 'true',
    };
  }

  const userResp = await fetch(cfg.userUrl, { headers: { Authorization: `Bearer ${tokenJson.access_token}` } });
  if (!userResp.ok) return null;
  const userJson = (await userResp.json()) as {
    sub?: string; id?: string; email?: string; name?: string; preferred_username?: string; picture?: string;
    email_verified?: boolean;
  };
  const externalId = userJson.sub ?? userJson.id;
  if (!externalId) return null;
  return {
    provider,
    externalId,
    email: userJson.email ?? null,
    displayName: userJson.name ?? userJson.preferred_username ?? 'Player',
    avatarUrl: userJson.picture ?? null,
    emailVerifiedByProvider: userJson.email_verified === true,
  };
}

/** Links (or creates) the local user for a verified provider profile and starts a session. */
export function upsertOAuthUser(profile: OAuthProfile, ip: string | null): { userId: string; token: string; expiresAt: string; isNew: boolean } {
  const db = getDb();
  const existingIdentity = db
    .prepare('SELECT * FROM oauth_identities WHERE provider = ? AND external_id = ?')
    .get(profile.provider, profile.externalId) as { user_id: string } | undefined;

  let userId: string;
  let isNew = false;
  if (existingIdentity) {
    userId = existingIdentity.user_id;
    db.prepare('UPDATE oauth_identities SET updated_at = ? WHERE provider = ? AND external_id = ?')
      .run(nowIso(), profile.provider, profile.externalId);
  } else if (profile.email) {
    const byEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(profile.email.toLowerCase()) as { id: string } | undefined;
    if (byEmail) {
      userId = byEmail.id;
    } else {
      userId = uuid('usr_');
      isNew = true;
      db.prepare(
        'INSERT INTO users (id, email, password_hash, display_name, role, created_at, updated_at, email_verified, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(userId, profile.email.toLowerCase(), hashPasswordRandom(), profile.displayName, 'user', nowIso(), nowIso(), profile.emailVerifiedByProvider ? 1 : 0, profile.avatarUrl);
    }
  } else {
    // Steam-style: no email — provider-scoped account
    userId = uuid('usr_');
    isNew = true;
    db.prepare(
      'INSERT INTO users (id, email, password_hash, display_name, role, created_at, updated_at, email_verified, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(userId, `${profile.provider}_${profile.externalId}@oauth.aigameria.local`, hashPasswordRandom(), profile.displayName, 'user', nowIso(), nowIso(), 1, profile.avatarUrl);
  }

  if (!existingIdentity) {
    db.prepare(
      'INSERT INTO oauth_identities (id, user_id, provider, external_id, email, display_name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(uuid('oid_'), userId, profile.provider, profile.externalId, profile.email, profile.displayName, profile.avatarUrl, nowIso(), nowIso());
  }

  // Reuse the platform session engine (same standard as password sessions).
  const session = createSessionForUser(userId);
  return { userId, ...session, isNew };
}

function hashPasswordRandom(): string {
  // OAuth accounts don't use passwords; store an unusable hash (bcrypt-style cost marker).
  const { hashPassword } = { hashPassword: (pw: string) => createHash('sha256').update(pw).digest('hex') };
  return `oauth:${hashPassword(randomBytes(32).toString('hex'))}`;
}

/* Lazy import guard to avoid a circular module init with auth.ts */
let sessionFn: ((userId: string) => { token: string; expiresAt: string }) | null = null;
export function registerSessionFactory(fn: (userId: string) => { token: string; expiresAt: string }): void {
  sessionFn = fn;
}
function createSessionForUser(userId: string): { token: string; expiresAt: string } {
  if (!sessionFn) throw new Error('session factory not registered');
  return sessionFn(userId);
}

/* ---------------- device registry (FCM / location / permissions) ---------------- */

export interface DeviceRegistration {
  fcmToken?: string | null;
  platform?: string | null;
  userAgent?: string | null;
  ip?: string | null;
  location?: string | null;
  permissions?: string | null;
}

export function registerDevice(userId: string, reg: DeviceRegistration): { id: string } {
  const db = getDb();
  const existing = reg.fcmToken
    ? db.prepare('SELECT id FROM user_devices WHERE user_id = ? AND fcm_token = ?').get(userId, reg.fcmToken) as { id: string } | undefined
    : undefined;
  if (existing) {
    db.prepare('UPDATE user_devices SET platform = ?, user_agent = ?, ip = ?, location = ?, permissions = ?, updated_at = ? WHERE id = ?')
      .run(reg.platform ?? null, reg.userAgent ?? null, reg.ip ?? null, reg.location ?? null, reg.permissions ?? null, nowIso(), existing.id);
    return { id: existing.id };
  }
  const id = uuid('dev_');
  db.prepare(
    'INSERT INTO user_devices (id, user_id, fcm_token, platform, user_agent, ip, location, permissions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, userId, reg.fcmToken ?? null, reg.platform ?? null, reg.userAgent ?? null, reg.ip ?? null, reg.location ?? null, reg.permissions ?? null, nowIso(), nowIso());
  return { id };
}
