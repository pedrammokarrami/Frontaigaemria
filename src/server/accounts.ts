import crypto from 'node:crypto';
import { z } from 'zod';
import { getDb, logSecurityEvent, nowIso, tx, uuid } from './db';
import { cacheInvalidateTag } from './cache';
import type { AuthUser } from './auth';

/**
 * Multi-account linking:
 *  - add (pending verification, 6-digit code, 10 min TTL, hashed at rest)
 *  - verify ownership, set primary, sync status, unlink (with safety rule)
 *  - every mutation writes a security_log entry
 */

export const PROVIDERS = ['steam', 'chesscom', 'lichess', 'discord', 'spotify', 'twitch', 'telegram'] as const;
export type LinkedProvider = (typeof PROVIDERS)[number];

export const addAccountSchema = z.object({
  provider: z.enum(PROVIDERS),
  handle: z.string().trim().min(2).max(80),
  externalId: z.string().trim().min(1).max(120).optional(),
});

export const verifyAccountSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'code must be 6 digits'),
});

export const unlinkAccountSchema = z.object({
  confirm: z.boolean().optional().default(false),
});

export interface LinkedAccountDto {
  id: string;
  provider: string;
  handle: string;
  externalId: string;
  verified: boolean;
  isPrimary: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
}

interface AccountRow {
  id: string;
  user_id: string;
  provider: string;
  external_id: string;
  handle: string;
  verified: number;
  verification_code_hash: string | null;
  verification_expires_at: string | null;
  is_primary: number;
  created_at: string;
  updated_at: string;
}

function toDto(row: AccountRow): LinkedAccountDto {
  return {
    id: row.id,
    provider: row.provider,
    handle: row.handle,
    externalId: row.external_id,
    verified: Boolean(row.verified),
    isPrimary: Boolean(row.is_primary),
    lastSyncedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

export function listAccounts(userId: string): LinkedAccountDto[] {
  const rows = getDb().prepare('SELECT * FROM linked_accounts WHERE user_id = ? ORDER BY is_primary DESC, created_at ASC').all(userId) as unknown as AccountRow[];
  return rows.map(toDto);
}

/** Issues a fresh verification code (returned once; only its hash is stored). */
export function addLinkedAccount(user: AuthUser, input: z.infer<typeof addAccountSchema>, ip: string | null): { account: LinkedAccountDto; verificationCode: string | null; message: string } {
  const db = getDb();
  const externalId = input.externalId ?? input.handle.toLowerCase().replace(/\s+/g, '_');
  const existing = db
    .prepare('SELECT * FROM linked_accounts WHERE user_id = ? AND provider = ? AND external_id = ?')
    .get(user.id, input.provider, externalId) as unknown as AccountRow | undefined;
  if (existing && existing.verified) {
    const err = new Error('This account is already linked and verified.');
    (err as { statusCode?: number }).statusCode = 409;
    (err as { code?: string }).code = 'ACCOUNT_ALREADY_LINKED';
    throw err;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = crypto.createHash('sha256').update(`${user.id}:${code}`).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  let id: string;
  if (existing) {
    // re-issue verification for a pending duplicate
    db.prepare('UPDATE linked_accounts SET handle = ?, verification_code_hash = ?, verification_expires_at = ?, updated_at = ? WHERE id = ?').run(
      input.handle,
      codeHash,
      expiresAt,
      nowIso(),
      existing.id
    );
    id = existing.id;
  } else {
    id = uuid('acc');
    const isFirst = listAccounts(user.id).length === 0;
    db.prepare(
      `INSERT INTO linked_accounts (id, user_id, provider, external_id, handle, verified, verification_code_hash, verification_expires_at, is_primary, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`
    ).run(id, user.id, input.provider, externalId, input.handle, codeHash, expiresAt, isFirst ? 1 : 0, nowIso(), nowIso());
  }

  logSecurityEvent('account.link_started', { userId: user.id, ip, detail: `${input.provider}:${input.handle}` });
  cacheInvalidateTag(`accounts:${user.id}`);
  const row = db.prepare('SELECT * FROM linked_accounts WHERE id = ?').get(id) as unknown as AccountRow;
  return {
    account: toDto(row),
    verificationCode: code,
    message: 'Verification code issued (valid for 10 minutes).',
  };
}

export function verifyLinkedAccount(user: AuthUser, accountId: string, input: z.infer<typeof verifyAccountSchema>, ip: string | null): LinkedAccountDto {
  const db = getDb();
  const row = db.prepare('SELECT * FROM linked_accounts WHERE id = ? AND user_id = ?').get(accountId, user.id) as unknown as AccountRow | undefined;
  if (!row) {
    const err = new Error('Linked account not found.');
    (err as { statusCode?: number }).statusCode = 404;
    (err as { code?: string }).code = 'NOT_FOUND';
    throw err;
  }
  if (row.verified) return toDto(row);
  if (!row.verification_code_hash || !row.verification_expires_at || row.verification_expires_at <= nowIso()) {
    const err = new Error('Verification code expired. Request a new one by re-adding the account.');
    (err as { statusCode?: number }).statusCode = 410;
    (err as { code?: string }).code = 'CODE_EXPIRED';
    throw err;
  }
  const candidate = crypto.createHash('sha256').update(`${user.id}:${input.code}`).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(row.verification_code_hash))) {
    logSecurityEvent('account.verify_failed', { userId: user.id, ip, detail: row.provider });
    const err = new Error('Invalid verification code.');
    (err as { statusCode?: number }).statusCode = 400;
    (err as { code?: string }).code = 'INVALID_CODE';
    throw err;
  }

  db.prepare('UPDATE linked_accounts SET verified = 1, verification_code_hash = NULL, verification_expires_at = NULL, updated_at = ? WHERE id = ?').run(
    nowIso(),
    accountId
  );
  logSecurityEvent('account.verified', { userId: user.id, ip, detail: `${row.provider}:${row.handle}` });
  cacheInvalidateTag(`accounts:${user.id}`);
  return toDto(db.prepare("SELECT * FROM linked_accounts WHERE id = ?").get(accountId) as unknown as AccountRow);
}

export function makePrimary(user: AuthUser, accountId: string, ip: string | null): LinkedAccountDto {
  const db = getDb();
  const row = db.prepare('SELECT * FROM linked_accounts WHERE id = ? AND user_id = ? AND verified = 1').get(accountId, user.id) as unknown as AccountRow | undefined;
  if (!row) {
    const err = new Error('Verified linked account not found.');
    (err as { statusCode?: number }).statusCode = 404;
    (err as { code?: string }).code = 'NOT_FOUND';
    throw err;
  }
  const run = tx(db, () => {
    db.prepare('UPDATE linked_accounts SET is_primary = 0 WHERE user_id = ?').run(user.id);
    db.prepare('UPDATE linked_accounts SET is_primary = 1, updated_at = ? WHERE id = ?').run(nowIso(), accountId);
  });
  logSecurityEvent('account.primary_changed', { userId: user.id, ip, detail: `${row.provider}:${row.handle}` });
  cacheInvalidateTag(`accounts:${user.id}`);
  return toDto(db.prepare("SELECT * FROM linked_accounts WHERE id = ?").get(accountId) as unknown as AccountRow);
}

export function unlinkAccount(user: AuthUser, accountId: string, opts: { confirm: boolean }, ip: string | null): { removed: boolean; message: string } {
  const db = getDb();
  const row = db.prepare('SELECT * FROM linked_accounts WHERE id = ? AND user_id = ?').get(accountId, user.id) as unknown as AccountRow | undefined;
  if (!row) {
    const err = new Error('Linked account not found.');
    (err as { statusCode?: number }).statusCode = 404;
    (err as { code?: string }).code = 'NOT_FOUND';
    throw err;
  }
  // Safety rule: the last verified account cannot be silently removed.
  const verifiedCount = (db.prepare('SELECT COUNT(*) AS n FROM linked_accounts WHERE user_id = ? AND verified = 1').get(user.id) as { n: number }).n;
  if (row.verified && verifiedCount <= 1 && !opts.confirm) {
    logSecurityEvent('account.unlink_blocked', { userId: user.id, ip, detail: row.provider });
    return {
      removed: false,
      message: 'This is your only verified linked account. Send confirm=true to remove it anyway.',
    };
  }
  db.prepare('DELETE FROM linked_accounts WHERE id = ?').run(accountId);
  // promote another verified account to primary if none left
  const remainingPrimary = db.prepare('SELECT id FROM linked_accounts WHERE user_id = ? AND is_primary = 1').get(user.id);
  if (!remainingPrimary) {
    const next = db.prepare('SELECT id FROM linked_accounts WHERE user_id = ? AND verified = 1 ORDER BY created_at ASC LIMIT 1').get(user.id) as { id: string } | undefined;
    if (next) db.prepare('UPDATE linked_accounts SET is_primary = 1 WHERE id = ?').run(next.id);
  }
  logSecurityEvent('account.unlinked', { userId: user.id, ip, detail: `${row.provider}:${row.handle}` });
  cacheInvalidateTag(`accounts:${user.id}`);
  return { removed: true, message: 'Account unlinked.' };
}
