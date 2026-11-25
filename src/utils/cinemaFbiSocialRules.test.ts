import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addFbiPostComment,
  appendFbiChatMessage,
  buildFbiAgentAutoReply,
  buildInitialCinemaFbiState,
  createFbiDivisionClub,
  createFbiFeedPost,
  postFbiClubDispatch,
  shareFbiPostToChannel,
  toCinemaStreamPost,
  toggleFbiAgentConnection,
  toggleFbiClubMembership,
  toggleFbiCommentLike,
  toggleFbiPostBookmark,
  toggleFbiPostReaction,
} from './cinemaFbiSocialRules.ts';

test('buildInitialCinemaFbiState seeds FBI dossiers, operatives, secure DM/club threads, and intelligence clubs', () => {
  const initial = buildInitialCinemaFbiState();
  assert.ok(initial.posts.length >= 3);
  assert.ok(initial.agents.length >= 4);
  assert.ok(initial.clubs.length >= 3);
  assert.ok(initial.posts[0].caseCode.startsWith('STREAM-'));
  assert.equal(initial.posts[0].hasSpoiler, true);
  assert.ok(initial.messages.some((m) => m.channelId.startsWith('dm-') && m.attachment?.kind === 'film_stream'));
});

test('toggleFbiPostReaction, toggleFbiPostBookmark, addFbiPostComment, and toggleFbiCommentLike update dossiers cleanly', () => {
  const initial = buildInitialCinemaFbiState();
  const post0 = initial.posts[0];

  const liked = toggleFbiPostReaction(initial, post0.id, 'like');
  assert.equal(liked.posts[0].userReaction, 'like');
  assert.equal(liked.posts[0].likesCount, post0.likesCount + 1);

  const disliked = toggleFbiPostReaction(liked, post0.id, 'dislike');
  assert.equal(disliked.posts[0].userReaction, 'dislike');
  assert.equal(disliked.posts[0].likesCount, post0.likesCount);
  assert.equal(disliked.posts[0].dislikesCount, post0.dislikesCount + 1);

  const toggledBookmark = toggleFbiPostBookmark(disliked, post0.id);
  assert.equal(toggledBookmark.posts[0].bookmarkedByMe, !post0.bookmarkedByMe);

  const withComment = addFbiPostComment(toggledBookmark, post0.id, 'فریم ۴۴ کادربندی عالی دارد.');
  const addedCm = withComment.posts[0].comments.at(-1)!;
  assert.equal(addedCm.text, 'فریم ۴۴ کادربندی عالی دارد.');

  const likedCm = toggleFbiCommentLike(withComment, post0.id, addedCm.id);
  assert.equal(likedCm.posts[0].comments.at(-1)!.likedByMe, true);
  assert.equal(likedCm.posts[0].comments.at(-1)!.likesCount, 1);
});

test('shareFbiPostToChannel forwards playable film dossiers directly into Private DM and Bureau channels', () => {
  const initial = buildInitialCinemaFbiState();
  const post0 = initial.posts[0];
  const agent = initial.agents[1];

  const forwardedDm = shareFbiPostToChannel(initial, post0.id, `dm-${agent.id}`);
  assert.equal(forwardedDm.posts[0].sharesCount, post0.sharesCount + 1);
  assert.equal(forwardedDm.posts[0].sharedByMe, true);

  const lastMsg = forwardedDm.messages.at(-1)!;
  assert.equal(lastMsg.channelId, `dm-${agent.id}`);
  assert.equal(lastMsg.isConfidential, true);
  assert.equal(lastMsg.attachment?.kind, 'film_stream');
  assert.ok(lastMsg.attachment?.streamUrl?.includes('x36xhzz.m3u8'));
});

test('createFbiFeedPost validates stream links, preserves video uploads, and flags spoilers', () => {
  const initial = buildInitialCinemaFbiState();

  const unsafe = createFbiFeedPost(initial, {
    captionFa: 'تست لینک ناامن',
    filmTitleTag: 'Test',
    divisionFa: 'BAU',
    roomId: 'movie',
    mediaUrl: '/src/assets/images/fbi_noir_evidence_1795259259091.jpg',
    streamUrl: 'javascript:alert(1)',
  });
  assert.equal(unsafe.ok, false);

  const valid = createFbiFeedPost(initial, {
    captionFa: 'پرونده جدید با هشدار اسپویل: قاتل اصلی توی سکانس فینال مشخص میشه!',
    filmTitleTag: '4K Noir Master',
    divisionFa: 'سالن نوآر',
    roomId: 'movie',
    mediaUrl: '/src/assets/images/fbi_noir_evidence_1795259259091.jpg',
    streamUrl: 'https://t.me/fbi_noir_vault/99',
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.state.posts[0].hasSpoiler, true);
  assert.equal(valid.state.posts[0].streamFormat, 'TELEGRAM');

  const playable = toCinemaStreamPost({
    id: valid.state.posts[0].id,
    roomId: valid.state.posts[0].roomId,
    titleFa: valid.state.posts[0].filmTitleTag,
    captionFa: valid.state.posts[0].captionFa,
    streamUrl: valid.state.posts[0].streamUrl ?? '',
    streamFormat: valid.state.posts[0].streamFormat,
    authorHandle: valid.state.posts[0].authorHandle,
    authorTag: valid.state.posts[0].authorTag,
  });
  assert.equal(playable.roomId, 'movie');
  assert.equal(playable.streamFormat, 'TELEGRAM');
});

test('appendFbiChatMessage sends direct film links inside Private DMs and generates contextual replies', () => {
  const initial = buildInitialCinemaFbiState();
  const dmRes = appendFbiChatMessage(initial, {
    channelId: 'dm-ag-3',
    text: 'این نسخه انیمه رو مستقیم فرستادم برات.',
    isConfidential: true,
    attachment: {
      kind: 'film_stream',
      titleFa: 'Akira 4K Remaster',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      roomId: 'anime',
    },
  });
  assert.equal(dmRes.ok, true);
  const sent = dmRes.state.messages.at(-1)!;
  assert.equal(sent.attachment?.format, 'HLS');
  assert.equal(sent.isConfidential, true);

  const reply = buildFbiAgentAutoReply(dmRes.state, sent.text, 'dm-ag-3', true);
  assert.equal(reply.isSelf, false);
  assert.equal(reply.isConfidential, true);
  assert.ok(reply.text.includes('سالن'));
});

test('toggleFbiAgentConnection, toggleFbiClubMembership, createFbiDivisionClub, and postFbiClubDispatch manage clubs & films', () => {
  const initial = buildInitialCinemaFbiState();
  const targetAgent = initial.agents.find((a) => !a.isFriend)!;
  const connected = toggleFbiAgentConnection(initial, targetAgent.id);
  assert.equal(connected.agents.find((a) => a.id === targetAgent.id)?.isFriend, true);

  const unjoinedClub = connected.clubs.find((c) => !c.isJoined)!;
  const joined = toggleFbiClubMembership(connected, unjoinedClub.id);
  assert.equal(joined.clubs.find((c) => c.id === unjoinedClub.id)?.isJoined, true);

  const createdClub = createFbiDivisionClub(joined, {
    name: 'Shadow Archive Unit',
    tag: 'sau',
    divisionFa: 'بخش فیلم‌های مستند محرمانه',
  });
  assert.equal(createdClub.clubs[0].tag, 'SAU');

  const dispatched = postFbiClubDispatch(createdClub, createdClub.clubs[0].id, {
    text: 'پخش نسخه ویژه امشب داخل کلاب SAU',
    filmTitleFa: 'Shadow Briefing 4K',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    roomId: 'documentary',
  });
  assert.equal(dispatched.ok, true);
  assert.equal(dispatched.state.clubs[0].dispatches[0].streamFormat, 'HLS');
  assert.equal(
    dispatched.state.messages.at(-1)?.channelId,
    `club-${createdClub.clubs[0].id}`
  );
});
