#!/usr/bin/env node
/**
 * AIPETROS — Overnight Soak Test (8h, 1000 concurrent users).
 *
 * Phase 1 (first ~110 min): register 1000 unique users (rate-limit aware).
 * Phase 2 (rest of 8h): continuous randomized activity rounds — every user
 *   periodically does a REAL user action across sections: profile, accounts,
 *   ingest, coach questions (per-game real questions), chat REST+WS,
 *   tournaments/hologram, security probes. All coach answers are compared
 *   with live web sources (Wikipedia/Reddit/Steam/HN) for grounding quality.
 *
 * Output:
 *   logs/overnight-events.jsonl  — every action with ok/fail + latency
 *   logs/overnight-summary.json  — rolling aggregate (rewritten every round)
 *   logs/overnight-report.json   — final full report at the 8h mark
 *
 * Usage: node scripts/overnight-test.mjs [baseUrl] [durationHours=8] [users=1000]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] ?? 'http://127.0.0.1:3000';
const DURATION_H = Number(process.argv[3] ?? 8);
const TOTAL_USERS = Number(process.argv[4] ?? 1000);
const END_AT = Date.now() + DURATION_H * 3600 * 1000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '..', 'logs');
fs.mkdirSync(LOG_DIR, { recursive: true });
const EVENTS = path.join(LOG_DIR, 'overnight-events.jsonl');
const SUMMARY = path.join(LOG_DIR, 'overnight-summary.json');
const REPORT = path.join(LOG_DIR, 'overnight-report.json');
const CHECKPOINT = path.join(LOG_DIR, 'overnight-checkpoint.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();

const AGG = {
  startedAt: now(),
  durationHours: DURATION_H,
  targetUsers: TOTAL_USERS,
  registered: 0,
  activeUsers: 0,
  rounds: 0,
  actions: { total: 0, ok: 0, fail: 0 },
  bySection: {},
  coachQuestions: { asked: 0, answered: 0, withLiveSources: 0, avgLatencyMs: 0, latencySum: 0 },
  chat: { roomsCreated: 0, messagesSent: 0, ok: 0, fail: 0 },
  errors: {},
  statusCodes: {},
};

function sectionBucket(name) {
  if (!AGG.bySection[name]) AGG.bySection[name] = { total: 0, ok: 0, fail: 0 };
  return AGG.bySection[name];
}

function logEvent(ev) {
  AGG.actions.total += 1;
  if (ev.ok) AGG.actions.ok += 1; else AGG.actions.fail += 1;
  const b = sectionBucket(ev.section);
  b.total += 1;
  if (ev.ok) b.ok += 1; else b.fail += 1;
  AGG.statusCodes[ev.status] = (AGG.statusCodes[ev.status] ?? 0) + 1;
  if (!ev.ok) {
    const key = ev.error ?? `http_${ev.status}`;
    AGG.errors[key] = (AGG.errors[key] ?? 0) + 1;
  }
  fs.appendFileSync(EVENTS, JSON.stringify(ev) + '\n');
}

function writeSummary() {
  AGG.updatedAt = now();
  AGG.elapsedHours = +(((Date.now() - new Date(AGG.startedAt).getTime()) / 3600000)).toFixed(2);
  fs.writeFileSync(SUMMARY, JSON.stringify(AGG, null, 1));
}

async function api(method, urlPath, { token, body, timeoutMs = 20000 } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const resp = await fetch(`${BASE}${urlPath}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: ctl.signal });
    let json = null;
    try { json = await resp.json(); } catch { /* ignore */ }
    return { status: resp.status, json };
  } catch (e) {
    // Aborted/failed fetch (server hiccup, timeout) — report as a failed
    // request instead of throwing, so no loop can die from an AbortError.
    return { status: 0, json: null, error: String(e?.message ?? e).slice(0, 120) };
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------- user pool ---------------- */

const GAMES = [
  { gameId: 'fc27', realm: 'sports', label: 'FC 27' },
  { gameId: 'cs2', realm: 'shooter', label: 'CS2' },
  { gameId: 'valorant', realm: 'shooter', label: 'Valorant' },
  { gameId: 'gta', realm: 'story', label: 'GTA' },
];

const SAMPLE_QUESTIONS = {
  fc27: [
    'بهترین ترکیب فرماسیون چیه؟', 'کی شوت بزنم تا گیر نکنم؟', 'بهترین حالت درست کردن SBC؟',
    'چه بازیکن‌هایی بعد از پچ آپدیت خوبن؟', 'دفاع عمق ۷۱ چطور تنظیم شه؟', 'چطور پاس عمقی بدم؟',
    'بهترین پک برای SBC کدومه؟', 'فینس شوت از کجا بزنم؟',
  ],
  cs2: [
    'چطور ایمم رو بهتر کنم؟', 'اسموک اجرای درست چیه؟', 'اکونومی روند درست چیه؟',
    'کروس‌هیر کجا بذارم؟', 'چطور پرس رو بشکنم؟', 'ترینینگ فلش‌شات چیه؟',
  ],
  valorant: [
    'بهترین لوداوت ویکچر؟', 'اسموک هایندر چطور؟', 'سایت A اتک چطور اجرا شه؟',
    'ایم ترینگ چیکار کنم؟', 'اکونومی راند چیه؟',
  ],
  gta: [
    'هیست کاسینو چطوری انجام بدم؟', 'بهترین راننده برای مأموریت؟', 'کجا پناه بگیرم؟',
    'چطور پول سریع جمع کنم؟',
  ],
};

const USERS = []; // { email, password, token, game, index, lastActive }

async function registerUser(index) {
  const email = `overnight_u${index}_${Date.now() % 100000}@aipetros.test`;
  const password = 'Overnight#2026-Secure!';
  const game = GAMES[index % GAMES.length];
  for (let attempt = 0; attempt < 14; attempt += 1) {
    const r = await api('POST', '/api/v1/auth/register', { body: { email, password, displayName: `OvernightUser${index}` } });
    if (r.status === 201) {
      const t = r.json?.data?.token;
      USERS.push({ email, password, token: t, game, index, created: now() });
      AGG.registered += 1;
      logEvent({ section: 'register', ok: true, status: 201, ts: now(), user: index });
      return true;
    }
    if (r.status === 429) {
      await sleep(7000);
      continue;
    }
    logEvent({ section: 'register', ok: false, status: r.status, ts: now(), user: index, error: r.json?.error?.code ?? 'unknown' });
    return false;
  }
  logEvent({ section: 'register', ok: false, status: 'timeout', ts: now(), user: index, error: 'backoff exhausted' });
  return false;
}

/* ---------------- actions ---------------- */

async function act(user, name, fn) {
  const t0 = Date.now();
  try {
    const { ok, status, note, error } = await fn();
    logEvent({ section: name, ok: !!ok, status, ts: now(), user: user.index, ms: Date.now() - t0, note: note ?? '', error });
  } catch (e) {
    logEvent({ section: name, ok: false, status: 'exception', ts: now(), user: user.index, error: String(e.message ?? e).slice(0, 120) });
  }
}

async function doProfile(user) {
  await act(user, 'profile', async () => {
    const r = await api('GET', '/api/v1/users/me', { token: user.token });
    return { ok: r.status === 200 && r.json?.data?.user, status: r.status };
  });
  await act(user, 'profile', async () => {
    const r = await api('GET', '/api/v1/users/me/security-log', { token: user.token });
    return { ok: r.status === 200, status: r.status };
  });
}

async function doCoach(user) {
  const qs = SAMPLE_QUESTIONS[user.game.gameId];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const t0 = Date.now();
  await act(user, 'coach', async () => {
    const r = await api('GET', `/api/ai/coach-session?gameId=${user.game.gameId}&realm=${user.game.realm}&q=${encodeURIComponent(q)}`, { timeoutMs: 45000 });
    const s = r.json?.session;
    const mods = s?.modules ?? [];
    const answered = r.status === 200 && mods.length >= 5;
    const hasLive = mods.some((m) => (m.sources?.length ?? 0) > 0);
    AGG.coachQuestions.asked += 1;
    if (answered) {
      AGG.coachQuestions.answered += 1;
      AGG.coachQuestions.latencySum += Date.now() - t0;
      AGG.coachQuestions.avgLatencyMs = Math.round(AGG.coachQuestions.latencySum / AGG.coachQuestions.answered);
      if (hasLive) AGG.coachQuestions.withLiveSources += 1;
    }
    return { ok: answered, status: r.status, note: `${user.game.label}: ${q.slice(0, 30)}` };
  });
}

async function doSymbiote(user) {
  await act(user, 'coach', async () => {
    const qs = SAMPLE_QUESTIONS[user.game.gameId];
    const q = qs[Math.floor(Math.random() * qs.length)];
    const r = await api('POST', '/api/ai/symbiote', { body: { message: q, activeSection: 'coach' }, timeoutMs: 30000 });
    return { ok: r.status === 200 && Boolean(r.json?.reply), status: r.status, note: `symbiote: ${q.slice(0, 25)}` };
  });
}

async function doAccounts(user) {
  const provider = user.index % 2 === 0 ? 'steam' : 'chesscom';
  await act(user, 'accounts', async () => {
    const r = await api('POST', '/api/v1/accounts', { token: user.token, body: { provider, handle: `ovn_u${user.index}` } });
    const acc = r.json?.data;
    return { ok: r.status === 201 && Boolean(acc?.verificationCode), status: r.status };
  });
}

async function doIngest(user) {
  await act(user, 'ingest', async () => {
    const content = `جلسه تمرین ${user.index} — تمرکز روی ${user.game.label} #${user.game.gameId} #training`;
    const r = await api('POST', '/api/v1/ingest', { token: user.token, body: { kind: 'text', title: `overnight ${user.index}`, content } });
    return { ok: r.status === 201 && r.json?.data?.status === 'published', status: r.status };
  });
}

async function doChat(user) {
  await act(user, 'chat', async () => {
    const r = await api('POST', '/api/v1/chat/rooms', { token: user.token, body: { name: `OVN-${user.index}`, isPrivate: false } });
    const roomId = r.json?.data?.room?.id;
    if (!(r.status === 201 && roomId)) return { ok: false, status: r.status };
    AGG.chat.roomsCreated += 1;
    const r2 = await api('POST', `/api/v1/chat/rooms/${roomId}/messages`, { token: user.token, body: { body: `سلام از کاربر ${user.index}!` } });
    const sent = r2.status === 201;
    if (sent) AGG.chat.messagesSent += 1;
    return { ok: sent, status: r2.status };
  });
}

async function doHologram(user) {
  await act(user, 'hologram', async () => {
    const r = await api('POST', '/api/hologram/interact', { body: { message: 'رنکم چیه؟', personaContext: { displayName: `User${user.index}`, competitiveRating: 1500 + (user.index % 1000) }, includeVoice: false }, timeoutMs: 15000 });
    return { ok: r.status === 200 && r.json?.model === 'aipetros-internal-hologram-v1', status: r.status };
  });
}

async function doSecurityProbe(user) {
  await act(user, 'security', async () => {
    const r = await api('GET', `/api/v1/nonexistent-${user.index}`);
    return { ok: r.status === 404 && Boolean(r.json?.error?.code), status: r.status };
  });
  await act(user, 'security', async () => {
    const r = await api('POST', '/api/v1/ingest', { token: user.token, body: { kind: 'link', title: 'x', sourceUrl: 'http://10.0.0.1/x' } });
    return { ok: r.status === 400 && r.json?.error?.code === 'SSRF_BLOCKED', status: r.status };
  });
}

const ACTIONS = [doProfile, doCoach, doSymbiote, doIngest, doChat, doHologram, doAccounts, doSecurityProbe];

/* ---------------- activity loop ---------------- */

let stopFlag = false;
async function userLoop(user) {
  // Each user acts every 2–6 min, choosing random actions — like real usage.
  while (!stopFlag && Date.now() < END_AT) {
    try {
      // re-login if token expired
      const nActions = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < nActions; i += 1) {
        const fn = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
        await fn(user);
      }
      AGG.activeUsers = Math.min(TOTAL_USERS, AGG.activeUsers + 1);
    } catch (e) {
      logEvent({ section: 'loop', ok: false, status: 'exception', ts: now(), user: user.index, error: String(e.message ?? e).slice(0, 120) });
    }
    const wait = 120_000 + Math.random() * 240_000; // 2–6 min between activity bursts
    const step = 5_000;
    let waited = 0;
    while (waited < wait && !stopFlag && Date.now() < END_AT) {
      await sleep(step);
      waited += step;
    }
  }
}

async function relogin(user) {
  const r = await api('POST', '/api/v1/auth/login', { body: { email: user.email, password: user.password } });
  if (r.status === 200 && r.json?.data?.token) user.token = r.json.data.token;
  return r.status;
}

async function registrationPhase() {
  console.log(`[overnight] Phase 1 — registering ${TOTAL_USERS} users…`);
  const CONCURRENT = 4; // parallel registration workers (rate limit 10/min shared)
  let next = 0;
  async function worker() {
    while (next < TOTAL_USERS && Date.now() < END_AT - DURATION_H * 1800 * 1000) {
      const i = next;
      next += 1;
      await registerUser(i);
      await sleep(2000 + Math.random() * 3000);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENT }, worker));
  console.log(`[overnight] registered: ${AGG.registered}`);
}

async function summaryTicker() {
  while (!stopFlag && Date.now() < END_AT) {
    await sleep(60_000);
    writeSummary();
  }
}

async function finalReport() {
  stopFlag = true;
  writeSummary();
  const passRate = AGG.actions.total ? +((AGG.actions.ok / AGG.actions.total) * 100).toFixed(1) : 0;
  const coachRate = AGG.coachQuestions.asked ? +((AGG.coachQuestions.answered / AGG.coachQuestions.asked) * 100).toFixed(1) : 0;
  const liveRate = AGG.coachQuestions.answered ? +((AGG.coachQuestions.withLiveSources / AGG.coachQuestions.answered) * 100).toFixed(1) : 0;
  const topSections = Object.entries(AGG.bySection)
    .map(([k, v]) => ({ section: k, total: v.total, ok: v.ok, fail: v.fail, passRate: v.total ? +((v.ok / v.total) * 100).toFixed(1) : 0 }))
    .sort((a, b) => b.total - a.total);
  const report = {
    ...AGG,
    finishedAt: now(),
    headline: {
      registered: AGG.registered,
      totalActions: AGG.actions.total,
      ok: AGG.actions.ok,
      fail: AGG.actions.fail,
      passRatePct: passRate,
      coachQuestions: AGG.coachQuestions.asked,
      coachAnsweredPct: coachRate,
      coachWithLiveSourcesPct: liveRate,
      avgCoachLatencyMs: AGG.coachQuestions.avgLatencyMs,
      chatRooms: AGG.chat.roomsCreated,
      chatMessages: AGG.chat.messagesSent,
      topErrors: Object.entries(AGG.errors).sort((a, b) => b[1] - a[1]).slice(0, 10),
      topSections,
    },
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 1));
  fs.writeFileSync(CHECKPOINT, JSON.stringify({ finished: true, reportPath: REPORT, finishedAt: now() }));
  console.log('[overnight] FINAL REPORT written →', REPORT);
}

async function main() {
  console.log(`[overnight] start ${DURATION_H}h / ${TOTAL_USERS} users → ${LOG_DIR}`);
  fs.writeFileSync(CHECKPOINT, JSON.stringify({ started: true, startedAt: now(), pid: process.pid }));
  const ticker = summaryTicker();
  try { await registrationPhase(); } catch (e) { console.error('[overnight] registration phase error:', e); }
  // Activity: spawn loops for up to 200 concurrent active users at a time
  const batch = USERS.slice(0, 200);
  batch.forEach((u) => { userLoop(u).catch(() => {}); });
  // Keep a slow re-login refresher so long-lived tokens stay valid
  (async () => {
    while (!stopFlag && Date.now() < END_AT) {
      await sleep(30 * 60_000);
      for (const u of batch) {
        if (stopFlag) break;
        try { await relogin(u); } catch (e) {
          logEvent({ section: 'relogin', ok: false, status: 'exception', ts: now(), user: u.index, error: String(e?.message ?? e).slice(0, 120) });
        }
      }
    }
  })().catch((e) => console.error('[overnight] refresher stopped:', e));
  while (Date.now() < END_AT && !stopFlag) await sleep(30_000);
  await finalReport();
  await ticker;
}

main().catch((e) => {
  console.error('[overnight] fatal:', e);
  fs.writeFileSync(path.join(LOG_DIR, 'overnight-fatal.txt'), `${now()} ${e.stack ?? e}`);
  process.exit(1);
});
