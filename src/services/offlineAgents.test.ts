import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_OFFLINE_PROFILE_STATE } from '../data/offlineAgentsData';
import {
  computeOfflineIntegrityHash,
  generateClipHighlight,
  recordRapidDrillAttempt,
  resolveDisputeCase,
  switchCrossGameHandle,
  toggleCoachingMicroAdjustment,
  verifyMatchScoreboard,
} from './offlineAgents';

test('computeOfflineIntegrityHash produces deterministic sha256-prefixed digest', () => {
  const hashA = computeOfflineIntegrityHash('match-1', '3 – 1', 'EA SPORTS FC 27');
  const hashB = computeOfflineIntegrityHash('match-1', '3 – 1', 'EA SPORTS FC 27');
  const hashC = computeOfflineIntegrityHash('match-1', '3 – 2', 'EA SPORTS FC 27');

  assert.equal(hashA, hashB);
  assert.notEqual(hashA, hashC);
  assert.match(hashA, /^sha256:[0-9a-f]{4}\.\.\.[0-9a-f]{4}$/);
});

test('switchCrossGameHandle updates active game profile cleanly', () => {
  const next = switchCrossGameHandle(structuredClone(INITIAL_OFFLINE_PROFILE_STATE), 'cs2');
  assert.equal(next.activeGameKey, 'cs2');
  assert.equal(next.profiles[next.activeGameKey].handle, 'kian_mirage');
});

test('verifyMatchScoreboard transitions Local Queue match to Verified and increments counts', () => {
  const base = structuredClone(INITIAL_OFFLINE_PROFILE_STATE);
  const initialVerified = base.scoreboardAgent.verifiedCount;
  const initialQueued = base.scoreboardAgent.queuedCount;

  const updated = verifyMatchScoreboard(base);
  assert.equal(updated.scoreboardAgent.verifiedCount, initialVerified + 1);
  assert.equal(updated.scoreboardAgent.queuedCount, initialQueued - 1);
  assert.match(updated.scoreboardAgent.latestHash, /^sha256:/);

  const verifiedAll = verifyMatchScoreboard(updated);
  assert.equal(verifiedAll.scoreboardAgent.queuedCount, 0);
  assert.equal(verifiedAll.scoreboardAgent.status, 'Verified');
});

test('resolveDisputeCase approves or reopens dispute and updates linked match status', () => {
  const base = structuredClone(INITIAL_OFFLINE_PROFILE_STATE);
  const approved = resolveDisputeCase(base, 'case-104', 'approve');
  const approvedCase = approved.disputeAgent.cases.find((c) => c.id === 'case-104');
  const linkedMatch = approved.matches.find((m) => m.id === 'match-fc27-902');

  assert.equal(approvedCase?.status, 'Resolved · Verified');
  assert.equal(linkedMatch?.status, 'Verified');
  assert.equal(approved.disputeAgent.status, 'Verified');

  const reopened = resolveDisputeCase(approved, 'case-104', 'reopen');
  assert.equal(
    reopened.disputeAgent.cases.find((c) => c.id === 'case-104')?.status,
    'Open Review'
  );
  assert.equal(reopened.matches.find((m) => m.id === 'match-fc27-902')?.status, 'Disputed');
  assert.equal(reopened.disputeAgent.status, 'Local Queue');
});

test('recordRapidDrillAttempt clamps reaction under 10s and updates average reaction time', () => {
  const base = structuredClone(INITIAL_OFFLINE_PROFILE_STATE);
  const next = recordRapidDrillAttempt(base, {
    discipline: 'Chess 10s Tactics',
    promptTitle: 'Royal Fork Verification',
    reactionSec: 2.4,
    isCorrect: true,
  });

  assert.equal(next.rapidDrillsAgent.records[0].reactionSec, 2.4);
  assert.equal(next.rapidDrillsAgent.records[0].accuracyPct, 100);
  assert.ok(next.rapidDrillsAgent.avgReactionSec < base.rapidDrillsAgent.avgReactionSec);
});

test('generateClipHighlight creates a new clip and links it to target match', () => {
  const base = structuredClone(INITIAL_OFFLINE_PROFILE_STATE);
  const initialCount = base.highlightAgent.clips.length;
  const next = generateClipHighlight(base, 'match-chess-889');

  assert.equal(next.highlightAgent.clips.length, initialCount + 1);
  assert.equal(next.highlightAgent.clips[0].matchId, 'match-chess-889');
  assert.equal(
    next.matches.find((m) => m.id === 'match-chess-889')?.highlightClipId,
    next.highlightAgent.clips[0].id
  );
});

test('toggleCoachingMicroAdjustment flips applied state for coaching takeaway', () => {
  const base = structuredClone(INITIAL_OFFLINE_PROFILE_STATE);
  const target = base.coachingAgent.takeaways[0];
  const toggled = toggleCoachingMicroAdjustment(base, target.id);

  assert.equal(toggled.coachingAgent.takeaways[0].applied, !target.applied);
});
