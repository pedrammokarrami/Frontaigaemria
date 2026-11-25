/**
 * Pure math utilities for the interactive 360° FC 27 Stadium Turntable Video.
 */

export interface MicroTiltState {
  rotateX: number;
  rotateY: number;
}

/**
 * Computes wrapped playback timestamp when dragging horizontally across the stadium turntable.
 * Guarantees a finite value strictly inside [0, duration) even for large negative drags.
 */
export function computeScrubbedTime(
  currentTime: number,
  dx: number,
  duration: number,
  sensitivity = 0.015
): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  const safeCurrent = Number.isFinite(currentTime) ? currentTime : 0;
  const safeDx = Number.isFinite(dx) ? dx : 0;
  const raw = safeCurrent + safeDx * sensitivity;
  return ((raw % duration) + duration) % duration;
}

/**
 * Computes subtle clamped 3D perspective micro-tilt angles from normalized pointer offsets [-1, 1].
 */
export function computeMicroTilt(
  normX: number,
  normY: number,
  maxDeg = 6.5
): MicroTiltState {
  const clamp = (v: number) => (v < -1 ? -1 : v > 1 ? 1 : v);
  const cx = Number.isFinite(normX) ? clamp(normX) : 0;
  const cy = Number.isFinite(normY) ? clamp(normY) : 0;
  return {
    rotateX: Number((-cy * maxDeg).toFixed(2)),
    rotateY: Number((cx * maxDeg).toFixed(2)),
  };
}
