import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { TurntableVideoPin } from '../../data/gameTournamentThemes';
import { computeMicroTilt, computeScrubbedTime, type MicroTiltState } from './stadiumTurntableMath';

interface StadiumTurntableProps {
  src?: string;
  fallbackImageUrl?: string;
  roomBg?: string;
  primaryHex?: string;
  primaryRgb?: string;
  secondaryHex?: string;
  displayFont?: string;
  ariaLabel?: string;
  pins?: TurntableVideoPin[];
}

const DEFAULT_STADIUM_VIDEO_SRC = '/assets/aistudio/spatial_stadium_loop_9528C2CF_39592eeb.mp4';

const DEFAULT_PINS: TurntableVideoPin[] = [
  { label: 'ST · PENALTY BOX', top: '38%', right: '26%', accent: 'primary' },
  { label: 'CAM · BUILD-UP', top: '47%', left: '25%', accent: 'secondary' },
];

const RADIAL_BLEND_MASK =
  'radial-gradient(ellipse 50% 49% at 50% 50%, black 60%, rgba(0, 0, 0, 0.84) 76%, transparent 100%)';

/**
 * Interactive 360° Turntable Video Hero (FC 27, NBA 2K, FORTNITE, DOTA 2):
 * - Embeds each game's real 16:9 360° orbital video with responsive `aspect-video` framing
 *   centered inside the open window between the top roster HUD and bottom metrics dock.
 * - Seamless radial CSS edge masking melts dark misty video borders invisibly into each game's `roomBg`.
 * - Horizontal pointer drag pauses auto-rotation and scrubs `video.currentTime` 1:1 under finger/mouse.
 * - Subtle 3D perspective micro-tilt + native floating AR tactical beacons + muted-by-default ambient audio.
 */
export const StadiumTurntable: React.FC<StadiumTurntableProps> = ({
  src = DEFAULT_STADIUM_VIDEO_SRC,
  fallbackImageUrl,
  roomBg = '#03100b',
  primaryHex = '#00E676',
  primaryRgb = '0, 230, 118',
  secondaryHex = '#A7F3D0',
  displayFont = '"Barlow Condensed", sans-serif',
  ariaLabel = 'نمای سه‌بعدی تعاملی استادیوم FC 27 — برای چرخش افقی بکشید',
  pins = DEFAULT_PINS,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dragRef = useRef<{ active: boolean; lastX: number; pointerId: number | null }>({
    active: false,
    lastX: 0,
    pointerId: null,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const [tilt, setTilt] = useState<MicroTiltState>({ rotateX: 0, rotateY: 0 });

  useEffect(() => {
    setVideoFailed(false);
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoFailed) return;
    video.muted = isMuted;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Autoplay fallback handled gracefully if browser blocks unmuted playback
      });
    }
  }, [isMuted, src, videoFailed]);

  const updateTiltFromEvent = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const normY = ((clientY - rect.top) / rect.height) * 2 - 1;
    setTilt(computeMicroTilt(normX, normY, 6.5));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement)?.closest('[data-turntable-control="true"]')) {
        return;
      }
      dragRef.current = {
        active: true,
        lastX: e.clientX,
        pointerId: e.pointerId,
      };
      setIsDragging(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Synthetic pointer events in tests may not have an active pointerId
      }
      const video = videoRef.current;
      if (video && !video.paused) {
        video.pause();
      }
      updateTiltFromEvent(e.clientX, e.clientY);
    },
    [updateTiltFromEvent]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      updateTiltFromEvent(e.clientX, e.clientY);

      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.lastX;
      dragRef.current.lastX = e.clientX;

      const video = videoRef.current;
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = computeScrubbedTime(video.currentTime, dx, video.duration, 0.015);
      }
    },
    [updateTiltFromEvent]
  );

  const finishDrag = useCallback((e?: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.active) {
      if (e && dragRef.current.pointerId !== null) {
        try {
          if (e.currentTarget.hasPointerCapture(dragRef.current.pointerId)) {
            e.currentTarget.releasePointerCapture(dragRef.current.pointerId);
          }
        } catch {
          // Ignore release errors on synthetic pointer events
        }
      }
      dragRef.current.active = false;
      dragRef.current.pointerId = null;
      setIsDragging(false);

      const video = videoRef.current;
      if (video) {
        const p = video.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      }
    }
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  const handleToggleAudio = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsMuted((prev) => !prev);
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid="fc27-stadium-turntable"
      data-dragging={isDragging ? 'true' : 'false'}
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onPointerLeave={finishDrag}
      style={{
        backgroundColor: roomBg,
        touchAction: 'none',
      }}
      className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center pt-[212px] pb-[168px] cursor-grab active:cursor-grabbing select-none"
    >
      {/* Subtle game-native atmospheric glow behind the floating 360° arena */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 72% 38% at 50% 53%, rgba(${primaryRgb}, 0.14) 0%, rgba(${primaryRgb}, 0.05) 48%, rgba(0, 0, 0, 0) 78%)`,
        }}
      />

      {/* Responsive 16:9 3D Perspective Micro-Tilt Stage + Seamlessly Radial-Masked Turntable Video */}
      <div
        data-testid="fc27-stadium-stage"
        style={{
          transform: `perspective(900px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
          transition: isDragging ? 'transform 60ms linear' : 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}
        className="relative w-[112%] max-w-[500px] max-h-full aspect-video shrink-0 flex items-center justify-center"
      >
        {videoFailed && fallbackImageUrl ? (
          <img
            src={fallbackImageUrl}
            alt={ariaLabel}
            draggable={false}
            style={{
              WebkitMaskImage: RADIAL_BLEND_MASK,
              maskImage: RADIAL_BLEND_MASK,
            }}
            className="w-full h-full object-cover pointer-events-none rounded-3xl"
          />
        ) : (
          <video
            ref={videoRef}
            data-testid="fc27-stadium-video"
            src={src}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            draggable={false}
            onError={() => setVideoFailed(true)}
            style={{
              WebkitMaskImage: RADIAL_BLEND_MASK,
              maskImage: RADIAL_BLEND_MASK,
            }}
            className="w-full h-full object-contain pointer-events-none"
          />
        )}

        {/* Ultra-subtle floating AR tactical anchor pins (non-intrusive, parallax with video stage) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          {pins.map((pin) => {
            const isPrimaryPin = pin.accent === 'primary';
            const pinColor = isPrimaryPin ? primaryHex : secondaryHex;
            return (
              <div
                key={pin.label}
                style={{
                  top: pin.top,
                  left: pin.left,
                  right: pin.right,
                }}
                className="absolute flex flex-col items-center"
              >
                <span
                  dir="ltr"
                  style={{
                    fontFamily: displayFont,
                    backgroundColor: 'rgba(5, 10, 14, 0.74)',
                    borderColor: isPrimaryPin ? `rgba(${primaryRgb}, 0.55)` : 'rgba(255, 255, 255, 0.28)',
                    color: pinColor,
                  }}
                  className="px-1.5 py-0.5 rounded border text-[9px] font-bold tracking-wider leading-none"
                >
                  {pin.label}
                </span>
                <span
                  className="w-px h-3.5"
                  style={{
                    background: `linear-gradient(180deg, ${pinColor} 0%, rgba(0, 0, 0, 0) 100%)`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Discreet bottom-left ambient arena audio toggle (muted by default for clean autoplay) */}
      <button
        type="button"
        data-turntable-control="true"
        data-testid="stadium-audio-toggle"
        onClick={handleToggleAudio}
        aria-label={isMuted ? 'روشن کردن صدای محیط استادیوم' : 'قطع صدای محیط استادیوم'}
        aria-pressed={!isMuted}
        style={{
          backgroundColor: 'rgba(6, 12, 16, 0.72)',
          borderColor: isMuted ? 'rgba(255, 255, 255, 0.16)' : primaryHex,
          color: isMuted ? 'rgba(248, 250, 252, 0.72)' : primaryHex,
        }}
        className="absolute left-3.5 bottom-[180px] z-20 w-8 h-8 rounded-full border flex items-center justify-center transition hover:brightness-125 cursor-pointer"
      >
        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
