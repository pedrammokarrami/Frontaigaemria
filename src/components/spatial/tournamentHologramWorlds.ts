import * as THREE from 'three';
import type { Hologram3DGameId } from '../../data/gameTournamentThemes';
import {
  HOLOGRAM_TERRAIN_CONFIGS,
  createEnergyCurtainRibbon,
  createHologramTerrainMesh,
  createObjectiveBeamPin,
  createPulsingTrajectoryRibbon,
  createTacticalTargetRing,
  evaluateTerrainHeight,
} from './hologramTerrainShaders';

export interface HologramWorldHandle {
  group: THREE.Group;
  update: (elapsed: number, delta: number) => void;
}

/**
 * Helper: builds an anodized brushed-metal beveled octagonal war-table pedestal
 * + architectural dark-room backdrop ribs & floating ambient particles.
 */
export function createHologramTableRoom(): {
  roomGroup: THREE.Group;
  trimMat: THREE.MeshStandardMaterial;
  emitterMat: THREE.MeshBasicMaterial;
  coreRingMat: THREE.MeshBasicMaterial;
  particleMat: THREE.PointsMaterial;
  updateRoom: (elapsed: number) => void;
} {
  const roomGroup = new THREE.Group();

  // Architectural room floor with subtle radial grid rings
  const floorGeo = new THREE.CircleGeometry(14, 48);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x070a0f,
    roughness: 0.58,
    metalness: 0.35,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -1.65;
  roomGroup.add(floor);

  // Subtle architectural back-room pillars & vertical LED light strips framing the war room depth
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x0d121b,
    roughness: 0.62,
    metalness: 0.45,
  });
  const pillarGeo = new THREE.BoxGeometry(0.42, 8.2, 0.48);
  const stripGeo = new THREE.BoxGeometry(0.035, 5.8, 0.04);
  const pillarAngles = [-2.55, -2.05, -1.55, -1.05, -0.55];
  const stripMats: THREE.MeshBasicMaterial[] = [];
  for (const ang of pillarAngles) {
    const p = new THREE.Mesh(pillarGeo, pillarMat);
    p.position.set(Math.cos(ang) * 6.0, 2.0, Math.sin(ang) * 5.2 - 1.2);
    p.lookAt(0, 2.0, 0);
    roomGroup.add(p);

    const sMat = new THREE.MeshBasicMaterial({
      color: 0x00e676,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
    });
    stripMats.push(sMat);
    const s = new THREE.Mesh(stripGeo, sMat);
    s.position.set(0, 0.2, 0.26);
    p.add(s);
  }

  // Sculpted Octagonal Hologram Table Pedestal (3-tier composite)
  const tableGroup = new THREE.Group();
  tableGroup.position.y = -0.35;
  roomGroup.add(tableGroup);

  const outerOct = new THREE.Shape();
  const R = 2.42;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = Math.cos(a) * R;
    const y = Math.sin(a) * R;
    if (i === 0) outerOct.moveTo(x, y);
    else outerOct.lineTo(x, y);
  }
  outerOct.closePath();

  const tableDeckGeo = new THREE.ExtrudeGeometry(outerOct, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  tableDeckGeo.rotateX(Math.PI / 2);

  const deckMat = new THREE.MeshPhysicalMaterial({
    color: 0x111722,
    metalness: 0.65,
    roughness: 0.28,
    clearcoat: 0.7,
    clearcoatRoughness: 0.18,
  });
  const tableDeck = new THREE.Mesh(tableDeckGeo, deckMat);
  tableDeck.position.y = 0.08;
  tableGroup.add(tableDeck);

  // Pedestal base column supporting the war table
  const columnGeo = new THREE.CylinderGeometry(1.15, 1.55, 1.25, 8);
  const columnMat = new THREE.MeshStandardMaterial({
    color: 0x0a0e16,
    metalness: 0.55,
    roughness: 0.48,
  });
  const column = new THREE.Mesh(columnGeo, columnMat);
  column.position.y = -0.7;
  column.rotation.y = Math.PI / 8;
  tableGroup.add(column);

  // Glowing game-native LED trim ring hugging the beveled war-table edge
  const trimPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 8; i++) {
    const a = ((i % 8) / 8) * Math.PI * 2 + Math.PI / 8;
    trimPoints.push(new THREE.Vector3(Math.cos(a) * (R + 0.055), 0.05, Math.sin(a) * (R + 0.055)));
  }
  const trimCurve = new THREE.CatmullRomCurve3(trimPoints, true, 'catmullrom', 0.08);
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x00e676,
    emissive: 0x00e676,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.1,
  });
  const trimTube = new THREE.Mesh(new THREE.TubeGeometry(trimCurve, 64, 0.022, 8, true), trimMat);
  tableGroup.add(trimTube);

  // Dark optical glass emitter plate recessed in table top
  const glassPlateGeo = new THREE.CylinderGeometry(2.08, 2.08, 0.03, 8);
  const glassPlateMat = new THREE.MeshPhysicalMaterial({
    color: 0x060b12,
    metalness: 0.25,
    roughness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });
  const glassPlate = new THREE.Mesh(glassPlateGeo, glassPlateMat);
  glassPlate.position.y = 0.12;
  glassPlate.rotation.y = Math.PI / 8;
  tableGroup.add(glassPlate);

  // Holographic projector emitter ring & soft radial light cone
  const coreRingMat = new THREE.MeshBasicMaterial({
    color: 0x00e676,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const coreRing = new THREE.Mesh(new THREE.RingGeometry(1.78, 1.88, 48), coreRingMat);
  coreRing.rotation.x = -Math.PI / 2;
  coreRing.position.y = 0.145;
  tableGroup.add(coreRing);

  const emitterMat = new THREE.MeshBasicMaterial({
    color: 0x00e676,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const projectionCone = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 1.55, 1.25, 32, 1, true),
    emitterMat
  );
  projectionCone.position.y = 0.78;
  tableGroup.add(projectionCone);

  // Floating ambient holographic motes (embers / rain specks / dust)
  const particleCount = 120;
  const pPos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const r = 1.2 + Math.random() * 3.8;
    const theta = Math.random() * Math.PI * 2;
    pPos[i * 3] = Math.cos(theta) * r;
    pPos[i * 3 + 1] = -0.3 + Math.random() * 3.2;
    pPos[i * 3 + 2] = Math.sin(theta) * r;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x00e676,
    size: 0.045,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(pGeo, particleMat);
  roomGroup.add(particles);

  return {
    roomGroup,
    trimMat,
    emitterMat,
    coreRingMat,
    particleMat,
    updateRoom: (elapsed: number) => {
      particles.rotation.y = elapsed * 0.055;
      coreRing.rotation.z = elapsed * 0.12;
      emitterMat.opacity = 0.095 + Math.sin(elapsed * 2.1) * 0.025;
      for (const sm of stripMats) {
        sm.color.copy(trimMat.color);
      }
    },
  };
}

/**
 * Helper: renders a crisp flat holographic tactical ring + position disc texture (`ST`, `CAM`, `CB`, `GK`, etc.)
 */
function createHolographicPositionDiscTexture(
  label: string,
  primaryHex: string,
  ringHex: string,
  isHighlightRole: boolean
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    const cx = size / 2;
    const cy = size / 2;

    // Subtle dark translucent tactical glass core
    const grad = ctx.createRadialGradient(cx, cy, 12, cx, cy, 98);
    grad.addColorStop(0, isHighlightRole ? 'rgba(0, 230, 118, 0.34)' : 'rgba(6, 28, 19, 0.72)');
    grad.addColorStop(0.68, 'rgba(4, 18, 12, 0.56)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 98, 0, Math.PI * 2);
    ctx.fill();

    // Outer dashed tactical radar ring
    ctx.save();
    ctx.strokeStyle = ringHex;
    ctx.globalAlpha = isHighlightRole ? 0.92 : 0.62;
    ctx.lineWidth = isHighlightRole ? 6 : 4;
    ctx.setLineDash([20, 10]);
    ctx.beginPath();
    ctx.arc(cx, cy, 106, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Crisp inner glowing ring
    ctx.strokeStyle = primaryHex;
    ctx.lineWidth = isHighlightRole ? 7 : 5;
    ctx.shadowColor = primaryHex;
    ctx.shadowBlur = isHighlightRole ? 14 : 6;
    ctx.beginPath();
    ctx.arc(cx, cy, 78, 0, Math.PI * 2);
    ctx.stroke();

    // Crisp upright position label (`ST`, `CAM`, `CB`, `GK`)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 ${label.length > 2 ? 56 : 66}px "Barlow Condensed", "Oswald", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy + 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Shared helper to register animated ShaderMaterials inside each HologramCenterMesh world.
 */
interface WorldShaderRegistry {
  materials: THREE.ShaderMaterial[];
  track: (mat: THREE.ShaderMaterial) => THREE.ShaderMaterial;
  updateAll: (elapsed: number) => void;
}

function createShaderRegistry(): WorldShaderRegistry {
  const materials: THREE.ShaderMaterial[] = [];
  return {
    materials,
    track(mat: THREE.ShaderMaterial) {
      materials.push(mat);
      return mat;
    },
    updateAll(elapsed: number) {
      for (let i = 0; i < materials.length; i++) {
        const uTime = materials[i].uniforms.uTime;
        if (uTime) uTime.value = elapsed;
      }
    },
  };
}

/**
 * 1. FC 27 — 256x256 Custom GLSL Stadium Pitch & Bowl Contour Hologram (`#00E676`)
 *    + Flat Holographic Tactical Position Discs (GK/CB/CAM/ST) + Pulsing Pass Trajectory Ribbons + Penalty Box Light-Beam Pin
 */
function buildFc27PitchWorld(): HologramWorldHandle {
  const group = new THREE.Group();
  const reg = createShaderRegistry();
  const cfg = HOLOGRAM_TERRAIN_CONFIGS.FC27;

  // 256x256 Custom GLSL stadium pitch + surrounding bowl elevation isolines + 360 radar sweep + Fresnel rim
  const terrain = createHologramTerrainMesh(cfg);
  reg.track(terrain.material);
  group.add(terrain.mesh);

  // Sleek flat holographic tactical position discs hovering ~2px above the GLSL pitch
  const homeSlots: Array<{ label: string; x: number; z: number; featured: boolean }> = [
    { label: 'GK', x: -0.96, z: 0.0, featured: true },
    { label: 'CB', x: -0.62, z: -0.24, featured: true },
    { label: 'CB', x: -0.62, z: 0.25, featured: false },
    { label: 'LB', x: -0.44, z: -0.54, featured: false },
    { label: 'RB', x: -0.44, z: 0.54, featured: false },
    { label: 'CM', x: -0.14, z: -0.28, featured: false },
    { label: 'CAM', x: 0.08, z: 0.12, featured: true },
    { label: 'LW', x: 0.42, z: -0.48, featured: false },
    { label: 'RW', x: 0.42, z: 0.48, featured: false },
    { label: 'ST', x: 0.68, z: -0.05, featured: true },
  ];

  for (const slot of homeSlots) {
    const groundY = evaluateTerrainHeight('FC27', slot.x, slot.z);
    const tex = createHolographicPositionDiscTexture(
      slot.label,
      slot.label === 'GK' ? '#FACC15' : '#00E676',
      slot.label === 'GK' ? '#FACC15' : '#A7F3D0',
      slot.featured
    );
    const size = slot.featured ? 0.3 : 0.22;
    const disc = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(slot.x, groundY + 0.022, slot.z);
    disc.renderOrder = 4;
    group.add(disc);

    if (slot.featured) {
      const targetRing = createTacticalTargetRing(
        0.38,
        slot.label === 'GK' ? '#FACC15' : '#00E676',
        '#A7F3D0'
      );
      targetRing.mesh.position.set(slot.x, groundY + 0.018, slot.z);
      reg.track(targetRing.material);
      group.add(targetRing.mesh);
    }
  }

  // Vertical holographic light-beam pin marking the attacking Penalty Box objective
  const penY = evaluateTerrainHeight('FC27', 0.94, 0.0);
  const penaltyPin = createObjectiveBeamPin('PENALTY BOX', 0.94, penY, 0.0, '#00E676', '#A7F3D0', {
    height: 0.62,
    ringSize: 0.34,
  });
  reg.track(penaltyPin.beamMaterial);
  reg.track(penaltyPin.ringMaterial);
  group.add(penaltyPin.group);

  // Animated 3D curved pass-beam trajectory ribbons (TubeGeometry with flowing GLSL energy pulse)
  const passRibbon = createPulsingTrajectoryRibbon(
    [
      new THREE.Vector3(0.08, 0.09, 0.12),
      new THREE.Vector3(0.4, 0.46, -0.02),
      new THREE.Vector3(0.68, 0.095, -0.05),
    ],
    '#00E676',
    '#FEF08A',
    { radius: 0.015, speed: 0.45 }
  );
  reg.track(passRibbon.material);
  group.add(passRibbon.mesh);

  const buildRibbon = createPulsingTrajectoryRibbon(
    [
      new THREE.Vector3(-0.62, 0.088, -0.24),
      new THREE.Vector3(-0.28, 0.12, -0.08),
      new THREE.Vector3(0.08, 0.09, 0.12),
    ],
    '#00E676',
    '#A7F3D0',
    { radius: 0.01, speed: 0.38, phaseOffset: 0.35 }
  );
  reg.track(buildRibbon.material);
  group.add(buildRibbon.mesh);

  return {
    group,
    update: (elapsed: number) => {
      reg.updateAll(elapsed);
    },
  };
}

/**
 * 2. WARZONE — 256x256 Custom GLSL Urzikstan Topographic Contour Shader (`#F59E0B`)
 *    + Superstore & Loadout Light-Beam Pins + Pulsing Drop-In Trajectory Ribbons + Closing Gas Energy Curtain
 */
function buildWarzoneTerrainWorld(): HologramWorldHandle {
  const group = new THREE.Group();
  const reg = createShaderRegistry();
  const cfg = HOLOGRAM_TERRAIN_CONFIGS.WARZONE;

  const terrain = createHologramTerrainMesh(cfg);
  reg.track(terrain.material);
  group.add(terrain.mesh);

  // Key tactical objectives marked by vertical holographic light-beam pins
  const objectives: Array<{ label: string; x: number; z: number; height: number; ringSize: number }> = [
    { label: 'SUPERSTORE', x: -0.06, z: 0.04, height: 0.78, ringSize: 0.44 },
    { label: 'LOADOUT', x: 0.68, z: -0.36, height: 0.54, ringSize: 0.3 },
    { label: 'BUY STATION', x: -0.68, z: 0.42, height: 0.5, ringSize: 0.28 },
  ];

  for (const obj of objectives) {
    const y = evaluateTerrainHeight('WARZONE', obj.x, obj.z);
    const pin = createObjectiveBeamPin(obj.label, obj.x, y, obj.z, '#F59E0B', '#FDE68A', {
      height: obj.height,
      ringSize: obj.ringSize,
    });
    reg.track(pin.beamMaterial);
    reg.track(pin.ringMaterial);
    group.add(pin.group);
  }

  // Dual curved tactical insertion / rotation trajectory ribbons converging on Superstore
  const dropArc1 = createPulsingTrajectoryRibbon(
    [
      new THREE.Vector3(-1.12, 0.88, -0.52),
      new THREE.Vector3(-0.56, 0.72, -0.24),
      new THREE.Vector3(-0.06, evaluateTerrainHeight('WARZONE', -0.06, 0.04) + 0.04, 0.04),
    ],
    '#F59E0B',
    '#FEF3C7',
    { radius: 0.015, speed: 0.42 }
  );
  reg.track(dropArc1.material);
  group.add(dropArc1.mesh);

  const rotateArc = createPulsingTrajectoryRibbon(
    [
      new THREE.Vector3(-0.68, evaluateTerrainHeight('WARZONE', -0.68, 0.42) + 0.04, 0.42),
      new THREE.Vector3(0.05, 0.52, 0.16),
      new THREE.Vector3(0.68, evaluateTerrainHeight('WARZONE', 0.68, -0.36) + 0.04, -0.36),
    ],
    '#EA580C',
    '#FDE68A',
    { radius: 0.012, speed: 0.36, phaseOffset: 0.5 }
  );
  reg.track(rotateArc.material);
  group.add(rotateArc.mesh);

  // Sleek translucent closing gas zone energy curtain ribbon (zero CylinderGeometry)
  const gasCurtain = createEnergyCurtainRibbon(1.16, 0.28, '#F59E0B', 64);
  gasCurtain.group.position.y = 0.08;
  reg.track(gasCurtain.material);
  group.add(gasCurtain.group);

  return {
    group,
    update: (elapsed: number) => {
      reg.updateAll(elapsed);
      const pulse = 0.94 + Math.sin(elapsed * 1.8) * 0.045;
      gasCurtain.group.scale.set(pulse, 1, pulse);
    },
  };
}

/**
 * 3. CS2 — 256x256 Custom GLSL Mirage A-Site Architectural Contour Shader (`#DE6B24` + `#38BDF8`)
 *    + Site A / Palace / CT Ticket Light-Beam Pins + Dual Pro Smoke Execute Trajectory Ribbons
 */
function buildCs2MirageWorld(): HologramWorldHandle {
  const group = new THREE.Group();
  const reg = createShaderRegistry();
  const cfg = HOLOGRAM_TERRAIN_CONFIGS.CS2;

  const terrain = createHologramTerrainMesh(cfg);
  reg.track(terrain.material);
  group.add(terrain.mesh);

  // Key Mirage A-Site callout light-beam pins
  const objectives: Array<{
    label: string;
    x: number;
    z: number;
    color: string;
    accent: string;
    height: number;
    ringSize: number;
  }> = [
    { label: 'SITE A', x: -0.04, z: -0.1, color: '#DE6B24', accent: '#FDBA74', height: 0.76, ringSize: 0.48 },
    { label: 'PALACE', x: -0.88, z: 0.48, color: '#38BDF8', accent: '#E0F2FE', height: 0.52, ringSize: 0.3 },
    { label: 'CT TICKET', x: 0.84, z: -0.52, color: '#38BDF8', accent: '#E0F2FE', height: 0.54, ringSize: 0.3 },
    { label: 'STAIRS', x: 0.42, z: 0.56, color: '#38BDF8', accent: '#E0F2FE', height: 0.48, ringSize: 0.28 },
  ];

  for (const obj of objectives) {
    const y = evaluateTerrainHeight('CS2', obj.x, obj.z);
    const pin = createObjectiveBeamPin(obj.label, obj.x, y, obj.z, obj.color, obj.accent, {
      height: obj.height,
      ringSize: obj.ringSize,
    });
    reg.track(pin.beamMaterial);
    reg.track(pin.ringMaterial);
    group.add(pin.group);
  }

  // Pro Mirage A-Site smoke execute curved trajectory ribbons (T-Ramp -> Stairs & CT Ticket) + Pop-Flash arc
  const smokeStairs = createPulsingTrajectoryRibbon(
    [
      new THREE.Vector3(-0.92, evaluateTerrainHeight('CS2', -0.92, -0.22) + 0.06, -0.22),
      new THREE.Vector3(-0.24, 0.94, 0.22),
      new THREE.Vector3(0.42, evaluateTerrainHeight('CS2', 0.42, 0.56) + 0.06, 0.56),
    ],
    '#38BDF8',
    '#E0F2FE',
    { radius: 0.015, speed: 0.46 }
  );
  reg.track(smokeStairs.material);
  group.add(smokeStairs.mesh);

  const smokeTicket = createPulsingTrajectoryRibbon(
    [
      new THREE.Vector3(-0.86, evaluateTerrainHeight('CS2', -0.86, -0.34) + 0.06, -0.34),
      new THREE.Vector3(0.02, 1.02, -0.52),
      new THREE.Vector3(0.84, evaluateTerrainHeight('CS2', 0.84, -0.52) + 0.06, -0.52),
    ],
    '#38BDF8',
    '#FDBA74',
    { radius: 0.015, speed: 0.46, phaseOffset: 0.32 }
  );
  reg.track(smokeTicket.material);
  group.add(smokeTicket.mesh);

  const entryFlash = createPulsingTrajectoryRibbon(
    [
      new THREE.Vector3(-0.88, evaluateTerrainHeight('CS2', -0.88, 0.48) + 0.06, 0.48),
      new THREE.Vector3(-0.46, 0.68, 0.18),
      new THREE.Vector3(-0.04, evaluateTerrainHeight('CS2', -0.04, -0.1) + 0.08, -0.1),
    ],
    '#DE6B24',
    '#FEF08A',
    { radius: 0.012, speed: 0.56, phaseOffset: 0.65 }
  );
  reg.track(entryFlash.material);
  group.add(entryFlash.mesh);

  return {
    group,
    update: (elapsed: number) => {
      reg.updateAll(elapsed);
    },
  };
}

/**
 * 4. GTA — 256x256 Custom GLSL Vice City / Diamond Casino Neon Topographic Hologram (`#EC4899` + `#06B6D4`)
 *    + Casino & Extraction Light-Beam Pins + Floating Orbital Target Rings + Pulsing Getaway Loop Ribbon
 */
function buildGtaHeistCityWorld(): HologramWorldHandle {
  const group = new THREE.Group();
  const reg = createShaderRegistry();
  const cfg = HOLOGRAM_TERRAIN_CONFIGS.GTA;

  const terrain = createHologramTerrainMesh(cfg);
  reg.track(terrain.material);
  group.add(terrain.mesh);

  // Diamond Casino & Heist Extraction vertical holographic light-beam pins
  const casinoY = evaluateTerrainHeight('GTA', 0.02, -0.04);
  const casinoPin = createObjectiveBeamPin('CASINO', 0.02, casinoY, -0.04, '#EC4899', '#FBCFE8', {
    height: 0.82,
    ringSize: 0.5,
  });
  reg.track(casinoPin.beamMaterial);
  reg.track(casinoPin.ringMaterial);
  group.add(casinoPin.group);

  const escapeY = evaluateTerrainHeight('GTA', 0.84, 0.34);
  const escapePin = createObjectiveBeamPin('ESCAPE', 0.84, escapeY, 0.34, '#06B6D4', '#CFFAFE', {
    height: 0.54,
    ringSize: 0.32,
  });
  reg.track(escapePin.beamMaterial);
  reg.track(escapePin.ringMaterial);
  group.add(escapePin.group);

  const hillsY = evaluateTerrainHeight('GTA', -0.78, -0.58);
  const hillsPin = createObjectiveBeamPin('VINEWOOD', -0.78, hillsY, -0.58, '#EC4899', '#06B6D4', {
    height: 0.48,
    ringSize: 0.28,
  });
  reg.track(hillsPin.beamMaterial);
  reg.track(hillsPin.ringMaterial);
  group.add(hillsPin.group);

  // Floating dual angled holographic orbital rings hovering around the Casino vault pin
  const orbitRingA = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.011, 8, 48),
    new THREE.MeshBasicMaterial({
      color: 0xec4899,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  orbitRingA.position.set(0.02, casinoY + 0.34, -0.04);
  orbitRingA.rotation.x = Math.PI / 2.25;
  group.add(orbitRingA);

  const orbitRingB = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.01, 8, 44),
    new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  orbitRingB.position.set(0.02, casinoY + 0.48, -0.04);
  orbitRingB.rotation.x = Math.PI / 1.82;
  group.add(orbitRingB);

  // Closed neon getaway expressway loop ribbon with glowing high-speed pulse
  const loopPts = [
    new THREE.Vector3(-0.04, 0.14, 0.58),
    new THREE.Vector3(-0.68, 0.2, 0.32),
    new THREE.Vector3(-0.68, 0.24, -0.36),
    new THREE.Vector3(0.06, 0.26, -0.66),
    new THREE.Vector3(0.76, 0.2, -0.22),
    new THREE.Vector3(0.84, evaluateTerrainHeight('GTA', 0.84, 0.34) + 0.06, 0.34),
  ];
  const getawayLoop = createPulsingTrajectoryRibbon(loopPts, '#06B6D4', '#F472B6', {
    radius: 0.016,
    speed: 0.34,
    closed: true,
  });
  reg.track(getawayLoop.material);
  group.add(getawayLoop.mesh);

  // Elevated chopper extraction arc from Casino rooftop -> Escape drop-off
  const heliArc = createPulsingTrajectoryRibbon(
    [
      new THREE.Vector3(0.02, casinoY + 0.16, -0.04),
      new THREE.Vector3(0.46, 0.84, 0.12),
      new THREE.Vector3(0.84, escapeY + 0.08, 0.34),
    ],
    '#EC4899',
    '#FEF08A',
    { radius: 0.013, speed: 0.44, phaseOffset: 0.4 }
  );
  reg.track(heliArc.material);
  group.add(heliArc.mesh);

  return {
    group,
    update: (elapsed: number) => {
      reg.updateAll(elapsed);
      orbitRingA.rotation.z = elapsed * 0.65;
      orbitRingB.rotation.z = -elapsed * 0.95;
    },
  };
}

/**
 * 5. RDR2 — 256x256 Custom GLSL Valentine Canyon & Red-Rock Mesa Contour Shader (`#B91C1C` + `#D97706`)
 *    + Valentine / Canyon Rim Light-Beam Pins + Dead-Eye Target Reticle + Ambush Flank Trajectory Ribbons
 */
function buildRdr2FrontierWorld(): HologramWorldHandle {
  const group = new THREE.Group();
  const reg = createShaderRegistry();
  const cfg = HOLOGRAM_TERRAIN_CONFIGS.RDR2;

  const terrain = createHologramTerrainMesh(cfg);
  reg.track(terrain.material);
  group.add(terrain.mesh);

  // Valentine Frontier & Canyon Rim vertical holographic light-beam pins
  const valY = evaluateTerrainHeight('RDR2', 0.02, -0.02);
  const valentinePin = createObjectiveBeamPin('VALENTINE', 0.02, valY, -0.02, '#B91C1C', '#F5E6C8', {
    height: 0.74,
    ringSize: 0.46,
  });
  reg.track(valentinePin.beamMaterial);
  reg.track(valentinePin.ringMaterial);
  group.add(valentinePin.group);

  const westMesaY = evaluateTerrainHeight('RDR2', -0.82, 0.24);
  const westPin = createObjectiveBeamPin('CANYON RIM', -0.82, westMesaY, 0.24, '#D97706', '#FDE68A', {
    height: 0.5,
    ringSize: 0.3,
  });
  reg.track(westPin.beamMaterial);
  reg.track(westPin.ringMaterial);
  group.add(westPin.group);

  const eastMesaY = evaluateTerrainHeight('RDR2', 0.84, -0.34);
  const eastPin = createObjectiveBeamPin('DEAD-EYE', 0.84, eastMesaY, -0.34, '#B91C1C', '#FDE68A', {
    height: 0.54,
    ringSize: 0.3,
  });
  reg.track(eastPin.beamMaterial);
  reg.track(eastPin.ringMaterial);
  group.add(eastPin.group);

  // Floating Dead-Eye crimson holographic halo ring hovering above Valentine
  const deadEyeHalo = createTacticalTargetRing(0.62, '#B91C1C', '#F5E6C8');
  deadEyeHalo.mesh.position.set(0.02, valY + 0.48, -0.02);
  reg.track(deadEyeHalo.material);
  group.add(deadEyeHalo.mesh);

  // Outlaw canyon flank & Dead-Eye sightline curved trajectory ribbons
  const flankRibbon = createPulsingTrajectoryRibbon(
    [
      new THREE.Vector3(-0.82, westMesaY + 0.05, 0.24),
      new THREE.Vector3(-0.36, 0.64, 0.08),
      new THREE.Vector3(0.02, valY + 0.08, -0.02),
    ],
    '#D97706',
    '#F5E6C8',
    { radius: 0.014, speed: 0.35 }
  );
  reg.track(flankRibbon.material);
  group.add(flankRibbon.mesh);

  const sightlineRibbon = createPulsingTrajectoryRibbon(
    [
      new THREE.Vector3(0.84, eastMesaY + 0.05, -0.34),
      new THREE.Vector3(0.42, 0.56, -0.18),
      new THREE.Vector3(0.02, valY + 0.08, -0.02),
    ],
    '#B91C1C',
    '#FDE68A',
    { radius: 0.014, speed: 0.42, phaseOffset: 0.48 }
  );
  reg.track(sightlineRibbon.material);
  group.add(sightlineRibbon.mesh);

  return {
    group,
    update: (elapsed: number) => {
      reg.updateAll(elapsed);
      deadEyeHalo.mesh.position.y = valY + 0.48 + Math.sin(elapsed * 2.0) * 0.04;
    },
  };
}

/**
 * 6. APEX — 256x256 Custom GLSL World's Edge Volcanic Caldera & Magma Fissure Shader (`#DA292A` + `#F3F4F6`)
 *    + Harvester & Fragment Light-Beam Pins + Custom Ring-3 Energy Wall Curtain + Dropship Flight Ribbons
 */
function buildApexRingWorld(): HologramWorldHandle {
  const group = new THREE.Group();
  const reg = createShaderRegistry();
  const cfg = HOLOGRAM_TERRAIN_CONFIGS.APEX;

  const terrain = createHologramTerrainMesh(cfg);
  reg.track(terrain.material);
  group.add(terrain.mesh);

  // Harvester & Fragment East objective vertical light-beam pins
  const harvY = evaluateTerrainHeight('APEX', 0.06, -0.06);
  const harvesterPin = createObjectiveBeamPin('HARVESTER', 0.06, harvY, -0.06, '#DA292A', '#F3F4F6', {
    height: 0.84,
    ringSize: 0.46,
  });
  reg.track(harvesterPin.beamMaterial);
  reg.track(harvesterPin.ringMaterial);
  group.add(harvesterPin.group);

  const fragY = evaluateTerrainHeight('APEX', -0.74, -0.34);
  const fragmentPin = createObjectiveBeamPin('FRAGMENT', -0.74, fragY, -0.34, '#F3F4F6', '#DA292A', {
    height: 0.52,
    ringSize: 0.3,
  });
  reg.track(fragmentPin.beamMaterial);
  reg.track(fragmentPin.ringMaterial);
  group.add(fragmentPin.group);

  const thermalY = evaluateTerrainHeight('APEX', 0.72, 0.38);
  const thermalPin = createObjectiveBeamPin('RING 3', 0.72, thermalY, 0.38, '#DA292A', '#F3F4F6', {
    height: 0.5,
    ringSize: 0.3,
  });
  reg.track(thermalPin.beamMaterial);
  reg.track(thermalPin.ringMaterial);
  group.add(thermalPin.group);

  // Custom curved Apex Ring-3 glowing energy curtain (zero CylinderGeometry)
  const ring3Curtain = createEnergyCurtainRibbon(0.96, 0.66, '#DA292A', 64);
  ring3Curtain.group.position.y = 0.08;
  reg.track(ring3Curtain.material);
  group.add(ring3Curtain.group);

  // High-altitude dropship trajectory ribbon + Valkyrie jump-tower redeploy arc
  const dropshipRibbon = createPulsingTrajectoryRibbon(
    [
      new THREE.Vector3(-1.32, 0.92, 0.52),
      new THREE.Vector3(0.06, 1.0, -0.06),
      new THREE.Vector3(1.32, 0.92, -0.56),
    ],
    '#F3F4F6',
    '#DA292A',
    { radius: 0.014, speed: 0.34 }
  );
  reg.track(dropshipRibbon.material);
  group.add(dropshipRibbon.mesh);

  const redeployRibbon = createPulsingTrajectoryRibbon(
    [
      new THREE.Vector3(-0.74, fragY + 0.05, -0.34),
      new THREE.Vector3(-0.34, 0.78, -0.2),
      new THREE.Vector3(0.06, harvY + 0.08, -0.06),
    ],
    '#DA292A',
    '#FEF2F2',
    { radius: 0.014, speed: 0.48, phaseOffset: 0.5 }
  );
  reg.track(redeployRibbon.material);
  group.add(redeployRibbon.mesh);

  return {
    group,
    update: (elapsed: number) => {
      reg.updateAll(elapsed);
      const pulse = 0.93 + Math.sin(elapsed * 1.65) * 0.05;
      ring3Curtain.group.scale.set(pulse, 1, pulse);
    },
  };
}

export function buildTournamentHologramWorld(gameId: Hologram3DGameId): HologramWorldHandle {
  switch (gameId) {
    case 'FC27':
      return buildFc27PitchWorld();
    case 'WARZONE':
      return buildWarzoneTerrainWorld();
    case 'CS2':
      return buildCs2MirageWorld();
    case 'GTA':
      return buildGtaHeistCityWorld();
    case 'RDR2':
      return buildRdr2FrontierWorld();
    case 'APEX':
      return buildApexRingWorld();
  }
}
