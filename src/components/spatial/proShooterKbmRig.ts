import * as THREE from 'three';
import type { CarbonFiberMaps } from './controllerPbrMaterials';

export type ShooterKbmKey = 'keyW' | 'keyA' | 'keyS' | 'keyD' | 'shift' | 'space' | 'lmb' | 'rmb';

export interface ShooterKbmGlowTarget {
  isActiveChannel: boolean;
  capGroup: THREE.Object3D;
  baseY: number;
  baseRotX: number;
  pressDepth: number;
  pressRotX: number;
  shellMats: THREE.MeshPhysicalMaterial[];
  legendMat: THREE.MeshBasicMaterial | null;
  underglowMats: THREE.MeshBasicMaterial[];
  localAnchor: THREE.Vector3;
}

export interface ProShooterKbmAssembly {
  root: THREE.Group;
  targets: Partial<Record<ShooterKbmKey, ShooterKbmGlowTarget>>;
  keyBounceLight: THREE.PointLight;
  mouseBounceLight: THREE.PointLight;
  updateGlow: (
    glowMap: Record<string, number>,
    inSweetSpot: boolean,
    isLate: boolean,
    dt: number
  ) => void;
}

/**
 * Generates an upright, high-contrast transparent-background key legend texture.
 * Because `PlaneGeometry` rotated by `-Math.PI / 2` around X maps canvas top (`y=0`) to `-Z`
 * and canvas left (`x=0`) to `-X`, labels are mathematically guaranteed upright from the viewer camera.
 */
function createKeyLegendTexture(
  label: string,
  maxAnisotropy: number,
  options?: { width?: number; height?: number; fontSize?: number; accentStyle?: boolean }
): THREE.CanvasTexture {
  const width = options?.width ?? 256;
  const height = options?.height ?? 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, width, height);

  const fontSize =
    options?.fontSize ??
    (label.length === 1 ? Math.round(height * 0.56) : label.length <= 3 ? Math.round(height * 0.34) : Math.round(height * 0.28));

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${fontSize}px Inter, "SF Pro Display", system-ui, -apple-system, sans-serif`;

  // Subtle dark engraved drop shadow for crisp legibility on smoked-carbon keycaps
  ctx.shadowColor = options?.accentStyle ? 'rgba(34, 211, 238, 0.55)' : 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = options?.accentStyle ? 12 : 4;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, width / 2, height / 2 + 2);

  // Thin crisp corner accent underline for active-channel legends (A, D, LMB)
  if (options?.accentStyle) {
    const barW = Math.min(width * 0.44, fontSize * Math.max(0.85, label.length * 0.42));
    const barH = Math.max(4, Math.round(height * 0.032));
    ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
    ctx.fillRect((width - barW) / 2, height * 0.79, barW, barH);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a sculpted Cherry/OEM-profile beveled mechanical keycap BufferGeometry:
 * - Rounded-corner trapezoidal skirt tapering from full base `(w, d)` to narrow top `(0.76*w, 0.74*d)`
 * - Multi-step upper shoulder chamfer so studio HDRI specular glints glide smoothly over every bevel
 * - Subtle concave finger dish on the top face (zero raw flat boxes)
 */
function createSculptedKeycapGeometry(w: number, d: number, h: number): THREE.BufferGeometry {
  const segsPerCorner = 4;
  const ringPts = segsPerCorner * 4;

  // Vertical profile rings: [yFrac, scaleX, scaleZ, cornerRadiusFrac]
  const rings: Array<[number, number, number, number]> = [
    [0.0, 1.0, 1.0, 0.13],
    [0.14, 0.97, 0.97, 0.14],
    [0.62, 0.86, 0.84, 0.17],
    [0.86, 0.8, 0.78, 0.2],
    [0.95, 0.76, 0.74, 0.22],
    [1.0, 0.72, 0.7, 0.23],
  ];

  function roundedRectRing(rw: number, rd: number, cr: number): Array<[number, number]> {
    const hw = rw / 2;
    const hd = rd / 2;
    const r = Math.min(cr, hw * 0.46, hd * 0.46);
    const pts: Array<[number, number]> = [];
    const corners: Array<[number, number, number, number]> = [
      [hw - r, -hd + r, -Math.PI / 2, 0],
      [hw - r, hd - r, 0, Math.PI / 2],
      [-hw + r, hd - r, Math.PI / 2, Math.PI],
      [-hw + r, -hd + r, Math.PI, Math.PI * 1.5],
    ];
    for (const [cx, cz, a0, a1] of corners) {
      for (let i = 0; i < segsPerCorner; i++) {
        const t = i / (segsPerCorner - 1);
        const a = a0 + (a1 - a0) * t;
        pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
      }
    }
    return pts;
  }

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let ri = 0; ri < rings.length; ri++) {
    const [yf, sx, sz, crf] = rings[ri];
    const rw = w * sx;
    const rd = d * sz;
    const cr = Math.min(rw, rd) * crf;
    const pts = roundedRectRing(rw, rd, cr);

    for (let pi = 0; pi < ringPts; pi++) {
      const [px, pz] = pts[pi];
      // Subtle sculpted concave cylindrical finger dish on the upper crown
      let y = yf * h;
      if (ri >= rings.length - 2) {
        const nx = px / Math.max(0.001, (w * 0.72) / 2);
        const nz = pz / Math.max(0.001, (d * 0.7) / 2);
        const dish = (1 - nx * nx * 0.75) * (1 - nz * nz * 0.45) * 0.015;
        y -= dish;
      }
      positions.push(px, y, pz);
      uvs.push(px / w + 0.5, pz / d + 0.5);
    }
  }

  // Side walls between rings
  for (let ri = 0; ri < rings.length - 1; ri++) {
    const rowA = ri * ringPts;
    const rowB = (ri + 1) * ringPts;
    for (let pi = 0; pi < ringPts; pi++) {
      const next = (pi + 1) % ringPts;
      const a = rowA + pi;
      const b = rowA + next;
      const c = rowB + next;
      const dIdx = rowB + pi;
      indices.push(a, dIdx, b);
      indices.push(b, dIdx, c);
    }
  }

  // Top concave dish center vertex
  const topCenterIdx = positions.length / 3;
  positions.push(0, h - 0.016, 0);
  uvs.push(0.5, 0.5);

  const topRow = (rings.length - 1) * ringPts;
  for (let pi = 0; pi < ringPts; pi++) {
    const next = (pi + 1) % ringPts;
    indices.push(topCenterIdx, topRow + next, topRow + pi);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a sleek thin glowing perimeter switch-well frame tucked directly under an active keycap skirt.
 */
function createKeyUnderglowFrameGeometry(w: number, d: number): THREE.BufferGeometry {
  const outer = new THREE.Shape();
  const ow = w * 0.54;
  const od = d * 0.54;
  const r = 0.055;
  outer.moveTo(-ow + r, -od);
  outer.lineTo(ow - r, -od);
  outer.quadraticCurveTo(ow, -od, ow, -od + r);
  outer.lineTo(ow, od - r);
  outer.quadraticCurveTo(ow, od, ow - r, od);
  outer.lineTo(-ow + r, od);
  outer.quadraticCurveTo(-ow, od, -ow, od - r);
  outer.lineTo(-ow, -od + r);
  outer.quadraticCurveTo(-ow, -od, -ow + r, -od);

  const hole = new THREE.Path();
  const iw = w * 0.44;
  const id = d * 0.44;
  const ir = 0.04;
  hole.moveTo(-iw + ir, -id);
  hole.lineTo(iw - ir, -id);
  hole.quadraticCurveTo(iw, -id, iw, -id + ir);
  hole.lineTo(iw, id - ir);
  hole.quadraticCurveTo(iw, id, iw - ir, id);
  hole.lineTo(-iw + ir, id);
  hole.quadraticCurveTo(-iw, id, -iw, id - ir);
  hole.lineTo(-iw, -id + ir);
  hole.quadraticCurveTo(-iw, -id, -iw + ir, -id);
  outer.holes.push(hole);

  const geo = new THREE.ShapeGeometry(outer, 6);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

/**
 * Evaluates the sculpted ergonomic pro esports gaming mouse silhouette (G Pro X Superlight / Viper V3 Pro profile).
 * Broad rounded-square front click blades, subtle ergonomic waist, wide rounded palm rear — ZERO pointed egg/teardrop.
 * `v` runs 0 (front nose, -Z) -> 1 (rear palm tail, +Z).
 */
function evalMouseContour(v: number): { halfW: number; spineY: number; z: number } {
  const z = -0.76 + v * 1.52;

  // Authentic Logitech G Pro X Superlight / Viper V3 Pro outline:
  // Broad rounded front click deck, subtle thumb waist, full rounded rear palm heel (zero pointy tip)
  const u = Math.max(-0.995, Math.min(0.995, v * 2 - 1)); // -1 (nose) .. +1 (tail)
  const superEllipse = Math.pow(1 - Math.pow(Math.abs(u), 3.4), 0.36);
  const waistPinch = 1 - 0.09 * Math.exp(-Math.pow((v - 0.44) / 0.14, 2));
  const palmSwell = 1 + 0.08 * Math.exp(-Math.pow((v - 0.72) / 0.2, 2));
  const halfW = Math.max(0.14, 0.44 * superEllipse * waistPinch * palmSwell);

  // Sleek low-profile pro esports elevation (~38mm tall vs 125mm long) so front clicks & scroll wheel stay unobstructed
  const hump = Math.sin(Math.pow(v, 0.88) * Math.PI);
  const rearFill = 0.055 * Math.exp(-Math.pow((v - 0.58) / 0.24, 2));
  const frontSlope = v < 0.36 ? 0.032 * Math.pow(1 - v / 0.36, 1.3) : 0;
  const spineY = Math.max(0.075, 0.075 + (0.215 * hump + rearFill - frontSlope));

  return { halfW, spineY, z };
}

/**
 * Builds a high-poly lofted ergonomic pro gaming mouse shell (`BufferGeometry`) with:
 * - Broad front trigger deck, recessed center scroll trench, ergonomic waist, wide palm hump
 * - Guaranteed outward normals across the entire shell & flat underside
 */
function createErgonomicMouseShellGeometry(): THREE.BufferGeometry {
  const vSteps = 32;
  const uSteps = 28;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iv = 0; iv <= vSteps; iv++) {
    const v = iv / vSteps;
    const { halfW, spineY, z } = evalMouseContour(v);

    for (let iu = 0; iu <= uSteps; iu++) {
      const uFrac = iu / uSteps; // 0 (left -X) -> 1 (right +X)
      const theta = uFrac * Math.PI;
      const cosT = -Math.cos(theta); // -1 (left) -> +1 (right)
      const sinT = Math.sin(theta); // 0 at base -> 1 at crown

      const flankUndercut = 1 - 0.07 * Math.pow(1 - sinT, 2.0) * (1 - Math.abs(v - 0.5) * 1.1);
      const x = cosT * halfW * flankUndercut;

      // Full ergonomic cross-section shoulders
      const arch = Math.pow(sinT, 0.72);
      let y = 0.036 + spineY * arch;

      // Recess the front button beds + center scroll wheel well so split LMB/RMB triggers float crisply above
      if (v < 0.49 && sinT > 0.22) {
        const frontBlend = Math.max(0, 1 - Math.max(0, (v - 0.39) / 0.1));
        const trench = Math.exp(-Math.pow(cosT / 0.18, 2)) * 0.088 * frontBlend;
        const bedRecess = 0.032 * frontBlend;
        y = Math.max(0.055, y - trench - bedRecess);
      }

      positions.push(x, y, z);
      uvs.push(uFrac * 2, v * 2);
    }
  }

  const stride = uSteps + 1;
  for (let iv = 0; iv < vSteps; iv++) {
    for (let iu = 0; iu < uSteps; iu++) {
      const a = iv * stride + iu;
      const b = a + 1;
      const c = (iv + 1) * stride + iu;
      const d = c + 1;
      // u goes -X -> +X, v goes -Z -> +Z => (c-a) x (b-a) = (+Z) x (+X) = +Y outward!
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  // Flat underside cap closing the mouse belly cleanly
  const bellyCenterIdx = positions.length / 3;
  positions.push(0, 0.028, 0);
  uvs.push(0.5, 0.5);

  const perimeter: number[] = [];
  for (let iv = 0; iv <= vSteps; iv++) perimeter.push(iv * stride);
  for (let iv = vSteps; iv >= 0; iv--) perimeter.push(iv * stride + uSteps);
  for (let i = 0; i < perimeter.length - 1; i++) {
    indices.push(bellyCenterIdx, perimeter[i + 1], perimeter[i]);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds an individually sculpted concave click trigger paddle (`LMB` on side `-1`, `RMB` on side `+1`).
 * Always parameterizes `u` strictly left-to-right (`-X -> +X`) and `v` front-to-back (`-Z -> +Z`)
 * so top normals are guaranteed outward (`+Y`) on BOTH paddles with zero backface culling.
 */
function createMouseClickPaddleGeometry(side: -1 | 1): {
  geometry: THREE.BufferGeometry;
  rimPoints: THREE.Vector3[];
  decalCenter: THREE.Vector3;
  decalPitch: number;
} {
  const vStart = 0.02;
  const vEnd = 0.47;
  const vSteps = 16;
  const uSteps = 10;
  const thickness = 0.036;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // uLR runs strictly 0 (leftmost edge of this paddle) -> 1 (rightmost edge of this paddle)
  const evalPaddlePoint = (v: number, uLR: number, top: boolean): THREE.Vector3 => {
    const { halfW, spineY, z } = evalMouseContour(v);
    const innerEdge = v < 0.3 ? 0.17 : 0.08;
    const outerEdge = 0.94;
    const cosMin = side < 0 ? -outerEdge : innerEdge;
    const cosMax = side < 0 ? -innerEdge : outerEdge;
    const cosT = cosMin + uLR * (cosMax - cosMin);
    const sinT = Math.sqrt(Math.max(0.06, 1 - cosT * cosT));
    const arch = Math.pow(sinT, 0.72);

    // Ergonomic concave finger groove across the middle of the trigger blade
    const fingerGroove = Math.sin(uLR * Math.PI) * 0.016;
    const baseY = 0.036 + spineY * arch + 0.008 - fingerGroove;
    const y = top ? baseY + thickness : baseY;
    return new THREE.Vector3(cosT * halfW, y, z);
  };

  // Top surface vertices
  for (let iv = 0; iv <= vSteps; iv++) {
    const vf = iv / vSteps;
    const v = vStart + vf * (vEnd - vStart);
    for (let iu = 0; iu <= uSteps; iu++) {
      const uf = iu / uSteps;
      const pt = evalPaddlePoint(v, uf, true);
      positions.push(pt.x, pt.y, pt.z);
      uvs.push(uf, vf);
    }
  }

  // Bottom surface vertices
  const botOffset = (vSteps + 1) * (uSteps + 1);
  for (let iv = 0; iv <= vSteps; iv++) {
    const vf = iv / vSteps;
    const v = vStart + vf * (vEnd - vStart);
    for (let iu = 0; iu <= uSteps; iu++) {
      const uf = iu / uSteps;
      const pt = evalPaddlePoint(v, uf, false);
      positions.push(pt.x, pt.y, pt.z);
      uvs.push(uf, vf);
    }
  }

  const stride = uSteps + 1;
  for (let iv = 0; iv < vSteps; iv++) {
    for (let iu = 0; iu < uSteps; iu++) {
      const a = iv * stride + iu;
      const b = a + 1;
      const c = (iv + 1) * stride + iu;
      const d = c + 1;
      // Top (+Y outward)
      indices.push(a, c, b, b, c, d);
      // Bottom (-Y outward)
      const ba = botOffset + a;
      const bb = botOffset + b;
      const bc = botOffset + c;
      const bd = botOffset + d;
      indices.push(ba, bb, bc, bb, bd, bc);
    }
  }

  // Stitch solid machined perimeter edges (outward winding around CW top perimeter)
  const stitchEdge = (ringIndices: number[]) => {
    for (let i = 0; i < ringIndices.length - 1; i++) {
      const t0 = ringIndices[i];
      const t1 = ringIndices[i + 1];
      const b0 = botOffset + t0;
      const b1 = botOffset + t1;
      indices.push(t0, t1, b0, t1, b1, b0);
    }
  };

  const frontEdge: number[] = [];
  const rightEdge: number[] = [];
  const backEdge: number[] = [];
  const leftEdge: number[] = [];
  for (let iu = 0; iu <= uSteps; iu++) frontEdge.push(iu);
  for (let iv = 0; iv <= vSteps; iv++) rightEdge.push(iv * stride + uSteps);
  for (let iu = uSteps; iu >= 0; iu--) backEdge.push(vSteps * stride + iu);
  for (let iv = vSteps; iv >= 0; iv--) leftEdge.push(iv * stride);

  stitchEdge(frontEdge);
  stitchEdge(rightEdge);
  stitchEdge(backEdge);
  stitchEdge(leftEdge);

  // Glowing perimeter seam path hugging the outer lip of the click blade
  const rimPoints: THREE.Vector3[] = [];
  for (let iu = 0; iu <= uSteps; iu += 2) {
    const p = evalPaddlePoint(vStart, iu / uSteps, true);
    rimPoints.push(new THREE.Vector3(p.x, p.y - 0.004, p.z));
  }
  for (let iv = 1; iv <= vSteps; iv += 2) {
    const v = vStart + (iv / vSteps) * (vEnd - vStart);
    const p = evalPaddlePoint(v, 1, true);
    rimPoints.push(new THREE.Vector3(p.x, p.y - 0.004, p.z));
  }
  for (let iu = uSteps; iu >= 0; iu -= 2) {
    const p = evalPaddlePoint(vEnd, iu / uSteps, true);
    rimPoints.push(new THREE.Vector3(p.x, p.y - 0.004, p.z));
  }
  for (let iv = vSteps - 1; iv >= 0; iv -= 2) {
    const v = vStart + (iv / vSteps) * (vEnd - vStart);
    const p = evalPaddlePoint(v, 0, true);
    rimPoints.push(new THREE.Vector3(p.x, p.y - 0.004, p.z));
  }

  // Exact surface center and gentle front slope pitch for the upright `LMB` decal
  const pMid = evalPaddlePoint(0.28, 0.46, true);
  const pFwd = evalPaddlePoint(0.18, 0.46, true);
  const pBack = evalPaddlePoint(0.38, 0.46, true);
  const dy = pBack.y - pFwd.y;
  const dz = pBack.z - pFwd.z;
  const decalPitch = Math.atan2(dy, dz) * 0.72;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  return {
    geometry: geo,
    rimPoints,
    decalCenter: new THREE.Vector3(pMid.x, pMid.y + 0.02, pMid.z),
    decalPitch,
  };
}

/**
 * Creates a rounded CNC-machined anodized aluminum enclosure shape.
 */
function createRoundedRectShape(halfW: number, halfD: number, radius: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-halfW + radius, -halfD);
  s.lineTo(halfW - radius, -halfD);
  s.quadraticCurveTo(halfW, -halfD, halfW, -halfD + radius);
  s.lineTo(halfW, halfD - radius);
  s.quadraticCurveTo(halfW, halfD, halfW - radius, halfD);
  s.lineTo(-halfW + radius, halfD);
  s.quadraticCurveTo(-halfW, halfD, -halfW, halfD - radius);
  s.lineTo(-halfW, -halfD + radius);
  s.quadraticCurveTo(-halfW, -halfD, -halfW + radius, -halfD);
  return s;
}

/**
 * Builds the Unreal 5.8 Pro Esports Shooter Rig:
 * 1. Dark Anodized-Aluminum & Smoked-Glass 6-Key Tactical Cluster (`W, A, S, D, Shift, Space`)
 *    with sculpted Cherry-profile beveled keycaps and mathematically upright crisp legends.
 * 2. Sculpted Ergonomic Pro Esports Mouse (lofted shell, split LMB/RMB triggers, knurled scroll wheel,
 *    side thumb buttons, brushed metallic base).
 * 3. Exclusive sharp cyan-emerald (`#22d3ee`) emissive underglow on `A`, `D`, and `LMB` only.
 */
export function createProShooterKbmAssembly(
  carbonMaps: CarbonFiberMaps,
  maxAnisotropy: number,
  isSoftwareGl: boolean
): ProShooterKbmAssembly {
  const root = new THREE.Group();

  // Shared Unreal 5.8 PBR Material Library
  const anodizedAluminumMat = new THREE.MeshPhysicalMaterial({
    color: 0x161f2e,
    metalness: 0.48,
    roughness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    normalMap: carbonMaps.normalMap,
    normalScale: new THREE.Vector2(0.08, 0.08),
    roughnessMap: carbonMaps.roughnessMap,
    envMapIntensity: 1.65,
  });

  const smokedGlassPlateMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b1220,
    metalness: 0.35,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    transmission: isSoftwareGl ? 0 : 0.25,
    ior: 1.5,
    thickness: 0.25,
    envMapIntensity: 1.8,
  });

  const titaniumTrimMat = new THREE.MeshPhysicalMaterial({
    color: 0x64748b,
    metalness: 0.88,
    roughness: 0.18,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.8,
  });

  const mouseCarbonShellMat = new THREE.MeshPhysicalMaterial({
    color: 0x141d2c,
    metalness: 0.4,
    roughness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    sheen: 0.3,
    sheenRoughness: 0.35,
    sheenColor: new THREE.Color(0x38bdf8),
    normalMap: carbonMaps.normalMap,
    normalScale: new THREE.Vector2(0.14, 0.14),
    roughnessMap: carbonMaps.roughnessMap,
    envMapIntensity: 1.55,
  });

  const rubberScrollMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.2,
    roughness: 0.65,
    envMapIntensity: 0.85,
  });

  // =========================================================================
  // 1. LEFT: 6-KEY ANODIZED-ALUMINUM & SMOKED-GLASS TACTICAL CLUSTER
  // =========================================================================
  const keypadGroup = new THREE.Group();
  keypadGroup.position.set(-0.78, 0, 0.04);
  root.add(keypadGroup);

  const frameShape = createRoundedRectShape(1.06, 0.82, 0.14);
  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.032,
    bevelSize: 0.036,
    bevelSegments: 5,
    curveSegments: 12,
  });
  frameGeo.rotateX(Math.PI / 2);
  frameGeo.center();
  const frameMesh = new THREE.Mesh(frameGeo, anodizedAluminumMat);
  frameMesh.position.y = -0.02;
  keypadGroup.add(frameMesh);

  const frameRim = new THREE.LineSegments(
    new THREE.EdgesGeometry(frameGeo, 28),
    new THREE.LineBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.42,
    })
  );
  frameRim.position.copy(frameMesh.position);
  keypadGroup.add(frameRim);

  const plateShape = createRoundedRectShape(0.95, 0.71, 0.09);
  const plateGeo = new THREE.ExtrudeGeometry(plateShape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
  });
  plateGeo.rotateX(Math.PI / 2);
  plateGeo.center();
  const switchPlate = new THREE.Mesh(plateGeo, smokedGlassPlateMat);
  switchPlate.position.y = 0.072;
  keypadGroup.add(switchPlate);

  const boltGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.018, 6);
  for (const [bx, bz] of [
    [-0.96, -0.72],
    [0.96, -0.72],
    [-0.96, 0.72],
    [0.96, 0.72],
  ]) {
    const bolt = new THREE.Mesh(boltGeo, titaniumTrimMat);
    bolt.position.set(bx, 0.078, bz);
    keypadGroup.add(bolt);
  }

  const targets: ProShooterKbmAssembly['targets'] = {};

  interface KeySpec {
    id: 'keyW' | 'keyA' | 'keyS' | 'keyD' | 'shift' | 'space';
    label: string;
    x: number;
    z: number;
    w: number;
    d: number;
    isActiveChannel: boolean;
  }

  const keySpecs: KeySpec[] = [
    { id: 'keyW', label: 'W', x: -0.02, z: -0.42, w: 0.38, d: 0.38, isActiveChannel: false },
    { id: 'keyA', label: 'A', x: -0.35, z: 0.01, w: 0.38, d: 0.38, isActiveChannel: true },
    { id: 'keyS', label: 'S', x: 0.08, z: 0.01, w: 0.38, d: 0.38, isActiveChannel: false },
    { id: 'keyD', label: 'D', x: 0.51, z: 0.01, w: 0.38, d: 0.38, isActiveChannel: true },
    { id: 'shift', label: 'SHIFT', x: -0.58, z: 0.44, w: 0.62, d: 0.36, isActiveChannel: false },
    { id: 'space', label: 'SPACE', x: 0.28, z: 0.44, w: 1.0, d: 0.36, isActiveChannel: false },
  ];

  const keyHeight = 0.19;
  const keyBaseY = 0.086;

  for (const spec of keySpecs) {
    const capGroup = new THREE.Group();
    capGroup.position.set(spec.x, keyBaseY, spec.z);
    keypadGroup.add(capGroup);

    const capMat = new THREE.MeshPhysicalMaterial({
      color: spec.isActiveChannel ? 0x1b293f : 0x141d2c,
      metalness: 0.4,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      normalMap: carbonMaps.normalMap,
      normalScale: new THREE.Vector2(0.11, 0.11),
      roughnessMap: carbonMaps.roughnessMap,
      emissive: new THREE.Color(spec.isActiveChannel ? 0x22d3ee : 0x000000),
      emissiveIntensity: 0,
      envMapIntensity: 1.65,
    });

    const capMesh = new THREE.Mesh(createSculptedKeycapGeometry(spec.w, spec.d, keyHeight), capMat);
    capGroup.add(capMesh);

    const aspectRatio = spec.w / spec.d;
    const texW = aspectRatio > 1.3 ? 384 : 256;
    const legendTex = createKeyLegendTexture(spec.label, maxAnisotropy, {
      width: texW,
      height: 256,
      fontSize: spec.label.length > 1 ? 64 : 154,
      accentStyle: spec.isActiveChannel,
    });
    const legendMat = new THREE.MeshBasicMaterial({
      map: legendTex,
      color: spec.isActiveChannel ? 0xa5f3fc : 0xe2e8f0,
      transparent: true,
      opacity: spec.isActiveChannel ? 0.96 : 0.88,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    const decalW = spec.w * 0.64;
    const decalD = spec.d * 0.62;
    const legendPlane = new THREE.Mesh(new THREE.PlaneGeometry(decalW, decalD), legendMat);
    legendPlane.rotation.x = -Math.PI / 2;
    legendPlane.position.y = keyHeight - 0.002;
    legendPlane.renderOrder = 4;
    capGroup.add(legendPlane);

    const underglowMats: THREE.MeshBasicMaterial[] = [];

    if (spec.isActiveChannel) {
      const wellGlowMat = new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const wellFrame = new THREE.Mesh(
        createKeyUnderglowFrameGeometry(spec.w, spec.d),
        wellGlowMat
      );
      wellFrame.position.set(spec.x, keyBaseY + 0.005, spec.z);
      keypadGroup.add(wellFrame);

      const softHaloMat = new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const softHalo = new THREE.Mesh(
        new THREE.PlaneGeometry(spec.w * 1.24, spec.d * 1.24),
        softHaloMat
      );
      softHalo.rotation.x = -Math.PI / 2;
      softHalo.position.set(spec.x, keyBaseY + 0.003, spec.z);
      keypadGroup.add(softHalo);

      underglowMats.push(wellGlowMat, softHaloMat);
    }

    targets[spec.id] = {
      isActiveChannel: spec.isActiveChannel,
      capGroup,
      baseY: keyBaseY,
      baseRotX: 0,
      pressDepth: 0.032,
      pressRotX: 0,
      shellMats: [capMat],
      legendMat,
      underglowMats,
      localAnchor: new THREE.Vector3(
        keypadGroup.position.x + spec.x,
        keyBaseY + 0.22,
        keypadGroup.position.z + spec.z
      ),
    };
  }

  // =========================================================================
  // 2. RIGHT: SCULPTED ERGONOMIC PRO ESPORTS MOUSE (ZERO CAPSULES / BOXES)
  // =========================================================================
  const mouseGroup = new THREE.Group();
  mouseGroup.position.set(1.1, 0.02, 0.06);
  mouseGroup.rotation.set(0.08, -0.26, 0);
  mouseGroup.scale.setScalar(1.12);
  root.add(mouseGroup);

  const mouseShellGeo = createErgonomicMouseShellGeometry();
  const mouseShell = new THREE.Mesh(mouseShellGeo, mouseCarbonShellMat);
  mouseGroup.add(mouseShell);

  const baseOutline = new THREE.Shape();
  for (let i = 0; i <= 24; i++) {
    const v = i / 24;
    const { halfW, z } = evalMouseContour(v);
    if (i === 0) baseOutline.moveTo(-halfW * 0.95, z);
    else baseOutline.lineTo(-halfW * 0.95, z);
  }
  for (let i = 24; i >= 0; i--) {
    const v = i / 24;
    const { halfW, z } = evalMouseContour(v);
    baseOutline.lineTo(halfW * 0.95, z);
  }
  baseOutline.closePath();
  const mouseBaseGeo = new THREE.ExtrudeGeometry(baseOutline, {
    depth: 0.026,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  mouseBaseGeo.rotateX(Math.PI / 2);
  const mouseBase = new THREE.Mesh(mouseBaseGeo, titaniumTrimMat);
  mouseBase.position.y = 0.036;
  mouseGroup.add(mouseBase);

  // Split Sculpted Left Mouse Button (`LMB`) with guaranteed outward normals & upright `LMB` decal
  const lmbBuilt = createMouseClickPaddleGeometry(-1);
  const lmbPivot = new THREE.Group();
  mouseGroup.add(lmbPivot);

  const lmbMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e3048,
    metalness: 0.4,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    normalMap: carbonMaps.normalMap,
    normalScale: new THREE.Vector2(0.11, 0.11),
    roughnessMap: carbonMaps.roughnessMap,
    emissive: new THREE.Color(0x22d3ee),
    emissiveIntensity: 0.08,
    envMapIntensity: 1.75,
  });
  const lmbMesh = new THREE.Mesh(lmbBuilt.geometry, lmbMat);
  lmbPivot.add(lmbMesh);

  // Mathematically aligned upright `LMB` decal floating flush above the sloped front-left trigger blade
  const lmbLegendTex = createKeyLegendTexture('LMB', maxAnisotropy, {
    width: 256,
    height: 256,
    fontSize: 94,
    accentStyle: true,
  });
  const lmbLegendMat = new THREE.MeshBasicMaterial({
    map: lmbLegendTex,
    color: 0xe0faff,
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const lmbDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), lmbLegendMat);
  lmbDecal.position.copy(lmbBuilt.decalCenter);
  lmbDecal.rotation.order = 'YXZ';
  // `-decalPitch` drops the front (-Z) edge downward to match the aerodynamic mouse nose slope!
  lmbDecal.rotation.x = -Math.PI / 2 - lmbBuilt.decalPitch;
  lmbDecal.renderOrder = 6;
  lmbPivot.add(lmbDecal);

  // Sharp contoured `#22d3ee` cyan-emerald rim underglow tube tracing the entire sculpted LMB trigger blade
  const lmbRimCurve = new THREE.CatmullRomCurve3(lmbBuilt.rimPoints, true);
  const lmbRimMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const lmbRimTube = new THREE.Mesh(
    new THREE.TubeGeometry(lmbRimCurve, 40, 0.014, 8, true),
    lmbRimMat
  );
  lmbPivot.add(lmbRimTube);

  targets.lmb = {
    isActiveChannel: true,
    capGroup: lmbPivot,
    baseY: 0,
    baseRotX: 0,
    pressDepth: 0.016,
    pressRotX: 0.036,
    shellMats: [lmbMat],
    legendMat: lmbLegendMat,
    underglowMats: [lmbRimMat],
    localAnchor: new THREE.Vector3(mouseGroup.position.x - 0.18, 0.38, mouseGroup.position.z - 0.34),
  };

  // Split Sculpted Right Mouse Button (`RMB`) — sleek dark matte carbon (unlit!)
  const rmbBuilt = createMouseClickPaddleGeometry(1);
  const rmbMat = new THREE.MeshPhysicalMaterial({
    color: 0x162133,
    metalness: 0.4,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.09,
    normalMap: carbonMaps.normalMap,
    normalScale: new THREE.Vector2(0.11, 0.11),
    roughnessMap: carbonMaps.roughnessMap,
    envMapIntensity: 1.65,
  });
  const rmbMesh = new THREE.Mesh(rmbBuilt.geometry, rmbMat);
  mouseGroup.add(rmbMesh);

  // Recessed Machined Scroll Wheel inside the front center trench
  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(0, 0.248, -0.44);
  mouseGroup.add(wheelGroup);

  const wheelCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.068, 0.058, 24),
    titaniumTrimMat
  );
  wheelCore.rotation.z = Math.PI / 2;
  wheelGroup.add(wheelCore);

  const wheelTire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.072, 0.038, 24),
    rubberScrollMat
  );
  wheelTire.rotation.z = Math.PI / 2;
  wheelGroup.add(wheelTire);

  const notchGeo = new THREE.BoxGeometry(0.042, 0.012, 0.013);
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    const notch = new THREE.Mesh(notchGeo, titaniumTrimMat);
    notch.position.set(0, Math.sin(ang) * 0.072, Math.cos(ang) * 0.072);
    notch.rotation.x = -ang;
    wheelGroup.add(notch);
  }

  // Dual Sculpted Side Thumb Buttons (`M4` / `M5`) on the left ergonomic waist
  const thumbBtnGeo = new THREE.CapsuleGeometry(0.02, 0.12, 4, 8);
  thumbBtnGeo.rotateX(Math.PI / 2);
  const thumbFwd = new THREE.Mesh(thumbBtnGeo, titaniumTrimMat);
  thumbFwd.position.set(-0.4, 0.16, -0.14);
  thumbFwd.rotation.y = -0.12;
  mouseGroup.add(thumbFwd);

  const thumbBack = new THREE.Mesh(thumbBtnGeo, titaniumTrimMat);
  thumbBack.position.set(-0.41, 0.17, 0.06);
  thumbBack.rotation.y = 0.06;
  mouseGroup.add(thumbBack);

  // =========================================================================
  // 3. LOCALIZED `#22d3ee` CYAN-EMERALD BOUNCE LIGHTS (A/D + LMB ONLY)
  // =========================================================================
  const keyBounceLight = new THREE.PointLight(0x22d3ee, 0.0, 2.2, 1.5);
  keyBounceLight.position.set(-0.85, 0.46, 0.05);
  root.add(keyBounceLight);

  const mouseBounceLight = new THREE.PointLight(0x22d3ee, 0.0, 2.0, 1.5);
  mouseBounceLight.position.set(0.88, 0.48, -0.32);
  root.add(mouseBounceLight);

  root.scale.setScalar(0.88);
  root.rotation.x = 0.68;
  root.position.set(0, 0.5, 0.08);

  const CYAN_EMERALD_HEX = 0x22d3ee;
  const ACTIVE_LEGEND_HEX = 0xe0faff;
  const IDLE_ACTIVE_LEGEND_HEX = 0x67e8f9;

  const updateGlow: ProShooterKbmAssembly['updateGlow'] = (glowMap, inSweetSpot, _isLate, dt) => {
    let bestKeyIntensity = 0;
    let bestKeyAnchor: THREE.Vector3 | null = null;
    let lmbIntensity = 0;

    for (const [key, target] of Object.entries(targets) as Array<
      [ShooterKbmKey, ShooterKbmGlowTarget | undefined]
    >) {
      if (!target) continue;

      // Strict isolation: ONLY `A`, `D`, and `LMB` illuminate; W, S, Shift, Space, RMB stay matte carbon
      const rawIntensity = target.isActiveChannel ? Math.max(0, Math.min(1, glowMap[key] ?? 0)) : 0;
      const pulseBoost = inSweetSpot && rawIntensity > 0.35 ? 1.18 : 1.0;
      const intensity = Math.min(1, rawIntensity * pulseBoost);

      const targetY = target.baseY - (intensity > 0.25 ? target.pressDepth * intensity : 0);
      target.capGroup.position.y = THREE.MathUtils.damp(target.capGroup.position.y, targetY, 16, dt);

      if (target.pressRotX !== 0) {
        const targetRx = target.baseRotX + (intensity > 0.25 ? target.pressRotX * intensity : 0);
        target.capGroup.rotation.x = THREE.MathUtils.damp(
          target.capGroup.rotation.x,
          targetRx,
          16,
          dt
        );
      }

      for (const m of target.shellMats) {
        if (target.isActiveChannel) {
          m.emissive.setHex(CYAN_EMERALD_HEX);
          // Keep keycaps rich dark matte carbon; let the sharp underglow rim & glowing legends pop!
          m.emissiveIntensity =
            intensity > 0.06
              ? key === 'lmb'
                ? 0.06 + intensity * 0.24
                : 0.03 + intensity * 0.14
              : 0.02;
        } else {
          m.emissiveIntensity = 0;
        }
      }

      if (target.legendMat && target.isActiveChannel) {
        target.legendMat.color.setHex(intensity > 0.25 ? ACTIVE_LEGEND_HEX : IDLE_ACTIVE_LEGEND_HEX);
        target.legendMat.opacity = 0.78 + intensity * 0.22;
      }

      for (let i = 0; i < target.underglowMats.length; i++) {
        const uMat = target.underglowMats[i];
        uMat.color.setHex(CYAN_EMERALD_HEX);
        const restingAlpha = i === 0 ? 0.28 : 0.08;
        const maxAlpha = i === 0 ? 0.96 : 0.38;
        uMat.opacity = restingAlpha + intensity * (maxAlpha - restingAlpha);
      }

      if (key === 'lmb') {
        lmbIntensity = intensity;
      } else if (target.isActiveChannel && intensity > bestKeyIntensity) {
        bestKeyIntensity = intensity;
        bestKeyAnchor = target.localAnchor;
      }
    }

    keyBounceLight.color.setHex(CYAN_EMERALD_HEX);
    keyBounceLight.intensity = 0.2 + bestKeyIntensity * 1.1;
    if (bestKeyAnchor) {
      keyBounceLight.position.set(bestKeyAnchor.x, bestKeyAnchor.y + 0.12, bestKeyAnchor.z + 0.16);
    }

    mouseBounceLight.color.setHex(CYAN_EMERALD_HEX);
    mouseBounceLight.intensity = 0.22 + lmbIntensity * 1.25;
  };

  return {
    root,
    targets,
    keyBounceLight,
    mouseBounceLight,
    updateGlow,
  };
}
