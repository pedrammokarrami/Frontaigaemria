import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import {
  buildAnchorsFromReference,
  PS5_REFERENCE_ANCHORS,
  XBOX_REFERENCE_ANCHORS,
  IPAD_REFERENCE_TOUCHES,
  REFERENCE_HALF_X,
  REFERENCE_HALF_Z,
  referenceSpecsForDevice,
} from './referenceAnchors';

/** Builds a mock root whose GLB fills the reference-model proportions exactly. */
function buildMockRoot(width: number, height: number, depth: number) {
  const root = new THREE.Group();
  const geo = new THREE.BoxGeometry(width, height, depth);
  const mat = new THREE.MeshStandardMaterial();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'MockShell';
  root.add(mesh);
  const scene = new THREE.Group();
  scene.add(root);
  root.updateMatrixWorld(true);
  return { root, mesh, pickableMeshes: [mesh] };
}

test('reference specs cover the calibrated button sets for ps5/xbox/ipad only', () => {
  assert.equal(PS5_REFERENCE_ANCHORS.length, 18);
  assert.equal(XBOX_REFERENCE_ANCHORS.length, 17);
  assert.equal(IPAD_REFERENCE_TOUCHES.length, 5);
  assert.equal(referenceSpecsForDevice('pc'), null);
  assert.equal(referenceSpecsForDevice('ps5')?.length, 18);
});

test('top-face anchors snap onto the GLB surface with up normals', () => {
  // GLB measured at exactly the reference proportions (half 1.84 / 1.08)
  const { root, pickableMeshes } = buildMockRoot(3.68, 0.66, 2.12);
  const box = new THREE.Box3().setFromObject(root);
  const map = buildAnchorsFromReference('ps5', { root, pickableMeshes, localBox: box });

  const cross = map['BTN_CROSS'];
  assert.ok(cross, 'BTN_CROSS anchor generated');
  // Reference x=1.12 == scaled exactly onto the box surface: x stays 1.12 (scale 1)
  assert.ok(Math.abs(cross.point[0] - 1.12) < 0.01, `x got ${cross.point[0]}`);
  assert.ok(Math.abs(cross.point[2] - 0.06) < 0.01, `z got ${cross.point[2]}`);
  assert.ok(Math.abs(cross.point[1] - 0.33) < 0.01, `y snapped to surface, got ${cross.point[1]}`);
  assert.ok(cross.normal[1] > 0.99, `normal points up, got ${cross.normal.join()}`);
  assert.equal(cross.meshName, 'MockShell');

  // Left dpad button lands proportionally on a smaller/shifted box too
  const { root: root2, pickableMeshes: pick2 } = buildMockRoot(2.4, 0.5, 1.4);
  const box2 = new THREE.Box3().setFromObject(root2);
  const map2 = buildAnchorsFromReference('xbox', { root: root2, pickableMeshes: pick2, localBox: box2 });
  const dpadLeft = map2['BTN_DPAD_LEFT'];
  assert.ok(dpadLeft, 'xbox dpad anchor generated');
  const expectedX = box2.min.x + (-0.68 + REFERENCE_HALF_X) * (2.4 / (REFERENCE_HALF_X * 2));
  assert.ok(Math.abs(dpadLeft.point[0] - expectedX) < 0.01, `proportional x, got ${dpadLeft.point[0]} want ${expectedX}`);
  assert.ok(dpadLeft.point[1] > box2.max.y - 0.02, 'snapped to the top surface');
});

test('back-family anchors hit the rear geometry with outward normals', () => {
  const { root, pickableMeshes } = buildMockRoot(3.68, 0.66, 2.12);
  const box = new THREE.Box3().setFromObject(root);
  const map = buildAnchorsFromReference('ps5', { root, pickableMeshes, localBox: box });

  const l1 = map['BTN_L1'];
  assert.ok(l1, 'BTN_L1 anchor generated');
  // Bumper sits on the back face (min z) — the ray must have reached the shell
  assert.ok(l1.point[2] < box.max.z - 0.2, `z on rear half, got ${l1.point[2]}`);
  // Spec origin is scaledY + 0.15 → the hit lands on the rear face within the body span
  assert.ok(l1.point[1] >= box.min.y - 0.01 && l1.point[1] <= box.max.y + 0.01, `y within body span, got ${l1.point[1]}`);
  assert.ok(l1.normal[2] < 0, `normal points backward, got ${l1.normal.join()}`);

  const l2 = map['BTN_L2'];
  assert.ok(l2, 'BTN_L2 anchor generated');
  assert.ok(l2.normal[2] < 0, 'trigger normal points backward');
});

test('ipad front-screen anchors map UVs onto the +z screen plane', () => {
  // Flat pad: width x, height y, thickness z — front screen faces +z
  const { root, pickableMeshes } = buildMockRoot(3.2, 2.2, 0.14);
  const box = new THREE.Box3().setFromObject(root);
  const map = buildAnchorsFromReference('ipad', { root, pickableMeshes, localBox: box });

  const move = map['TOUCH_MOVE'];
  assert.ok(move, 'TOUCH_MOVE anchor generated');
  // x = min.x + 0.22 * width
  const expectedX = box.min.x + 0.22 * 3.2;
  assert.ok(Math.abs(move.point[0] - expectedX) < 0.01, `uv x mapped, got ${move.point[0]} want ${expectedX}`);
  // y from screen top: min.y + (1 - 0.68) * height
  const expectedY = box.min.y + (1 - 0.68) * 2.2;
  assert.ok(Math.abs(move.point[1] - expectedY) < 0.01, `uv y mapped, got ${move.point[1]} want ${expectedY}`);
  assert.ok(Math.abs(move.point[2] - box.max.z) < 0.01, 'snapped onto the front screen plane');
  assert.ok(move.normal[2] > 0.99, `normal points out of the screen, got ${move.normal.join()}`);
});
