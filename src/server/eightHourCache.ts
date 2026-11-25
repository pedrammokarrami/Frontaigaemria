type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
const store = new Map<string, CacheEntry<unknown>>();

export function makeCacheKey(parts: Array<string | number | undefined | null>): string {
  return parts
    .map((p) => String(p ?? "").trim().toLowerCase())
    .join("::");
}

export async function getOrSetEightHourCache<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<{ data: T; fromCache: boolean }> {
  const now = Date.now();
  const existing = store.get(key) as CacheEntry<T> | undefined;
  if (existing && existing.expiresAt > now) {
    return { data: existing.value, fromCache: true };
  }
  const freshValue = await fetcher();
  store.set(key, {
    value: freshValue,
    expiresAt: now + EIGHT_HOURS_MS,
  });
  return { data: freshValue, fromCache: false };
}
