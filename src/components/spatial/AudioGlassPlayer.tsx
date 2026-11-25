import React, { useEffect, useRef } from 'react';
import {
  BookmarkPlus,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Sliders,
  Volume2,
} from 'lucide-react';
import {
  type AudioRoomConfig,
  type AudioTrackItem,
  formatTimecodeMmSs,
} from '../../utils/audioAgents';
import type { SpatialAudioDspEngine } from '../../utils/audioSpatialEngine';

interface AudioGlassPlayerProps {
  room: AudioRoomConfig;
  activeTrack: AudioTrackItem;
  customStreamLabel?: string | null;
  isPlaying: boolean;
  currentTimeSec: number;
  volume01: number;
  dspEngine: SpatialAudioDspEngine;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onSeek: (sec: number) => void;
  onVolumeChange: (v: number) => void;
  onQuickBookmark?: () => void;
  compact?: boolean;
}

export const AudioGlassPlayer: React.FC<AudioGlassPlayerProps> = ({
  room,
  activeTrack,
  customStreamLabel,
  isPlaying,
  currentTimeSec,
  volume01,
  dspEngine,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onSeek,
  onVolumeChange,
  onQuickBookmark,
  compact = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let tick = 0;

    const renderFrame = () => {
      tick += 0.09;
      const bars = dspEngine.sampleSpectrum(26, tick);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const gap = 3;
      const barWidth = Math.max(3, (width - gap * (bars.length - 1)) / bars.length);

      const grad = ctx.createLinearGradient(0, height, 0, 0);
      grad.addColorStop(0, room.accentHex);
      grad.addColorStop(1, room.secondaryHex);
      ctx.fillStyle = grad;

      for (let i = 0; i < bars.length; i++) {
        const val = bars[i];
        const barH = Math.max(4, val * (height - 4));
        const x = i * (barWidth + gap);
        const y = height - barH;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, 2);
        ctx.fill();
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);
    return () => window.cancelAnimationFrame(rafId);
  }, [dspEngine, room.accentHex, room.secondaryHex, isPlaying]);

  if (compact) {
    return (
      <div
        data-testid="audio-glass-player"
        dir="rtl"
        className="w-full min-w-0 overflow-hidden rounded-2xl bg-black/55 backdrop-blur-2xl border border-white/15 p-3 flex flex-col gap-2.5"
      >
        <div className="w-full min-w-0 flex items-center gap-2.5">
          <button
            type="button"
            data-testid="audio-play-toggle"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'توقف پخش' : 'پخش'}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-950 font-bold shrink-0 cursor-pointer transition hover:scale-105"
            style={{
              backgroundColor: room.accentHex,
              boxShadow: `0 0 18px ${room.accentHex}45`,
            }}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
          </button>

          <div className="min-w-0 flex-1">
            <h3 className="text-[12.5px] font-extrabold text-white truncate">
              {customStreamLabel ?? activeTrack.titleFa}
            </h3>
            <p className="text-[10.5px] text-white/60 truncate font-mono-tabular">
              {activeTrack.artistFa} · {activeTrack.bpm} BPM
            </p>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={260}
          height={28}
          data-testid="audio-visualizer-canvas"
          className="w-full h-7 rounded-lg bg-black/45 px-1.5"
        />

        <div dir="ltr" className="w-full min-w-0 flex items-center gap-2">
          <span className="text-[10.5px] font-mono-tabular text-white/75 shrink-0">
            {formatTimecodeMmSs(currentTimeSec)}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(1, activeTrack.durationSec)}
            value={Math.min(currentTimeSec, activeTrack.durationSec)}
            onChange={(e) => onSeek(Number(e.target.value))}
            aria-label="زمان پخش موزیک یا پادکست"
            className="flex-1 min-w-0 h-1.5 rounded-full bg-white/15 cursor-pointer"
            style={{ accentColor: room.accentHex }}
          />
          <span className="text-[10.5px] font-mono-tabular text-white/55 shrink-0">
            {formatTimecodeMmSs(activeTrack.durationSec)}
          </span>
        </div>

        <div dir="ltr" className="w-full min-w-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onPrevTrack}
              aria-label="ترک قبلی"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 cursor-pointer transition"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onNextTrack}
              aria-label="ترک بعدی"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 cursor-pointer transition"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <Volume2 className="w-3.5 h-3.5 text-white/65 shrink-0" />
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume01 * 100)}
              onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
              aria-label="حجم صدا"
              className="w-16 h-1.5 rounded-full bg-white/15 cursor-pointer"
              style={{ accentColor: room.accentHex }}
            />
          </div>

          {onQuickBookmark && (
            <button
              type="button"
              dir="rtl"
              onClick={onQuickBookmark}
              data-testid="player-quick-bookmark-btn"
              className="shrink-0 whitespace-nowrap min-h-[32px] px-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-[10.5px] font-bold text-white inline-flex items-center gap-1 cursor-pointer transition"
            >
              <BookmarkPlus className="w-3.5 h-3.5" style={{ color: room.accentHex }} />
              <span>بوکمارک</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <footer
      data-testid="audio-glass-player"
      dir="rtl"
      className="sticky bottom-2 z-20 w-full rounded-3xl bg-slate-950/82 backdrop-blur-2xl border border-white/15 px-3.5 py-2.5 sm:py-3 shadow-[0_-12px_40px_rgba(0,0,0,0.68)]"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Track Identity & Acoustic Profile */}
        <div className="min-w-0 flex items-center gap-3 lg:w-[32%]">
          <button
            type="button"
            data-testid="audio-play-toggle"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'توقف پخش' : 'پخش'}
            className="w-11 h-11 rounded-full flex items-center justify-center text-slate-950 font-bold shrink-0 cursor-pointer transition hover:scale-105"
            style={{
              backgroundColor: room.accentHex,
              boxShadow: `0 0 22px ${room.accentHex}55`,
            }}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-0.5" />}
          </button>

          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] font-extrabold text-white truncate">
              {customStreamLabel ?? activeTrack.titleFa}
            </h3>
            <p className="text-[11px] text-white/65 truncate font-mono-tabular">
              {activeTrack.artistFa} · {activeTrack.bpm} BPM · {room.titleFa}
            </p>
          </div>
        </div>

        {/* Center: Live Web Audio API FFT Visualizer + Timeline Scrubber */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <canvas
              ref={canvasRef}
              width={220}
              height={28}
              data-testid="audio-visualizer-canvas"
              className="w-36 sm:w-52 h-7 shrink-0 rounded-lg bg-black/35 px-1.5"
            />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-white/60 truncate">
              <Sliders className="w-3.5 h-3.5 shrink-0" style={{ color: room.accentHex }} />
              <span className="truncate">{room.acoustic.profileNameFa}</span>
            </span>
          </div>

          <div dir="ltr" className="flex items-center gap-2">
            <span className="text-[11px] font-mono-tabular text-white/75 shrink-0">
              {formatTimecodeMmSs(currentTimeSec)}
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(1, activeTrack.durationSec)}
              value={Math.min(currentTimeSec, activeTrack.durationSec)}
              onChange={(e) => onSeek(Number(e.target.value))}
              aria-label="زمان پخش موزیک یا پادکست"
              className="flex-1 h-1.5 rounded-full bg-white/15 cursor-pointer"
              style={{ accentColor: room.accentHex }}
            />
            <span className="text-[11px] font-mono-tabular text-white/55 shrink-0">
              {formatTimecodeMmSs(activeTrack.durationSec)}
            </span>
          </div>
        </div>

        {/* Right: Prev/Next + Volume + Quick Chapter Note */}
        <div dir="ltr" className="flex items-center justify-between lg:justify-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onPrevTrack}
              aria-label="ترک قبلی"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 cursor-pointer transition"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onNextTrack}
              aria-label="ترک بعدی"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 cursor-pointer transition"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-white/65 shrink-0" />
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume01 * 100)}
              onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
              aria-label="حجم صدا"
              className="w-20 h-1.5 rounded-full bg-white/15 cursor-pointer"
              style={{ accentColor: room.accentHex }}
            />
          </div>

          {onQuickBookmark && (
            <button
              type="button"
              dir="rtl"
              onClick={onQuickBookmark}
              data-testid="player-quick-bookmark-btn"
              className="shrink-0 whitespace-nowrap min-h-[34px] px-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-bold text-white inline-flex items-center gap-1 cursor-pointer transition"
            >
              <BookmarkPlus className="w-3.5 h-3.5" style={{ color: room.accentHex }} />
              <span>بوکمارک</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};
