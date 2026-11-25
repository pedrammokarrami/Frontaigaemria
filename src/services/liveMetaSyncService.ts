import type { RealmId } from '../types/spatial.ts';
import {
  type CatalogGameEntry,
  type GameScreenshotItem,
  type GameVideoClip,
  PC_GAME_CATALOG,
  type ResolvedGameMediaBundle,
  buildDynamicGameEntry,
  findCatalogGameById,
  getGamesByRealm,
  inferRealmFromGameTitle,
} from './gameMediaCatalog.ts';

export type CoachGameId = string;

export interface LiveGameMetaSnapshot {
  gameId: string;
  gameName: string;
  realm: RealmId;
  steamAppId?: number;
  gameShortLabel: string;
  gameProTitleFa: string;
  accentHex: string;
  secondaryHex: string;
  patchVersion: string;
  patchSummaryFa: string;
  triggerBadge: string;
  triggerLabelFa: string;
  timingMs: number;
  timingWindowLabelFa: string;
  executionBadge: string;
  executionLabelFa: string;
  fatalErrorFa: string;
  arPrimaryLabelFa: string;
  arLaserLabelFa: string;
  arDangerLabelFa: string;
  arSpeedPinFa: string;
  voiceScriptFa: string;
  voiceScriptEn: string;
  sourceCount: number;
  syncedAtIso: string;
  isFresh: boolean;
}

export interface PcGameSearchResult {
  id: string;
  name: string;
  shortLabel: string;
  realm: RealmId;
  steamAppId?: number;
  thumbUrl: string;
}

export interface SyncMetaOptions {
  force?: boolean;
  fetcher?: typeof fetch;
  nowMs?: number;
  gameName?: string;
  realm?: RealmId;
  steamAppId?: number;
}

export const COACH_GAME_ORDER: string[] = ['fc27', 'cs2', 'dota2', 'gta'];
export const META_CACHE_TTL_MS = 15 * 60 * 1000;

export function toPersianDigits(input: string | number): string {
  const digits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(input).replace(/\d/g, (d) => digits[Number(d)] ?? d);
}

export function mapGameIdToRealm(gameId: string): RealmId {
  const found = findCatalogGameById(gameId);
  if (found) return found.realm;
  return inferRealmFromGameTitle(gameId, 'sports');
}

export function mapRealmToGameId(realm: RealmId): string {
  const first = getGamesByRealm(realm)[0];
  return first?.id ?? 'fc27';
}

export function normalizeCoachGameId(raw: unknown): string {
  const value = String(raw ?? '').trim().toLowerCase();
  if (!value) return 'fc27';
  const found = findCatalogGameById(value);
  if (found) return found.id;
  if (value === 'shooter') return 'cs2';
  if (value === 'sports') return 'fc27';
  if (value === 'strategy') return 'dota2';
  if (value === 'story') return 'gta';
  return value.replace(/[^a-z0-9-_]/g, '-');
}

export function buildSnapshotFromCatalogEntry(
  entry: CatalogGameEntry,
  nowMs = Date.now()
): LiveGameMetaSnapshot {
  return {
    gameId: entry.id,
    gameName: entry.name,
    realm: entry.realm,
    steamAppId: entry.steamAppId,
    gameShortLabel: entry.shortLabel,
    gameProTitleFa: `${entry.shortLabel} • تحلیل فریم AI`,
    accentHex: entry.accentHex,
    secondaryHex: entry.secondaryHex,
    patchVersion: entry.patchVersion,
    patchSummaryFa: entry.patchSummaryFa,
    triggerBadge: entry.triggerBadge,
    triggerLabelFa: entry.triggerLabelFa,
    timingMs: entry.timingMs,
    timingWindowLabelFa: entry.timingWindowLabelFa,
    executionBadge: entry.executionBadge,
    executionLabelFa: entry.executionLabelFa,
    fatalErrorFa: entry.fatalErrorFa,
    arPrimaryLabelFa: entry.arPrimaryLabelFa,
    arLaserLabelFa: entry.arLaserLabelFa,
    arDangerLabelFa: entry.arDangerLabelFa,
    arSpeedPinFa: entry.arSpeedPinFa,
    voiceScriptFa: entry.voiceScriptFa,
    voiceScriptEn: entry.voiceScriptEn,
    sourceCount: 3,
    syncedAtIso: new Date(nowMs).toISOString(),
    isFresh: true,
  };
}

export const DEFAULT_GAME_META: Record<string, LiveGameMetaSnapshot> = Object.fromEntries(
  PC_GAME_CATALOG.map((entry) => [entry.id, buildSnapshotFromCatalogEntry(entry)])
);

interface CachedMetaEntry {
  snapshot: LiveGameMetaSnapshot;
  fetchedAtMs: number;
}

interface CachedMediaEntry {
  bundle: ResolvedGameMediaBundle;
  fetchedAtMs: number;
}

const metaCache = new Map<string, CachedMetaEntry>();
const mediaCache = new Map<string, CachedMediaEntry>();

export function clearLiveMetaCache(): void {
  metaCache.clear();
  mediaCache.clear();
}

export function extractPatchVersionFromText(text: string, fallbackVersion: string): string {
  const tuMatch = text.match(/\b(?:Title Update|TU)\s*#?(\d+(?:\.\d+)?)\b/i);
  if (tuMatch) {
    return `TU ${tuMatch[1]}`;
  }
  const patchMatch = text.match(/\b(?:Patch|Update|Version|v)\s*(\d+\.\d+(?:\.\d+)?)\b/i);
  if (patchMatch) {
    return `Patch ${patchMatch[1]}`;
  }
  return fallbackVersion;
}

export function getCachedOrDefaultGameMeta(
  gameId: string,
  nowMs = Date.now(),
  extra?: { name?: string; realm?: RealmId; steamAppId?: number }
): LiveGameMetaSnapshot {
  const normId = normalizeCoachGameId(gameId);
  const cached = metaCache.get(normId);
  if (cached) {
    return {
      ...cached.snapshot,
      isFresh: nowMs - cached.fetchedAtMs < META_CACHE_TTL_MS,
    };
  }
  const entry =
    findCatalogGameById(normId) ??
    buildDynamicGameEntry({
      id: normId,
      name: extra?.name || gameId,
      realm: extra?.realm,
      steamAppId: extra?.steamAppId,
    });
  return buildSnapshotFromCatalogEntry(entry, nowMs);
}

export function adaptMetaForTap(
  snapshot: LiveGameMetaSnapshot,
  xPct: number,
  yPct: number
): LiveGameMetaSnapshot {
  const clampedX = Math.max(8, Math.min(92, Math.round(xPct)));
  const clampedY = Math.max(12, Math.min(88, Math.round(yPct)));

  if (snapshot.realm === 'sports') {
    const spaceMeters = Math.max(9, Math.min(22, Math.round(10 + (100 - clampedY) * 0.12)));
    const goalChance = Math.max(
      58,
      Math.min(94, Math.round(64 + (100 - Math.abs(clampedX - 52)) * 0.28))
    );
    const speedKmh = Math.max(27, Math.min(35, Math.round(28 + (100 - clampedY) * 0.07)));
    const timingMs = Math.max(160, Math.min(310, Math.round(190 + clampedY * 0.9)));
    const timingSec = (timingMs / 1000).toFixed(2);

    return {
      ...snapshot,
      timingMs,
      timingWindowLabelFa: `پنجره رهاسازی: ${toPersianDigits(timingSec)}s`,
      arPrimaryLabelFa: `فضای خالی ${toPersianDigits(spaceMeters)} متر • شانس موفقیت ${toPersianDigits(goalChance)}٪`,
      arSpeedPinFa: snapshot.gameId === 'f1-25' ? `${toPersianDigits(280 + speedKmh)} km/h` : `${toPersianDigits(speedKmh)} km/h`,
    };
  }

  if (snapshot.realm === 'shooter') {
    const hsChance = Math.max(
      66,
      Math.min(95, Math.round(70 + (100 - Math.abs(clampedX - 48)) * 0.24))
    );
    const timingMs = Math.max(60, Math.min(125, Math.round(65 + clampedY * 0.45)));
    const timingSec = (timingMs / 1000).toFixed(2);
    return {
      ...snapshot,
      timingMs,
      timingWindowLabelFa: `پنجره شلیک: ${toPersianDigits(timingSec)}s`,
      arPrimaryLabelFa: `زاویه پیک تاکتیکی • شانس هدشات ${toPersianDigits(hsChance)}٪`,
      arSpeedPinFa: `واکنش ${toPersianDigits(timingMs)}ms`,
    };
  }

  if (snapshot.realm === 'strategy') {
    const winProb = Math.max(
      65,
      Math.min(95, Math.round(68 + (100 - Math.abs(clampedX - 50)) * 0.25))
    );
    const timingMs = Math.max(240, Math.min(440, Math.round(260 + clampedY * 1.4)));
    const timingSec = (timingMs / 1000).toFixed(2);
    return {
      ...snapshot,
      timingMs,
      timingWindowLabelFa: `پنجره اینیشیت: ${toPersianDigits(timingSec)}s`,
      arPrimaryLabelFa: `برتری کنترل مپ • شانس فایت ${toPersianDigits(winProb)}٪`,
    };
  }

  const coverPct = Math.max(
    68,
    Math.min(96, Math.round(74 + (100 - Math.abs(clampedX - 45)) * 0.2))
  );
  const cooldownSec = (3.4 + (clampedY / 100) * 2.6).toFixed(1);
  const timingMs = Math.max(180, Math.min(460, Math.round(210 + clampedY * 2.1)));
  const timingSec = (timingMs / 1000).toFixed(2);

  return {
    ...snapshot,
    timingMs,
    timingWindowLabelFa: `پنجره اجرا: ${toPersianDigits(timingSec)}s`,
    arPrimaryLabelFa: `مسیر تاکتیکی برتر • شانس موفقیت ${toPersianDigits(coverPct)}٪`,
    arSpeedPinFa: `کول‌داون ${toPersianDigits(cooldownSec)}s`,
  };
}

export async function syncLatestGameMeta(
  gameId: string,
  options: SyncMetaOptions = {}
): Promise<LiveGameMetaSnapshot> {
  const normId = normalizeCoachGameId(gameId);
  const nowMs = options.nowMs ?? Date.now();
  const cached = metaCache.get(normId);
  if (!options.force && cached && nowMs - cached.fetchedAtMs < META_CACHE_TTL_MS) {
    return { ...cached.snapshot, isFresh: true };
  }

  const base = getCachedOrDefaultGameMeta(normId, nowMs, {
    name: options.gameName,
    realm: options.realm,
    steamAppId: options.steamAppId,
  });
  const fetcher = options.fetcher ?? globalThis.fetch;

  let combinedLiveText = '';
  let sourceCount = 0;

  if (typeof fetcher === 'function') {
    const queryTerm = `${base.gameName} patch update meta`;
    const tasks: Array<Promise<void>> = [
      (async () => {
        try {
          const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(
            queryTerm
          )}&sort=new&limit=3`;
          const resp = await fetcher(url, {
            headers: { 'User-Agent': 'AIPETROS-LiveMeta/2.0' },
            signal: AbortSignal.timeout(2200),
          });
          if (resp.ok) {
            const payload = (await resp.json()) as {
              data?: { children?: Array<{ data?: { title?: string; selftext?: string } }> };
            };
            const titles = (payload.data?.children ?? [])
              .map((c) => `${c.data?.title ?? ''} ${(c.data?.selftext ?? '').slice(0, 140)}`)
              .filter(Boolean);
            if (titles.length > 0) {
              combinedLiveText += ` ${titles.join(' | ')}`;
              sourceCount += titles.length;
            }
          }
        } catch {
          // Graceful fallback
        }
      })(),
      (async () => {
        try {
          const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
            base.gameName
          )}&srlimit=2&format=json&origin=*`;
          const resp = await fetcher(url, {
            headers: { 'User-Agent': 'AIPETROS-LiveMeta/2.0' },
            signal: AbortSignal.timeout(2200),
          });
          if (resp.ok) {
            const payload = (await resp.json()) as {
              query?: { search?: Array<{ title?: string; snippet?: string }> };
            };
            const snippets = (payload.query?.search ?? [])
              .map((s) => `${s.title ?? ''} ${s.snippet ?? ''}`)
              .filter(Boolean);
            if (snippets.length > 0) {
              combinedLiveText += ` ${snippets.join(' | ')}`;
              sourceCount += snippets.length;
            }
          }
        } catch {
          // Graceful fallback
        }
      })(),
    ];

    await Promise.all(tasks);
  }

  const detectedPatch = extractPatchVersionFromText(combinedLiveText, base.patchVersion);

  const snapshot: LiveGameMetaSnapshot = {
    ...base,
    patchVersion: detectedPatch,
    sourceCount: Math.max(base.sourceCount, sourceCount),
    syncedAtIso: new Date(nowMs).toISOString(),
    isFresh: true,
  };

  metaCache.set(normId, { snapshot, fetchedAtMs: nowMs });
  return snapshot;
}

export async function searchAllPcGames(
  query: string,
  options: { realm?: RealmId; fetcher?: typeof fetch } = {}
): Promise<PcGameSearchResult[]> {
  const clean = query.trim();
  const lower = clean.toLowerCase();

  // Always start with matching curated catalog games
  const localMatches: PcGameSearchResult[] = PC_GAME_CATALOG.filter((g) => {
    if (options.realm && g.realm !== options.realm) return false;
    if (!lower) return true;
    return (
      g.name.toLowerCase().includes(lower) ||
      g.shortLabel.toLowerCase().includes(lower) ||
      g.id.includes(lower)
    );
  }).map((g) => ({
    id: g.id,
    name: g.name,
    shortLabel: g.shortLabel,
    realm: g.realm,
    steamAppId: g.steamAppId,
    thumbUrl: g.steamAppId
      ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${g.steamAppId}/capsule_sm_120.jpg`
      : g.fallbackScreenshotUrl,
  }));

  if (!clean) {
    return localMatches;
  }

  const fetcher = options.fetcher ?? globalThis.fetch;
  if (typeof fetcher !== 'function') {
    return localMatches;
  }

  try {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
      clean
    )}&l=english&cc=US`;
    const resp = await fetcher(url, {
      headers: { 'User-Agent': 'AIPETROS-GameSearch/1.0' },
      signal: AbortSignal.timeout(3000),
    });
    if (resp.ok) {
      const data = (await resp.json()) as {
        items?: Array<{ id?: number; name?: string; tiny_image?: string }>;
      };
      const seenSteamIds = new Set(localMatches.map((m) => m.steamAppId).filter(Boolean));
      const steamResults: PcGameSearchResult[] = [];

      for (const item of (data.items ?? []).slice(0, 12)) {
        if (!item.id || !item.name || seenSteamIds.has(item.id)) continue;
        seenSteamIds.add(item.id);
        const inferredRealm = options.realm ?? inferRealmFromGameTitle(item.name, 'story');
        steamResults.push({
          id: `steam-${item.id}`,
          name: item.name,
          shortLabel: item.name.length > 16 ? `${item.name.slice(0, 15)}…` : item.name,
          realm: inferredRealm,
          steamAppId: item.id,
          thumbUrl:
            item.tiny_image ||
            `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/capsule_sm_120.jpg`,
        });
      }

      return [...localMatches, ...steamResults].slice(0, 16);
    }
  } catch {
    // Fallback to local matches
  }

  return localMatches;
}

export async function fetchRealGameMediaBundle(
  input: {
    gameId: string;
    gameName?: string;
    realm?: RealmId;
    steamAppId?: number;
  },
  options: { force?: boolean; fetcher?: typeof fetch; nowMs?: number } = {}
): Promise<ResolvedGameMediaBundle> {
  const normId = normalizeCoachGameId(input.gameId);
  const nowMs = options.nowMs ?? Date.now();
  const cacheKey = `${normId}:${input.steamAppId ?? ''}`;
  const cached = mediaCache.get(cacheKey);
  if (!options.force && cached && nowMs - cached.fetchedAtMs < META_CACHE_TTL_MS) {
    return cached.bundle;
  }

  const catalogEntry =
    findCatalogGameById(normId) ??
    buildDynamicGameEntry({
      id: normId,
      name: input.gameName || input.gameId,
      realm: input.realm,
      steamAppId: input.steamAppId,
    });

  const fetcher = options.fetcher ?? globalThis.fetch;
  let resolvedSteamId = input.steamAppId ?? catalogEntry.steamAppId;

  // If no steamAppId yet (dynamic query), try fast Steam storesearch lookup
  if (!resolvedSteamId && typeof fetcher === 'function' && catalogEntry.name) {
    try {
      const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
        catalogEntry.name
      )}&l=english&cc=US`;
      const sResp = await fetcher(searchUrl, {
        headers: { 'User-Agent': 'AIPETROS-GameMedia/1.0' },
        signal: AbortSignal.timeout(2500),
      });
      if (sResp.ok) {
        const sData = (await sResp.json()) as { items?: Array<{ id?: number }> };
        resolvedSteamId = sData.items?.[0]?.id;
      }
    } catch {
      // ignore
    }
  }

  const videos: GameVideoClip[] = [];
  const screenshots: GameScreenshotItem[] = [];
  let sourceLabel = 'گیم‌پلی واقعی';

  // 1. Primary source: Official Steam Store real 1080p screenshots & HLS/MP4 gameplay trailers
  if (resolvedSteamId && typeof fetcher === 'function') {
    try {
      const detailsUrl = `https://store.steampowered.com/api/appdetails?appids=${resolvedSteamId}&l=english`;
      const dResp = await fetcher(detailsUrl, {
        headers: { 'User-Agent': 'AIPETROS-GameMedia/1.0' },
        signal: AbortSignal.timeout(3500),
      });
      if (dResp.ok) {
        const payload = (await dResp.json()) as Record<
          string,
          {
            success?: boolean;
            data?: {
              name?: string;
              header_image?: string;
              screenshots?: Array<{ id?: number; path_thumbnail?: string; path_full?: string }>;
              movies?: Array<{
                id?: number;
                name?: string;
                thumbnail?: string;
                hls_h264?: string;
                mp4?: { '480'?: string; max?: string };
                webm?: { '480'?: string; max?: string };
              }>;
            };
          }
        >;
        const data = payload[String(resolvedSteamId)]?.data;
        if (data) {
          sourceLabel = 'Steam Official Gameplay Media';
          for (const mv of (data.movies ?? []).slice(0, 6)) {
            const hlsUrl = mv.hls_h264;
            const mp4Url = mv.mp4?.max || mv.mp4?.['480'];
            const webmUrl = mv.webm?.max || mv.webm?.['480'];
            if (hlsUrl || mp4Url || webmUrl) {
              videos.push({
                id: `vid-${mv.id ?? videos.length}`,
                title: mv.name || `${catalogEntry.name} Gameplay`,
                hlsUrl,
                mp4Url,
                webmUrl,
                thumbnailUrl: mv.thumbnail || data.header_image || catalogEntry.fallbackScreenshotUrl,
              });
            }
          }
          for (const ss of (data.screenshots ?? []).slice(0, 10)) {
            if (ss.path_full) {
              screenshots.push({
                id: `ss-${ss.id ?? screenshots.length}`,
                title: `${catalogEntry.name} — فریم گیم‌پلی ${screenshots.length + 1}`,
                fullUrl: ss.path_full,
                thumbUrl: ss.path_thumbnail || ss.path_full,
              });
            }
          }
        }
      }
    } catch {
      // Fallback to Wikipedia/Wikimedia below
    }
  }

  // 2. Fallback for non-Steam PC games (Valorant, LoL, Chess, Fortnite, etc.): Wikimedia Commons real game imagery
  if (screenshots.length === 0 && typeof fetcher === 'function') {
    try {
      const searchTitle = catalogEntry.wikiTitle || `${catalogEntry.name} video game gameplay`;
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
        searchTitle
      )}&gsrlimit=6&prop=pageimages&piprop=thumbnail&pithumbsize=1280&format=json&origin=*`;
      const wResp = await fetcher(wikiUrl, {
        headers: { 'User-Agent': 'AIPETROS-GameMedia/1.0' },
        signal: AbortSignal.timeout(2500),
      });
      if (wResp.ok) {
        const wData = (await wResp.json()) as {
          query?: {
            pages?: Record<
              string,
              { pageid?: number; title?: string; thumbnail?: { source?: string } }
            >;
          };
        };
        const pages = Object.values(wData.query?.pages ?? {});
        for (const p of pages) {
          const src = p.thumbnail?.source ?? '';
          if (src && !src.toLowerCase().endsWith('.svg')) {
            screenshots.push({
              id: `wiki-${p.pageid ?? screenshots.length}`,
              title: p.title || catalogEntry.name,
              fullUrl: src,
              thumbUrl: src,
            });
          }
        }
        if (screenshots.length > 0) {
          sourceLabel = 'Live Game Media Archive';
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. Guaranteed local fallback image so UI never renders blank even offline
  if (screenshots.length === 0) {
    screenshots.push({
      id: `fallback-${catalogEntry.id}`,
      title: catalogEntry.name,
      fullUrl: catalogEntry.fallbackScreenshotUrl,
      thumbUrl: catalogEntry.fallbackScreenshotUrl,
    });
  }

  const bundle: ResolvedGameMediaBundle = {
    gameId: catalogEntry.id,
    gameName: input.gameName || catalogEntry.name,
    realm: input.realm ?? catalogEntry.realm,
    steamAppId: resolvedSteamId,
    videos,
    screenshots,
    sourceLabel,
  };

  mediaCache.set(cacheKey, { bundle, fetchedAtMs: nowMs });
  return bundle;
}
