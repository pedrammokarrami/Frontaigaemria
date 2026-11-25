import { useState } from 'react';
import type { MediaAssetSlot } from '../../config/mediaAssets';

interface CinematicBackdropProps {
  asset: MediaAssetSlot;
  liveVideoUrl?: string | null;
  dimmed?: boolean;
}

export function CinematicBackdrop({
  asset,
  liveVideoUrl,
  dimmed = false,
}: CinematicBackdropProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  // Only mount <video> when manifest confirms file exists (prevents 404 console errors)
  const resolvedVideo = liveVideoUrl !== undefined ? liveVideoUrl : null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#0A0B0E]">
      {resolvedVideo && !videoFailed ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={asset.posterUrl}
          onError={() => setVideoFailed(true)}
          className="h-full w-full object-cover object-center"
        >
          <source src={resolvedVideo} type="video/mp4" />
        </video>
      ) : !imgFailed ? (
        <img
          src={asset.posterUrl}
          alt={asset.alt}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="animate-lobby-breathe h-full w-full object-cover object-center"
        />
      ) : (
        <div
          className="h-full w-full"
          style={{
            background:
              'radial-gradient(circle at 50% 22%, rgba(204, 255, 0, 0.08), transparent 45%), linear-gradient(180deg, #161920 0%, #0A0B0E 100%)',
          }}
        />
      )}

      {/* Subtle vignette + volumetric contrast scrim leaving central character clear */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          dimmed ? 'opacity-92' : 'opacity-100'
        }`}
        style={{
          background: dimmed
            ? 'linear-gradient(180deg, rgba(10,11,14,0.84) 0%, rgba(10,11,14,0.70) 50%, rgba(10,11,14,0.96) 100%)'
            : 'radial-gradient(circle at 50% 42%, transparent 32%, rgba(10,11,14,0.68) 100%), linear-gradient(180deg, rgba(10,11,14,0.72) 0%, rgba(10,11,14,0.06) 28%, rgba(10,11,14,0.06) 62%, rgba(10,11,14,0.88) 100%)',
        }}
      />
    </div>
  );
}
