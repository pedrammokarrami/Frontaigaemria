import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAudioSpotifyMenuItems,
  getCinemaNetflixMenuItems,
  getGamePs5MenuItems,
  isHubMenuSoundMuted,
  playNetflixMenuSound,
  playPs5UiSound,
  playSpotifyTapSound,
  setHubMenuSoundMuted,
  stepMenuFocusIndex,
} from './hubQuickMenu';

test('stepMenuFocusIndex wraps forward and backward across menu tiles cleanly', () => {
  assert.equal(stepMenuFocusIndex(0, 4, 1), 1);
  assert.equal(stepMenuFocusIndex(3, 4, 1), 0);
  assert.equal(stepMenuFocusIndex(0, 4, -1), 3);
  assert.equal(stepMenuFocusIndex(2, 4, -1), 1);
  assert.equal(stepMenuFocusIndex(0, 0, 1), 0);
});

test('getGamePs5MenuItems returns core PS5 cards + map/store and optional backdrop mode toggle', () => {
  const withoutVideo = getGamePs5MenuItems({ hasVideoBackdrop: false, useVideoBackdrop: false });
  assert.equal(withoutVideo.length, 6);
  assert.deepEqual(
    withoutVideo.map((item) => item.id),
    ['demo', 'tournament', 'social', 'identity', 'map', 'store']
  );

  const withVideo = getGamePs5MenuItems({ hasVideoBackdrop: true, useVideoBackdrop: true });
  // backdrop toggle removed from the menu per user request — always 6 items
  assert.equal(withVideo.length, 6);
  assert.ok(!withVideo.some((i) => i.id === 'backdrop'));
});

test('getAudioSpotifyMenuItems and getCinemaNetflixMenuItems expose complete working entries', () => {
  const spotify = getAudioSpotifyMenuItems();
  assert.equal(spotify.length, 6);
  assert.ok(spotify.some((i) => i.id === 'rooms-hub' && i.accentHex === '#1DB954'));
  assert.ok(spotify.some((i) => i.id === 'social'));
  assert.ok(spotify.some((i) => i.id === 'map'));
  assert.ok(spotify.some((i) => i.id === 'store'));

  const netflixDimOff = getCinemaNetflixMenuItems(false);
  assert.equal(netflixDimOff.length, 7);
  assert.equal(netflixDimOff[0].accentHex, '#E50914');
  assert.ok(netflixDimOff.some((i) => i.id === 'map'));
  assert.ok(netflixDimOff.some((i) => i.id === 'store'));
  assert.ok(netflixDimOff.some((i) => i.id === 'dim' && i.titleFa.includes('Cinema Mode')));

  const netflixDimOn = getCinemaNetflixMenuItems(true);
  assert.ok(netflixDimOn.some((i) => i.id === 'dim' && i.titleFa.includes('نور عادی')));
});

test('Web Audio sound helpers and mute toggle fail-safe safely without browser window', () => {
  // Menu sounds are permanently disabled (user mandate) — the default is muted.
  assert.equal(isHubMenuSoundMuted(), true);
  setHubMenuSoundMuted(false);
  assert.equal(isHubMenuSoundMuted(), false);
  setHubMenuSoundMuted(true);
  assert.equal(isHubMenuSoundMuted(), true);

  assert.doesNotThrow(() => {
    playPs5UiSound('open');
    playPs5UiSound('tick');
    playPs5UiSound('confirm');
    playPs5UiSound('close');
    playSpotifyTapSound('open');
    playSpotifyTapSound('tap');
    playNetflixMenuSound('open');
    playNetflixMenuSound('hover');
    playNetflixMenuSound('select');
  });
});
