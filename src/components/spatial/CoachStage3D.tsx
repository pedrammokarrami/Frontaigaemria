import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PageLoadGate } from './PageLoadGate';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { REALM_CONFIGS } from '../../data/realmsData';
import type { MediaManifest, RealmId } from '../../types/spatial';

interface CoachStage3DProps {
  realm: RealmId;
  manifest: MediaManifest;
  isSpeaking: boolean;
  useVideoBackdrop?: boolean;
  inspectGlb?: boolean;
  customBackdropUrl?: string | null;
  customAccentHex?: string | null;
  customSecondaryHex?: string | null;
}

const _pointer = new THREE.Vector2(0, 0);
const PARTICLE_COUNT = 110;

function detectSoftwareGl(renderer: THREE.WebGLRenderer): boolean {
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) {
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render|Mesa/i.test(
        String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '')
      );
    }
  } catch {
    // ignore
  }
  return false;
}

function disposeGroup(group: THREE.Object3D): void {
  group.traverse((obj) => {
    if (
      (obj as THREE.Mesh).isMesh ||
      (obj as THREE.Line).isLine ||
      (obj as THREE.Points).isPoints
    ) {
      const m = obj as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material;
      if (Array.isArray(mat)) mat.forEach((item) => item.dispose());
      else mat?.dispose();
    }
  });
}

function createSoftParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.65)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const CoachStage3D: React.FC<CoachStage3DProps> = ({
  realm,
  manifest,
  isSpeaking,
  useVideoBackdrop = false,
  inspectGlb = false,
  customBackdropUrl = null,
  customAccentHex = null,
  customSecondaryHex = null,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  // Page-load gate: entry is blocked until the lobby backdrop (video frame or
  // fallback image) has actually rendered — never a black flash behind menus.
  const [videoReady, setVideoReady] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  const cfg = REALM_CONFIGS[realm];
  const activeImageUrl = customBackdropUrl || cfg.ue5SceneImageUrl;
  const activeAccentHex = customAccentHex || cfg.accentHex;
  const activeSecondaryHex = customSecondaryHex || cfg.secondaryHex;
  const isSpeakingRef = useRef(isSpeaking);
  isSpeakingRef.current = isSpeaking;
  const realmRef = useRef<RealmId>(realm);
  realmRef.current = realm;

  useEffect(() => {
    setImgFailed(false);
  }, [realm, activeImageUrl]);

  const sceneRefs = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    atmosphereGroup: THREE.Group;
    artifactGroup: THREE.Group;
    particlePositions: Float32Array;
    particleVelocities: Float32Array;
    particleGeo: THREE.BufferGeometry;
    particleMat: THREE.PointsMaterial;
    voiceRing: THREE.Mesh;
    voiceRingMat: THREE.MeshBasicMaterial;
    keyLight: THREE.DirectionalLight;
    rimLight: THREE.DirectionalLight;
    isSoftwareGl: boolean;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    const isSoftwareGl = detectSoftwareGl(renderer);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 40);
    camera.position.set(0, 0, 5.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = 0.9;
    controls.maxPolarAngle = 1.85;
    controls.update();

    const hemiLight = new THREE.HemisphereLight(0x94a3b8, 0x080a0f, 0.65);
    const keyLight = new THREE.DirectionalLight(0xff6b00, 2.5);
    keyLight.position.set(2.4, 2.8, 3.2);
    const rimLight = new THREE.DirectionalLight(0xf59e0b, 3.0);
    rimLight.position.set(-1.8, 2.4, -3.0);
    scene.add(hemiLight, keyLight, rimLight);

    const atmosphereGroup = new THREE.Group();
    const artifactGroup = new THREE.Group();
    scene.add(atmosphereGroup, artifactGroup);

    // Pre-allocated Zero-GC Unreal 5.8 Volumetric Particle System (Sparks / Stadium Rain / Arcane Dust / Campfire Embers)
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleVelocities = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.35) * 7.5;
      particlePositions[i3 + 1] = (Math.random() - 0.5) * 4.6;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 2.8;

      particleVelocities[i3] = (Math.random() - 0.45) * 0.25;
      particleVelocities[i3 + 1] = 0.22 + Math.random() * 0.48;
      particleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.12;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleTex = createSoftParticleTexture();
    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color(REALM_CONFIGS[realmRef.current].accentHex),
      size: 0.075,
      map: particleTex,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particlePoints = new THREE.Points(particleGeo, particleMat);
    atmosphereGroup.add(particlePoints);

    // Subtle Audio-Reactive Spatial Pulse Ring positioned on the right character stage when Coach speaks
    const voiceRingMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(REALM_CONFIGS[realmRef.current].accentHex),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    const voiceRing = new THREE.Mesh(new THREE.RingGeometry(0.95, 0.99, 64), voiceRingMat);
    voiceRing.position.set(1.05, -1.25, 0.2);
    voiceRing.rotation.x = -Math.PI / 2.3;
    atmosphereGroup.add(voiceRing);

    sceneRefs.current = {
      renderer,
      scene,
      camera,
      controls,
      atmosphereGroup,
      artifactGroup,
      particlePositions,
      particleVelocities,
      particleGeo,
      particleMat,
      voiceRing,
      voiceRingMat,
      keyLight,
      rimLight,
      isSoftwareGl,
    };

    const handlePointerMove = (e: PointerEvent) => {
      const w = window.innerWidth || 1440;
      const h = window.innerHeight || 900;
      _pointer.x = (e.clientX / w - 0.5) * 2;
      _pointer.y = (e.clientY / h - 0.5) * 2;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(Math.floor(entry.contentRect.width), 280);
      const h = Math.max(Math.floor(entry.contentRect.height), 280);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    let frameId = 0;
    let unmounted = false;
    let prevMs = performance.now();
    const startMs = prevMs;
    let smoothPx = 0;
    let smoothPy = 0;

    function afterDraw(cb: () => void) {
      if (unmounted) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (unmounted) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    const tick = () => {
      if (unmounted) return;
      const now = performance.now();
      const dt = Math.min((now - prevMs) * 0.001, 0.05);
      prevMs = now;
      const elapsed = (now - startMs) * 0.001;
      const speaking = isSpeakingRef.current;
      const activeRealm = realmRef.current;

      // Smooth UE5.8 cine-camera breathing & mouse parallax on the photorealistic character stage
      const targetPx = _pointer.x * 12 + Math.sin(elapsed * 0.55) * 4;
      const targetPy = _pointer.y * 7 + Math.cos(elapsed * 0.8) * 3;
      smoothPx += (targetPx - smoothPx) * 0.08;
      smoothPy += (targetPy - smoothPy) * 0.08;

      if (backdropRef.current) {
        const breatheScale = speaking ? 1.045 + Math.sin(elapsed * 5.5) * 0.004 : 1.038;
        backdropRef.current.style.transform = `translate3d(${smoothPx.toFixed(1)}px, ${smoothPy.toFixed(1)}px, 0) scale(${breatheScale.toFixed(4)})`;
      }

      const refs = sceneRefs.current;
      if (refs) {
        const pos = refs.particlePositions;
        const vel = refs.particleVelocities;
        const isRain = activeRealm === 'sports';

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3 = i * 3;
          if (isRain) {
            // Stadium floodlight rain mist falling diagonally
            pos[i3] -= vel[i3 + 1] * dt * 0.85;
            pos[i3 + 1] -= vel[i3 + 1] * dt * 3.4;
            if (pos[i3 + 1] < -2.4) {
              pos[i3 + 1] = 2.4;
              pos[i3] = (Math.random() - 0.3) * 7.5;
            }
          } else {
            // Rising embers (Story/Shooter) or floating arcane motes (Strategy)
            const speedMul = activeRealm === 'strategy' ? 0.45 : speaking ? 1.65 : 1.0;
            pos[i3] += (vel[i3] + Math.sin(elapsed + i) * 0.08) * dt * speedMul;
            pos[i3 + 1] += vel[i3 + 1] * dt * speedMul;
            if (pos[i3 + 1] > 2.4) {
              pos[i3 + 1] = -2.3;
              pos[i3] = (Math.random() - 0.35) * 7.5;
            }
          }
        }
        (refs.particleGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;

        // Voice ring pulse when Coach speaks
        if (speaking) {
          refs.voiceRingMat.opacity = 0.25 + Math.abs(Math.sin(elapsed * 8)) * 0.35;
          const pulseScale = 1 + Math.sin(elapsed * 6) * 0.08;
          refs.voiceRing.scale.setScalar(pulseScale);
        } else {
          refs.voiceRingMat.opacity *= 0.88;
        }

        if (refs.artifactGroup.children.length > 0) {
          refs.artifactGroup.rotation.y += dt * 0.45;
          controls.update();
        }
      }

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      unmounted = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      disposeGroup(atmosphereGroup);
      disposeGroup(artifactGroup);
      particleTex.dispose();
      envTarget.dispose();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneRefs.current = null;
    };
  }, []);

  // Update particle & rim light palette when realm or GTA Social district changes
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;
    const accent = new THREE.Color(activeAccentHex);
    const secondary = new THREE.Color(activeSecondaryHex);
    refs.keyLight.color.copy(accent);
    refs.rimLight.color.copy(secondary);
    refs.particleMat.color.copy(
      customBackdropUrl
        ? accent
        : realm === 'story'
          ? new THREE.Color('#FF7A2F')
          : accent
    );
    refs.particleMat.size = realm === 'sports' ? 0.055 : realm === 'story' ? 0.085 : 0.072;
    refs.voiceRingMat.color.copy(accent);
  }, [realm, activeAccentHex, activeSecondaryHex, customBackdropUrl]);

  // Optional 3D .glb Artifact Turntable (ONLY shown when inspectGlb is explicitly toggled ON)
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;

    while (refs.artifactGroup.children.length > 0) {
      const child = refs.artifactGroup.children[0];
      refs.artifactGroup.remove(child);
      disposeGroup(child);
    }

    if (!inspectGlb) {
      refs.renderer.render(refs.scene, refs.camera);
      return;
    }

    const glbUrl = manifest.coachGlbs[realm] ?? manifest.avatarGlbUrl ?? '/media/avatar.glb';
    let cancelled = false;
    const loader = new GLTFLoader();
    loader.load(
      glbUrl,
      (gltf) => {
        if (cancelled || !sceneRefs.current) {
          disposeGroup(gltf.scene);
          return;
        }
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 1.65 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.position.x = window.innerWidth >= 768 ? 0.9 : 0;
        model.position.y = 0.08;
        refs.artifactGroup.add(model);
        refs.renderer.render(refs.scene, refs.camera);
      },
      undefined,
      () => undefined
    );

    return () => {
      cancelled = true;
    };
  }, [inspectGlb, realm, manifest]);

  const showLiveVideo = useVideoBackdrop && Boolean(manifest.lobbyVideoUrl);

  return (
    <div
      data-testid="coach-3d-canvas"
      aria-label={`Unreal 5.8 3D Coach stage for ${cfg.label}`}
      className="fixed inset-0 z-0 w-screen h-screen overflow-hidden"
    >
      {/* 1. Unreal Engine 5.8 Photorealistic 8K Character & World Stage (with 3D Parallax Camera Breathing) */}
      <div
        ref={backdropRef}
        className="absolute inset-0 w-full h-full will-change-transform transition-opacity duration-500"
        style={{ transform: 'scale(1.038)' }}
      >
        {showLiveVideo ? (
          <video
            key="live-video-backdrop"
            src={manifest.lobbyVideoUrl ?? '/media/lobby-bg.mp4'}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setVideoReady(true)}
            onError={() => setVideoReady(true)} // broken asset must never dead-lock the lobby
            className="w-full h-full object-cover object-[68%_center] sm:object-center"
          />
        ) : !imgFailed ? (
          <img
            key={activeImageUrl}
            src={activeImageUrl}
            alt={`${cfg.coachName} — ${cfg.label}`}
            referrerPolicy="no-referrer"
            onLoad={() => setImageReady(true)}
            onError={() => {
              setImgFailed(true);
              setImageReady(true); // broken asset must never dead-lock the lobby
            }}
            className="w-full h-full object-cover object-[76%_center] sm:object-[65%_center] md:object-center select-none"
          />
        ) : (
          manifest.lobbyVideoUrl && (
            <video
              src={manifest.lobbyVideoUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover object-center"
            />
          )
        )}
      </div>

      {/* Page loading gate — lobby stays covered until its backdrop asset (video
          frame / image) is fully decoded, so menus never sit on a blank stage. */}
      <PageLoadGate
        active={showLiveVideo ? !videoReady : !imageReady}
        labelFa="در حال لود کامل لابی..."
        labelEn="Loading lobby…"
        testId="lobby-load-gate"
      />

      {/* 2. Measured Left-Side Negative-Space Contrast Scrim (Protects In-Game Menu Readability while keeping Right Character 100% Crystal Clear) */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            realm === 'story'
              ? 'linear-gradient(90deg, rgba(10,6,5,0.84) 0%, rgba(10,6,5,0.45) 38%, rgba(10,6,5,0.0) 68%), linear-gradient(0deg, rgba(10,6,5,0.82) 0%, rgba(10,6,5,0.0) 24%)'
              : realm === 'sports'
                ? 'linear-gradient(90deg, rgba(4,12,9,0.84) 0%, rgba(4,12,9,0.42) 38%, rgba(4,12,9,0.0) 68%), linear-gradient(0deg, rgba(4,12,9,0.82) 0%, rgba(4,12,9,0.0) 24%)'
                : realm === 'strategy'
                  ? 'linear-gradient(90deg, rgba(4,7,15,0.85) 0%, rgba(4,7,15,0.45) 38%, rgba(4,7,15,0.0) 68%), linear-gradient(0deg, rgba(4,7,15,0.82) 0%, rgba(4,7,15,0.0) 24%)'
                  : 'linear-gradient(90deg, rgba(7,9,12,0.84) 0%, rgba(7,9,12,0.42) 38%, rgba(7,9,12,0.0) 68%), linear-gradient(0deg, rgba(7,9,12,0.82) 0%, rgba(7,9,12,0.0) 24%)',
        }}
      />

      {/* 3. Real-Time Three.js WebGL Volumetric Particles & Lighting Layer */}
      <div
        ref={mountRef}
        className={`absolute inset-0 z-20 w-full h-full ${
          inspectGlb ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : 'pointer-events-none'
        }`}
      />
    </div>
  );
};
