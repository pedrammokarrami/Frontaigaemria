import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeControllerSyncSnapshot,
  formatCompactComboStrip,
  resolveControllerRigMode,
} from './controllerCoachTiming';

test('resolveControllerRigMode maps shooter to kbm and sports/strategy/racing to gamepad', () => {
  assert.equal(resolveControllerRigMode('shooter_crosshair_peek'), 'kbm');
  assert.equal(resolveControllerRigMode('sports_pitch_arc'), 'gamepad');
  assert.equal(resolveControllerRigMode('strategy_flank_vector'), 'gamepad');
  assert.equal(resolveControllerRigMode('racing_apex_line'), 'gamepad');
});

test('sports_pitch_arc lights up L1 in preparation and L1+R1+triangle in sweet spot', () => {
  const prep = computeControllerSyncSnapshot('sports_pitch_arc', 0.2, 44, 68);
  assert.equal(prep.inSweetSpot, false);
  assert.ok(prep.glow.L1 > 0.5);
  assert.equal(prep.glow.triangle, 0);
  assert.deepEqual(prep.activeButtonLabels, ['L1']);

  const sweet = computeControllerSyncSnapshot('sports_pitch_arc', 0.55, 44, 68);
  assert.equal(sweet.inSweetSpot, true);
  assert.equal(sweet.glow.L1, 1);
  assert.equal(sweet.glow.R1, 1);
  assert.equal(sweet.glow.triangle, 1);
  assert.deepEqual(sweet.activeButtonLabels, ['L1', 'R1', '△']);

  const late = computeControllerSyncSnapshot('sports_pitch_arc', 0.88, 44, 68);
  assert.equal(late.isLateZone, true);
  assert.equal(late.accentColorHex, 0xf43f5e);
});

test('shooter_crosshair_peek synchronizes A/D strafe and Left-Click burst exclusively in #22d3ee', () => {
  const prep = computeControllerSyncSnapshot('shooter_crosshair_peek', 0.15, 48, 66);
  assert.equal(prep.rigMode, 'kbm');
  assert.equal(prep.accentColorHex, 0x22d3ee);
  assert.ok(prep.glow.keyA > 0.5);
  assert.equal(prep.glow.lmb, 0);
  assert.equal(prep.glow.keyW, 0);
  assert.equal(prep.glow.keyS, 0);
  assert.equal(prep.glow.space, 0);
  assert.equal(prep.glow.rmb, 0);

  const sweet = computeControllerSyncSnapshot('shooter_crosshair_peek', 0.56, 48, 66);
  assert.equal(sweet.inSweetSpot, true);
  assert.equal(sweet.glow.lmb, 1);
  assert.ok(sweet.glow.keyA >= 0.8);
  assert.ok(sweet.glow.keyD >= 0.9);
  assert.equal(sweet.glow.keyW, 0);
  assert.equal(sweet.glow.keyS, 0);
  assert.equal(sweet.glow.space, 0);
  assert.deepEqual(sweet.activeButtonLabels, ['A/D', 'LMB']);

  const late = computeControllerSyncSnapshot('shooter_crosshair_peek', 0.88, 48, 66);
  assert.equal(late.glow.keyW, 0);
  assert.equal(late.glow.keyS, 0);
  assert.equal(late.glow.space, 0);
  assert.equal(late.glow.rmb, 0);
});

test('formatCompactComboStrip produces concise non-overflowing combo tokens', () => {
  const sports = formatCompactComboStrip({
    archetype: 'sports_pitch_arc',
    triggerBadge: 'L1',
    timingWindowLabelFa: '۰.۲۵s',
    executionBadge: 'L1 + R1 + △',
  });
  assert.equal(sports.triggerToken, '[L1]');
  assert.equal(sports.windowToken, '۰.۲۵s');
  assert.equal(sports.executionToken, '[L1 + R1 + △]');

  const shooter = formatCompactComboStrip({
    archetype: 'shooter_crosshair_peek',
    triggerBadge: 'A / D',
    timingWindowLabelFa: '۱۸۰ms',
    executionBadge: 'Counter-Strafe + Burst',
  });
  assert.equal(shooter.triggerToken, '[A / D]');
  assert.equal(shooter.executionToken, '[A/D + LMB]');
});
