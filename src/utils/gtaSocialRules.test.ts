import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_GTA_SOCIAL_STATE,
  addPostComment,
  appendSocialChatMessage,
  backRivalryFaction,
  buildAutoCrewReply,
  calculateLivePredictionPayout,
  computeFactionHypePercentages,
  createGtaClub,
  createGtaHighlightClip,
  createGtaSquadLobby,
  createScrimChallenge,
  createSocialPost,
  filterAndSortPlayersForSearch,
  joinOrLeaveGtaSquad,
  postClubAnnouncement,
  postFanClubMessage,
  registerForWeeklyTournament,
  shareSocialPost,
  submitLiveArenaPrediction,
  toggleClipFireReaction,
  toggleClubMembership,
  toggleCommentLike,
  toggleGamerFriendship,
  togglePostReaction,
} from './gtaSocialRules';

test('toggleGamerFriendship connects a gamer and increments street rep', () => {
  const initial = structuredClone(INITIAL_GTA_SOCIAL_STATE);
  const target = initial.gamers.find((g) => !g.isFriend)!;
  const next = toggleGamerFriendship(initial, target.id);
  const updated = next.gamers.find((g) => g.id === target.id)!;
  assert.equal(updated.isFriend, true);
  assert.equal(next.userStreetRep, initial.userStreetRep + 60);
});

test('appendSocialChatMessage and buildAutoCrewReply add messages to active channel', () => {
  const initial = structuredClone(INITIAL_GTA_SOCIAL_STATE);
  const withSelf = appendSocialChatMessage(initial, {
    channelId: 'global-vice',
    text: 'سلام بچه‌ها کسی پایه اسکواد FC27 هست؟',
  });
  assert.equal(withSelf.messages.length, initial.messages.length + 1);
  assert.equal(withSelf.messages.at(-1)?.isSelf, true);

  const autoReply = buildAutoCrewReply(withSelf, 'پایه اسکواد FC27', 'global-vice');
  assert.equal(autoReply.isSelf, false);
  assert.ok(autoReply.text.length > 10);
});

test('joinOrLeaveGtaSquad and createGtaSquadLobby update squad members and roster', () => {
  const initial = structuredClone(INITIAL_GTA_SOCIAL_STATE);
  const joined = joinOrLeaveGtaSquad(initial, 'sq-1');
  const sq1 = joined.squads.find((s) => s.id === 'sq-1')!;
  assert.ok(sq1.members.includes(initial.userHandle));

  const created = createGtaSquadLobby(joined, {
    titleFa: 'هایست شبانه وایس‌سیتی',
    gameTitle: 'GTA',
    realm: 'story',
    neededRoleFa: 'Sniper & Driver',
    requiredRank: 'Kingpin 300+',
  });
  assert.equal(created.squads.length, initial.squads.length + 1);
  assert.equal(created.squads[0].hostHandle, initial.userHandle);
  assert.equal(created.squads[0].requiredRank, 'Kingpin 300+');
});

test('createGtaHighlightClip and toggleClipFireReaction post and react to clips', () => {
  const initial = structuredClone(INITIAL_GTA_SOCIAL_STATE);
  const beforeCount = initial.highlightClips?.length ?? 0;

  const afterCreate = createGtaHighlightClip(initial, {
    gameTag: 'CS2 Premier',
    captionFa: 'ایس ۵ نفره با AWP در Mid Window میراژ! 🔥',
  });
  assert.equal(afterCreate.highlightClips?.length, beforeCount + 1);
  const createdClip = afterCreate.highlightClips![0];
  assert.equal(createdClip.gameTag, 'CS2 Premier');

  const existingClipId = 'clip-1';
  const beforeLikes = afterCreate.highlightClips!.find((c) => c.id === existingClipId)!.likesCount;
  const afterReact = toggleClipFireReaction(afterCreate, existingClipId);
  const updatedClip = afterReact.highlightClips!.find((c) => c.id === existingClipId)!;
  assert.equal(updatedClip.likedByMe, true);
  assert.equal(updatedClip.likesCount, beforeLikes + 1);
});

test('registerForWeeklyTournament and createScrimChallenge update esports competition state', () => {
  const initial = structuredClone(INITIAL_GTA_SOCIAL_STATE);
  const tourId = initial.tournaments![0].id;
  const beforeTeams = initial.tournaments![0].teamsRegistered;

  const afterReg = registerForWeeklyTournament(initial, tourId);
  const updatedTour = afterReg.tournaments!.find((t) => t.id === tourId)!;
  assert.equal(updatedTour.isRegistered, true);
  assert.equal(updatedTour.teamsRegistered, beforeTeams + 1);

  const afterChal = createScrimChallenge(afterReg, {
    mode: '5v5',
    gameTitle: 'EA SPORTS FC 27',
    targetClanOrHandle: 'LOS SANTOS TITANS [LST]',
    stakeRep: 1500,
    noteFa: 'فینال کلاب‌ها سر ۱۵۰۰ امتیاز REP!',
  });
  assert.equal(afterChal.challenges![0].targetClanOrHandle, 'LOS SANTOS TITANS [LST]');
  assert.equal(afterChal.challenges![0].stakeRep, 1500);
});

test('backRivalryFaction boosts hype points, adds chant, and recalculates percentages', () => {
  const initial = structuredClone(INITIAL_GTA_SOCIAL_STATE);
  const beforeHype = initial.rivalries[0].factionA.hypePoints;
  const updated = backRivalryFaction(
    initial,
    'riv-1',
    'fac-vice',
    'وایس‌سیتی امشب قهرمانه!'
  );
  assert.ok(updated.rivalries[0].factionA.hypePoints > beforeHype);
  assert.equal(updated.rivalries[0].recentChants[0].text, 'وایس‌سیتی امشب قهرمانه!');

  const pcts = computeFactionHypePercentages(updated.rivalries[0]);
  assert.equal(pcts.pctA + pcts.pctB, 100);
});

test('calculateLivePredictionPayout and submitLiveArenaPrediction deduct stake and update pool', () => {
  assert.equal(calculateLivePredictionPayout(500, 1.75), 875);
  assert.equal(calculateLivePredictionPayout(1000, 2.2), 2200);

  const initial = structuredClone(INITIAL_GTA_SOCIAL_STATE);
  const beforeRep = initial.userStreetRep;
  const beforePool = initial.liveArena!.totalPoolRep;

  const afterPred = submitLiveArenaPrediction(initial, {
    market: 'match_winner',
    contenderId: 'nima',
    stakeRep: 500,
  });

  assert.equal(afterPred.userStreetRep, beforeRep - 500);
  assert.equal(afterPred.liveArena!.totalPoolRep, beforePool + 500);
  assert.equal(afterPred.liveArena!.recentPredictions[0].potentialPayoutRep, 875);
});

test('postFanClubMessage and filterAndSortPlayersForSearch support fan club and user search modules', () => {
  const initial = structuredClone(INITIAL_GTA_SOCIAL_STATE);
  const afterPost = postFanClubMessage(initial, 'g-2', 'نیما امشب MVP فیناله!');
  const nima = afterPost.gamers.find((g) => g.id === 'g-2')!;
  assert.equal(nima.fanClubPosts![0].text, 'نیما امشب MVP فیناله!');

  const sasMatches = filterAndSortPlayersForSearch(initial.gamers, 'SAS', 'all');
  assert.equal(sasMatches.length, 1);
  assert.equal(sasMatches[0].handle, 'nima_headshot');

  const topRepSorted = filterAndSortPlayersForSearch(initial.gamers, '', 'top_rep');
  assert.ok(topRepSorted[0].repScore >= topRepSorted[1].repScore);
});

test('togglePostReaction enforces mutual exclusion between like and dislike and supports toggling off', () => {
  const initial = structuredClone(INITIAL_GTA_SOCIAL_STATE);
  const post0 = initial.posts![0];
  const baseLikes = post0.likesCount;
  const baseDislikes = post0.dislikesCount;

  const liked = togglePostReaction(initial, post0.id, 'like');
  assert.equal(liked.posts![0].userReaction, 'like');
  assert.equal(liked.posts![0].likesCount, baseLikes + 1);
  assert.equal(liked.posts![0].dislikesCount, baseDislikes);

  // Switching directly to dislike removes the like and increments dislike
  const disliked = togglePostReaction(liked, post0.id, 'dislike');
  assert.equal(disliked.posts![0].userReaction, 'dislike');
  assert.equal(disliked.posts![0].likesCount, baseLikes);
  assert.equal(disliked.posts![0].dislikesCount, baseDislikes + 1);

  // Clicking dislike again clears the reaction
  const cleared = togglePostReaction(disliked, post0.id, 'dislike');
  assert.equal(cleared.posts![0].userReaction, null);
  assert.equal(cleared.posts![0].dislikesCount, baseDislikes);
});

test('addPostComment, toggleCommentLike, shareSocialPost, and createSocialPost update feed & chat', () => {
  const initial = structuredClone(INITIAL_GTA_SOCIAL_STATE);
  const post0 = initial.posts![0];

  const withComment = addPostComment(initial, post0.id, 'عجب دریفت خفنی توی اوشن درایو!');
  assert.equal(withComment.posts![0].comments.length, post0.comments.length + 1);
  const addedCm = withComment.posts![0].comments.at(-1)!;
  assert.equal(addedCm.text, 'عجب دریفت خفنی توی اوشن درایو!');

  const withCmLike = toggleCommentLike(withComment, post0.id, addedCm.id);
  assert.equal(withCmLike.posts![0].comments.at(-1)!.likedByMe, true);
  assert.equal(withCmLike.posts![0].comments.at(-1)!.likesCount, 1);

  const shared = shareSocialPost(withCmLike, post0.id, 'global-vice');
  assert.equal(shared.posts![0].sharesCount, post0.sharesCount + 1);
  assert.equal(shared.posts![0].sharedByMe, true);
  assert.equal(shared.messages.length, initial.messages.length + 1);

  const created = createSocialPost(shared, {
    captionFa: 'غروب وایس‌سیتی روی بلوار ساحلی آماده هایست امشب!',
    districtFa: 'ساحل وایس بیچ',
  });
  assert.equal(created.posts!.length, initial.posts!.length + 1);
  assert.equal(created.posts![0].authorHandle, initial.userHandle);
});

test('toggleClubMembership, createGtaClub, and postClubAnnouncement manage Vice City crews', () => {
  const initial = structuredClone(INITIAL_GTA_SOCIAL_STATE);
  const clubOdc = initial.clubs!.find((c) => c.id === 'club-odc')!;
  assert.equal(clubOdc.isJoined, false);

  const joined = toggleClubMembership(initial, clubOdc.id);
  const updatedOdc = joined.clubs!.find((c) => c.id === 'club-odc')!;
  assert.equal(updatedOdc.isJoined, true);
  assert.equal(updatedOdc.membersCount, clubOdc.membersCount + 1);
  assert.equal(joined.userCrewTag, 'ODC');

  const created = createGtaClub(joined, {
    name: 'Miami Midnight Riders',
    tag: 'mmr',
    districtFa: 'اوشن درایو',
    mottoFa: 'فقط سرعت و وفاداری',
  });
  assert.equal(created.clubs!.length, initial.clubs!.length + 1);
  assert.equal(created.clubs![0].tag, 'MMR');
  assert.equal(created.userCrewTag, 'MMR');

  const announced = postClubAnnouncement(created, created.clubs![0].id, 'قرار امشب ساعت ۲۳!');
  assert.equal(announced.clubs![0].announcements[0].text, 'قرار امشب ساعت ۲۳!');
});

