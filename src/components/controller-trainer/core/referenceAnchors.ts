import * as THREE from 'three';
import type { DeviceAnchorMap, DeviceMeshMapping, DeviceType } from '../types/trainer';

/**
 * Calibrated reference-studio button coordinates for custom .glb models.
 *
 * The reference models are centered at [0,0,0] with a normalized footprint of
 * ~3.68 wide (half 1.84) and ~2.12 deep (half 1.08). When a custom GLB is
 * loaded, its actual local bounding box is measured and every reference point
 * is scaled proportionally into that box, then snapped directly onto the GLB
 * mesh surface with a raycast so button highlights land on the real geometry
 * (Watch playback + Bluetooth Live Test).
 */

export const REFERENCE_HALF_X = 1.84;
export const REFERENCE_HALF_Z = 1.08;
/** Reference model vertical center/half-extent (derived from the calibrated points). */
export const REFERENCE_CENTER_Y = 0.2;
export const REFERENCE_HALF_Y = 0.27;

export type ReferenceRayKind = 'top' | 'back-top' | 'back' | 'front-screen';

export interface ReferenceAnchorSpec {
  buttonId: string;
  /** Local reference point [x, y, z] in the calibrated reference-model space. */
  refPoint: [number, number, number];
  rayFrom: ReferenceRayKind;
  /** Outward surface normal for back-family anchors (used for ray + fallback normal). */
  normal?: [number, number, number];
  /** Normalized screen UV for front-screen (iPad) touch anchors. */
  uv?: { x: number; y: number };
}

export const PS5_REFERENCE_ANCHORS: ReferenceAnchorSpec[] = [
  { buttonId: 'BTN_TRIANGLE', refPoint: [1.12, 0.33, -0.46], rayFrom: 'top' },
  { buttonId: 'BTN_CIRCLE', refPoint: [1.38, 0.33, -0.20], rayFrom: 'top' },
  { buttonId: 'BTN_CROSS', refPoint: [1.12, 0.33, 0.06], rayFrom: 'top' },
  { buttonId: 'BTN_SQUARE', refPoint: [0.86, 0.33, -0.20], rayFrom: 'top' },
  { buttonId: 'BTN_DPAD_UP', refPoint: [-1.12, 0.33, -0.42], rayFrom: 'top' },
  { buttonId: 'BTN_DPAD_DOWN', refPoint: [-1.12, 0.33, 0.02], rayFrom: 'top' },
  { buttonId: 'BTN_DPAD_LEFT', refPoint: [-1.34, 0.33, -0.20], rayFrom: 'top' },
  { buttonId: 'BTN_DPAD_RIGHT', refPoint: [-0.90, 0.33, -0.20], rayFrom: 'top' },
  { buttonId: 'BTN_L3', refPoint: [-0.46, 0.44, 0.22], rayFrom: 'top' },
  { buttonId: 'BTN_R3', refPoint: [0.46, 0.44, 0.22], rayFrom: 'top' },
  { buttonId: 'BTN_TOUCHPAD', refPoint: [0.00, 0.36, -0.34], rayFrom: 'top' },
  { buttonId: 'BTN_PS', refPoint: [0.00, 0.33, 0.22], rayFrom: 'top' },
  { buttonId: 'BTN_SHARE', refPoint: [-0.74, 0.35, -0.44], rayFrom: 'top' },
  { buttonId: 'BTN_OPTIONS', refPoint: [0.74, 0.35, -0.44], rayFrom: 'top' },
  { buttonId: 'BTN_L1', refPoint: [-1.05, 0.20, -0.96], rayFrom: 'back-top', normal: [0, 0.45, -0.89] },
  { buttonId: 'BTN_R1', refPoint: [1.05, 0.20, -0.96], rayFrom: 'back-top', normal: [0, 0.45, -0.89] },
  { buttonId: 'BTN_L2', refPoint: [-1.06, -0.02, -1.06], rayFrom: 'back', normal: [0, 0.15, -0.98] },
  { buttonId: 'BTN_R2', refPoint: [1.06, -0.02, -1.06], rayFrom: 'back', normal: [0, 0.15, -0.98] },
];

export const XBOX_REFERENCE_ANCHORS: ReferenceAnchorSpec[] = [
  { buttonId: 'BTN_Y', refPoint: [1.06, 0.34, -0.46], rayFrom: 'top' },
  { buttonId: 'BTN_B', refPoint: [1.32, 0.34, -0.20], rayFrom: 'top' },
  { buttonId: 'BTN_A', refPoint: [1.06, 0.34, 0.06], rayFrom: 'top' },
  { buttonId: 'BTN_X', refPoint: [0.80, 0.34, -0.20], rayFrom: 'top' },
  { buttonId: 'BTN_LS', refPoint: [-0.96, 0.44, -0.22], rayFrom: 'top' },
  { buttonId: 'BTN_RS', refPoint: [0.52, 0.44, 0.24], rayFrom: 'top' },
  { buttonId: 'BTN_DPAD_UP', refPoint: [-0.52, 0.34, 0.08], rayFrom: 'top' },
  { buttonId: 'BTN_DPAD_DOWN', refPoint: [-0.52, 0.34, 0.40], rayFrom: 'top' },
  { buttonId: 'BTN_DPAD_LEFT', refPoint: [-0.68, 0.34, 0.24], rayFrom: 'top' },
  { buttonId: 'BTN_DPAD_RIGHT', refPoint: [-0.36, 0.34, 0.24], rayFrom: 'top' },
  { buttonId: 'BTN_XBOX', refPoint: [0.00, 0.35, -0.48], rayFrom: 'top' },
  { buttonId: 'BTN_VIEW', refPoint: [-0.28, 0.34, -0.14], rayFrom: 'top' },
  { buttonId: 'BTN_MENU', refPoint: [0.28, 0.34, -0.14], rayFrom: 'top' },
  { buttonId: 'BTN_LB', refPoint: [-1.00, 0.22, -0.98], rayFrom: 'back-top', normal: [0, 0.45, -0.89] },
  { buttonId: 'BTN_RB', refPoint: [1.00, 0.22, -0.98], rayFrom: 'back-top', normal: [0, 0.45, -0.89] },
  { buttonId: 'BTN_LT', refPoint: [-0.98, -0.02, -1.08], rayFrom: 'back', normal: [0, 0.15, -0.98] },
  { buttonId: 'BTN_RT', refPoint: [0.98, -0.02, -1.08], rayFrom: 'back', normal: [0, 0.15, -0.98] },
];

/** Landscape iPad Pro touch zones — normalized screen UV (x/y: 0..1, y from screen top). */
export const IPAD_REFERENCE_TOUCHES: ReferenceAnchorSpec[] = [
  { buttonId: 'TOUCH_MOVE', refPoint: [0, 0, 0], rayFrom: 'front-screen', uv: { x: 0.22, y: 0.68 } },
  { buttonId: 'TOUCH_AIM', refPoint: [0, 0, 0], rayFrom: 'front-screen', uv: { x: 0.72, y: 0.36 } },
  { buttonId: 'TOUCH_FIRE', refPoint: [0, 0, 0], rayFrom: 'front-screen', uv: { x: 0.82, y: 0.66 } },
  { buttonId: 'TOUCH_JUMP', refPoint: [0, 0, 0], rayFrom: 'front-screen', uv: { x: 0.86, y: 0.44 } },
  { buttonId: 'TOUCH_ULT', refPoint: [0, 0, 0], rayFrom: 'front-screen', uv: { x: 0.50, y: 0.76 } },
];

export function referenceSpecsForDevice(device: DeviceType): ReferenceAnchorSpec[] | null {
  if (device === 'ps5') return PS5_REFERENCE_ANCHORS;
  if (device === 'xbox') return XBOX_REFERENCE_ANCHORS;
  if (device === 'ipad') return IPAD_REFERENCE_TOUCHES;
  return null;
}

const DOWN = new THREE.Vector3(0, -1, 0);

interface SnapContext {
  /** Root (currentDeviceRoot) whose local space anchors are expressed in. */
  root: THREE.Object3D;
  pickableMeshes: THREE.Mesh[];
  /** AABB of the mounted GLB in root-local space. */
  localBox: THREE.Box3;
}

/** Deterministic probe offsets (in local units) retried when the primary ray misses small geometry. */
const PROBE_OFFSETS: Array<[number, number]> = [
  [0, 0],
  [0.09, 0],
  [-0.09, 0],
  [0, 0.09],
  [0, -0.09],
  [0.18, 0],
  [-0.18, 0],
  [0, 0.18],
  [0, -0.18],
];

interface SnapHit {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  meshName: string | undefined;
}

function snapRay(ctx: SnapContext, originLocal: THREE.Vector3, dirLocal: THREE.Vector3): SnapHit | null {
  const raycaster = new THREE.Raycaster();
  raycaster.far = 20;
  const ray = new THREE.Ray(originLocal.clone(), dirLocal.clone().normalize())
    .applyMatrix4(ctx.root.matrixWorld);
  raycaster.set(ray.origin, ray.direction);
  const hits = raycaster.intersectObjects(ctx.pickableMeshes, false);
  if (hits.length === 0) return null;
  const hit = hits[0];
  const invRoot = new THREE.Matrix4().copy(ctx.root.matrixWorld).invert();
  const worldNormal =
    hit.face && hit.object
      ? hit.face.normal
          .clone()
          .applyMatrix3(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld))
          .normalize()
      : dirLocal.clone().multiplyScalar(-1);
  return {
    point: ctx.root.worldToLocal(hit.point.clone()),
    normal: worldNormal.transformDirection(invRoot).normalize(),
    meshName: hit.object.name || undefined,
  };
}

/**
 * Outlier-robust local-space footprint. Sketchfab-style GLBs often carry stray
 * vertices (or stand props) that inflate the raw AABB; raw-bounds scaling then
 * lands reference buttons outside the real shell. Percentile bounds fix that.
 */
function robustLocalBounds(ctx: SnapContext): THREE.Box3 {
  const invRoot = new THREE.Matrix4().copy(ctx.root.matrixWorld).invert();
  const xs: number[] = [];
  const ys: number[] = [];
  const zs: number[] = [];
  const v = new THREE.Vector3();
  for (const mesh of ctx.pickableMeshes) {
    const pos = mesh.geometry.getAttribute('position');
    if (!pos) continue;
    const stride = Math.max(1, Math.floor(pos.count / 12000));
    mesh.updateMatrixWorld(true);
    const mw = mesh.matrixWorld;
    for (let i = 0; i < pos.count; i += stride) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mw).applyMatrix4(invRoot);
      xs.push(v.x); ys.push(v.y); zs.push(v.z);
    }
  }
  if (xs.length === 0) return ctx.localBox.clone();
  const pct = (arr: number[], p: number) => {
    const a = [...arr].sort((m, n) => m - n);
    return a[Math.min(a.length - 1, Math.max(0, Math.floor((a.length - 1) * p)))];
  };
  return new THREE.Box3(
    new THREE.Vector3(pct(xs, 0.01), pct(ys, 0.01), pct(zs, 0.01)),
    new THREE.Vector3(pct(xs, 0.99), pct(ys, 0.99), pct(zs, 0.99)),
  );
}

/**
 * Builds a full DeviceAnchorMap by scaling every reference anchor into the
 * measured GLB box and raycasting each point onto the actual mesh surface.
 * Never leaves a standard button missing: on a total miss the anchor falls
 * back to the scaled reference point + default normal.
 */
export function buildAnchorsFromReference(
  device: DeviceType,
  ctx: SnapContext,
): DeviceAnchorMap {
  const specs = referenceSpecsForDevice(device);
  if (!specs || ctx.localBox.isEmpty()) return {};

  // Outlier-robust footprint (raw AABBs on Sketchfab GLBs are inflated by stray verts)
  const robustBox = robustLocalBounds(ctx);
  const size = robustBox.getSize(new THREE.Vector3());
  const scaleX = size.x / (REFERENCE_HALF_X * 2);
  const scaleZ = size.z / (REFERENCE_HALF_Z * 2);
  const scaleY = size.y / (REFERENCE_HALF_Y * 2);
  const centerY = (robustBox.min.y + robustBox.max.y) / 2;
  const map: DeviceAnchorMap = {};

  for (const spec of specs) {
    let localX: number;
    let localY: number;
    let localZ: number;
    let dir = DOWN.clone();
    let fallbackNormal = new THREE.Vector3(0, 1, 0);

    if (spec.rayFrom === 'front-screen' && spec.uv) {
      // Front screen faces +z in root-local space (mirrors the ripple host placement)
      localX = robustBox.min.x + spec.uv.x * size.x;
      localY = robustBox.max.y - spec.uv.y * size.y;
      localZ = robustBox.max.z;
      dir = new THREE.Vector3(0, 0, -1);
      fallbackNormal = new THREE.Vector3(0, 0, 1);
    } else {
      localX = robustBox.min.x + (spec.refPoint[0] + REFERENCE_HALF_X) * scaleX;
      localZ = robustBox.min.z + (spec.refPoint[2] + REFERENCE_HALF_Z) * scaleZ;
      const scaledY = centerY + (spec.refPoint[1] - REFERENCE_CENTER_Y) * scaleY;

      if (spec.rayFrom === 'top') {
        localY = robustBox.max.y + 1.5;
      } else {
        // back-top (bumpers) and back (triggers) cast from behind the top edge
        localY = scaledY + 0.15;
        localZ = robustBox.min.z - 1.2;
        const n = spec.normal ?? [0, 0.15, -0.98];
        fallbackNormal = new THREE.Vector3(n[0], n[1], n[2]).normalize();
        // Ray direction points forward into the controller (opposite the outward normal)
        dir = fallbackNormal.clone().multiplyScalar(-1);
      }
    }

    // Primary ray plus deterministic probe retries for small/thin geometry
    // (share/options pills, triggers). Top faces probe x/z offsets; back-family
    // probes add a mid-height horizontal shot so plain rear shells are caught
    // when the angled primary ray sails over the trigger geometry.
    const candidates: Array<{ origin: THREE.Vector3; dir: THREE.Vector3 }> = [
      { origin: new THREE.Vector3(localX, localY, localZ), dir },
    ];
    if (spec.rayFrom === 'top' || spec.rayFrom === 'front-screen') {
      for (const [ox, oz] of PROBE_OFFSETS.slice(1)) {
        candidates.push({ origin: new THREE.Vector3(localX + ox, localY, localZ + oz), dir });
      }
    } else {
      const midY = (robustBox.max.y + robustBox.min.y) / 2;
      const horizontal = new THREE.Vector3(0, -0.02, 1);
      candidates.push(
        { origin: new THREE.Vector3(localX, midY, localZ), dir: horizontal },
        { origin: new THREE.Vector3(localX, robustBox.max.y * 0.45, localZ), dir: new THREE.Vector3(0, -0.15, 0.98) },
        { origin: new THREE.Vector3(localX, midY, robustBox.min.z - 0.5), dir: horizontal },
      );
      for (const [ox] of PROBE_OFFSETS.slice(1, 5)) {
        candidates.push({ origin: new THREE.Vector3(localX + ox, midY, localZ), dir: horizontal });
      }
    }

    let hit: SnapHit | null = null;
    for (const candidate of candidates) {
      hit = snapRay(ctx, candidate.origin, candidate.dir);
      if (hit) break;
    }

    // Concave/irregular footprints: shrink the x/z position toward the box
    // center until the down/horizontal ray finds surface — the anchor stays as
    // close to the intended physical spot as the model allows.
    if (!hit && spec.rayFrom !== 'back' && spec.rayFrom !== 'back-top') {
      const cx = (robustBox.min.x + robustBox.max.x) / 2;
      const cz = (robustBox.min.z + robustBox.max.z) / 2;
      for (const k of [0.9, 0.8, 0.7, 0.6, 0.5]) {
        hit = snapRay(
          ctx,
          new THREE.Vector3(cx + (localX - cx) * k, localY, cz + (localZ - cz) * k),
          dir,
        );
        if (hit) break;
      }
    }

    let point: THREE.Vector3;
    let normal: THREE.Vector3;
    let meshName: string | undefined;

    if (hit) {
      point = hit.point;
      normal = hit.normal;
      meshName = hit.meshName;
    } else {
      // Clean fallback — the scaled reference point + default normal, so NO
      // standard button is ever left without an anchor.
      point = new THREE.Vector3(localX, localY, localZ);
      if (spec.rayFrom === 'top') {
        point.y = robustBox.max.y;
      } else if (spec.rayFrom === 'front-screen') {
        point.z = robustBox.max.z;
      } else {
        point.y = centerY + (spec.refPoint[1] - REFERENCE_CENTER_Y) * scaleY;
        point.z = robustBox.min.z;
      }
      normal = fallbackNormal;
    }

    map[spec.buttonId] = {
      point: [
        Math.round(point.x * 10000) / 10000,
        Math.round(point.y * 10000) / 10000,
        Math.round(point.z * 10000) / 10000,
      ],
      normal: [
        Math.round(normal.x * 10000) / 10000,
        Math.round(normal.y * 10000) / 10000,
        Math.round(normal.z * 10000) / 10000,
      ],
      ...(meshName ? { meshName } : {}),
    };
  }

  return map;
}

/**
 * Fuzzy mesh-name matching — populates the mesh mapping automatically when a
 * custom .glb ships with separate button meshes (tri, circle, cross, square,
 * bumpers, triggers, dpad, touchpad, keys, mouse buttons...).
 */
const MESH_TOKEN_MATCHERS: Array<{ test: (tokens: Set<string>, joined: string) => boolean; ids: string[] }> = [
  { test: (t) => t.has('triangle') || t.has('tri'), ids: ['BTN_TRIANGLE'] },
  { test: (t) => t.has('circle') || t.has('circ'), ids: ['BTN_CIRCLE'] },
  { test: (t) => t.has('cross') || t.has('crossbtn'), ids: ['BTN_CROSS'] },
  { test: (t) => t.has('square') || t.has('sq'), ids: ['BTN_SQUARE'] },
  { test: (t, j) => /dpad.*up|up.*dpad/.test(j), ids: ['BTN_DPAD_UP'] },
  { test: (t, j) => /dpad.*down|down.*dpad/.test(j), ids: ['BTN_DPAD_DOWN'] },
  { test: (t, j) => /dpad.*left|left.*dpad/.test(j), ids: ['BTN_DPAD_LEFT'] },
  { test: (t, j) => /dpad.*right|right.*dpad/.test(j), ids: ['BTN_DPAD_RIGHT'] },
  { test: (t, j) => t.has('dpad') || t.has('d_pad'), ids: ['BTN_DPAD_UP', 'BTN_DPAD_DOWN', 'BTN_DPAD_LEFT', 'BTN_DPAD_RIGHT'] },
  { test: (t) => t.has('l1') || t.has('lb') || t.has('lbl') || t.has('bumperl') || t.has('bumper_l') || t.has('shoulderl'), ids: ['BTN_L1', 'BTN_LB'] },
  { test: (t) => t.has('r1') || t.has('rb') || t.has('rbr') || t.has('bumper') && !t.has('left'), ids: ['BTN_R1', 'BTN_RB'] },
  { test: (t) => t.has('l2') || t.has('lt') || t.has('triggerl') || t.has('trigger_l') || t.has('ltrigger'), ids: ['BTN_L2', 'BTN_LT'] },
  { test: (t) => t.has('r2') || t.has('rt') || t.has('triggerr') || t.has('trigger_r') || t.has('rtrigger'), ids: ['BTN_R2', 'BTN_RT'] },
  { test: (t, j) => (t.has('l3') || t.has('lstick') || t.has('stickl') || /l.*stick/.test(j)) && !t.has('r'), ids: ['BTN_L3', 'BTN_LS'] },
  { test: (t, j) => t.has('r3') || t.has('rstick') || t.has('stickr') || /r.*stick/.test(j), ids: ['BTN_R3', 'BTN_RS'] },
  { test: (t) => t.has('touchpad') || t.has('touch_pad') || t.has('pad'), ids: ['BTN_TOUCHPAD'] },
  { test: (t) => t.has('share') || t.has('create'), ids: ['BTN_SHARE'] },
  { test: (t) => t.has('options'), ids: ['BTN_OPTIONS'] },
  { test: (t) => t.has('ps') || t.has('home') || t.has('xboxbtn') || t.has('guide'), ids: ['BTN_PS', 'BTN_XBOX'] },
  { test: (t) => t.has('view') || t.has('select') || t.has('back'), ids: ['BTN_VIEW'] },
  { test: (t) => t.has('menu') || t.has('start'), ids: ['BTN_MENU'] },
  { test: (t) => t.has('lmb') || t.has('mouseleft'), ids: ['BTN_LMB'] },
  { test: (t) => t.has('rmb') || t.has('mouseright'), ids: ['BTN_RMB'] },
  { test: (t) => t.has('mmb') || t.has('mousemid'), ids: ['BTN_MMB'] },
  { test: (t) => t.has('key_w') || t.has('keyw'), ids: ['KEY_W'] },
  { test: (t) => t.has('key_a') || t.has('keya'), ids: ['KEY_A'] },
  { test: (t) => t.has('key_s') || t.has('keys'), ids: ['KEY_S'] },
  { test: (t) => t.has('key_d') || t.has('keyd'), ids: ['KEY_D'] },
  { test: (t) => t.has('space') || t.has('spacebar'), ids: ['KEY_SPACE'] },
  { test: (t) => t.has('shift'), ids: ['KEY_SHIFT'] },
  { test: (t) => t.has('ctrl') || t.has('control'), ids: ['KEY_CTRL'] },
];

/**
 * Derives a DeviceMeshMapping from GLB mesh names. Only fills buttons not
 * already present in the explicit mapping, and only keeps matches that are
 * unambiguous for the device (a mesh maps to at most one button per device).
 */
export function buildMeshMappingFromNames(
  device: DeviceType,
  meshNames: string[],
  explicit: DeviceMeshMapping,
): DeviceMeshMapping {
  const mapping: DeviceMeshMapping = { ...explicit };
  const usedMeshes = new Set<string>(Object.values(explicit));

  for (const rawName of meshNames) {
    const name = rawName.trim();
    if (!name || usedMeshes.has(name)) continue;
    const joined = name.toLowerCase().replace(/[_\-\s.]+/g, '_');
    const tokens = new Set(joined.split(/[^a-z0-9]+/).filter(Boolean));

    for (const matcher of MESH_TOKEN_MATCHERS) {
      if (!matcher.test(tokens, joined)) continue;
      const btnId = matcher.ids.find(
        (id) => !(id in mapping) && !usedMeshes.has(name),
      );
      if (btnId) {
        mapping[btnId] = name;
        usedMeshes.add(name);
      }
      break;
    }
  }

  return mapping;
}
