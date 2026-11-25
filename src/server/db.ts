import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Production database layer — SQLite via the built-in `node:sqlite` module.
 * Zero external services, WAL mode, repeatable migrations + seed.
 * Fully parameterized statements everywhere (injection-safe by construction).
 */

const DATA_DIR = path.resolve(process.cwd(), process.env.AIPETROS_DATA_DIR ?? '.data');
export const DB_FILE = path.join(DATA_DIR, 'aipetros.sqlite');

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new DatabaseSync(DB_FILE);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA busy_timeout = 5000;');
  migrate(db);
  return db;
}

const MIGRATIONS: string[] = [
  // 0001 — core identity, security, ingest, chat, agents audit
  `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS linked_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    external_id TEXT NOT NULL,
    handle TEXT NOT NULL,
    verified INTEGER NOT NULL DEFAULT 0,
    verification_code_hash TEXT,
    verification_expires_at TEXT,
    is_primary INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(user_id, provider, external_id)
  );
  CREATE INDEX IF NOT EXISTS idx_linked_accounts_user ON linked_accounts(user_id);

  CREATE TABLE IF NOT EXISTS ingest_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    source_url TEXT,
    content TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    status_error TEXT,
    enriched_json TEXT,
    published_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_ingest_user_status ON ingest_items(user_id, status);
  CREATE INDEX IF NOT EXISTS idx_ingest_created ON ingest_items(created_at DESC);

  CREATE TABLE IF NOT EXISTS agent_runs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    agent TEXT NOT NULL,
    input_hash TEXT NOT NULL,
    input_json TEXT NOT NULL,
    output_json TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    cache_hit INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_agent_runs_agent ON agent_runs(agent, created_at DESC);

  CREATE TABLE IF NOT EXISTS chat_rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_private INTEGER NOT NULL DEFAULT 0,
    owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS chat_members (
    room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TEXT NOT NULL,
    PRIMARY KEY (room_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    delivered_at TEXT,
    seen_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS security_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    event TEXT NOT NULL,
    ip TEXT,
    detail TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_security_log_user ON security_log(user_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS kv (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  `,
  // 0002 — Aigameria v1.02 auth standards: email activation, OAuth identities,
  // device registry (FCM token / location / permissions), profile extras
  `
  ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE users ADD COLUMN avatar_url TEXT;
  CREATE TABLE IF NOT EXISTS auth_activations (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_auth_activations_user ON auth_activations(user_id);
  CREATE TABLE IF NOT EXISTS oauth_identities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    external_id TEXT NOT NULL,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(provider, external_id)
  );
  CREATE INDEX IF NOT EXISTS idx_oauth_identities_user ON oauth_identities(user_id);
  CREATE TABLE IF NOT EXISTS user_devices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fcm_token TEXT,
    platform TEXT,
    user_agent TEXT,
    ip TEXT,
    location TEXT,
    permissions TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_devices_fcm ON user_devices(fcm_token);
  `,
  // migration 0003 — behavioral analysis agent (first-time generic baseline,
  // progressive personalization; user-mandated)
  `
  CREATE TABLE IF NOT EXISTS user_behavior (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_user_behavior_user ON user_behavior(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_behavior_kind ON user_behavior(kind);
  `,
];

function migrate(db: DatabaseSync): void {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);');
  const applied = new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map((r) => Number((r as { version: number }).version))
  );
  MIGRATIONS.forEach((sql, idx) => {
    const version = idx + 1;
    if (applied.has(version)) return;
    const runMigration = (): void =>
      tx(db, () => {
        db.exec(sql);
        db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(version, new Date().toISOString());
      });
    runMigration();
  });
}

export function uuid(prefix = ''): string {
  const raw = globalThis.crypto.randomUUID();
  return prefix ? `${prefix}_${raw}` : raw;
}

/** Simple synchronous transaction helper (node:sqlite has no .transaction()). */
export function tx<T>(database: DatabaseSync, fn: () => T): T {
  database.exec('BEGIN');
  try {
    const result = fn();
    database.exec('COMMIT');
    return result;
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

/* ------------------------------------------------------------------ */
/* Security log                                                        */
/* ------------------------------------------------------------------ */

export function logSecurityEvent(event: string, opts: { userId?: string | null; ip?: string | null; detail?: string } = {}): void {
  try {
    getDb()
      .prepare('INSERT INTO security_log (id, user_id, event, ip, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(uuid('sec'), opts.userId ?? null, event, opts.ip ?? null, opts.detail ?? null, nowIso());
  } catch {
    // logging must never break the request path
  }
}

/* ------------------------------------------------------------------ */
/* Ecosystem state KV persistence (replaces raw JSON file persistence) */
/* ------------------------------------------------------------------ */

const ECOSYSTEM_KEY = 'ecosystem_state_v1';

export function loadEcosystemState<T>(fallback: T): T {
  try {
    const row = getDb().prepare('SELECT value FROM kv WHERE key = ?').get(ECOSYSTEM_KEY) as { value: string } | undefined;
    if (row) return JSON.parse(row.value) as T;
  } catch (err) {
    console.warn('Failed to load ecosystem state from db, using seed:', err);
  }
  return fallback;
}

export function saveEcosystemState(state: unknown): void {
  getDb()
    .prepare(
      `INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    .run(ECOSYSTEM_KEY, JSON.stringify(state), nowIso());
}

export function dbHealth(): { ok: boolean; tables: number; users: number; latencyMs: number } {
  const started = Date.now();
  try {
    const d = getDb();
    const tables = d
      .prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .get() as { n: number };
    const users = d.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number };
    return { ok: true, tables: tables.n, users: users.n, latencyMs: Date.now() - started };
  } catch {
    return { ok: false, tables: 0, users: 0, latencyMs: Date.now() - started };
  }
}
