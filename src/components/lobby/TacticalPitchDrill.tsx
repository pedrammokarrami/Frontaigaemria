import { useEffect, useRef, useState } from 'react';
import type { PitchDrillScenario } from '../../types/aipetros';
import { evaluateThroughBallPass } from '../../utils/aipetrosRules';

interface TacticalPitchDrillProps {
  drill: PitchDrillScenario;
  running: boolean;
  defenderPhase: number;
  onPassComplete: (result: { intercepted: boolean; inTargetZone: boolean; distanceToTarget: number }) => void;
}

const PASSER_POS = { x: 0, z: 7.4 };

interface BallFlight {
  from: { x: number; z: number };
  to: { x: number; z: number };
  progress: number; // 0..1
  intercepted: boolean;
  inTargetZone: boolean;
}

/**
 * Broadcast-grade 2D Tactical Pitch Radar Canvas for EA SPORTS FC through-ball drills.
 * Features mowed turf stripes, 18-yard & 6-yard penalty boxes, goal net, animated striker run,
 * patrolling defender interception radii, aim-corridor preview, and animated ball flight.
 */
export function TacticalPitchDrill({
  drill,
  running,
  defenderPhase,
  onPassComplete,
}: TacticalPitchDrillProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [aimPoint, setAimPoint] = useState<{ x: number; z: number } | null>(null);
  const flightRef = useRef<BallFlight | null>(null);
  const lastOutcomeRef = useRef<'win' | 'miss' | null>(null);

  // Reset visual flight whenever drill restarts
  useEffect(() => {
    if (running) {
      flightRef.current = null;
      lastOutcomeRef.current = null;
    }
  }, [running, drill.id]);

  // Animate ball flight smoothly when user taps a pass target
  useEffect(() => {
    let raf = 0;
    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.clientWidth || 320;
      const cssH = canvas.clientHeight || 292;
      if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Coordinate helpers: pitch margin inside canvas so lines/reticles never clip edge
      const padX = 14;
      const padTop = 20;
      const padBot = 12;
      const pitchW = cssW - padX * 2;
      const pitchH = cssH - padTop - padBot;

      const toPx = (wx: number, wz: number) => ({
        px: padX + ((wx + 8) / 16) * pitchW,
        py: padTop + ((wz + 10) / 20) * pitchH,
      });

      // 1. Stadium apron & mowed turf alternating stripes
      ctx.fillStyle = '#07130F';
      ctx.fillRect(0, 0, cssW, cssH);

      const stripeCount = 10;
      const stripeH = pitchH / stripeCount;
      for (let i = 0; i < stripeCount; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#0C2319' : '#102C20';
        ctx.fillRect(padX, padTop + i * stripeH, pitchW, stripeH + 0.5);
      }

      // Floodlight stadium radial vignette
      const grad = ctx.createRadialGradient(cssW * 0.5, cssH * 0.35, 16, cssW * 0.5, cssH * 0.5, cssW * 0.85);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.06)');
      grad.addColorStop(0.55, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, 'rgba(4, 9, 8, 0.65)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cssW, cssH);

      // 2. Crisp Broadcast Pitch Markings
      ctx.strokeStyle = 'rgba(244, 245, 247, 0.28)';
      ctx.lineWidth = 1.3;
      ctx.strokeRect(padX, padTop, pitchW, pitchH);

      // Halfway line & center semicircle
      const midY = padTop + pitchH * 0.64;
      ctx.beginPath();
      ctx.moveTo(padX, midY);
      ctx.lineTo(padX + pitchW, midY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cssW / 2, midY, pitchW * 0.17, 0, Math.PI * 2);
      ctx.stroke();

      // Goal Net & Crossbar at top
      const goalW = pitchW * 0.24;
      const goalX = (cssW - goalW) / 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(goalX, padTop - 10, goalW, 10);
      ctx.strokeStyle = 'rgba(244, 245, 247, 0.5)';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(goalX, padTop - 10, goalW, 10);

      // 18-yard & 6-yard penalty boxes
      const box18W = pitchW * 0.6;
      const box18H = pitchH * 0.27;
      ctx.strokeStyle = 'rgba(244, 245, 247, 0.28)';
      ctx.lineWidth = 1.3;
      ctx.strokeRect((cssW - box18W) / 2, padTop, box18W, box18H);

      const box6W = pitchW * 0.32;
      const box6H = pitchH * 0.1;
      ctx.strokeRect((cssW - box6W) / 2, padTop, box6W, box6H);

      // Penalty arc ("D")
      ctx.beginPath();
      ctx.arc(cssW / 2, padTop + box18H - 12, pitchW * 0.14, 0.18 * Math.PI, 0.82 * Math.PI);
      ctx.stroke();

      // Corner arcs
      const cr = 8;
      ctx.beginPath();
      ctx.arc(padX, padTop, cr, 0, Math.PI * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(padX + pitchW, padTop, cr, Math.PI * 0.5, Math.PI);
      ctx.stroke();

      // 3. Target Half-Space Pocket (clamped cleanly inside the 18-yard box away from goal-line)
      const clampedTargetZ = Math.max(-6.4, Math.min(4, drill.targetZone.z));
      const clampedTargetX = Math.max(-5.6, Math.min(5.6, drill.targetZone.x));
      const tPos = toPx(clampedTargetX, clampedTargetZ);
      const tRadiusPx = (drill.targetZone.radius / 16) * pitchW;

      const pulse = 0.5 + 0.5 * Math.sin(now * 0.005);
      const zoneGrad = ctx.createRadialGradient(tPos.px, tPos.py, 2, tPos.px, tPos.py, tRadiusPx);
      zoneGrad.addColorStop(0, 'rgba(56, 189, 248, 0.34)');
      zoneGrad.addColorStop(0.65, 'rgba(56, 189, 248, 0.14)');
      zoneGrad.addColorStop(1, 'rgba(56, 189, 248, 0.02)');
      ctx.fillStyle = zoneGrad;
      ctx.beginPath();
      ctx.arc(tPos.px, tPos.py, tRadiusPx, 0, Math.PI * 2);
      ctx.fill();

      // Outer dashed cyan pocket ring
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.lineDashOffset = -now * 0.018;
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.65 + pulse * 0.35})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(tPos.px, tPos.py, tRadiusPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Inner tactical crosshair
      ctx.strokeStyle = 'rgba(204, 255, 0, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(tPos.px - 6, tPos.py);
      ctx.lineTo(tPos.px + 6, tPos.py);
      ctx.moveTo(tPos.px, tPos.py - 6);
      ctx.lineTo(tPos.px, tPos.py + 6);
      ctx.stroke();

      // 4. Teammate Striker #9 making forward run toward target pocket
      const runCycle = (defenderPhase * 0.45) % 1;
      const stX = drill.strikerStart.x + (clampedTargetX - drill.strikerStart.x) * Math.min(0.75, runCycle * 0.85);
      const stZ = drill.strikerStart.z + (clampedTargetZ + 1.8 - drill.strikerStart.z) * Math.min(0.75, runCycle * 0.85);
      const stPos = toPx(stX, stZ);

      // Dashed striker run vector
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(204, 255, 0, 0.45)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(stPos.px, stPos.py);
      ctx.lineTo(tPos.px, tPos.py);
      ctx.stroke();
      ctx.restore();

      // Striker token (#9)
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(stPos.px, stPos.py, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#F4F5F7';
      ctx.font = 'bold 9px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('9', stPos.px, stPos.py + 0.5);

      // 5. Patrolling Defenders (#4, #6) + Interception Radius Zones
      const liveDefs = drill.defenderPatrols.map((d, idx) => ({
        x: d.x + Math.sin(defenderPhase * d.speed + idx * 1.7) * d.range * 0.5,
        z: d.z,
      }));
      const interceptPx = (1.35 / 16) * pitchW;

      liveDefs.forEach((def, idx) => {
        const dp = toPx(def.x, def.z);
        // Translucent red interception zone
        ctx.fillStyle = 'rgba(244, 63, 94, 0.14)';
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.42)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(dp.px, dp.py, interceptPx, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Defender token
        ctx.fillStyle = '#9F1239';
        ctx.strokeStyle = '#FDA4AF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dp.px, dp.py, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(idx === 0 ? '4' : '6', dp.px, dp.py + 0.5);
      });

      // 6. Ball Carrier (#10 CAM) at pass origin
      const camPos = toPx(PASSER_POS.x, PASSER_POS.z);

      // Aim corridor preview when hovering/aiming
      if (aimPoint && running && !flightRef.current) {
        const ap = toPx(aimPoint.x, aimPoint.z);
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(204, 255, 0, 0.72)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(camPos.px, camPos.py - 8);
        ctx.lineTo(ap.px, ap.py);
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = 'rgba(204, 255, 0, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ap.px, ap.py, 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // CAM Token (#10)
      ctx.fillStyle = '#182412';
      ctx.strokeStyle = '#CCFF00';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(camPos.px, camPos.py, 10.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#CCFF00';
      ctx.font = 'bold 9px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('10', camPos.px, camPos.py + 0.5);

      // 7. Animated Ball Flight or Ball at CAM's foot
      let ballPx = { px: camPos.px, py: camPos.py - 12 };
      if (flightRef.current) {
        flightRef.current.progress = Math.min(1, flightRef.current.progress + dt * 4.2);
        const p = flightRef.current.progress;
        const fromPx = toPx(flightRef.current.from.x, flightRef.current.from.z);
        const toTargetPx = toPx(flightRef.current.to.x, flightRef.current.to.z);
        const bx = fromPx.px + (toTargetPx.px - fromPx.px) * p;
        const by = fromPx.py + (toTargetPx.py - fromPx.py) * p;
        ballPx = { px: bx, py: by };

        // Ball flight tracer tail
        const trailGrad = ctx.createLinearGradient(fromPx.px, fromPx.py, bx, by);
        trailGrad.addColorStop(0, 'rgba(204, 255, 0, 0)');
        trailGrad.addColorStop(
          1,
          flightRef.current.intercepted ? 'rgba(244, 63, 94, 0.85)' : 'rgba(56, 189, 248, 0.9)'
        );
        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(fromPx.px, fromPx.py);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }

      // Draw crisp Soccer Ball
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#0A0B0E';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(ballPx.px, ballPx.py, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0A0B0E';
      ctx.beginPath();
      ctx.arc(ballPx.px, ballPx.py, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      const flightActive = Boolean(flightRef.current && flightRef.current.progress < 1);
      if (running || flightActive) {
        raf = requestAnimationFrame(draw);
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [drill, running, defenderPhase, aimPoint]);

  const eventToWorld = (clientX: number, clientY: number, el: HTMLCanvasElement) => {
    const rect = el.getBoundingClientRect();
    const padX = 14;
    const padTop = 20;
    const padBot = 12;
    const pitchW = rect.width - padX * 2;
    const pitchH = rect.height - padTop - padBot;
    const x = ((clientX - rect.left - padX) / pitchW) * 16 - 8;
    const z = ((clientY - rect.top - padTop) / pitchH) * 20 - 10;
    return {
      x: Math.max(-7.5, Math.min(7.5, x)),
      z: Math.max(-9.5, Math.min(9.5, z)),
    };
  };

  const handleTap = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!running || flightRef.current) return;
    const target = eventToWorld(e.clientX, e.clientY, e.currentTarget);

    // Build live defender snapshot
    const defs = drill.defenderPatrols.map((d, idx) => ({
      x: d.x + Math.sin(defenderPhase * d.speed + idx * 1.7) * d.range * 0.5,
      z: d.z,
    }));

    // Check both pass corridor intersection and landing point
    const clampedTarget = {
      ...drill.targetZone,
      x: Math.max(-5.6, Math.min(5.6, drill.targetZone.x)),
      z: Math.max(-6.4, Math.min(4, drill.targetZone.z)),
    };

    const evalRes = evaluateThroughBallPass(target, clampedTarget, defs);
    // Also check if the pass ray crosses a defender's interception circle
    const rayBlocked = defs.some((def) => {
      const vx = target.x - PASSER_POS.x;
      const vz = target.z - PASSER_POS.z;
      const lenSq = vx * vx + vz * vz || 1;
      const t = Math.max(0, Math.min(1, ((def.x - PASSER_POS.x) * vx + (def.z - PASSER_POS.z) * vz) / lenSq));
      const cx = PASSER_POS.x + t * vx;
      const cz = PASSER_POS.z + t * vz;
      return Math.hypot(cx - def.x, cz - def.z) < 1.15;
    });

    const intercepted = evalRes.intercepted || rayBlocked;
    const inTargetZone = !intercepted && evalRes.inTargetZone;

    flightRef.current = {
      from: { x: PASSER_POS.x, z: PASSER_POS.z - 0.8 },
      to: target,
      progress: 0,
      intercepted,
      inTargetZone,
    };
    lastOutcomeRef.current = inTargetZone ? 'win' : 'miss';
    setAimPoint(null);

    onPassComplete({
      intercepted,
      inTargetZone,
      distanceToTarget: evalRes.distanceToTarget,
    });
  };

  return (
    <div className="mx-auto w-full max-w-[324px] overflow-hidden rounded-2xl border border-white/15 bg-[#07130F] shadow-[0_20px_48px_rgba(0,0,0,0.75)]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0A0B0E]/90 px-3 py-1.5 text-[10px] font-semibold text-[#F4F5F7]/75">
        <span>EA FC · TACTICAL RADAR</span>
        <span className="font-mono-tabular text-[#38BDF8]">TARGET: CYAN POCKET</span>
      </div>
      <canvas
        ref={canvasRef}
        onClick={handleTap}
        onMouseMove={(e) => {
          if (!running || flightRef.current) return;
          setAimPoint(eventToWorld(e.clientX, e.clientY, e.currentTarget));
        }}
        onMouseLeave={() => setAimPoint(null)}
        aria-label="Tactical Passing Pitch"
        className="block h-[278px] w-full cursor-crosshair touch-none"
      />
    </div>
  );
}
