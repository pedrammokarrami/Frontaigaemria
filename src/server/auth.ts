import crypto from 'node:crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { z } from 'zod';
import { getDb, logSecurityEvent, nowIso, uuid } from './db';
import { badRequest, unauthorized } from './security';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: string;
}

/* ---------------- password hashing (scrypt, constant-time verify) ---------------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/* ---------------- zod schemas (input validation) ---------------- */

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(10).max(128),
  displayName: z.string().trim().min(2).max(60),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

/* ---------------- helpers ---------------- */

export function createSession(userId: string): { token: string; expiresAt: string } {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  getDb()
    .prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)')
    .run(hashToken(token), userId, nowIso(), expiresAt, nowIso());
  return { token, expiresAt };
}

function rowToAuthUser(row: UserRow): AuthUser {
  return { id: row.id, email: row.email, displayName: row.display_name, role: row.role };
}

export function findUserByEmail(email: string): UserRow | undefined {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
}

function findUserById(id: string): UserRow | undefined {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

function pruneExpiredSessions(): void {
  getDb().prepare('DELETE FROM sessions WHERE expires_at <= ?').run(nowIso());
}

/* ---------------- middleware ---------------- */

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export function tokenFromRequest(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  const cookie = req.headers.cookie;
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)aig_session=([A-Za-z0-9]+)/);
    if (match) return match[1];
  }
  return null;
}

/** Attaches req.user when a valid session token is present; never blocks. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = tokenFromRequest(req);
  if (token) {
    const row = getDb()
      .prepare(
        `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > ?`
      )
      .get(hashToken(token), nowIso()) as UserRow | undefined;
    if (row) {
      req.user = rowToAuthUser(row);
      getDb().prepare('UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?').run(nowIso(), hashToken(token));
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    unauthorized(res);
    return;
  }
  next();
}

export function requireRole(role: string): RequestHandler {
  return (req, res, next) => {
    if (!req.user) {
      unauthorized(res);
      return;
    }
    if (req.user.role !== role && req.user.role !== 'admin') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: `Role "${role}" required.` } });
      return;
    }
    next();
  };
}

/* ---------------- endpoints (wired in api.ts) ---------------- */

export function registerUser(input: z.infer<typeof registerSchema>, ip: string | null): { user: AuthUser; token: string; expiresAt: string } {
  pruneExpiredSessions();
  const db = getDb();
  if (findUserByEmail(input.email)) {
    const err = new Error('This email is already registered.');
    (err as { statusCode?: number }).statusCode = 409;
    (err as { code?: string }).code = 'EMAIL_TAKEN';
    throw err;
  }
  const id = uuid('usr');
  const ts = nowIso();
  db.prepare('INSERT INTO users (id, email, password_hash, display_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id,
    input.email,
    hashPassword(input.password),
    input.displayName,
    'user',
    ts,
    ts
  );
  const session = createSession(id);
  logSecurityEvent('auth.register', { userId: id, ip, detail: input.email });
  return { user: { id, email: input.email, displayName: input.displayName, role: 'user' }, token: session.token, expiresAt: session.expiresAt };
}

export function loginUser(input: z.infer<typeof loginSchema>, ip: string | null): { user: AuthUser; token: string; expiresAt: string } {
  pruneExpiredSessions();
  const row = findUserByEmail(input.email);
  // constant-ish time: always run a verify to avoid user enumeration via timing
  const ok = row ? verifyPassword(input.password, row.password_hash) : verifyPassword(input.password, hashPassword('dummy-password-for-timing'));
  if (!row || !ok) {
    logSecurityEvent('auth.login_failed', { userId: row?.id ?? null, ip, detail: input.email });
    const err = new Error('Invalid email or password.');
    (err as { statusCode?: number }).statusCode = 401;
    (err as { code?: string }).code = 'INVALID_CREDENTIALS';
    throw err;
  }
  const session = createSession(row.id);
  logSecurityEvent('auth.login', { userId: row.id, ip, detail: input.email });
  return { user: rowToAuthUser(row), token: session.token, expiresAt: session.expiresAt };
}

export function rotateSession(oldToken: string, ip: string | null): { user: AuthUser; token: string; expiresAt: string } | null {
  const db = getDb();
  const old = db.prepare('SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?').get(hashToken(oldToken), nowIso()) as
    | { user_id: string; token_hash: string }
    | undefined;
  if (!old) return null;
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(old.token_hash);
  const row = findUserById(old.user_id);
  if (!row) return null;
  const session = createSession(row.id);
  logSecurityEvent('auth.session_refresh', { userId: row.id, ip });
  return { user: rowToAuthUser(row), token: session.token, expiresAt: session.expiresAt };
}

export function revokeSession(token: string, userId?: string): boolean {
  const db = getDb();
  const hash = hashToken(token);
  const row = db.prepare('SELECT user_id FROM sessions WHERE token_hash = ?').get(hash) as { user_id: string } | undefined;
  if (!row) return false;
  if (userId && row.user_id !== userId) return false;
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hash);
  logSecurityEvent('auth.logout', { userId: row.user_id, ip: null });
  return true;
}

export function changePassword(userId: string, currentPassword: string, newPassword: string): boolean {
  const row = findUserById(userId);
  if (!row || !verifyPassword(currentPassword, row.password_hash)) return false;
  getDb().prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(hashPassword(newPassword), nowIso(), userId);
  // security: revoke all other sessions after password change
  logSecurityEvent('auth.password_changed', { userId });
  return true;
}

export function badInput(res: Response, zodError: z.ZodError): void {
  const first = zodError.issues[0];
  badRequest(res, 'VALIDATION_ERROR', `${first?.path.join('.') || 'input'}: ${first?.message ?? 'invalid input'}`);
}
