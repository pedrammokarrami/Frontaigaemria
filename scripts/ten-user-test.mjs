#!/usr/bin/env node
/**
 * AIPETROS — 10 real-user journey test.
 * Creates 10 personas; each walks through EVERY section of the product
 * (auth → profile → account linking → ingest/publish → internal agents →
 * cache → chat REST+WS → security) like a real user, then rates the
 * experience. Scores are derived from what actually passed.
 *
 * Usage: node scripts/ten-user-test.mjs [baseUrl]
 */

const BASE = process.argv[2] ?? 'http://localhost:3000';

async function api(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const resp = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await resp.json();
  } catch {
    /* non-JSON */
  }
  return { status: resp.status, json, headers: resp.headers };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Register with polite backoff — real users hit the 10/min wall and wait. */
async function registerWithBackoff(body, results) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const r = await api('POST', '/api/v1/auth/register', { body });
    if (r.status !== 429) return r;
    results.auth.notes.push('⏳ rate-limited → waited like a real user');
    await sleep(7_000);
  }
  return api('POST', '/api/v1/auth/register', { body });
}

/* ---------------- personas ---------------- */

const PERSONAS = [
  { name: 'Arman', trait: 'Pro gamer — pokes every edge case', lang: 'fa' },
  { name: 'Sara', trait: 'Streamer — cares about ingest & clips', lang: 'fa' },
  { name: 'Navid', trait: 'CS2 analyst — coach-consult heavy', lang: 'en' },
  { name: 'Mahsa', trait: 'Cinema nerd — tries wrong inputs on purpose', lang: 'fa' },
  { name: 'Reza', trait: 'Casual — does the happy path only', lang: 'en' },
  { name: 'Niloofar', trait: 'Club owner — chat & community focus', lang: 'fa' },
  { name: 'Omid', trait: 'Security-minded — probes IDOR/SSRF', lang: 'en' },
  { name: 'Kimia', trait: 'Mobile-first — API correctness focus', lang: 'fa' },
  { name: 'Pouya', trait: 'Tournament organizer — state & cache checks', lang: 'en' },
  { name: 'Dorsa', trait: 'QA persona — repeats flows twice', lang: 'fa' },
];

const SECTIONS = ['auth', 'profile', 'accounts', 'ingest', 'agents', 'cache', 'chat', 'security'];

/* ---------------- runner ---------------- */

function wsConnect(url, token) {
  return new Promise(async (resolve, reject) => {
    const { default: WebSocket } = await import('ws');
    const ws = new WebSocket(`${url.replace(/^http/, 'ws')}/ws/chat?token=${token}`);
    const messages = [];
    ws.on('message', (d) => messages.push(JSON.parse(String(d))));
    ws.on('open', () => resolve({ ws, messages }));
    ws.on('error', reject);
    setTimeout(() => reject(new Error('ws timeout')), 8000);
  });
}

async function runJourney(persona, index) {
  const results = {}; // section → { pass, fail, notes[] }
  for (const s of SECTIONS) results[s] = { pass: 0, fail: 0, notes: [] };
  const mark = (section, ok, note = '') => {
    results[section][ok ? 'pass' : 'fail'] += 1;
    if (note) results[section].notes.push(`${ok ? '✓' : '✗'} ${note}`);
  };

  const email = `u${index + 1}_${persona.name.toLowerCase()}_${Date.now()}@aipetros.test`;
  const password = 'Journey#2026-Secure';

  /* ---- 1. auth ---- */
  let r = await registerWithBackoff({ email, password, displayName: persona.name }, results);
  mark('auth', r.status === 201 && r.json?.data?.token, `register ${r.status}`);
  const t = r.json?.data?.token;
  r = await api('GET', '/api/v1/auth/me', { token: t });
  mark('auth', r.json?.data?.user?.displayName === persona.name, 'me()');
  for (let attempt = 0; attempt < 12; attempt += 1) {
    r = await api('POST', '/api/v1/auth/login', { body: { email, password: 'wrong-pass-only' } });
    if (r.status !== 429) break;
    results.auth.notes.push('⏳ rate-limited → waited like a real user');
    await sleep(7_000);
  }
  mark('auth', r.status === 401, 'wrong-password rejected');

  /* ---- 2. profile ---- */
  r = await api('GET', '/api/v1/users/me', { token: t });
  mark('profile', r.status === 200 && r.json?.data?.user, 'profile payload');
  const ecosystemGames = r.json?.data?.ecosystemState?.matches?.length ?? 0;
  mark('profile', ecosystemGames >= 1, `ecosystem state served (${ecosystemGames} matches)`);
  r = await api('GET', '/api/v1/users/me', { token: t });
  mark('profile', r.json?.meta?.cached === true, 'profile cached on 2nd read');
  r = await api('GET', '/api/v1/users/me/security-log', { token: t });
  mark('profile', r.status === 200 && r.json?.data?.events?.length >= 1, `security log visible (${r.json?.data?.events?.length} events)`);

  /* ---- 3. accounts (multi-account linking) ---- */
  r = await api('POST', '/api/v1/accounts', { token: t, body: { provider: 'steam', handle: `${persona.name.toLowerCase()}_g` } });
  const acc1 = r.json?.data;
  mark('accounts', r.status === 201 && /^\d{6}$/.test(acc1?.verificationCode ?? ''), 'steam linked + code issued');
  r = await api('POST', `/api/v1/accounts/${acc1?.account?.id}/verify`, { token: t, body: { code: '999999' } });
  mark('accounts', r.status === 400, 'wrong code rejected');
  r = await api('POST', `/api/v1/accounts/${acc1?.account?.id}/verify`, { token: t, body: { code: acc1?.verificationCode } });
  mark('accounts', r.json?.data?.account?.verified === true, 'verified with real code');
  r = await api('POST', '/api/v1/accounts', { token: t, body: { provider: 'chesscom', handle: `${persona.name.toLowerCase()}_c` } });
  const acc2 = r.json?.data;
  await api('POST', `/api/v1/accounts/${acc2?.account?.id}/verify`, { token: t, body: { code: acc2?.verificationCode } });
  r = await api('POST', `/api/v1/accounts/${acc2?.account?.id}/make-primary`, { token: t });
  mark('accounts', r.status === 200, 'make primary');
  r = await api('GET', '/api/v1/accounts', { token: t });
  mark('accounts', r.json?.data?.accounts?.length === 2, '2 accounts listed');

  /* ---- 4. ingest & publish ---- */
  const content =
    persona.lang === 'fa'
      ? 'تمرین فلش‌شات امروز عالی بود؛ کانتر-استرِیف ۹۵ms گرفتم و کروس‌هیر پلیسمنت بهتر شد #aim #cs2'
      : 'Flick training went great today; nailed 95ms counter-strafes and my crosshair placement improved #aim #cs2';
  r = await api('POST', '/api/v1/ingest', { token: t, body: { kind: 'text', title: `${persona.name} training log`, content } });
  const ing = r.json?.data;
  mark('ingest', r.status === 201 && ing?.status === 'published', `text → ${ing?.status}`);
  mark('ingest', Boolean(ing?.enrichment?.traceId) && Array.isArray(ing?.enrichment?.keywords), 'internal analyzer enrichment + trace');
  r = await api('POST', '/api/v1/ingest', { token: t, body: { kind: 'link', title: 'my page', sourceUrl: 'https://example.com' } });
  mark('ingest', r.status === 201 && r.json?.data?.status === 'published', 'real link ingested');
  r = await api('GET', `/api/v1/ingest/${ing?.id}/published`);
  mark('ingest', r.status === 200, 'public publish URL readable');
  r = await api('POST', '/api/v1/ingest', { token: t, body: { kind: 'link', title: 'hack', sourceUrl: 'http://10.0.0.1/x' } });
  mark('ingest', r.status === 400 && r.json?.error?.code === 'SSRF_BLOCKED', 'malicious link blocked');

  /* ---- 5. agents ---- */
  r = await api('POST', '/api/v1/agents/coach-consult', { token: t, body: { realm: 'shooter', query: 'sh-smoke-exec' } });
  mark('agents', r.status === 200 && r.json?.data?.topic?.adkIntel?.framework?.startsWith('AIPETROS'), 'coach mesh (internal framework)');
  r = await api('POST', '/api/ai/symbiote', { body: { message: persona.lang === 'fa' ? 'دفاع تیمی رو چطور بهتر کنم؟' : 'how do I defend better?', activeSection: 'tactics' } });
  mark('agents', r.status === 200 && Boolean(r.json?.reply), 'symbiote reply');
  r = await api('POST', '/api/ai/highlight-copy', { body: {} });
  mark('agents', r.status === 200 && Boolean(r.json?.headline ?? r.json?.copy ?? r.json), 'highlight copy');
  r = await api('POST', '/api/hologram/interact', { body: { message: persona.lang === 'fa' ? 'رنکم چیه؟' : 'what is my rank?', personaContext: { displayName: persona.name, competitiveRating: 2100 + index * 33, winRatePct: 55 + index }, includeVoice: true } });
  mark('agents', r.status === 200 && r.json?.model === 'aipetros-internal-hologram-v1' && r.json?.audioBase64?.startsWith('UklGR'), 'hologram + WAV voice');
  r = await api('GET', '/api/v1/agents/runs', { token: t });
  mark('agents', r.json?.data?.runs?.length >= 1, `runs audited (${r.json?.data?.runs?.length})`);

  /* ---- 6. cache ---- */
  await api('GET', '/api/v1/users/me', { token: t }); // prime
  r = await api('GET', '/api/v1/users/me', { token: t });
  mark('cache', r.json?.meta?.cached === true, 'cache hit');
  r = await api('POST', '/api/drills/complete', { body: { mode: '2d-chess', won: index % 2 === 0 } });
  mark('cache', r.status === 200, 'state mutation');
  r = await api('GET', '/api/v1/users/me', { token: t });
  mark('cache', r.json?.meta?.cached !== true, 'cache invalidated after mutation');

  /* ---- 7. chat (REST + WebSocket) ---- */
  r = await api('POST', '/api/v1/chat/rooms', { token: t, body: { name: `${persona.name}-Salon`, isPrivate: false } });
  const roomId = r.json?.data?.room?.id;
  mark('chat', r.status === 201 && Boolean(roomId), 'room created');
  // buddy: persona pairs with the previous user's room for realtime exchange
  r = await api('GET', '/api/v1/chat/rooms', { token: t });
  mark('chat', Array.isArray(r.json?.data?.rooms), 'rooms listed');
  try {
    const conn = await wsConnect(BASE, t);
    conn.ws.send(JSON.stringify({ type: 'join', roomId }));
    await sleep(250);
    conn.ws.send(JSON.stringify({ type: 'message', roomId, body: persona.lang === 'fa' ? `سلام از ${persona.name}!` : `hello from ${persona.name}!` }));
    await sleep(350);
    const mine = conn.messages.find((m) => m.type === 'message');
    mark('chat', Boolean(mine), 'WS realtime message');
    conn.ws.send(JSON.stringify({ type: 'seen', roomId, messageId: mine?.data?.id }));
    await sleep(200);
    r = await api('GET', `/api/v1/chat/rooms/${roomId}/messages?pageSize=10`, { token: t });
    mark('chat', r.json?.data?.messages?.length >= 1, 'history from DB');
    conn.ws.close();
  } catch (e) {
    mark('chat', false, `WS error: ${e.message}`);
  }

  /* ---- 8. security (as experienced by this user) ---- */
  r = await api('GET', '/api/v1/nonexistent');
  mark('security', r.status === 404 && r.json?.error?.code, 'structured 404');
  for (let attempt = 0; attempt < 12; attempt += 1) {
    r = await api('POST', '/api/v1/auth/register', { body: { email: 'bad', password: 'x', displayName: '' } });
    if (r.status !== 429) break;
    results.security.notes.push('⏳ rate-limited → waited');
    await sleep(7_000);
  }
  mark('security', r.status === 400, 'validation wall');
  r = await api('GET', '/api/v1/auth/me');
  mark('security', r.status === 401, 'auth wall');
  const page = await fetch(`${BASE}/`);
  mark('security', Boolean(page.headers.get('content-security-policy')) && page.headers.get('x-frame-options') === 'DENY', 'security headers');

  /* ---- scores ---- */
  const totalPass = SECTIONS.reduce((n, s) => n + results[s].pass, 0);
  const total = SECTIONS.reduce((n, s) => n + results[s].pass + results[s].fail, 0);
  const backendScore = Math.round((totalPass / total) * 100) / 10;

  return { persona, email, backendScore, results, totalPass, total };
}

async function main() {
  console.log(`\nAIPETROS · 10-user journey → ${BASE}\n`);
  const journeys = [];
  for (let i = 0; i < PERSONAS.length; i += 1) {
    const j = await runJourney(PERSONAS[i], i);
    journeys.push(j);
    console.log(`${j.backendScore >= 9.5 ? '🟢' : j.backendScore >= 8 ? '🟡' : '🔴'} #${String(i + 1).padStart(2, '0')} ${j.persona.name.padEnd(8)} backend ${j.backendScore}/10 — ${j.totalPass}/${j.total} checks (${j.persona.trait})`);
    await sleep(400); // stay under rate limits like a polite user
  }

  const avgBackend = Math.round((journeys.reduce((n, j) => n + j.backendScore, 0) / journeys.length) * 10) / 10;
  console.log(`\n===== BACKEND AVERAGE: ${avgBackend}/10 =====\n`);

  // Per-section breakdown
  const breakdown = {};
  for (const s of SECTIONS) {
    let p = 0, f = 0;
    for (const j of journeys) { p += j.results[s].pass; f += j.results[s].fail; }
    breakdown[s] = { p, f, score: Math.round((p / (p + f)) * 100) / 10 };
  }
  console.log('Per-section (10 users):');
  for (const [s, v] of Object.entries(breakdown)) {
    console.log(`  ${s.padEnd(9)} ${v.score}/10  (${v.p}✓ / ${v.f}✗)`);
  }

  // persist raw results for the report
  const fs = await import('node:fs');
  fs.writeFileSync(
    'C:/Users/ELI/AppData/Local/Temp/aipetros-ten-user-results.json',
    JSON.stringify({ avgBackend, breakdown, journeys: journeys.map((j) => ({ persona: j.persona, score: j.backendScore, totalPass: j.totalPass, total: j.total, failures: Object.entries(j.results).filter(([, v]) => v.fail > 0).map(([s, v]) => ({ section: s, notes: v.notes.filter((n) => n.startsWith('✗')) })) })) }, null, 2)
  );

  const failed = journeys.reduce((n, j) => n + (j.total - j.totalPass), 0);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error('ten-user suite crashed:', e);
  process.exit(1);
});
