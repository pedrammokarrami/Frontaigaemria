import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useLanguage } from '../../contexts/LanguageContext';

interface GlobalEarthLanguageButtonProps {
  onClick?: () => void;
}

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
    return true;
  }
}

function createProceduralEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Deep sapphire ocean gradient
    const ocean = ctx.createLinearGradient(0, 0, 0, 256);
    ocean.addColorStop(0, '#0C3B78');
    ocean.addColorStop(0.5, '#072A63');
    ocean.addColorStop(1, '#09346B');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, 512, 256);

    // Subtle latitude/longitude bathymetric grid
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.14)';
    ctx.lineWidth = 1;
    for (let y = 32; y < 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    for (let x = 0; x < 512; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }

    // Stylized realistic continent silhouettes across both hemispheres
    const landGrad = ctx.createLinearGradient(0, 24, 0, 232);
    landGrad.addColorStop(0, '#D1FAE5');
    landGrad.addColorStop(0.18, '#34D399');
    landGrad.addColorStop(0.55, '#10B981');
    landGrad.addColorStop(0.85, '#059669');
    landGrad.addColorStop(1, '#E2E8F0');
    ctx.fillStyle = landGrad;

    const drawContinent = (pts: Array<[number, number]>) => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
    };

    // North America
    drawContinent([
      [54, 48],
      [112, 42],
      [148, 66],
      [136, 98],
      [108, 118],
      [88, 128],
      [74, 96],
    ]);
    // South America
    drawContinent([
      [126, 132],
      [166, 146],
      [174, 178],
      [154, 214],
      [134, 218],
      [124, 172],
    ]);
    // Europe
    drawContinent([
      [230, 44],
      [288, 42],
      [296, 74],
      [262, 86],
      [234, 78],
    ]);
    // Africa
    drawContinent([
      [232, 96],
      [296, 98],
      [318, 132],
      [296, 186],
      [268, 198],
      [246, 166],
      [226, 128],
    ]);
    // Eurasia & Middle East
    drawContinent([
      [294, 46],
      [414, 42],
      [448, 72],
      [428, 108],
      [388, 128],
      [338, 122],
      [304, 96],
    ]);
    // Australia
    drawContinent([
      [394, 162],
      [446, 164],
      [452, 196],
      [404, 202],
    ]);

    // Soft glowing polar caps + translucent atmospheric cloud wisps
    ctx.fillStyle = 'rgba(241, 245, 249, 0.72)';
    ctx.fillRect(0, 0, 512, 16);
    ctx.fillRect(0, 240, 512, 16);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.ellipse(38 + i * 48, 74 + (i % 3) * 44, 34, 8, 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export const GlobalEarthLanguageButton: React.FC<GlobalEarthLanguageButtonProps> = ({ onClick }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglReady, setWebglReady] = useState(true);
  const [hovered, setHovered] = useState(false);
  const hoveredRef = useRef(false);
  hoveredRef.current = hovered;

  const { language, copy, openLanguageModal, isLanguageModalOpen } = useLanguage();
  const shortCode = language.code.split('-')[0].toUpperCase();

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = probeSoftwareGl();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'default',
        preserveDrawingBuffer: true,
      });
    } catch {
      setWebglReady(false);
      return;
    }

    const size = 44;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.24;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.borderRadius = '9999px';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
    camera.position.set(0, 0.08, 3.1);

    const hemi = new THREE.HemisphereLight(0xbae6fd, 0x061529, 0.72);
    const key = new THREE.DirectionalLight(0xffffff, 1.38);
    key.position.set(2.0, 1.5, 2.5);
    const rim = new THREE.DirectionalLight(0x38bdf8, 1.15);
    rim.position.set(-2.0, -0.8, -2.0);
    scene.add(hemi, key, rim);

    const earthTex = createProceduralEarthTexture();
    const earthGeo = new THREE.SphereGeometry(0.84, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.68,
      metalness: 0.06,
      emissive: new THREE.Color('#041630'),
      emissiveIntensity: 0.22,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.rotation.z = 0.22;
    scene.add(earthMesh);

    const atmoGeo = new THREE.SphereGeometry(0.91, 28, 28);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#38BDF8'),
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let unmounted = false;
    let prevMs = performance.now();

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
            frameId = window.setTimeout(poll, 6);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 95);
          }
        };
        frameId = window.setTimeout(poll, 6);
      } else {
        frameId = window.setTimeout(cb, 95);
      }
    }

    const tick = () => {
      if (unmounted) return;
      const now = performance.now();
      const dt = Math.min((now - prevMs) * 0.001, 0.08);
      prevMs = now;
      const spinSpeed = hoveredRef.current ? 1.35 : 0.46;
      earthMesh.rotation.y += dt * spinSpeed;
      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      unmounted = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      earthGeo.dispose();
      earthMat.dispose();
      earthTex.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      envTarget.dispose();
      renderer.dispose();
    };
  }, []);

  const handlePress = () => {
    openLanguageModal();
    onClick?.();
  };

  return (
    <button
      type="button"
      data-testid="global-earth-lang-btn"
      onClick={handlePress}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`${copy.earthButtonAria} (${language.englishName})`}
      aria-expanded={isLanguageModalOpen}
      className="fixed top-2.5 left-2.5 z-[85] group flex items-center justify-center w-11 h-11 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 transition-transform duration-200 hover:scale-105 active:scale-95"
      title={`${language.nativeName} · ${language.englishName}`}
    >
      {/* Spherical Atmospheric Shadow Base */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-slate-950/75 border border-sky-300/35 shadow-[0_6px_22px_rgba(14,165,233,0.35),inset_0_1px_1px_rgba(255,255,255,0.28)] group-hover:border-sky-300/70 transition-colors"
      />

      {/* Real-time 3D Rotating Earth Globe Sphere */}
      {webglReady ? (
        <div
          ref={mountRef}
          aria-hidden="true"
          className="relative z-10 w-[40px] h-[40px] rounded-full overflow-hidden pointer-events-none"
        />
      ) : (
        <span
          aria-hidden="true"
          className="relative z-10 w-[38px] h-[38px] rounded-full overflow-hidden block"
          style={{
            background:
              'radial-gradient(circle at 32% 30%, #38BDF8 0%, #0EA5E9 22%, #0B4F6C 58%, #041E42 100%)',
            boxShadow: 'inset -6px -6px 12px rgba(2,6,23,0.85), inset 3px 3px 8px rgba(186,230,253,0.45)',
          }}
        >
          <span
            className="absolute top-2 left-2.5 w-3.5 h-2.5 rounded-full bg-emerald-400/80 rotate-12"
          />
          <span
            className="absolute bottom-2.5 right-2 w-4 h-3 rounded-full bg-emerald-500/75 -rotate-12"
          />
        </span>
      )}

      {/* Subtle Crisp ISO Code Pill */}
      <span
        data-testid="global-earth-lang-code"
        className="absolute -bottom-1 -right-1 z-20 px-1.5 py-[1px] rounded-md bg-slate-950/95 border border-sky-300/50 text-[9px] font-black tracking-wider text-sky-100 leading-none shadow-md"
      >
        {shortCode}
      </span>
    </button>
  );
};
