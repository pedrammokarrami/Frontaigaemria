import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Loader2,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { CrossGameKey } from '../../data/offlineAgentsData';
import type { HologramPlateKey } from '../../data/iconicGameCharacters';
import {
  type HologramDisplayMode,
  type HologramEmotion,
  type HologramGender,
  type HologramGesture,
  type HologramRenderMode,
  computeLipSyncAmplitude,
  computeMetaHumanProfile,
} from '../../utils/hologramAvatarEngine';
import {
  type ReconstructedDepthField,
  reconstructVolumetricDepthField,
} from '../../utils/hologramDepthReconstructor';
import { GAME_STAGE_FRAME_CONFIG } from './GameNativeProfileCard';
import { HOLOGRAM_PLATE_URLS } from './hologramPlateAssets';
import { LAB_ROOM_ENVIRONMENTS } from './labRoomEnvironments';

export type CameraFocusPreset = 'overview' | 'face' | 'stage';

export interface StageCharacterBrief {
  nameEn: string;
  nameFa: string;
  plateKey: HologramPlateKey;
  accentHex: string;
  secondaryHex: string;
}

export interface CustomLabRoomEnv {
  imageUrl: string;
  ambientBgHex: string;
  beamPrimaryHex: string;
  beamSecondaryHex: string;
  roomRimHex: string;
  floorGlowHex: string;
}

export interface CustomStageFrameConfig {
  outerClass: string;
  headerBgClass: string;
  titleColorClass: string;
  subtitleColorClass: string;
  accentHex: string;
  secondaryHex: string;
  badgeLabel: string;
  lightAccentText?: boolean;
  clipStyle?: React.CSSProperties;
}

interface SpatialStage3DProps {
  activeGameKey: CrossGameKey;
  accentHex: string;
  focusPreset?: CameraFocusPreset;
  onChangeFocusPreset?: (preset: CameraFocusPreset) => void;
  gender: HologramGender;
  age: number;
  renderMode: HologramRenderMode;
  matchedCharacter: StageCharacterBrief;
  similarityPct: number;
  emotion: HologramEmotion;
  gesture: HologramGesture;
  displayMode: HologramDisplayMode;
  isSpeaking: boolean;
  isThinking: boolean;
  voiceEnabled: boolean;
  isListeningMic: boolean;
  liveTranscript: string;
  agentError: string | null;
  audioRmsRef: React.MutableRefObject<number>;
  onToggleVoiceEnabled: () => void;
  onToggleMic: () => void;
  onSendPrompt: (message: string) => void;
  customLabEnv?: CustomLabRoomEnv;
  customStageFrame?: CustomStageFrameConfig;
  customSuggestions?: string[];
  customPlaceholder?: string;
}

const CAMERA_PRESETS: Record<
  CameraFocusPreset,
  { pos: [number, number, number]; target: [number, number, number]; label: string }
> = {
  overview: { pos: [0.0, 1.18, 3.68], target: [0.0, 1.12, 0.0], label: 'نمای کامل' },
  face: { pos: [0.0, 1.50, 2.34], target: [0.0, 1.46, 0.10], label: 'کلوزآپ چهره' },
  stage: { pos: [1.36, 1.24, 3.04], target: [0.0, 1.14, 0.02], label: 'نمای ۳ بعدی' },
};

const SELF_INTRO_SUGGESTIONS: string[] = [
  'من سارا هستم، ۲۲ سالمه و عاشق ماجراجویی و شطرنج سریع‌ام',
  'پسرم ۳۴ سالمه، اهل کانتر و بازی تاکتیکی‌ام',
];

const MESH_WIDTH = 1.40;
const MESH_HEIGHT = 1.86;
const DEPTH_EXTRUDE_SCALE = 0.25;
const BACK_EXTRUDE_SCALE = 0.17;

function mapGestureToIndex(gesture: HologramGesture): number {
  switch (gesture) {
    case 'Point':
      return 0;
    case 'Wave':
      return 1;
    case 'Thinking':
      return 2;
    case 'Explain':
      return 3;
    default:
      return 4;
  }
}

function mapEmotionToIntensity(emotion: HologramEmotion): number {
  switch (emotion) {
    case 'Alert':
      return 1.28;
    case 'Confident':
      return 1.14;
    case 'Speaking':
      return 1.12;
    case 'Thinking':
      return 0.98;
    case 'Focused':
      return 1.06;
    default:
      return 1.0;
  }
}

/**
 * Reconstructs the closed 3D Front & Rear Depth + Surface Normal DataTextures AND
 * synchronized 3D Niagara volumetric point cloud (front sculpted shell + rear cranium/torso shell).
 */
function packFlippedDataTexture(
  rgbaBytes: Uint8Array,
  width: number,
  height: number
): THREE.DataTexture {
  const flipped = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const srcRow = (height - 1 - y) * width * 4;
    const dstRow = y * width * 4;
    flipped.set(rgbaBytes.subarray(srcRow, srcRow + width * 4), dstRow);
  }
  const tex = new THREE.DataTexture(
    flipped,
    width,
    height,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

function processPortraitToVolumetric3D(img: HTMLImageElement): {
  depthField: ReconstructedDepthField;
  normalDepthTex: THREE.DataTexture;
  backNormalDepthTex: THREE.DataTexture;
  niagaraGeo: THREE.BufferGeometry;
} {
  const sampleW = 128;
  const sampleH = 168;
  const off = document.createElement('canvas');
  off.width = sampleW;
  off.height = sampleH;
  const ctx = off.getContext('2d');

  let rgba = new Uint8ClampedArray(sampleW * sampleH * 4);
  if (ctx) {
    ctx.drawImage(img, 0, 0, sampleW, sampleH);
    rgba = ctx.getImageData(0, 0, sampleW, sampleH).data;
  }

  const depthField = reconstructVolumetricDepthField(rgba, sampleW, sampleH);
  const normalDepthTex = packFlippedDataTexture(depthField.normalDepthRgba, sampleW, sampleH);
  const backNormalDepthTex = packFlippedDataTexture(
    depthField.backNormalDepthRgba,
    sampleW,
    sampleH
  );

  // Build true 3D volumetric Niagara Point Cloud wrapping BOTH front face/body and rear cranium/shoulders
  const positions: number[] = [];
  const intensities: number[] = [];
  const phases: number[] = [];
  const uvs: number[] = [];

  for (let y = 0; y < sampleH; y += 1) {
    const v = 1 - y / (sampleH - 1);
    for (let x = 0; x < sampleW; x += 1) {
      const u = x / (sampleW - 1);
      const idx = y * sampleW + x;
      const fg = depthField.mask[idx];
      if (fg < 0.24) continue;

      const p = idx * 4;
      const r = rgba[p] / 255;
      const g = rgba[p + 1] / 255;
      const b = rgba[p + 2] / 255;
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const d = depthField.depth[idx];
      const backD = depthField.backDepth[idx];

      const cx = (u - 0.5) * MESH_WIDTH;
      const cy = (v - 0.5) * MESH_HEIGHT;
      const zFront = d * DEPTH_EXTRUDE_SCALE + 0.012;

      // Front sculpted 3D surface particle
      positions.push(cx, cy, zFront);
      intensities.push(Math.min(1.5, luma * 1.15 + 0.22));
      phases.push((x * 13.37 + y * 7.19) % (Math.PI * 2));
      uvs.push(u, v);

      // Rear 3D cranium & shoulder volume particles wrapping the closed back-shell
      if ((x + y) % 3 === 0 && backD > 0.16) {
        const zBack = -backD * BACK_EXTRUDE_SCALE - 0.012;
        positions.push(cx, cy, zBack);
        intensities.push(Math.min(0.95, 0.34 + backD * 0.48));
        phases.push((x * 5.71 + y * 11.13) % (Math.PI * 2));
        uvs.push(u, v);
      }
    }
  }

  const niagaraGeo = new THREE.BufferGeometry();
  niagaraGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  niagaraGeo.setAttribute('aIntensity', new THREE.Float32BufferAttribute(intensities, 1));
  niagaraGeo.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
  niagaraGeo.setAttribute('aUv', new THREE.Float32BufferAttribute(uvs, 2));

  return { depthField, normalDepthTex, backNormalDepthTex, niagaraGeo };
}

/**
 * Generates 3D volumetric emitter sparks + full 360° orbiting depth dust motes
 * that pass BOTH in front of and behind the depth-writing 3D hologram!
 */
function buildVolumetricOrbitSparks(count: number): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3);
  const intensities = new Float32Array(count);
  const phases = new Float32Array(count);
  const orbitSpeeds = new Float32Array(count);

  let seed = 918273;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < count; i += 1) {
    const isPlume = i < count * 0.72;
    if (isPlume) {
      const h = rand();
      const y = 0.14 + h * 0.78;
      const spread = 0.14 + Math.pow(h, 0.85) * 0.48;
      const angle = rand() * Math.PI * 2;
      const radius = Math.pow(rand(), 0.62) * spread;
      positions[i * 3 + 0] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      intensities[i] = 0.46 + (1 - h) * 0.72;
      orbitSpeeds[i] = 0.14 + rand() * 0.22;
    } else {
      // Subtle ambient lab dust motes floating inside the volumetric light cone
      const y = 0.30 + rand() * 1.65;
      const angle = rand() * Math.PI * 2;
      const radius = 0.58 + rand() * 0.95;
      positions[i * 3 + 0] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius - 0.15;
      intensities[i] = 0.28 + rand() * 0.36;
      orbitSpeeds[i] = (rand() > 0.5 ? 1 : -1) * (0.08 + rand() * 0.18);
    }
    phases[i] = rand() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aIntensity', new THREE.BufferAttribute(intensities, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('aOrbitSpeed', new THREE.BufferAttribute(orbitSpeeds, 1));
  return geo;
}

export const SpatialStage3D: React.FC<SpatialStage3DProps> = ({
  activeGameKey,
  accentHex,
  focusPreset,
  onChangeFocusPreset,
  gender,
  age,
  renderMode,
  matchedCharacter,
  similarityPct,
  emotion,
  gesture,
  displayMode,
  isSpeaking,
  isThinking,
  voiceEnabled,
  isListeningMic,
  liveTranscript,
  agentError,
  audioRmsRef,
  onToggleVoiceEnabled,
  onToggleMic,
  onSendPrompt,
  customLabEnv,
  customStageFrame,
  customSuggestions,
  customPlaceholder,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [promptInput, setPromptInput] = useState('');
  const [webglReady, setWebglReady] = useState(true);

  const metaProfile = useMemo(() => computeMetaHumanProfile(gender, age), [gender, age]);
  const activePlateUrl = HOLOGRAM_PLATE_URLS[matchedCharacter.plateKey];
  const activeLabRoom =
    customLabEnv ?? LAB_ROOM_ENVIRONMENTS[activeGameKey] ?? LAB_ROOM_ENVIRONMENTS.unified;
  const frameConfig =
    customStageFrame ?? GAME_STAGE_FRAME_CONFIG[activeGameKey] ?? GAME_STAGE_FRAME_CONFIG.unified;
  const lightAccentKeys = new Set(['unified', 'fc27', 'warzone', 'nba2k', 'dota2', 'chess']);
  const sendBtnTextColor =
    customStageFrame?.lightAccentText !== undefined
      ? customStageFrame.lightAccentText
        ? '#090D16'
        : '#FFFFFF'
      : lightAccentKeys.has(activeGameKey)
        ? '#090D16'
        : '#FFFFFF';
  const promptSuggestions = customSuggestions ?? SELF_INTRO_SUGGESTIONS;

  const desiredCamPos = useRef(new THREE.Vector3(...CAMERA_PRESETS.stage.pos));
  const desiredCamTarget = useRef(new THREE.Vector3(...CAMERA_PRESETS.stage.target));
  const isUserOrbitingRef = useRef(false);

  // Reactive Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const labRoomMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const labFloorMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const labRoomTexCurrRef = useRef<THREE.Texture | null>(null);
  const labRoomTexPrevRef = useRef<THREE.Texture | null>(null);
  const labRoomBlendRef = useRef<number>(1.0);
  const floorGlowMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const emitterLightRef = useRef<THREE.PointLight | null>(null);
  const frontMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const backMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const hairAuraMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const niagaraMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const niagaraPointsRef = useRef<THREE.Points | null>(null);
  const sparkMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const beamMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const hologramGroupRef = useRef<THREE.Group | null>(null);
  const currentColorTexRef = useRef<THREE.Texture | null>(null);
  const currentDepthTexRef = useRef<THREE.DataTexture | null>(null);
  const currentBackDepthTexRef = useRef<THREE.DataTexture | null>(null);
  const pointerTiltRef = useRef({ x: 0, y: 0 });
  const viewportAspectRef = useRef<number>(1.5);

  const stateRef = useRef({
    emotion,
    gesture,
    isSpeaking,
    isThinking,
    displayMode,
    renderMode,
    focusPreset: 'stage' as CameraFocusPreset,
    frameScale: metaProfile.frameScale,
    silverRatio: metaProfile.hairSilverRatio,
    contrast: metaProfile.cinematicContrast,
    accentHex: matchedCharacter.accentHex || accentHex,
    secondaryHex: matchedCharacter.secondaryHex,
    labRoom: activeLabRoom,
  });

  useEffect(() => {
    stateRef.current = {
      emotion,
      gesture,
      isSpeaking,
      isThinking,
      displayMode,
      renderMode,
      focusPreset: 'stage' as CameraFocusPreset,
      frameScale: metaProfile.frameScale,
      silverRatio: metaProfile.hairSilverRatio,
      contrast: metaProfile.cinematicContrast,
      accentHex: matchedCharacter.accentHex || accentHex,
      secondaryHex: matchedCharacter.secondaryHex,
      labRoom: activeLabRoom,
    };

    const primaryCol = new THREE.Color(matchedCharacter.accentHex || '#38BDF8');
    const secondaryCol = new THREE.Color(matchedCharacter.secondaryHex || '#BAE6FD');
    const roomRimCol = new THREE.Color(activeLabRoom.roomRimHex);
    const beamPrimaryCol = new THREE.Color(activeLabRoom.beamPrimaryHex);
    const beamSecondaryCol = new THREE.Color(activeLabRoom.beamSecondaryHex);
    const floorGlowCol = new THREE.Color(activeLabRoom.floorGlowHex);
    const ambientBgCol = new THREE.Color(activeLabRoom.ambientBgHex);

    if (sceneRef.current) {
      sceneRef.current.background = ambientBgCol.clone();
    }
    if (labRoomMatRef.current) {
      labRoomMatRef.current.uniforms.uBgColor.value.copy(ambientBgCol);
    }
    if (labFloorMatRef.current) {
      labFloorMatRef.current.uniforms.uBgColor.value.copy(ambientBgCol);
      labFloorMatRef.current.uniforms.uGlowColor.value.copy(floorGlowCol);
    }
    if (emitterLightRef.current) {
      emitterLightRef.current.color.copy(beamPrimaryCol);
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.color.copy(beamPrimaryCol).lerp(beamSecondaryCol, 0.55);
    }
    if (keyLightRef.current) {
      keyLightRef.current.color.copy(beamSecondaryCol);
    }
    if (rimLightRef.current) {
      rimLightRef.current.color.copy(roomRimCol);
    }
    if (floorGlowMatRef.current) {
      floorGlowMatRef.current.uniforms.uColor.value.copy(floorGlowCol);
    }
    if (beamMatRef.current) {
      beamMatRef.current.uniforms.uColorPrimary.value.copy(beamPrimaryCol);
      beamMatRef.current.uniforms.uColorSecondary.value.copy(beamSecondaryCol);
    }
    if (sparkMatRef.current) {
      sparkMatRef.current.uniforms.uColor.value.copy(beamSecondaryCol);
    }
    if (frontMatRef.current) {
      frontMatRef.current.uniforms.uColorPrimary.value.copy(primaryCol);
      frontMatRef.current.uniforms.uColorSecondary.value.copy(secondaryCol);
      frontMatRef.current.uniforms.uRoomRimColor.value.copy(roomRimCol);
      frontMatRef.current.uniforms.uSilverRatio.value = metaProfile.hairSilverRatio;
      frontMatRef.current.uniforms.uContrast.value = metaProfile.cinematicContrast;
      frontMatRef.current.uniforms.uOpacityBoost.value =
        renderMode === 'niagara-points' ? 0.24 : 1.0;
    }
    if (backMatRef.current) {
      backMatRef.current.uniforms.uColorPrimary.value.copy(primaryCol);
      backMatRef.current.uniforms.uColorSecondary.value.copy(secondaryCol);
      backMatRef.current.uniforms.uRoomRimColor.value.copy(roomRimCol);
      backMatRef.current.uniforms.uOpacityBoost.value =
        renderMode === 'niagara-points' ? 0.20 : 1.0;
    }
    if (hairAuraMatRef.current) {
      hairAuraMatRef.current.uniforms.uColorPrimary.value.copy(primaryCol);
      hairAuraMatRef.current.uniforms.uRoomRimColor.value.copy(roomRimCol);
      hairAuraMatRef.current.uniforms.uOpacityBoost.value =
        renderMode === 'niagara-points' ? 0.24 : 0.85;
    }
    if (niagaraMatRef.current) {
      niagaraMatRef.current.uniforms.uColorPrimary.value.copy(primaryCol);
      niagaraMatRef.current.uniforms.uSilverRatio.value = metaProfile.hairSilverRatio;
      niagaraMatRef.current.uniforms.uModeBoost.value =
        renderMode === 'niagara-points' ? 1.0 : 0.44;
    }
  }, [
    accentHex,
    activeLabRoom,
    displayMode,
    emotion,
    focusPreset,
    gesture,
    isSpeaking,
    isThinking,
    matchedCharacter.accentHex,
    matchedCharacter.secondaryHex,
    metaProfile.cinematicContrast,
    metaProfile.frameScale,
    metaProfile.hairSilverRatio,
    renderMode,
  ]);

  useEffect(() => {
    const preset = CAMERA_PRESETS.stage;
    desiredCamPos.current.set(...preset.pos);
    desiredCamTarget.current.set(...preset.target);
    isUserOrbitingRef.current = false;
  }, [focusPreset]);

  // Swap Unreal Engine 5.8 Engineering Laboratory Room smoothly whenever the selected game changes
  useEffect(() => {
    const roomMat = labRoomMatRef.current;
    if (!roomMat) return;

    let cancelled = false;
    const roomImg = new Image();
    roomImg.crossOrigin = 'anonymous';
    roomImg.onload = () => {
      if (cancelled) return;
      const nextTex = new THREE.Texture(roomImg);
      nextTex.colorSpace = THREE.SRGBColorSpace;
      nextTex.minFilter = THREE.LinearFilter;
      nextTex.magFilter = THREE.LinearFilter;
      nextTex.needsUpdate = true;

      const oldPrev = labRoomTexPrevRef.current;
      const prevCurr = labRoomTexCurrRef.current;

      if (prevCurr) {
        roomMat.uniforms.uRoomPrev.value = prevCurr;
        labRoomTexPrevRef.current = prevCurr;
        labRoomBlendRef.current = 0.0;
      } else {
        roomMat.uniforms.uRoomPrev.value = nextTex;
        labRoomBlendRef.current = 1.0;
      }

      roomMat.uniforms.uRoomCurr.value = nextTex;
      roomMat.uniforms.uHasRoom.value = 1.0;
      roomMat.uniforms.uBlend.value = labRoomBlendRef.current;
      labRoomTexCurrRef.current = nextTex;

      if (oldPrev && oldPrev !== prevCurr) {
        oldPrev.dispose();
      }
    };
    roomImg.src = activeLabRoom.imageUrl;

    return () => {
      cancelled = true;
    };
  }, [activeLabRoom.imageUrl]);

  // Swap portrait -> Reconstruct Closed 3D Front + Rear Anatomical Depth & Normals + Niagara Cloud
  useEffect(() => {
    const frontMat = frontMatRef.current;
    const backMat = backMatRef.current;
    const hairAuraMat = hairAuraMatRef.current;
    const pointsObj = niagaraPointsRef.current;
    if (!frontMat || !backMat || !hairAuraMat || !pointsObj) return;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      const colorTex = new THREE.Texture(img);
      colorTex.colorSpace = THREE.SRGBColorSpace;
      colorTex.minFilter = THREE.LinearFilter;
      colorTex.magFilter = THREE.LinearFilter;
      colorTex.needsUpdate = true;

      const { normalDepthTex, backNormalDepthTex, niagaraGeo } = processPortraitToVolumetric3D(img);

      const prevColor = currentColorTexRef.current;
      const prevDepth = currentDepthTexRef.current;
      const prevBackDepth = currentBackDepthTexRef.current;
      currentColorTexRef.current = colorTex;
      currentDepthTexRef.current = normalDepthTex;
      currentBackDepthTexRef.current = backNormalDepthTex;

      frontMat.uniforms.uMap.value = colorTex;
      frontMat.uniforms.uNormalDepthMap.value = normalDepthTex;
      frontMat.uniforms.uHasTexture.value = 1.0;

      backMat.uniforms.uMap.value = colorTex;
      backMat.uniforms.uBackNormalDepthMap.value = backNormalDepthTex;
      backMat.uniforms.uHasTexture.value = 1.0;

      hairAuraMat.uniforms.uMap.value = colorTex;
      hairAuraMat.uniforms.uNormalDepthMap.value = normalDepthTex;
      hairAuraMat.uniforms.uHasTexture.value = 1.0;

      if (prevColor) prevColor.dispose();
      if (prevDepth) prevDepth.dispose();
      if (prevBackDepth) prevBackDepth.dispose();

      const oldGeo = pointsObj.geometry;
      pointsObj.geometry = niagaraGeo;
      oldGeo.dispose();
    };
    img.src = activePlateUrl;

    return () => {
      cancelled = true;
    };
  }, [activePlateUrl]);

  // Main Three.js True Volumetric 3D Hologram Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isSoftwareGl = false;
    try {
      const glProbe = document.createElement('canvas').getContext('webgl2');
      if (glProbe) {
        const ext = glProbe.getExtension('WEBGL_debug_renderer_info');
        const gpu = String(glProbe.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : glProbe.RENDERER) ?? '');
        glProbe.getExtension('WEBGL_lose_context')?.loseContext();
        isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render|Mesa/i.test(gpu);
      }
    } catch {
      // ignore probe failure
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
    } catch {
      setWebglReady(false);
      return;
    }

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 460;
    const pixelRatio = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(activeLabRoom.ambientBgHex);
    sceneRef.current = scene;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    viewportAspectRef.current = width / height;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 40);
    camera.position.set(...CAMERA_PRESETS.stage.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 1.85;
    controls.maxDistance = 4.65;
    controls.minPolarAngle = Math.PI * 0.40;
    controls.maxPolarAngle = Math.PI * 0.53;
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.target.set(...CAMERA_PRESETS.stage.target);

    const onControlsStart = () => {
      isUserOrbitingRef.current = true;
    };
    controls.addEventListener('start', onControlsStart);

    // Studio & Hologram Emitter Lights (Matched dynamically to Active UE 5.8 Room)
    const initAmbientCol = new THREE.Color(activeLabRoom.beamPrimaryHex).lerp(
      new THREE.Color(activeLabRoom.beamSecondaryHex),
      0.55
    );
    const ambientLight = new THREE.AmbientLight(initAmbientCol, 0.30);
    ambientLightRef.current = ambientLight;
    scene.add(ambientLight);

    const emitterPointLight = new THREE.PointLight(activeLabRoom.beamPrimaryHex, 5.2, 5.4, 1.5);
    emitterPointLight.position.set(0, 0.32, 0.22);
    emitterLightRef.current = emitterPointLight;
    scene.add(emitterPointLight);

    const keyLight = new THREE.DirectionalLight(activeLabRoom.beamSecondaryHex, 0.95);
    keyLight.position.set(2.2, 3.6, 2.8);
    keyLightRef.current = keyLight;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(activeLabRoom.roomRimHex, 0.95);
    rimLight.position.set(-2.5, 2.2, -2.0);
    rimLightRef.current = rimLight;
    scene.add(rimLight);

    // =========================================================================
    // 0. FULL 360° SEAMLESS 3D UNREAL ENGINE 5.8 ENGINEERING LAB CHAMBER
    //    Mirrored architectural wings wrap 360° so ANY orbit angle stays inside
    //    the rich engineering lab with ZERO dark side wall cutout!
    // =========================================================================
    const labRoomGeo = new THREE.CylinderGeometry(
      7.2,
      7.2,
      8.6,
      96,
      1,
      true,
      0,
      Math.PI * 2
    );
    const labRoomMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: true,
      uniforms: {
        uRoomPrev: { value: null },
        uRoomCurr: { value: null },
        uHasRoom: { value: 0.0 },
        uBlend: { value: 1.0 },
        uTime: { value: 0 },
        uBgColor: { value: new THREE.Color(activeLabRoom.ambientBgHex) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uRoomPrev;
        uniform sampler2D uRoomCurr;
        uniform float uHasRoom;
        uniform float uBlend;
        uniform float uTime;
        uniform vec3 uBgColor;
        varying vec2 vUv;

        void main() {
          if (uHasRoom < 0.5) {
            gl_FragColor = vec4(uBgColor, 1.0);
            return;
          }
          // Map rear-facing 180° arc (centered at vUv.x = 0.5 facing -Z) to roomUv.x in [0,1],
          // and mirror seamlessly into darker architectural server wings beyond ±90°!
          float centered = (0.5 - vUv.x) * 2.15 + 0.5;
          float mirroredX = abs(mod(centered + 1.0, 2.0) - 1.0);
          float wingDim = 1.0 - smoothstep(0.45, 0.92, abs(centered - 0.5)) * 0.35;
          vec2 roomUv = vec2(clamp(mirroredX, 0.004, 0.996), clamp(vUv.y, 0.004, 0.996));

          vec3 prevCol = texture2D(uRoomPrev, roomUv).rgb;
          vec3 currCol = texture2D(uRoomCurr, roomUv).rgb;
          vec3 col = mix(prevCol, currCol, smoothstep(0.0, 1.0, uBlend));

          // Subtle UE 5.8 Lumen volumetric depth separation right behind center character
          vec2 centerDelta = (roomUv - vec2(0.5, 0.54)) * vec2(1.65, 1.25);
          float centerFocus = exp(-dot(centerDelta, centerDelta) * 2.2);
          col *= mix(1.0, 0.78, centerFocus) * wingDim;

          // Smooth top/bottom vertical feather into lab ambient tone
          float vertFade = smoothstep(0.0, 0.08, roomUv.y) * smoothstep(1.0, 0.94, roomUv.y);
          float pulse = 0.985 + 0.015 * sin(uTime * 1.4);
          col = mix(uBgColor, col * pulse, vertFade);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    labRoomMatRef.current = labRoomMat;
    const labRoomMesh = new THREE.Mesh(labRoomGeo, labRoomMat);
    labRoomMesh.position.set(0, 1.06, 0.85);
    labRoomMesh.renderOrder = -10;
    scene.add(labRoomMesh);

    // Wide Dark Obsidian Reflective Architectural Lab Floor (Prevents bottom cutout when orbiting sideways!)
    const labFloorGeo = new THREE.CircleGeometry(10.0, 64);
    const labFloorMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      uniforms: {
        uBgColor: { value: new THREE.Color(activeLabRoom.ambientBgHex) },
        uGlowColor: { value: new THREE.Color(activeLabRoom.floorGlowHex) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uBgColor;
        uniform vec3 uGlowColor;
        varying vec2 vUv;
        void main() {
          float d = length(vUv - vec2(0.5)) * 2.0;
          float outerFade = smoothstep(1.0, 0.48, d);
          float centerPool = exp(-d * d * 28.0);
          float softRing = exp(-pow((d - 0.14) / 0.018, 2.0)) * 0.22;
          vec3 col = uBgColor * 0.92 + uGlowColor * (centerPool * 0.24 + softRing);
          float alpha = outerFade * (0.68 + centerPool * 0.28);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
    labFloorMatRef.current = labFloorMat;
    const labFloorMesh = new THREE.Mesh(labFloorGeo, labFloorMat);
    labFloorMesh.rotation.x = -Math.PI / 2;
    labFloorMesh.position.y = 0.04;
    labFloorMesh.renderOrder = -5;
    scene.add(labFloorMesh);

    // Subtle Soft Volumetric Light Splash aligned directly onto the UE 5.8 Lab Room's Floor Pad
    const floorGlowMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(activeLabRoom.floorGlowHex) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          float d = length(vUv - vec2(0.5)) * 2.0;
          float glow = exp(-d * d * 4.4);
          float alpha = smoothstep(1.0, 0.10, d) * glow * 0.34;
          gl_FragColor = vec4(mix(uColor, vec3(0.84, 0.97, 1.0), glow * 0.35), alpha);
        }
      `,
    });
    floorGlowMatRef.current = floorGlowMat;
    const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 1.65), floorGlowMat);
    floorGlow.rotation.x = -Math.PI / 2;
    floorGlow.position.y = 0.26;
    floorGlow.renderOrder = 0;
    scene.add(floorGlow);

    // Upward Volumetric Holographic Light Cone rising directly from the Laboratory Pad
    const beamMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1.0 },
        uColorPrimary: { value: new THREE.Color(activeLabRoom.beamPrimaryHex) },
        uColorSecondary: { value: new THREE.Color(activeLabRoom.beamSecondaryHex) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vNormalDir;
        varying vec3 vViewDir;
        void main() {
          vUv = uv;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vNormalDir = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uIntensity;
        uniform vec3 uColorPrimary;
        uniform vec3 uColorSecondary;
        varying vec2 vUv;
        varying vec3 vNormalDir;
        varying vec3 vViewDir;
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormalDir, vViewDir)), 1.6);
          float verticalFade = smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.36, 1.0, vUv.y));
          float rays = 0.72 + 0.28 * sin(vUv.x * 36.0 + uTime * 1.1);
          float alpha = verticalFade * (0.04 + 0.11 * fresnel) * rays * uIntensity;
          vec3 col = mix(uColorPrimary, uColorSecondary, 1.0 - vUv.y);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
    beamMatRef.current = beamMat;

    const beamCone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.76, 0.42, 1.38, 64, 1, true),
      beamMat
    );
    beamCone.position.y = 0.96;
    beamCone.renderOrder = 0;
    scene.add(beamCone);

    // Floating 3D Hologram Subject Group — Dead-Center in the UE 5.8 Engineering Lab!
    const hologramGroup = new THREE.Group();
    hologramGroup.position.set(0, 1.16, 0.04);
    hologramGroupRef.current = hologramGroup;
    scene.add(hologramGroup);

    // =========================================================================
    // 1. WATERTIGHT CLOSED 3D ANATOMICAL BUST GEOMETRY (144x192 = 27,648 verts!)
    //    - backMesh (BackSide, depthWrite: true): Solid welded 3D rear cranium,
    //      neck & shoulders (-Z) with ZERO ghost face & ZERO gap at z = 0!
    //    - frontMesh (FrontSide, depthWrite: true): Sculpted 3D nose, brow,
    //      eye sockets, cheekbones, lips, chin, recessed neck & chest (+Z)
    //      with grazing-side anti-stretch holographic transition!
    //    - hairAuraMesh (Additive, depthWrite: false): Silky wispy hair halo!
    // =========================================================================
    const reliefGeo = new THREE.PlaneGeometry(MESH_WIDTH, MESH_HEIGHT, 144, 192);

    // 1A. WELDED SOLID 3D REAR CRANIUM & SHOULDERS (-Z Extrusion, BackSide)
    const backMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: true,
      depthTest: true,
      side: THREE.BackSide,
      blending: THREE.NormalBlending,
      uniforms: {
        uMap: { value: null },
        uBackNormalDepthMap: { value: null },
        uHasTexture: { value: 0.0 },
        uTime: { value: 0 },
        uOpacityBoost: { value: renderMode === 'niagara-points' ? 0.20 : 1.0 },
        uBackDepthScale: { value: BACK_EXTRUDE_SCALE },
        uColorPrimary: { value: new THREE.Color(matchedCharacter.accentHex || '#38BDF8') },
        uColorSecondary: { value: new THREE.Color(matchedCharacter.secondaryHex || '#BAE6FD') },
        uRoomRimColor: { value: new THREE.Color(activeLabRoom.roomRimHex) },
        uLightDirA: { value: new THREE.Vector3(0.65, 0.55, 0.72).normalize() },
        uLightDirB: { value: new THREE.Vector3(-0.75, 0.25, -0.55).normalize() },
      },
      vertexShader: /* glsl */ `
        uniform sampler2D uBackNormalDepthMap;
        uniform float uHasTexture;
        uniform float uTime;
        uniform float uBackDepthScale;

        varying vec2 vUv;
        varying float vBackDepth;
        varying vec3 vObjPos;
        varying vec3 vViewPos;
        varying mat3 vNormalMat;

        void main() {
          vUv = uv;
          vec3 pos = position;
          float bd = uHasTexture > 0.5 ? texture2D(uBackNormalDepthMap, uv).a : 0.0;
          // Extrude cleanly backward along -Z, welding smoothly to frontMesh at z = 0
          pos.z -= bd * uBackDepthScale;
          pos.y += sin(uTime * 1.95) * 0.007;

          vBackDepth = bd;
          vObjPos = pos;
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          vViewPos = -mvPos.xyz;
          vNormalMat = normalMatrix;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        uniform sampler2D uBackNormalDepthMap;
        uniform float uHasTexture;
        uniform float uTime;
        uniform float uOpacityBoost;
        uniform vec3 uColorPrimary;
        uniform vec3 uColorSecondary;
        uniform vec3 uRoomRimColor;
        uniform vec3 uLightDirA;
        uniform vec3 uLightDirB;

        varying vec2 vUv;
        varying float vBackDepth;
        varying vec3 vObjPos;
        varying vec3 vViewPos;
        varying mat3 vNormalMat;

        void main() {
          if (uHasTexture < 0.5 || vBackDepth < 0.28) discard;
          float edgeMaskX = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
          float edgeMaskY = smoothstep(0.02, 0.16, vUv.y) * smoothstep(1.0, 0.96, vUv.y);
          float innerCore = smoothstep(0.28, 0.52, vBackDepth) * edgeMaskX * edgeMaskY;
          if (innerCore < 0.05) discard;

          vec4 bnd = texture2D(uBackNormalDepthMap, vUv);
          vec3 objNormal = normalize(bnd.rgb * 2.0 - 1.0);
          vec3 N = normalize(vNormalMat * objNormal);
          vec3 V = normalize(vViewPos);
          float fresnel = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 2.2);

          vec3 col = mix(uColorPrimary * 0.35, uRoomRimColor, fresnel * 0.65);
          gl_FragColor = vec4(col, innerCore * 0.28 * uOpacityBoost);
        }
      `,
    });
    backMat.depthWrite = false;
    backMatRef.current = backMat;
    const backMesh = new THREE.Mesh(reliefGeo, backMat);
    backMesh.renderOrder = 1;
    hologramGroup.add(backMesh);

    // 1B. TRUE 3D SCULPTED SOLID-CORE FRONT BUST (+Z Extrusion, FrontSide, depthWrite: true)
    //     - Watertight weld to backMesh right at z = 0 (vDepth >= 0.008 -> ZERO gap!)
    //     - Natural 1:1 human head proportions with protruding 3D nose, brow, cheeks, jaw & neck!
    //     - Smooth side-rim transition into matching sapphire holographic shading (zero stretched edge!)
    const frontMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide,
      uniforms: {
        uMap: { value: null },
        uNormalDepthMap: { value: null },
        uHasTexture: { value: 0.0 },
        uTime: { value: 0 },
        uLipSync: { value: 0 },
        uGlitch: { value: 0 },
        uGestureIndex: { value: 0 },
        uEmotionBoost: { value: 1.0 },
        uSilverRatio: { value: metaProfile.hairSilverRatio },
        uContrast: { value: metaProfile.cinematicContrast },
        uOpacityBoost: { value: renderMode === 'niagara-points' ? 0.24 : 1.0 },
        uDepthScale: { value: DEPTH_EXTRUDE_SCALE },
        uColorPrimary: { value: new THREE.Color(matchedCharacter.accentHex || '#38BDF8') },
        uColorSecondary: { value: new THREE.Color(matchedCharacter.secondaryHex || '#BAE6FD') },
        uRoomRimColor: { value: new THREE.Color(activeLabRoom.roomRimHex) },
        uLightDirA: { value: new THREE.Vector3(0.65, 0.55, 0.72).normalize() },
        uLightDirB: { value: new THREE.Vector3(-0.75, 0.25, 0.45).normalize() },
      },
      vertexShader: /* glsl */ `
        uniform sampler2D uNormalDepthMap;
        uniform float uHasTexture;
        uniform float uTime;
        uniform float uLipSync;
        uniform float uGlitch;
        uniform float uGestureIndex;
        uniform float uDepthScale;

        varying vec2 vUv;
        varying float vDepth;
        varying vec3 vWorldPos;
        varying vec3 vObjPos;
        varying vec3 vViewPos;
        varying mat3 vNormalMat;

        void main() {
          vUv = uv;
          vec3 pos = position;

          float depth = 0.0;
          if (uHasTexture > 0.5) {
            depth = texture2D(uNormalDepthMap, uv).a;
          }

          // Anatomically calibrated 3D extrusion along +Z
          pos.z += depth * uDepthScale;
          vDepth = depth;

          // Alive breathing + voice lip-sync jaw/mouth displacement
          pos.y += sin(uTime * 1.95) * 0.007;
          float mouthMask = exp(-pow((uv.x - 0.5) / 0.11, 2.0) - pow((uv.y - 0.60) / 0.065, 2.0));
          pos.z += mouthMask * uLipSync * 0.022;
          pos.y -= mouthMask * uLipSync * 0.005;

          // Subtle kinetic posture response to selected gesture
          if (uGestureIndex > 0.5 && uGestureIndex < 1.5) {
            pos.x += sin(uTime * 3.6 + uv.y * 2.4) * 0.012;
          } else if (uGestureIndex > 2.5 && uGestureIndex < 3.5) {
            pos.z += sin(uTime * 2.6) * 0.012;
          }

          // Micro holographic glitch slice
          float glitchBand = step(0.96, sin(uv.y * 34.0 + uTime * 22.0));
          pos.x += glitchBand * uGlitch * sin(uTime * 71.0) * 0.014;

          vObjPos = pos;
          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPos = worldPos.xyz;
          vec4 mvPos = viewMatrix * worldPos;
          vViewPos = -mvPos.xyz;
          vNormalMat = normalMatrix;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        uniform sampler2D uNormalDepthMap;
        uniform float uHasTexture;
        uniform float uTime;
        uniform float uLipSync;
        uniform float uGlitch;
        uniform float uEmotionBoost;
        uniform float uSilverRatio;
        uniform float uContrast;
        uniform float uOpacityBoost;
        uniform vec3 uColorPrimary;
        uniform vec3 uColorSecondary;
        uniform vec3 uRoomRimColor;
        uniform vec3 uLightDirA;
        uniform vec3 uLightDirB;

        varying vec2 vUv;
        varying float vDepth;
        varying vec3 vWorldPos;
        varying vec3 vObjPos;
        varying vec3 vViewPos;
        varying mat3 vNormalMat;

        void main() {
          if (uHasTexture < 0.5) discard;

          vec3 V = normalize(vViewPos);
          vec2 sampleUv = vUv;

          // Sample RGB + Reconstructed 3D Surface Normal & Depth
          float shift = uGlitch * 0.0024;
          vec3 tex = texture2D(uMap, sampleUv).rgb;
          float rShift = texture2D(uMap, clamp(sampleUv + vec2(shift, 0.0), 0.0, 1.0)).r;
          float bShift = texture2D(uMap, clamp(sampleUv - vec2(shift, 0.0), 0.0, 1.0)).b;
          vec3 rawCol = vec3(mix(tex.r, rShift, 0.55), tex.g, mix(tex.b, bShift, 0.55));

          vec4 ndSample = texture2D(uNormalDepthMap, sampleUv);
          float depthVal = max(vDepth, ndSample.a);
          float maxCh = max(rawCol.r, max(rawCol.g, rawCol.b));
          float luma = dot(rawCol, vec3(0.2126, 0.7152, 0.0722));

          // Silky clean silhouette & wispy hair feathering (zero dark outline!)
          float edgeMaskX = smoothstep(0.0, 0.07, sampleUv.x) * smoothstep(1.0, 0.93, sampleUv.x);
          float edgeMaskY = smoothstep(0.015, 0.16, sampleUv.y) * smoothstep(1.0, 0.95, sampleUv.y);
          float lumaKey = smoothstep(0.045, 0.23, maxCh);
          float coreSolid = smoothstep(0.18, 0.42, depthVal) * 0.92;
          float keyAlpha = clamp(max(lumaKey, coreSolid), 0.0, 1.0) * edgeMaskX * edgeMaskY;
          if (keyAlpha < 0.04) discard;

          // 2. Real-Time 3D Normal-Mapped Dynamic Lighting + Lab Room Lumen Rim Integration
          vec3 objNormal = normalize(ndSample.rgb * 2.0 - 1.0);
          vec3 N = normalize(vNormalMat * objNormal);

          float diffA = max(0.0, dot(N, uLightDirA));
          vec3 halfA = normalize(uLightDirA + V);
          float specA = pow(max(0.0, dot(N, halfA)), 34.0);

          float diffB = max(0.0, dot(N, uLightDirB));
          vec3 halfB = normalize(uLightDirB + V);
          float specB = pow(max(0.0, dot(N, halfB)), 22.0);

          float ndotv = clamp(abs(dot(N, V)), 0.0, 1.0);
          float fresnel = pow(1.0 - ndotv, 2.4);
          float highlightGuard = 1.0 - smoothstep(0.55, 0.92, luma) * 0.65;

          float ao = mix(0.76, 1.12, smoothstep(0.08, 0.76, depthVal));

          // 3. Photorealistic Filmic Hologram Color Grading (Razor-Sharp Eyes & Features!)
          vec3 graded = pow(max(rawCol, vec3(0.0)), vec3(1.0 / uContrast));
          vec3 legendTint = mix(uColorPrimary, uColorSecondary, smoothstep(0.30, 0.88, luma));
          vec3 silverTint = vec3(0.86, 0.95, 1.0);
          vec3 targetHue = mix(legendTint, silverTint, uSilverRatio * 0.38);

          vec3 baseCol = mix(graded * 0.97, legendTint * (luma * 1.28), 0.14);
          baseCol = mix(baseCol, baseCol * targetHue * 1.14, 0.16);

          vec3 litCol = baseCol * ao * (0.76 + 0.32 * diffA + 0.14 * diffB);
          litCol += uColorSecondary * specA * 0.25 * highlightGuard;
          litCol += uRoomRimColor * specB * 0.20 * highlightGuard;
          litCol += mix(uRoomRimColor, vec3(0.86, 0.98, 1.0), 0.38) * fresnel * 0.42 * highlightGuard;

          // Soft filmic knee prevents bright cheeks/teeth from clipping to flat cyan-white
          vec3 excess = max(vec3(0.0), litCol - vec3(0.84));
          litCol = litCol - excess + excess / (1.0 + excess * 1.65);

          // 4. Face-Safe 3D Volumetric Topographic Contours & Curved 3D Laser Scan
          float faceCore = exp(-pow((sampleUv.x - 0.5) / 0.17, 2.0) - pow((sampleUv.y - 0.72) / 0.16, 2.0));
          float bodyMask = 1.0 - faceCore * 0.80;

          float topoPhase = fract(vObjPos.z * 28.0 - uTime * 0.24);
          float topoLine = smoothstep(0.92, 0.995, topoPhase) * 0.16 * bodyMask;

          float scanY = mix(-0.92, 0.92, fract(uTime * 0.15));
          float curvedScanDist = abs((vObjPos.y + vObjPos.z * 0.48) - scanY);
          float scanLaser = exp(-pow(curvedScanDist / 0.032, 2.0)) * (0.42 + 0.58 * bodyMask);

          float fineScan = 0.95 + 0.05 * sin(vWorldPos.y * 220.0 - uTime * 3.6);
          float mouthZone = exp(-pow((sampleUv.x - 0.5) / 0.10, 2.0) - pow((sampleUv.y - 0.60) / 0.06, 2.0));
          float voiceGlow = mouthZone * uLipSync * 0.28;

          vec3 finalCol = litCol * fineScan * uEmotionBoost;
          finalCol += uColorSecondary * topoLine;
          finalCol += mix(uRoomRimColor, vec3(0.75, 0.97, 1.0), 0.55) * scanLaser * 0.34;
          finalCol += vec3(0.55, 0.92, 1.0) * voiceGlow;

          float alpha = clamp(keyAlpha * 0.96 * uOpacityBoost, 0.0, 0.97);
          gl_FragColor = vec4(finalCol, alpha);
        }
      `,
    });
    frontMatRef.current = frontMat;

    const frontMesh = new THREE.Mesh(reliefGeo, frontMat);
    frontMesh.renderOrder = 2;
    hologramGroup.add(frontMesh);

    // 1C. SILKY WISPY HAIR & HOLOGRAPHIC EDGE AURA (Additive, depthWrite: false)
    //     Preserves delicate flowing hair strands outside the solid Z-writing core!
    const hairAuraMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uMap: { value: null },
        uNormalDepthMap: { value: null },
        uHasTexture: { value: 0.0 },
        uTime: { value: 0 },
        uOpacityBoost: { value: renderMode === 'niagara-points' ? 0.24 : 0.85 },
        uDepthScale: { value: DEPTH_EXTRUDE_SCALE },
        uColorPrimary: { value: new THREE.Color(matchedCharacter.accentHex || '#38BDF8') },
        uRoomRimColor: { value: new THREE.Color(activeLabRoom.roomRimHex) },
      },
      vertexShader: /* glsl */ `
        uniform sampler2D uNormalDepthMap;
        uniform float uHasTexture;
        uniform float uTime;
        uniform float uDepthScale;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float d = uHasTexture > 0.5 ? texture2D(uNormalDepthMap, uv).a : 0.0;
          pos.z += d * uDepthScale + 0.004;
          pos.y += sin(uTime * 1.95) * 0.007;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        uniform sampler2D uNormalDepthMap;
        uniform float uHasTexture;
        uniform float uOpacityBoost;
        uniform vec3 uColorPrimary;
        uniform vec3 uRoomRimColor;
        varying vec2 vUv;
        void main() {
          if (uHasTexture < 0.5) discard;
          vec3 raw = texture2D(uMap, vUv).rgb;
          float d = texture2D(uNormalDepthMap, vUv).a;
          float maxCh = max(raw.r, max(raw.g, raw.b));
          float edgeMaskX = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
          float edgeMaskY = smoothstep(0.02, 0.16, vUv.y) * smoothstep(1.0, 0.96, vUv.y);
          // Only illuminate delicate outer fringe (hair wisps & contour halo)
          float fringe = smoothstep(0.025, 0.14, maxCh) * (1.0 - smoothstep(0.14, 0.26, d));
          float alpha = fringe * edgeMaskX * edgeMaskY * 0.42 * uOpacityBoost;
          if (alpha < 0.01) discard;
          vec3 col = mix(raw, mix(uColorPrimary, uRoomRimColor, 0.45), 0.45);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
    hairAuraMatRef.current = hairAuraMat;
    const hairAuraMesh = new THREE.Mesh(reliefGeo, hairAuraMat);
    hairAuraMesh.renderOrder = 3;
    hologramGroup.add(hairAuraMesh);

    // =========================================================================
    // 3. SYNCHRONIZED 3D VOLUMETRIC NIAGARA POINT CLOUD (FRONT + BACK SHELL)
    // =========================================================================
    const niagaraMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uLipSync: { value: 0 },
        uGlitch: { value: 0 },
        uModeBoost: { value: renderMode === 'niagara-points' ? 1.0 : 0.46 },
        uSilverRatio: { value: metaProfile.hairSilverRatio },
        uColorPrimary: { value: new THREE.Color(matchedCharacter.accentHex || '#38BDF8') },
      },
      vertexShader: /* glsl */ `
        attribute float aIntensity;
        attribute float aPhase;
        attribute vec2 aUv;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uLipSync;
        uniform float uGlitch;
        uniform float uModeBoost;
        varying float vIntensity;
        varying float vTwinkle;

        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * 1.95) * 0.007;

          float mouthMask = exp(-pow((aUv.x - 0.5) / 0.11, 2.0) - pow((aUv.y - 0.60) / 0.065, 2.0));
          pos.z += mouthMask * uLipSync * 0.030;

          float glitchBand = step(0.96, sin(aUv.y * 34.0 + uTime * 22.0));
          pos.x += glitchBand * uGlitch * sin(uTime * 71.0) * 0.022;

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPos;

          float dprScale = pow(uPixelRatio, 0.42);
          float basePx = mix(3.8, 6.2, uModeBoost) * (0.60 + 0.45 * aIntensity);
          gl_PointSize = clamp((basePx * dprScale) / max(0.9, -mvPos.z), 1.3, 6.8);

          vIntensity = aIntensity;
          vTwinkle = 0.72 + 0.28 * sin(uTime * 3.8 + aPhase);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColorPrimary;
        uniform float uSilverRatio;
        uniform float uModeBoost;
        varying float vIntensity;
        varying float vTwinkle;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float core = smoothstep(0.5, 0.08, dist);
          vec3 iceCol = vec3(0.84, 0.96, 1.0);
          vec3 col = mix(uColorPrimary, iceCol, clamp(vIntensity * 0.55 + uSilverRatio * 0.25, 0.0, 1.0));
          float alpha = core * vTwinkle * mix(0.24, 0.88, uModeBoost) * clamp(vIntensity, 0.25, 1.0);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
    niagaraMatRef.current = niagaraMat;

    const niagaraPoints = new THREE.Points(new THREE.BufferGeometry(), niagaraMat);
    niagaraPoints.renderOrder = 3;
    niagaraPointsRef.current = niagaraPoints;
    hologramGroup.add(niagaraPoints);

    // =========================================================================
    // 4. VOLUMETRIC EMITTER SPARKS & LAB ATMOSPHERIC DUST (DEPTH-OCCLUDED!)
    // =========================================================================
    const sparksGeo = buildVolumetricOrbitSparks(520);
    const sparksMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uColor: { value: new THREE.Color(activeLabRoom.beamSecondaryHex) },
      },
      vertexShader: /* glsl */ `
        attribute float aIntensity;
        attribute float aPhase;
        attribute float aOrbitSpeed;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vAlpha;

        void main() {
          vec3 pos = position;
          float ang = uTime * aOrbitSpeed;
          float c = cos(ang);
          float s = sin(ang);
          vec2 rotXZ = vec2(pos.x * c - pos.z * s, pos.x * s + pos.z * c);
          pos.x = rotXZ.x;
          pos.z = rotXZ.y;

          float lift = fract(aPhase * 0.16 + uTime * 0.16);
          pos.y = 0.16 + mod(pos.y + lift * 1.05, 1.92);

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPos;
          float dprScale = pow(uPixelRatio, 0.42);
          gl_PointSize = clamp((4.8 * aIntensity * dprScale) / max(1.0, -mvPos.z), 1.3, 5.4);
          vAlpha = aIntensity * (0.45 + 0.55 * sin(uTime * 2.8 + aPhase)) * (1.0 - smoothstep(1.35, 2.02, pos.y));
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float glow = smoothstep(0.5, 0.05, dist);
          gl_FragColor = vec4(uColor, glow * vAlpha * 0.78);
        }
      `,
    });
    sparkMatRef.current = sparksMat;
    const emitterSparks = new THREE.Points(sparksGeo, sparksMat);
    emitterSparks.renderOrder = 4;
    scene.add(emitterSparks);

    // Immediately load initial UE 5.8 Engineering Lab Room backdrop
    const initRoomImg = new Image();
    initRoomImg.crossOrigin = 'anonymous';
    initRoomImg.onload = () => {
      if (unmounted || labRoomTexCurrRef.current) return;
      const roomTex = new THREE.Texture(initRoomImg);
      roomTex.colorSpace = THREE.SRGBColorSpace;
      roomTex.minFilter = THREE.LinearFilter;
      roomTex.magFilter = THREE.LinearFilter;
      roomTex.needsUpdate = true;
      labRoomTexCurrRef.current = roomTex;
      labRoomMat.uniforms.uRoomPrev.value = roomTex;
      labRoomMat.uniforms.uRoomCurr.value = roomTex;
      labRoomMat.uniforms.uHasRoom.value = 1.0;
      labRoomMat.uniforms.uBlend.value = 1.0;
    };
    initRoomImg.src = activeLabRoom.imageUrl;

    // Immediately load initial active character plate -> Reconstruct closed 3D front & rear bust
    const initialImg = new Image();
    initialImg.crossOrigin = 'anonymous';
    initialImg.onload = () => {
      const colorTex = new THREE.Texture(initialImg);
      colorTex.colorSpace = THREE.SRGBColorSpace;
      colorTex.minFilter = THREE.LinearFilter;
      colorTex.magFilter = THREE.LinearFilter;
      colorTex.needsUpdate = true;

      const { normalDepthTex, backNormalDepthTex, niagaraGeo } =
        processPortraitToVolumetric3D(initialImg);
      currentColorTexRef.current = colorTex;
      currentDepthTexRef.current = normalDepthTex;
      currentBackDepthTexRef.current = backNormalDepthTex;

      frontMat.uniforms.uMap.value = colorTex;
      frontMat.uniforms.uNormalDepthMap.value = normalDepthTex;
      frontMat.uniforms.uHasTexture.value = 1.0;

      backMat.uniforms.uMap.value = colorTex;
      backMat.uniforms.uBackNormalDepthMap.value = backNormalDepthTex;
      backMat.uniforms.uHasTexture.value = 1.0;

      hairAuraMat.uniforms.uMap.value = colorTex;
      hairAuraMat.uniforms.uNormalDepthMap.value = normalDepthTex;
      hairAuraMat.uniforms.uHasTexture.value = 1.0;

      const oldGeo = niagaraPoints.geometry;
      niagaraPoints.geometry = niagaraGeo;
      oldGeo.dispose();
    };
    initialImg.src = activePlateUrl;

    // Interactive subtle pointer parallax so hovering feels like a real floating 3D sculpture
    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      pointerTiltRef.current.x = Math.max(-1, Math.min(1, nx));
      pointerTiltRef.current.y = Math.max(-1, Math.min(1, ny));
    };
    const onPointerLeave = () => {
      pointerTiltRef.current.x = 0;
      pointerTiltRef.current.y = 0;
    };
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    // Responsive resize handling
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(240, Math.floor(entry.contentRect.width));
        const h = Math.max(240, Math.floor(entry.contentRect.height));
        const aspect = w / h;
        viewportAspectRef.current = aspect;
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    // 60fps Animation Loop (paced via afterDraw on software WebGL)
    let rafId = 0;
    let unmounted = false;
    const startMs = performance.now();
    let smoothedLip = 0;
    let currentScale = stateRef.current.frameScale;
    let smoothTiltX = 0;
    let smoothTiltY = 0;
    const dynCamGoal = new THREE.Vector3();

    const afterDraw = (cb: () => void) => {
      if (unmounted) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (unmounted) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            rafId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            rafId = window.setTimeout(cb, 80);
          }
        };
        rafId = window.setTimeout(poll, 5);
      } else {
        rafId = window.setTimeout(cb, 80);
      }
    };

    let lastFrameMs = performance.now();
    const animate = () => {
      if (unmounted) return;
      const nowMs = performance.now();
      const deltaSec = Math.min(0.18, Math.max(0.016, (nowMs - lastFrameMs) * 0.001));
      lastFrameMs = nowMs;
      const elapsed = (nowMs - startMs) * 0.001;
      const s = stateRef.current;

      smoothTiltX += (pointerTiltRef.current.x - smoothTiltX) * 0.06;
      smoothTiltY += (pointerTiltRef.current.y - smoothTiltY) * 0.06;

      // Smoothly cross-fade UE 5.8 Room texture (~200ms on GPU, crisp 2-step fade on software WebGL)
      if (labRoomBlendRef.current < 1.0) {
        const blendStep = isSoftwareGl ? 0.65 : deltaSec * 5.2;
        labRoomBlendRef.current = Math.min(1.0, labRoomBlendRef.current + blendStep);
        labRoomMat.uniforms.uBlend.value = labRoomBlendRef.current;
      }
      labRoomMat.uniforms.uTime.value = elapsed;

      if (!isUserOrbitingRef.current) {
        const isNarrow = viewportAspectRef.current < 1.1;
        const zPullback = isNarrow && s.focusPreset === 'overview' ? 0.32 : 0.0;
        const swayAmp = s.focusPreset === 'face' ? 0.14 : 0.24;
        dynCamGoal.set(
          desiredCamPos.current.x + Math.sin(elapsed * 0.68) * swayAmp + smoothTiltX * 0.22,
          desiredCamPos.current.y + Math.sin(elapsed * 0.45) * 0.04 - smoothTiltY * 0.10,
          desiredCamPos.current.z + zPullback
        );
        camera.position.lerp(dynCamGoal, 0.045);
      }
      controls.target.lerp(desiredCamTarget.current, 0.07);
      controls.update();

      const rawLip = computeLipSyncAmplitude(s.isSpeaking, elapsed, audioRmsRef.current);
      smoothedLip += (rawLip - smoothedLip) * 0.24;

      const glitchBase = s.isThinking ? 0.42 : s.emotion === 'Alert' ? 0.65 : 0.10;
      const pulse = Math.pow(Math.max(0, Math.sin(elapsed * 2.1) * Math.sin(elapsed * 7.3)), 6.0);
      const glitchVal = glitchBase * pulse;

      currentScale += (s.frameScale - currentScale) * 0.08;
      hologramGroup.scale.set(
        s.displayMode === 'peppers-ghost' ? -currentScale : currentScale,
        currentScale,
        currentScale
      );

      const dxCam = camera.position.x - hologramGroup.position.x;
      const dzCam = camera.position.z - hologramGroup.position.z;
      const camYaw = Math.atan2(dxCam, dzCam);
      const camHorizDist = Math.max(0.001, Math.hypot(dxCam, dzCam));
      const camPitch = Math.atan2(camera.position.y - hologramGroup.position.y, camHorizDist);

      hologramGroup.rotation.order = 'YXZ';
      hologramGroup.rotation.y = camYaw + Math.sin(elapsed * 0.58) * 0.025 + smoothTiltX * 0.025;
      hologramGroup.rotation.x = -camPitch * 0.35 + Math.sin(elapsed * 0.41) * 0.012 + smoothTiltY * 0.02;
      hologramGroup.position.y = 1.16 + Math.sin(elapsed * 1.45) * 0.014;

      frontMat.uniforms.uLightDirA.value
        .set(
          Math.cos(elapsed * 0.85 - camYaw * 0.9) * 0.78 + smoothTiltX * 0.32,
          0.52 + Math.sin(elapsed * 0.5) * 0.18,
          0.74
        )
        .normalize();
      frontMat.uniforms.uLightDirB.value
        .set(-Math.cos(elapsed * 0.65 - camYaw * 0.9) * 0.82, 0.22, 0.50)
        .normalize();

      backMat.uniforms.uLightDirA.value.copy(frontMat.uniforms.uLightDirA.value);
      backMat.uniforms.uLightDirB.value
        .set(-Math.cos(elapsed * 0.65 - camYaw * 0.9) * 0.75, 0.32, -0.58)
        .normalize();

      frontMat.uniforms.uTime.value = elapsed;
      frontMat.uniforms.uLipSync.value = smoothedLip;
      frontMat.uniforms.uGlitch.value = glitchVal;
      frontMat.uniforms.uGestureIndex.value = mapGestureToIndex(s.gesture);
      frontMat.uniforms.uEmotionBoost.value = mapEmotionToIntensity(s.emotion);

      backMat.uniforms.uTime.value = elapsed;
      hairAuraMat.uniforms.uTime.value = elapsed;

      niagaraMat.uniforms.uTime.value = elapsed;
      niagaraMat.uniforms.uLipSync.value = smoothedLip;
      niagaraMat.uniforms.uGlitch.value = glitchVal;

      sparksMat.uniforms.uTime.value = elapsed;
      beamMat.uniforms.uTime.value = elapsed;
      beamMat.uniforms.uIntensity.value = s.isSpeaking ? 1.24 : s.isThinking ? 1.14 : 0.94;

      emitterPointLight.intensity = 4.8 + smoothedLip * 2.0 + Math.sin(elapsed * 2.5) * 0.35;

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(animate);
      else rafId = window.requestAnimationFrame(animate);
    };
    rafId = window.requestAnimationFrame(animate);

    return () => {
      unmounted = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(rafId);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      controls.removeEventListener('start', onControlsStart);
      resizeObserver.disconnect();
      controls.dispose();
      envTex.dispose();
      pmrem.dispose();
      labRoomGeo.dispose();
      labRoomMat.dispose();
      labFloorGeo.dispose();
      labFloorMat.dispose();
      labRoomTexCurrRef.current?.dispose();
      labRoomTexPrevRef.current?.dispose();
      floorGlowMat.dispose();
      reliefGeo.dispose();
      frontMat.dispose();
      backMat.dispose();
      hairAuraMat.dispose();
      niagaraPoints.geometry.dispose();
      niagaraMat.dispose();
      sparksGeo.dispose();
      sparksMat.dispose();
      beamMat.dispose();
      currentColorTexRef.current?.dispose();
      currentDepthTexRef.current?.dispose();
      currentBackDepthTexRef.current?.dispose();
      renderer.dispose();
      ambientLightRef.current = null;
      keyLightRef.current = null;
      rimLightRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = promptInput.trim();
    if (!trimmed || isThinking) return;
    onSendPrompt(trimmed);
    setPromptInput('');
  };

  return (
    <section
      data-testid="spatial-stage-3d"
      data-game-frame={activeGameKey}
      data-lab-room={activeLabRoom.imageUrl}
      data-camera-locked="stage"
      className={`relative flex flex-col transition-colors duration-300 ${frameConfig.outerClass}`}
      style={frameConfig.clipStyle}
    >
      {/* Minimal Game-Native Frame Header */}
      <div
        className={`px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3 ${frameConfig.headerBgClass}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-2 h-2 rounded-xs shrink-0"
            style={{ backgroundColor: frameConfig.accentHex }}
          />
          <span
            className={`text-[11.5px] font-extrabold tracking-[0.14em] uppercase truncate ${frameConfig.titleColorClass}`}
          >
            {frameConfig.badgeLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            data-testid="matched-character-name-fa"
            className={`text-[12px] font-bold truncate max-w-[160px] ${frameConfig.subtitleColorClass}`}
          >
            {matchedCharacter.nameFa}
          </span>
          <button
            type="button"
            data-testid="toggle-voice-btn"
            onClick={onToggleVoiceEnabled}
            aria-label={voiceEnabled ? 'بی‌صدا کردن کاراکتر' : 'فعال‌سازی صدای کاراکتر'}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition cursor-pointer ${
              voiceEnabled
                ? 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                : 'bg-white/5 text-white/40 border-white/10'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Hero UE 5.8 3D Character Viewport (Zero backdrop-blur over WebGL canvas) */}
      <div className="relative w-full h-[430px] sm:h-[510px] bg-[#050b16]">
        {webglReady ? (
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center bg-cover bg-center"
            style={{ backgroundImage: `url(${activeLabRoom.imageUrl})` }}
          >
            <img
              src={activePlateUrl}
              alt={matchedCharacter.nameEn}
              referrerPolicy="no-referrer"
              className="h-[88%] w-auto object-contain"
            />
          </div>
        )}

        {/* Camera is locked permanently to 3D Stage view (نمای ۳ بعدی) — no camera mode switcher */}

        {/* Compact Character Nameplate (Bottom-Right, solid dark surface, zero backdrop-blur) */}
        <div
          dir="rtl"
          data-testid="stage-matched-badge"
          className="hidden sm:flex items-center gap-2 absolute bottom-3 right-3 bg-[#071122]/92 border border-white/15 rounded-xl px-3 py-1.5"
        >
          <span className="text-[12px] font-bold text-white">{matchedCharacter.nameFa}</span>
          <span
            className="text-[11px] font-mono-tabular font-bold"
            style={{ color: frameConfig.accentHex }}
          >
            {similarityPct}%
          </span>
        </div>
      </div>

      {/* Minimal Self-Intro Chat Bar (User talks about themselves to build/morph their live character) */}
      <div
        dir="rtl"
        className="px-4 sm:px-5 py-4 flex flex-col gap-3 bg-[#0A0E17]/95 border-t border-white/10 text-slate-100"
      >
        <p
          dir="auto"
          data-testid="hologram-live-transcript"
          className="text-[12.5px] leading-relaxed rounded-xl px-3.5 py-2.5 bg-white/6 border border-white/10 text-slate-100"
        >
          {liveTranscript}
        </p>

        {agentError && (
          <p className="text-[11.5px] text-rose-300 bg-rose-950/40 border border-rose-500/35 rounded-xl px-3 py-2">
            {agentError}
          </p>
        )}

        {/* Quick Self-Intro Prompt Starters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {promptSuggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              data-testid={`self-intro-starter-${idx}`}
              onClick={() => onSendPrompt(suggestion)}
              disabled={isThinking}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-white/12 bg-white/5 text-slate-300 hover:bg-white/12 hover:text-white transition cursor-pointer text-right"
            >
              «{suggestion}»
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmitPrompt} className="flex items-center gap-2">
          <button
            type="button"
            data-testid="hologram-mic-btn"
            onClick={onToggleMic}
            aria-label={isListeningMic ? 'توقف ضبط صدا' : 'صحبت صوتی با کاراکتر'}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition cursor-pointer shrink-0 ${
              isListeningMic
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white/8 text-slate-200 border-white/15 hover:bg-white/14'
            }`}
          >
            {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            dir="auto"
            data-testid="hologram-prompt-input"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder={
              customPlaceholder ??
              'از خودت بگو... (اسم، سن، روحیه یا بازی موردعلاقه‌ات تا کاراکترت زنده ساخته بشه)'
            }
            className="flex-1 min-w-0 h-10 px-3.5 rounded-xl border border-white/15 bg-white/8 text-[12.5px] text-white placeholder:text-slate-400 focus:outline-none focus:border-white/45"
          />

          <button
            type="submit"
            data-testid="hologram-send-btn"
            disabled={isThinking || !promptInput.trim()}
            className="h-10 px-4 rounded-xl text-[12px] font-bold transition inline-flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-45"
            style={{
              backgroundColor: frameConfig.accentHex,
              color: sendBtnTextColor,
            }}
          >
            {isThinking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            ارسال
          </button>
        </form>
      </div>
    </section>
  );
};
