import assert from 'node:assert/strict';
import test from 'node:test';
import { Chess } from 'chess.js';
import { INITIAL_ECOSYSTEM_STATE } from '../data/seedData';
import {
  inspectImageBuffer,
  runCoachSymbioteAgent,
  runHighCourtProsecutorAgent,
  runHighlightCopyAgent,
  runScoreboardVisionAgent,
  runTacticalDrillAgent,
} from './internalAgents';

function makeMinimalPng(width: number, height: number, extraText = ''): Buffer {
  // Minimal PNG header + IHDR chunk + optional tEXt marker
  const ihdr = Buffer.alloc(25);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(ihdr, 0);
  ihdr.writeUInt32BE(13, 8);
  ihdr.write('IHDR', 12, 'ascii');
  ihdr.writeUInt32BE(width, 16);
  ihdr.writeUInt32BE(height, 20);
  const padding = Buffer.alloc(1500, 0x20);
  const textBuf = extraText ? Buffer.from(extraText, 'latin1') : Buffer.alloc(0);
  return Buffer.concat([ihdr, textBuf, padding]);
}

test('inspectImageBuffer detects clean high-res PNG vs Photoshop tampering', () => {
  const cleanPng = makeMinimalPng(1280, 720);
  const cleanRes = inspectImageBuffer(cleanPng, 'image/png');
  assert.equal(cleanRes.format, 'png');
  assert.equal(cleanRes.width, 1280);
  assert.equal(cleanRes.height, 720);
  assert.equal(cleanRes.tamperingSuspected, false);
  assert.ok(cleanRes.confidencePercent >= 90);

  const editedPng = makeMinimalPng(1280, 720, 'Adobe Photoshop CC 2025');
  const editedRes = inspectImageBuffer(editedPng, 'image/png');
  assert.equal(editedRes.tamperingSuspected, true);
  assert.ok(editedRes.editorMarkers.includes('photoshop'));
  assert.ok(editedRes.confidencePercent < 70);
});

test('runScoreboardVisionAgent produces game-appropriate extraction without external APIs', () => {
  const png = makeMinimalPng(1920, 1080);
  const res = runScoreboardVisionAgent({
    buffer: png,
    mimeType: 'image/png',
    game: 'EA SPORTS FC Pro Clubs',
    imageRef: '/src/assets/images/sample_eafc_scoreboard_1794941278189.jpg',
    clubName: 'London Vanguard FC',
  });
  assert.equal(res.homeTeam, 'London Vanguard FC');
  assert.equal(res.homeScore, 3);
  assert.equal(res.awayScore, 1);
  assert.equal(res.tamperingSuspected, false);
});

test('runTacticalDrillAgent generates chess.js-verified legal winning puzzles', () => {
  const drill = runTacticalDrillAgent({
    mode: '2d-chess',
    state: INITIAL_ECOSYSTEM_STATE,
    currentDrillId: 'chess-backrank-1',
  });
  assert.equal(drill.mode, '2d-chess');
  const chess = new Chess(drill.fen);
  const uci = drill.expectedMovesUci[0];
  const move = chess.move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: 'q',
  } as Parameters<Chess['move']>[0]);
  assert.ok(move, 'Expected drill winning move must be legal in chess.js');

  const pitch = runTacticalDrillAgent({
    mode: '3d-pitch',
    state: INITIAL_ECOSYSTEM_STATE,
  });
  assert.equal(pitch.mode, '3d-pitch');
  assert.equal(pitch.defenderPatrols.length, 2);
});

test('runHighCourtProsecutorAgent flags tampered manifest and inspects evidence buffer', () => {
  const caseItem = INITIAL_ECOSYSTEM_STATE.highCourtCases[0];
  const brief = runHighCourtProsecutorAgent({
    courtCase: caseItem,
    state: INITIAL_ECOSYSTEM_STATE,
    evidenceBuffer: makeMinimalPng(1280, 720, 'GIMP 2.10'),
    evidenceMimeType: 'image/png',
  });
  assert.equal(brief.verdictRecommendation, 'uphold_violation');
  assert.equal(brief.forensicFindings.length, 3);
  assert.ok(brief.confidence >= 80);
});

test('runCoachSymbioteAgent and runHighlightCopyAgent ground responses in player telemetry', () => {
  const reply = runCoachSymbioteAgent({
    message: 'How do I improve my chess and passing?',
    activeSection: 'training-lab',
    state: INITIAL_ECOSYSTEM_STATE,
  });
  assert.ok(reply.length > 30);
  assert.ok(reply.includes('OVR') && /\(\d+\)/.test(reply), `telemetry grounding missing: ${reply.slice(0, 80)}`);

  const copy = runHighlightCopyAgent({
    match: INITIAL_ECOSYSTEM_STATE.matches[0],
    clubName: INITIAL_ECOSYSTEM_STATE.profile.clubName,
  });
  assert.ok(copy.headline.length > 0);
  assert.ok(copy.caption.includes('3 - 1'));
});
