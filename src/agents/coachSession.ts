import { computeCompositeDNA } from '../utils/aipetrosRules.ts';
import type { EcosystemState, MatchRecord, SkillDNAAxes } from '../types/aipetros.ts';
import { topicsByRealm, type CoachKnowledgeTopic } from './coachKnowledge.ts';
import {
  buildEnglishQuery,
  gatherLiveWebIntel,
  type LiveIntelResult,
} from './liveWebIntel.ts';
import type { RealmId } from '../types/spatial.ts';
import {
  discoverRealCoachClips,
  type RealCoachClip,
} from '../services/realClipAgentService.ts';

/**
 * AIPETROS Professional Coach Session — one question, one complete class.
 * Every session ships 5 pro modules: finishing timing, optimal formation,
 * live player updates, last-match mistake review, and today's training plan.
 * Each module carries its own on-topic tutorial clips (score-filtered).
 */

export interface CoachSessionModule {
  id: string;
  titleFa: string;
  titleEn: string;
  linesFa: string[];
  linesEn: string[];
  stats: Array<{ labelFa: string; labelEn: string; value: number; max: number }>;
  clips: RealCoachClip[];
  sources: Array<{ title: string; url: string; source: string }>;
  matchBreakdown?: MatchDiagnosis[];
  playerPicks?: Array<{ name: string; roleFa: string; whyFa: string; tier: 'S' | 'A' | 'B' }>;
}

/**
 * Current meta player picks — real names, deterministic roles. The live patch
 * news section (when online) confirms which archetypes the latest update favors.
 */
const META_PLAYERS: Record<string, Array<{ name: string; roleFa: string; whyFa: string; tier: 'S' | 'A' | 'B' }>> = {
  sports: [
    { name: 'Kylian Mbappé', roleFa: 'مهاجم نوک/چپ', whyFa: 'سرعت + فینیش = بهترین گزینه حمله متا', tier: 'S' },
    { name: 'Jude Bellingham', roleFa: 'هافبک هجومی', whyFa: 'ورود تو محوطه + دقت پاس بالا', tier: 'S' },
    { name: 'Erling Haaland', roleFa: 'مهاجم نوک', whyFa: 'فینیش یک‌ضرب داخل محوطه بی‌رقیب', tier: 'S' },
    { name: 'Vinícius Júnior', roleFa: 'وینگ چپ', whyFa: 'دریبل ۱-۱؛ برای شکستن دفاع پایین', tier: 'A' },
    { name: 'Rodri', roleFa: 'هافبک دفاعی', whyFa: 'قطع توپ + پاس عمقی؛ ستون ضدحمله', tier: 'A' },
    { name: 'Jamal Musiala', roleFa: 'هافبک چپ/وسط', whyFa: 'چرخش سریع بین خطوط؛ برای دفاع پرس‌بالا', tier: 'A' },
    { name: 'Alexander Isak', roleFa: 'مهاجم دوم', whyFa: 'قد + سرعت؛ بعد از پچ‌های دفاعی بهترین جایگزین', tier: 'A' },
    { name: 'Achraf Hakimi', roleFa: 'بک راست هجومی', whyFa: 'سرعت خط‌شکن؛ برای فورکرا متا', tier: 'B' },
  ],
};

export interface CoachSession {
  gameId: string;
  gameName: string;
  realm: RealmId;
  query: string;
  generatedAtIso: string;
  isFa: boolean;
  telemetry: {
    ovr: number;
    strongest: { name: string; val: number };
    weakest: { name: string; val: number };
    lastMatch: { opponent: string; result: string; score: string; metrics: string } | null;
  };
  modules: CoachSessionModule[];
}

// 8-hour cache mandate: resolved clips/bundles serve from cache with zero
// external calls until the TTL (28800s) expires.
const CLIP_CACHE_TTL_MS = 8 * 60 * 60 * 1000;
const sessionCache = new Map<string, { at: number; session: CoachSession }>();

export function clearCoachSessionCache(): void {
  sessionCache.clear();
}

function isFaQuery(query: string): boolean {
  return /[\u0600-\u06FF]/.test(query);
}

/* ---------------- Module clip discovery (per-module, on-topic) ---------------- */

async function discoverModuleClips(
  gameId: string,
  gameName: string,
  realm: RealmId,
  moduleQuery: string,
  fetcher: typeof fetch
): Promise<RealCoachClip[]> {
  try {
    const result = await discoverRealCoachClips(
      { gameId, gameName, realm, userQuery: moduleQuery },
      { fetcher }
    );
    const fresh = result.clips.filter((c) => c.youtubeId && !c.youtubeId.startsWith('fallback'));
    return fresh.slice(0, 3);
  } catch {
    return [];
  }
}

export interface MatchDiagnosis {
  opponent: string;
  score: string;
  result: 'win' | 'loss' | 'draw';
  possession: number;
  passAcc: number;
  xg: number;
  diagnosisFa: string;
  diagnosisEn: string;
}

/** Parse one match's metricsSummary into numbers. */
function parseMatchMetrics(metricsSummary: string): { possession: number; passAcc: number; xg: number } {
  return {
    possession: Number(metricsSummary.match(/(\d{1,3})% ?Poss/i)?.[1] ?? 0),
    passAcc: Number(metricsSummary.match(/(\d{1,3})% ?Pass/i)?.[1] ?? 0),
    xg: Number(metricsSummary.match(/([\d.]+) ?xG/i)?.[1] ?? 0),
  };
}

/** Deterministic per-match diagnosis from real telemetry. */
function diagnoseMatch(match: MatchRecord, dna: SkillDNAAxes, isFa: boolean): MatchDiagnosis {
  const { possession, passAcc, xg } = parseMatchMetrics(match.metricsSummary);
  const partsFa: string[] = [];
  const partsEn: string[] = [];
  if (possession >= 55 && xg > 0 && xg < 1.5) {
    partsFa.push('مالکیت بالا بدون خطر — محوطه خالی می‌مونه؛ یک پاس عمقی بعد از پرس ۲-۱-۲');
    partsEn.push('high possession, no danger — occupy the box, one through ball after the 2-1-2 press');
  }
  if (possession < 42 && possession > 0) {
    partsFa.push('مالکیت کم — لاین وسط رو با ۱-۲ کوتاه باز کن، توپ پرشی کمتر');
    partsEn.push('low possession — build through the middle with short 1-2s, fewer long balls');
  }
  if (passAcc > 0 && passAcc < 82) {
    partsFa.push(`دقت پاس ${passAcc}٪ — پاس عرضی ریسکی حذف شه`);
    partsEn.push(`pass accuracy ${passAcc}% — cut risky sideways passes`);
  }
  if (xg >= 2.2 && match.result === 'loss') {
    partsFa.push(`xG ${xg} ولی باخت — فینیش ضعیف، تایمینگ سبز تمرین شه`);
    partsEn.push(`xG ${xg} yet a loss — finishing problem, practice green timing`);
  }
  if (match.result === 'loss' && dna.riskDiscipline < 80) {
    partsFa.push('ریسک بالا وسط زمین — قبل از پاس عمقی چک ۳‌زاویه‌ای');
    partsEn.push('risky midfield play — 3-angle check before deep passes');
  }
  if (partsFa.length === 0) {
    partsFa.push('الگوی قابل‌توجهی نیست — همون مسیر رو با شدت بیشتر ادامه بده');
    partsEn.push('no notable pattern — keep the same path with higher intensity');
  }
  return {
    opponent: match.opponent,
    score: match.scoreDisplay,
    result: match.result,
    possession,
    passAcc,
    xg,
    diagnosisFa: partsFa.join(' · '),
    diagnosisEn: partsEn.join(' · '),
  };
}

/* ---------------- Module 4: real mistake review from telemetry ---------------- */

function buildMistakeReview(state: EcosystemState, isFa: boolean, realm: RealmId = 'sports'): {
  linesFa: string[];
  linesEn: string[];
  stats: CoachSessionModule['stats'];
  matchBreakdown: MatchDiagnosis[];
} {
  const { profile, matches } = state;
  const dna = profile.skillDNA;
  // Football match telemetry is sports-only: other realms never render
  // "Madrid Titans"-style opponents or football match stats.
  if (realm !== 'sports') {
    return {
      linesFa: ['برای این بازی هنوز سناریوی ثبت‌شده‌ای نیست — اسکرین‌شات یا کلیپ بازی‌ت رو بفرست تا تحلیل دقیق بدم.'],
      linesEn: ['No recorded scenarios for this game yet — send a screenshot or clip of your match for a precise review.'],
      stats: [],
      matchBreakdown: [],
    };
  }
  const latest = matches[0];
  const recent = matches.slice(0, 5);
  const wins = recent.filter((m) => m.result === 'win').length;

  // Per-match breakdown table (real data, one row per match)
  const matchBreakdown = recent.map((m) => diagnoseMatch(m, dna, isFa));

  // Deterministic mistake extraction from the metrics summary + DNA
  const metrics = latest?.metricsSummary ?? '';
  const { possession, passAcc, xg } = parseMatchMetrics(metrics);

  const linesFa: string[] = [];
  const linesEn: string[] = [];
  if (latest) {
    linesFa.push(`بازی آخر: ${latest.result === 'win' ? 'برد' : latest.result === 'loss' ? 'باخت' : 'تساوی'} ${latest.scoreDisplay} مقابل ${latest.opponent}.`);
    linesEn.push(`Last match: ${latest.result} ${latest.scoreDisplay} vs ${latest.opponent}.`);
    if (possession >= 55 && xg > 0 && xg < 1.5) {
      linesFa.push('اشتباه اصلی: مالکیت بالا ولی خطر کم — تو حرفت تو محوطه جا خالی نمی‌سازی؛ ۲-۱-۲ پرس را با یک پاس عمقی بشکن.');
      linesEn.push('Main mistake: high possession, low danger — no box occupation; break the block with one through ball.');
    }
    if (passAcc > 0 && passAcc < 82) {
      linesFa.push(`دقت پاس ${passAcc}٪ پایینه — پاس‌های عرضی ریسکی رو حذف کن؛ رو به جلو با موس بزن نه با فشار.`);
      linesEn.push(`Pass accuracy ${passAcc}% is low — cut risky sideways passes; play forward with patience.`);
    }
    if (latest.result === 'loss') {
      linesFa.push('باخت: اولین گل رو دیر خوردی؟ ۱۵ دقیقه اول رو با خط دفاع ۴۵ مدیریت کن تا ریتم نگیری.');
      linesEn.push('Loss: concede early? Manage the first 15 minutes with a 45 line before committing.');
    }
    if (dna.riskDiscipline < 80) {
      linesFa.push(`ریسک دیسیپلین ${dna.riskDiscipline}/100 ضعیف‌ترین محورته — قبل از هر پاس تو محوطه خودی، چک ۳‌زاویه‌ای کن.`);
      linesEn.push(`Risk discipline ${dna.riskDiscipline}/100 is your weakest axis — 3-angle check before deep passes.`);
    }
  } else {
    linesFa.push('بازی تاییدشده‌ای ثبت نشده — یک بازی آنلاین رو با اسکرین‌شات بفرست تا تحلیل دقیق بدم.');
    linesEn.push('No verified matches yet — send one online match screenshot for a precise review.');
  }
  if (recent.length) {
    linesFa.push(`روند ۵ بازی: ${wins} برد — ${wins >= 3 ? 'ریتم خوبه، روی جزئیات فینیش تمرکز کن.' : 'فرم نوسانیه، اول ریتم ورودی رو درست کن.'}`);
    linesEn.push(`Last 5: ${wins}W — ${wins >= 3 ? 'good rhythm, polish finishing.' : 'inconsistent form, fix input rhythm first.'}`);
  }
  return {
    linesFa,
    linesEn,
    stats: [
      { labelFa: 'مالکیت', labelEn: 'Possession', value: possession || 50, max: 100 },
      { labelFa: 'دقت پاس', labelEn: 'Pass accuracy', value: passAcc || 85, max: 100 },
      { labelFa: 'xG', labelEn: 'xG', value: Math.round((xg || 1.2) * 100), max: 400 },
    ],
    matchBreakdown,
  };
}

/* ---------------- Module builders from the knowledge base ---------------- */

function kbLines(topics: CoachKnowledgeTopic[], isFa: boolean): { linesFa: string[]; linesEn: string[] } {
  const linesFa = topics.flatMap((t) => t.lessonsFa.slice(0, 3));
  const linesEn = topics.flatMap((t) => t.lessonsEn.slice(0, 3));
  return { linesFa, linesEn };
}

interface KnowledgeCardRow {
  kind: string;
  title: string;
  body: string;
}

/**
 * Load this game's knowledge_cards (SQLite store, refreshed by the ingest
 * cron) so the session modules are data-driven instead of static-only.
 * Server-side only — the dynamic import keeps client bundles free of db deps.
 * Returns [] on any failure (static KB fallback stays intact).
 */
async function loadGameKnowledgeCards(gameId: string): Promise<KnowledgeCardRow[]> {
  try {
    const { getDb } = await import('../server/db.ts');
    const rows = getDb()
      .prepare(
        "SELECT kind, title, body FROM knowledge_cards WHERE game_id = ? AND kind IN ('qa','question','trick','glitch') " +
        "ORDER BY CASE kind WHEN 'qa' THEN 0 WHEN 'trick' THEN 1 WHEN 'glitch' THEN 2 ELSE 3 END, updated_at DESC LIMIT 200"
      )
      .all(gameId) as unknown as KnowledgeCardRow[];
    return rows;
  } catch {
    return [];
  }
}

/** Keyword router: maps knowledge cards to the session module they belong to. */
const MODULE_CARD_MATCHERS: Record<string, RegExp> = {
  finishing: /شوت|فینس|finishing|shot|goal|header|herka|هریک|پنالتی|penalty|ضربه/i,
  formation: /ترکیب|فرم|تاکتیک|formation|tactic|press|پرس|roles|نقش/i,
  updates: /پچ|آپدیت|متا|meta|patch|update|price|قیمت|sbc/i,
  training: /تمرین|دریل|drill|training|practice|تمرین روزانه/i,
};

/** Turn a card body into a module lesson line (single sentence, trimmed). */
function cardToLine(card: KnowledgeCardRow, isFa: boolean): string | null {
  const text = card.body.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const isFaCard = /[\u0600-\u06FF]/.test(text);
  if (isFa && !isFaCard) return null; // English session: English cards only
  if (!isFa && isFaCard) return null; // Persian session: Persian cards only
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

function moduleCardLines(
  cards: KnowledgeCardRow[],
  moduleId: 'finishing' | 'formation' | 'updates' | 'training',
  isFa: boolean
): string[] {
  const matcher = MODULE_CARD_MATCHERS[moduleId];
  const out: string[] = [];
  for (const card of cards) {
    if (out.length >= 4) break;
    if (!matcher.test(`${card.title} ${card.body}`)) continue;
    const line = cardToLine(card, isFa);
    if (line && !out.includes(line)) out.push(line);
  }
  return out;
}

function fmtPatchLines(intel: LiveIntelResult, isFa: boolean): string[] {
  return intel.sources
    .filter((s) => s.source === 'steamnews' || s.source === 'reddit')
    .slice(0, 3)
    .map((s) => `${s.title} — ${s.snippet.slice(0, 110)}`);
}

/* ---------------- Topic lock (true intelligence mandate) ---------------- */

/** An active chip/question is classified into exactly ONE module cluster; the
 *  same regex is the strict relevance filter — tips/clips under the active
 *  topic must be 100% on-topic (zero economy/generic mixing). */
const TOPIC_MODULE_MATCHERS: Array<{ id: string; re: RegExp }> = [
  { id: 'finishing', re: /crosshair|aim|aiming|flick|headshot|pre[- ]?aim|shoot|shooting|finishing|finesse|\u06a9\u0631\u0648\u0633|\u0627\u06cc\u0645|\u0634\u0648\u062a|\u0641\u06cc\u0646\u0633|\u0645\u0627\u0631/i },
  { id: 'formation', re: /formation|tactic|role|position|setup|execute|\u062a\u0631\u06a9\u06cc\u0628|\u062a\u0627\u06a9\u062a\u06cc\u06a9|\u0646\u0642\u0634/i },
  { id: 'updates', re: /patch|update|meta|nerf|buff|price|\u067e\u0686|\u0622\u067e\u062f\u06cc\u062a|\u0645\u062a\u0627/i },
  { id: 'training', re: /train|drill|practice|improve|\u062a\u0645\u0631\u06cc\u0646|\u062f\u0631\u06cc\u0644/i },
  { id: 'mistakes', re: /mistake|review|loss|analysis|\u0627\u0634\u062a\u0628\u0627\u0647|\u0628\u0631\u0631\u0633\u06cc/i },
];

function classifyTopic(query: string): { id: string; filter: RegExp } | null {
  if (!query) return null;
  for (const t of TOPIC_MODULE_MATCHERS) if (t.re.test(query)) return { id: t.id, filter: t.re };
  return null;
}

/* ---------------- Main session builder ---------------- */

export async function buildCoachSession(
  input: {
    gameId: string;
    gameName?: string;
    realm: RealmId;
    query?: string;
  },
  options: { state: EcosystemState; fetcher?: typeof fetch; force?: boolean; forceLang?: 'fa' | 'en' }
): Promise<CoachSession> {
  const realm = input.realm;
  const gameId = input.gameId;
  const gameName = input.gameName ?? gameId.toUpperCase();
  const query = (input.query ?? '').trim();
  // Language follows the app UI when forced (user mandate: English UI → English coach).
  const isFa = options.forceLang
    ? options.forceLang === 'fa'
    : query ? isFaQuery(query) : true;
  const state = options.state;
  const started = Date.now();

  const cacheKey = `${gameId}:${realm}:${query.toLowerCase()}:${isFa ? 'fa' : 'en'}`;
  const cached = sessionCache.get(cacheKey);
  if (!options.force && cached && Date.now() - cached.at < CLIP_CACHE_TTL_MS) {
    return cached.session;
  }

  const fetcher = options.fetcher ?? globalThis.fetch;
  const dna = state.profile.skillDNA;
  const ovr = computeCompositeDNA(dna);
  // Game-strict telemetry labels: football vocabulary NEVER leaks into other
  // realms (user mandate: CS2 must show shooter metrics, zero football).
  const isSportsRealm = realm === 'sports';
  const axisLabels = isSportsRealm
    ? ['Spatial Passing', 'Tactical Vision', 'Trap Anticipation', 'Endgame Composure', 'Tempo Control', 'Risk Discipline']
    : realm === 'shooter'
      ? ['Crosshair Placement', 'Utility IQ', 'Counter-Strafe Control', 'Trade Timing', 'Map Awareness', 'Risk Discipline']
      : ['Mission Planning', 'Situational Awareness', 'Vehicle Control', 'Heist Composure', 'Pacing', 'Risk Discipline'];
  const axisVals = [dna.spatialPassing, dna.tacticalVision, dna.trapAnticipation, dna.endgameComposure, dna.tempoControl, dna.riskDiscipline];
  const axes = axisLabels
    .map((name, i) => ({ name, val: axisVals[i] }))
    .sort((a, b) => a.val - b.val);
  const weakest = axes[0];
  const strongest = axes[axes.length - 1];
  // Football-style last-match opponents (Madrid Titans etc.) are sports-only;
  // other realms get a session-style line instead.
  const latest = isSportsRealm ? state.matches[0] : undefined;

  const kbTopics = topicsByRealm(realm);
  const queryEn = query ? buildEnglishQuery(query) : '';
  // Data-driven modules: this game's ingested knowledge_cards lead each
  // module's lines; the static KB stays as fallback beneath them.
  const gameCards = await loadGameKnowledgeCards(gameId);
  const cardLines = {
    finishing: moduleCardLines(gameCards, 'finishing', isFa),
    formation: moduleCardLines(gameCards, 'formation', isFa),
    updates: moduleCardLines(gameCards, 'updates', isFa),
    training: moduleCardLines(gameCards, 'training', isFa),
  };
  // English variants so the English UI is also knowledge-card-led, not static-KB-led
  const cardLinesEn = {
    finishing: moduleCardLines(gameCards, 'finishing', false),
    formation: moduleCardLines(gameCards, 'formation', false),
    updates: moduleCardLines(gameCards, 'updates', false),
    training: moduleCardLines(gameCards, 'training', false),
  };

  // Topic lock: with an active chip/question, the active module's knowledge
  // lines are filtered strictly to that topic — never a mixed generic dump.
  const topicLock = classifyTopic(query);
  const finLock = topicLock?.id === 'finishing' ? topicLock.filter : null;
  const finCardsFa = finLock ? cardLines.finishing.filter((l) => finLock.test(l)) : cardLines.finishing;
  const finCardsEn = finLock ? cardLinesEn.finishing.filter((l) => finLock.test(l)) : cardLinesEn.finishing;

  // Live intel + per-module clips, all in parallel.
  // Clip queries are realm- AND topic-aware: CS2 aim never searches for
  // "shooting timing green window" (football phrasing) and an active topic
  // overrides the module default so videos match exactly what was asked.
  const finClipQuery = topicLock?.id === 'finishing'
    ? `${gameName} ${queryEn || query} tutorial`
    : isSportsRealm
      ? `${gameName} shooting timing green window tutorial`
      : `${gameName} crosshair placement aim guide tutorial`;
  const [intel, finishingClips, formationClips, updatesClips, mistakesClips, trainingClips] =
    await Promise.all([
      gatherLiveWebIntel(`${query || gameName} update meta players`, { gameName: realm === 'sports' ? 'EA SPORTS FC 27' : gameName, fetcher }),
      discoverModuleClips(gameId, gameName, realm, finClipQuery, fetcher),
      discoverModuleClips(gameId, gameName, realm, `${gameName} best formation custom tactics guide`, fetcher),
      discoverModuleClips(gameId, gameName, realm, `${gameName} best players meta after update`, fetcher),
      discoverModuleClips(gameId, gameName, realm, `${gameName} common mistakes beginners avoid`, fetcher),
      discoverModuleClips(gameId, gameName, realm, `${gameName} training drills improve fast`, fetcher),
    ]);

  const patchLines = fmtPatchLines(intel, isFa);
  const mistakeReview = buildMistakeReview(state, isFa, realm);
  const finishingTopics = kbTopics.filter((t) => /finish|shot|finishing|sp-finishing/.test(t.id) || (isSportsRealm ? t.keywords.some((k) => /شوت|فینس/.test(k)) : /aim|crosshair/i.test(t.id)));
  const formationTopics = kbTopics.filter((t) => /formation|tactic|press/.test(t.id));
  const trainingTopics = kbTopics.filter((t) => t.drills.length > 0).slice(0, 2);

  const modules: CoachSessionModule[] = [
    {
      id: 'finishing',
      titleFa: isSportsRealm ? '⚽ شوت‌زنی حرفه‌ای — کی و چطور' : '🎯 ایم و کروس‌هیر حرفه‌ای — کی و چطور',
      titleEn: isSportsRealm ? '⚽ Pro finishing — when & how' : '🎯 Crosshair & aim — when & how',
      linesFa: [
        ...(finCardsFa.length ? finCardsFa : []),
        ...(finishingTopics.length ? finishingTopics.flatMap((t) => t.lessonsFa.slice(0, 2)) : kbLines(kbTopics.slice(0, 1), isFa).linesFa),
        ...(isSportsRealm ? [
          'قدرت شوت: نوار ۲-۳ سلول کافیه؛ پرکردن کامل = توپ بلند و بی‌دقت.',
          'فینس شوت: زاویه ۴۵ درجه داخل محوطه + زمان‌بندی سبز = بالاترین تبدیل.',
          'اولین تاچ رو کنترل کن، تاچ دوم شوت — شوت با اولین تاچ فقط وقتی دروازه‌باز باشه.',
          'هریک (سرزنی): سنجاق با B رو تا سبز نگه‌دار، به‌جای پرش زودهنگام موقعیت بگیر پشت مدافع؛ بازیکن با ریتینگ هریک بالای ۸۵ انتخاب کن.',
          'ضرب ایستگاهی: هریک رو به نقطه پنج‌متری نزدیک کاد نده؛ درِوازه‌بان خروج قوی داره — نقطه دوم یا پس‌کش به لبه محوطه.',
        ] : [
          'کروس‌هیر همیشه هم‌سطح سر می‌مونه — زاویه رو قبل از ورود pre-aim کن، نه با فلیک.',
          'ضداستراف (A+D) قبل هر شات: دقت گلوله اول در توقف کامل تعیین می‌شه.',
          'زاویه‌های معروف رو prefire کن: کروس‌هیر قبل از پیک سر جای خودشه.',
          'وضعیت اسپری: ۴-۵ گلوله اول دقیق‌ترینه؛ بعدش کلاچ یا مکث.',
        ]),
      ],
      linesEn: [
        ...(finCardsEn.length ? finCardsEn : []),
        ...(isSportsRealm ? [
          'Power: 2-3 bars is enough; full power = wild miss.',
          'Finesse: 45° inside the box + green timing = best conversion.',
          'Control first touch, shoot second touch — first-touch shots only on open goal.',
          'Headers: hold the B pin until green, position BEHIND the defender, pick a player with 85+ header rating.',
        ] : [
          'Crosshair stays at head level through every rotation — pre-aim the angle, don\'t flick to it.',
          'Counter-strafe (A+D tap) before every shot: first bullet accuracy is won or lost in the stop.',
          'Prefire the common angles: your crosshair is placed before the peek, not after.',
          'Spray control: the first 4-5 bullets are the accurate ones — re-aim or reset beyond that.',
        ]),
      ],
      stats: [{ labelFa: 'دقت فینیش تو', labelEn: 'Your finishing', value: dna.trapAnticipation, max: 100 }],
      clips: finishingClips,
      sources: intel.sources.filter((s) => isSportsRealm ? /shoot|finish|goal/i.test(s.title) : /aim|crosshair|sens|guide/i.test(s.title)).slice(0, 2),
    },
    {
      id: 'formation',
      titleFa: isSportsRealm ? '🧩 بهترین ترکیب و نقش‌ها' : '🧩 بهترین تاکتیک و نقش‌ها',
      titleEn: isSportsRealm ? '🧩 Best formation & roles' : '🧩 Best tactics & roles',
      linesFa: [
        ...(cardLines.formation.length ? cardLines.formation : []),
        ...(formationTopics.length ? formationTopics.flatMap((t) => t.lessonsFa.slice(0, 2)) : []),
        'انتخاب بر اساس تیم تو: مهره‌های قوی وسط → 4-2-3-1؛ وینگ‌های سریع → 4-3-3؛ دفاع فشرده → 4-2-1-3.',
        'نقش‌ها: CDM باید بهترین بازیکن دفاعی باشه؛ CAM نزدیک‌ترین به استایل تو.',
        'پرس بعد از پاس عرضی فعال بشه، نه همه‌جا — مهم‌ترین تنظیم متا فعلی.',
      ],
      linesEn: [
        ...(cardLinesEn.formation.length ? cardLinesEn.formation : []),
        ...(isSportsRealm ? [
          'Pick by your squad: strong central mids → 4-2-3-1; fast wingers → 4-3-3; compact block → 4-2-1-3.',
          'Roles: your best defensive player must be the CDM; CAM matches your style.',
          'Press after sideways passes only — the single most important current meta setting.',
        ] : [
          'Buy rounds: force-buys only when the enemy is on a save — economy discipline wins halves.',
          'Utility per execute: 1 smoke + 1 flash minimum; learn one Mirage and one Inferno set piece.',
          'Default setups beat hero plays: play the round structure, punish over-rotations.',
        ]),
      ],
      stats: [{ labelFa: 'بینش تاکتیکی تو', labelEn: 'Tactical vision', value: dna.tacticalVision, max: 100 }],
      clips: formationClips,
      sources: intel.sources.filter((s) => /formation|tactic/i.test(s.title + s.snippet)).slice(0, 2),
    },
    {
      id: 'player-updates',
      titleFa: '📈 آپدیت‌های بازیکن و متا — همین حالا',
      titleEn: '📈 Player updates & meta — right now',
      linesFa: patchLines.length
        ? [
            ...(cardLines.updates.length ? cardLines.updates : []),
            ...patchLines,
            'بعد از هر پچ: قیمت بازیکن‌های متا ۲۴ ساعت اول بالا می‌ره — قبل از خرید صبر کن.',
            'کارت‌های untradeable رو نگه دار؛ برای SBC فقط لیگ کم‌مصرف خرج کن.',
          ]
        : [
            'اتصال زنده برقرار نشد — منابع آفلاین: بعد از هر پچ اول فیکس‌های دفاع/پرس رو چک کن.',
            'بازیکن‌های آپدیت‌شده با شتاب و فینیش بهتر رو برای متا اولویت بده.',
          ],
      linesEn: patchLines.length
        ? [...patchLines, 'After each patch, meta player prices spike 24h — wait before buying.', 'Keep untradeables; spend only cheap-league players in SBCs.']
        : ['Live feed unavailable — offline guidance: check defense/press fixes first after each patch.'],
      stats: [],
      clips: updatesClips,
      sources: intel.sources.slice(0, 4),
      playerPicks: META_PLAYERS[realm] ?? [],
    },
    {
      id: 'mistakes',
      titleFa: '🔍 تحلیل بازی‌به‌بازی اشتباهات (از دیتای واقعی تو)',
      titleEn: '🔍 Per-match mistake review (your real data)',
      linesFa: mistakeReview.linesFa,
      linesEn: mistakeReview.linesEn,
      stats: mistakeReview.stats,
      clips: mistakesClips,
      sources: [],
      matchBreakdown: mistakeReview.matchBreakdown,
    },
    {
      id: 'training',
      titleFa: `🏋️ تمرین امروز — تمرکز روی ${isFa ? weakest.name : weakest.name} (${weakest.val}/100)`,
      titleEn: `🏋️ Today's training — focus: ${weakest.name} (${weakest.val}/100)`,
      linesFa: [
        ...(cardLines.training.length ? cardLines.training : []),
        ...trainingTopics.flatMap((t) => t.drills.map((d) => `${d}: ${t.titleFa} — ${t.lessonsFa[0].slice(0, 80)}…`)),
        '۵ دقیقه warmup ایستگاه آزاد → ۲۰ دقیقه دریل هدفمند روی ضعیف‌ترین محور → ۵ دقیقه مرور باخت‌ها.',
        'هر روز فقط ۱ محور؛ تغییر روزانه = هیچ‌چیز فیکس نمی‌شه.',
      ],
      linesEn: [
        '5-min free warmup → 20-min targeted drill on the weakest axis → 5-min loss review.',
        'One axis per day; daily switching fixes nothing.',
      ],
      stats: [{ labelFa: 'OVR کل تو', labelEn: 'Overall OVR', value: ovr, max: 100 }],
      clips: trainingClips,
      sources: [],
    },
  ];

  const session: CoachSession = {
    gameId,
    gameName,
    realm,
    query,
    generatedAtIso: new Date().toISOString(),
    isFa,
    telemetry: {
      ovr,
      strongest: { name: strongest.name, val: strongest.val },
      weakest: { name: weakest.name, val: weakest.val },
      lastMatch: latest
        ? { opponent: latest.opponent, result: latest.result, score: latest.scoreDisplay, metrics: latest.metricsSummary }
        : null,
    },
    modules,
  };
  sessionCache.set(cacheKey, { at: Date.now(), session });
  return session;
}
