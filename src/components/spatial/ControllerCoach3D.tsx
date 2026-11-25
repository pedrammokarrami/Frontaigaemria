import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { MotionGraphicArchetype } from '../../agents/motionCoachAgent';
import { computeControllerSyncSnapshot } from '../../utils/controllerCoachTiming';
import {
  createArenaSurfacePbrSet,
  createCarbonFiberMaps,
  createDarkStudioHdri,
  createEnergyRibbonShaderMaterial,
  createFresnelBarrierShaderMaterial,
  createFresnelBeamShaderMaterial,
  createSparkTrailSystem,
  type ArenaSurfacePbrSet,
  type CarbonFiberMaps,
  type SparkTrailSystem,
} from './controllerPbrMaterials';
import { createProShooterKbmAssembly } from './proShooterKbmRig';

export interface ControllerCoach3DProps {
  archetype: MotionGraphicArchetype;
  sweetSpotStartPct: number;
  sweetSpotEndPct: number;
  cycleDurationMs: number;
  accentHex?: string;
  onSyncTick?: (state: {
    progressPct: number;
    inSweetSpot: boolean;
    isLateZone: boolean;
    activeButtonLabels: string[];
  }) => void;
}

const DUALSENSE_GLB_URLS = [
  'https://cdn.jsdelivr.net/gh/SafaElmali/dualsense-studio@main/controller/dualsense.glb',
  'https://cdn.jsdelivr.net/gh/Anandb71/dualsense@main/public/models/dualsense.glb',
];

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

function createSymbolTexture(
  symbol: string,
  fgColor: string,
  bgColor = 'rgba(11,17,32,0.88)',
  size = 128
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = fgColor;
  ctx.fillStyle = fgColor;
  ctx.lineWidth = Math.max(4, size * 0.075);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = size / 2;
  const cy = size / 2;

  if (symbol === '△') {
    ctx.beginPath();
    ctx.moveTo(cx, size * 0.22);
    ctx.lineTo(size * 0.78, size * 0.74);
    ctx.lineTo(size * 0.22, size * 0.74);
    ctx.closePath();
    ctx.stroke();
  } else if (symbol === '○') {
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.28, 0, Math.PI * 2);
    ctx.stroke();
  } else if (symbol === '✕') {
    ctx.beginPath();
    ctx.moveTo(size * 0.28, size * 0.28);
    ctx.lineTo(size * 0.72, size * 0.72);
    ctx.moveTo(size * 0.72, size * 0.28);
    ctx.lineTo(size * 0.28, size * 0.72);
    ctx.stroke();
  } else if (symbol === '□') {
    ctx.strokeRect(size * 0.26, size * 0.26, size * 0.48, size * 0.48);
  } else {
    ctx.font = `900 ${symbol.length > 3 ? Math.round(size * 0.24) : Math.round(size * 0.42)}px Inter, ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, cx, cy + 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

type GamepadKey = 'L1' | 'R1' | 'L2' | 'R2' | 'triangle' | 'circle' | 'cross' | 'square';

interface GlowMaterialTarget {
  mats: THREE.MeshStandardMaterial[];
  ringMat: THREE.MeshBasicMaterial;
  ringMesh?: THREE.Object3D;
  localAnchor: THREE.Vector3;
  activeColor: THREE.Color;
}

interface GamepadAssembly {
  root: THREE.Group;
  targets: Partial<Record<GamepadKey, GlowMaterialTarget>>;
  lightbarMats: THREE.MeshStandardMaterial[];
  leftStickPivot: THREE.Object3D | null;
  rightStickPivot: THREE.Object3D | null;
  leftBounceLight: THREE.PointLight;
  rightBounceLight: THREE.PointLight;
}

function createLumenCarbonGlassMaterial(
  carbonMaps: CarbonFiberMaps,
  isSoftwareGl: boolean
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0x26364d,
    metalness: 0.35,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    sheen: 0.4,
    sheenRoughness: 0.35,
    sheenColor: new THREE.Color(0x38bdf8),
    normalMap: carbonMaps.normalMap,
    normalScale: new THREE.Vector2(0.14, 0.14),
    roughnessMap: carbonMaps.roughnessMap,
    transmission: isSoftwareGl ? 0 : 0.18,
    ior: 1.48,
    thickness: 0.45,
    envMapIntensity: 1.65,
  });
}

function createObsidianTrimMaterial(carbonMaps: CarbonFiberMaps): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0x101829,
    metalness: 0.42,
    roughness: 0.26,
    clearcoat: 0.85,
    clearcoatRoughness: 0.14,
    normalMap: carbonMaps.normalMap,
    normalScale: new THREE.Vector2(0.1, 0.1),
    envMapIntensity: 1.2,
  });
}

/**
 * Re-skins the real loaded DualSense `.glb` model with Lumen dark smoked carbon-glass PBR,
 * maps all interactive button meshes (`L1`, `R1`, `L2`, `R2`, `△`, `○`, `✕`, `□`),
 * and mounts localized glowing 3D emissive rings + volumetric shell bounce point lights.
 */
function configureLoadedDualSenseGlb(
  gltfScene: THREE.Group,
  carbonMaps: CarbonFiberMaps,
  isSoftwareGl: boolean
): GamepadAssembly {
  const root = new THREE.Group();
  const modelHolder = new THREE.Group();
  modelHolder.add(gltfScene);

  // Center & normalize GLB into our hero bounding box (~2.86 units wide)
  const rawBox = new THREE.Box3().setFromObject(gltfScene);
  const rawCenter = rawBox.getCenter(new THREE.Vector3());
  const rawSize = rawBox.getSize(new THREE.Vector3());
  gltfScene.position.sub(rawCenter);
  const targetWidth = 2.86;
  const scaleFactor = rawSize.x > 0.01 ? targetWidth / rawSize.x : 0.54;
  modelHolder.scale.setScalar(scaleFactor);
  root.add(modelHolder);
  root.updateMatrixWorld(true);

  const carbonGlassMat = createLumenCarbonGlassMaterial(carbonMaps, isSoftwareGl);
  const obsidianTrimMat = createObsidianTrimMaterial(carbonMaps);
  const satinRubberMat = new THREE.MeshStandardMaterial({
    color: 0x0b1220,
    roughness: 0.72,
    metalness: 0.14,
    envMapIntensity: 0.55,
  });
  const metallicAccentMat = new THREE.MeshPhysicalMaterial({
    color: 0x263549,
    metalness: 0.78,
    roughness: 0.22,
    clearcoat: 0.9,
    envMapIntensity: 1.25,
  });
  const lightbarMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 1.1,
    roughness: 0.15,
    metalness: 0.1,
  });

  const buttonNodeMap: Record<GamepadKey, { meshes: THREE.Mesh[]; colorHex: number; isShoulder: boolean }> = {
    L1: { meshes: [], colorHex: 0x10b981, isShoulder: true },
    R1: { meshes: [], colorHex: 0x38bdf8, isShoulder: true },
    L2: { meshes: [], colorHex: 0xf59e0b, isShoulder: true },
    R2: { meshes: [], colorHex: 0xec4899, isShoulder: true },
    triangle: { meshes: [], colorHex: 0x10b981, isShoulder: false },
    circle: { meshes: [], colorHex: 0xf43f5e, isShoulder: false },
    cross: { meshes: [], colorHex: 0x38bdf8, isShoulder: false },
    square: { meshes: [], colorHex: 0xc084fc, isShoulder: false },
  };

  let leftStickPivot: THREE.Object3D | null = null;
  let rightStickPivot: THREE.Object3D | null = null;

  gltfScene.traverse((obj) => {
    const name = (obj.name || '').toLowerCase();
    if (name.includes('left-stick__head')) leftStickPivot = obj;
    if (name.includes('right-stick__head')) rightStickPivot = obj;

    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;

    // Map interactive button meshes first
    if (name.includes('l1__bumper')) {
      buttonNodeMap.L1.meshes.push(mesh);
      return;
    }
    if (name.includes('r1__bumper')) {
      buttonNodeMap.R1.meshes.push(mesh);
      return;
    }
    if (name.includes('l2__trigger')) {
      buttonNodeMap.L2.meshes.push(mesh);
      return;
    }
    if (name.includes('r2__trigger')) {
      buttonNodeMap.R2.meshes.push(mesh);
      return;
    }
    if (name.includes('triangle__')) {
      buttonNodeMap.triangle.meshes.push(mesh);
      return;
    }
    if (name.includes('circle__')) {
      buttonNodeMap.circle.meshes.push(mesh);
      return;
    }
    if (name.includes('cross__')) {
      buttonNodeMap.cross.meshes.push(mesh);
      return;
    }
    if (name.includes('square__')) {
      buttonNodeMap.square.meshes.push(mesh);
      return;
    }

    // Re-skin DualSense structural parts into Lumen Dark Smoked Carbon-Glass
    if (name.includes('lights__touchpad-surround') || name.includes('lights__player-indicator')) {
      mesh.material = lightbarMat;
    } else if (
      name.includes('white-shell') ||
      name.includes('back-shell') ||
      name.includes('touchpad__surface')
    ) {
      mesh.material = carbonGlassMat;
    } else if (
      name.includes('black-front-shell') ||
      name.includes('stick-well') ||
      name.includes('touchpad__inner') ||
      name.includes('ps-mount') ||
      name.includes('mute-mount')
    ) {
      mesh.material = obsidianTrimMat;
    } else if (name.includes('stick__head')) {
      mesh.material = satinRubberMat;
    } else if (
      name.includes('up__') ||
      name.includes('down__') ||
      name.includes('left__') ||
      name.includes('right__') ||
      name.includes('ps__') ||
      name.includes('options__') ||
      name.includes('create__') ||
      name.includes('mute__')
    ) {
      mesh.material = metallicAccentMat;
    } else {
      mesh.material = obsidianTrimMat;
    }
  });

  const targets: GamepadAssembly['targets'] = {};
  const invRootMatrix = new THREE.Matrix4().copy(root.matrixWorld).invert();

  for (const [key, entry] of Object.entries(buttonNodeMap) as Array<
    [GamepadKey, { meshes: THREE.Mesh[]; colorHex: number; isShoulder: boolean }]
  >) {
    if (entry.meshes.length === 0) continue;

    const btnBox = new THREE.Box3();
    const mats: THREE.MeshStandardMaterial[] = [];

    for (const mesh of entry.meshes) {
      btnBox.expandByObject(mesh);
      const isDecal = mesh.name.toLowerCase().includes('symbol-decal');
      const origMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      const origMap = (origMat as THREE.MeshStandardMaterial | undefined)?.map ?? null;
      const btnMat = new THREE.MeshStandardMaterial({
        color: isDecal ? 0xf8fafc : 0x223045,
        map: isDecal && origMap ? origMap : null,
        emissive: new THREE.Color(entry.colorHex),
        emissiveIntensity: isDecal ? 0.72 : 0.18,
        roughness: isDecal ? 0.16 : 0.22,
        metalness: isDecal ? 0.12 : 0.35,
        envMapIntensity: 1.35,
        polygonOffset: isDecal,
        polygonOffsetFactor: isDecal ? -2 : 0,
      });
      mesh.material = btnMat;
      mats.push(btnMat);
    }

    const centerWorld = btnBox.getCenter(new THREE.Vector3());
    const sizeWorld = btnBox.getSize(new THREE.Vector3());
    const localAnchor = centerWorld.clone().applyMatrix4(invRootMatrix);

    // Crisp localized emissive halo ring directly hugging the GLB button
    const ringMat = new THREE.MeshBasicMaterial({
      color: entry.colorHex,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    let ringMesh: THREE.Mesh;
    if (entry.isShoulder) {
      const rx = Math.max(0.18, sizeWorld.x * 0.56);
      ringMesh = new THREE.Mesh(new THREE.TorusGeometry(rx * 0.65, 0.018, 12, 32), ringMat);
      ringMesh.scale.set(1.45, 0.46, 0.6);
      ringMesh.position.set(localAnchor.x, localAnchor.y + sizeWorld.y * 0.35, localAnchor.z + sizeWorld.z * 0.42);
      ringMesh.rotation.z = localAnchor.x < 0 ? 0.16 : -0.16;
    } else {
      const r = Math.max(0.085, Math.max(sizeWorld.x, sizeWorld.y) * 0.58);
      ringMesh = new THREE.Mesh(new THREE.RingGeometry(r * 0.92, r * 1.38, 28), ringMat);
      ringMesh.position.set(localAnchor.x, localAnchor.y, localAnchor.z + sizeWorld.z * 0.65 + 0.025);
    }
    root.add(ringMesh);

    targets[key] = {
      mats,
      ringMat,
      ringMesh,
      localAnchor,
      activeColor: new THREE.Color(entry.colorHex),
    };
  }

  // Localized subtle volumetric point-light bounces across the carbon-glass controller shell
  const leftBounceLight = new THREE.PointLight(0x10b981, 0.0, 2.2, 1.4);
  leftBounceLight.position.set(-0.9, 0.85, 0.52);
  root.add(leftBounceLight);

  const rightBounceLight = new THREE.PointLight(0x10b981, 0.0, 2.2, 1.4);
  rightBounceLight.position.set(0.9, 0.62, 0.68);
  root.add(rightBounceLight);

  root.rotation.x = -0.34;
  root.position.set(0, 0.54, 0.12);

  return {
    root,
    targets,
    lightbarMats: [lightbarMat],
    leftStickPivot,
    rightStickPivot,
    leftBounceLight,
    rightBounceLight,
  };
}

/**
 * High-poly beveled carbon-glass sculpted DualSense fallback (renders immediately on frame 0
 * while the real `.glb` streams in from CDN, and guarantees full AAA quality offline).
 */
function createFallbackCarbonDualSense(
  carbonMaps: CarbonFiberMaps,
  isSoftwareGl: boolean
): GamepadAssembly {
  const root = new THREE.Group();

  const carbonGlassMat = createLumenCarbonGlassMaterial(carbonMaps, isSoftwareGl);
  const obsidianTrimMat = createObsidianTrimMaterial(carbonMaps);
  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x0b1220,
    roughness: 0.74,
    metalness: 0.12,
  });

  const hullShape = new THREE.Shape();
  hullShape.moveTo(-0.88, 0.72);
  hullShape.bezierCurveTo(-0.42, 0.78, 0.42, 0.78, 0.88, 0.72);
  hullShape.bezierCurveTo(1.36, 0.66, 1.64, 0.26, 1.72, -0.34);
  hullShape.bezierCurveTo(1.78, -0.78, 1.62, -1.16, 1.36, -1.18);
  hullShape.bezierCurveTo(1.12, -1.2, 0.98, -0.74, 0.78, -0.34);
  hullShape.bezierCurveTo(0.54, -0.18, -0.54, -0.18, -0.78, -0.34);
  hullShape.bezierCurveTo(-0.98, -0.74, -1.12, -1.2, -1.36, -1.18);
  hullShape.bezierCurveTo(-1.62, -1.16, -1.78, -0.78, -1.72, -0.34);
  hullShape.bezierCurveTo(-1.64, 0.26, -1.36, 0.66, -0.88, 0.72);

  const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
    depth: 0.3,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.1,
    bevelSegments: 7,
    curveSegments: 32,
  });
  hullGeo.center();
  const hullMesh = new THREE.Mesh(hullGeo, carbonGlassMat);
  root.add(hullMesh);

  const collarShape = new THREE.Shape();
  collarShape.moveTo(-0.82, -0.02);
  collarShape.lineTo(0.82, -0.02);
  collarShape.lineTo(0.95, -0.36);
  collarShape.bezierCurveTo(0.55, -0.18, -0.55, -0.18, -0.95, -0.36);
  collarShape.closePath();

  const collarGeo = new THREE.ExtrudeGeometry(collarShape, {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 4,
  });
  collarGeo.center();
  const collarMesh = new THREE.Mesh(collarGeo, obsidianTrimMat);
  collarMesh.position.set(0, -0.22, 0.04);
  root.add(collarMesh);

  const touchpad = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.54, 0.1), obsidianTrimMat);
  touchpad.position.set(0, 0.34, 0.25);
  root.add(touchpad);

  const lightbarMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 1.05,
    roughness: 0.18,
    metalness: 0.1,
  });
  for (const side of [-1, 1]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.52, 0.07), lightbarMat);
    strip.position.set(side * 0.51, 0.34, 0.27);
    strip.rotation.z = side * -0.08;
    root.add(strip);
  }

  const stickProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.2, 0.0),
    new THREE.Vector2(0.11, 0.12),
    new THREE.Vector2(0.09, 0.24),
    new THREE.Vector2(0.21, 0.28),
    new THREE.Vector2(0.19, 0.32),
    new THREE.Vector2(0.0, 0.29),
  ];
  const stickGeo = new THREE.LatheGeometry(stickProfile, 24);
  stickGeo.rotateX(Math.PI / 2);

  const leftStickPivot = new THREE.Group();
  leftStickPivot.position.set(-0.56, -0.14, 0.24);
  leftStickPivot.add(new THREE.Mesh(stickGeo, rubberMat));
  root.add(leftStickPivot);

  const rightStickPivot = new THREE.Group();
  rightStickPivot.position.set(0.56, -0.14, 0.24);
  rightStickPivot.add(new THREE.Mesh(stickGeo, rubberMat));
  root.add(rightStickPivot);

  const targets: GamepadAssembly['targets'] = {};

  function addFaceButton(
    key: 'triangle' | 'circle' | 'cross' | 'square',
    symbol: string,
    x: number,
    y: number,
    activeHex: number,
    symbolCssColor: string
  ) {
    const tex = createSymbolTexture(symbol, symbolCssColor);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: tex,
      emissive: new THREE.Color(activeHex),
      emissiveIntensity: 0.18,
      roughness: 0.22,
      metalness: 0.2,
    });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.145, 0.11, 24), mat);
    cap.rotation.x = Math.PI / 2;
    cap.position.set(x, y, 0.29);
    root.add(cap);

    const ringMat = new THREE.MeshBasicMaterial({
      color: activeHex,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.24, 28), ringMat);
    ringMesh.position.set(x, y, 0.36);
    root.add(ringMesh);

    targets[key] = {
      mats: [mat],
      ringMat,
      ringMesh,
      localAnchor: new THREE.Vector3(x, y, 0.36),
      activeColor: new THREE.Color(activeHex),
    };
  }

  addFaceButton('triangle', '△', 1.12, 0.44, 0x10b981, '#34d399');
  addFaceButton('circle', '○', 1.36, 0.24, 0xf43f5e, '#fb7185');
  addFaceButton('cross', '✕', 1.12, 0.04, 0x38bdf8, '#7dd3fc');
  addFaceButton('square', '□', 0.88, 0.24, 0xc084fc, '#d8b4fe');

  function addShoulder(
    key: 'L1' | 'R1' | 'L2' | 'R2',
    label: string,
    side: -1 | 1,
    isTrigger: boolean,
    activeHex: number
  ) {
    const tex = createSymbolTexture(label, '#f8fafc', 'rgba(11,17,32,0.88)');
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: tex,
      emissive: new THREE.Color(activeHex),
      emissiveIntensity: 0.16,
      roughness: 0.24,
      metalness: 0.32,
    });
    const width = isTrigger ? 0.56 : 0.64;
    const height = isTrigger ? 0.16 : 0.2;
    const depth = isTrigger ? 0.28 : 0.24;
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
    bumper.position.set(side * 1.06, isTrigger ? 0.94 : 0.85, isTrigger ? -0.14 : 0.08);
    bumper.rotation.z = side * -0.14;
    root.add(bumper);

    const ringMat = new THREE.MeshBasicMaterial({
      color: activeHex,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.022, 12, 28), ringMat);
    ringMesh.scale.set(1.35, 0.45, 0.6);
    ringMesh.position.set(side * 1.06, isTrigger ? 1.04 : 0.96, isTrigger ? -0.1 : 0.22);
    ringMesh.rotation.z = side * -0.14;
    root.add(ringMesh);

    targets[key] = {
      mats: [mat],
      ringMat,
      ringMesh,
      localAnchor: new THREE.Vector3(side * 1.06, isTrigger ? 1.0 : 0.92, isTrigger ? -0.05 : 0.22),
      activeColor: new THREE.Color(activeHex),
    };
  }

  addShoulder('L1', 'L1', -1, false, 0x10b981);
  addShoulder('R1', 'R1', 1, false, 0x38bdf8);
  addShoulder('L2', 'L2', -1, true, 0xf59e0b);
  addShoulder('R2', 'R2', 1, true, 0xec4899);

  const leftBounceLight = new THREE.PointLight(0x10b981, 0.0, 2.2, 1.4);
  leftBounceLight.position.set(-1.05, 0.95, 0.45);
  root.add(leftBounceLight);

  const rightBounceLight = new THREE.PointLight(0x10b981, 0.0, 2.2, 1.4);
  rightBounceLight.position.set(1.12, 0.55, 0.55);
  root.add(rightBounceLight);

  root.scale.setScalar(0.84);
  root.rotation.x = -0.34;
  root.position.set(0, 0.54, 0.12);

  return {
    root,
    targets,
    lightbarMats: [lightbarMat],
    leftStickPivot,
    rightStickPivot,
    leftBounceLight,
    rightBounceLight,
  };
}

interface HolographicArenaAssembly {
  root: THREE.Group;
  surfaceMat: THREE.MeshPhysicalMaterial;
  bezelMat: THREE.MeshStandardMaterial;
  arcTube: THREE.Mesh;
  arcShaderMat: THREE.ShaderMaterial;
  shooterBeam: THREE.Mesh;
  shooterShaderMat: THREE.ShaderMaterial;
  sparkTrail: SparkTrailSystem;
  orbMesh: THREE.Mesh;
  orbCurve: THREE.CatmullRomCurve3;
  shooterCurve: THREE.CatmullRomCurve3;
  defenderBarrierGroup: THREE.Group;
  defenderBarrierMat: THREE.ShaderMaterial;
  targetBeaconGroup: THREE.Group;
  targetBeamMat: THREE.ShaderMaterial;
  targetOuterRing: THREE.Mesh;
  targetInnerRing: THREE.Mesh;
  pbrSets: Record<MotionGraphicArchetype, ArenaSurfacePbrSet>;
}

/**
 * Unreal Engine 5.8 3D Holographic Tactical Arena:
 * - Thick beveled 3D PBR slab (`ExtrudeGeometry` chamfered metallic bezel + textured wet turf / concrete / asphalt surface with normal & roughness maps)
 * - Custom GLSL animated flowing energy ribbon (`TubeGeometry`) + 46 trailing micro-ember sparks
 * - Custom GLSL 3D Fresnel crimson defender barrier wall with vertical beam edges
 * - Custom GLSL 3D Fresnel target ring & vertical holographic light beam column
 */
function createUnrealHolographicArena(maxAnisotropy: number): HolographicArenaAssembly {
  const root = new THREE.Group();
  root.position.set(0, -1.04, -0.1);

  const pbrSets: Record<MotionGraphicArchetype, ArenaSurfacePbrSet> = {
    sports_pitch_arc: createArenaSurfacePbrSet('sports_pitch_arc', maxAnisotropy),
    shooter_crosshair_peek: createArenaSurfacePbrSet('shooter_crosshair_peek', maxAnisotropy),
    strategy_flank_vector: createArenaSurfacePbrSet('strategy_flank_vector', maxAnisotropy),
    racing_apex_line: createArenaSurfacePbrSet('racing_apex_line', maxAnisotropy),
  };

  // 1. Thick Beveled 3D Tactical Slab Chassis (`ExtrudeGeometry` with rounded corners & chamfer)
  const sw = 2.48;
  const sd = 1.42;
  const cr = 0.2;
  const slabShape = new THREE.Shape();
  slabShape.moveTo(-sw + cr, -sd);
  slabShape.lineTo(sw - cr, -sd);
  slabShape.quadraticCurveTo(sw, -sd, sw, -sd + cr);
  slabShape.lineTo(sw, sd - cr);
  slabShape.quadraticCurveTo(sw, sd, sw - cr, sd);
  slabShape.lineTo(-sw + cr, sd);
  slabShape.quadraticCurveTo(-sw, sd, -sw, sd - cr);
  slabShape.lineTo(-sw, -sd + cr);
  slabShape.quadraticCurveTo(-sw, -sd, -sw + cr, -sd);

  const chassisGeo = new THREE.ExtrudeGeometry(slabShape, {
    depth: 0.13,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.055,
    bevelSegments: 4,
    curveSegments: 12,
  });
  chassisGeo.rotateX(Math.PI / 2);
  chassisGeo.center();

  const chassisMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b1322,
    metalness: 0.72,
    roughness: 0.22,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.25,
  });
  const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
  chassisMesh.position.y = -0.11;
  root.add(chassisMesh);

  // Glowing Metallic-Holographic Perimeter Bezel Trim
  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 0.95,
    roughness: 0.2,
    metalness: 0.4,
    transparent: true,
    opacity: 0.85,
  });
  const bezelEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(chassisGeo, 24),
    new THREE.LineBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.65,
    })
  );
  bezelEdges.position.copy(chassisMesh.position);
  root.add(bezelEdges);

  // Recessed glowing trim rail around upper chamfer
  const railGeo = new THREE.BoxGeometry(4.92, 0.028, 2.8);
  const railEdge = new THREE.LineSegments(new THREE.EdgesGeometry(railGeo), bezelMat);
  railEdge.position.y = 0.005;
  root.add(railEdge);

  // 2. Top Textured Wet PBR Tactical Surface (normalMap + roughnessMap + clearcoat sheen)
  const initialSet = pbrSets.sports_pitch_arc;
  const surfaceMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: initialSet.map,
    normalMap: initialSet.normalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughnessMap: initialSet.roughnessMap,
    roughness: 0.65,
    metalness: 0.22,
    clearcoat: 0.72,
    clearcoatRoughness: 0.16,
    emissive: new THREE.Color(initialSet.baseEmissiveHex),
    emissiveIntensity: 0.42,
    envMapIntensity: 1.18,
  });
  const topSurface = new THREE.Mesh(new THREE.PlaneGeometry(4.78, 2.7), surfaceMat);
  topSurface.rotation.x = -Math.PI / 2;
  topSurface.position.y = 0.006;
  root.add(topSurface);

  // Grounding contact shadow directly beneath the hovering controller
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sctx = shadowCanvas.getContext('2d')!;
  const sg = sctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  sg.addColorStop(0, 'rgba(0,0,0,0.68)');
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  sctx.fillStyle = sg;
  sctx.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.75),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.66,
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.018;
  root.add(contactShadow);

  // 3. Custom GLSL Animated Energy Ribbon (`TubeGeometry` + Flowing Light-Pulse Shader)
  const orbCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.82, 0.08, 0.66),
    new THREE.Vector3(-0.58, 0.74, 0.14),
    new THREE.Vector3(0.68, 0.64, -0.34),
    new THREE.Vector3(1.78, 0.12, -0.58),
  ]);
  const arcGeo = new THREE.TubeGeometry(orbCurve, 56, 0.052, 12, false);
  const arcShaderMat = createEnergyRibbonShaderMaterial(0x10b981);
  const arcTube = new THREE.Mesh(arcGeo, arcShaderMat);
  root.add(arcTube);

  // Shooter custom GLSL animated plasma laser ribbon
  const shooterCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.72, 0.16, 0.56),
    new THREE.Vector3(0.0, 0.16, -0.02),
    new THREE.Vector3(1.74, 0.16, -0.56),
  ]);
  const shooterShaderMat = createEnergyRibbonShaderMaterial(0x38bdf8);
  const shooterBeam = new THREE.Mesh(
    new THREE.TubeGeometry(shooterCurve, 36, 0.044, 10, false),
    shooterShaderMat
  );
  shooterBeam.visible = false;
  root.add(shooterBeam);

  // Trailing micro-ember / plasma spark particles along active curve
  const sparkTrail = createSparkTrailSystem(46);
  root.add(sparkTrail.points);

  // Leading glowing comet orb with soft volumetric outer shell
  const orbMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.095, 18, 18),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  const orbGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  orbMesh.add(orbGlow);
  root.add(orbMesh);

  // 4. Custom GLSL 3D Fresnel Holographic Tactical Defender Barrier Wall (replaces flat red line!)
  const defenderBarrierGroup = new THREE.Group();
  defenderBarrierGroup.position.set(0.45, 0.02, 0);

  const defenderBarrierMat = createFresnelBarrierShaderMaterial();
  const barrierWall = new THREE.Mesh(new THREE.PlaneGeometry(2.56, 0.52, 1, 1), defenderBarrierMat);
  barrierWall.rotation.y = Math.PI / 2;
  barrierWall.position.y = 0.26;
  defenderBarrierGroup.add(barrierWall);

  // Glowing floor contact laser seam + dual vertical crimson end-posts
  const barrierSeam = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.032, 2.56),
    new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  barrierSeam.position.y = 0.016;
  defenderBarrierGroup.add(barrierSeam);

  for (const endZ of [-1.26, 1.26]) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.032, 0.56, 10),
      new THREE.MeshBasicMaterial({
        color: 0xfb7185,
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    post.position.set(0, 0.28, endZ);
    defenderBarrierGroup.add(post);
  }
  root.add(defenderBarrierGroup);

  // 5. Custom GLSL 3D Fresnel Target Beacon + Dual Concentric Rings + Vertical Light Beam Column
  const targetBeaconGroup = new THREE.Group();
  targetBeaconGroup.position.set(1.78, 0.025, -0.58);

  const targetBeamMat = createFresnelBeamShaderMaterial(0x10b981);
  const targetBeamColumn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.36, 0.92, 28, 1, true),
    targetBeamMat
  );
  targetBeamColumn.position.y = 0.46;
  targetBeaconGroup.add(targetBeamColumn);

  const targetOuterRing = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.44, 32),
    new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  targetOuterRing.rotation.x = -Math.PI / 2;
  targetOuterRing.position.y = 0.01;
  targetBeaconGroup.add(targetOuterRing);

  const targetInnerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.16, 0.24, 24),
    new THREE.MeshBasicMaterial({
      color: 0xa7f3d0,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  targetInnerRing.rotation.x = -Math.PI / 2;
  targetInnerRing.position.y = 0.02;
  targetBeaconGroup.add(targetInnerRing);

  root.add(targetBeaconGroup);

  return {
    root,
    surfaceMat,
    bezelMat,
    arcTube,
    arcShaderMat,
    shooterBeam,
    shooterShaderMat,
    sparkTrail,
    orbMesh,
    orbCurve,
    shooterCurve,
    defenderBarrierGroup,
    defenderBarrierMat,
    targetBeaconGroup,
    targetBeamMat,
    targetOuterRing,
    targetInnerRing,
    pbrSets,
  };
}

export const ControllerCoach3D: React.FC<ControllerCoach3DProps> = ({
  archetype,
  sweetSpotStartPct,
  sweetSpotEndPct,
  cycleDurationMs,
  accentHex = '#10B981',
  onSyncTick,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef({
    archetype,
    sweetSpotStartPct,
    sweetSpotEndPct,
    cycleDurationMs,
    accentHex,
    onSyncTick,
  });

  useEffect(() => {
    propsRef.current = {
      archetype,
      sweetSpotStartPct,
      sweetSpotEndPct,
      cycleDurationMs,
      accentHex,
      onSyncTick,
    };
  }, [archetype, sweetSpotStartPct, sweetSpotEndPct, cycleDurationMs, accentHex, onSyncTick]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    THREE.Cache.enabled = true;
    const isSoftwareGl = detectSoftwareGl();
    const width = container.clientWidth || 350;
    const height = container.clientHeight || 170;

    const scene = new THREE.Scene();

    // Tight cinematic framing so the 3D DualSense GLB + beveled holographic slab fill the 170px stage dramatically
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.44, 4.78);
    camera.lookAt(0, -0.14, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        premultipliedAlpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.background = 'transparent';
    container.appendChild(renderer.domElement);

    // Lumen-grade Dark Studio / City HDRI reflections (zero white blowout)
    const envTex = createDarkStudioHdri(renderer);
    scene.environment = envTex;

    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const carbonMaps = createCarbonFiberMaps(maxAnisotropy);

    // Dual-Rim Studio Lighting Rig (emerald #10b981 + cool cyan #38bdf8, intensities <= 1.2)
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x064e3b, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xf8fafc, 1.12);
    keyLight.position.set(3.4, 6.0, 4.8);
    scene.add(keyLight);

    const rimEmerald = new THREE.PointLight(0x10b981, 1.2, 16, 0.45);
    rimEmerald.position.set(-2.9, 1.65, 2.3);
    scene.add(rimEmerald);

    const rimCyan = new THREE.PointLight(0x38bdf8, 1.1, 16, 0.45);
    rimCyan.position.set(2.9, 1.85, -1.5);
    scene.add(rimCyan);

    const underBounce = new THREE.PointLight(0x10b981, 0.95, 10, 0.5);
    underBounce.position.set(0, -0.75, 0.85);
    scene.add(underBounce);

    const heroRigRoot = new THREE.Group();
    scene.add(heroRigRoot);

    // Instant carbon-glass fallback renders on frame 0; swapped seamlessly when real DualSense `.glb` loads
    let activeGamepad: GamepadAssembly = createFallbackCarbonDualSense(carbonMaps, isSoftwareGl);
    let fallbackGamepad: GamepadAssembly | null = activeGamepad;
    let loadedGlbGamepad: GamepadAssembly | null = null;

    const kbm = createProShooterKbmAssembly(carbonMaps, maxAnisotropy, isSoftwareGl);
    const arena = createUnrealHolographicArena(maxAnisotropy);
    heroRigRoot.add(activeGamepad.root, kbm.root, arena.root);

    let disposed = false;

    // Async fetch + parse real high-detail DualSense `.glb` from free public CDN with mirror fallback
    const gltfLoader = new GLTFLoader();
    gltfLoader.setCrossOrigin('anonymous');

    const tryLoadGlb = async (urlIdx: number) => {
      if (disposed || urlIdx >= DUALSENSE_GLB_URLS.length) return;
      const url = DUALSENSE_GLB_URLS[urlIdx];
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();
        if (disposed) return;

        gltfLoader.parse(
          buffer,
          '',
          (gltf) => {
            if (disposed) return;
            const glbAssembly = configureLoadedDualSenseGlb(gltf.scene, carbonMaps, isSoftwareGl);
            glbAssembly.root.visible = activeGamepad.root.visible;
            glbAssembly.root.rotation.copy(activeGamepad.root.rotation);
            glbAssembly.root.position.copy(activeGamepad.root.position);
            heroRigRoot.add(glbAssembly.root);

            if (fallbackGamepad) {
              heroRigRoot.remove(fallbackGamepad.root);
              fallbackGamepad = null;
            }
            loadedGlbGamepad = glbAssembly;
            activeGamepad = glbAssembly;
            if (hostRef.current) {
              hostRef.current.dataset.glbLoaded = 'true';
            }
          },
          (parseErr) => {
            if (hostRef.current) {
              hostRef.current.dataset.glbError = String(parseErr);
            }
            if (!disposed) void tryLoadGlb(urlIdx + 1);
          }
        );
      } catch (fetchErr) {
        if (hostRef.current) {
          hostRef.current.dataset.glbError = String(fetchErr);
        }
        if (!disposed) void tryLoadGlb(urlIdx + 1);
      }
    };
    void tryLoadGlb(0);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Gentle interactive drag tilt
    let dragActive = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let userYawOffset = 0;
    let userPitchOffset = 0;

    const onPointerDown = (e: PointerEvent) => {
      dragActive = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragActive) return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      userYawOffset = THREE.MathUtils.clamp(userYawOffset + dx * 0.008, -0.65, 0.65);
      userPitchOffset = THREE.MathUtils.clamp(userPitchOffset + dy * 0.006, -0.35, 0.35);
    };
    const onPointerUp = () => {
      dragActive = false;
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 350;
      const h = container.clientHeight || 170;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Scratch math objects (zero per-frame GC)
    const _orbPos = new THREE.Vector3();
    const _accentCol = new THREE.Color();
    let lastFrameMs = performance.now();
    const startMs = lastFrameMs;
    let lastHudEmitMs = 0;
    let frameId = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 95);
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

    function applyGlowTargets(
      targets: Partial<Record<string, GlowMaterialTarget>>,
      glowMap: Record<string, number>,
      isLate: boolean,
      leftLight: THREE.PointLight,
      rightLight: THREE.PointLight
    ) {
      let leftIntensity = 0;
      let rightIntensity = 0;
      let leftAnchor: THREE.Vector3 | null = null;
      let rightAnchor: THREE.Vector3 | null = null;

      for (const [key, target] of Object.entries(targets)) {
        if (!target) continue;
        const intensity = glowMap[key] ?? 0;
        const glowHex = isLate && intensity > 0.2 ? 0xf43f5e : 0x10b981;

        for (const m of target.mats) {
          m.emissive.setHex(glowHex);
          m.emissiveIntensity = intensity > 0.1 ? 0.28 + intensity * 0.92 : 0.1;
        }
        target.ringMat.color.setHex(glowHex);
        target.ringMat.opacity = intensity > 0.1 ? 0.22 + intensity * 0.65 : 0.03;

        if (intensity > 0.15) {
          if (target.localAnchor.x <= 0 && intensity >= leftIntensity) {
            leftIntensity = intensity;
            leftAnchor = target.localAnchor;
          } else if (target.localAnchor.x > 0 && intensity >= rightIntensity) {
            rightIntensity = intensity;
            rightAnchor = target.localAnchor;
          }
        }
      }

      const bounceHex = isLate ? 0xf43f5e : 0x10b981;
      leftLight.color.setHex(bounceHex);
      leftLight.intensity = leftIntensity * 1.15;
      if (leftAnchor) {
        leftLight.position.set(leftAnchor.x, leftAnchor.y + 0.16, leftAnchor.z + 0.28);
      }

      rightLight.color.setHex(bounceHex);
      rightLight.intensity = rightIntensity * 1.15;
      if (rightAnchor) {
        rightLight.position.set(rightAnchor.x, rightAnchor.y + 0.14, rightAnchor.z + 0.3);
      }
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.08, Math.max(0.001, (now - lastFrameMs) / 1000));
      lastFrameMs = now;
      const elapsed = (now - startMs) / 1000;

      const {
        archetype: activeArchetype,
        sweetSpotStartPct: ssStart,
        sweetSpotEndPct: ssEnd,
        cycleDurationMs: durationMs,
        onSyncTick: emitHud,
      } = propsRef.current;

      const cycleMs = Math.max(2000, durationMs || 3000);
      const phaseT = ((now - startMs) % cycleMs) / cycleMs;

      const sync = computeControllerSyncSnapshot(activeArchetype, phaseT, ssStart, ssEnd);

      // Show matching 3D controller rig (DualSense GLB vs Carbon Shooter KBM)
      activeGamepad.root.visible = sync.rigMode === 'gamepad';
      kbm.root.visible = sync.rigMode === 'kbm';

      // Swap beveled 3D arena PBR maps (albedo + normalMap + roughnessMap) per game genre
      const targetPbr = arena.pbrSets[activeArchetype] ?? arena.pbrSets.sports_pitch_arc;
      if (arena.surfaceMat.map !== targetPbr.map) {
        arena.surfaceMat.map = targetPbr.map;
        arena.surfaceMat.normalMap = targetPbr.normalMap;
        arena.surfaceMat.roughnessMap = targetPbr.roughnessMap;
        arena.surfaceMat.emissive.setHex(targetPbr.baseEmissiveHex);
        arena.bezelMat.color.setHex(targetPbr.accentHex);
        arena.bezelMat.emissive.setHex(targetPbr.accentHex);
        arena.surfaceMat.needsUpdate = true;
      }

      // Synchronized button emissive rings + shell bounce lights
      const isShooter = sync.rigMode === 'kbm';
      if (activeGamepad.root.visible) {
        rimEmerald.color.setHex(0x10b981);
        hemiLight.groundColor.setHex(0x064e3b);
        applyGlowTargets(
          activeGamepad.targets,
          sync.glow as unknown as Record<string, number>,
          sync.isLateZone,
          activeGamepad.leftBounceLight,
          activeGamepad.rightBounceLight
        );
        for (const lmat of activeGamepad.lightbarMats) {
          lmat.emissive.setHex(sync.accentColorHex);
          lmat.emissiveIntensity = sync.inSweetSpot ? 1.18 : 0.65;
        }
        if (activeGamepad.leftStickPivot) {
          activeGamepad.leftStickPivot.rotation.y = Math.sin(phaseT * Math.PI * 2) * 0.18;
          activeGamepad.leftStickPivot.rotation.x = -0.1 * Math.sin(phaseT * Math.PI);
        }
      } else {
        // Cool metallic studio rim for dark anodized-aluminum & smoked-carbon KBM (zero green wash)
        rimEmerald.color.setHex(0x22d3ee);
        hemiLight.groundColor.setHex(0x0f172a);
        kbm.updateGlow(
          sync.glow as unknown as Record<string, number>,
          sync.inSweetSpot,
          sync.isLateZone,
          dt
        );
      }

      // Animate custom GLSL energy ribbon, trailing micro-ember sparks, Fresnel barrier & target beam
      arena.arcTube.visible = !isShooter;
      arena.shooterBeam.visible = isShooter;

      _accentCol.setHex(sync.accentColorHex);
      const activeCurve = isShooter ? arena.shooterCurve : arena.orbCurve;
      const activeRibbonMat = isShooter ? arena.shooterShaderMat : arena.arcShaderMat;
      activeRibbonMat.uniforms.uTime.value = elapsed;
      activeRibbonMat.uniforms.uProgress.value = sync.arcProgress;
      activeRibbonMat.uniforms.uSweetSpot.value = sync.inSweetSpot ? 1.0 : 0.0;
      activeRibbonMat.uniforms.uColor.value.lerp(_accentCol, 0.25);

      activeCurve.getPointAt(sync.arcProgress, _orbPos);
      arena.orbMesh.position.copy(_orbPos);
      arena.orbMesh.scale.setScalar(sync.inSweetSpot ? 1.24 : 0.94);

      arena.sparkTrail.update(activeCurve, sync.arcProgress, elapsed, sync.accentColorHex, sync.inSweetSpot);

      // Move 3D Fresnel defender barrier dynamically across the pitch
      arena.defenderBarrierGroup.position.x = 0.56 - phaseT * 0.62;
      arena.defenderBarrierMat.uniforms.uTime.value = elapsed;
      arena.defenderBarrierMat.uniforms.uAlert.value = sync.isLateZone ? 1.0 : 0.25;

      // Animate 3D Fresnel target beacon + dual counter-rotating rings
      arena.targetBeamMat.uniforms.uTime.value = elapsed;
      arena.targetBeamMat.uniforms.uIntensity.value = sync.inSweetSpot ? 1.25 : 0.85;
      arena.targetBeamMat.uniforms.uColor.value.lerp(_accentCol, 0.2);

      const pulseScale = 0.92 + Math.sin(elapsed * 4.2) * 0.11;
      arena.targetOuterRing.scale.setScalar(pulseScale);
      arena.targetOuterRing.rotation.z = elapsed * 0.9;
      arena.targetInnerRing.rotation.z = -elapsed * 1.4;
      (arena.targetOuterRing.material as THREE.MeshBasicMaterial).color.copy(_accentCol);
      underBounce.color.lerp(_accentCol, 0.12);

      // Smooth cinematic floating + subtle tilt so HDRI reflections glide across carbon-glass shell
      if (!dragActive) {
        userYawOffset = THREE.MathUtils.damp(userYawOffset, 0, 2.5, dt);
        userPitchOffset = THREE.MathUtils.damp(userPitchOffset, 0, 2.5, dt);
      }

      const hoverY = Math.sin(elapsed * 1.85) * 0.058;
      const idleYaw = Math.sin(elapsed * 0.9) * 0.22;
      const idleRoll = Math.cos(elapsed * 0.7) * 0.055;

      if (activeGamepad.root.visible) {
        activeGamepad.root.position.y = 0.54 + hoverY;
        activeGamepad.root.rotation.y = THREE.MathUtils.damp(
          activeGamepad.root.rotation.y,
          idleYaw + userYawOffset,
          5,
          dt
        );
        activeGamepad.root.rotation.x = THREE.MathUtils.damp(
          activeGamepad.root.rotation.x,
          -0.34 + userPitchOffset,
          5,
          dt
        );
        activeGamepad.root.rotation.z = THREE.MathUtils.damp(
          activeGamepad.root.rotation.z,
          idleRoll,
          4,
          dt
        );
      } else {
        kbm.root.position.y = 0.5 + hoverY;
        kbm.root.rotation.y = THREE.MathUtils.damp(
          kbm.root.rotation.y,
          idleYaw * 0.68 + userYawOffset,
          5,
          dt
        );
        kbm.root.rotation.x = THREE.MathUtils.damp(
          kbm.root.rotation.x,
          0.68 + userPitchOffset,
          5,
          dt
        );
      }

      if (emitHud && now - lastHudEmitMs >= 100) {
        lastHudEmitMs = now;
        emitHud({
          progressPct: sync.progressPct,
          inSweetSpot: sync.inSweetSpot,
          isLateZone: sync.isLateZone,
          activeButtonLabels: sync.activeButtonLabels,
        });
      }

      renderer.render(scene, camera);

      if (loadedGlbGamepad && hostRef.current && hostRef.current.dataset.glbRendered !== 'true') {
        hostRef.current.dataset.glbRendered = 'true';
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
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      envTex.dispose();
      carbonMaps.dispose();
      arena.sparkTrail.dispose();
      Object.values(arena.pbrSets).forEach((s) => s.dispose());
      if (loadedGlbGamepad) {
        loadedGlbGamepad.root.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            (obj as THREE.Mesh).geometry?.dispose();
          }
        });
      }
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh || (obj as THREE.LineSegments).isLineSegments) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          const mat = m.material;
          if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose());
          else mat?.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={hostRef}
      data-testid="controller-coach-3d"
      data-archetype={archetype}
      data-glb-loaded="false"
      style={{ background: 'transparent' }}
      className="relative w-full h-[186px] select-none touch-none cursor-grab active:cursor-grabbing bg-transparent"
    >
      {/* Isolated empty mount container for transparent WebGL canvas */}
      <div ref={mountRef} style={{ background: 'transparent' }} className="w-full h-full bg-transparent" />
    </div>
  );
};
