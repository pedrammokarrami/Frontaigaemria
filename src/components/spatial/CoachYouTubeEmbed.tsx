import { isIosLikeDevice } from '../../utils/iosPlayback';
import { useState } from 'react';

/**
 * Official YouTube playback inside coach answers — the user-approved approach
 * (2026-11): youtube-nocookie IFrame embed. This is YouTube's sanctioned
 * player: no CORS, no 403, no stream proxying, no paid API.
 */

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] ?? null;
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] ?? null;
    }
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null;
    return null;
  } catch {
    return null;
  }
}

export function findYoutubeSourceId(
  sources: Array<{ title: string; url: string; source: string }>
): { videoId: string; title: string } | null {
  for (const s of sources) {
    const id = extractYoutubeId(s.url);
    if (id) return { videoId: id, title: s.title };
  }
  return null;
}

export const CoachYouTubeEmbed = ({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) => {
  const [playing, setPlaying] = useState(false);
  return (
    <div
      data-testid="coach-youtube-embed"
      className="rounded-xl overflow-hidden border border-red-400/30 bg-red-950/20"
    >
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <span className="text-[11.5px] font-black text-red-200">
          ▶ {title.slice(0, 60)}
        </span>
        <button
          type="button"
          data-testid="coach-youtube-toggle"
          onClick={() => setPlaying((p) => !p)}
          className="px-2 py-0.5 rounded-full bg-red-500/30 border border-red-300/40 text-[11px] font-bold text-red-100 hover:bg-red-500/50 active:scale-95 transition"
        >
          {playing ? '⏸ بستن' : '▶ پخش'}
        </button>
      </div>
      {playing && (
        <div className="aspect-video w-full">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?${isIosLikeDevice() ? '' : 'autoplay=1&'}rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}
    </div>
  );
};
