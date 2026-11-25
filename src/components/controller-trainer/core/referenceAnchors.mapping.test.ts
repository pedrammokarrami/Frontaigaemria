import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMeshMappingFromNames } from './referenceAnchors';

test('fuzzy mesh-name mapping matches separate button meshes', () => {
  const names = [
    'btn_triangle_01', 'Btn_Circle', 'cross_btn', 'square',
    'dpad_up', 'dpad_down', 'dpad_left', 'dpad_right',
    'L1_button', 'R1_button', 'L2_trigger', 'R2_trigger',
    'touchpad_shell', 'share_key', 'options_key', 'ps_led',
    'stick_l3', 'stick_r3',
  ];
  const map = buildMeshMappingFromNames('ps5', names, {});
  assert.equal(map['BTN_TRIANGLE'], 'btn_triangle_01');
  assert.equal(map['BTN_CIRCLE'], 'Btn_Circle');
  assert.equal(map['BTN_CROSS'], 'cross_btn');
  assert.equal(map['BTN_SQUARE'], 'square');
  assert.equal(map['BTN_DPAD_UP'], 'dpad_up');
  assert.equal(map['BTN_DPAD_DOWN'], 'dpad_down');
  assert.equal(map['BTN_DPAD_LEFT'], 'dpad_left');
  assert.equal(map['BTN_DPAD_RIGHT'], 'dpad_right');
  assert.equal(map['BTN_L1'], 'L1_button');
  assert.equal(map['BTN_R1'], 'R1_button');
  assert.equal(map['BTN_L2'], 'L2_trigger');
  assert.equal(map['BTN_R2'], 'R2_trigger');
  assert.equal(map['BTN_TOUCHPAD'], 'touchpad_shell');
  assert.equal(map['BTN_SHARE'], 'share_key');
  assert.equal(map['BTN_OPTIONS'], 'options_key');
  assert.equal(map['BTN_PS'], 'ps_led');
  assert.equal(map['BTN_L3'], 'stick_l3');
  assert.equal(map['BTN_R3'], 'stick_r3');
});

test('no false positives on generic names; explicit mapping wins', () => {
  const map = buildMeshMappingFromNames('xbox', ['xbox_body', 'shell', 'grip'], { BTN_A: 'explicit_A' });
  assert.equal(Object.keys(map).length, 1);
  assert.equal(map['BTN_A'], 'explicit_A');

  // merged-body GLBs like node_id62 / Object_13 must match nothing
  const merged = buildMeshMappingFromNames('ps5', ['node_id62', 'Object_13', 'mesh_id63'], {});
  assert.deepEqual(merged, {});
});
