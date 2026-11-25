import { Chess } from 'chess.js';
import type {
  EscrowContract,
  GamerProfile,
  HighCourtCase,
  SkillDNAAxes,
  WalletLedger,
} from '../types/aipetros';

/**
 * Computes the composite Cross-Game Skill DNA index (0-100)
 * weighting tactical anticipation and spatial execution equally.
 */
export function computeCompositeDNA(dna: SkillDNAAxes): number {
  const values = [
    dna.trapAnticipation,
    dna.spatialPassing,
    dna.endgameComposure,
    dna.tempoControl,
    dna.riskDiscipline,
    dna.tacticalVision,
  ];
  const clamped = values.map((v) => Math.max(0, Math.min(100, v)));
  const avg = clamped.reduce((acc, val) => acc + val, 0) / clamped.length;
  return Math.round(avg);
}

/**
 * Derives the 3D Avatar evolution tier (1..4) from non-transferable Reputation.
 */
export function deriveAvatarTier(reputation: number): 1 | 2 | 3 | 4 {
  if (reputation >= 900) return 4;
  if (reputation >= 750) return 3;
  if (reputation >= 550) return 2;
  return 1;
}

/**
 * Maps Chess.com / Lichess Elo ratings into updated Cross-Game Skill DNA traits.
 */
export function applyChessRatingsToDNA(
  current: SkillDNAAxes,
  rapidRating: number,
  blitzRating: number
): SkillDNAAxes {
  const normalizedRapid = Math.max(40, Math.min(99, Math.round(40 + ((rapidRating - 800) / 1600) * 58)));
  const normalizedBlitz = Math.max(40, Math.min(99, Math.round(40 + ((blitzRating - 800) / 1600) * 58)));

  return {
    ...current,
    trapAnticipation: Math.round(current.trapAnticipation * 0.4 + normalizedRapid * 0.6),
    endgameComposure: Math.round(current.endgameComposure * 0.35 + normalizedRapid * 0.65),
    tempoControl: Math.round(current.tempoControl * 0.45 + normalizedBlitz * 0.55),
    tacticalVision: Math.round((normalizedRapid + normalizedBlitz) / 2),
  };
}

/**
 * Validates and advances a Smart Scouting Escrow contract by 1 verified win.
 * Automatically transitions to 'released' once winsCompleted >= winsRequired.
 */
export function advanceEscrowMilestone(
  contract: EscrowContract,
  wallet: WalletLedger
): { contract: EscrowContract; wallet: WalletLedger; releasedNow: boolean } {
  if (contract.status !== 'active_locked') {
    return { contract, wallet, releasedNow: false };
  }

  const nextWins = Math.min(contract.winsRequired, contract.winsCompleted + 1);
  const reachedTarget = nextWins >= contract.winsRequired;

  const updatedContract: EscrowContract = {
    ...contract,
    winsCompleted: nextWins,
    status: reachedTarget ? 'released' : 'active_locked',
  };

  const updatedWallet: WalletLedger = reachedTarget
    ? {
        ...wallet,
        platformPoints: wallet.platformPoints + contract.lockedPoints,
        reputation: Math.min(1000, wallet.reputation + 15),
      }
    : wallet;

  return {
    contract: updatedContract,
    wallet: updatedWallet,
    releasedNow: reachedTarget,
  };
}

/**
 * Casts a High Court Jury vote and resolves the case if quorum is reached.
 */
export function castJuryVote(
  courtCase: HighCourtCase,
  decision: 'uphold' | 'acquit'
): HighCourtCase {
  if (courtCase.status !== 'open_deliberation' || courtCase.userVoted) {
    return courtCase;
  }

  const votesUphold = courtCase.votesUphold + (decision === 'uphold' ? 1 : 0);
  const votesAcquit = courtCase.votesAcquit + (decision === 'acquit' ? 1 : 0);
  const totalVotes = votesUphold + votesAcquit;

  let nextStatus: HighCourtCase['status'] = courtCase.status;
  if (totalVotes >= courtCase.quorumTarget) {
    nextStatus = votesUphold >= votesAcquit ? 'ruled_violation' : 'ruled_acquitted';
  }

  return {
    ...courtCase,
    votesUphold,
    votesAcquit,
    userVoted: decision,
    status: nextStatus,
  };
}

/**
 * Deterministic validator for 10-second Chess tactical drills using chess.js.
 */
export function validateChessDrillMove(
  fen: string,
  fromSquare: string,
  toSquare: string,
  expectedMovesUci: string[]
): { legal: boolean; isWinningMove: boolean; san: string; nextFen: string } {
  const chess = new Chess(fen);
  try {
    const move = chess.move({
      from: fromSquare,
      to: toSquare,
      promotion: 'q',
    });

    if (!move) {
      return { legal: false, isWinningMove: false, san: '', nextFen: fen };
    }

    const uci = `${move.from}${move.to}${move.promotion ?? ''}`.toLowerCase();
    const uciBase = `${move.from}${move.to}`.toLowerCase();
    const isMatch = expectedMovesUci.some(
      (exp) => exp.toLowerCase() === uci || exp.toLowerCase() === uciBase
    );

    return {
      legal: true,
      isWinningMove: isMatch || chess.isCheckmate(),
      san: move.san,
      nextFen: chess.fen(),
    };
  } catch {
    return { legal: false, isWinningMove: false, san: '', nextFen: fen };
  }
}

/**
 * Deterministic verification helper for 3D EA FC Pitch passing drill.
 */
export function evaluateThroughBallPass(
  ballLanding: { x: number; z: number },
  targetZone: { x: number; z: number; radius: number },
  defenders: { x: number; z: number }[]
): { intercepted: boolean; inTargetZone: boolean; distanceToTarget: number } {
  const intercepted = defenders.some((def) => {
    const dx = ballLanding.x - def.x;
    const dz = ballLanding.z - def.z;
    return Math.hypot(dx, dz) < 1.35;
  });

  const distanceToTarget = Math.hypot(
    ballLanding.x - targetZone.x,
    ballLanding.z - targetZone.z
  );

  return {
    intercepted,
    inTargetZone: !intercepted && distanceToTarget <= targetZone.radius,
    distanceToTarget: Number(distanceToTarget.toFixed(2)),
  };
}

/**
 * Normalizes a string into a deterministic short hexadecimal proof digest
 * when binary WebCrypto isn't required (for instant UI display / tests).
 */
export function computeDeterministicProofId(payload: string): string {
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `0x${(hash >>> 0).toString(16).padStart(8, '0')}c2pa`;
}

/**
 * Advances progress on a daily mission and marks it ready to claim once target is reached.
 */
export function markMissionProgress(
  missions: GamerProfile['missions'],
  missionId: string,
  increment = 1
): GamerProfile['missions'] {
  return missions.map((ms) => {
    if (ms.id !== missionId || ms.completed) return ms;
    const progress = Math.min(ms.target, ms.progress + increment);
    return {
      ...ms,
      progress,
      completed: progress >= ms.target,
    };
  });
}

/**
 * Claims a completed daily mission reward once, crediting XP and Platform Points to the wallet.
 */
export function claimMissionReward(
  missions: GamerProfile['missions'],
  wallet: WalletLedger,
  missionId: string
): { missions: GamerProfile['missions']; wallet: WalletLedger; claimedNow: boolean } {
  const target = missions.find((ms) => ms.id === missionId);
  if (!target || !target.completed || target.claimed) {
    return { missions, wallet, claimedNow: false };
  }

  return {
    missions: missions.map((ms) => (ms.id === missionId ? { ...ms, claimed: true } : ms)),
    wallet: {
      ...wallet,
      xp: wallet.xp + target.rewardXp,
      platformPoints: wallet.platformPoints + target.rewardPoints,
    },
    claimedNow: true,
  };
}
