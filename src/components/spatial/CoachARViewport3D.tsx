import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { ChevronLeft, ChevronRight, Film, Image as ImageIcon, RotateCcw } from 'lucide-react';
import type { ResolvedGameMediaBundle } from '../../services/gameMediaCatalog';
import { type LiveGameMetaSnapshot, toPersianDigits } from '../../services/liveMetaSyncService';

export interface UploadedCoachMedia {
  url: string;
  isVideo: boolean;
  fileName: string;
}

export type CoachMediaMode = 'video' | 'photo';

interface CoachARViewport3DProps {
  meta: LiveGameMetaSnapshot;
  mediaBundle: ResolvedGameMediaBundle | null;
  isLoadingMedia: boolean;
  mediaMode: CoachMediaMode;
  mediaIndex: number;
  frameIndex: number; // 1..90
  totalFrames: number;
  manualSeekVersion: number;
  isPlaying: boolean;
  isSlowMo: boolean;
  tapTarget: { xPct: number; yPct: number };
  uploadedMedia: UploadedCoachMedia | null;
  onChangeMediaMode: (mode: CoachMediaMode) => void;
  onStepMediaIndex: (delta: number) => void;
  onClearUploadedMedia: () => void;
  onTapViewport: (xPct: number, yPct: number) => void;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function CoachARViewport3D({
  meta,
  mediaBundle,
  isLoadingMedia,
  mediaMode,
  mediaIndex,
  frameIndex,
  totalFrames,
  manualSeekVersion,
  isPlaying,
  isSlowMo,
  tapTarget,
  uploadedMedia,
  onChangeMediaMode,
  onStepMediaIndex,
  onClearUploadedMedia,
  onTapViewport,
}: CoachARViewport3DProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const videos = mediaBundle?.videos ?? [];
  const screenshots = mediaBundle?.screenshots ?? [];

  const safeVideoIdx = videos.length > 0 ? ((mediaIndex % videos.length) + videos.length) % videos.length : 0;
  const safePhotoIdx =
    screenshots.length > 0 ? ((mediaIndex % screenshots.length) + screenshots.length) % screenshots.length : 0;

  const activeVideo = videos[safeVideoIdx] ?? null;
  const activeScreenshot = screenshots[safePhotoIdx] ?? screenshots[0] ?? null;

  const shouldRenderVideo =
    !uploadedMedia && mediaMode === 'video' && Boolean(activeVideo) && !videoFailed;

  const posterImageUrl =
    activeVideo?.thumbnailUrl ||
    activeScreenshot?.fullUrl ||
    '/src/assets/images/ue5_sports_coach_1795030212303.jpg';

  // Reset error state whenever selected game or clip changes
  useEffect(() => {
    setVideoFailed(false);
    setVideoReady(false);
  }, [meta.gameId, safeVideoIdx, mediaMode]);

  // Attach real Steam HLS (.m3u8) or MP4/WebM gameplay stream to <video>
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !shouldRenderVideo || !activeVideo) return;

    let hls: Hls | null = null;
    const streamUrl = activeVideo.hlsUrl || activeVideo.mp4Url || activeVideo.webmUrl;
    if (!streamUrl) {
      setVideoFailed(true);
      return;
    }

    const playSafe = () => {
      videoEl.playbackRate = isSlowMo ? 0.25 : 1.0;
      if (isPlaying) {
        videoEl.play().catch(() => undefined);
      }
    };

    if (activeVideo.hlsUrl && activeVideo.hlsUrl.includes('.m3u8')) {
      if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        videoEl.src = activeVideo.hlsUrl;
        playSafe();
      } else if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          maxBufferLength: 12,
        });
        hls.loadSource(activeVideo.hlsUrl);
        hls.attachMedia(videoEl);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setVideoReady(true);
          playSafe();
        });
        hls.on(Hls.Events.ERROR, (_ev, data) => {
          if (data.fatal) {
            setVideoFailed(true);
          }
        });
      } else if (activeVideo.mp4Url || activeVideo.webmUrl) {
        videoEl.src = (activeVideo.mp4Url || activeVideo.webmUrl)!;
        playSafe();
      } else {
        setVideoFailed(true);
      }
    } else {
      videoEl.src = streamUrl;
      playSafe();
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      videoEl.pause();
      videoEl.removeAttribute('src');
      videoEl.load();
    };
  }, [activeVideo, shouldRenderVideo]);

  // Sync slow-motion playback speed & play/pause directly on real gameplay video
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !shouldRenderVideo) return;
    try {
      videoEl.playbackRate = isSlowMo ? 0.25 : 1.0;
      if (isPlaying) {
        videoEl.play().catch(() => undefined);
      } else {
        videoEl.pause();
      }
    } catch {
      // ignore
    }
  }, [isSlowMo, isPlaying, shouldRenderVideo]);

  // Sync manual frame scrubber drags directly to real video timestamp
  useEffect(() => {
    if (manualSeekVersion === 0) return;
    const videoEl = videoRef.current;
    if (!videoEl || !shouldRenderVideo) return;
    if (Number.isFinite(videoEl.duration) && videoEl.duration > 0) {
      const targetSec = ((frameIndex - 1) / Math.max(1, totalFrames - 1)) * videoEl.duration;
      try {
        videoEl.currentTime = targetSec;
      } catch {
        // ignore
      }
    }
  }, [manualSeekVersion, frameIndex, totalFrames, shouldRenderVideo]);

  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = clamp(((e.clientX - rect.left) / Math.max(1, rect.width)) * 100, 12, 88);
    const yPct = clamp(((e.clientY - rect.top) / Math.max(1, rect.height)) * 100, 20, 74);
    onTapViewport(xPct, yPct);
  };

  // Smooth cinematic Ken Burns zoom/pan on real gameplay screenshots synced to frameIndex
  const frameRatio = clamp((frameIndex - 1) / Math.max(1, totalFrames - 1), 0, 1);
  const photoScale = 1.03 + frameRatio * 0.08;
  const photoPanX = (frameRatio - 0.5) * -3.5;

  // AR Geometry coordinates dynamically driven by tapTarget + frame progression
  const strikerX = clamp(tapTarget.xPct - 18 + frameRatio * 6, 16, 52);
  const strikerY = clamp(tapTarget.yPct + 14 - frameRatio * 5, 48, 67);
  const defenderX = clamp(tapTarget.xPct + 18 - frameRatio * 3, 52, 82);
  const defenderY = clamp(tapTarget.yPct - 4, 34, 54);
  const laserY = defenderY + 4;
  const corridorTipX = clamp(tapTarget.xPct + 4, 30, 70);
  const corridorTipY = clamp(defenderY - 12, 24, 42);

  const dangerHex = meta.realm === 'story' ? '#EC4899' : '#F43F5E';
  const totalItems = mediaMode === 'video' && videos.length > 0 ? videos.length : Math.max(1, screenshots.length);
  const currentItemDisplay =
    mediaMode === 'video' && videos.length > 0 ? safeVideoIdx + 1 : safePhotoIdx + 1;

  return (
    <div
      data-testid="coach-ar-viewport"
      data-game-id={meta.gameId}
      data-media-mode={shouldRenderVideo ? 'video' : 'photo'}
      data-video-ready={videoReady ? 'true' : 'false'}
      onClick={handleViewportClick}
      className="fixed inset-0 h-dvh w-full overflow-hidden cursor-crosshair select-none bg-[#03080B]"
    >
      {/* LAYER 1: REAL GAMEPLAY VIDEO / REAL 1080p GAMEPLAY SCREENSHOTS / USER UPLOAD */}
      {uploadedMedia ? (
        <div className="relative h-full w-full">
          {uploadedMedia.isVideo ? (
            <video
              src={uploadedMedia.url}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover brightness-95 contrast-105"
            />
          ) : (
            <img
              src={uploadedMedia.url}
              alt={uploadedMedia.fileName}
              className="h-full w-full object-cover brightness-95 contrast-105"
            />
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClearUploadedMedia();
            }}
            dir="rtl"
            className="absolute top-[132px] left-3.5 z-30 flex items-center gap-1.5 rounded-full border border-white/25 bg-black/75 px-3 py-1 text-[11px] font-bold text-white hover:bg-black/90 transition cursor-pointer"
          >
            <RotateCcw className="h-3 w-3 text-emerald-400" />
            <span>بازگشت به فیلم بازی</span>
          </button>
        </div>
      ) : shouldRenderVideo ? (
        <div className="relative h-full w-full">
          {/* Immediate crisp real gameplay poster behind video so there is zero blank flash */}
          <img
            src={posterImageUrl}
            alt={meta.gameName}
            className="absolute inset-0 h-full w-full object-cover brightness-90"
          />
          <video
            ref={videoRef}
            data-testid="real-gameplay-video"
            autoPlay
            loop
            muted
            playsInline
            poster={posterImageUrl}
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
            className="relative h-full w-full object-cover brightness-95 contrast-105"
          />
        </div>
      ) : (
        <div className="relative h-full w-full overflow-hidden">
          <img
            key={activeScreenshot?.fullUrl || meta.gameId}
            data-testid="real-gameplay-screenshot"
            src={activeScreenshot?.fullUrl || posterImageUrl}
            alt={activeScreenshot?.title || meta.gameName}
            className="h-full w-full object-cover brightness-95 contrast-105 transition-transform duration-300 ease-out"
            style={{
              transform: `scale(${photoScale.toFixed(3)}) translateX(${photoPanX.toFixed(2)}%)`,
            }}
          />
        </div>
      )}

      {/* Subtle cinematic top & bottom edge vignette so floating HUD stays razor-sharp over bright gameplay footage */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(3,8,14,0.72) 0%, rgba(3,8,14,0.12) 25%, rgba(3,8,14,0.08) 60%, rgba(3,8,14,0.88) 100%)',
        }}
      />

      {/* LAYER 2: DIEGETIC AR TACTICAL VECTOR PROJECTIONS FLOATING OVER REAL GAMEPLAY */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      >
        <defs>
          <linearGradient id="arRealConeGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={meta.accentHex} stopOpacity="0.48" />
            <stop offset="65%" stopColor={meta.accentHex} stopOpacity="0.2" />
            <stop offset="100%" stopColor={meta.accentHex} stopOpacity="0.02" />
          </linearGradient>
          <radialGradient id="arDangerRadial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={dangerHex} stopOpacity="0.28" />
            <stop offset="70%" stopColor={dangerHex} stopOpacity="0.08" />
            <stop offset="100%" stopColor={dangerHex} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Glowing Tactical Passing / Sightline / Flank Corridor Cone */}
        <polygon
          points={`${strikerX - 3},${strikerY} ${strikerX + 3},${strikerY} ${corridorTipX + 18},${corridorTipY} ${corridorTipX - 14},${corridorTipY}`}
          fill="url(#arRealConeGrad)"
          stroke={meta.accentHex}
          strokeWidth="0.32"
          strokeOpacity="0.82"
        />

        {/* Curved Tactical Pass / Sightline Arc */}
        <path
          d={`M ${strikerX} ${strikerY} Q ${(strikerX + corridorTipX) / 2} ${corridorTipY - 4} ${corridorTipX + 2} ${corridorTipY + 4}`}
          fill="none"
          stroke={meta.accentHex}
          strokeWidth="0.55"
          strokeDasharray="1.8 1.2"
          strokeLinecap="round"
        />

        {/* Horizontal Tactical Laser Line (CB Offside Line / Crosshair Height / Ward Line) */}
        <line
          x1="4"
          y1={laserY}
          x2="96"
          y2={laserY}
          stroke={dangerHex}
          strokeWidth="0.42"
          strokeOpacity="0.88"
        />
        <line
          x1="4"
          y1={laserY}
          x2="96"
          y2={laserY}
          stroke="#FFFFFF"
          strokeWidth="0.14"
          strokeOpacity="0.65"
        />

        {/* Striker / Primary Player Tactical Foot Ring */}
        <ellipse
          cx={strikerX}
          cy={strikerY}
          rx="9"
          ry="3.6"
          fill={`${meta.accentHex}1A`}
          stroke={meta.accentHex}
          strokeWidth="0.45"
        />

        {/* Opponent / Danger Zone Holographic Ring */}
        <ellipse
          cx={defenderX}
          cy={laserY}
          rx="12"
          ry="4.8"
          fill="url(#arDangerRadial)"
          stroke={dangerHex}
          strokeWidth="0.5"
        />
        <ellipse
          cx={defenderX}
          cy={laserY}
          rx="8"
          ry="3.1"
          fill="none"
          stroke={dangerHex}
          strokeWidth="0.28"
          strokeDasharray="1.5 1"
        />
      </svg>

      {/* LAYER 3: CRISP NON-OVERLAPPING PERSIAN DIEGETIC AR CALLOUT PINS */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        {/* 1. Primary Corridor / Win-Chance Pin */}
        <div
          data-testid="ar-pin-primary"
          dir="rtl"
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-150"
          style={{
            left: `${clamp(corridorTipX, 34, 66)}%`,
            top: `${clamp(corridorTipY - 2, 26, 36)}%`,
          }}
        >
          <div
            className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold text-white shadow-lg whitespace-nowrap"
            style={{
              backgroundColor: 'rgba(4, 18, 16, 0.82)',
              borderColor: `${meta.accentHex}B0`,
              boxShadow: `0 0 18px ${meta.accentHex}44`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse shrink-0"
              style={{ backgroundColor: meta.accentHex }}
            />
            <span>{meta.arPrimaryLabelFa}</span>
          </div>
        </div>

        {/* 2. Player Speed / Utility / Cooldown Pin (Anchored cleanly above striker foot ring) */}
        <div
          data-testid="ar-pin-speed"
          dir={meta.realm === 'sports' && /km\/h/i.test(meta.arSpeedPinFa) ? 'ltr' : 'rtl'}
          className="absolute -translate-x-1/2 -translate-y-full transition-all duration-150"
          style={{
            left: `${clamp(strikerX + 6, 32, 60)}%`,
            top: `${clamp(strikerY - 4, 52, 62)}%`,
          }}
        >
          <div className="flex flex-col items-center">
            <div
              className="rounded-full border px-2.5 py-0.5 text-[11px] font-black text-white shadow-md whitespace-nowrap"
              style={{
                backgroundColor: 'rgba(4, 16, 22, 0.86)',
                borderColor: `${meta.accentHex}AA`,
              }}
            >
              {meta.arSpeedPinFa}
            </div>
            <div
              className="h-3.5 w-[1.5px]"
              style={{ background: `linear-gradient(180deg, ${meta.accentHex}, transparent)` }}
            />
          </div>
        </div>

        {/* 3. Laser Line Label (Anchored cleanly at far left above/on laser line, zero collision) */}
        <div
          data-testid="ar-pin-laser"
          dir="rtl"
          className="absolute -translate-y-1/2 transition-all duration-150"
          style={{
            left: '3.5%',
            top: `${clamp(laserY - 3.2, 36, 52)}%`,
          }}
        >
          <div
            className="rounded-md border px-2 py-0.5 text-[10px] font-bold text-rose-100 whitespace-nowrap"
            style={{
              backgroundColor: 'rgba(28, 6, 14, 0.84)',
              borderColor: `${dangerHex}99`,
            }}
          >
            {meta.arLaserLabelFa}
          </div>
        </div>

        {/* 4. Danger Zone Pin */}
        <div
          data-testid="ar-pin-danger"
          dir="rtl"
          className="absolute -translate-x-1/2 -translate-y-full transition-all duration-150"
          style={{
            left: `${clamp(defenderX, 58, 80)}%`,
            top: `${clamp(laserY - 5, 34, 49)}%`,
          }}
        >
          <div className="flex flex-col items-center">
            <div
              className="flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black text-rose-100 whitespace-nowrap"
              style={{
                backgroundColor: 'rgba(40, 6, 16, 0.86)',
                borderColor: `${dangerHex}B0`,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span>{meta.arDangerLabelFa}</span>
            </div>
            <div
              className="h-3 w-[1.5px]"
              style={{ background: `linear-gradient(180deg, ${dangerHex}, transparent)` }}
            />
          </div>
        </div>
      </div>

      {/* LAYER 4: FLOATING REAL VIDEO / REAL SCREENSHOT SWITCHER PILL (Right above the 3-step strip) */}
      {!uploadedMedia && (
        <div
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto absolute bottom-[174px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/18 bg-[#050B14]/78 px-2 py-1 shadow-xl"
        >
          <button
            type="button"
            data-testid="media-mode-video-btn"
            disabled={videos.length === 0}
            onClick={() => onChangeMediaMode('video')}
            className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold whitespace-nowrap transition cursor-pointer disabled:opacity-40"
            style={{
              backgroundColor: shouldRenderVideo ? `${meta.accentHex}33` : 'transparent',
              color: shouldRenderVideo ? '#FFFFFF' : 'rgba(255,255,255,0.68)',
            }}
          >
            <Film className="h-3 w-3 shrink-0" />
            <span>فیلم واقعی</span>
          </button>

          <button
            type="button"
            data-testid="media-mode-photo-btn"
            onClick={() => onChangeMediaMode('photo')}
            className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold whitespace-nowrap transition cursor-pointer"
            style={{
              backgroundColor: !shouldRenderVideo ? `${meta.accentHex}33` : 'transparent',
              color: !shouldRenderVideo ? '#FFFFFF' : 'rgba(255,255,255,0.68)',
            }}
          >
            <ImageIcon className="h-3 w-3 shrink-0" />
            <span>عکس بازی</span>
          </button>

          <span className="h-3.5 w-[1px] bg-white/15" />

          <button
            type="button"
            data-testid="media-prev-btn"
            aria-label="صحنه قبلی"
            onClick={() => onStepMediaIndex(-1)}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <span className="px-1 font-mono-tabular text-[10px] font-bold text-white/85 whitespace-nowrap">
            {isLoadingMedia
              ? '...'
              : `${toPersianDigits(currentItemDisplay)}/${toPersianDigits(totalItems)}`}
          </span>

          <button
            type="button"
            data-testid="media-next-btn"
            aria-label="صحنه بعدی"
            onClick={() => onStepMediaIndex(1)}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
