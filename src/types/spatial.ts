export type RealmId = 'shooter' | 'sports' | 'strategy' | 'story';

export type ModuleDrawerId = 'coach' | 'radar' | 'court' | 'highlights' | 'arena' | null;

export type MediaSourceType = 'youtube' | 'reddit' | 'twitch' | 'upload' | 'question' | 'featured';

export interface MediaTimestampMark {
  id: string;
  time: string;
  label: string;
  insight: string;
  deltaStat: string;
}

export interface AnalyzedMediaItem {
  id: string;
  realm: RealmId;
  sourceType: MediaSourceType;
  title: string;
  sourceUrl?: string;
  youtubeId?: string;
  uploadedPreviewUrl?: string;
  uploadedKind?: 'image' | 'video';
  summary: string;
  coachQuote: string;
  confidence: number;
  hudMetrics: Array<{ label: string; value: string }>;
  timestamps: MediaTimestampMark[];
  createdAt: string;
}

export interface WarRoomNode {
  id: string;
  realm: RealmId;
  region: string;
  city: string;
  lat: number;
  lon: number;
  kind: 'rival' | 'teammate' | 'tournament';
  name: string;
  tag: string;
  dnaMatch: number;
  eloOrRank: string;
  statusText: string;
  prizeOrStake: string;
}

export interface RealityCourtCase {
  id: string;
  realm: RealmId;
  title: string;
  suspectHandle: string;
  reporterTag: string;
  gameTitle: string;
  anomalyScore: number;
  c2paStatus: 'Tampered Signature' | 'Verified Hardware Log' | 'Frame Interpolation Flag';
  forensicSummary: string;
  clipSourceType: 'video' | 'youtube';
  clipVideoUrl?: string;
  youtubeId?: string;
  telemetryStats: Array<{ label: string; value: string }>;
  votesUphold: number;
  votesAcquit: number;
  quorumTarget: number;
  userVote?: 'uphold' | 'acquit';
}

export interface ViralHighlightItem {
  id: string;
  realm: RealmId;
  title: string;
  playerHandle: string;
  gameTitle: string;
  duration: string;
  viewsCount: string;
  hudStats: Array<{ label: string; value: string }>;
  aiCaption: string;
  shareCode: string;
  clipUrl: string;
}

export interface PredictionMatch {
  id: string;
  realm: RealmId;
  eventTitle: string;
  startsIn: string;
  poolPts: number;
  teamA: { name: string; tag: string; odds: number; winProb: number };
  teamB: { name: string; tag: string; odds: number; winProb: number };
}

export interface UserPredictionStake {
  matchId: string;
  side: 'A' | 'B';
  teamName: string;
  amount: number;
  potentialPayout: number;
  placedAt: string;
}

export interface RealmThemeConfig {
  id: RealmId;
  label: string;
  shortLabel: string;
  franchiseTag: string;
  tagline: string;
  accentHex: string;
  secondaryHex: string;
  bgHex: string;
  hudShapeLabel: string;
  ue5SceneImageUrl: string;
  coachName: string;
  coachTitle: string;
  coachGreeting: string;
  coachVoicePitch: number;
  coachVoiceRate: number;
  sampleInputs: Array<{ label: string; value: string }>;
  defaultAnalysis: AnalyzedMediaItem;
}

export interface MediaManifest {
  lobbyVideoUrl: string | null;
  avatarGlbUrl: string | null;
  coachGlbs: Record<RealmId, string | null>;
}

export interface SpatialOsState {
  activeRealm: RealmId;
  xp: number;
  platformPoints: number;
  reputation: number;
  playerHandle: string;
  rankLabel: string;
  invitesSent: number;
  invitesTarget: number;
  inviteCode: string;
  deathmatchUnlocked: boolean;
  challengedNodeIds: string[];
  sharedHighlightIds: string[];
  courtCases: RealityCourtCase[];
  stakes: UserPredictionStake[];
  analysesByRealm: Record<RealmId, AnalyzedMediaItem[]>;
}
