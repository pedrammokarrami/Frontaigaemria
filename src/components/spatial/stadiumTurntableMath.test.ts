import test from 'node:test';
import assert from 'node:assert/strict';
import { computeMicroTilt, computeScrubbedTime } from './stadiumTurntableMath';

test('computeScrubbedTime advances forward and wraps cleanly around duration', () => {
  assert.equal(computeScrubbedTime(2.0, 100, 8.0, 0.015), 3.5);
  assert.equal(computeScrubbedTime(7.5, 100, 8.0, 0.015), 1.0);
});

test('computeScrubbedTime wraps negative drags cleanly into [0, duration)', () => {
  const t = computeScrubbedTime(0.5, -100, 8.0, 0.015);
  assert.ok(Math.abs(t - 7.0) < 1e-9, `expected 7.0, got ${t}`);

  // Large multi-loop negative drag still lands inside [0, duration)
  const tMulti = computeScrubbedTime(0.2, -1500, 8.0, 0.015);
  assert.ok(tMulti >= 0 && tMulti < 8.0, `expected [0, 8), got ${tMulti}`);
});

test('computeScrubbedTime handles invalid or zero duration safely', () => {
  assert.equal(computeScrubbedTime(1.0, 40, 0), 0);
  assert.equal(computeScrubbedTime(1.0, 40, Number.NaN), 0);
});

test('computeMicroTilt clamps normalized coordinates within maxDeg bounds', () => {
  const center = computeMicroTilt(0, 0, 6.5);
  assert.equal(Math.abs(center.rotateX), 0);
  assert.equal(Math.abs(center.rotateY), 0);
  assert.deepEqual(computeMicroTilt(2.5, -3.0, 6.5), { rotateX: 6.5, rotateY: 6.5 });
  assert.deepEqual(computeMicroTilt(-2.0, 2.0, 6.5), { rotateX: -6.5, rotateY: -6.5 });
});
