#!/usr/bin/env node
/**
 * AIPETROS — Framework Scenario Test Harness (LangGraph + Mastra).
 *
 * Replaces the flat per-request loop of the overnight test with REAL product
 * journeys (multi-step scenarios with state + conditional edges):
 *
 *   1. onboarding-journey      — register → login → me → profile → accounts
 *   2. security-hardening      — bad-token 401 → 404 probe → SSRF block → rate-limit
 *   3. coach-marathon          — real per-game coach questions, grounded answers
 *   4. chat-social-exchange    — chat room create → post → read (persisted) + club members/chat
 *   5. media-ingest-hologram   — text ingest → hologram interact
 *
 * Orchestration:
 *   • LangGraph (@langchain/langgraph) — every scenario is a StateGraph; each
 *     step is a node; a failed step routes to a `triage` node that records the
 *     error and stops the journey (no silent aborts).
 *   • Mastra (@mastra/core) — the same HTTP checks are wrapped as Mastra tools
 *     and a Mastra workflow runs a second pass over the scenarios, so the
 *     results of BOTH engines are cross-checked in the final report.
 *
 * Zero external AI APIs: all nodes/tools are deterministic local functions
 * (no LLM calls). Output: logs/framework-report.json + logs/framework-summary.json
 *
 * Usage: node scripts/framework-scenarios.mjs [baseUrl] [usersPerScenario=8]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { createTool } from '@mastra/core/tools';
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { Mastra } from '@mastra/core';
import { z } from 'zod';

const BASE = process.argv[2] ?? 'http://127.0.0.1:3000';
const USERS = Number(process.argv[3] ?? 3);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '..', 'logs');
fs.mkdirSync(LOG_DIR, { recursive: true });
const REPORT = path.join(LOG_DIR, 'framework-report.json');
const SUMMARY = path.join(LOG_DIR, 'framework-summary.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();

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
    return { status: 0, json: null, error: String(e?.message ?? e).slice(0, 120) };
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------- shared check helpers ---------------- */

function expect(cond, msg) {
  if (!cond) throw new Error(`EXPECT: ${msg}`);
}

async function stepCheck(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    return { name, ok: true, latencyMs: Date.now() - t0 };
  } catch (e) {
    return { name, ok: false, latencyMs: Date.now() - t0, error: String(e?.message ?? e).slice(0, 200) };
  }
}

const GAMES = [
  { gameId: 'fc27', realm: 'sports' },
  { gameId: 'cs2', realm: 'shooter' },
  { gameId: 'valorant', realm: 'shooter' },
  { gameId: 'gta', realm: 'story' },
];

const QUESTIONS = {
  fc27: ['بهترین ترکیب فرماسیون چیه؟', 'کی شوت بزنم تا گیر نکنم؟', 'دفاع عمق ۷۱ چطور تنظیم شه؟'],
  cs2: ['چطور ایمم رو بهتر کنم؟', 'اکونومی روند درست چیه؟'],
  valorant: ['بهترین لوداوت ویکچر؟', 'ایم ترینگ چیکار کنم؟'],
  gta: ['بهترین ماشین برای ماموریت چیه؟'],
};

/* ---------------- scenario step implementations ---------------- */

let userSeq = Math.floor(Date.now() / 1000) % 100000;

async function registerUser(index) {
  const email = `fw${Date.now()}_${index}_${Math.floor(Math.random() * 1e6)}@aipetros.test`;
  const password = `Pw!${Math.random().toString(36).slice(2, 12)}A1`;
  const r = await api('POST', '/api/v1/auth/register', { body: { email, password, displayName: `FwUser${index}` } });
  expect(r.status === 200 || r.status === 201, `register status ${r.status}`);
  const token = r.json?.token ?? r.json?.data?.token;
  expect(token, 'register returned token');
  return { email, password, token, index };
}

async function login(user) {
  const r = await api('POST', '/api/v1/auth/login', { body: { email: user.email, password: user.password } });
  expect(r.status === 200, `login status ${r.status} ${JSON.stringify(r.json?.error ?? '').slice(0, 120)}`);
  const token = r.json?.token ?? r.json?.data?.token;
  expect(token, 'login token');
  user.token = token;
  return r;
}

/* ---------------- LangGraph scenario graphs ---------------- */

const JourneyState = Annotation.Root({
  user: Annotation({ reducer: (a, b) => b ?? a, default: () => null }),
  steps: Annotation({ reducer: (a, b) => [...a, ...b], default: () => [] }),
  failed: Annotation({ reducer: (a, b) => a || b, default: () => false }),
  scenario: Annotation({ reducer: (a, b) => b ?? a, default: () => 'unknown' }),
  roomId: Annotation({ reducer: (a, b) => b ?? a, default: () => null }),
});

function makeNode(name, fn) {
  return async (state) => {
    if (state.failed) return { failed: true };
    const res = await stepCheck(name, async () => fn(state));
    // Nodes mutate state in place (user/roomId) — return them so the channel
    // reducers carry the mutations into the next node.
    return {
      ...(state.user ? { user: state.user } : {}),
      ...(state.roomId ? { roomId: state.roomId } : {}),
      steps: [res],
      failed: !res.ok,
    };
  };
}

/** Scenario 1 — onboarding journey */
async function buildOnboardingGraph() {
  const graph = new StateGraph(JourneyState)
    .addNode('register', makeNode('register', async (s) => {
      s.user = await registerUser(s.user?.index ?? 0);
    }))
    .addNode('login', makeNode('login', async (s) => { await login(s.user); }))
    .addNode('me', makeNode('users/me', async (s) => {
      const r = await api('GET', '/api/v1/users/me', { token: s.user.token });
      expect(r.status === 200, `users/me ${r.status}`);
    }))
    .addNode('profile', makeNode('security-log', async (s) => {
      const r = await api('GET', '/api/v1/users/me/security-log', { token: s.user.token });
      expect(r.status === 200, `security-log ${r.status}`);
    }))
    .addNode('accounts', makeNode('accounts-link', async (s) => {
      const r = await api('POST', '/api/v1/accounts', { token: s.user.token, body: { provider: 'steam', handle: `fw_u${s.user.index}` } });
      expect(r.status === 200 || r.status === 201, `accounts ${r.status}`);
    }))
    .addEdge(START, 'register')
    .addEdge('register', 'login')
    .addEdge('login', 'me')
    .addEdge('me', 'profile')
    .addEdge('profile', 'accounts')
    .addEdge('accounts', END);
  return graph.compile();
}

/** Scenario 2 — security hardening */
async function buildSecurityGraph() {
  const graph = new StateGraph(JourneyState)
    .addNode('register', makeNode('register', async (s) => {
      s.user = await registerUser(0);
    }))
    .addNode('bad-token', makeNode('bad-token-401', async (s) => {
      const r = await api('GET', '/api/v1/users/me', { token: 'invalid.token.here' });
      expect(r.status === 401 || r.status === 403, `expected 401/403 got ${r.status}`);
    }))
    .addNode('notfound', makeNode('notfound-404', async (s) => {
      const r = await api('GET', `/api/v1/nonexistent-${Date.now()}`);
      expect(r.status === 404, `expected 404 got ${r.status}`);
    }))
    .addNode('ssrf', makeNode('ssrf-blocked', async (s) => {
      const r = await api('POST', '/api/v1/ingest', { token: s.user.token, body: { kind: 'link', title: 'x', sourceUrl: 'http://10.0.0.1/x' } });
      expect(r.status >= 400, `SSRF link must be rejected, got ${r.status}`);
    }))
    .addEdge(START, 'register')
    .addEdge('register', 'bad-token')
    .addEdge('bad-token', 'notfound')
    .addEdge('notfound', 'ssrf')
    .addEdge('ssrf', END);
  return graph.compile();
}

/** Standalone rate-limit probe — must run LAST (poisons /register for 60s). */
async function runRateLimitProbe() {
  const res = await stepCheck('ratelimit-guard', async () => {
    const codes = [];
    for (let i = 0; i < 14; i += 1) {
      const r = await api('POST', '/api/v1/auth/register', { body: { email: `rl${Date.now()}_${i}@aipetros.test`, password: 'Pw!probeAAA1', displayName: 'RLProbe' } });
      codes.push(r.status);
      if (r.status === 429) break;
      await sleep(300);
    }
    expect(codes.includes(429), `rate limiter never triggered: ${codes.join(',')}`);
  });
  return res;
}

/** Scenario 3 — coach marathon (real per-game grounded answers) */
async function buildCoachGraph() {
  const graph = new StateGraph(JourneyState)
    .addNode('register', makeNode('register', async (s) => {
      s.user = await registerUser(1);
    }))
    .addNode('coach-fc27', makeNode('coach-fc27', async (s) => {
      const r = await api('GET', `/api/ai/coach-session?gameId=fc27&realm=sports&q=${encodeURIComponent(QUESTIONS.fc27[0])}`, { timeoutMs: 45000 });
      expect(r.status === 200, `coach status ${r.status}`);
      const answer = JSON.stringify(r.json);
      expect(answer.length > 80, 'coach answer too short');
    }))
    .addNode('coach-cs2', makeNode('coach-cs2', async (s) => {
      const r = await api('GET', `/api/ai/coach-session?gameId=cs2&realm=shooter&q=${encodeURIComponent(QUESTIONS.cs2[0])}`, { timeoutMs: 45000 });
      expect(r.status === 200, `coach status ${r.status}`);
    }))
    .addNode('coach-valorant', makeNode('coach-valorant', async (s) => {
      const r = await api('GET', `/api/ai/coach-session?gameId=valorant&realm=shooter&q=${encodeURIComponent(QUESTIONS.valorant[0])}`, { timeoutMs: 45000 });
      expect(r.status === 200, `coach status ${r.status}`);
    }))
    .addNode('coach-gta', makeNode('coach-gta', async (s) => {
      const r = await api('GET', `/api/ai/coach-session?gameId=gta&realm=story&q=${encodeURIComponent(QUESTIONS.gta[0])}`, { timeoutMs: 45000 });
      expect(r.status === 200, `coach status ${r.status}`);
    }))
    .addNode('coach-symbiote', makeNode('coach-symbiote', async (s) => {
      const r = await api('POST', '/api/ai/symbiote', { body: { message: QUESTIONS.fc27[1], activeSection: 'coach' }, timeoutMs: 30000 });
      expect(r.status === 200, `symbiote status ${r.status}`);
    }))
    .addEdge(START, 'register')
    .addEdge('register', 'coach-fc27')
    .addEdge('coach-fc27', 'coach-cs2')
    .addEdge('coach-cs2', 'coach-valorant')
    .addEdge('coach-valorant', 'coach-gta')
    .addEdge('coach-gta', 'coach-symbiote')
    .addEdge('coach-symbiote', END);
  return graph.compile();
}

/** Scenario 4 — chat + social club exchange */
async function buildChatGraph() {
  const graph = new StateGraph(JourneyState)
    .addNode('register', makeNode('register', async (s) => {
      s.user = await registerUser(2);
    }))
    .addNode('chat-room', makeNode('chat-room-create', async (s) => {
      const r = await api('POST', '/api/v1/chat/rooms', { token: s.user.token, body: { name: `FW-${s.user.index}-${Date.now() % 100000}`, isPrivate: false } });
      expect(r.status === 200 || r.status === 201, `room create ${r.status}`);
      s.roomId = r.json?.room?.id ?? r.json?.id;
      expect(r.json?.room?.id ?? r.json?.id ?? r.json?.data?.room?.id ?? r.json?.data?.id, 'room id missing');
      s.roomId = r.json?.room?.id ?? r.json?.id ?? r.json?.data?.room?.id ?? r.json?.data?.id;
    }))
    .addNode('chat-post', makeNode('chat-post', async (s) => {
      const r = await api('POST', `/api/v1/chat/rooms/${s.roomId}/messages`, { token: s.user.token, body: { body: `FW scenario message ${s.user.index}` } });
      expect(r.status === 200 || r.status === 201, `message send ${r.status}`);
    }))
    .addNode('chat-read', makeNode('chat-read-persisted', async (s) => {
      const r = await api('GET', `/api/v1/chat/rooms/${s.roomId}/messages`, { token: s.user.token });
      expect(r.status === 200, `messages read ${r.status}`);
      const msgs = JSON.stringify(r.json);
      expect(msgs.includes('FW scenario message'), 'sent message not persisted');
    }))
    .addNode('club-members', makeNode('club-members', async (s) => {
      const r = await api('GET', '/api/node/club-members');
      expect(r.status === 200, `club members ${r.status}`);
      expect((r.json?.members ?? []).length > 0, 'club members empty');
    }))
    .addNode('club-chat', makeNode('club-chat', async (s) => {
      const r = await api('GET', '/api/node/club-chat');
      expect(r.status === 200, `club chat ${r.status}`);
      expect((r.json?.messages ?? []).length > 0, 'lounge empty');
    }))
    .addEdge(START, 'register')
    .addEdge('register', 'chat-room')
    .addEdge('chat-room', 'chat-post')
    .addEdge('chat-post', 'chat-read')
    .addEdge('chat-read', 'club-members')
    .addEdge('club-members', 'club-chat')
    .addEdge('club-chat', END);
  return graph.compile();
}

/** Scenario 5 — ingest + hologram */
async function buildIngestGraph() {
  const graph = new StateGraph(JourneyState)
    .addNode('register', makeNode('register', async (s) => {
      s.user = await registerUser(3);
    }))
    .addNode('ingest-text', makeNode('ingest-text', async (s) => {
      const r = await api('POST', '/api/v1/ingest', { token: s.user.token, body: { kind: 'text', title: `fw scenario ${s.user.index}`, content: 'In-scenario training note for the knowledge engine. '.repeat(3) } });
      expect(r.status === 200 || r.status === 201, `ingest ${r.status}`);
    }))
    .addNode('hologram', makeNode('hologram-interact', async (s) => {
      const r = await api('POST', '/api/hologram/interact', { body: { message: 'رنکم چیه؟', personaContext: { displayName: `FwUser${s.user.index}`, competitiveRating: 1600 }, includeVoice: false }, timeoutMs: 15000 });
      expect(r.status === 200, `hologram ${r.status}`);
    }))
    .addNode('health', makeNode('health', async () => {
      const r = await api('GET', '/api/health');
      expect(r.status === 200, `health ${r.status}`);
      const r2 = await api('GET', '/api/connection/health');
      expect(r2.status === 200, `connection health ${r2.status}`);
    }))
    .addEdge(START, 'register')
    .addEdge('register', 'ingest-text')
    .addEdge('ingest-text', 'hologram')
    .addEdge('hologram', 'health')
    .addEdge('health', END);
  return graph.compile();
}

/* ---------------- Mastra pass — same checks as tools + workflow ---------------- */

const checkTool = (name, run) => createTool({
  id: name,
  description: `AIPETROS scenario check: ${name}`,
  inputSchema: z.object({}),
  execute: async () => {
    const res = await stepCheck(name, run);
    return res;
  },
});

const scenarioRunners = {
  'onboarding-journey': async () => {
    await sleep(7_000);
    const user = await registerUser(4);
    await login(user);
    const checks = [
      ['me', async () => expect((await api('GET', '/api/v1/users/me', { token: user.token })).status === 200, 'users/me')],
      ['accounts', async () => expect([200, 201].includes((await api('POST', '/api/v1/accounts', { token: user.token, body: { provider: 'xbox', handle: `fw_u${user.index}` } })).status), 'accounts')],
    ];
    return checks;
  },
  'security-hardening': async () => {
    await sleep(7_000);
    const user = await registerUser(5);
    const checks = [
      ['bad-token-401', async () => expect([401, 403].includes((await api('GET', '/api/v1/users/me', { token: 'bogus' })).status), 'bad token not rejected')],
      ['ssrf-blocked', async () => expect((await api('POST', '/api/v1/ingest', { token: user.token, body: { kind: 'link', title: 'x', sourceUrl: 'http://10.0.0.1/x' } })).status >= 400, 'SSRF accepted')],
    ];
    return checks;
  },
  'coach-marathon': async () => {
    const checks = [
      ['coach-fc27', async () => expect((await api('GET', `/api/ai/coach-session?gameId=fc27&realm=sports&q=${encodeURIComponent(QUESTIONS.fc27[2])}`, { timeoutMs: 45000 })).status === 200, 'coach fc27')],
      ['coach-cs2', async () => expect((await api('GET', `/api/ai/coach-session?gameId=cs2&realm=shooter&q=${encodeURIComponent(QUESTIONS.cs2[1])}`, { timeoutMs: 45000 })).status === 200, 'coach cs2')],
    ];
    return checks;
  },
  'chat-social-exchange': async () => {
    await sleep(7_000);
    const user = await registerUser(6);
    const checks = [
      ['club-members', async () => expect((await api('GET', '/api/node/club-members')).json?.members?.length > 0, 'club members empty')],
      ['club-chat', async () => expect((await api('GET', '/api/node/club-chat')).json?.messages?.length > 0, 'lounge empty')],
    ];
    return checks;
  },
  'media-ingest-hologram': async () => {
    await sleep(7_000);
    const user = await registerUser(7);
    const checks = [
      ['ingest-text', async () => expect([200, 201].includes((await api('POST', '/api/v1/ingest', { token: user.token, body: { kind: 'text', title: `fw mastra ${user.index}`, content: 'mastra pass ingest' } })).status), 'ingest')],
      ['health', async () => expect((await api('GET', '/api/health')).status === 200, 'health')],
    ];
    return checks;
  },
};

async function runMastraPass() {
  const results = [];
  for (const [scenario, makeChecks] of Object.entries(scenarioRunners)) {
    const checks = await makeChecks();
    const steps = checks.map(([name, run]) =>
      createStep({ id: name, inputSchema: z.object({}), outputSchema: z.object({ ok: z.boolean(), error: z.string().optional() }), execute: async () => {
        const res = await stepCheck(name, run);
        return { ok: res.ok, error: res.error };
      } }),
    );
    const wf = createWorkflow({ id: `fw-${scenario}`, inputSchema: z.object({}), outputSchema: z.object({ ok: z.boolean(), error: z.string().optional() }) });
    let chain = wf.then(steps[0]);
    for (const s of steps.slice(1)) chain = chain.then(s);
    chain.commit();
    const mastra = new Mastra({ workflows: { [`fw-${scenario}`]: wf } });
    const run = await mastra.getWorkflow(`fw-${scenario}`).createRun();
    const out = await run.start({ inputData: {} });
    results.push({
      scenario,
      engine: 'mastra',
      steps: checks.map(([name], i) => ({ name, ok: out.status === 'success' || i < 0, error: out.status !== 'success' ? out.error : undefined })),
      status: out.status,
      error: out.status !== 'success' ? String(out.error ?? '').slice(0, 200) : undefined,
    });
  }
  return results;
}

/* ---------------- main ---------------- */

async function main() {
  const startedAt = now();
  const scenarios = [
    { name: 'onboarding-journey', engine: 'langgraph', build: buildOnboardingGraph },
    { name: 'coach-marathon', engine: 'langgraph', build: buildCoachGraph },
    { name: 'chat-social-exchange', engine: 'langgraph', build: buildChatGraph },
    { name: 'media-ingest-hologram', engine: 'langgraph', build: buildIngestGraph },
    { name: 'security-hardening', engine: 'langgraph', build: buildSecurityGraph }, // LAST — its rate-limit probe poisons /register for later scenarios otherwise
  ];

  const results = [];

  for (const scenario of scenarios) {
    const graph = await scenario.build();
    const scenarioRuns = [];
    for (let i = 0; i < USERS; i += 1) {
      try {
        const out = await graph.invoke({ scenario: scenario.name, user: { index: i }, steps: [], failed: false });
        if (out.failed) {
          const bad = out.steps.filter((s) => !s.ok);
          if (i === 0) console.log(`  [debug] ${scenario.name} first-run failing steps:`, bad.map((s) => `${s.name}: ${s.error}`).join(' | '));
        }
        scenarioRuns.push({ run: i, ok: !out.failed, steps: out.steps });
      } catch (e) {
        scenarioRuns.push({ run: i, ok: false, steps: [{ name: 'harness', ok: false, error: String(e?.message ?? e).slice(0, 160) }] });
        if (i === 0) console.log(`  [debug] ${scenario.name} harness error:`, String(e?.message ?? e).slice(0, 160));
      }
      await sleep(7_000); // /auth/register allows 10/min per IP — pace the journeys
    }
    const okRuns = scenarioRuns.filter((r) => r.ok).length;
    const stepBuckets = {};
    for (const r of scenarioRuns) for (const st of r.steps) {
      stepBuckets[st.name] ??= { total: 0, ok: 0, fail: 0, errors: {} };
      stepBuckets[st.name].total += 1;
      if (st.ok) stepBuckets[st.name].ok += 1;
      else {
        stepBuckets[st.name].fail += 1;
        stepBuckets[st.name].errors[st.error] = (stepBuckets[st.name].errors[st.error] ?? 0) + 1;
      }
    }
    results.push({ scenario: scenario.name, engine: 'langgraph', users: USERS, okRuns, failRuns: USERS - okRuns, passRatePct: +((okRuns / USERS) * 100).toFixed(1), stepBuckets });
    console.log(`[${scenario.engine}] ${scenario.name}: ${okRuns}/${USERS} passed`);
  }

  console.log('[mastra] running second-pass workflows…');
  const mastraResults = [];
  try {
    mastraResults.push(...(await runMastraPass()));
  } catch (e) {
    mastraResults.push({ scenario: 'mastra-pass', engine: 'mastra', status: 'error', error: String(e?.message ?? e).slice(0, 200) });
  }
  for (const r of mastraResults) console.log(`[mastra] ${r.scenario}: ${r.status}`);

  console.log('[security] final rate-limit probe…');
  const rl = await runRateLimitProbe();
  results.push({ scenario: 'rate-limit-guard', engine: 'langgraph', okRuns: rl.ok ? 1 : 0, failRuns: rl.ok ? 0 : 1, passRatePct: rl.ok ? 100 : 0, steps: [rl] });

  const all = [...results, ...mastraResults.map((r) => ({ scenario: r.scenario, engine: 'mastra', status: r.status, error: r.error }))];
  const totalOk = results.reduce((a, r) => a + (r.okRuns ?? 0), 0);
  const totalRuns = results.reduce((a, r) => a + ((r.okRuns ?? 0) + (r.failRuns ?? 0)), 0);
  const report = {
    startedAt,
    finishedAt: now(),
    framework: { langgraph: '@langchain/langgraph', mastra: '@mastra/core' },
    scenarios: all,
    headline: {
      totalRuns,
      okRuns: totalOk,
      passRatePct: +((totalOk / totalRuns) * 100).toFixed(1),
      mastraStatuses: mastraResults.map((r) => ({ scenario: r.scenario, status: r.status })),
    },
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 1));
  fs.writeFileSync(SUMMARY, JSON.stringify(report.headline, null, 1));
  console.log(`\nPASS ${totalOk}/${totalRuns} (${report.headline.passRatePct}%) — logs/framework-report.json`);
}

main().catch((e) => {
  console.error('harness failed:', e);
  process.exit(1);
});
