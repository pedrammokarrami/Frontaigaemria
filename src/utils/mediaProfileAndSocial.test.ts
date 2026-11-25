import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ICONIC_AUDIO_CHARACTERS,
  ICONIC_CINEMA_CHARACTERS,
} from '../data/iconicMediaCharacters.ts';
import {
  matchIconicMediaCharacters,
  parseMediaSelfIntro,
} from './iconicMediaMatcher.ts';
import {
  addMediaPostComment,
  appendMediaChatMessage,
  buildInitialMediaSocialState,
  buildMediaAutoReply,
  createMediaSocialClub,
  createMediaSocialPost,
  postMediaClubAnnouncement,
  shareMediaSocialPost,
  toUndergroundStreamPost,
  toggleMediaClubMembership,
  toggleMediaCommentLike,
  toggleMediaFriendship,
  toggleMediaPostReaction,
} from './mediaSocialRules.ts';

test('ICONIC_CINEMA_CHARACTERS and ICONIC_AUDIO_CHARACTERS span ages 8 to 99 across male and female genders', () => {
  for (const [label, roster] of [
    ['cinema', ICONIC_CINEMA_CHARACTERS],
    ['audio', ICONIC_AUDIO_CHARACTERS],
  ] as const) {
    assert.ok(roster.length >= 20, `${label} roster should have at least 20 iconic characters`);
    const ids = new Set(roster.map((c) => c.id));
    assert.equal(ids.size, roster.length, `${label} character IDs must be unique`);

    const males = roster.filter((c) => c.gender === 'male');
    const females = roster.filter((c) => c.gender === 'female');
    assert.ok(males.length >= 9, `${label} needs at least 9 male characters`);
    assert.ok(females.length >= 9, `${label} needs at least 9 female characters`);

    const hasChild = roster.some((c) => c.minAgeFit <= 10);
    const hasElder = roster.some((c) => c.maxAgeFit >= 95);
    assert.ok(hasChild, `${label} must cover childhood starting at age 8..10`);
    assert.ok(hasElder, `${label} must cover elders up to age 95..99`);
  }
});

test('matchIconicMediaCharacters matches male and female icons accurately from ages 8 to 99', () => {
  const cinemaGirl10 = matchIconicMediaCharacters({
    hub: 'cinema',
    gender: 'female',
    age: 10,
    activeRoomId: 'anime',
  });
  assert.equal(cinemaGirl10.topMatch.character.gender, 'female');
  assert.ok(cinemaGirl10.topMatch.character.canonicalAge <= 14);
  assert.ok(cinemaGirl10.topMatch.similarityPct >= 80);

  const cinemaElderMale92 = matchIconicMediaCharacters({
    hub: 'cinema',
    gender: 'male',
    age: 92,
    activeRoomId: 'documentary',
  });
  assert.equal(cinemaElderMale92.topMatch.character.gender, 'male');
  assert.ok(cinemaElderMale92.topMatch.character.canonicalAge >= 75);

  const audioBoy9 = matchIconicMediaCharacters({
    hub: 'audio',
    gender: 'male',
    age: 9,
    activeRoomId: 'ac-library',
  });
  assert.equal(audioBoy9.topMatch.character.gender, 'male');
  assert.ok(audioBoy9.topMatch.character.canonicalAge <= 14);

  const audioFemale85 = matchIconicMediaCharacters({
    hub: 'audio',
    gender: 'female',
    age: 85,
    activeRoomId: 'westworld-cafe',
  });
  assert.equal(audioFemale85.topMatch.character.gender, 'female');
  assert.ok(audioFemale85.topMatch.character.canonicalAge >= 65);
});

test('parseMediaSelfIntro extracts name, age (8..99), gender, and room preference for Cinema & Audio', () => {
  const cinemaParsed = parseMediaSelfIntro(
    'من سارا هستم، ۱۴ سالمه و عاشق انیمه و توکیو بارانی‌ام',
    'cinema'
  );
  assert.equal(cinemaParsed.detectedGender, 'female');
  assert.equal(cinemaParsed.detectedAge, 14);
  assert.equal(cinemaParsed.detectedName, 'سارا');
  assert.equal(cinemaParsed.detectedRoomId, 'anime');

  const audioParsed = parseMediaSelfIntro(
    'مرد ۷۸ ساله اهل کافه وست‌ورلد و کتاب صوتی هستم',
    'audio'
  );
  assert.equal(audioParsed.detectedGender, 'male');
  assert.equal(audioParsed.detectedAge, 78);
  assert.ok(audioParsed.detectedRoomId === 'westworld-cafe' || audioParsed.detectedRoomId === 'ac-library');

  const tmlParsed = parseMediaSelfIntro(
    'من دختر ۲۰ ساله عاشق تومارلند و موزیک الکترونیک‌ام',
    'audio'
  );
  assert.equal(tmlParsed.detectedGender, 'female');
  assert.equal(tmlParsed.detectedAge, 20);
  assert.equal(tmlParsed.detectedRoomId, 'tomorrowland');
});

test('mediaSocialRules supports full feed reactions, comments, shares, spoiler shield, friends, chat, and clubs', () => {
  for (const hub of ['cinema', 'audio'] as const) {
    const initial = buildInitialMediaSocialState(hub);
    assert.ok(initial.posts.length >= 2);
    assert.ok(initial.members.length >= 4);
    assert.ok(initial.clubs.length >= 2);

    const post0 = initial.posts[0];
    const liked = toggleMediaPostReaction(initial, post0.id, 'like');
    assert.equal(liked.posts[0].userReaction, 'like');
    assert.equal(liked.posts[0].likesCount, post0.likesCount + 1);

    const disliked = toggleMediaPostReaction(liked, post0.id, 'dislike');
    assert.equal(disliked.posts[0].userReaction, 'dislike');
    assert.equal(disliked.posts[0].likesCount, post0.likesCount);
    assert.equal(disliked.posts[0].dislikesCount, post0.dislikesCount + 1);

    const commented = addMediaPostComment(disliked, post0.id, 'بهترین کیفیت و هماهنگی!');
    const newComment = commented.posts[0].comments.at(-1)!;
    assert.equal(newComment.text, 'بهترین کیفیت و هماهنگی!');

    const commentLiked = toggleMediaCommentLike(commented, post0.id, newComment.id);
    assert.equal(commentLiked.posts[0].comments.at(-1)!.likedByMe, true);
    assert.equal(commentLiked.posts[0].comments.at(-1)!.likesCount, 1);

    const globalChan = hub === 'cinema' ? 'global-cinema' : 'global-audio';
    const shared = shareMediaSocialPost(commentLiked, post0.id, globalChan);
    assert.equal(shared.posts[0].sharedByMe, true);
    assert.equal(shared.posts[0].sharesCount, post0.sharesCount + 1);
    assert.equal(shared.messages.length, initial.messages.length + 1);

    const createdResult = createMediaSocialPost(shared, {
      captionFa:
        hub === 'cinema'
          ? 'هشدار اسپویل: در پایان فیلم شخصیت اصلی زنده میمونه! https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
          : 'میکس زنده کلاب برلین امشب با بیس سنگین!',
      districtFa: hub === 'cinema' ? 'سالن نوآر کلاسیک' : 'ریو صنعتی برلین',
      gameTag: hub === 'cinema' ? '4K Cinema' : 'Techno Set',
      roomId: hub === 'cinema' ? 'movie' : 'berlin-rave',
      mediaUrl: '/src/assets/images/room_cinema_noir_hall_1795254621048.jpg',
      streamUrl:
        hub === 'cinema' ? 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' : '',
    });
    assert.equal(createdResult.ok, true);
    const created = createdResult.state;
    assert.equal(created.posts.length, initial.posts.length + 1);
    if (hub === 'cinema') {
      assert.equal(created.posts[0].hasSpoiler, true);
      const streamPayload = toUndergroundStreamPost(created.posts[0], hub);
      assert.equal(streamPayload.roomId, 'movie');
      assert.ok(streamPayload.streamUrl.includes('x36xhzz.m3u8'));
    }

    const nonFriend = created.members.find((m) => !m.isFriend)!;
    const friended = toggleMediaFriendship(created, nonFriend.id);
    assert.equal(
      friended.members.find((m) => m.id === nonFriend.id)?.isFriend,
      true
    );

    const chatted = appendMediaChatMessage(friended, {
      channelId: globalChan,
      text: 'سلام بچه‌ها لینک امشب آماده است؟',
    });
    assert.equal(chatted.messages.at(-1)?.isSelf, true);
    const reply = buildMediaAutoReply(chatted, 'لینک امشب آماده است؟', globalChan);
    assert.equal(reply.isSelf, false);
    assert.ok(reply.text.length > 5);

    const unjoinedClub = chatted.clubs.find((c) => !c.isJoined)!;
    const joinedClub = toggleMediaClubMembership(chatted, unjoinedClub.id);
    assert.equal(joinedClub.clubs.find((c) => c.id === unjoinedClub.id)?.isJoined, true);

    const createdClub = createMediaSocialClub(joinedClub, {
      name: hub === 'cinema' ? 'Noir Midnight Syndicate' : 'Berlin Acid Collective',
      tag: hub === 'cinema' ? 'nms' : 'bac',
      districtFa: hub === 'cinema' ? 'سالن نوآر کلاسیک' : 'ریو صنعتی برلین',
      mottoFa: 'کیفیت مطلق و اشتراک‌گذاری بدون وقفه',
    });
    assert.equal(createdClub.clubs.length, initial.clubs.length + 1);
    const announced = postMediaClubAnnouncement(
      createdClub,
      createdClub.clubs[0].id,
      'شروع سانس ویژه امشب ساعت ۲۳!'
    );
    assert.equal(announced.clubs[0].announcements[0].text, 'شروع سانس ویژه امشب ساعت ۲۳!');
  }
});
