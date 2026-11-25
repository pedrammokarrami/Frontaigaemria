import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Check, ChevronLeft, ChevronRight, Copy, Share2, X } from 'lucide-react';
import {
  PREDICTION_MATCHES,
  REALM_CONFIGS,
  VIRAL_HIGHLIGHTS,
  WAR_ROOM_NODES,
} from '../../data/realmsData';
import type {
  ModuleDrawerId,
  RealmId,
  SpatialOsState,
  ViralHighlightItem,
  WarRoomNode,
} from '../../types/spatial';

interface SideHudWidgetProps {
  activeMenu: Exclude<ModuleDrawerId, 'coach' | null>;
  realm: RealmId;
  state: SpatialOsState;
  onClose: () => void;
  onChallengeNode: (node: WarRoomNode) => void;
  onCourtVote: (caseId: string, decision: 'uphold' | 'acquit') => void;
  onShareHighlight: (item: ViralHighlightItem) => void;
  onPlaceStake: (matchId: string, side: 'A' | 'B', amount: number) => void;
  onCopyInvite: () => void;
}

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

const MiniRivalGlobe: React.FC<{ realm: RealmId; selectedId: string }> = ({
  realm,
  selectedId,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const cfg = REALM_CONFIGS[realm];
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const w = Math.max(container.clientWidth, 240);
    const h = Math.max(container.clientHeight, 165);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    let isSoftwareGl = false;
    try {
      const gl = renderer.getContext();
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        isSoftwareGl = /SwiftShader|llvmpipe|Software|Mesa/i.test(
          String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '')
        );
      }
    } catch {
      // ignore
    }

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 25);
    camera.position.set(0, 0.55, 3.6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = !isSoftwareGl;
    controls.autoRotate = !isSoftwareGl;
    controls.autoRotateSpeed = 0.85;

    const accent = new THREE.Color(cfg.accentHex);
    const group = new THREE.Group();
    scene.add(group);

    group.add(
      new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.08, 2),
        new THREE.MeshBasicMaterial({
          color: accent,
          wireframe: true,
          transparent: true,
          opacity: 0.25,
        })
      )
    );

    const markers: THREE.Mesh[] = [];
    WAR_ROOM_NODES.forEach((node) => {
      const pos = latLonToVec3(node.lat, node.lon, 1.12);
      const pin = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.06, 0),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(REALM_CONFIGS[node.realm].accentHex),
        })
      );
      pin.position.copy(pos);
      pin.userData.id = node.id;
      group.add(pin);
      markers.push(pin);
    });

    let frameId = 0;
    let unmounted = false;

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
      controls.update();
      if (isSoftwareGl) {
        group.rotation.y += 0.015;
      }
      markers.forEach((m) => {
        const s = m.userData.id === selectedRef.current ? 1.6 : 1.0;
        m.scale.setScalar(s);
      });
      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      unmounted = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.dispose();
      group.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [realm, cfg.accentHex]);

  return <div ref={mountRef} className="w-full h-[168px] cursor-grab active:cursor-grabbing" />;
};

export const SideHudWidget: React.FC<SideHudWidgetProps> = ({
  activeMenu,
  realm,
  state,
  onClose,
  onChallengeNode,
  onCourtVote,
  onShareHighlight,
  onPlaceStake,
  onCopyInvite,
}) => {
  const cfg = REALM_CONFIGS[realm];
  const [radarIdx, setRadarIdx] = useState(0);
  const [hlIdx, setHlIdx] = useState(0);
  const [copiedHighlight, setCopiedHighlight] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const orderedNodes = useMemo(
    () => [...WAR_ROOM_NODES].sort((a, b) => (a.realm === realm ? -1 : b.realm === realm ? 1 : 0)),
    [realm]
  );
  const activeNode = orderedNodes[radarIdx % orderedNodes.length];

  const activeCase = useMemo(
    () => state.courtCases.find((c) => c.realm === realm) ?? state.courtCases[0],
    [state.courtCases, realm]
  );

  const orderedHighlights = useMemo(
    () => [...VIRAL_HIGHLIGHTS].sort((a, b) => (a.realm === realm ? -1 : b.realm === realm ? 1 : 0)),
    [realm]
  );
  const activeHighlight = orderedHighlights[hlIdx % orderedHighlights.length];

  const activeMatch = useMemo(
    () => PREDICTION_MATCHES.find((m) => m.realm === realm) ?? PREDICTION_MATCHES[0],
    [realm]
  );
  const activeStake = state.stakes.find((s) => s.matchId === activeMatch.id);

  const titleLabel =
    activeMenu === 'radar'
      ? 'RIVAL RADAR'
      : activeMenu === 'court'
        ? 'REALITY COURT'
        : activeMenu === 'highlights'
          ? 'HIGHLIGHT REELS'
          : 'MATCH ARENA';

  return (
    <aside
      data-testid={`side-hud-${activeMenu}`}
      aria-label={titleLabel}
      className="fixed z-30 left-3 right-3 bottom-16 max-h-[46vh] md:left-7 md:right-auto md:top-20 md:bottom-auto md:w-[310px] md:max-w-[320px] md:max-h-[68vh] fc27-panel overflow-y-auto no-scrollbar py-3 px-3.5 flex flex-col gap-2.5 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
    >
      {/* FC 27 Broadcast Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/12">
        <span
          className="font-display text-sm font-black italic uppercase tracking-[0.16em]"
          style={{ color: cfg.accentHex }}
        >
          {titleLabel}
        </span>
        <button
          type="button"
          onClick={onClose}
          data-testid="close-drawer-btn"
          aria-label="Close widget"
          className="w-7 h-7 fc27-btn-dark flex items-center justify-center text-white/75 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 1. RADAR */}
      {activeMenu === 'radar' && activeNode && (
        <div className="flex flex-col gap-2">
          <div className="fc27-card p-1">
            <MiniRivalGlobe realm={realm} selectedId={activeNode.id} />
          </div>

          <div className="flex items-center justify-between gap-1">
            {orderedNodes.slice(0, 3).map((node, i) => (
              <button
                key={node.id}
                type="button"
                onClick={() => setRadarIdx(i)}
                className="flex-1 py-1 px-1.5 fc27-chamfer-sm text-[10px] font-mono-tabular font-black uppercase truncate cursor-pointer transition"
                style={{
                  color: i === radarIdx % orderedNodes.length ? '#07080A' : 'rgba(255,255,255,0.78)',
                  backgroundColor:
                    i === radarIdx % orderedNodes.length ? cfg.accentHex : 'rgba(255,255,255,0.08)',
                }}
              >
                {node.city} · {node.dnaMatch}%
              </button>
            ))}
          </div>

          <div className="fc27-card px-2.5 py-2 flex items-center justify-between text-xs">
            <span className="font-extrabold text-white truncate">{activeNode.name}</span>
            <span className="font-mono-tabular text-[11px] font-black" style={{ color: cfg.accentHex }}>
              {activeNode.prizeOrStake}
            </span>
          </div>

          <button
            type="button"
            data-testid="radar-challenge-btn"
            onClick={() => onChallengeNode(activeNode)}
            disabled={state.challengedNodeIds.includes(activeNode.id)}
            className="w-full py-2 fc27-btn-volt text-xs uppercase tracking-wider cursor-pointer disabled:opacity-55"
            style={{ backgroundColor: cfg.accentHex, color: '#07080A' }}
          >
            {state.challengedNodeIds.includes(activeNode.id)
              ? 'SIGNAL DISPATCHED'
              : 'CHALLENGE (+50 XP)'}
          </button>
        </div>
      )}

      {/* 2. COURT */}
      {activeMenu === 'court' && activeCase && (
        <div className="flex flex-col gap-2">
          <div className="relative aspect-video fc27-card-live overflow-hidden">
            <video
              src={activeCase.clipVideoUrl ?? '/media/lobby-bg.mp4'}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover opacity-80"
            />
            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-[#FF2E54] font-mono-tabular text-[9px] font-black text-white uppercase">
              {activeCase.anomalyScore}% ANOMALY · {activeCase.suspectHandle}
            </span>
          </div>

          <div className="fc27-card px-2.5 py-1.5 font-mono-tabular text-[10px] font-bold text-white/80 flex items-center justify-between">
            <span>{activeCase.c2paStatus}</span>
            <span className="text-[#CCFF00]">
              {activeCase.votesUphold} GUILTY / {activeCase.votesAcquit} CLEAN
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              data-testid="court-vote-uphold"
              onClick={() => onCourtVote(activeCase.id, 'uphold')}
              className="py-2 fc27-chamfer-sm text-xs font-black uppercase tracking-wider cursor-pointer"
              style={{
                backgroundColor:
                  activeCase.userVote === 'uphold' ? '#FF2E54' : 'rgba(255,46,84,0.24)',
                color: '#FFFFFF',
              }}
            >
              UPHOLD (+120 XP)
            </button>
            <button
              type="button"
              data-testid="court-vote-acquit"
              onClick={() => onCourtVote(activeCase.id, 'acquit')}
              className="py-2 fc27-chamfer-sm text-xs font-black uppercase tracking-wider cursor-pointer"
              style={{
                backgroundColor:
                  activeCase.userVote === 'acquit' ? '#CCFF00' : 'rgba(204,255,0,0.2)',
                color: activeCase.userVote === 'acquit' ? '#05070B' : '#FFFFFF',
              }}
            >
              ACQUIT (+120 XP)
            </button>
          </div>
        </div>
      )}

      {/* 3. HIGHLIGHTS */}
      {activeMenu === 'highlights' && activeHighlight && (
        <div className="flex flex-col gap-2">
          <div className="relative aspect-video fc27-card-volt overflow-hidden">
            <video
              src={activeHighlight.clipUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover opacity-85"
            />
            <span
              className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-[#05070B]/90 border border-[#CCFF00]/50 font-mono-tabular text-[10px] font-black"
              style={{ color: cfg.accentHex }}
            >
              {activeHighlight.hudStats[0]?.label}: {activeHighlight.hudStats[0]?.value}
            </span>
          </div>

          <div className="fc27-card px-2.5 py-2 flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-white truncate">
              {activeHighlight.title}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                aria-label="Previous highlight"
                onClick={() =>
                  setHlIdx((i) => (i - 1 + orderedHighlights.length) % orderedHighlights.length)
                }
                className="p-1 fc27-btn-dark text-white/80 hover:text-white cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label="Next highlight"
                onClick={() => setHlIdx((i) => (i + 1) % orderedHighlights.length)}
                className="p-1 fc27-btn-dark text-white/80 hover:text-white cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            type="button"
            data-testid={`share-highlight-${activeHighlight.id}`}
            onClick={() => {
              onShareHighlight(activeHighlight);
              setCopiedHighlight(true);
              setTimeout(() => setCopiedHighlight(false), 1600);
            }}
            className="w-full py-2 fc27-btn-volt text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: cfg.accentHex, color: '#07080A' }}
          >
            {copiedHighlight ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedHighlight ? 'COPIED LINK' : 'SHARE REEL (+25 XP)'}</span>
          </button>
        </div>
      )}

      {/* 4. ARENA */}
      {activeMenu === 'arena' && activeMatch && (
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-black text-white">{activeMatch.eventTitle}</div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              data-testid={`stake-${activeMatch.id}-A`}
              onClick={() => onPlaceStake(activeMatch.id, 'A', 100)}
              disabled={state.platformPoints < 100}
              className={`py-2 px-2.5 text-left cursor-pointer transition disabled:opacity-45 ${
                activeStake?.side === 'A' ? 'fc27-card-volt' : 'fc27-card'
              }`}
            >
              <div className="text-[11px] font-black text-white truncate">
                {activeMatch.teamA.name}
              </div>
              <div className="font-mono-tabular text-[10px] font-black mt-0.5" style={{ color: cfg.accentHex }}>
                {activeMatch.teamA.odds}x · 100 PTS
              </div>
            </button>

            <button
              type="button"
              data-testid={`stake-${activeMatch.id}-B`}
              onClick={() => onPlaceStake(activeMatch.id, 'B', 100)}
              disabled={state.platformPoints < 100}
              className={`py-2 px-2.5 text-left cursor-pointer transition disabled:opacity-45 ${
                activeStake?.side === 'B' ? 'fc27-card-gold' : 'fc27-card'
              }`}
            >
              <div className="text-[11px] font-black text-white truncate">
                {activeMatch.teamB.name}
              </div>
              <div className="font-mono-tabular text-[10px] font-black mt-0.5" style={{ color: cfg.accentHex }}>
                {activeMatch.teamB.odds}x · 100 PTS
              </div>
            </button>
          </div>

          {activeStake && (
            <div className="fc27-card-volt px-2.5 py-1.5 font-mono-tabular text-[10px] font-black text-[#CCFF00]">
              ACTIVE: {activeStake.amount} PTS → {activeStake.potentialPayout} PTS
            </div>
          )}

          {/* Deathmatch Viral Invite Strip */}
          <div className="fc27-card p-2.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono-tabular text-[10px] font-black text-white/80">
              <span>DEATHMATCH PASS</span>
              <span style={{ color: cfg.accentHex }}>
                {state.invitesSent}/{state.invitesTarget} INVITES
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#06090F] overflow-hidden border border-white/10">
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.min(100, (state.invitesSent / state.invitesTarget) * 100)}%`,
                  backgroundColor: cfg.accentHex,
                }}
              />
            </div>
            <button
              type="button"
              data-testid="copy-deathmatch-invite"
              onClick={() => {
                onCopyInvite();
                setCopiedInvite(true);
                setTimeout(() => setCopiedInvite(false), 1600);
              }}
              className="w-full py-1.5 fc27-btn-volt text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: cfg.accentHex, color: '#07080A' }}
            >
              {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedInvite ? 'INVITE SENT' : 'COPY INVITE (+25 PTS)'}</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
