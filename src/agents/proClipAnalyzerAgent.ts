import type { RealmId } from '../types/spatial.ts';
import {
  type ClipSourceKind,
  type RealCoachClip,
  discoverRealCoachClips,
  formatSecondsToTime,
  parseDurationToSeconds,
} from '../services/realClipAgentService.ts';

export type ChapterPhaseId = 'error' | 'fix' | 'execute';

export interface ScrubberChapterDot {
  id: ChapterPhaseId;
  sec: number;
  timeLabel: string;
  shortLabelFa: string; // خطا | اصلاح | اجرا
  shortLabelEn?: string;
  fullLabelFa: string;
  progressPct: number; // 12..88 position along scrubber track
  accentHex: string;
}

export interface ProClipAnalyzerItem {
  id: string;
  youtubeId: string;
  /** Optional direct file/stream URL — native <video> playback when present. */
  videoUrl?: string;
  title: string;
  channelName: string;
  viewsLabel: string;
  durationLabel: string;
  durationSec: number;
  thumbnailUrl: string;
  sourceKind: ClipSourceKind;
  sourceBadgeFa: string;
  chapters: ScrubberChapterDot[];
  problemFoundFa: string;
  solutionFixFa: string;
  coachCommentaryFa: string;
}

export interface ProClipAnalyzerResponse {
  agentName: 'ProClipAnalyzerAgent';
  gameId: string;
  gameName: string;
  realm: RealmId;
  queryUsed: string;
  clips: ProClipAnalyzerItem[];
  totalClips: number;
  syncedAtIso: string;
}

export function buildScrubberChaptersForClip(clip: RealCoachClip): {
  durationSec: number;
  chapters: ScrubberChapterDot[];
} {
  const durationSec = Math.max(60, parseDurationToSeconds(clip.durationLabel));
  const m0 = clip.keyMoments[0]?.sec ?? Math.min(25, Math.floor(durationSec * 0.12));
  const m1 = clip.keyMoments[1]?.sec ?? Math.min(95, Math.floor(durationSec * 0.42));
  const m2 = clip.keyMoments[2]?.sec ?? Math.min(180, Math.floor(durationSec * 0.76));

  // Ensure strictly increasing chapter timestamps with comfortable visual spacing on scrubber
  const sec0 = Math.max(5, Math.min(m0, Math.floor(durationSec * 0.3)));
  const sec1 = Math.max(sec0 + 15, Math.min(m1, Math.floor(durationSec * 0.65)));
  const sec2 = Math.max(sec1 + 20, Math.min(m2, Math.floor(durationSec * 0.9)));

  const pct0 = Math.max(12, Math.min(28, Math.round((sec0 / durationSec) * 100)));
  const pct1 = Math.max(pct0 + 22, Math.min(58, Math.round((sec1 / durationSec) * 100)));
  const pct2 = Math.max(pct1 + 22, Math.min(88, Math.round((sec2 / durationSec) * 100)));

  const chapters: ScrubberChapterDot[] = [
    {
      id: 'error',
      sec: sec0,
      timeLabel: formatSecondsToTime(sec0),
      shortLabelFa: 'خطا', shortLabelEn: 'Mistake',
      fullLabelFa: 'تشخیص خطا',
      progressPct: pct0,
      accentHex: '#F43F5E',
    },
    {
      id: 'fix',
      sec: sec1,
      timeLabel: formatSecondsToTime(sec1),
      shortLabelFa: 'اصلاح', shortLabelEn: 'Fix',
      fullLabelFa: 'لحظه اصلاح',
      progressPct: pct1,
      accentHex: '#22C55E',
    },
    {
      id: 'execute',
      sec: sec2,
      timeLabel: formatSecondsToTime(sec2),
      shortLabelFa: 'اجرا', shortLabelEn: 'Execute',
      fullLabelFa: 'اجرای حرفه‌ای',
      progressPct: pct2,
      accentHex: '#38BDF8',
    },
  ];

  return { durationSec, chapters };
}

/**
 * Agent 1: ProClipAnalyzerAgent
 * Independently discovers & updates real YouTube Pro & Reddit community clips,
 * extracts 3 synchronized scrubber chapters (خطا | اصلاح | اجرا), and populates
 * the collapsible community clips drawer.
 */
export async function runProClipAnalyzerAgent(
  input: {
    gameId: string;
    gameName?: string;
    realm?: RealmId;
    userQuery?: string;
  },
  options: { force?: boolean; fetcher?: typeof fetch; nowMs?: number } = {}
): Promise<ProClipAnalyzerResponse> {
  const discovery = await discoverRealCoachClips(input, options);

  const clips: ProClipAnalyzerItem[] = discovery.clips.map((clip) => {
    const { durationSec, chapters } = buildScrubberChaptersForClip(clip);
    return {
      id: clip.id,
      youtubeId: clip.youtubeId,
      title: clip.title,
      channelName: clip.channelName,
      viewsLabel: clip.viewsLabel,
      durationLabel: clip.durationLabel,
      durationSec,
      thumbnailUrl: clip.thumbnailUrl,
      sourceKind: clip.sourceKind,
      sourceBadgeFa: clip.sourceBadgeFa,
      chapters,
      problemFoundFa: clip.problemFoundFa,
      solutionFixFa: clip.solutionFixFa,
      coachCommentaryFa: clip.coachCommentaryFa,
    };
  });

  return {
    agentName: 'ProClipAnalyzerAgent',
    gameId: discovery.gameId,
    gameName: discovery.gameName,
    realm: discovery.realm,
    queryUsed: discovery.queryUsed,
    clips,
    totalClips: clips.length,
    syncedAtIso: discovery.discoveredAtIso,
  };
}
