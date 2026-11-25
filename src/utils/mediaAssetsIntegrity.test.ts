import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CINEMA_ROOMS, type SpatialParticleMode } from './cinemaAgents';
import { AUDIO_ROOMS } from './audioAgents';
import {
  AUDIO_PROFILE_THEMES,
  CINEMA_PROFILE_THEMES,
} from '../components/identity/mediaProfileThemes';

const VALID_PARTICLE_MODES: Set<SpatialParticleMode> = new Set([
  'noir-dust',
  'cyber-rain',
  'alpine-mist',
  'retro-scan',
  'jazz-embers',
  'stadium-strobe',
  'rave-lasers',
  'festival-sparks',
  'zen-fireflies',
  'library-motes',
  'podcast-wave',
]);

const FORBIDDEN_ASSET_PATTERN = /ue5_|gta6_|lab_room_|athlete_avatar/;

function resolveWorkspaceAssetPath(assetUrl: string): string {
  const cleanRel = assetUrl.replace(/^\/+/, '');
  return path.resolve(process.cwd(), cleanRel);
}

test('All 5 Cinema and 7 Audio rooms map 1:1 to unique, on-disk, domain-authentic UE5 backdrops and particle modes', () => {
  assert.equal(CINEMA_ROOMS.length, 5);
  assert.equal(AUDIO_ROOMS.length, 7);

  const allRooms = [...CINEMA_ROOMS, ...AUDIO_ROOMS];
  const seenUrls = new Set<string>();

  for (const room of allRooms) {
    assert.ok(room.fallbackImageUrl.startsWith('/src/assets/images/room_'), `Expected room_* asset for ${room.id}, got ${room.fallbackImageUrl}`);
    assert.equal(
      FORBIDDEN_ASSET_PATTERN.test(room.fallbackImageUrl),
      false,
      `Forbidden game/placeholder asset found in ${room.id}: ${room.fallbackImageUrl}`
    );
    assert.equal(
      seenUrls.has(room.fallbackImageUrl),
      false,
      `Duplicate backdrop detected for ${room.id}: ${room.fallbackImageUrl}`
    );
    seenUrls.add(room.fallbackImageUrl);

    const diskPath = resolveWorkspaceAssetPath(room.fallbackImageUrl);
    assert.equal(fs.existsSync(diskPath), true, `Missing asset file on disk for ${room.id}: ${diskPath}`);
    assert.equal(
      VALID_PARTICLE_MODES.has(room.particleMode),
      true,
      `Invalid particleMode for ${room.id}: ${room.particleMode}`
    );
  }
});

test('Cinema and Audio 3D Spatial Profile themes use matching domain-authentic chambers on disk with zero Game leaks', () => {
  for (const room of CINEMA_ROOMS) {
    const theme = CINEMA_PROFILE_THEMES[room.id];
    assert.ok(theme, `Missing CINEMA_PROFILE_THEMES entry for ${room.id}`);
    assert.equal(theme.labEnv.imageUrl, room.fallbackImageUrl, `Profile backdrop mismatch for cinema:${room.id}`);
    assert.equal(FORBIDDEN_ASSET_PATTERN.test(theme.labEnv.imageUrl), false);
    assert.equal(fs.existsSync(resolveWorkspaceAssetPath(theme.labEnv.imageUrl)), true);
  }

  for (const room of AUDIO_ROOMS) {
    const theme = AUDIO_PROFILE_THEMES[room.id];
    assert.ok(theme, `Missing AUDIO_PROFILE_THEMES entry for ${room.id}`);
    assert.equal(theme.labEnv.imageUrl, room.fallbackImageUrl, `Profile backdrop mismatch for audio:${room.id}`);
    assert.equal(FORBIDDEN_ASSET_PATTERN.test(theme.labEnv.imageUrl), false);
    assert.equal(fs.existsSync(resolveWorkspaceAssetPath(theme.labEnv.imageUrl)), true);
  }
});

test('CinemaFbiSocialWorld does not reference athlete_avatar or unrelated gaming leaks', () => {
  const fbiFile = path.resolve(process.cwd(), 'src/components/cinema/CinemaFbiSocialWorld.tsx');
  const contents = fs.readFileSync(fbiFile, 'utf8');
  assert.equal(/athlete_avatar|gta6_|ue5_/.test(contents), false, 'CinemaFbiSocialWorld must not reference gaming backdrops or athlete_avatar');
});
