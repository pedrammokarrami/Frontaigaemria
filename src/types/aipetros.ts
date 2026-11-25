export type AppSection =
  | 'gamer-id'
  | 'meta-world'
  | 'training-lab'
  | 'clubs-escrow'
  | 'high-court';

export type SupportedGame =
  | 'EA SPORTS FC Pro Clubs'
  | 'Chess'
  | 'Call of Duty'
  | 'Backgammon';

export type VerificationStatus =
  | 'verified_api'
  | 'pending_captain'
  | 'verified_dual'
  | 'disputed_court';

export interface SkillDNAAxes {
  trapAnticipation: number; // 0-100
  spatialPassing: number;   // 0-100
  endgameComposure: number; // 0-100
  tempoControl: number;     // 0-100
  riskDiscipline: number;   // 0-100
  tacticalVision: number;   // 0-100
}

export interface WalletLedger {
  xp: number;
  reputation: number;        // Non-transferable competitive trust index (0-1000)
  platformPoints: number;    // Spendable inside AIPETROS economy & Escrow
  collectiblesCount: number; // Digital trophies / Petros-ready badges
}

export interface LinkedGameAccount {
  game: SupportedGame;
  handle: string;
  platform: string;
  ratingLabel: string;
  ratingValue: string;
  verifiedVia: 'Public API' | 'C2PA + Captain' | 'Linked Handle';
  lastSyncedAt: string;
}

export interface GamerProfile {
  id: string;
  displayName: string;
  handle: string;
  region: string;
  clubName: string;
  clubTag: string;
  avatarTier: 1 | 2 | 3 | 4;
  cloneArchetype: string;
  cloneSummary: string;
  skillDNA: SkillDNAAxes;
  wallet: WalletLedger;
  linkedAccounts: LinkedGameAccount[];
  missions: {
    id: string;
    title: string;
    game: SupportedGame;
    progress: number;
    target: number;
    rewardPoints: number;
    rewardXp: number;
    completed: boolean;
    claimed: boolean;
  }[];
}

export interface MatchRecord {
  id: string;
  game: SupportedGame;
  opponent: string;
  result: 'win' | 'loss' | 'draw';
  scoreDisplay: string;
  metricsSummary: string;
  verificationStatus: VerificationStatus;
  c2paSigned: boolean;
  proofHash: string;
  screenshotUrl?: string;
  aiConfidence?: number;
  timestamp: string;
  territoryId?: string;
}

export interface TerritoryNode {
  id: string;
  name: string;
  region: 'UK' | 'Europe' | 'North America';
  lat: number;
  lon: number;
  controllingClub: string;
  controllingTag: string;
  colorHex: string;
  defenseStrength: number;
  bonusPointsPerDay: number;
  featuredGame: 'EA SPORTS FC Pro Clubs' | 'Chess';
  activeChallengeTitle: string;
}

export interface ChessDrillScenario {
  id: string;
  mode: '2d-chess';
  title: string;
  weaknessTag: string;
  fen: string;
  playerColor: 'w' | 'b';
  expectedMovesUci: string[]; // e.g., ["f7e8q", "d1d8"] or SAN
  expectedSan: string;
  hint: string;
  durationSec: number;
}

export interface PitchDrillScenario {
  id: string;
  mode: '3d-pitch';
  title: string;
  weaknessTag: string;
  briefing: string;
  strikerStart: { x: number; z: number };
  strikerVelocity: { x: number; z: number };
  defenderPatrols: { x: number; z: number; speed: number; range: number }[];
  targetZone: { x: number; z: number; radius: number };
  durationSec: number;
}

export type MicroGameScenario = ChessDrillScenario | PitchDrillScenario;

export interface EscrowContract {
  id: string;
  playerHandle: string;
  role: string;
  clubName: string;
  game: SupportedGame;
  lockedPoints: number;
  winsRequired: number;
  winsCompleted: number;
  status: 'active_locked' | 'released' | 'frozen_dispute';
  createdAt: string;
}

export interface ChaosTournament {
  id: string;
  name: string;
  game: SupportedGame;
  region: string;
  prizePoolPoints: number;
  participantsCount: number;
  maxParticipants: number;
  activeChaosRule: string;
  roundLabel: string;
  joined: boolean;
  chaosVerifiedCount: number;
}

export interface HighCourtCase {
  id: string;
  title: string;
  game: SupportedGame;
  accusedHandle: string;
  claimantClub: string;
  summary: string;
  evidenceImageUrl?: string;
  c2paStatus: 'Tampered / Missing Manifest' | 'Valid Hardware Sign' | 'API Anomaly Flagged';
  aiProsecutorBrief?: {
    verdictRecommendation: 'uphold_violation' | 'acquit_player';
    confidence: number;
    forensicFindings: string[];
    crossGameBehavioralNote: string;
  };
  votesUphold: number;
  votesAcquit: number;
  quorumTarget: number;
  userVoted?: 'uphold' | 'acquit';
  status: 'open_deliberation' | 'ruled_violation' | 'ruled_acquitted';
  escrowLinkedId?: string;
}

export interface ScoutCandidate {
  id: string;
  handle: string;
  primaryGame: SupportedGame;
  secondaryGame: SupportedGame;
  role: string;
  region: string;
  dnaMatchPercent: number;
  reputation: number;
  askingEscrowPoints: number;
  highlightTrait: string;
}

export interface EcosystemState {
  profile: GamerProfile;
  matches: MatchRecord[];
  territories: TerritoryNode[];
  escrows: EscrowContract[];
  tournaments: ChaosTournament[];
  highCourtCases: HighCourtCase[];
  scoutPool: ScoutCandidate[];
  activeDrills: MicroGameScenario[];
}
