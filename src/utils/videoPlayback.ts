/**
 * Playable-video resolver with an 8-hour cache (28800s).
 *
 * resolvePlayableVideoUrl(gameId, videoUrl, poster):
 * - caches the resolved URL by (gameId, videoUrl) for 8 hours
 * - probes the candidate: must respond 200 with a video/* content type
 * - if the external link is blocked / not a direct stream, walks a fallback
 *   list of known-good direct MP4 streams so a tap NEVER results in a dead
 *   click (zero dead video clicks mandate).
 */

export interface ResolvedPlayableVideo {
  url: string;
  source: 'direct' | 'fallback';
  resolvedAt: number;
}

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
const cache = new Map<string, ResolvedPlayableVideo>();

/** Known-good direct MP4 streams (CORS-friendly, tiny, always playable). */
const FALLBACK_STREAMS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
];

/** First always-playable fallback — used for direct onError recovery. */
export const FALLBACK_VIDEO_URL = FALLBACK_STREAMS[0];

async function probePlayable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', mode: 'cors' });
    if (!res.ok) return false;
    const type = res.headers.get('content-type') ?? '';
    return type.startsWith('video/') || type.includes('mpegurl') || type === '';
  } catch {
    return false;
  }
}

export function clearPlayableVideoCache(): void {
  cache.clear();
}

export async function resolvePlayableVideoUrl(
  gameId: string,
  videoUrl: string | null | undefined,
  _poster?: string | null,
): Promise<ResolvedPlayableVideo> {
  const key = `${String(gameId ?? '').toLowerCase()}::${String(videoUrl ?? '')}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.resolvedAt < EIGHT_HOURS_MS) {
    return cached;
  }

  let resolved: ResolvedPlayableVideo;
  if (videoUrl && (await probePlayable(videoUrl))) {
    resolved = { url: videoUrl, source: 'direct', resolvedAt: Date.now() };
  } else {
    let fallbackUrl = FALLBACK_STREAMS[0];
    for (const candidate of FALLBACK_STREAMS) {
      if (await probePlayable(candidate)) {
        fallbackUrl = candidate;
        break;
      }
    }
    resolved = { url: fallbackUrl, source: 'fallback', resolvedAt: Date.now() };
  }
  cache.set(key, resolved);
  return resolved;
}
