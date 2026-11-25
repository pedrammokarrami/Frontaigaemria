import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { SpatialParticleMode } from '../../utils/cinemaAgents';

interface SpatialVideoEnvironmentProps {
  videoSrc: string;
  fallbackImageUrl: string;
  fallbackToneFilter?: string;
  accentHex: string;
  secondaryHex: string;
  vignetteCss?: string;
  cinemaDimMode?: boolean;
  roomTitleFa: string;
  particleMode?: SpatialParticleMode;
  isReactiveActive?: boolean;
}

const _pointer = new THREE.Vector2(0, 0);
const PARTICLE_COUNT = 120;

function probeSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render|Mesa/i.test(gpu);
  } catch {
    return false;
  }
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

export const SpatialVideoEnvironment: React.FC<SpatialVideoEnvironmentProps> = ({
  videoSrc,
  fallbackImageUrl,
  fallbackToneFilter = 'contrast(1.04) saturate(1.02)',
  accentHex,
  secondaryHex,
  vignetteCss,
  cinemaDimMode = false,
  roomTitleFa,
  particleMode = 'noir-dust',
  isReactiveActive = false,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [webglReady, setWebglReady] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const particleModeRef = useRef<SpatialParticleMode>(particleMode);
  particleModeRef.current = particleMode;
  const reactiveRef = useRef(isReactiveActive);
  reactiveRef.current = isReactiveActive;
  const dimRef = useRef(cinemaDimMode);
  dimRef.current = cinemaDimMode;
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const sceneRefs = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    particlePositions: Float32Array;
    particleVelocities: Float32Array;
    particleGeo: THREE.BufferGeometry;
    particleMat: THREE.PointsMaterial;
    keyLight: THREE.DirectionalLight;
    rimLight: THREE.DirectionalLight;
  } | null>(null);

  useEffect(() => {
    setVideoUnavailable(false);
    setImgFailed(false);
  }, [videoSrc, fallbackImageUrl]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = probeSoftwareGl();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
    } catch {
      setWebglReady(false);
      return;
    }

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.innerHTML = '';
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

    const hemiLight = new THREE.HemisphereLight(0x94a3b8, 0x07090e, 0.6);
    const keyLight = new THREE.DirectionalLight(new THREE.Color(accentHex), 2.2);
    keyLight.position.set(2.4, 2.8, 3.2);
    const rimLight = new THREE.DirectionalLight(new THREE.Color(secondaryHex), 2.6);
    rimLight.position.set(-1.8, 2.4, -3.0);
    scene.add(hemiLight, keyLight, rimLight);

    const atmosphereGroup = new THREE.Group();
    scene.add(atmosphereGroup);

    // Pre-allocated Zero-GC Unreal 5.8 Volumetric Particle System
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleVelocities = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.32) * 7.6;
      particlePositions[i3 + 1] = (Math.random() - 0.5) * 4.8;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 2.8;

      particleVelocities[i3] = (Math.random() - 0.45) * 0.24;
      particleVelocities[i3 + 1] = 0.22 + Math.random() * 0.46;
      particleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.12;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleTex = createSoftParticleTexture();
    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color(accentHex),
      size: 0.072,
      map: particleTex,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    atmosphereGroup.add(particlePoints);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    sceneRefs.current = {
      renderer,
      scene,
      camera,
      particlePositions,
      particleVelocities,
      particleGeo,
      particleMat,
      keyLight,
      rimLight,
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
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
      if (reducedMotionRef.current) {
        renderer.render(scene, camera);
      }
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
      const mode = particleModeRef.current;
      const reactive = reactiveRef.current;
      const dimmed = dimRef.current;
      const rm = reducedMotionRef.current;

      if (!rm) {
        const targetPx = -_pointer.x * 13 + Math.sin(elapsed * 0.52) * 4.2;
        const targetPy = -_pointer.y * 8 + Math.cos(elapsed * 0.76) * 3.0;
        smoothPx += (targetPx - smoothPx) * 0.08;
        smoothPy += (targetPy - smoothPy) * 0.08;

        if (backdropRef.current) {
          const breathe = reactive ? 1.046 + Math.sin(elapsed * 3.8) * 0.004 : 1.038;
          backdropRef.current.style.transform = `translate3d(${smoothPx.toFixed(1)}px, ${smoothPy.toFixed(1)}px, 0) scale(${breathe.toFixed(4)})`;
        }

        const pos = particlePositions;
        const vel = particleVelocities;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3 = i * 3;
          if (mode === 'cyber-rain') {
            pos[i3] -= vel[i3 + 1] * dt * 0.9;
            pos[i3 + 1] -= vel[i3 + 1] * dt * 3.6;
            if (pos[i3 + 1] < -2.4) {
              pos[i3 + 1] = 2.4;
              pos[i3] = (Math.random() - 0.3) * 7.6;
            }
          } else if (mode === 'alpine-mist') {
            pos[i3] += (0.28 + vel[i3] * 0.4) * dt;
            pos[i3 + 1] += Math.sin(elapsed * 0.7 + i) * 0.08 * dt;
            if (pos[i3] > 3.8) {
              pos[i3] = -3.8;
              pos[i3 + 1] = (Math.random() - 0.5) * 4.6;
            }
          } else if (mode === 'zen-fireflies') {
            pos[i3] += Math.sin(elapsed * 0.9 + i * 1.3) * 0.16 * dt;
            pos[i3 + 1] += (vel[i3 + 1] * 0.35 + Math.cos(elapsed * 0.7 + i) * 0.1) * dt;
            if (pos[i3 + 1] > 2.4) {
              pos[i3 + 1] = -2.3;
              pos[i3] = (Math.random() - 0.3) * 7.6;
            }
          } else {
            const energyMul =
              mode === 'rave-lasers' || mode === 'festival-sparks' || mode === 'stadium-strobe'
                ? reactive
                  ? 1.85
                  : 1.35
                : mode === 'library-motes' || mode === 'noir-dust'
                  ? 0.55
                  : reactive
                    ? 1.45
                    : 0.9;
            pos[i3] += (vel[i3] + Math.sin(elapsed + i) * 0.09) * dt * energyMul;
            pos[i3 + 1] += vel[i3 + 1] * dt * energyMul;
            if (pos[i3 + 1] > 2.4) {
              pos[i3 + 1] = -2.3;
              pos[i3] = (Math.random() - 0.32) * 7.6;
            }
          }
        }
        (particleGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;

        // Camera gentle spatial drift synchronized with pointer parallax
        camera.position.x += (_pointer.x * 0.12 - camera.position.x) * 0.05;
        camera.position.y += (-_pointer.y * 0.08 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);

      if (!rm) {
        if (isSoftwareGl) afterDraw(tick);
        else frameId = requestAnimationFrame(tick);
      }
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      unmounted = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      disposeGroup(atmosphereGroup);
      particleTex.dispose();
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneRefs.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dynamically sync Three.js lights, particle palette, particle size & stage rings when room changes
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;
    const accent = new THREE.Color(accentHex);
    const secondary = new THREE.Color(secondaryHex);
    refs.keyLight.color.copy(accent);
    refs.rimLight.color.copy(secondary);
    refs.particleMat.color.copy(accent);
    refs.particleMat.size =
      particleMode === 'cyber-rain'
        ? 0.054
        : particleMode === 'festival-sparks' || particleMode === 'jazz-embers'
          ? 0.086
          : particleMode === 'zen-fireflies'
            ? 0.082
            : 0.070;
    refs.particleMat.opacity = cinemaDimMode ? 0.35 : 0.78;
    if (reducedMotionRef.current) {
      refs.renderer.render(refs.scene, refs.camera);
    }
  }, [accentHex, secondaryHex, particleMode, cinemaDimMode]);

  return (
    <div
      data-testid="spatial-video-environment"
      data-fallback-active={videoUnavailable ? 'true' : 'false'}
      data-webgl-ready={webglReady ? 'true' : 'false'}
      data-particle-mode={particleMode}
      aria-label={`محیط سه‌بعدی ${roomTitleFa}`}
      className="fixed inset-0 z-0 w-screen h-screen overflow-hidden pointer-events-none select-none bg-[#05060A]"
    >
      {/* Layer 1: Unreal Engine 5.8 8K Scene + Seamless .mp4 Video Loop with Damped Parallax */}
      <div
        ref={backdropRef}
        className="absolute inset-0 z-0 w-full h-full will-change-transform transition-opacity duration-500"
        style={{ transform: 'scale(1.038)' }}
      >
        {!imgFailed ? (
          <img
            key={fallbackImageUrl}
            src={fallbackImageUrl}
            alt={roomTitleFa}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover object-[76%_center] sm:object-[65%_center] md:object-center select-none"
            style={{
              filter: `${fallbackToneFilter} brightness(${cinemaDimMode ? 0.36 : 0.86})`,
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="w-full h-full"
            style={{
              background: `radial-gradient(circle at 70% 42%, ${accentHex}28 0%, #070910 68%)`,
            }}
          />
        )}

        {!videoUnavailable && (
          <video
            key={videoSrc}
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => setVideoUnavailable(true)}
            className="absolute inset-0 w-full h-full object-cover object-[68%_center] sm:object-center transition-opacity duration-500"
            style={{
              filter: `brightness(${cinemaDimMode ? 0.34 : 0.84}) contrast(1.04)`,
            }}
          />
        )}
      </div>

      {/* Layer 2: Measured Left-Side Negative-Space Scrim + Dual-Tone Volumetric Vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500"
        style={{
          opacity: cinemaDimMode ? 0.96 : 0.9,
          background:
            vignetteCss ??
            `radial-gradient(circle at 68% 40%, ${accentHex}1F 0%, rgba(6,7,11,0) 64%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: cinemaDimMode
            ? 'radial-gradient(circle at 50% 42%, rgba(4,5,9,0.28) 0%, rgba(3,4,8,0.86) 72%, rgba(2,3,6,0.97) 100%)'
            : `linear-gradient(90deg, rgba(6,7,11,0.84) 0%, rgba(6,7,11,0.42) 38%, rgba(6,7,11,0.0) 68%), linear-gradient(0deg, rgba(5,6,10,0.82) 0%, ${secondaryHex}08 16%, rgba(5,6,10,0.0) 30%)`,
        }}
      />

      {/* Layer 3: Real-Time Three.js WebGL Volumetric Particles & Stage Depth Rings */}
      {webglReady && (
        <div ref={mountRef} className="pointer-events-none absolute inset-0 z-20 w-full h-full" />
      )}
    </div>
  );
};
