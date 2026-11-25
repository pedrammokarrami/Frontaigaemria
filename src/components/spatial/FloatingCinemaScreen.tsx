import React from 'react';
import { X } from 'lucide-react';
import { REALM_CONFIGS } from '../../data/realmsData';
import type { AnalyzedMediaItem, RealmId } from '../../types/spatial';

interface FloatingCinemaScreenProps {
  realm: RealmId;
  analysis: AnalyzedMediaItem;
  onClose: () => void;
}

export const FloatingCinemaScreen: React.FC<FloatingCinemaScreenProps> = ({
  realm,
  analysis,
  onClose,
}) => {
  const cfg = REALM_CONFIGS[realm];

  return (
    <div
      data-testid="floating-cinema-screen"
      className="fixed z-30 left-3 right-3 top-14 md:left-7 md:right-auto md:top-16 md:w-[38vw] md:max-w-[460px] flex flex-col gap-1.5 pointer-events-auto"
    >
      {/* Top Floating Label + Dismiss */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: cfg.accentHex }}
          />
          <span
            className="font-mono-tabular text-[10px] uppercase tracking-[0.18em] truncate"
            style={{ color: cfg.accentHex }}
          >
            {analysis.youtubeId ? 'CINEMA LINK' : cfg.coachName} · {analysis.title}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          data-testid="close-cinema-btn"
          aria-label="Close floating cinema"
          className="p-1 text-white/70 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Borderless Frameless Media Plane (appears to float beside the 3D Coach) */}
      {(analysis.youtubeId || analysis.uploadedPreviewUrl) && (
        <div
          className="relative w-full aspect-video overflow-hidden shadow-[0_28px_70px_rgba(0,0,0,0.85)]"
          style={{ background: '#050608' }}
        >
          {analysis.youtubeId ? (
            <iframe
              key={analysis.youtubeId}
              data-testid="cinema-youtube-iframe"
              title={analysis.title}
              src={`https://www.youtube.com/embed/${analysis.youtubeId}?rel=0&modestbranding=1`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : analysis.uploadedKind === 'video' ? (
            <video
              src={analysis.uploadedPreviewUrl}
              controls
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={analysis.uploadedPreviewUrl}
              alt={analysis.title}
              className="w-full h-full object-contain"
            />
          )}
        </div>
      )}

      {/* Single Concise Floating AI Observation */}
      <p className="rdr-ink text-xs sm:text-sm text-white/95 leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] max-w-xl">
        “{analysis.coachQuote}”
      </p>

      {/* Ultra-Minimal Timestamp Ticks */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        {analysis.timestamps.slice(0, 3).map((t) => (
          <span
            key={t.id}
            className="shrink-0 font-mono-tabular text-[10px] text-white/80 drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)]"
          >
            <span style={{ color: cfg.accentHex }}>{t.time}</span> {t.label}
          </span>
        ))}
      </div>
    </div>
  );
};
