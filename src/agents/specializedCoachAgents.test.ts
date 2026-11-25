import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildScrubberChaptersForClip,
  runProClipAnalyzerAgent,
} from './proClipAnalyzerAgent';
import {
  getInstantMotionCoachPayload,
  resolveMotionArchetype,
  runMotionCoachAgent,
} from './motionCoachAgent';
import { clearClipAgentCache, type RealCoachClip } from '../services/realClipAgentService';
import { clearLiveMetaCache } from '../services/liveMetaSyncService';

test('ProClipAnalyzerAgent builds 3 well-spaced scrubber chapter dots (خطا | اصلاح | اجرا)', () => {
  const sampleClip: RealCoachClip = {
    id: 'youtube_pro-abc12345678',
    youtubeId: 'abc12345678',
    title: 'FC 27 Pro Through Ball Timing',
    channelName: 'RedLac',
    viewsLabel: '120K',
    durationLabel: '6:00',
    thumbnailUrl: 'https://i.ytimg.com/vi/abc12345678/hqdefault.jpg',
    sourceKind: 'youtube_pro',
    sourceBadgeFa: 'یوتیوب پرو / اینفلوئنسر',
    keyMoments: [
      { sec: 25, timeLabel: '0:25', labelFa: 'شروع' },
      { sec: 95, timeLabel: '1:35', labelFa: 'اصلاح' },
      { sec: 180, timeLabel: '3:00', labelFa: 'اجرا' },
    ],
    problemFoundFa: 'تاخیر در پاس',
    solutionFixFa: 'پاس در پنجره ۰.۲۵s',
    coachCommentaryFa: 'توضیح مربی',
    voiceScriptEn: 'Trigger L1 run.',
    triggerBadge: 'L1',
    executionBadge: 'L1 + R1 + △',
    timingWindowLabelFa: '۰.۲۵s',
  };

  const { durationSec, chapters } = buildScrubberChaptersForClip(sampleClip);
  assert.equal(durationSec, 360);
  assert.equal(chapters.length, 3);
  assert.deepEqual(
    chapters.map((c) => c.shortLabelFa),
    ['خطا', 'اصلاح', 'اجرا']
  );
  assert.ok(chapters[0].progressPct < chapters[1].progressPct);
  assert.ok(chapters[1].progressPct < chapters[2].progressPct);
  assert.ok(chapters[0].sec < chapters[1].sec && chapters[1].sec < chapters[2].sec);
});

test('ProClipAnalyzerAgent discovers real clips and attaches synchronized chapters', async () => {
  clearClipAgentCache();
  const mockHtml = `<script>var ytInitialData = {"contents":{"videoRenderer":{"videoId":"CS2PRO99881","title":{"runs":[{"text":"CS2 Mirage Counter-Strafe & Peek Mistakes"}]},"ownerText":{"runs":[{"text":"fl0m"}]},"lengthText":{"simpleText":"8:20"},"shortViewCountText":{"simpleText":"240K views"}}}};</script>`;
  const mockFetch = (async () =>
    ({
      ok: true,
      text: async () => mockHtml,
    }) as Response) as typeof fetch;

  const res = await runProClipAnalyzerAgent(
    { gameId: 'cs2', gameName: 'Counter-Strike 2', realm: 'shooter' },
    { force: true, fetcher: mockFetch, nowMs: 1_700_000_000_000 }
  );

  assert.equal(res.agentName, 'ProClipAnalyzerAgent');
  assert.equal(res.gameId, 'cs2');
  assert.ok(res.clips.length >= 1);
  assert.equal(res.clips[0].youtubeId, 'CS2PRO99881');
  assert.equal(res.clips[0].chapters.length, 3);
  assert.equal(res.clips[0].chapters[0].id, 'error');
  assert.equal(res.clips[0].chapters[1].id, 'fix');
  assert.equal(res.clips[0].chapters[2].id, 'execute');
});

test('MotionCoachAgent selects distinct motion archetypes & keybinds per game genre', () => {
  assert.deepEqual(resolveMotionArchetype('fc27', 'sports'), {
    archetype: 'sports_pitch_arc',
    worldTheme: 'sports',
  });
  assert.deepEqual(resolveMotionArchetype('cs2', 'shooter'), {
    archetype: 'shooter_crosshair_peek',
    worldTheme: 'shooter',
  });
  assert.deepEqual(resolveMotionArchetype('gta', 'story'), {
    archetype: 'strategy_flank_vector',
    worldTheme: 'action',
  });
  assert.deepEqual(resolveMotionArchetype('f1-25', 'sports'), {
    archetype: 'racing_apex_line',
    worldTheme: 'action',
  });

  const fcPayload = getInstantMotionCoachPayload({ gameId: 'fc27', realm: 'sports' });
  assert.equal(fcPayload.archetype, 'sports_pitch_arc');
  assert.equal(fcPayload.triggerBadge, 'L1');
  assert.ok(fcPayload.sweetSpotStartPct < fcPayload.sweetSpotEndPct);

  const csPayload = getInstantMotionCoachPayload({ gameId: 'cs2', realm: 'shooter' });
  assert.equal(csPayload.archetype, 'shooter_crosshair_peek');
  assert.equal(csPayload.triggerBadge, 'A / D');
  assert.equal(csPayload.executionBadge, 'Counter-Strafe + Burst');

  const gtaPayload = getInstantMotionCoachPayload({ gameId: 'gta', realm: 'story' });
  assert.equal(gtaPayload.archetype, 'strategy_flank_vector');
  assert.equal(gtaPayload.triggerBadge, 'R1');
});

test('MotionCoachAgent live sync produces structured payload even when network fails', async () => {
  clearLiveMetaCache();
  const offlineFetch = (async () => {
    throw new Error('offline');
  }) as unknown as typeof fetch;

  const payload = await runMotionCoachAgent(
    { gameId: 'valorant', gameName: 'VALORANT', realm: 'shooter' },
    { force: true, fetcher: offlineFetch, nowMs: 1_700_000_000_000 }
  );

  assert.equal(payload.agentName, 'MotionCoachAgent');
  assert.equal(payload.archetype, 'shooter_crosshair_peek');
  assert.equal(payload.worldTheme, 'shooter');
  assert.ok(payload.voiceExplanationEn.length > 10);
  assert.ok(payload.telemetryChips.length === 3);
});
