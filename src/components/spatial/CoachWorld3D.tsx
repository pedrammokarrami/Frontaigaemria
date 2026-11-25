import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import type { CoachWorldTheme } from '../../agents/motionCoachAgent';

interface CoachWorld3DProps {
  worldTheme: CoachWorldTheme;
  accentHex?: string;
}

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createWetSurfaceTextures(
  variant: 'pitch' | 'concrete' | 'asphalt',
  maxAnisotropy: number
): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rctx = roughCanvas.getContext('2d')!;

  if (variant === 'pitch') {
    // Mowed wet stadium turf stripes (vivid night floodlit emerald)
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#114d2c' : '#17663a';
      ctx.fillRect(0, (i * size) / 8, size, size / 8);
    }
    // Fine rain-sheen grass grain
    for (let i = 0; i < 3200; i++) {
      const x = (i * 73) % size;
      const y = (i * 197) % size;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(52,211,153,0.12)' : 'rgba(4,20,12,0.15)';
      ctx.fillRect(x, y, 2, 6);
    }
    // Crisp stadium turf markings
    ctx.strokeStyle = 'rgba(220,255,235,0.62)';
    ctx.lineWidth = 5;
    ctx.strokeRect(18, 18, size - 36, size - 36);
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    // Puddle reflection variation in roughness map (darker = glossier wet puddles)
    rctx.fillStyle = '#888888';
    rctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 24; i++) {
      const px = ((i * 137) % size);
      const py = ((i * 223) % size);
      const rad = 28 + (i % 5) * 18;
      const g = rctx.createRadialGradient(px, py, 2, px, py, rad);
      g.addColorStop(0, '#181818');
      g.addColorStop(1, 'rgba(136,136,136,0)');
      rctx.fillStyle = g;
      rctx.beginPath();
      rctx.arc(px, py, rad, 0, Math.PI * 2);
      rctx.fill();
    }
  } else if (variant === 'concrete') {
    // Mirage / tactical compound sandstone & wet concrete slabs
    ctx.fillStyle = '#222026';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255,196,120,0.08)';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      const pos = (i * size) / 4;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
    }
    for (let i = 0; i < 2600; i++) {
      const x = (i * 89) % size;
      const y = (i * 163) % size;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(249,115,22,0.06)' : 'rgba(255,255,255,0.03)';
      ctx.fillRect(x, y, 3, 3);
    }

    rctx.fillStyle = '#999999';
    rctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 20; i++) {
      const px = (i * 151) % size;
      const py = (i * 211) % size;
      const rad = 36 + (i % 4) * 20;
      const g = rctx.createRadialGradient(px, py, 4, px, py, rad);
      g.addColorStop(0, '#1b1b1b');
      g.addColorStop(1, 'rgba(153,153,153,0)');
      rctx.fillStyle = g;
      rctx.beginPath();
      rctx.arc(px, py, rad, 0, Math.PI * 2);
      rctx.fill();
    }
  } else {
    // Rainy neon noir street / night circuit asphalt
    ctx.fillStyle = '#0e111b';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 3600; i++) {
      const x = (i * 61) % size;
      const y = (i * 149) % size;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(34,211,238,0.05)' : 'rgba(236,72,153,0.04)';
      ctx.fillRect(x, y, 2, 2);
    }
    // Glowing dashed center lane
    ctx.fillStyle = 'rgba(34,211,238,0.45)';
    for (let y = 16; y < size; y += 64) {
      ctx.fillRect(size / 2 - 4, y, 8, 34);
    }
    ctx.fillStyle = 'rgba(236,72,153,0.38)';
    ctx.fillRect(28, 0, 5, size);
    ctx.fillRect(size - 33, 0, 5, size);

    rctx.fillStyle = '#555555';
    rctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 26; i++) {
      const px = (i * 127) % size;
      const py = (i * 193) % size;
      const rad = 34 + (i % 5) * 18;
      const g = rctx.createRadialGradient(px, py, 2, px, py, rad);
      g.addColorStop(0, '#0f0f0f');
      g.addColorStop(1, 'rgba(85,85,85,0)');
      rctx.fillStyle = g;
      rctx.beginPath();
      rctx.arc(px, py, rad, 0, Math.PI * 2);
      rctx.fill();
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(6, 6);
  map.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(6, 6);
  roughnessMap.anisotropy = maxAnisotropy;

  return { map, roughnessMap };
}

function createSportsStadiumWorld(maxAnisotropy: number): {
  group: THREE.Group;
  pulseMat: THREE.MeshBasicMaterial;
} {
  const group = new THREE.Group();
  const { map, roughnessMap } = createWetSurfaceTextures('pitch', maxAnisotropy);

  // Rain-slicked reflective turf floor (vivid wet specular puddles)
  const pitchMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map,
    roughnessMap,
    roughness: 0.28,
    metalness: 0.36,
    envMapIntensity: 1.45,
  });
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), pitchMat);
  pitch.rotation.x = -Math.PI / 2;
  group.add(pitch);

  // Glowing AR pitch lines & center circle (offset +0.03 Y to avoid Z-fighting)
  const pulseMat = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    transparent: true,
    opacity: 0.68,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const centerRing = new THREE.Mesh(new THREE.RingGeometry(4.55, 4.86, 48), pulseMat);
  centerRing.rotation.x = -Math.PI / 2;
  centerRing.position.set(0, 0.03, -6);
  group.add(centerRing);

  const lineGeo = new THREE.PlaneGeometry(36, 0.16);
  for (const z of [-18, -6, 6]) {
    const line = new THREE.Mesh(lineGeo, pulseMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.03, z);
    group.add(line);
  }

  // Stadium curved grandstands horizon silhouette (composite 3-tier bowl segments)
  const standMat = new THREE.MeshStandardMaterial({
    color: 0x0d1b2e,
    roughness: 0.64,
    metalness: 0.4,
  });
  const rimEmissiveMat = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    transparent: true,
    opacity: 0.72,
  });
  for (let i = 0; i < 6; i++) {
    const angle = -Math.PI * 0.78 + (i / 5) * Math.PI * 0.56;
    const dist = 29;
    const bay = new THREE.Group();
    const baseTier = new THREE.Mesh(new THREE.BoxGeometry(11.5, 4.2, 4.2), standMat);
    baseTier.position.y = 2.1;
    const upperTier = new THREE.Mesh(new THREE.BoxGeometry(11.5, 4.6, 3.2), standMat);
    upperTier.position.set(0, 6.2, -1.1);
    const roofCanopy = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.45, 5.2), standMat);
    roofCanopy.position.set(0, 9.2, 0.2);
    const ledRibbon = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.3, 0.22), rimEmissiveMat);
    ledRibbon.position.set(0, 4.2, 2.15);
    bay.add(baseTier, upperTier, roofCanopy, ledRibbon);
    bay.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist - 4);
    bay.lookAt(0, 2, -4);
    group.add(bay);
  }

  // 4 Composite Stadium Floodlight Towers + Vivid Volumetric Light Cones
  const mastMat = new THREE.MeshStandardMaterial({
    color: 0x263449,
    roughness: 0.4,
    metalness: 0.75,
  });
  const lampHeadMat = new THREE.MeshBasicMaterial({ color: 0xf4fff9 });
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0x6ee7b7,
    transparent: true,
    opacity: 0.21,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const coreConeMat = new THREE.MeshBasicMaterial({
    color: 0xd1fae5,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const towerPositions: Array<[number, number]> = [
    [-14.5, -20],
    [14.5, -20],
    [-20, -7],
    [20, -7],
  ];
  for (const [tx, tz] of towerPositions) {
    const tower = new THREE.Group();
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.05, 1.4, 8), mastMat);
    plinth.position.y = 0.7;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.45, 16.5, 8), mastMat);
    mast.position.y = 9.0;
    const crossArm = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.48, 0.65), mastMat);
    crossArm.position.y = 17.2;
    const lampBank = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.4, 0.35), lampHeadMat);
    lampBank.position.set(0, 17.2, 0.35);
    const shaft = new THREE.Mesh(new THREE.ConeGeometry(7.2, 23, 18, 1, true), coneMat);
    shaft.position.set(0, 7.2, 5.2);
    shaft.rotation.x = -0.45;
    const innerShaft = new THREE.Mesh(new THREE.ConeGeometry(3.6, 22, 16, 1, true), coreConeMat);
    innerShaft.position.set(0, 7.5, 5.0);
    innerShaft.rotation.x = -0.45;
    tower.add(plinth, mast, crossArm, lampBank, shaft, innerShaft);
    tower.position.set(tx, 0, tz);
    tower.lookAt(0, 0, -4);
    group.add(tower);
  }

  return { group, pulseMat };
}

function createShooterCompoundWorld(maxAnisotropy: number): {
  group: THREE.Group;
  laserMat: THREE.MeshBasicMaterial;
  smokeGroup: THREE.Group;
} {
  const group = new THREE.Group();
  const { map, roughnessMap } = createWetSurfaceTextures('concrete', maxAnisotropy);

  // Wet concrete courtyard floor
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map,
    roughnessMap,
    roughness: 0.48,
    metalness: 0.32,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat);
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  // Mirage / tactical compound multi-part sandstone walls, archway & cover crates
  const sandstoneMat = new THREE.MeshStandardMaterial({
    color: 0x4b3d33,
    roughness: 0.82,
    metalness: 0.08,
  });
  const metalTrimMat = new THREE.MeshStandardMaterial({
    color: 0x263241,
    roughness: 0.35,
    metalness: 0.72,
  });

  // Mid Connector Archway (solid left/right jambs + lintel + parapet trim)
  const archGroup = new THREE.Group();
  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(3.4, 7.5, 3.0), sandstoneMat);
  leftPillar.position.set(-4.8, 3.75, -16);
  const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(3.4, 7.5, 3.0), sandstoneMat);
  rightPillar.position.set(4.8, 3.75, -16);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(13.2, 2.2, 3.2), sandstoneMat);
  lintel.position.set(0, 8.1, -16);
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.45, 3.5), metalTrimMat);
  parapet.position.set(0, 9.4, -16);
  archGroup.add(leftPillar, rightPillar, lintel, parapet);
  group.add(archGroup);

  // Tactical stacked cover boxes (3-part composite with metallic corner rails)
  const coverPositions: Array<[number, number, number]> = [
    [-6.2, -7.5, 0.2],
    [6.5, -9.2, -0.35],
    [-11.5, -14.0, 0.1],
    [11.0, -14.5, -0.15],
  ];
  for (const [cx, cz, rot] of coverPositions) {
    const crate = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.1, 2.5), sandstoneMat);
    body.position.y = 1.05;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.22, 2.65), metalTrimMat);
    cap.position.y = 2.18;
    const band = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.18, 2.58), metalTrimMat);
    band.position.y = 0.45;
    crate.add(body, cap, band);
    crate.position.set(cx, 0, cz);
    crate.rotation.y = rot;
    group.add(crate);
  }

  // Crisp cyan & crimson laser sightlines slicing across mid
  const laserMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const enemyLaserMat = new THREE.MeshBasicMaterial({
    color: 0xf43f5e,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const cyanBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 24, 8), laserMat);
  cyanBeam.rotation.z = Math.PI / 2;
  cyanBeam.rotation.y = 0.48;
  cyanBeam.position.set(-1.5, 1.8, -10.5);
  group.add(cyanBeam);

  const redBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 22, 8), enemyLaserMat);
  redBeam.rotation.z = Math.PI / 2;
  redBeam.rotation.y = -0.52;
  redBeam.position.set(2.2, 2.1, -12.2);
  group.add(redBeam);

  // Volumetric dusk god-rays
  const rayMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  for (let i = 0; i < 3; i++) {
    const ray = new THREE.Mesh(new THREE.ConeGeometry(4.5, 18, 16, 1, true), rayMat);
    ray.position.set(-5 + i * 5.2, 7.5, -13);
    ray.rotation.z = -0.22;
    group.add(ray);
  }

  // Drifting volumetric tactical smoke puffs
  const smokeGroup = new THREE.Group();
  const smokeMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });
  for (let i = 0; i < 7; i++) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8 + (i % 3) * 0.7, 1), smokeMat);
    puff.position.set(-7 + i * 2.4, 1.5 + (i % 2) * 1.1, -12 - (i % 3) * 2.2);
    smokeGroup.add(puff);
  }
  group.add(smokeGroup);

  return { group, laserMat, smokeGroup };
}

function createActionNeonWorld(maxAnisotropy: number): {
  group: THREE.Group;
  neonMat: THREE.MeshBasicMaterial;
} {
  const group = new THREE.Group();
  const { map, roughnessMap } = createWetSurfaceTextures('asphalt', maxAnisotropy);

  // Rainy reflective asphalt street / night circuit
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map,
    roughnessMap,
    roughness: 0.26,
    metalness: 0.55,
  });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), roadMat);
  road.rotation.x = -Math.PI / 2;
  group.add(road);

  const buildingMat = new THREE.MeshStandardMaterial({
    color: 0x0b1020,
    roughness: 0.55,
    metalness: 0.45,
  });
  const neonMat = new THREE.MeshBasicMaterial({
    color: 0xec4899,
    transparent: true,
    opacity: 0.82,
  });
  const cyanNeonMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.78,
  });

  // Composite noir/neon skyscrapers flanking the avenue (3-part: tower + rooftop deck + vertical neon strip)
  const buildingSpecs: Array<[number, number, number, boolean]> = [
    [-11.5, -16, 15, true],
    [11.5, -17, 17, false],
    [-14.5, -27, 22, false],
    [14.0, -28, 20, true],
    [-9.5, -7, 11, false],
    [9.8, -8, 12, true],
  ];
  for (const [bx, bz, bh, usePink] of buildingSpecs) {
    const bldg = new THREE.Group();
    const core = new THREE.Mesh(new THREE.BoxGeometry(5.6, bh, 5.6), buildingMat);
    core.position.y = bh / 2;
    const crown = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.65, 6.0), buildingMat);
    crown.position.y = bh + 0.3;
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, bh * 0.84, 0.24),
      usePink ? neonMat : cyanNeonMat
    );
    strip.position.set(bx < 0 ? 2.85 : -2.85, bh * 0.5, 2.85);
    const signBar = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.32, 0.22),
      usePink ? cyanNeonMat : neonMat
    );
    signBar.position.set(0, bh * 0.65, 2.88);
    bldg.add(core, crown, strip, signBar);
    bldg.position.set(bx, 0, bz);
    group.add(bldg);
  }

  // Streetlamp arches casting neon pools
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.35,
    metalness: 0.85,
  });
  for (let i = 0; i < 3; i++) {
    const z = -6 - i * 8;
    for (const side of [-1, 1]) {
      const lamp = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6.4, 8), poleMat);
      post.position.y = 3.2;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.12), poleMat);
      arm.position.set(-side * 0.85, 6.35, 0);
      const bulb = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.14, 0.22),
        side < 0 ? cyanNeonMat : neonMat
      );
      bulb.position.set(-side * 1.4, 6.26, 0);
      lamp.add(post, arm, bulb);
      lamp.position.set(side * 6.2, 0, z);
      group.add(lamp);
    }
  }

  return { group, neonMat };
}

const THEME_PALETTES: Record<
  CoachWorldTheme,
  {
    bgHex: number;
    fogDensity: number;
    keyHex: number;
    fillSkyHex: number;
    fillGroundHex: number;
    rimLeftHex: number;
    rimRightHex: number;
    rainHex: number;
  }
> = {
  sports: {
    bgHex: 0x050e0c,
    fogDensity: 0.032,
    keyHex: 0xd9fff0,
    fillSkyHex: 0x10b981,
    fillGroundHex: 0x051a10,
    rimLeftHex: 0x22c55e,
    rimRightHex: 0x38bdf8,
    rainHex: 0xa7f3d0,
  },
  shooter: {
    bgHex: 0x140d0a,
    fogDensity: 0.036,
    keyHex: 0xffd5a5,
    fillSkyHex: 0x38bdf8,
    fillGroundHex: 0x26150d,
    rimLeftHex: 0x22d3ee,
    rimRightHex: 0xf97316,
    rainHex: 0xfdba74,
  },
  strategy: {
    bgHex: 0x0a0a16,
    fogDensity: 0.034,
    keyHex: 0xffe4b5,
    fillSkyHex: 0x38bdf8,
    fillGroundHex: 0x141022,
    rimLeftHex: 0x22d3ee,
    rimRightHex: 0xf59e0b,
    rainHex: 0x7dd3fc,
  },
  action: {
    bgHex: 0x0c0614,
    fogDensity: 0.032,
    keyHex: 0xf5d0fe,
    fillSkyHex: 0x22d3ee,
    fillGroundHex: 0x1b071c,
    rimLeftHex: 0x22d3ee,
    rimRightHex: 0xec4899,
    rainHex: 0xf472b6,
  },
};

export const CoachWorld3D: React.FC<CoachWorld3DProps> = ({
  worldTheme,
  accentHex = '#22C55E',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const themeRef = useRef<CoachWorldTheme>(worldTheme);
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    themeRef.current = worldTheme;
  }, [worldTheme]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const initPal = THEME_PALETTES[themeRef.current];
    const bgColor = new THREE.Color(initPal.bgHex);
    const targetBgColor = new THREE.Color(initPal.bgHex);
    scene.background = bgColor;
    const fog = new THREE.FogExp2(initPal.bgHex, initPal.fogDensity);
    scene.fog = fog;

    const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 120);
    camera.position.set(0, 3.4, 8.6);
    camera.lookAt(0, 1.8, -12);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    // Mandatory studio environment map for wet PBR reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    // Warm/cool 3-point lighting rig (brightened stadium depth & wet reflections)
    const hemiLight = new THREE.HemisphereLight(initPal.fillSkyHex, initPal.fillGroundHex, 1.28);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(initPal.keyHex, 1.85);
    keyLight.position.set(6, 15, 7);
    scene.add(keyLight);

    const rimLeft = new THREE.PointLight(initPal.rimLeftHex, 36, 42, 1.35);
    rimLeft.position.set(-9, 6.2, -5);
    scene.add(rimLeft);

    const rimRight = new THREE.PointLight(initPal.rimRightHex, 36, 42, 1.35);
    rimRight.position.set(9, 6.2, -5);
    scene.add(rimRight);

    // Subtle calibrated UnrealBloomPass on real GPUs (threshold 0.92, strength 0.22)
    let composer: EffectComposer | null = null;
    if (!isSoftwareGl) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.22,
        0.42,
        0.92
      );
      composer.addPass(bloomPass);
    }

    // Build all 3 game-adaptive 3D world assemblies once (zero GC on game switch)
    const sportsWorld = createSportsStadiumWorld(maxAnisotropy);
    const shooterWorld = createShooterCompoundWorld(maxAnisotropy);
    const actionWorld = createActionNeonWorld(maxAnisotropy);
    scene.add(sportsWorld.group, shooterWorld.group, actionWorld.group);

    // Rain / Neon Dust Particle System (single Points draw call)
    const particleCount = 420;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 32;
      positions[i * 3 + 1] = Math.random() * 14;
      positions[i * 3 + 2] = -Math.random() * 26 + 4;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: initPal.rainHex,
      size: 0.11,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const rainPoints = new THREE.Points(rainGeo, rainMat);
    scene.add(rainPoints);

    // Crisp Diagonal Falling 3D Rain Streaks catching stadium floodlights
    const streakCount = 160;
    const streakPositions = new Float32Array(streakCount * 6);
    for (let i = 0; i < streakCount; i++) {
      const sx = (Math.random() - 0.5) * 26;
      const sy = Math.random() * 14;
      const sz = -Math.random() * 22 + 4;
      const len = 0.65 + (i % 4) * 0.22;
      streakPositions[i * 6] = sx;
      streakPositions[i * 6 + 1] = sy;
      streakPositions[i * 6 + 2] = sz;
      streakPositions[i * 6 + 3] = sx - 0.08;
      streakPositions[i * 6 + 4] = sy - len;
      streakPositions[i * 6 + 5] = sz;
    }
    const streakGeo = new THREE.BufferGeometry();
    streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3));
    const streakMat = new THREE.LineBasicMaterial({
      color: initPal.rainHex,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const rainStreaks = new THREE.LineSegments(streakGeo, streakMat);
    scene.add(rainStreaks);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const onPointerMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointerRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer?.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Scratch colors (zero GC inside animation loop)
    const _keyTarget = new THREE.Color();
    const _skyTarget = new THREE.Color();
    const _rimLTarget = new THREE.Color();
    const _rimRTarget = new THREE.Color();
    const _rainTarget = new THREE.Color();
    const clock = new THREE.Clock();

    let disposed = false;
    let frameId = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 90);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 85);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const dt = Math.min(0.08, clock.getDelta());
      const elapsed = clock.getElapsedTime();
      const activeTheme = themeRef.current;
      const pal = THEME_PALETTES[activeTheme];
      const lerpAlpha = 1 - Math.exp(-4.5 * dt);

      // Toggle world assembly visibility cleanly
      sportsWorld.group.visible = activeTheme === 'sports';
      shooterWorld.group.visible = activeTheme === 'shooter';
      actionWorld.group.visible = activeTheme === 'action' || activeTheme === 'strategy';

      // Smoothly damp lighting, fog, and atmosphere palette
      targetBgColor.setHex(pal.bgHex);
      bgColor.lerp(targetBgColor, lerpAlpha);
      fog.color.copy(bgColor);
      fog.density = THREE.MathUtils.damp(fog.density, pal.fogDensity, 4, dt);

      _keyTarget.setHex(pal.keyHex);
      _skyTarget.setHex(pal.fillSkyHex);
      _rimLTarget.setHex(pal.rimLeftHex);
      _rimRTarget.setHex(pal.rimRightHex);
      _rainTarget.setHex(pal.rainHex);

      keyLight.color.lerp(_keyTarget, lerpAlpha);
      hemiLight.color.lerp(_skyTarget, lerpAlpha);
      rimLeft.color.lerp(_rimLTarget, lerpAlpha);
      rimRight.color.lerp(_rimRTarget, lerpAlpha);
      rainMat.color.lerp(_rainTarget, lerpAlpha);

      // World-specific subtle animations
      if (sportsWorld.group.visible) {
        sportsWorld.pulseMat.opacity = 0.38 + Math.sin(elapsed * 2.4) * 0.16;
      } else if (shooterWorld.group.visible) {
        shooterWorld.laserMat.opacity = 0.55 + Math.sin(elapsed * 3.8) * 0.2;
        shooterWorld.smokeGroup.children.forEach((child, idx) => {
          child.position.x += Math.sin(elapsed * 0.4 + idx) * dt * 0.18;
          child.rotation.y += dt * 0.12;
        });
      } else {
        actionWorld.neonMat.opacity = 0.68 + Math.sin(elapsed * 2.9) * 0.18;
      }

      // Falling rain / drifting embers + vivid falling 3D rain streaks
      const posAttr = rainGeo.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const fallSpeed = activeTheme === 'shooter' ? 1.1 : 6.8;
      for (let i = 0; i < particleCount; i++) {
        let y = arr[i * 3 + 1] - fallSpeed * dt;
        if (y < 0.1) y = 13.5;
        arr[i * 3 + 1] = y;
      }
      posAttr.needsUpdate = true;

      streakMat.color.lerp(_rainTarget, lerpAlpha);
      rainStreaks.visible = activeTheme !== 'shooter';
      if (rainStreaks.visible) {
        const sAttr = streakGeo.getAttribute('position') as THREE.BufferAttribute;
        const sArr = sAttr.array as Float32Array;
        const streakFall = 11.5 * dt;
        for (let i = 0; i < streakCount; i++) {
          let y1 = sArr[i * 6 + 1] - streakFall;
          let y2 = sArr[i * 6 + 4] - streakFall;
          if (y1 < 0.2) {
            const len = 0.65 + (i % 4) * 0.22;
            y1 = 13.8;
            y2 = y1 - len;
          }
          sArr[i * 6 + 1] = y1;
          sArr[i * 6 + 4] = y2;
        }
        sAttr.needsUpdate = true;
      }

      // Subtle camera parallax drift
      const targetCamX = pointerRef.current.x * 0.65 + Math.sin(elapsed * 0.35) * 0.45;
      const targetCamY = 3.4 - pointerRef.current.y * 0.25 + Math.cos(elapsed * 0.45) * 0.12;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 3.2, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 3.2, dt);
      camera.lookAt(0, 1.85, -12);

      if (composer && !isSoftwareGl) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      envTex.dispose();
      scene.traverse((obj) => {
        if (
          (obj as THREE.Mesh).isMesh ||
          (obj as THREE.Points).isPoints ||
          (obj as THREE.LineSegments).isLineSegments
        ) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          const mat = m.material;
          if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose());
          else mat?.dispose();
        }
      });
      composer?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      data-testid="coach-world-3d"
      data-world-mode={worldTheme}
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* Isolated empty mount container for WebGL canvas */}
      <div ref={mountRef} className="w-full h-full" />
      {/* Lightened atmospheric radial vignette so UE 5.8 stadium depth, rain streaks & floodlights shine clearly */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 28%, ${accentHex}16 0%, rgba(4,7,14,0.14) 55%, rgba(3,5,10,0.56) 100%)`,
        }}
      />
    </div>
  );
};
