import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

interface SocialBackdrop3DProps {
  activeTab?: string;
  backdropImageUrl?: string;
  atmosphereMode?: 'cyber' | 'crimson-arena';
}

const PARTICLE_COUNT = 140;
const _pointer = new THREE.Vector2(0, 0);

function detectSoftwareGl(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
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

function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh || (obj as THREE.Points).isPoints || (obj as THREE.Line).isLine) {
      mesh.geometry?.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else if (mat) {
        mat.dispose();
      }
    }
  });
}

function createSoftParticleSprite(isCrimsonArena: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    if (isCrimsonArena) {
      grad.addColorStop(0.35, 'rgba(245, 158, 11, 0.85)');
      grad.addColorStop(0.7, 'rgba(225, 29, 72, 0.42)');
    } else {
      grad.addColorStop(0.35, 'rgba(34, 211, 238, 0.72)');
      grad.addColorStop(0.7, 'rgba(236, 72, 153, 0.28)');
    }
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createWetTerraceTextures(
  maxAnisotropy: number,
  isCrimsonArena: boolean
): {
  albedoMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  // 1. Wet cyber-terrace reflective floor albedo with subtle neon rain or ember streaks
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = 512;
  colorCanvas.height = 512;
  const cCtx = colorCanvas.getContext('2d');
  if (cCtx) {
    cCtx.fillStyle = isCrimsonArena ? '#110609' : '#050914';
    cCtx.fillRect(0, 0, 512, 512);

    // Subtle wet puddle pools
    const puddleA = cCtx.createRadialGradient(160, 210, 12, 160, 210, 150);
    puddleA.addColorStop(
      0,
      isCrimsonArena ? 'rgba(245, 158, 11, 0.24)' : 'rgba(34, 211, 238, 0.22)'
    );
    puddleA.addColorStop(
      0.5,
      isCrimsonArena ? 'rgba(28, 10, 14, 0.6)' : 'rgba(15, 23, 42, 0.6)'
    );
    puddleA.addColorStop(1, 'rgba(5, 9, 20, 0)');
    cCtx.fillStyle = puddleA;
    cCtx.fillRect(0, 0, 512, 512);

    const puddleB = cCtx.createRadialGradient(370, 330, 10, 370, 330, 165);
    puddleB.addColorStop(
      0,
      isCrimsonArena ? 'rgba(225, 29, 72, 0.24)' : 'rgba(236, 72, 153, 0.2)'
    );
    puddleB.addColorStop(
      0.55,
      isCrimsonArena ? 'rgba(28, 10, 14, 0.5)' : 'rgba(15, 23, 42, 0.5)'
    );
    puddleB.addColorStop(1, 'rgba(5, 9, 20, 0)');
    cCtx.fillStyle = puddleB;
    cCtx.fillRect(0, 0, 512, 512);

    // Fine architectural terrace slab joints
    cCtx.strokeStyle = isCrimsonArena
      ? 'rgba(245, 158, 11, 0.14)'
      : 'rgba(34, 211, 238, 0.12)';
    cCtx.lineWidth = 1;
    for (let i = 0; i <= 512; i += 64) {
      cCtx.beginPath();
      cCtx.moveTo(i, 0);
      cCtx.lineTo(i, 512);
      cCtx.stroke();

      cCtx.beginPath();
      cCtx.moveTo(0, i);
      cCtx.lineTo(512, i);
      cCtx.stroke();
    }
  }

  const albedoMap = new THREE.CanvasTexture(colorCanvas);
  albedoMap.colorSpace = THREE.SRGBColorSpace;
  albedoMap.wrapS = THREE.RepeatWrapping;
  albedoMap.wrapT = THREE.RepeatWrapping;
  albedoMap.repeat.set(6, 6);
  albedoMap.anisotropy = maxAnisotropy;

  // 2. Micro-relief asphalt bump map
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 256;
  bumpCanvas.height = 256;
  const bCtx = bumpCanvas.getContext('2d');
  if (bCtx) {
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1600; i++) {
      const x = (i * 73) % 256;
      const y = (i * 139) % 256;
      const shade = 110 + ((i * 29) % 36);
      bCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
      bCtx.fillRect(x, y, 2, 2);
    }
  }
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(10, 10);
  bumpMap.anisotropy = maxAnisotropy;

  return { albedoMap, bumpMap };
}

export const SocialBackdrop3D: React.FC<SocialBackdrop3DProps> = ({
  backdropImageUrl = '/src/assets/images/ue5_gta_social_hub_1795036738605.jpg',
  atmosphereMode = 'cyber',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const scrollOffsetRef = useRef<number>(0);
  const isCrimsonArena = atmosphereMode === 'crimson-arena';

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = Math.max(container.clientWidth || window.innerWidth, 320);
    const height = Math.max(container.clientHeight || window.innerHeight, 480);

    const isSoftwareGl = detectSoftwareGl();
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(isCrimsonArena ? 0x110508 : 0x040711, 0.055);

    // Studio IBL reflections via RoomEnvironment
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    // 9:16 Portrait Mobile Camera Framing (FOV 59)
    const camera = new THREE.PerspectiveCamera(59, width / height, 0.1, 80);
    camera.position.set(0, 0.35, 4.3);
    camera.lookAt(0, 0.15, 0);

    // Post-Processing: EffectComposer + Restrained UnrealBloomPass (0.42 strength)
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!isSoftwareGl) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.42, // restrained bloom intensity (0.35 - 0.5)
        0.38,
        0.82
      );
      composer.addPass(bloomPass);
    }

    // UE5.8 Lumen Vibe Lighting: Cyber mode vs Moody Dusk-Amber & Crimson Live Arena mode
    const hemiLight = new THREE.HemisphereLight(
      isCrimsonArena ? 0xf59e0b : 0x22d3ee,
      isCrimsonArena ? 0x140508 : 0x050712,
      0.75
    );
    const cyanRimLight = new THREE.DirectionalLight(
      isCrimsonArena ? 0xf59e0b : 0x22d3ee,
      3.2
    );
    cyanRimLight.position.set(-2.8, 2.6, 2.2);

    const magentaRimLight = new THREE.DirectionalLight(
      isCrimsonArena ? 0xe11d48 : 0xec4899,
      3.1
    );
    magentaRimLight.position.set(2.8, 2.2, -2.4);

    const amberKeyLight = new THREE.PointLight(0xf59e0b, 2.4, 14, 2);
    amberKeyLight.position.set(1.4, 1.1, 2.6);

    scene.add(hemiLight, cyanRimLight, magentaRimLight, amberKeyLight);

    // Wet Reflective Cyber-Terrace Ground Plane
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const { albedoMap, bumpMap } = createWetTerraceTextures(maxAniso, isCrimsonArena);
    const groundGeo = new THREE.PlaneGeometry(36, 36);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: albedoMap,
      bumpMap,
      bumpScale: 0.015,
      metalness: 0.88,
      roughness: 0.14,
      envMapIntensity: 1.35,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -1.35;
    scene.add(groundMesh);

    // Soft radial contact shadow beneath the 3D subject (offset by +0.015 on Y to prevent Z-fighting)
    const shadowGeo = new THREE.CircleGeometry(1.35, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020409,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(-0.55, -1.335, -0.35);
    scene.add(contactShadow);

    // Load Real .glb 3D Subject positioned on the left/background third
    const subjectGroup = new THREE.Group();
    subjectGroup.position.set(width < 768 ? -0.48 : -1.15, 0.18, -0.35);
    scene.add(subjectGroup);

    let cancelled = false;
    const loader = new GLTFLoader();
    const KHRO_FALLBACK_GLB =
      'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb';

    const attachLoadedGlb = (model: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const targetScale = 1.85 / maxDim;
      model.scale.setScalar(targetScale);
      model.position.sub(center.multiplyScalar(targetScale));

      model.traverse((child) => {
        const m = child as THREE.Mesh;
        if (m.isMesh && m.material) {
          const mat = m.material as THREE.MeshStandardMaterial;
          if ('envMapIntensity' in mat) {
            mat.envMapIntensity = 1.45;
          }
        }
      });

      subjectGroup.add(model);
    };

    loader.load(
      '/media/avatar.glb',
      (gltf) => {
        if (cancelled) {
          disposeObject3D(gltf.scene);
          return;
        }
        attachLoadedGlb(gltf.scene);
      },
      undefined,
      () => {
        if (cancelled) return;
        loader.load(
          KHRO_FALLBACK_GLB,
          (gltf) => {
            if (cancelled) {
              disposeObject3D(gltf.scene);
              return;
            }
            attachLoadedGlb(gltf.scene);
          },
          undefined,
          () => undefined
        );
      }
    );

    // Floating Neon Dust / Drifting Embers Particles (Zero-GC pre-allocated Float32Array)
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleVelocities = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);
    const primaryParticleColor = new THREE.Color(isCrimsonArena ? 0xf59e0b : 0x22d3ee);
    const secondaryParticleColor = new THREE.Color(isCrimsonArena ? 0xe11d48 : 0xec4899);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.5) * 9.0;
      particlePositions[i3 + 1] = (Math.random() - 0.3) * 6.5;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 5.0;

      particleVelocities[i3] = (Math.random() - 0.5) * 0.16;
      particleVelocities[i3 + 1] = 0.15 + Math.random() * 0.32;
      particleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

      const c = i % 2 === 0 ? primaryParticleColor : secondaryParticleColor;
      particleColors[i3] = c.r;
      particleColors[i3 + 1] = c.g;
      particleColors[i3 + 2] = c.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleSprite = createSoftParticleSprite(isCrimsonArena);
    const particleMat = new THREE.PointsMaterial({
      size: 0.085,
      map: particleSprite,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    scene.add(particlePoints);

    const handlePointerMove = (e: PointerEvent) => {
      const w = window.innerWidth || 390;
      const h = window.innerHeight || 844;
      _pointer.x = (e.clientX / w - 0.5) * 2;
      _pointer.y = (e.clientY / h - 0.5) * 2;
    };

    const handleWheel = (e: WheelEvent) => {
      scrollOffsetRef.current = THREE.MathUtils.clamp(
        scrollOffsetRef.current + e.deltaY * 0.0005,
        -0.35,
        0.35
      );
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(Math.floor(entry.contentRect.width), 300);
      const h = Math.max(Math.floor(entry.contentRect.height), 400);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer?.setSize(w, h);
      bloomPass?.resolution.set(w, h);
      subjectGroup.position.x = w < 768 ? -0.48 : -1.15;
      contactShadow.position.x = subjectGroup.position.x;
    });
    resizeObserver.observe(container);

    let frameId = 0;
    let prevMs = performance.now();
    const startMs = prevMs;

    function afterDraw(cb: () => void) {
      if (cancelled) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (cancelled) return;
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
      if (cancelled) return;
      const now = performance.now();
      const dt = Math.min((now - prevMs) * 0.001, 0.05);
      prevMs = now;
      const elapsed = (now - startMs) * 0.001;

      // Gentle camera parallax & breathing on pointer/scroll movement
      const targetCamX = _pointer.x * 0.28 + Math.sin(elapsed * 0.45) * 0.08;
      const targetCamY =
        0.35 - _pointer.y * 0.16 + Math.cos(elapsed * 0.6) * 0.05 + scrollOffsetRef.current;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 4.2, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 4.2, dt);
      camera.lookAt(0, 0.15, 0);

      // Subtle breathing & slow turntable sway on the 3D .glb subject
      subjectGroup.position.y = 0.18 + Math.sin(elapsed * 1.3) * 0.04;
      subjectGroup.rotation.y =
        Math.sin(elapsed * 0.5) * 0.35 + _pointer.x * 0.25;

      // Update neon dust / ember particles
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        particlePositions[i3] +=
          (particleVelocities[i3] + Math.sin(elapsed + i) * 0.04) * dt;
        particlePositions[i3 + 1] += particleVelocities[i3 + 1] * dt;
        if (particlePositions[i3 + 1] > 3.6) {
          particlePositions[i3 + 1] = -1.3;
          particlePositions[i3] = (Math.random() - 0.5) * 9.0;
        }
      }
      (particleGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;

      if (composer && !isSoftwareGl) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('wheel', handleWheel);
      disposeObject3D(subjectGroup);
      groundGeo.dispose();
      groundMat.dispose();
      albedoMap.dispose();
      bumpMap.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      particleSprite.dispose();
      envTarget.dispose();
      composer?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isCrimsonArena]);

  return (
    <div
      data-testid="social-backdrop-3d"
      data-atmosphere={atmosphereMode}
      aria-hidden="true"
      className="fixed inset-0 -z-10 w-screen h-screen overflow-hidden pointer-events-none bg-[#040711]"
    >
      {/* Unreal Engine 5.8 Vice City Cyber-Terrace Atmospheric Depth Layer */}
      <img
        src={backdropImageUrl}
        alt="Unreal Engine 5.8 Vice City Cyber Terrace"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-[72%_center] opacity-65 scale-105 select-none"
      />

      {/* Measured atmospheric gradient scrim for WCAG AA frosted glass contrast */}
      <div
        className="absolute inset-0"
        style={{
          background: isCrimsonArena
            ? 'radial-gradient(circle at 26% 24%, rgba(245, 158, 11, 0.22) 0%, rgba(225, 29, 72, 0.16) 42%, rgba(15, 5, 8, 0.84) 85%), linear-gradient(180deg, rgba(16, 6, 9, 0.62) 0%, rgba(20, 7, 11, 0.34) 45%, rgba(12, 4, 7, 0.88) 100%)'
            : 'radial-gradient(circle at 24% 28%, rgba(34, 211, 238, 0.14) 0%, rgba(236, 72, 153, 0.08) 38%, rgba(4, 7, 17, 0.78) 85%), linear-gradient(180deg, rgba(4, 7, 17, 0.55) 0%, rgba(4, 7, 17, 0.25) 45%, rgba(4, 7, 17, 0.82) 100%)',
        }}
      />

      {/* Interactive Real-Time Three.js WebGL Layer (.glb Subject + Wet Reflective Ground + FogExp2 + Neon/Ember Particles + Bloom) */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default SocialBackdrop3D;
