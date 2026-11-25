import { PREDICTION_MATCHES, REALM_CONFIGS } from '../data/realmsData';
import type {
  AnalyzedMediaItem,
  MediaSourceType,
  RealmId,
  SpatialOsState,
  UserPredictionStake,
} from '../types/spatial';

/**
 * Extracts a canonical 11-char YouTube video ID from standard, short, mobile, or embed URLs.
 */
export function extractYouTubeId(rawInput: string): string | null {
  const input = rawInput.trim();
  if (!input) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const regex of patterns) {
    const match = input.match(regex);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

export function detectMediaSourceType(rawInput: string): MediaSourceType {
  const lower = rawInput.toLowerCase();
  if (extractYouTubeId(rawInput)) return 'youtube';
  if (lower.includes('reddit.com') || lower.includes('redd.it')) return 'reddit';
  if (lower.includes('twitch.tv')) return 'twitch';
  return 'question';
}

export interface ParseMediaOptions {
  rawInput: string;
  realm: RealmId;
  uploadedPreviewUrl?: string;
  uploadedKind?: 'image' | 'video';
  uploadedFileName?: string;
}

/**
 * Omnichannel analyzer: parses YouTube, Reddit, Twitch, local uploads, or tactical questions
 * into an interactive spatial breakdown anchored to the active Realm Coach.
 */
export function parseMediaInput(options: ParseMediaOptions): AnalyzedMediaItem {
  const { rawInput, realm, uploadedPreviewUrl, uploadedKind, uploadedFileName } = options;
  const trimmed = rawInput.trim();
  const cfg = REALM_CONFIGS[realm];
  const youtubeId = trimmed ? extractYouTubeId(trimmed) : null;
  const sourceType: MediaSourceType = uploadedPreviewUrl
    ? 'upload'
    : detectMediaSourceType(trimmed);

  if (sourceType === 'upload' && uploadedPreviewUrl) {
    return {
      id: `analysis-${Date.now()}`,
      realm,
      sourceType: 'upload',
      title: uploadedFileName ? `Local Frame Audit · ${uploadedFileName}` : `${cfg.shortLabel} Capture Audit`,
      uploadedPreviewUrl,
      uploadedKind: uploadedKind ?? 'image',
      summary: `${cfg.coachName} scanned your ${uploadedKind === 'video' ? 'video sequence' : 'captured frame'} under ${cfg.franchiseTag} telemetry rules. Positional spacing and micro-timing vectors extracted.`,
      coachQuote:
        realm === 'shooter'
          ? 'Crosshair height is clean, but widen your jiggle-peek distance to bait the defender shot before swinging.'
          : realm === 'sports'
            ? 'Your far-side wing is wide open behind their tucked fullback — trigger the diagonal switch immediately.'
            : realm === 'strategy'
              ? 'Strong central tension. Avoid pushing the flank pawn until your rook anchors the open file.'
              : 'Lighting & framing lock onto the horizon ridge; track the secondary camp audio cue for the hidden dialogue.',
      confidence: 97,
      hudMetrics: [
        { label: 'INTEGRITY', value: 'C2PA OK' },
        { label: 'FRAME SYNC', value: '60 FPS' },
        { label: 'CONFIDENCE', value: '97%' },
      ],
      timestamps: [
        {
          id: `up-1-${Date.now()}`,
          time: '0:02',
          label: 'Opening Telemetry Lock',
          insight: 'Primary angle verified against realm positioning baseline.',
          deltaStat: '+12% Efficiency',
        },
        {
          id: `up-2-${Date.now()}`,
          time: '0:08',
          label: 'Decision Inflection Point',
          insight: 'Optimal commitment window detected before opponent rotation completes.',
          deltaStat: '+24% Win Odds',
        },
      ],
      createdAt: 'Just now',
    };
  }

  if (sourceType === 'youtube' && youtubeId) {
    return {
      id: `analysis-${Date.now()}`,
      realm,
      sourceType: 'youtube',
      title: `Cinema Feed · YouTube (${youtubeId})`,
      sourceUrl: trimmed,
      youtubeId,
      summary: `${cfg.coachName} synchronized YouTube stream [${youtubeId}] directly inside the Spatial Cinema Frame. Tactical timings & inflection beats mapped to ${cfg.franchiseTag}.`,
      coachQuote:
        realm === 'shooter'
          ? 'Track the 0:18 entry flash sequence — pre-aim head-level on the box corner before swinging out.'
          : realm === 'sports'
            ? 'Notice the midfield triangle shift at 0:22 — dragging the CDM creates an instant half-space lane.'
            : realm === 'strategy'
              ? 'Study the wave & vision setup at 0:27 — tempo control matters more than chasing a low-percentage skirmish.'
              : 'Watch the environmental storytelling cue at 0:21 — subtle foreground silhouette foreshadows the betrayal.',
      confidence: 96,
      hudMetrics: [
        { label: 'FEED', value: 'EMBEDDED' },
        { label: 'SYNC', value: 'LIVE HUD' },
        { label: 'CONFIDENCE', value: '96%' },
      ],
      timestamps: [
        {
          id: `yt-1-${Date.now()}`,
          time: '0:14',
          label: 'Spatial Setup Window',
          insight: 'Initial positioning spreads threat angles across two independent lanes.',
          deltaStat: '+15% Control',
        },
        {
          id: `yt-2-${Date.now()}`,
          time: '0:34',
          label: 'Critical Execution Beat',
          insight: 'Commit decision aligns cleanly with cooldown / stamina advantage.',
          deltaStat: '+28% Impact',
        },
        {
          id: `yt-3-${Date.now()}`,
          time: '0:56',
          label: 'Conversion & Reset',
          insight: 'Immediate disengage preserves resource lead for the following phase.',
          deltaStat: '+91% Retention',
        },
      ],
      createdAt: 'Embedded Live',
    };
  }

  if (sourceType === 'reddit' || sourceType === 'twitch') {
    const isReddit = sourceType === 'reddit';
    return {
      id: `analysis-${Date.now()}`,
      realm,
      sourceType,
      title: isReddit
        ? `Reddit Meta Thread Synthesis`
        : `Twitch Clip Velocity Audit`,
      sourceUrl: trimmed,
      summary: isReddit
        ? `Extracted core community consensus & counter-meta math from Reddit discussion: "${trimmed.slice(0, 64)}".`
        : `Parsed Twitch clip cadence & mechanical reaction splits from stream link: "${trimmed.slice(0, 64)}".`,
      coachQuote: isReddit
        ? 'High-upvoted strats fail when executed passively. Pair this setup with synchronized buddy pressure on contact.'
        : 'Clean mechanical execution in the clip — replicate the pre-movement camera centering rather than chasing raw flick speed.',
      confidence: 93,
      hudMetrics: [
        { label: 'SOURCE', value: isReddit ? 'REDDIT' : 'TWITCH' },
        { label: 'META FIT', value: 'S-TIER' },
        { label: 'CONFIDENCE', value: '93%' },
      ],
      timestamps: [
        {
          id: `ext-1-${Date.now()}`,
          time: 'PHASE 1',
          label: isReddit ? 'Core Meta Thesis' : 'Pre-Engagement Setup',
          insight: 'Isolates primary win condition highlighted in the external community breakdown.',
          deltaStat: '+19% EV',
        },
        {
          id: `ext-2-${Date.now()}`,
          time: 'PHASE 2',
          label: isReddit ? 'Counterplay Warning' : 'Post-Action Escape',
          insight: 'Accounts for common ranked ladder adaptation so your setup stays resilient.',
          deltaStat: '+31% Safety',
        },
      ],
      createdAt: 'Just now',
    };
  }

  // Tactical Question
  const questionLabel = trimmed.length > 52 ? `${trimmed.slice(0, 52)}...` : trimmed || `${cfg.shortLabel} Tactical Query`;
  return {
    id: `analysis-${Date.now()}`,
    realm,
    sourceType: 'question',
    title: `Coach Briefing · ${questionLabel}`,
    summary: `Direct tactical consultation with ${cfg.coachName} calibrated for ${cfg.franchiseTag}.`,
    coachQuote:
      realm === 'shooter'
        ? `Regarding "${questionLabel}": Isolate fights into 1v1 duels using off-angles and smoke edges. Never dry-peek an operator holding static crosshair placement.`
        : realm === 'sports'
          ? `Regarding "${questionLabel}": Recycle once through your deep pivot to shift their defensive block, then strike the weak-side half-space before their fullback recovers.`
          : realm === 'strategy'
            ? `Regarding "${questionLabel}": Secure wave/board initiative first. Trade only when the resulting endgame or objective clock favors your power spike.`
            : `Regarding "${questionLabel}": Exhaust camp conversations between main chapters and observe subtle weather/music shifts to unlock hidden narrative outcomes.`,
    confidence: 95,
    hudMetrics: [
      { label: 'MODE', value: 'DIRECT AI' },
      { label: 'REALM', value: cfg.shortLabel },
      { label: 'CONFIDENCE', value: '95%' },
    ],
    timestamps: [
      {
        id: `q-1-${Date.now()}`,
        time: 'STEP 01',
        label: 'Immediate Adjustment',
        insight: 'Apply primary positioning reset on your next round or possession.',
        deltaStat: '+16% Control',
      },
      {
        id: `q-2-${Date.now()}`,
        time: 'STEP 02',
        label: 'Punish Counter-Reaction',
        insight: 'Anticipate opponent adaptation and hold secondary trap angle.',
        deltaStat: '+27% Conversion',
      },
    ],
    createdAt: 'Just now',
  };
}

export function placePredictionStake(
  state: SpatialOsState,
  matchId: string,
  side: 'A' | 'B',
  amount: number
): { nextState: SpatialOsState; stake?: UserPredictionStake; error?: string } {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { nextState: state, error: 'Stake amount must be greater than zero.' };
  }
  if (amount > state.platformPoints) {
    return { nextState: state, error: 'Insufficient Platform PTS for this prediction stake.' };
  }
  const match = PREDICTION_MATCHES.find((m) => m.id === matchId);
  if (!match) {
    return { nextState: state, error: 'Match market not found.' };
  }

  const chosen = side === 'A' ? match.teamA : match.teamB;
  const stake: UserPredictionStake = {
    matchId,
    side,
    teamName: chosen.name,
    amount,
    potentialPayout: Math.round(amount * chosen.odds),
    placedAt: 'Just now',
  };

  return {
    stake,
    nextState: {
      ...state,
      platformPoints: state.platformPoints - amount,
      xp: state.xp + 25,
      stakes: [stake, ...state.stakes],
    },
  };
}

export function castCourtVerdict(
  state: SpatialOsState,
  caseId: string,
  decision: 'uphold' | 'acquit'
): { nextState: SpatialOsState; awardedNow: boolean } {
  const target = state.courtCases.find((c) => c.id === caseId);
  if (!target) {
    return { nextState: state, awardedNow: false };
  }

  const firstVote = !target.userVote;
  const updatedCases = state.courtCases.map((c) => {
    if (c.id !== caseId) return c;
    if (c.userVote === decision) return c;

    let votesUphold = c.votesUphold;
    let votesAcquit = c.votesAcquit;
    if (c.userVote === 'uphold') votesUphold = Math.max(0, votesUphold - 1);
    if (c.userVote === 'acquit') votesAcquit = Math.max(0, votesAcquit - 1);

    if (decision === 'uphold') votesUphold += 1;
    else votesAcquit += 1;

    return { ...c, votesUphold, votesAcquit, userVote: decision };
  });

  return {
    awardedNow: firstVote,
    nextState: {
      ...state,
      xp: state.xp + (firstVote ? 120 : 0),
      platformPoints: state.platformPoints + (firstVote ? 75 : 0),
      reputation: firstVote ? Math.min(1000, state.reputation + 5) : state.reputation,
      courtCases: updatedCases,
    },
  };
}

export function registerDeathmatchInvite(state: SpatialOsState): {
  nextState: SpatialOsState;
  unlockedJustNow: boolean;
} {
  const nextCount = Math.min(state.invitesTarget, state.invitesSent + 1);
  const wasUnlocked = state.deathmatchUnlocked;
  const nowUnlocked = nextCount >= state.invitesTarget;
  const unlockedJustNow = !wasUnlocked && nowUnlocked;

  return {
    unlockedJustNow,
    nextState: {
      ...state,
      invitesSent: nextCount,
      deathmatchUnlocked: nowUnlocked,
      xp: state.xp + (unlockedJustNow ? 350 : 40),
      platformPoints: state.platformPoints + (unlockedJustNow ? 500 : 25),
    },
  };
}
