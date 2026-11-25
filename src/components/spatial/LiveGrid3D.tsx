import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { LiveGrid, GridCoord } from '../../utils/liveGridEngine';
import { projectToViewport } from '../../utils/liveGridEngine';

/**
 * GTA V 3D LIVE RADAR — real OSM buildings/roads extruded into a Three.js
 * scene with the user-specified radar aesthetics: exponential fog, angled
 * pause-menu camera, damped orbit controls, classic delta player cursor,
 * purple GPS waypoint route and in-scene sprite blips (no per-frame DOM).
 *
 * All coordinates are meters relative to the map center (user's real GPS fix).
 */

export interface RadarBlipSpec {
  id: string;
  title: string;
  color: string;
  /** meters east/north of the center */
  offsetX: number;
  offsetZ: number;
}

interface LiveGrid3DProps {
  grid: LiveGrid | null;
  /** marker colors per blip */
  blips: RadarBlipSpec[];
  selectedBlipId: string | null;
  /** entity id with an active GTA waypoint (purple GPS route) */
  waypointBlipId?: string | null;
  onPickBlip: (id: string) => void;
}

const FOG_COLOR = 0x05070d;

/** Convert lat/lng inside the grid to local meters relative to the center. */
function toLocalMeters(center: GridCoord, radiusM: number, lat: number, lng: number): { x: number; z: number } {
  const { xPct, yPct } = projectToViewport(center, radiusM, { lat, lng });
  const span = radiusM * 2.15;
  return { x: ((xPct - 50) / 100) * span, z: ((yPct - 50) / 100) * span };
}

const LiveGrid3D: React.FC<LiveGrid3DProps> = ({ grid, blips, selectedBlipId, waypointBlipId, onPickBlip }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pickRef = useRef(onPickBlip);
  pickRef.current = onPickBlip;
  // floating HTML blip chips (spec CSS .gta-blip), projected 3D -> screen at ~10fps
  const chipRefs = useRef(new Map<string, HTMLDivElement | null>());
  const frameCountRef = useRef(0);
  const HOME_POS = new THREE.Vector3(0, 34, 0);
  // world positions of blips + a mutable purple route line, for the waypoint effect
  const routeRef = useRef<{ updateRoute: (wpId: string | null) => void } | null>(null);
  const wpRef = useRef(waypointBlipId ?? null);
  wpRef.current = waypointBlipId ?? null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Weak-phone guard: heavy WebGL radar (140 extruded buildings + fog + DPR2)
    // freezes low-end phone GPUs. Phones get the crisp 2D SVG grid + all HUD
    // features instead; desktops keep the full 3D radar.
    const ua = navigator.userAgent;
    const isPhone = /Android|iPhone|iPad|iPod/i.test(ua);
    const weakCores = (navigator.hardwareConcurrency ?? 8) <= 4;
    const devMem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
    const lowMemory = devMem !== undefined && devMem <= 4;
    if (isPhone && (weakCores || lowMemory || !('requestAnimationFrame' in window))) {
      container.dataset.webgl = 'skipped-lowpower';
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(FOG_COLOR);
    scene.fog = new THREE.FogExp2(FOG_COLOR, 0.00145);

    const camera = new THREE.PerspectiveCamera(48, container.clientWidth / Math.max(1, container.clientHeight), 1, 2500);
    camera.position.set(0, 260, 300); // ~40° oblique isometric, not top-down

    let renderer: THREE.WebGLRenderer;
    try {
      const onPhone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      renderer = new THREE.WebGLRenderer({ antialias: !onPhone, powerPreference: 'high-performance' });
    } catch {
      container.dataset.webgl = 'unsupported'; // visible hint for weak/phone browsers
      return; // no WebGL — the 2D SVG grid remains as fallback
    }
    renderer.setSize(container.clientWidth, container.clientHeight);
    const onPhoneInit = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    renderer.setPixelRatio(onPhoneInit ? 1 : Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI / 2.25;
    controls.minDistance = 70;
    controls.maxDistance = 680;
    controls.target.set(0, 0, 0);

    // Tactical lighting (spec: sky-blue key + purple rim)
    scene.add(new THREE.AmbientLight(0x94a3b8, 0.75));
    const keyLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
    keyLight.position.set(180, 350, 140);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xa855f7, 0.45);
    rimLight.position.set(-200, 200, -180);
    scene.add(rimLight);

    // Ground plane + subtle tactical cyber grid (GTA radar floor)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(2400, 2400),
      new THREE.MeshStandardMaterial({ color: 0x070a12, roughness: 0.95, metalness: 0.05 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    scene.add(ground);
    const gridHelper = new THREE.GridHelper(1600, 64, 0x1e293b, 0x111827);
    gridHelper.position.y = -0.3;
    scene.add(gridHelper);

    const buildingsGroup = new THREE.Group();
    const roadsGroup = new THREE.Group();
    const trafficGroup = new THREE.Group();
    const blipGroup = new THREE.Group();
    scene.add(buildingsGroup, roadsGroup, trafficGroup, blipGroup);
    const traffic: Array<{ mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3; t: number; speed: number }> = [];

    const gridRef = grid;
    if (gridRef) {
      // ── Carto Dark Matter basemap tiles (keyless, fully dark) laid on the ground ──
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      const z = 16;
      const n = 2 ** z;
      const tileX = Math.floor((((gridRef.center.lng + 180) / 360) * n));
      const tileY = Math.floor(((1 - Math.log(Math.tan((gridRef.center.lat * Math.PI) / 180) + 1 / Math.cos((gridRef.center.lat * Math.PI) / 180)) / Math.PI) / 2) * n);
      const metersPerTile = (40075016.686 / n) * Math.cos((gridRef.center.lat * Math.PI) / 180);
      const tileMeters = (pt: { lat: number; lng: number }) => toLocalMeters(gridRef.center, gridRef.radiusM, pt.lat, pt.lng);
      const proj = (x: number, y: number) => {
        const lng = (x / n) * 360 - 180;
        const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
        return tileMeters({ lat: (latRad * 180) / Math.PI, lng });
      };
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const tx = tileX + dx;
          const ty = tileY + dy;
          const nw = proj(tx, ty);
          const se = proj(tx + 1, ty + 1);
          const w = Math.abs(se.x - nw.x);
          const h = Math.abs(se.z - nw.z);
          const cx = (nw.x + se.x) / 2;
          const cz = (nw.z + se.z) / 2;
          const tex = loader.load(`https://basemaps.cartocdn.com/dark_all/${z}/${tx}/${ty}.png`, undefined, undefined, undefined); // silent fail → dark ground stays
          tex.colorSpace = THREE.SRGBColorSpace;
          const tile = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            new THREE.MeshBasicMaterial({ map: tex, depthWrite: false })
          );
          tile.rotation.x = -Math.PI / 2; // texture top (+Y) → -Z (north)
          tile.position.set(cx, -0.35, cz);
          scene.add(tile);
        }
      }

      // ── Real buildings: extruded footprints, GTA dark tactile material ──
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x0d1322, roughness: 0.6, metalness: 0.35 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x111a2c, roughness: 0.7, metalness: 0.3 });
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.8 }); // neon cyan
      const highlightEdgeMat = new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.85 }); // neon emerald (tall)
      const BLD_CAP = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 60 : 140;
      gridRef.buildings.slice(0, BLD_CAP).forEach((b) => {
        const pts = b.points;
        if (pts.length < 8) return;
        const toLocal = toLocalMeters(gridRef.center, gridRef.radiusM, pts[0], pts[1]);
        const shape = new THREE.Shape();
        let first = true;
        for (let i = 0; i < pts.length; i += 2) {
          const { x, z } = toLocalMeters(gridRef.center, gridRef.radiusM, pts[i], pts[i + 1]);
          if (first) {
            shape.moveTo(x, -z);
            first = false;
          } else {
            shape.lineTo(x, -z);
          }
        }
        shape.closePath();
        // real OSM height: levels × 3.8m (cap 110), else deterministic pseudo-random
        const lv = b.levels;
        let height = 12;
        if (lv && lv > 0) height = Math.min(lv * 3.8, 110);
        else {
          const seed = Math.abs(Math.sin(toLocal.x * 12.9898 + toLocal.z * 78.233));
          height = 9 + seed * 24;
        }
        const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
        geo.rotateX(-Math.PI / 2);
        const mesh = new THREE.Mesh(geo, [wallMat, roofMat]);
        buildingsGroup.add(mesh);
        // crisp GTA edge lines; tall buildings get the sky-blue highlight
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), height > 26 ? highlightEdgeMat : edgeMat);
        buildingsGroup.add(edges);
      });

      // ── Real roads: crisp ribbons (footways skipped, main roads wider/lighter) ──
      const FOOTWAY_CLASSES = new Set(['footway', 'steps', 'path', 'cycleway']);
      const MAIN_CLASSES = new Set(['primary', 'secondary', 'trunk', 'motorway', 'tertiary']);
      const roadMat = new THREE.MeshLambertMaterial({ color: 0x1a2233 });
      const primaryMat = new THREE.MeshLambertMaterial({ color: 0x232d3f });
      const neonRoadMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.5 });
      const RDS_CAP = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 50 : 110;
      gridRef.roads.slice(0, RDS_CAP).forEach((r) => {
        if (r.points.length < 4) return;
        if (r.roadClass && FOOTWAY_CLASSES.has(r.roadClass)) return;
        const isMain = !!r.roadClass && MAIN_CLASSES.has(r.roadClass);
        const curvePts: THREE.Vector3[] = [];
        for (let i = 0; i < r.points.length; i += 2) {
          const { x, z } = toLocalMeters(gridRef.center, gridRef.radiusM, r.points[i], r.points[i + 1]);
          curvePts.push(new THREE.Vector3(x, 0.5, z));
        }
        const curve = new THREE.CatmullRomCurve3(curvePts);
        const width = isMain ? 8.5 : 4.8;
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, width / 2, 4, false), isMain ? primaryMat : roadMat);
        tube.scale.y = 0.16; // flatten to a ribbon
        roadsGroup.add(tube);
        // neon border along the street
        const neon = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(24)), neonRoadMat);
        neon.position.y = 0.9;
        roadsGroup.add(neon);
      });

      // ── Traffic: GTA headlight/taillight dots gliding on real roads ──
      const carGeo = new THREE.SphereGeometry(1.5, 8, 8);
      const headMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
      const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const roadCurves = gridRef.roads
        .filter((r) => r.points.length >= 6 && !(r.roadClass && FOOTWAY_CLASSES.has(r.roadClass)))
        .slice(0, 12)
        .map((r) => {
          const curvePts: THREE.Vector3[] = [];
          for (let i = 0; i < r.points.length; i += 2) {
            const { x, z } = toLocalMeters(gridRef.center, gridRef.radiusM, r.points[i], r.points[i + 1]);
            curvePts.push(new THREE.Vector3(x, 1.6, z));
          }
          return new THREE.CatmullRomCurve3(curvePts);
        });
      for (let i = 0; i < Math.min(35, roadCurves.length); i++) {
        const curve = roadCurves[i % roadCurves.length];
        const mesh = new THREE.Mesh(carGeo, i % 2 === 0 ? headMat : tailMat);
        mesh.position.y = 1.2;
        trafficGroup.add(mesh);
        traffic.push({ mesh, curve, t: Math.random(), speed: 0.008 + Math.random() * 0.012 });
      }
    }

    // ── Classic GTA V delta player cursor at the center (real GPS point) ──
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(0, 11);
    arrowShape.lineTo(8, -8);
    arrowShape.lineTo(0, -4);
    arrowShape.lineTo(-8, -8);
    arrowShape.closePath();
    const arrowGeo = new THREE.ExtrudeGeometry(arrowShape, { depth: 2.5, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5 });
    arrowGeo.rotateX(-Math.PI / 2);
    const playerMesh = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    playerMesh.position.y = 2.5;
    const outlineRing = new THREE.Mesh(
      new THREE.RingGeometry(11, 13.5, 32),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    outlineRing.rotation.x = -Math.PI / 2;
    outlineRing.position.y = 1.2;
    const pulseRing = new THREE.Mesh(
      new THREE.RingGeometry(12, 14, 48),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    pulseRing.rotation.x = -Math.PI / 2;
    pulseRing.position.y = 1.0;
    playerGroup.add(playerMesh, outlineRing, pulseRing);

    // ── In-scene blips: beam + glowing head + sprite label (GTA chip) ──
    const blipMeshes = new Map<string, { group: THREE.Group; beacon: THREE.Mesh }>();
    blips.forEach((b) => {
      const group = new THREE.Group();
      const color = new THREE.Color(b.color);
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.6, 60, 12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.42 })
      );
      cyl.position.y = 30;
      const head = new THREE.Mesh(new THREE.SphereGeometry(4.4, 16, 12), new THREE.MeshBasicMaterial({ color }));
      head.position.y = 62;
      group.add(cyl, head);
      group.position.set(b.offsetX, 0, b.offsetZ);
      blipGroup.add(group);
      blipMeshes.set(b.id, { group, beacon: head });
    });
    // ── Purple GTA GPS waypoint route (player -> blip arc) ──
    const routeLine = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
    routeLine.visible = false;
    scene.add(routeLine);
    const blipWorld = new Map<string, THREE.Vector3>();
    blips.forEach((b) => blipWorld.set(b.id, new THREE.Vector3(b.offsetX, 4, b.offsetZ)));
    // destination beacon ring under the waypointed blip
    const beacon = new THREE.Mesh(
      new THREE.RingGeometry(6, 9, 32),
      new THREE.MeshBasicMaterial({ color: 0xc084fc, side: THREE.DoubleSide })
    );
    beacon.rotation.x = -Math.PI / 2;
    beacon.position.y = 1.5;
    beacon.visible = false;
    scene.add(beacon);
    const updateRoute = (wpId: string | null) => {
      const target = wpId ? blipWorld.get(wpId) : null;
      if (!target) {
        routeLine.visible = false;
        beacon.visible = false;
        return;
      }
      // L-shaped / urban block routed path like GTA GPS
      const midX = target.x * 0.55;
      const pathPoints = [
        new THREE.Vector3(0, 1.8, 0),
        new THREE.Vector3(midX, 1.8, 0),
        new THREE.Vector3(midX, 1.8, target.z),
        new THREE.Vector3(target.x, 1.8, target.z),
      ];
      const curve = new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.08);
      routeLine.geometry.dispose();
      routeLine.geometry = new THREE.TubeGeometry(curve, 36, 1.8, 8, false);
      routeLine.material = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.92 });
      beacon.position.set(target.x, 1.5, target.z);
      routeLine.visible = true;
      beacon.visible = true;
    };
    updateRoute(wpRef.current);
    routeRef.current = { updateRoute };

    // Raycast picking for blip heads + labels
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pickTargets: THREE.Object3D[] = [];
    blipMeshes.forEach(({ beacon }, id) => {
      beacon.userData.blipId = id;
      pickTargets.push(beacon);
    });
    const onPointerDown = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pickTargets, false)[0];
      if (hit) pickRef.current(String(hit.object.userData.blipId));
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation loop — everything lives in the WebGL scene; zero per-frame DOM
    let stopped = false;
    let raf = 0;
    const clock = new THREE.Clock();
    let lastRender = 0;
    const tick = () => {
      if (stopped) return;
      raf = requestAnimationFrame(tick);
      if (document.hidden) return; // background tab: skip GPU work entirely
      const now = performance.now();
      if (now - lastRender < 33) return; // ~30fps cap
      lastRender = now;
      controls.update(); // orient camera BEFORE projecting chips / rendering
      const dt = Math.min(0.08, clock.getDelta());
      const t = clock.getElapsedTime();
      // pulse radar ring around the player arrow (spec: 2s linear expand-fade)
      const cycle = (Date.now() % 2000) / 2000;
      const prScale = 1 + cycle * 2.4;
      pulseRing.scale.set(prScale, prScale, 1);
      (pulseRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.65 * (1 - (prScale - 1) / 2.4));
      // traffic
      if (!reducedMotion) {
        for (const car of traffic) {
          car.t = (car.t + car.speed * dt) % 1;
          const p = car.curve.getPointAt(car.t);
          car.mesh.position.copy(p);
        }
      }
      // selected blip: beacon bounce
      blipMeshes.forEach(({ beacon }, id) => {
        const sel = id === selectedBlipId;
        beacon.scale.setScalar(sel ? 1.5 + Math.sin(t * 4) * 0.25 : 1);
      });
      // floating HTML chips track the camera (throttled ~10fps, light DOM churn)
      frameCountRef.current += 1;
      if (frameCountRef.current % 3 === 0) {
        const w = container.clientWidth;
        const h = Math.max(1, container.clientHeight);
        chipRefs.current.forEach((el, key) => {
          const pos = key === '__home__' ? HOME_POS : blipWorld.get(key);
          if (!el || !pos) return;
          const v = pos.clone().project(camera);
          if (v.z > 1) {
            el.style.display = 'none';
            return;
          }
          el.style.display = 'flex';
          el.style.left = `${((v.x * 0.5 + 0.5) * w).toFixed(1)}px`;
          el.style.top = `${((v.y * -0.5 + 0.5) * h).toFixed(1)}px`;
          el.classList.toggle('is-active', key === selectedBlipId);
        });
      }
      renderer.render(scene, camera);
    };
    if (!reducedMotion) tick();
    else {
      controls.update();
      renderer.render(scene, camera);
    }
    // fallback driver: some environments (offscreen preview tabs) never fire rAF
    const intervalId = window.setInterval(tick, 200);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.clearInterval(intervalId);
      chipRefs.current.clear();
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      controls.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Sprite) {
          const map = (obj.material as THREE.SpriteMaterial).map;
          map?.dispose();
          (obj.material as THREE.SpriteMaterial).dispose();
        } else if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Line) {
          obj.geometry?.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
    // rebuild scene when the real grid or selection changes
  }, [grid, selectedBlipId, blips]);

  // rebuild the purple GPS route when the waypoint toggles (no full scene rebuild)
  useEffect(() => {
    routeRef.current?.updateRoute(waypointBlipId ?? null);
  }, [waypointBlipId, selectedBlipId, blips]);

  return (
    <div className="absolute inset-0" style={{ zIndex: 2 }} data-testid="live-grid-3d" data-blip-count={blips.length}>
      <div ref={containerRef} className="absolute inset-0" />
      {/* floating projected blips (spec CSS .gta-blip / .blip-icon / .blip-label) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-5" data-testid="blips-3d-layer">
        <div
          ref={(el) => { chipRefs.current.set('__home__', el); }}
          className="gta-blip"
          data-testid="home-gps-chip"
        >
          <span className="blip-icon" style={{ color: '#22d3ee' }}>
            <span className="text-[15px] leading-none">🏠</span>
          </span>
          <span className="blip-label font-gta" style={{ color: '#67e8f9' }}>خونه من</span>
        </div>
        {blips.map((b) => (
          <div
            key={b.id}
            ref={(el) => { chipRefs.current.set(b.id, el); }}
            onClick={() => onPickBlip(b.id)}
            className="gta-blip"
            data-testid={`blip-3d-${b.id}`}
          >
            <span className="blip-icon" style={{ color: b.color }}>
              <span className="block w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
            </span>
            <span className="blip-label font-gta">{b.title.split(' ')[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveGrid3D;
