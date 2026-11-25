import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { HOLOGRAM_3D_GAME_IDS } from '../../data/gameTournamentThemes';
import {
  HOLOGRAM_TERRAIN_CONFIGS,
  evaluateTerrainHeight,
} from './hologramTerrainShaders';

test('all 6 hologram terrain configs use 256x256 smooth geometry and exact game theme colors', () => {
  const expectedColors: Record<string, string> = {
    FC27: '#00E676',
    WARZONE: '#F59E0B',
    CS2: '#DE6B24',
    GTA: '#EC4899',
    RDR2: '#B91C1C',
    APEX: '#DA292A',
  };

  const modes = new Set<number>();
  for (const gameId of HOLOGRAM_3D_GAME_IDS) {
    const cfg = HOLOGRAM_TERRAIN_CONFIGS[gameId];
    assert.equal(cfg.segments, 256, `${gameId} must use 256x256 terrain resolution`);
    assert.equal(cfg.primaryHex, expectedColors[gameId], `${gameId} theme hex mismatch`);
    modes.add(cfg.mapMode);
  }
  assert.equal(modes.size, 6, 'all 6 games must have distinct GLSL mapMode indices');
});

test('evaluateTerrainHeight returns smooth bounded elevation across all 6 maps and tapers at perimeter', () => {
  for (const gameId of HOLOGRAM_3D_GAME_IDS) {
    const r = HOLOGRAM_TERRAIN_CONFIGS[gameId].radius;
    const samples: number[] = [];
    for (let x = -1.2; x <= 1.2; x += 0.4) {
      for (let z = -1.2; z <= 1.2; z += 0.4) {
        const y = evaluateTerrainHeight(gameId, x, z);
        assert.equal(Number.isFinite(y), true, `${gameId} height must be finite`);
        assert.ok(y >= 0.03 && y <= 1.1, `${gameId} height ${y} out of bounds`);
        samples.push(y);
      }
    }
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    assert.ok(max - min > 0.08, `${gameId} must have genuine elevation relief (${max - min})`);

    // Perimeter rim smoothly tapers down
    const rimY = evaluateTerrainHeight(gameId, r, 0);
    assert.ok(rimY <= 0.07, `${gameId} perimeter rim should taper cleanly (${rimY})`);
  }
});

test('center 3D hologram worlds contain ZERO BoxGeometry, CylinderGeometry, SphereGeometry, or wireframe: true', () => {
  const shaderSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/spatial/hologramTerrainShaders.ts'),
    'utf8'
  );
  const worldsSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/spatial/tournamentHologramWorlds.ts'),
    'utf8'
  );

  // Extract only the center hologram world builders (everything after createHologramTableRoom)
  const centerWorldsSrc = worldsSrc.slice(worldsSrc.indexOf('function buildFc27PitchWorld'));
  assert.ok(centerWorldsSrc.length > 500, 'center worlds source should exist');

  for (const [label, src] of [
    ['hologramTerrainShaders.ts', shaderSrc],
    ['center hologram worlds', centerWorldsSrc],
  ]) {
    assert.equal(/new\s+THREE\.BoxGeometry\b/.test(src), false, `${label} must not use BoxGeometry`);
    assert.equal(/new\s+THREE\.CylinderGeometry\b/.test(src), false, `${label} must not use CylinderGeometry`);
    assert.equal(/new\s+THREE\.SphereGeometry\b/.test(src), false, `${label} must not use SphereGeometry`);
    assert.equal(/wireframe\s*:\s*true/.test(src), false, `${label} must not use wireframe: true`);
  }
});
