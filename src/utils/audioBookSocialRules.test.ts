import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addBookPostComment,
  appendBookChatMessage,
  buildBookAuthorAutoReply,
  buildInitialAudioBookState,
  createBookFeedPost,
  createBookLiteraryClub,
  postBookClubEntry,
  shareBookPostToChannel,
  toAudioStreamPost,
  toggleBookClubMembership,
  toggleBookCommentLike,
  toggleBookFriendConnection,
  toggleBookPostBookmark,
  toggleBookPostReaction,
} from './audioBookSocialRules.ts';

test('buildInitialAudioBookState seeds literary poetry/philosophy pages, authors, letters, and circles', () => {
  const initial = buildInitialAudioBookState();
  assert.ok(initial.posts.length >= 3);
  assert.ok(initial.members.length >= 4);
  assert.ok(initial.clubs.length >= 3);
  assert.ok(initial.posts[0].epigraphPoemFa && initial.posts[0].epigraphPoemFa.length > 5);
  assert.ok(
    initial.messages.some(
      (m) => m.channelId.startsWith('dm-') && m.attachment?.kind === 'audio_stream'
    )
  );
});

test('toggleBookPostReaction, toggleBookPostBookmark, addBookPostComment, and toggleBookCommentLike work cleanly', () => {
  const initial = buildInitialAudioBookState();
  const post0 = initial.posts[0];

  const liked = toggleBookPostReaction(initial, post0.id, 'like');
  assert.equal(liked.posts[0].userReaction, 'like');
  assert.equal(liked.posts[0].likesCount, post0.likesCount + 1);

  const disliked = toggleBookPostReaction(liked, post0.id, 'dislike');
  assert.equal(disliked.posts[0].userReaction, 'dislike');
  assert.equal(disliked.posts[0].likesCount, post0.likesCount);

  const toggledBookmark = toggleBookPostBookmark(disliked, post0.id);
  assert.equal(toggledBookmark.posts[0].bookmarkedByMe, !post0.bookmarkedByMe);

  const withComment = addBookPostComment(toggledBookmark, post0.id, 'این سطر بسیار عمیق بود.');
  const addedCm = withComment.posts[0].comments.at(-1)!;
  assert.equal(addedCm.text, 'این سطر بسیار عمیق بود.');

  const likedCm = toggleBookCommentLike(withComment, post0.id, addedCm.id);
  assert.equal(likedCm.posts[0].comments.at(-1)!.likedByMe, true);
});

test('shareBookPostToChannel forwards audio pages into private letters & chat channels', () => {
  const initial = buildInitialAudioBookState();
  const post0 = initial.posts[0];
  const member = initial.members[1];

  const forwarded = shareBookPostToChannel(initial, post0.id, `dm-${member.id}`);
  assert.equal(forwarded.posts[0].sharesCount, post0.sharesCount + 1);
  const lastMsg = forwarded.messages.at(-1)!;
  assert.equal(lastMsg.channelId, `dm-${member.id}`);
  assert.equal(lastMsg.isPrivateLetter, true);
  assert.equal(lastMsg.attachment?.kind, 'audio_stream');
});

test('createBookFeedPost validates stream URLs and maps to AudioPlayer stream object', () => {
  const initial = buildInitialAudioBookState();
  const unsafe = createBookFeedPost(initial, {
    chapterTitleFa: 'برگه تست',
    captionFa: 'متن تست',
    audioTitleTag: 'تست',
    roomId: 'ac-library',
    mediaUrl: '/src/assets/images/book_sketch_philosophy_moon_1795260960578.jpg',
    streamUrl: 'javascript:alert(1)',
  });
  assert.equal(unsafe.ok, false);

  const valid = createBookFeedPost(initial, {
    chapterTitleFa: 'حکایتِ نی و باران',
    epigraphPoemFa: 'از نیستان تا مرا ببریده‌اند...',
    captionFa: 'این قطعه را هنگام بارش باران شنیدم و این چند سطر را نوشتم.',
    audioTitleTag: 'نی و باران شبانه',
    roomId: 'ac-library',
    mediaUrl: '/src/assets/images/book_sketch_philosophy_moon_1795260960578.jpg',
    streamUrl: 'https://t.me/divan_audiobooks/88',
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.state.posts[0].streamFormat, 'TELEGRAM');

  const playable = toAudioStreamPost({
    id: valid.state.posts[0].id,
    roomId: valid.state.posts[0].roomId,
    titleFa: valid.state.posts[0].audioTitleTag,
    captionFa: valid.state.posts[0].captionFa,
    streamUrl: valid.state.posts[0].streamUrl ?? '',
    streamFormat: valid.state.posts[0].streamFormat,
    authorHandle: valid.state.posts[0].authorHandle,
    authorTag: valid.state.posts[0].authorTag,
  });
  assert.equal(playable.hub, 'audio');
  assert.equal(playable.roomId, 'ac-library');
});

test('appendBookChatMessage sends direct audio & builds philosophical auto-replies', () => {
  const initial = buildInitialAudioBookState();
  const res = appendBookChatMessage(initial, {
    channelId: 'dm-bm-2',
    text: 'خیام جان این قطعهٔ سه‌تار را بشنو.',
    attachment: {
      kind: 'audio_stream',
      titleFa: 'سه‌تار و آرامش شب',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      roomId: 'meditation',
    },
  });
  assert.equal(res.ok, true);
  const reply = buildBookAuthorAutoReply(res.state, 'سه‌تار', 'dm-bm-2', true);
  assert.equal(reply.isSelf, false);
  assert.equal(reply.isPrivateLetter, true);
});

test('toggleBookFriendConnection, toggleBookClubMembership, createBookLiteraryClub, and postBookClubEntry manage literary clubs', () => {
  const initial = buildInitialAudioBookState();
  const nonFriend = initial.members.find((m) => !m.isFriend)!;
  const friended = toggleBookFriendConnection(initial, nonFriend.id);
  assert.equal(friended.members.find((m) => m.id === nonFriend.id)?.isFriend, true);

  const unjoined = friended.clubs.find((c) => !c.isJoined)!;
  const joined = toggleBookClubMembership(friended, unjoined.id);
  assert.equal(joined.clubs.find((c) => c.id === unjoined.id)?.isJoined, true);

  const created = createBookLiteraryClub(joined, {
    name: 'انجمنِ حافظ‌خوانی و سه‌تار',
    tag: 'حافظ',
  });
  assert.equal(created.clubs[0].tag, 'حافظ');

  const posted = postBookClubEntry(created, created.clubs[0].id, {
    text: 'غزل امشب با صدای آرام آماده است.',
    audioTitleFa: 'غزلِ شبانگاهی',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    roomId: 'ac-library',
  });
  assert.equal(posted.ok, true);
  assert.equal(posted.state.clubs[0].entries[0].streamFormat, 'HLS');
});
