import React, { useEffect, useRef } from 'react';

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  driftX: number;
  swayAmp: number;
  swaySpeed: number;
  phase: number;
  opacity: number;
  layer: 0 | 1 | 2;
}

function createSoftGlowSprite(r: number, g: number, b: number, size = 32): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const gctx = c.getContext('2d');
  if (gctx) {
    const half = size / 2;
    const grad = gctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, 0.55)`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, size, size);
  }
  return c;
}

/**
 * Ultra-lightweight multi-depth live snowfall & subtle winter neon/siren rooftop overlay
 * for the Max Payne snowy New York rooftop scene.
 * Pre-bakes soft bokeh sprites once so each frame renders in ~1ms with zero gradient GC churn.
 */
export const MaxPayneSnowCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Pre-bake soft radial sprites once for fast GPU/CPU blitting
    const whiteFlakeSprite = createSoftGlowSprite(242, 246, 255, 24);
    const crimsonFlakeSprite = createSoftGlowSprite(255, 212, 214, 24);
    const blueFlakeSprite = createSoftGlowSprite(212, 232, 255, 24);
    const policeGlowSprite = createSoftGlowSprite(56, 152, 255, 96);
    const hotelGlowSprite = createSoftGlowSprite(239, 68, 68, 96);

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };
    resize();

    const flakeCount = width < 768 ? 72 : 128;
    const flakes: Snowflake[] = Array.from({ length: flakeCount }, (_, i) => {
      const r = i % 10;
      const layer: 0 | 1 | 2 = r < 5 ? 0 : r < 8 ? 1 : 2;
      const radius =
        layer === 0
          ? 0.9 + Math.random() * 1.1
          : layer === 1
            ? 1.7 + Math.random() * 1.4
            : 3.4 + Math.random() * 2.4;
      const speedY =
        layer === 0
          ? 0.6 + Math.random() * 0.55
          : layer === 1
            ? 1.2 + Math.random() * 0.85
            : 1.95 + Math.random() * 1.2;

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        speedY,
        driftX: -0.35 - layer * 0.28 - Math.random() * 0.3,
        swayAmp: 0.35 + layer * 0.42,
        swaySpeed: 0.014 + Math.random() * 0.016,
        phase: Math.random() * Math.PI * 2,
        opacity:
          layer === 0
            ? 0.32 + Math.random() * 0.28
            : layer === 1
              ? 0.52 + Math.random() * 0.32
              : 0.44 + Math.random() * 0.32,
        layer,
      };
    });

    let tickCount = 0;

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);
      tickCount += 1;

      // 1. Lightweight blitted pulsing police cruiser blue light & red HOTEL neon halo
      const minDim = Math.min(width, height);
      const sirenPulse = 0.5 + 0.5 * Math.sin(tickCount * 0.18);
      const policeSize = minDim * 0.28;
      ctx.globalAlpha = 0.14 + sirenPulse * 0.18;
      ctx.drawImage(
        policeGlowSprite,
        width * 0.745 - policeSize * 0.5,
        height * 0.81 - policeSize * 0.5,
        policeSize,
        policeSize
      );

      const hotelPulse = 0.5 + 0.5 * Math.sin(tickCount * 0.07);
      const hotelSize = minDim * 0.44;
      ctx.globalAlpha = 0.1 + hotelPulse * 0.08;
      ctx.drawImage(
        hotelGlowSprite,
        width * 0.755 - hotelSize * 0.5,
        height * 0.48 - hotelSize * 0.5,
        hotelSize,
        hotelSize
      );

      // 2. Multi-depth live falling snowflakes tinted subtly by nearby neon HOTEL or police lights
      const windGust = Math.sin(tickCount * 0.016) * 0.55;

      for (const f of flakes) {
        const nearHotelNeon = f.x > width * 0.64 && f.y > height * 0.2 && f.y < height * 0.76;
        const nearPoliceGlow = f.x > width * 0.66 && f.y >= height * 0.72;

        if (f.layer === 2) {
          const sprite = nearHotelNeon
            ? crimsonFlakeSprite
            : nearPoliceGlow
              ? blueFlakeSprite
              : whiteFlakeSprite;
          const d = f.radius * 2.8;
          ctx.globalAlpha = f.opacity;
          ctx.drawImage(sprite, f.x - d * 0.5, f.y - d * 0.5, d, d);
        } else {
          ctx.globalAlpha = f.opacity;
          ctx.fillStyle = nearHotelNeon
            ? '#ffd6d6'
            : nearPoliceGlow
              ? '#cde5ff'
              : '#eef3fc';
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        if (!reducedMotion) {
          f.phase += f.swaySpeed;
          f.y += f.speedY;
          f.x += f.driftX + windGust * (0.4 + f.layer * 0.35) + Math.sin(f.phase) * f.swayAmp;

          if (f.y > height + 12) {
            f.y = -10 - Math.random() * 35;
            f.x = Math.random() * (width + 100);
          }
          if (f.x < -18) {
            f.x = width + 14;
          } else if (f.x > width + 18) {
            f.x = -14;
          }
        }
      }

      ctx.globalAlpha = 1;
    };

    drawFrame();
    if (reducedMotion) {
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }

    let rafId = 0;
    let lastTick = performance.now();
    const tick = (now: number) => {
      rafId = window.requestAnimationFrame(tick);
      if (document.hidden || now - lastTick < 34) return;
      lastTick = now;
      drawFrame();
    };
    rafId = window.requestAnimationFrame(tick);

    window.addEventListener('resize', resize);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="max-payne-live-snow-canvas"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10"
    />
  );
};
