import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCoachSymbioteAgent } from './internalAgents.ts';
import { COACH_KNOWLEDGE_BASE, matchKnowledgeTopics, topicsByRealm } from './coachKnowledge.ts';
import { INITIAL_ECOSYSTEM_STATE } from '../data/seedData.ts';
import { computeCompositeDNA } from '../utils/aipetrosRules.ts';

/**
 * Agent Quality Assurance — professional-grade assertions.
 * Agents must be: substantive, personalized, multilingual, structured,
 * deterministic, fast, and free of canned fluff/jokes.
 */

const state = structuredClone(INITIAL_ECOSYSTEM_STATE);
const BANNED_FLUFF = ['haha', 'lol', 'just kidding', '😂', '😄', '🙂', 'no worries', 'dont worry be happy'];

function answer(msg: string): string {
  return runCoachSymbioteAgent({ message: msg, activeSection: 'coach', state });
}

test('knowledge base breadth: ≥ 18 topics across all realms', () => {
  assert.ok(COACH_KNOWLEDGE_BASE.length >= 18, `only ${COACH_KNOWLEDGE_BASE.length} topics`);
  for (const realm of ['shooter', 'sports', 'strategy'] as const) {
    const topics = topicsByRealm(realm);
    assert.ok(topics.length >= 5, `realm ${realm} has only ${topics.length} topics`);
  }
});

test('every KB topic is fully specified (lessons, drills, mistakes, pro ref)', () => {
  for (const t of COACH_KNOWLEDGE_BASE) {
    assert.ok(t.lessonsFa.length >= 2, `${t.id} lacks fa lessons`);
    assert.ok(t.lessonsEn.length >= 2, `${t.id} lacks en lessons`);
    assert.ok(t.drills.length >= 1, `${t.id} lacks drills`);
    assert.ok(t.mistakesFa.length >= 1, `${t.id} lacks mistakes`);
    assert.ok(t.proRef.length >= 20, `${t.id} lacks a substantive pro reference`);
    assert.ok(t.keywords.length >= 4, `${t.id} lacks keywords`);
  }
});

test('answers ground in the user’s real telemetry (OVR + DNA numbers)', () => {
  const ovr = computeCompositeDNA(state.profile.skillDNA);
  for (const msg of ['how do I improve my aim?', 'دفاع بهتر', 'chess rating?', 'what should I train?']) {
    const a = answer(msg);
    assert.ok(a.includes(String(ovr)), `answer lacks real OVR ${ovr}: "${a.slice(0, 80)}"`);
  }
});

test('topic answers deliver ≥ 3 lessons + a named drill (substantive teaching)', () => {
  const a = answer('how to improve crosshair placement and utility usage?');
  const lessons = (a.match(/•/g) ?? []).length;
  assert.ok(lessons >= 3, `only ${lessons} lesson bullets`);
  assert.ok(/🏋️/.test(a), 'no drill prescription');
  assert.ok(a.length >= 280, `answer too short (${a.length} chars) for a coaching answer`);
});

test('no canned jokes or fluff in any answer (user complaint regression test)', () => {
  const probes = [
    'hi', 'سلام', 'tell me a joke', 'یه جوک بگو', 'who are you', 'chto delat?',
    'how to aim', 'اقتصاد چطور', 'endgame plan', '...',
  ];
  for (const p of probes) {
    const a = answer(p);
    for (const banned of BANNED_FLUFF) {
      assert.ok(!a.toLowerCase().includes(banned), `fluff "${banned}" found for "${p}"`);
    }
  }
});

test('bilingual: Persian question → Persian answer with Persian lessons', () => {
  const a = answer('پرس بعد دقیقه ۷۵ چیکار کنم؟');
  assert.ok(/[\\u0600-\\u06FF]/.test(a), 'no Persian text in reply to Persian question');
  assert.ok(a.includes('آمار واقعی تو'), 'missing Persian telemetry grounding');
});

test('every distinct topic produces a distinct answer (no one-liner repetition)', () => {
  const probes = ['aim', 'economy buy rounds', 'comms team', 'endgame chess', 'tilt mental', 'settings sensitivity', 'meta patch'];
  const answers = probes.map((p) => answer(p));
  const unique = new Set(answers);
  assert.equal(unique.size, probes.length, 'multiple topics collapsed to the same canned reply');
  assert.ok(answers.every((a) => a.length >= 200), 'some answers are one-liner shallow');
});

test('fallback is a structured training plan, not a vague sentence', () => {
  const a = answer('asdkjhqwe zzz random gibberish');
  assert.ok(/\d\)/.test(a), 'no numbered plan steps in fallback');
  assert.ok(a.includes('30-minute plan') || a.includes('برنامه'), 'no plan heading');
  assert.ok(a.length >= 250, 'fallback too shallow');
});

test('determinism: same question → identical answer', () => {
  assert.equal(answer('how to defend after 75 minutes?'), answer('how to defend after 75 minutes?'));
});

test('performance: agents answer in < 25ms (deterministic engines must be instant)', () => {
  const start = performance.now();
  for (let i = 0; i < 50; i += 1) answer(`question variant ${i} about aim and defense`);
  const perCall = (performance.now() - start) / 50;
  assert.ok(perCall < 25, `symbiote too slow: ${perCall.toFixed(2)}ms/call`);
});

test('KB matcher ranks the best topic first (relevance sanity)', () => {
  const m = matchKnowledgeTopics('economy force buy rounds', 'shooter');
  assert.ok(m[0].topic.id === 'sh-econ', `wrong top match: ${m[0].topic.id}`);
  const m2 = matchKnowledgeTopics('اندگیم شطرنج', 'strategy');
  assert.ok(m2[0].topic.id === 'st-endgame', `wrong top match: ${m2[0].topic.id}`);
});
