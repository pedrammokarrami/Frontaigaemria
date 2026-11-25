/**
 * Structured in-memory caching layer (Cache-Aside pattern).
 * - TTL per entry, LRU-ish bounded map
 * - Tag-based invalidation so POST/PUT/PATCH/DELETE can drop related entries
 * - Keys should embed a data version (e.g. `profile:${userId}:v${profileVersion}`)
 */

interface CacheEntry {
  value: unknown;
  expiresAt: number;
  tags: string[];
}

const MAX_ENTRIES = 5000;
const store = new Map<string, CacheEntry>();

const stats = { hits: 0, misses: 0, invalidations: 0 };

function evictIfNeeded(): void {
  while (store.size >= MAX_ENTRIES) {
    const oldestKey = store.keys().next().value;
    if (oldestKey === undefined) break;
    store.delete(oldestKey);
  }
}

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) {
    stats.misses += 1;
    return undefined;
  }
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    stats.misses += 1;
    return undefined;
  }
  // refresh LRU position
  store.delete(key);
  store.set(key, entry);
  stats.hits += 1;
  return entry.value as T;
}

export function cacheSet(key: string, value: unknown, ttlMs: number, tags: string[] = []): void {
  evictIfNeeded();
  store.set(key, { value, expiresAt: Date.now() + ttlMs, tags });
}

export function cacheInvalidateTag(tag: string): number {
  let dropped = 0;
  for (const [key, entry] of store.entries()) {
    if (entry.tags.includes(tag)) {
      store.delete(key);
      dropped += 1;
    }
  }
  stats.invalidations += dropped;
  return dropped;
}

export function cacheInvalidateAll(): void {
  store.clear();
  stats.invalidations += 1;
}

/** Cache-aside helper: wraps a loader with TTL + tags. */
export async function cached<T>(
  key: string,
  ttlMs: number,
  tags: string[],
  loader: () => Promise<T> | T
): Promise<{ value: T; cached: boolean }> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return { value: hit, cached: true };
  const value = await loader();
  cacheSet(key, value, ttlMs, tags);
  return { value, cached: false };
}

export function cacheStats(): { size: number; hits: number; misses: number; invalidations: number } {
  return { size: store.size, ...stats };
}

/** Stable hash for cache keys / agent input fingerprints. */
export function stableHash(input: unknown): string {
  // deterministic JSON stringify (sorted object keys)
  const json = JSON.stringify(input, (_k, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)));
    }
    return v;
  });
  // FNV-1a 32-bit — fast, dependency-free
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i += 1) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0') + json.length.toString(16);
}
