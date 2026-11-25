import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Spatial Boot Gate — nothing in the app executes "cold".
 * Stages: fonts → media manifest & critical assets → server probe → warm.
 * Everything has a hard timeout so a slow network can never dead-lock the UI.
 */

export interface AppBootState {
  ready: boolean;
  progress: number; // 0–100
  stageKey: 0 | 1 | 2 | 3;
}

const MAX_ASSET_TIMEOUT_MS = 9_000;
const SERVER_PROBE_TIMEOUT_MS = 2_000;
const MIN_DISPLAY_MS = 1_100;

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    const done = () => resolve();
    img.onload = done;
    img.onerror = done;
    img.src = src;
    setTimeout(done, MAX_ASSET_TIMEOUT_MS);
  });
}

function preloadVideo(src: string): Promise<void> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    let cleaned = false;
    const done = () => {
      if (cleaned) return;
      cleaned = true;
      video.removeEventListener('canplaythrough', onCanPlay);
      video.removeEventListener('canplay', onCanPlay);
      video.removeAttribute('src');
      video.load();
      resolve();
    };
    const onCanPlay = () => done();
    video.addEventListener('canplaythrough', onCanPlay);
    video.addEventListener('canplay', onCanPlay);
    video.src = src;
    video.load();
    setTimeout(done, MAX_ASSET_TIMEOUT_MS);
  });
}

function isVideoAsset(src: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(src);
}

/** Boot orchestration hook — resolves when fonts, assets and probe settle. */
export function useAppBoot(criticalAssets: string[], manifestResolved: boolean): AppBootState {
  const [fontsReady, setFontsReady] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const [probeDone, setProbeDone] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const [progress, setProgress] = useState(6);

  const assetList = useMemo(
    () => criticalAssets.filter((src): src is string => Boolean(src)),
    [criticalAssets]
  );
  const assetKey = assetList.join('|');

  // Stage 0 — fonts
  useEffect(() => {
    let alive = true;
    const finish = () => alive && setFontsReady(true);
    if (document.fonts?.ready) {
      document.fonts.ready.then(finish);
      setTimeout(finish, 3_000);
    } else {
      finish();
    }
    return () => {
      alive = false;
    };
  }, []);

  // Stage 1 — critical media, only after the manifest has settled
  useEffect(() => {
    if (!manifestResolved) return;
    if (assetList.length === 0) {
      setAssetsReady(true);
      return;
    }
    let alive = true;
    Promise.all(
      assetList.map((src) => (isVideoAsset(src) ? preloadVideo(src) : preloadImage(src)))
    ).then(() => alive && setAssetsReady(true));
    return () => {
      alive = false;
    };
  }, [assetKey, manifestResolved]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stage 2 — server probe (informational; offline is a valid outcome)
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SERVER_PROBE_TIMEOUT_MS);
    fetch('/api/health', { signal: controller.signal })
      .catch(() => undefined)
      .finally(() => {
        if (alive) {
          setProbeDone(true);
          clearTimeout(timer);
        }
      });
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  // Minimum visible time so the splash never flashes
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_DISPLAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Progress tied to real stage completion
  useEffect(() => {
    const target =
      (fontsReady ? 30 : 0) +
      (assetsReady ? 45 : 0) +
      (probeDone ? 15 : 0) +
      (minElapsed ? 10 : 0);
    setProgress((prev) => Math.max(prev, target));
  }, [fontsReady, assetsReady, probeDone, minElapsed]);

  const ready = fontsReady && assetsReady && probeDone && minElapsed;

  const stageKey: 0 | 1 | 2 | 3 = !fontsReady
    ? 0
    : !manifestResolved || !assetsReady
      ? 1
      : !probeDone
        ? 2
        : 3;

  return { ready, progress, stageKey };
}

/** Per-section warmup: true for a short window after the tracked inputs change. */
export function useSectionWarmup(tracked: readonly unknown[], minMs = 600): boolean {
  const [warming, setWarming] = useState(false);
  const prevRef = useRef<string>('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const key = JSON.stringify(tracked);
    if (prevRef.current === '') {
      prevRef.current = key; // first mount — the boot gate already covers it
      return;
    }
    if (key === prevRef.current) return;
    prevRef.current = key;
    setWarming(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      requestAnimationFrame(() => setWarming(false));
    }, minMs);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, tracked);

  return warming;
}

const STAGE_LABEL_KEYS = ['bootStageFonts', 'bootStageCache', 'bootStageServer', 'bootStageReady'] as const;

export function AppBootGate({
  ready,
  progress,
  stageKey,
}: {
  ready: boolean;
  progress: number;
  stageKey: number;
}): React.ReactElement {
  const { copy } = useLanguage();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (ready) {
      const t = setTimeout(() => setHidden(true), 700); // let the fade-out finish
      return () => clearTimeout(t);
    }
  }, [ready]);

  const stageCopy = copy[STAGE_LABEL_KEYS[Math.min(stageKey, 3) as 0 | 1 | 2 | 3]];

  return (
    <AnimatePresence>
      {!hidden ? (
        <motion.div
          key="boot-gate"
          data-testid="app-boot-gate"
          initial={{ opacity: 1 }}
          animate={{ opacity: ready ? 0 : 1, scale: ready ? 1.015 : 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 22,
            background:
              'radial-gradient(120% 90% at 50% 15%, rgba(14,20,34,0.995) 0%, rgba(5,7,13,1) 62%)',
            pointerEvents: ready ? 'none' : 'auto',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ textAlign: 'center' }}
          >
            <div
              style={{
                fontSize: 34,
                letterSpacing: '0.32em',
                fontWeight: 800,
                color: 'rgba(235,240,255,0.96)',
                textShadow: '0 0 42px rgba(64,140,255,0.45)',
              }}
            >
              AIPETROS
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                letterSpacing: '0.5em',
                color: 'rgba(150,170,210,0.55)',
                fontWeight: 600,
              }}
            >
              SPATIAL OS
            </div>
          </motion.div>

          {/* progress rail */}
          <div
            style={{
              width: 'min(280px, 62vw)',
              height: 3,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                borderRadius: 999,
                background: 'linear-gradient(90deg, #4f8cff, #9fc6ff)',
              }}
              initial={{ width: '6%' }}
              animate={{ width: `${Math.max(progress, 6)}%` }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
          </div>

          <div
            style={{
              fontSize: 12,
              color: 'rgba(170,190,225,0.75)',
              letterSpacing: '0.08em',
              minHeight: 18,
            }}
          >
            {stageCopy}
            {!ready && <span style={{ opacity: 0.6 }}>…</span>}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export { STAGE_LABEL_KEYS };
