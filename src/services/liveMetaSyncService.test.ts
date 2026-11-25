import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  META_CACHE_TTL_MS,
  adaptMetaForTap,
  clearLiveMetaCache,
  extractPatchVersionFromText,
  fetchRealGameMediaBundle,
  getCachedOrDefaultGameMeta,
  mapGameIdToRealm,
  mapRealmToGameId,
  normalizeCoachGameId,
  searchAllPcGames,
  syncLatestGameMeta,
  toPersianDigits,
} from './liveMetaSyncService';
import { COACH_REALM_ORDER, getGamesByRealm, inferRealmFromGameTitle } from './gameMediaCatalog';

describe('liveMetaSyncService & 4-genre PC game catalog', () => {
  it('populates all 4 coaching genres with multiple PC games each', () => {
    for (const realm of COACH_REALM_ORDER) {
      const games = getGamesByRealm(realm);
      assert.ok(games.length >= 5, `Expected at least 5 games in realm ${realm}, got ${games.length}`);
    }
    assert.equal(mapGameIdToRealm('fc27'), 'sports');
    assert.equal(mapGameIdToRealm('cs2'), 'shooter');
    assert.equal(mapGameIdToRealm('dota2'), 'strategy');
    assert.equal(mapGameIdToRealm('elden-ring'), 'story');
    assert.equal(mapRealmToGameId('strategy'), 'dota2');
    assert.equal(inferRealmFromGameTitle('Forza Horizon 5'), 'sports');
    assert.equal(inferRealmFromGameTitle('Battlefield 2042'), 'shooter');
    assert.equal(inferRealmFromGameTitle('Hearts of Iron IV'), 'strategy');
    assert.equal(normalizeCoachGameId('GTA'), 'gta');
  });

  it('extracts patch versions from live patch notes text', () => {
    assert.equal(
      extractPatchVersionFromText('EA FC Title Update #16 live now with through-ball nerf', 'Patch 1.14.2'),
      'TU 16'
    );
    assert.equal(
      extractPatchVersionFromText('Counter-Strike 2 Patch 2.9.4 release notes', 'Sub-Tick 2.8.1'),
      'Patch 2.9.4'
    );
  });

  it('caches synced meta within TTL and updates when expired', async () => {
    clearLiveMetaCache();
    let fetchCalls = 0;

    const mockFetcher = (async (url: string | URL) => {
      fetchCalls += 1;
      const str = String(url);
      if (str.includes('reddit.com')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              children: [
                { data: { title: 'EA FC Title Update 18 meta notes', selftext: 'Offside trap timing adjusted' } },
              ],
            },
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({
          query: {
            search: [{ title: 'EA Sports FC', snippet: 'Gameplay balance' }],
          },
        }),
      } as Response;
    }) as typeof fetch;

    const t0 = 1_700_000_000_000;
    const first = await syncLatestGameMeta('fc27', { fetcher: mockFetcher, nowMs: t0 });
    assert.equal(first.patchVersion, 'TU 18');
    assert.equal(first.isFresh, true);
    assert.equal(fetchCalls, 2);

    const second = await syncLatestGameMeta('fc27', { fetcher: mockFetcher, nowMs: t0 + 60_000 });
    assert.equal(second.patchVersion, 'TU 18');
    assert.equal(fetchCalls, 2);

    const third = await syncLatestGameMeta('fc27', {
      fetcher: mockFetcher,
      nowMs: t0 + META_CACHE_TTL_MS + 1000,
    });
    assert.equal(third.isFresh, true);
    assert.equal(fetchCalls, 4);
  });

  it('resolves real gameplay videos and screenshots from Steam Store API and supports dynamic PC game search', async () => {
    clearLiveMetaCache();
    const mockFetcher = (async (url: string | URL) => {
      const str = String(url);
      if (str.includes('appdetails')) {
        return {
          ok: true,
          json: async () => ({
            '730': {
              success: true,
              data: {
                name: 'Counter-Strike 2',
                screenshots: [
                  {
                    id: 1,
                    path_full: 'https://cdn.example/cs2-ss1.jpg',
                    path_thumbnail: 'https://cdn.example/cs2-ss1-thumb.jpg',
                  },
                ],
                movies: [
                  {
                    id: 101,
                    name: 'CS2 Gameplay Trailer',
                    thumbnail: 'https://cdn.example/cs2-thumb.jpg',
                    hls_h264: 'https://cdn.example/cs2.m3u8',
                  },
                ],
              },
            },
          }),
        } as Response;
      }
      if (str.includes('storesearch')) {
        return {
          ok: true,
          json: async () => ({
            items: [{ id: 1086940, name: "Baldur's Gate 3", tiny_image: 'https://cdn.example/bg3.jpg' }],
          }),
        } as Response;
      }
      return { ok: false } as Response;
    }) as typeof fetch;

    const bundle = await fetchRealGameMediaBundle(
      { gameId: 'cs2', steamAppId: 730 },
      { fetcher: mockFetcher, force: true }
    );
    assert.equal(bundle.videos.length, 1);
    assert.equal(bundle.videos[0].hlsUrl, 'https://cdn.example/cs2.m3u8');
    assert.equal(bundle.screenshots.length, 1);
    assert.equal(bundle.screenshots[0].fullUrl, 'https://cdn.example/cs2-ss1.jpg');

    const results = await searchAllPcGames("Baldur's Gate", { fetcher: mockFetcher });
    assert.ok(results.some((r) => r.steamAppId === 1086940 && r.name === "Baldur's Gate 3"));
  });

  it('dynamically recalculates AR metrics on viewport tap and formats Persian digits', () => {
    const base = getCachedOrDefaultGameMeta('fc27');
    const updated = adaptMetaForTap(base, 50, 22);
    assert.ok(updated.arPrimaryLabelFa.includes('متر'));
    assert.equal(toPersianDigits('0.25s'), '۰.۲۵s');
  });
});
