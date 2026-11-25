import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CINEMA_PERSONAS,
  CINEMA_ROOMS,
  INITIAL_CINEMA_STREAMS,
  addUndergroundStreamComment,
  authenticateStreamLink,
  matchCinemaPersonas,
  publishUndergroundStream,
  rankTrendingStreams,
  resolveTelegramChannelId,
  scanSpoilerContent,
  toggleUndergroundStreamLike,
} from './cinemaAgents';

test('CINEMA_ROOMS defines all 5 required cinema & TV 3D loop paths', () => {
  const paths = CINEMA_ROOMS.map((r) => r.videoLoopPath);
  assert.deepEqual(paths, [
    '/assets/rooms/cinema/movie.mp4',
    '/assets/rooms/cinema/series.mp4',
    '/assets/rooms/cinema/anime.mp4',
    '/assets/rooms/cinema/documentary.mp4',
    '/assets/rooms/cinema/tv-climax.mp4',
  ]);
});

test('Cinema Persona Profiler has 50+ personas (ages 8..99) and matches anime/noir correctly', () => {
  assert.ok(CINEMA_PERSONAS.length >= 50, `Expected >= 50 personas, got ${CINEMA_PERSONAS.length}`);

  const animeMatch = matchCinemaPersonas({
    age: 19,
    gender: 'male',
    favoriteGenre: 'anime',
    habit: 'binge',
  });
  assert.equal(animeMatch.recommendedRoom.id, 'anime');
  assert.ok(animeMatch.matchPct >= 80);

  const noirMatch = matchCinemaPersonas({
    age: 42,
    gender: 'female',
    favoriteGenre: 'noir',
    habit: 'deep_analysis',
  });
  assert.equal(noirMatch.recommendedRoom.id, 'movie');
});

test('Stream & Link Authenticator validates HLS, MP4, Telegram, WebRTC and blocks XSS/spam', () => {
  const hls = authenticateStreamLink('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  assert.equal(hls.isValid, true);
  assert.equal(hls.format, 'HLS');

  const tg = authenticateStreamLink('@tokyo_rain_anime');
  assert.equal(tg.isValid, true);
  assert.equal(tg.format, 'TELEGRAM');
  assert.equal(tg.sanitizedUrl, 'https://t.me/tokyo_rain_anime');

  const p2p = authenticateStreamLink('webrtc://peer.aipetros.local/live');
  assert.equal(p2p.isValid, true);
  assert.equal(p2p.format, 'P2P_WEBRTC');

  const xss = authenticateStreamLink('javascript:alert(1)');
  assert.equal(xss.isValid, false);
  assert.equal(xss.isSafe, false);

  const spam = authenticateStreamLink('https://bit.ly/free-crypto-win');
  assert.equal(spam.isValid, false);
  assert.equal(spam.livenessStatus, 'rejected_spam');
});

test('Spoiler-Shield scans Persian & English spoiler phrases and separates blurred segments', () => {
  const clean = scanSpoilerContent('فیلم‌برداری نوآر این سکانس فوق‌العاده است.');
  assert.equal(clean.hasSpoiler, false);

  const spoiled = scanSpoilerContent(
    'آهنگ شروعش عالیه. اما مراقب باشید کاراکتر اصلی آخرش می‌میره و قاتل اصلی لو میره.'
  );
  assert.equal(spoiled.hasSpoiler, true);
  assert.ok(spoiled.segments.some((s) => s.isSpoiler));
  assert.ok(spoiled.segments.some((s) => !s.isSpoiler));
});

test('Telegram channel derivation, publishing, likes and Trending ranking work deterministically', () => {
  const tg = resolveTelegramChannelId('@kian_noir');
  assert.equal(tg.cleanHandle, '@kian_noir');
  assert.equal(tg.channelId, 't.me/kian_noir_aipetros_stream');

  const pub = publishUndergroundStream(INITIAL_CINEMA_STREAMS, {
    hub: 'cinema',
    roomId: 'movie',
    titleFa: 'نسخه کلکسیونر نوآر',
    captionFa: 'بدون افت کیفیت',
    streamUrl: 'https://cdn.example.com/noir_4k.mp4',
    authorHandle: '@kian_noir',
    authorTelegramChannel: tg.channelId,
    personaBadge: 'NOIR-ARC',
    personaAccentHex: '#F59E0B',
  });
  assert.equal(pub.ok, true);
  assert.equal(pub.posts.length, INITIAL_CINEMA_STREAMS.length + 1);

  const liked = toggleUndergroundStreamLike(INITIAL_CINEMA_STREAMS, 'cin-stream-1');
  const s1 = liked.find((p) => p.id === 'cin-stream-1')!;
  assert.equal(s1.likedByMe, true);
  assert.equal(s1.likesCount, 143);

  const withComment = addUndergroundStreamComment(liked, 'cin-stream-1', '@tester', 'عالیه!');
  assert.equal(withComment.find((p) => p.id === 'cin-stream-1')!.comments.length, 2);

  const ranked = rankTrendingStreams(INITIAL_CINEMA_STREAMS);
  assert.equal(ranked[0].id, 'cin-stream-2'); // 198 likes highest
});
