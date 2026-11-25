import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import {
  GAME_THEMES,
  HOLOGRAM_3D_GAME_IDS,
  type Hologram3DGameId,
} from '../../data/gameTournamentThemes';
import {
  type HologramWorldHandle,
  buildTournamentHologramWorld,
  createHologramTableRoom,
} from './tournamentHologramWorlds';

interface TournamentHologramTable3DProps {
  gameId: Hologram3DGameId;
}

const _targetBg = new THREE.Color();
const _targetKey = new THREE.Color();
const _targetFillSky = new THREE.Color();
const _targetFillGround = new THREE.Color();
const _targetRim = new THREE.Color();
const _targetTrim = new THREE.Color();

export const TournamentHologramTable3D: React.FC<TournamentHologramTable3DProps> = ({
  gameId,
}) => {
  const { languageCode: lang3dCode } = useLanguage();
  const lang3dFa = (lang3dCode || 'fa').startsWith('fa');
  const mountRef = useRef<HTMLDivElement | null>(null);
  const activeGameRef = useRef<Hologram3DGameId>(gameId);
  const transitionScaleRef = useRef<number>(0.84);
  const dragStateRef = useRef({ dragging: false, lastX: 0, yawOffset: 0, targetYawOffset: 0 });

  useEffect(() => {
    if (activeGameRef.current !== gameId) {
      activeGameRef.current = gameId;
      transitionScaleRef.current = 0.84;
    }
  }, [gameId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = container.clientWidth || 390;
    const height = container.clientHeight || 844;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const initialTheme = GAME_THEMES[activeGameRef.current];
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(initialTheme.colors.roomBg);
    scene.fog = new THREE.FogExp2(initialTheme.colors.roomFog, 0.075);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    // Framed so the ENTIRE glowing octagonal war-table & 3D hologram world fit cleanly inside 390px mobile width
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 3.85, 6.95);
    camera.lookAt(0, -0.05, 0);

    // 3-point game-native lighting rig
    const hemiLight = new THREE.HemisphereLight(
      initialTheme.threeLighting.fillSkyHex,
      initialTheme.threeLighting.fillGroundHex,
      1.0
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(initialTheme.threeLighting.keyHex, 1.4);
    keyLight.position.set(3.2, 5.8, 4.2);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(initialTheme.threeLighting.rimHex, 1.75);
    rimLight.position.set(-3.8, 3.0, -3.6);
    scene.add(rimLight);

    const tableUnderLight = new THREE.PointLight(
      initialTheme.threeLighting.pedestalTrimHex,
      2.4,
      9.0,
      1.5
    );
    tableUnderLight.position.set(0, 1.0, 0.6);
    scene.add(tableUnderLight);

    // Shared War-Table Pedestal & Room Architecture
    const { roomGroup, trimMat, emitterMat, coreRingMat, particleMat, updateRoom } =
      createHologramTableRoom();
    scene.add(roomGroup);

    // Pre-build all 6 game-native 3D hologram worlds for instant zero-flicker swapping
    const stagePivot = new THREE.Group();
    stagePivot.position.y = -0.18;
    scene.add(stagePivot);

    const worlds = {} as Record<Hologram3DGameId, HologramWorldHandle>;
    for (const gid of HOLOGRAM_3D_GAME_IDS) {
      const built = buildTournamentHologramWorld(gid);
      built.group.visible = gid === activeGameRef.current;
      stagePivot.add(built.group);
      worlds[gid] = built;
    }

    // Restrained UnrealBloomPass on hardware GPU (threshold 0.9, strength 0.25 — zero white corner blowout)
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!isSoftwareGl) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.25,
        0.35,
        0.9
      );
      composer.addPass(bloomPass);
    }

    // Interactive horizontal drag-to-orbit on the hologram table
    const onPointerDown = (e: PointerEvent) => {
      dragStateRef.current.dragging = true;
      dragStateRef.current.lastX = e.clientX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragStateRef.current.dragging) return;
      const dx = e.clientX - dragStateRef.current.lastX;
      dragStateRef.current.lastX = e.clientX;
      dragStateRef.current.targetYawOffset += dx * 0.0085;
    };
    const onPointerUp = () => {
      dragStateRef.current.dragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      const w = container.clientWidth || 390;
      const h = container.clientHeight || 844;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (composer) composer.setSize(w, h);
      if (bloomPass) bloomPass.resolution.set(w, h);
      if (composer && !isSoftwareGl) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    window.addEventListener('resize', onResize);

    let disposed = false;
    let frameId = 0;
    let lastTime = performance.now();
    const startTime = lastTime;

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const delta = Math.min(0.08, (now - lastTime) / 1000);
      const elapsed = (now - startTime) / 1000;
      lastTime = now;

      const currentId = activeGameRef.current;
      const theme = GAME_THEMES[currentId];

      // Toggle visible hologram world
      for (const gid of HOLOGRAM_3D_GAME_IDS) {
        const shouldShow = gid === currentId;
        if (worlds[gid].group.visible !== shouldShow) {
          worlds[gid].group.visible = shouldShow;
        }
      }

      // Smoothly damp room colors & lights into the active game's native palette
      const dampAmt = 1 - Math.exp(-7 * delta);
      _targetBg.set(theme.colors.roomBg);
      (scene.background as THREE.Color).lerp(_targetBg, dampAmt);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.lerp(_targetBg, dampAmt);
      }

      _targetKey.setHex(theme.threeLighting.keyHex);
      _targetFillSky.setHex(theme.threeLighting.fillSkyHex);
      _targetFillGround.setHex(theme.threeLighting.fillGroundHex);
      _targetRim.setHex(theme.threeLighting.rimHex);
      _targetTrim.setHex(theme.threeLighting.pedestalTrimHex);

      keyLight.color.lerp(_targetKey, dampAmt);
      hemiLight.color.lerp(_targetFillSky, dampAmt);
      hemiLight.groundColor.lerp(_targetFillGround, dampAmt);
      rimLight.color.lerp(_targetRim, dampAmt);
      tableUnderLight.color.lerp(_targetTrim, dampAmt);

      trimMat.color.lerp(_targetTrim, dampAmt);
      trimMat.emissive.lerp(_targetTrim, dampAmt);
      emitterMat.color.lerp(_targetTrim, dampAmt);
      coreRingMat.color.lerp(_targetTrim, dampAmt);
      particleMat.color.lerp(_targetTrim, dampAmt);

      if (bloomPass) {
        bloomPass.strength = THREE.MathUtils.damp(
          bloomPass.strength,
          Math.min(0.25, theme.threeLighting.bloomStrength),
          6,
          delta
        );
      }

      // Smooth holographic boot-up pop + gentle ambient orbital rotation
      transitionScaleRef.current = THREE.MathUtils.damp(transitionScaleRef.current, 1.0, 7.5, delta);
      dragStateRef.current.yawOffset = THREE.MathUtils.damp(
        dragStateRef.current.yawOffset,
        dragStateRef.current.targetYawOffset,
        8,
        delta
      );

      stagePivot.scale.setScalar(transitionScaleRef.current);
      stagePivot.rotation.y = elapsed * 0.16 + dragStateRef.current.yawOffset;

      updateRoom(elapsed);
      worlds[currentId].update(elapsed, delta);

      if (composer && !isSoftwareGl) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Points) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      envTex.dispose();
      composer?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="tournament-hologram-canvas"
      data-hologram-game={gameId}
      aria-label={`${lang3dFa ? `میز هولوگرام سه‌بعدی ${GAME_THEMES[gameId].shortLabel}` : `3D hologram table ${GAME_THEMES[gameId].shortLabel}`}`}
      className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
    />
  );
};
