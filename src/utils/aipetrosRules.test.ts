import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceEscrowMilestone,
  applyChessRatingsToDNA,
  castJuryVote,
  claimMissionReward,
  computeCompositeDNA,
  deriveAvatarTier,
  evaluateThroughBallPass,
  markMissionProgress,
  validateChessDrillMove,
} from './aipetrosRules';
import type { EscrowContract, GamerProfile, HighCourtCase, WalletLedger } from '../types/aipetros';

test('computeCompositeDNA computes clamped rounded average', () => {
  const score = computeCompositeDNA({
    trapAnticipation: 84,
    spatialPassing: 88,
    endgameComposure: 78,
    tempoControl: 82,
    riskDiscipline: 76,
    tacticalVision: 90,
  });
  assert.equal(score, 83);
});

test('deriveAvatarTier scales correctly with reputation', () => {
  assert.equal(deriveAvatarTier(420), 1);
  assert.equal(deriveAvatarTier(610), 2);
  assert.equal(deriveAvatarTier(810), 3);
  assert.equal(deriveAvatarTier(940), 4);
});

test('applyChessRatingsToDNA updates tactical and endgame traits', () => {
  const updated = applyChessRatingsToDNA(
    {
      trapAnticipation: 70,
      spatialPassing: 85,
      endgameComposure: 70,
      tempoControl: 70,
      riskDiscipline: 80,
      tacticalVision: 70,
    },
    2000,
    1850
  );
  assert.ok(updated.endgameComposure > 70);
  assert.ok(updated.tacticalVision > 70);
  assert.equal(updated.spatialPassing, 85);
});

test('advanceEscrowMilestone releases locked points upon final win', () => {
  const contract: EscrowContract = {
    id: 'esc-1',
    playerHandle: 'Vortex_UK',
    role: 'CAM',
    clubName: 'London Vanguard FC',
    game: 'EA SPORTS FC Pro Clubs',
    lockedPoints: 1200,
    winsRequired: 2,
    winsCompleted: 1,
    status: 'active_locked',
    createdAt: '2026-11-17',
  };
  const wallet: WalletLedger = {
    xp: 4000,
    reputation: 800,
    platformPoints: 500,
    collectiblesCount: 4,
  };

  const result = advanceEscrowMilestone(contract, wallet);
  assert.equal(result.releasedNow, true);
  assert.equal(result.contract.status, 'released');
  assert.equal(result.wallet.platformPoints, 1700);
  assert.equal(result.wallet.reputation, 815);
});

test('castJuryVote enforces single vote and transitions verdict at quorum', () => {
  const openCase: HighCourtCase = {
    id: 'case-1',
    title: 'Suspected Score Edit',
    game: 'EA SPORTS FC Pro Clubs',
    accusedHandle: 'ShadowStriker',
    claimantClub: 'Madrid Titans',
    summary: 'Disputed 7-0 scoreline',
    c2paStatus: 'Tampered / Missing Manifest',
    votesUphold: 19,
    votesAcquit: 5,
    quorumTarget: 25,
    status: 'open_deliberation',
  };

  const voted = castJuryVote(openCase, 'uphold');
  assert.equal(voted.votesUphold, 20);
  assert.equal(voted.status, 'ruled_violation');
  assert.equal(voted.userVoted, 'uphold');

  // Re-voting must be ignored
  const secondVote = castJuryVote(voted, 'acquit');
  assert.equal(secondVote.votesAcquit, 5);
});

test('validateChessDrillMove detects legal winning checkmate move', () => {
  const fen = '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1';
  const res = validateChessDrillMove(fen, 'a1', 'a8', ['a1a8']);
  assert.equal(res.legal, true);
  assert.equal(res.isWinningMove, true);
  assert.equal(res.san, 'Ra8#');

  const wrong = validateChessDrillMove(fen, 'a1', 'b1', ['a1a8']);
  assert.equal(wrong.legal, true);
  assert.equal(wrong.isWinningMove, false);
});

test('evaluateThroughBallPass detects interception vs clean assist', () => {
  const target = { x: 4, z: -8, radius: 2.2 };
  const clean = evaluateThroughBallPass({ x: 4.3, z: -7.5 }, target, [{ x: 0, z: -4 }]);
  assert.equal(clean.intercepted, false);
  assert.equal(clean.inTargetZone, true);

  const blocked = evaluateThroughBallPass({ x: 4.0, z: -8.0 }, target, [{ x: 3.9, z: -7.9 }]);
  assert.equal(blocked.intercepted, true);
  assert.equal(blocked.inTargetZone, false);
});

test('markMissionProgress and claimMissionReward credit wallet once', () => {
  const missions: GamerProfile['missions'] = [
    {
      id: 'm-1',
      title: 'Verify 1 Match Scoreboard',
      game: 'EA SPORTS FC Pro Clubs',
      progress: 0,
      target: 1,
      rewardPoints: 50,
      rewardXp: 150,
      completed: false,
      claimed: false,
    },
  ];
  const wallet: WalletLedger = {
    xp: 1000,
    reputation: 800,
    platformPoints: 500,
    collectiblesCount: 4,
  };

  const progressed = markMissionProgress(missions, 'm-1');
  assert.equal(progressed[0].completed, true);
  assert.equal(progressed[0].claimed, false);

  const firstClaim = claimMissionReward(progressed, wallet, 'm-1');
  assert.equal(firstClaim.claimedNow, true);
  assert.equal(firstClaim.missions[0].claimed, true);
  assert.equal(firstClaim.wallet.xp, 1150);
  assert.equal(firstClaim.wallet.platformPoints, 550);

  // Double-claim must be rejected
  const secondClaim = claimMissionReward(firstClaim.missions, firstClaim.wallet, 'm-1');
  assert.equal(secondClaim.claimedNow, false);
  assert.equal(secondClaim.wallet.xp, 1150);
});
