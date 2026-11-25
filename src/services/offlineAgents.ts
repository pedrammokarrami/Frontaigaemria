import {
  type CrossGameKey,
  type HighlightClipItem,
  INITIAL_OFFLINE_PROFILE_STATE,
  type OfflineAgentsState,
  type RapidDrillRecord,
  type VerifiedMatchRecord,
} from '../data/offlineAgentsData';

const STORAGE_KEY = 'aipetros-crossgame-identity-v1';

/**
 * Deterministic lightweight FNV-1a + salted SHA-style hex digest
 * so offline scoreboard verification works consistently without external crypto servers.
 */
export function computeOfflineIntegrityHash(matchId: string, finalScore: string, gameTitle: string): string {
  const payload = `${matchId}|${finalScore}|${gameTitle}|AIPETROS_OFFLINE_NODE`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < payload.length; i += 1) {
    const code = payload.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= code + i * 31;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  const partA = h1.toString(16).padStart(8, '0').slice(0, 4);
  const partB = h2.toString(16).padStart(8, '0').slice(0, 4);
  return `sha256:${partA}...${partB}`;
}

export function loadOfflineProfileSnapshot(): OfflineAgentsState {
  if (typeof window === 'undefined') {
    return structuredClone(INITIAL_OFFLINE_PROFILE_STATE);
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as OfflineAgentsState;
      if (parsed?.unifiedId && parsed?.profiles && Array.isArray(parsed?.matches)) {
        const mergedProfiles = {
          ...structuredClone(INITIAL_OFFLINE_PROFILE_STATE.profiles),
          ...parsed.profiles,
        };
        const safeActiveKey = mergedProfiles[parsed.activeGameKey]
          ? parsed.activeGameKey
          : 'unified';
        return {
          ...parsed,
          activeGameKey: safeActiveKey,
          profiles: mergedProfiles,
        };
      }
    }
  } catch {
    // Fallback gracefully to deterministic local seed
  }
  return structuredClone(INITIAL_OFFLINE_PROFILE_STATE);
}

export function persistOfflineProfileSnapshot(state: OfflineAgentsState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors in private browsing
  }
}

export function switchCrossGameHandle(
  state: OfflineAgentsState,
  gameKey: CrossGameKey
): OfflineAgentsState {
  if (!state.profiles[gameKey]) return state;
  return {
    ...state,
    activeGameKey: gameKey,
  };
}

export function verifyMatchScoreboard(
  state: OfflineAgentsState,
  matchId?: string
): OfflineAgentsState {
  const targetMatch = matchId
    ? state.matches.find((m) => m.id === matchId)
    : state.matches.find((m) => m.status === 'Local Queue');

  if (!targetMatch) {
    return {
      ...state,
      scoreboardAgent: {
        ...state.scoreboardAgent,
        status: 'Verified',
        queuedCount: state.matches.filter((m) => m.status === 'Local Queue').length,
      },
    };
  }

  const hash =
    targetMatch.integrityHash ??
    computeOfflineIntegrityHash(targetMatch.id, targetMatch.finalScore, targetMatch.gameTitle);

  const wasAlreadyVerified = targetMatch.status === 'Verified';
  const nextMatches: VerifiedMatchRecord[] = state.matches.map((m) =>
    m.id === targetMatch.id
      ? {
          ...m,
          status: 'Verified',
          integrityHash: hash,
        }
      : m
  );

  const nextQueuedCount = nextMatches.filter((m) => m.status === 'Local Queue').length;
  const nextVerifiedCount = wasAlreadyVerified
    ? state.scoreboardAgent.verifiedCount
    : state.scoreboardAgent.verifiedCount + 1;

  const updatedProfiles = { ...state.profiles };
  if (!wasAlreadyVerified) {
    const gameProfile = updatedProfiles[targetMatch.gameKey];
    if (gameProfile) {
      updatedProfiles[targetMatch.gameKey] = {
        ...gameProfile,
        verifiedMatchesCount: gameProfile.verifiedMatchesCount + 1,
      };
    }
    updatedProfiles.unified = {
      ...updatedProfiles.unified,
      verifiedMatchesCount: updatedProfiles.unified.verifiedMatchesCount + 1,
    };
  }

  return {
    ...state,
    lastLocalSyncAt: formatLocalTimeLabel(),
    profiles: updatedProfiles,
    matches: nextMatches,
    scoreboardAgent: {
      status: nextQueuedCount === 0 ? 'Verified' : 'Synced',
      latestHash: hash,
      verifiedCount: nextVerifiedCount,
      queuedCount: nextQueuedCount,
    },
  };
}

export function toggleCoachingMicroAdjustment(
  state: OfflineAgentsState,
  takeawayId: string
): OfflineAgentsState {
  const nextTakeaways = state.coachingAgent.takeaways.map((item) =>
    item.id === takeawayId ? { ...item, applied: !item.applied } : item
  );
  return {
    ...state,
    coachingAgent: {
      ...state.coachingAgent,
      status: 'Synced',
      takeaways: nextTakeaways,
    },
  };
}

export function recordRapidDrillAttempt(
  state: OfflineAgentsState,
  input: {
    discipline: RapidDrillRecord['discipline'];
    promptTitle: string;
    reactionSec: number;
    isCorrect: boolean;
  }
): OfflineAgentsState {
  const clampedReaction = Number(Math.max(0.8, Math.min(9.9, input.reactionSec)).toFixed(1));
  const newRecord: RapidDrillRecord = {
    id: `drill-${Date.now()}-${state.rapidDrillsAgent.records.length + 1}`,
    discipline: input.discipline,
    promptTitle: input.promptTitle,
    reactionSec: clampedReaction,
    accuracyPct: input.isCorrect ? 100 : 65,
    recordedAt: 'Just now',
  };

  const nextRecords = [newRecord, ...state.rapidDrillsAgent.records].slice(0, 8);
  const avg = Number(
    (
      nextRecords.reduce((sum, r) => sum + r.reactionSec, 0) /
      Math.max(1, nextRecords.length)
    ).toFixed(1)
  );

  return {
    ...state,
    lastLocalSyncAt: formatLocalTimeLabel(),
    rapidDrillsAgent: {
      ...state.rapidDrillsAgent,
      status: 'Offline Ready',
      avgReactionSec: avg,
      records: nextRecords,
    },
  };
}

export function resolveDisputeCase(
  state: OfflineAgentsState,
  caseId: string,
  resolution: 'approve' | 'reopen'
): OfflineAgentsState {
  const targetCase = state.disputeAgent.cases.find((c) => c.id === caseId);
  if (!targetCase) return state;

  const nextCaseStatus: 'Resolved · Verified' | 'Open Review' =
    resolution === 'approve' ? 'Resolved · Verified' : 'Open Review';

  const nextCases = state.disputeAgent.cases.map((c) =>
    c.id === caseId ? { ...c, status: nextCaseStatus } : c
  );

  const nextMatches: VerifiedMatchRecord[] = state.matches.map((m) =>
    m.id === targetCase.matchId
      ? {
          ...m,
          status: resolution === 'approve' ? 'Verified' : 'Disputed',
          integrityHash:
            m.integrityHash ?? computeOfflineIntegrityHash(m.id, m.finalScore, m.gameTitle),
        }
      : m
  );

  const hasOpen = nextCases.some((c) => c.status === 'Open Review');

  return {
    ...state,
    lastLocalSyncAt: formatLocalTimeLabel(),
    matches: nextMatches,
    disputeAgent: {
      status: hasOpen ? 'Local Queue' : 'Verified',
      cases: nextCases,
    },
  };
}

export function generateClipHighlight(
  state: OfflineAgentsState,
  matchId?: string,
  preferredGameKey?: VerifiedMatchRecord['gameKey']
): OfflineAgentsState {
  const candidateMatch =
    (matchId ? state.matches.find((m) => m.id === matchId) : undefined) ??
    (preferredGameKey
      ? state.matches.find((m) => m.gameKey === preferredGameKey && !m.highlightClipId) ??
        state.matches.find((m) => m.gameKey === preferredGameKey)
      : undefined) ??
    state.matches.find((m) => m.status === 'Verified' && !m.highlightClipId) ??
    state.matches[0];

  if (!candidateMatch) return state;

  const accentByGame: Record<VerifiedMatchRecord['gameKey'], string> = {
    fc27: '#00E676',
    nba2k: '#F97316',
    fortnite: '#3B82F6',
    dota2: '#0EA5E9',
    f1: '#FF1E00',
    warzone: '#F59E0B',
    cs2: '#A855F7',
    gta: '#EC4899',
    rdr2: '#D97706',
    apex: '#DA292A',
    valorant: '#FF4655',
    chess: '#81B64C',
  };

  const clipId = `clip-${candidateMatch.gameKey}-${state.highlightAgent.clips.length + 1}`;
  const newClip: HighlightClipItem = {
    id: clipId,
    matchId: candidateMatch.id,
    gameKey: candidateMatch.gameKey,
    gameTitle: candidateMatch.gameTitle,
    title: `${candidateMatch.gameTitle} · ${candidateMatch.finalScore} Key Sequence`,
    durationLabel: '0:22',
    timestampLabel: 'Generated Just Now',
    momentTag: `${candidateMatch.status} · Auto-Clipped`,
    summary: `Offline Highlight Agent extracted decisive scoring/tactical momentum against ${candidateMatch.opponentOrMode}.`,
    accentHex: accentByGame[candidateMatch.gameKey] ?? '#0071E3',
    keyframeNotes: [
      { timeLabel: '0:04', note: 'Setup positioning & spacing advantage detected', intensityPct: 62 },
      { timeLabel: '0:11', note: 'Primary tactical execution under pressure', intensityPct: 89 },
      { timeLabel: '0:18', note: `Decisive conversion (${candidateMatch.finalScore})`, intensityPct: 97 },
    ],
  };

  const nextMatches = state.matches.map((m) =>
    m.id === candidateMatch.id ? { ...m, highlightClipId: clipId } : m
  );

  return {
    ...state,
    lastLocalSyncAt: formatLocalTimeLabel(),
    matches: nextMatches,
    highlightAgent: {
      status: 'Synced',
      clips: [newClip, ...state.highlightAgent.clips],
    },
  };
}

export async function syncLocalStateWithServer(
  state: OfflineAgentsState
): Promise<{ syncedRemote: boolean; nextState: OfflineAgentsState }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1400);
    const res = await fetch('/api/health', { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const nextState: OfflineAgentsState = {
        ...state,
        lastLocalSyncAt: formatLocalTimeLabel(),
      };
      persistOfflineProfileSnapshot(nextState);
      return { syncedRemote: true, nextState };
    }
  } catch {
    // Offline or no backend route — stay seamlessly local
  }
  const nextState: OfflineAgentsState = {
    ...state,
    lastLocalSyncAt: formatLocalTimeLabel(),
  };
  persistOfflineProfileSnapshot(nextState);
  return { syncedRemote: false, nextState };
}

function formatLocalTimeLabel(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `Today · ${hh}:${mm}`;
}
