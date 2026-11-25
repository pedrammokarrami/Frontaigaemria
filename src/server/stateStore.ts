import type { EcosystemState } from '../types/aipetros.ts';
import { INITIAL_ECOSYSTEM_STATE } from '../data/seedData.ts';
import { getDb, loadEcosystemState, saveEcosystemState } from './db';
import { cacheInvalidateTag, cacheStats } from './cache';

/**
 * Ecosystem state store — previously persisted to a JSON file; now versioned in
 * the SQLite KV store with cache-tag invalidation. Mutations go through
 * `mutateState` so every write invalidates the cached reads atomically.
 */

let state: EcosystemState | null = null;

export function getEcosystemState(): EcosystemState {
  if (!state) {
    state = loadEcosystemState<EcosystemState>(structuredClone(INITIAL_ECOSYSTEM_STATE));
  }
  return state;
}

export function mutateEcosystemState<T>(mutator: (current: EcosystemState) => { state: EcosystemState; result: T }): T {
  const current = getEcosystemState();
  const { state: next, result } = mutator(current);
  state = next;
  saveEcosystemState(next);
  // invalidate every cached read that depends on ecosystem state
  cacheInvalidateTag('state');
  return result;
}

export function stateVersion(): number {
  const row = getDb().prepare('SELECT value FROM kv WHERE key = ?').get('ecosystem_state_version') as { value: string } | undefined;
  return row ? Number(row.value) : 0;
}

export function bumpStateVersion(): void {
  getDb()
    .prepare(
      `INSERT INTO kv (key, value, updated_at) VALUES ('ecosystem_state_version', '1', ?)
       ON CONFLICT(key) DO UPDATE SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT), updated_at = excluded.updated_at`
    )
    .run(new Date().toISOString());
}

export { cacheStats };
