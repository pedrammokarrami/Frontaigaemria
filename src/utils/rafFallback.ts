/**
 * rAF fallback — background/idle browser tabs (and some phones) throttle
 * requestAnimationFrame to ZERO ticks, which leaves framer-motion exit
 * animations permanently unfinished (hub views stack instead of swapping)
 * and stalls every rAF-gated loop in the app.
 *
 * Two-part defense:
 * 1. Shim — if the native rAF produces no ticks across two probe windows
 *    (probes are async: the tick count is read only after the window
 *    elapses), window.requestAnimationFrame is re-pointed at a
 *    setTimeout(16ms) scheduler with a paired clearTimeout-based
 *    cancelAnimationFrame that only cancels ids the shim itself issued.
 *    If the environment later becomes healthy again (visibilitychange/
 *    pageshow re-probe), the native function is restored.
 * 2. Motion driver — motion's frameloop captured the native rAF at
 *    module-eval time, so re-pointing the global cannot reach it. While
 *    shimmed, the frameloop render steps (exported by motion as
 *    frameSteps/frameData) are driven manually on a short interval with
 *    real elapsed delta so pending instant/exit animations actually
 *    finish even when native rAF is dead.
 *
 * Every mode change dispatches 'aipetros-raf-frozen' (detail: boolean) so
 * the app can enable MotionConfig skipAnimations while frozen.
 */

import { frameData, frameSteps } from './motionFrameSteps';

export const RAF_FROZEN_EVENT = 'aipetros-raf-frozen';

let installed = false;
let shimmed = false;
let nativeRaf: typeof window.requestAnimationFrame | null = null;
let nativeCancel: typeof window.cancelAnimationFrame | null = null;
let motionDriver = 0;
let probeInFlight = false;
let lastDrive = 0;
/** Timer ids issued by the shim — foreign ids go to the native cancel. */
const shimIssuedIds = new Set<number>();

/**
 * Async probe: schedules a self-rescheduling native-rAF chain and reports
 * the tick count via callback AFTER the window elapses (rAF is async — a
 * synchronous count would always read 0 and misinstall everywhere).
 */
function probeNativeTicks(windowMs: number, done: (ticks: number) => void): void {
  if (!nativeRaf) {
    done(0);
    return;
  }
  let ticks = 0;
  const t0 = performance.now();
  const loop = () => {
    ticks++;
    if (performance.now() - t0 < windowMs) nativeRaf!.call(window, loop);
  };
  nativeRaf.call(window, loop);
  window.setTimeout(() => done(ticks), windowMs + 50);
}

/** Manually runs one full motion frameloop pass (steps in pipeline order). */
function driveMotionFrame(): void {
  if (!frameSteps) return;
  const now = performance.now();
  // Real elapsed time so animations finish on wall-clock schedule even when
  // the browser clamps our driver to 1 tick/second in hidden tabs. Capped so
  // a long gap can't teleport an animation to its end in one jump.
  const elapsed = lastDrive ? Math.min(now - lastDrive, 100) : 16;
  lastDrive = now;
  frameData.delta = elapsed;
  frameData.timestamp = now;
  frameData.isProcessing = true;
  const order = [
    'setup',
    'read',
    'resolveKeyframes',
    'preUpdate',
    'update',
    'preRender',
    'render',
    'postRender',
  ] as const;
  for (const key of order) {
    try {
      frameSteps[key]?.process(frameData);
    } catch {
      // a failing render step must never kill the driver loop
    }
  }
  frameData.isProcessing = false;
}

function dispatchFrozen(frozen: boolean): void {
  try {
    window.dispatchEvent(new CustomEvent(RAF_FROZEN_EVENT, { detail: frozen }));
  } catch {
    // non-fatal
  }
}

function installShim(): void {
  if (shimmed || !nativeRaf) return;
  shimmed = true;
  lastDrive = 0;
  const shim = (cb: FrameRequestCallback): number => {
    const id = window.setTimeout(() => {
      shimIssuedIds.delete(id);
      cb(performance.now());
    }, 16);
    shimIssuedIds.add(id);
    return id;
  };
  window.requestAnimationFrame = shim as typeof window.requestAnimationFrame;
  // Paired cancel: the HTML spec keeps rAF handles and timer ids in separate
  // counters (Blink only shares a pool by accident), so cancelAnimationFrame
  // must be re-pointed too or cancelled frames keep ticking in FF/Safari.
  // Ids issued by the shim are cleared as timers; anything else (native
  // handles captured before the shim installed) goes to the native cancel.
  window.cancelAnimationFrame = ((id: number) => {
    if (shimIssuedIds.has(id)) {
      shimIssuedIds.delete(id);
      window.clearTimeout(id);
    } else {
      nativeCancel?.call(window, id);
    }
  }) as typeof window.cancelAnimationFrame;
  // Drive motion's captured-at-module-eval frameloop manually while frozen.
  if (!motionDriver) {
    motionDriver = window.setInterval(driveMotionFrame, 32);
  }
  dispatchFrozen(true);
}

function restoreNative(): void {
  if (!shimmed || !nativeRaf || !nativeCancel) return;
  shimmed = false;
  if (motionDriver) {
    window.clearInterval(motionDriver);
    motionDriver = 0;
  }
  // Restore the raw native function, not a bound copy, so identity checks
  // against pre-captured references keep working.
  window.requestAnimationFrame = nativeRaf;
  window.cancelAnimationFrame = nativeCancel;
  dispatchFrozen(false);
}

/** Current frozen state — lets late-mounting listeners read it synchronously. */
export function isRafShimmed(): boolean {
  return shimmed;
}

export function installRafFallback(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  // Keep the raw function values (no .bind) so the restore path hands back
  // the untouched native reference.
  nativeRaf = window.requestAnimationFrame;
  nativeCancel = window.cancelAnimationFrame;

  const evaluate = () => {
    if (probeInFlight) return; // one probe chain at a time
    if (shimmed) {
      // Tab visible/healthy again? Re-probe native rAF and restore it.
      if (document.hidden) return;
      probeInFlight = true;
      probeNativeTicks(300, (ticks) => {
        probeInFlight = false;
        if (ticks > 0) restoreNative();
      });
      return;
    }
    probeInFlight = true;
    probeNativeTicks(500, (ticks) => {
      if (ticks > 0) {
        // healthy — keep native rAF
        probeInFlight = false;
        return;
      }
      // Zero ticks: distinguish "rAF throttled to zero" from "main thread
      // momentarily blocked" with a second confirmation probe.
      window.setTimeout(() => {
        probeNativeTicks(400, (confirmTicks) => {
          probeInFlight = false;
          if (confirmTicks === 0) installShim();
        });
      }, 250);
    });
  };

  evaluate();
  window.addEventListener('visibilitychange', evaluate);
  window.addEventListener('pageshow', evaluate);
}
