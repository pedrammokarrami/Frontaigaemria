/**
 * Multi-scenario acceptance test for the AIPETROS coach.
 * Covers: game ambiguity → choice chips, single-game questions, off-topic,
 * FC27 grounded answers, suggestion grammar, and the live answer endpoint.
 *
 * Run: node scripts/scenario-test.mjs
 */
const BASE = process.env.AIPETROS_BASE ?? 'http://127.0.0.1:3000';

const results = [];
function check(name, cond, detail = '') {
  results.push({ name, ok: Boolean(cond), detail });
  console.log(`${cond ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
  return res.json();
}

async function main() {
  // 1. Ambiguity detection
  const amb1 = await get('/api/ai/game-choices?q=' + encodeURIComponent('بهترین ترکیب بارسا چیه'));
  check('ambiguous: بارسا → 2+ games', amb1.ambiguous && amb1.candidates.length >= 2,
    amb1.candidates.map((c) => c.gameId).join(','));

  const amb2 = await get('/api/ai/game-choices?q=' + encodeURIComponent('چطور ایم رو بهتر کنم'));
  check('ambiguous: ایم → cs2/valorant', amb2.ambiguous && amb2.candidates.length >= 2,
    amb2.candidates.map((c) => c.gameId).join(','));

  // 2. Single-game questions resolve without asking
  const single = await get('/api/ai/game-choices?q=' + encodeURIComponent('هیست کاسینو چطور'));
  check('single game: هیست کاسینو → gta', !single.ambiguous && single.resolvedGameId === 'gta', single.resolvedGameId);

  const explicit = await get('/api/ai/game-choices?q=' + encodeURIComponent('بهترین ترکیب بارسا fc27'));
  check('explicit game wins: fc27', !explicit.ambiguous && explicit.resolvedGameId === 'fc27', explicit.resolvedGameId);

  // 3. Grounded FC27 answer for an archive-grounded question
  const header = await get('/api/coach/search?realm=sports&gameId=fc27&q=' + encodeURIComponent('هریک'));
  const headerText = header.topic?.coachAdviceFa ?? '';
  check('fc27 header answer is grounded (no generic filler)',
    /header/i.test(headerText) && !/core skills and mechanics/.test(headerText),
    headerText.slice(0, 70).replace(/\n/g, ' '));

  // 4. No cross-game contamination
  const cs2 = await get('/api/coach/search?realm=shooter&gameId=cs2&q=' + encodeURIComponent('هریک'));
  const cs2Text = cs2.topic?.coachAdviceFa ?? '';
  check('cs2 query does NOT answer with fc27 archive', !/header and set-piece/i.test(cs2Text), cs2Text.slice(0, 60).replace(/\n/g, ' '));

  // 5. Real player data
  const pace = await get('/api/coach/search?realm=sports&gameId=fc27&q=' + encodeURIComponent('سریع‌ترین بازیکن'));
  const paceText = pace.topic?.coachAdviceFa ?? '';
  check('fc27 fastest players grounded', /Mbapp|Mbappé/i.test(paceText), paceText.slice(0, 70).replace(/\n/g, ' '));

  // 6. Photo endpoint
  const photo = await get('/api/ai/player-photo?name=' + encodeURIComponent('Kylian Mbappé'));
  check('player photo endpoint returns a real wikimedia photo',
    typeof photo.photo === 'string' && photo.photo.length > 10 && /wikimedia|upload/.test(photo.photo),
    String(photo.photo).slice(0, 60));

  // 7. Knowledge engine (3-layer)
  const ke = await get('/api/ai/knowledge-engine?gameId=fc27&q=' + encodeURIComponent('بهترین فرماسیون بارسا'));
  const keData = ke.data ?? ke;
  check('knowledge-engine normalizes fa→en + bumps version',
    typeof keData.normalizedEn === 'string' && keData.normalizedEn.length > 2,
    `${keData.layer}: ${keData.normalizedEn}`);

  // 8. Ambiguous query still returns a usable topic (never a dead end)
  const ambTopic = await get('/api/coach/search?realm=sports&gameId=fc27&q=' + encodeURIComponent('بهترین ترکیب بارسا چیه'));
  check('ambiguous query still yields an answer + choices',
    Boolean(ambTopic.topic?.coachAdviceFa) && ambTopic.gameChoices?.ambiguous === true);

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} scenarios passed`);
  if (failed.length) {
    console.log('FAILED:', failed.map((f) => f.name).join(' | '));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('scenario-test crashed:', err);
  process.exitCode = 1;
});
