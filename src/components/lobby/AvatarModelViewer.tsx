import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

interface AvatarModelViewerProps {
  glbUrl: string | null;
  fallbackImage: string;
  alt: string;
}

const _box = new THREE.Box3();
const _center = new THREE.Vector3();
const _size = new THREE.Vector3();

/**
 * Lightweight studio GLB viewer for `/media/avatar.glb` using RoomEnvironment lighting
 * and OrbitControls touch rotation, with zero primitive geometry fallbacks.
 * Renders the clean photorealistic portrait if `avatar.glb` is not present yet.
 */
export function AvatarModelViewer({ glbUrl, fallbackImage, alt }: AvatarModelViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!glbUrl || !mountRef.current) {
      setModelReady(false);
      return;
    }

    const container = mountRef.current;
    let disposed = false;
    let frameId = 0;

    // Detect software WebGL (SwiftShader / llvmpipe) to pace draws cleanly
    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = Math.max(container.clientWidth, 128);
    const height = Math.max(container.clientHeight, 128);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 1.35;
    roomEnv.dispose();
    pmrem.dispose();

    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xe2e8f0, 0x161920, 0.9);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.1);
    keyLight.position.set(2.5, 3.5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.1);
    fillLight.position.set(-2.5, 0.5, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xccff00, 1.8);
    rimLight.position.set(-2.5, 2.2, -3);
    scene.add(rimLight);

    renderer.toneMappingExposure = 1.08;

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0.52, 0.16, 2.55);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableRotate = true;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.minPolarAngle = Math.PI * 0.28;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.target.set(0, 0, 0);
    controls.update();

    let renderBusy = false;
    let renderDirty = false;
    let settleTimer = 0;
    let loadedRoot: THREE.Object3D | null = null;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const st = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (st === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        controls.update();
        renderer.render(scene, camera);
        const done = () => {
          renderBusy = false;
          if (renderDirty && !disposed) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    const onControlsChange = () => requestRender();
    controls.addEventListener('change', onControlsChange);

    const loader = new GLTFLoader();
    loader.load(
      glbUrl,
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        model.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh && mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              if ('envMapIntensity' in m) {
                (m as THREE.MeshStandardMaterial).envMapIntensity = 1.35;
                m.needsUpdate = true;
              }
            });
          }
        });
        _box.setFromObject(model);
        _box.getCenter(_center);
        _box.getSize(_size);
        const maxDim = Math.max(_size.x, _size.y, _size.z) || 1;
        const scale = 1.42 / maxDim;
        model.scale.setScalar(scale);
        model.position.copy(_center).multiplyScalar(-scale);
        scene.add(model);
        loadedRoot = model;
        setFailed(false);
        setModelReady(true);
        requestRender();
        settleTimer = window.setTimeout(requestRender, 180);
      },
      undefined,
      () => {
        if (!disposed) {
          setFailed(true);
          setModelReady(false);
        }
      }
    );

    const onResize = () => {
      if (!container || disposed) return;
      const w = Math.max(container.clientWidth, 128);
      const h = Math.max(container.clientHeight, 128);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      clearTimeout(settleTimer);
      window.removeEventListener('resize', onResize);
      controls.removeEventListener('change', onControlsChange);
      controls.dispose();

      if (loadedRoot) {
        loadedRoot.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry?.dispose();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => m?.dispose());
          }
        });
      }
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [glbUrl]);

  return (
    <div
      className="relative h-32 w-32 overflow-hidden rounded-2xl border border-white/15"
      style={{
        background:
          'radial-gradient(circle at 50% 42%, rgba(204, 255, 0, 0.16) 0%, rgba(28, 33, 44, 0.92) 60%, #0A0B0E 100%)',
      }}
    >
      {glbUrl && !failed && (
        <div
          ref={mountRef}
          aria-label="3D Career Avatar Viewer"
          className="h-full w-full"
        />
      )}

      {(!glbUrl || failed || !modelReady) && (
        <img
          src={fallbackImage}
          alt={alt}
          referrerPolicy="no-referrer"
          className="absolute inset-0 z-10 h-full w-full object-cover"
        />
      )}

      {modelReady && (
        <span className="pointer-events-none absolute bottom-1.5 right-1.5 rounded bg-black/65 px-1.5 py-0.5 font-mono-tabular text-[9px] font-semibold tracking-wider text-[#CCFF00]">
          3D · DRAG
        </span>
      )}
    </div>
  );
}
