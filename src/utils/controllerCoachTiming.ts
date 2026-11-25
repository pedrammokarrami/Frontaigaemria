import type { MotionCoachPayload, MotionGraphicArchetype } from '../agents/motionCoachAgent';

export type ControllerRigMode = 'gamepad' | 'kbm';

export interface ButtonGlowState {
  L1: number;
  R1: number;
  L2: number;
  R2: number;
  triangle: number;
  circle: number;
  cross: number;
  square: number;
  keyW: number;
  keyA: number;
  keyS: number;
  keyD: number;
  space: number;
  lmb: number;
  rmb: number;
}

export interface ControllerSyncSnapshot {
  rigMode: ControllerRigMode;
  phaseT: number;
  progressPct: number;
  inSweetSpot: boolean;
  isLateZone: boolean;
  arcProgress: number;
  glow: ButtonGlowState;
  activeButtonLabels: string[];
  accentColorHex: number;
}

export function resolveControllerRigMode(archetype: MotionGraphicArchetype): ControllerRigMode {
  return archetype === 'shooter_crosshair_peek' ? 'kbm' : 'gamepad';
}

function emptyGlow(): ButtonGlowState {
  return {
    L1: 0,
    R1: 0,
    L2: 0,
    R2: 0,
    triangle: 0,
    circle: 0,
    cross: 0,
    square: 0,
    keyW: 0,
    keyA: 0,
    keyS: 0,
    keyD: 0,
    space: 0,
    lmb: 0,
    rmb: 0,
  };
}

/**
 * Pure deterministic synchronization between the coaching cycle phase (0..1),
 * the 3D frosted-glass controller emissive button glows, and the 3D mini-arena trajectory arc.
 */
export function computeControllerSyncSnapshot(
  archetype: MotionGraphicArchetype,
  phaseT: number,
  sweetSpotStartPct: number,
  sweetSpotEndPct: number
): ControllerSyncSnapshot {
  const clampedT = ((phaseT % 1) + 1) % 1;
  const progressPct = Math.round(clampedT * 100);
  const inSweetSpot = progressPct >= sweetSpotStartPct && progressPct <= sweetSpotEndPct;
  const isLateZone = progressPct > sweetSpotEndPct + 8;
  const rigMode = resolveControllerRigMode(archetype);

  // Smooth pulse for active highlight (0.72..1.0)
  const pulse = 0.78 + 0.22 * Math.sin(clampedT * Math.PI * 8);
  const glow = emptyGlow();
  const activeButtonLabels: string[] = [];

  // Normalized progress of the 3D glowing trajectory orb along the mini-arena curve
  const arcProgress = Math.max(0, Math.min(1, (clampedT - 0.1) / 0.72));

  let accentColorHex = 0x10b981; // Emerald default

  if (archetype === 'sports_pitch_arc') {
    accentColorHex = isLateZone ? 0xf43f5e : 0x10b981;
    if (progressPct < sweetSpotStartPct) {
      // Preparation phase: L1 triggers striker run
      glow.L1 = pulse;
      activeButtonLabels.push('L1');
    } else if (inSweetSpot) {
      // Sweet spot release: L1 + R1 + △ surge together
      glow.L1 = 1;
      glow.R1 = 1;
      glow.triangle = 1;
      activeButtonLabels.push('L1', 'R1', '△');
    } else if (isLateZone) {
      // Late / Offside warning pulse on △
      glow.triangle = 0.65 * pulse;
      activeButtonLabels.push('△');
    } else {
      glow.R1 = 0.55;
      glow.triangle = 0.7;
      activeButtonLabels.push('R1', '△');
    }
  } else if (archetype === 'shooter_crosshair_peek') {
    // Sharp cyan-emerald (#22d3ee) counter-strafe lock pulse — exclusively A, D, and LMB
    accentColorHex = 0x22d3ee;
    if (progressPct < sweetSpotStartPct) {
      // Strafe out (A) -> counter-strafe brake tap (D)
      const isSecondHalf = progressPct > sweetSpotStartPct * 0.55;
      glow.keyA = isSecondHalf ? 0.35 : pulse;
      glow.keyD = isSecondHalf ? pulse : 0.25;
      activeButtonLabels.push(isSecondHalf ? 'D' : 'A');
    } else if (inSweetSpot) {
      // 180ms zero-velocity counter-strafe lock + LMB burst
      glow.keyA = 0.82;
      glow.keyD = 1.0;
      glow.lmb = 1.0;
      activeButtonLabels.push('A/D', 'LMB');
    } else if (isLateZone) {
      // Re-strafe reset on A/D while LMB fades down
      glow.keyA = 0.65 * pulse;
      glow.keyD = 0.28;
      glow.lmb = 0.32;
      activeButtonLabels.push('A/D');
    } else {
      // Immediate post-burst counter-strafe recovery
      glow.keyD = 0.72;
      glow.lmb = 0.55;
      activeButtonLabels.push('D', 'LMB');
    }
  } else if (archetype === 'racing_apex_line') {
    accentColorHex = isLateZone ? 0xf43f5e : 0x38bdf8;
    if (progressPct < sweetSpotStartPct) {
      // Trail braking into corner
      glow.L2 = pulse;
      activeButtonLabels.push('L2');
    } else if (inSweetSpot) {
      // Apex throttle + ERS boost
      glow.R2 = 1;
      glow.cross = 1;
      activeButtonLabels.push('R2', '✕');
    } else {
      glow.R2 = 0.7;
      activeButtonLabels.push('R2');
    }
  } else {
    // Strategy / GTA / Action flank & tactical combo
    accentColorHex = isLateZone ? 0xf43f5e : 0xec4899;
    if (progressPct < sweetSpotStartPct) {
      glow.R1 = pulse;
      activeButtonLabels.push('R1');
    } else if (inSweetSpot) {
      glow.L2 = 1;
      glow.R2 = 1;
      glow.circle = 1;
      activeButtonLabels.push('L2', 'R2', '○');
    } else if (isLateZone) {
      glow.circle = 0.6 * pulse;
      activeButtonLabels.push('○');
    } else {
      glow.R1 = 0.55;
      glow.circle = 0.7;
      activeButtonLabels.push('R1', '○');
    }
  }

  return {
    rigMode,
    phaseT: clampedT,
    progressPct,
    inSweetSpot,
    isLateZone,
    arcProgress,
    glow,
    activeButtonLabels,
    accentColorHex,
  };
}

export interface CompactComboStrip {
  triggerToken: string;
  windowToken: string;
  executionToken: string;
}

/**
 * Formats the compact glowing combo strip (`[L1] ➔ ۰.۲۵s ➔ [L1 + R1 + △]`)
 * with concise tokens guaranteed not to overflow on 390px mobile viewports.
 */
export function formatCompactComboStrip(payload: Pick<
  MotionCoachPayload,
  'archetype' | 'triggerBadge' | 'timingWindowLabelFa' | 'executionBadge'
>): CompactComboStrip {
  let executionToken = payload.executionBadge;
  if (payload.archetype === 'shooter_crosshair_peek' && executionToken.length > 18) {
    executionToken = 'A/D + LMB';
  }
  return {
    triggerToken: `[${payload.triggerBadge}]`,
    windowToken: payload.timingWindowLabelFa,
    executionToken: `[${executionToken}]`,
  };
}
