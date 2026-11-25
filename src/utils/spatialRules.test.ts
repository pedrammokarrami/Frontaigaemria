import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialSpatialState } from '../data/realmsData';
import {
  castCourtVerdict,
  detectMediaSourceType,
  extractYouTubeId,
  parseMediaInput,
  placePredictionStake,
  registerDeathmatchInvite,
} from './spatialRules';

test('extractYouTubeId parses standard watch, youtu.be, shorts, and embed URLs', () => {
  assert.equal(extractYouTubeId('https://www.youtube.com/watch?v=M7lc1UVf-VE&t=12s'), 'M7lc1UVf-VE');
  assert.equal(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(extractYouTubeId('https://www.youtube.com/shorts/aqz-KE-bpKQ'), 'aqz-KE-bpKQ');
  assert.equal(extractYouTubeId('https://www.youtube.com/embed/ScMzIvxBSi4'), 'ScMzIvxBSi4');
  assert.equal(extractYouTubeId('https://reddit.com/r/GlobalOffensive'), null);
});

test('parseMediaInput maps YouTube, Reddit, upload, and question inputs to active realm coach', () => {
  const yt = parseMediaInput({
    rawInput: 'https://youtu.be/M7lc1UVf-VE',
    realm: 'sports',
  });
  assert.equal(yt.sourceType, 'youtube');
  assert.equal(yt.youtubeId, 'M7lc1UVf-VE');
  assert.equal(yt.realm, 'sports');
  assert.ok(yt.timestamps.length >= 2);

  const reddit = parseMediaInput({
    rawInput: 'https://www.reddit.com/r/DotA2/comments/smoke-timing',
    realm: 'strategy',
  });
  assert.equal(reddit.sourceType, 'reddit');
  assert.equal(detectMediaSourceType('https://clips.twitch.tv/Abc123'), 'twitch');

  const upload = parseMediaInput({
    rawInput: '',
    realm: 'story',
    uploadedPreviewUrl: 'data:image/png;base64,AAAA',
    uploadedKind: 'image',
    uploadedFileName: 'sunset.png',
  });
  assert.equal(upload.sourceType, 'upload');
  assert.equal(upload.uploadedKind, 'image');
});

test('placePredictionStake deducts PTS, rejects overspending, and computes payout', () => {
  const initial = createInitialSpatialState();
  const valid = placePredictionStake(initial, 'pred-shooter-1', 'A', 250);
  assert.equal(valid.error, undefined);
  assert.equal(valid.nextState.platformPoints, initial.platformPoints - 250);
  assert.equal(valid.nextState.stakes.length, 1);
  assert.equal(valid.stake?.potentialPayout, Math.round(250 * 1.75));

  const tooMuch = placePredictionStake(initial, 'pred-shooter-1', 'B', 999999);
  assert.ok(tooMuch.error);
  assert.equal(tooMuch.nextState.platformPoints, initial.platformPoints);
});

test('castCourtVerdict awards XP/PTS once per case and switches vote cleanly', () => {
  const initial = createInitialSpatialState();
  const first = castCourtVerdict(initial, 'court-shooter-1', 'uphold');
  assert.equal(first.awardedNow, true);
  assert.equal(first.nextState.xp, initial.xp + 120);
  assert.equal(first.nextState.platformPoints, initial.platformPoints + 75);

  const switched = castCourtVerdict(first.nextState, 'court-shooter-1', 'acquit');
  assert.equal(switched.awardedNow, false);
  assert.equal(switched.nextState.xp, first.nextState.xp);
  const updatedCase = switched.nextState.courtCases.find((c) => c.id === 'court-shooter-1');
  assert.equal(updatedCase?.userVote, 'acquit');
});

test('registerDeathmatchInvite unlocks tournament upon reaching invite target', () => {
  let state = createInitialSpatialState();
  // starts at 2/5
  state = registerDeathmatchInvite(state).nextState; // 3/5
  state = registerDeathmatchInvite(state).nextState; // 4/5
  assert.equal(state.deathmatchUnlocked, false);
  const finalStep = registerDeathmatchInvite(state); // 5/5
  assert.equal(finalStep.unlockedJustNow, true);
  assert.equal(finalStep.nextState.deathmatchUnlocked, true);
  assert.equal(finalStep.nextState.invitesSent, 5);
});
