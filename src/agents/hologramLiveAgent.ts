import type { HologramEmotion, HologramGender, HologramGesture } from '../utils/hologramAvatarEngine.ts';
import { computeMetaHumanProfile, parseHologramAgentTags } from '../utils/hologramAvatarEngine.ts';

/**
 * AIPETROS Internal Hologram Dialogue Agent — 100% in-app & deterministic.
 *
 * Zero external AI APIs. The reply is synthesized by a rule engine over the
 * user's real profile telemetry (win rate, rating, disputes, matched
 * archetype) with language detection (fa/en), intent routing, body-language
 * mapping and a locally-synthesized deterministic WAV "voice" (pure PCM math,
 * no network calls).
 */

export interface HologramPersonaContext {
  displayName: string;
  handle: string;
  unifiedId: string;
  activeGameTitle: string;
  tierLabel: string;
  winRatePct: number;
  tacticalConsistencyPct: number;
  competitiveRating: number;
  verifiedMatchesCount: number;
  queuedMatchesCount: number;
  openDisputesCount: number;
  gender?: HologramGender;
  age?: number;
  matchedCharacterName?: string;
  matchedCharacterFranchise?: string;
  matchedCharacterArchetype?: string;
}

export interface HologramInteractResponse {
  replyText: string;
  emotion: HologramEmotion;
  gesture: HologramGesture;
  suggestedView: 'overview' | 'agents' | 'highlights' | null;
  audioBase64: string | null;
  audioMimeType: string | null;
  latencyMs: number;
  model: string;
  traceId: string;
}

export const INTERNAL_HOLOGRAM_MODEL = 'aipetros-internal-hologram-v1';

/* ------------------------------------------------------------------ */
/* Intent routing (deterministic keyword rules, fa + en)               */
/* ------------------------------------------------------------------ */

interface IntentRule {
  intent: 'disputes' | 'queue' | 'rating' | 'matches' | 'coaching' | 'profile' | 'greeting';
  re: RegExp;
}

const INTENT_RULES: IntentRule[] = [
  { intent: 'disputes', re: /\b(dispute|court|prosecut|جdispute|دادگاه|ک Haft|اختلاف|اعتراض|پرونده)\b|دادگاه|اختلاف/iu },
  { intent: 'queue', re: /\b(queue|lobby|matchmaking|صف|لابی|جفت|مسابقه[\s‌]*جدید)\b/iu },
  { intent: 'rating', re: /\b(rating|mmr|elo|rank|رنک|امتیاز|رتبه)\b/iu },
  { intent: 'matches', re: /\b(match|clip|highlight|replay|بازی|کلیپ|هighlight|هایلایت|تکرار)\b/iu },
  { intent: 'coaching', re: /\b(coach|drill|train|practice|تمرین|کوچ|آموزش|در [\s‌]*یل)\b/iu },
  { intent: 'profile', re: /\b(profile|identity|spatial|id|پروفایل|هویت|مشخصات)\b/iu },
  { intent: 'greeting', re: /\b(hi|hello|hey|سلام|درود|هی)\b/iu },
];

function detectIntent(message: string): IntentRule['intent'] {
  for (const rule of INTENT_RULES) {
    if (rule.re.test(message)) return rule.intent;
  }
  return 'profile';
}

function isPersian(message: string): boolean {
  return /[\u0600-\u06FF]/.test(message);
}

/* ------------------------------------------------------------------ */
/* Deterministic reply synthesis from real telemetry                   */
/* ------------------------------------------------------------------ */

function personaNumbers(ctx: HologramPersonaContext): {
  winRate: string;
  consistency: string;
  rating: string;
  verified: string;
  queued: string;
  disputes: string;
} {
  const fa = (n: string | number): string => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
  return {
    winRate: isFa ? fa(ctx.winRatePct.toFixed(1)) : ctx.winRatePct.toFixed(1),
    consistency: isFa ? fa(ctx.tacticalConsistencyPct.toFixed(1)) : ctx.tacticalConsistencyPct.toFixed(1),
    rating: isFa ? fa(ctx.competitiveRating) : String(ctx.competitiveRating),
    verified: isFa ? fa(ctx.verifiedMatchesCount) : String(ctx.verifiedMatchesCount),
    queued: isFa ? fa(ctx.queuedMatchesCount) : String(ctx.queuedMatchesCount),
    disputes: isFa ? fa(ctx.openDisputesCount) : String(ctx.openDisputesCount),
  };
}

let isFa = true; // set per request before synthesis (see runHologramLiveAgent)

function synthesizeReply(ctx: HologramPersonaContext, intent: IntentRule['intent'], fa: boolean): string {
  isFa = fa;
  const n = personaNumbers(ctx);
  const name = ctx.displayName;
  const tier = ctx.tierLabel;

  if (fa) {
    switch (intent) {
      case 'disputes':
        return `کیان اینجام ${name}؛ الان ${n.disputes} پرونده باز تو دیوان عالی داری. با شفافیت ${n.consistency} درصدی، شانس محکومیت مقابل مدارک C2PA پایینه — برو بخش ایجنت‌ها وضعیت دقیق رو ببین.`;
      case 'queue':
        return `صف محلیت فعال‌ه ${name}؛ ${n.queued} بازی تو صفه و ریتینگت ${n.rating} مونده. تا لابی بسته شه، یک دریل ۱۰ ثانیه‌ای بزن که گرما بگیری.`;
      case 'rating':
        return `ریتینگ رقابتیت الان ${n.rating} مونده، تیر ${tier}. با وین‌ریت ${n.winRate} درصد، دو تا وریفای بیشتر تا پله بعدی فاصله داری.`;
      case 'matches':
        return `تا الان ${n.verified} بازی وریفای‌شده ثبت کردی ${name}. هایلایت آخرین بازی با امضای C2PA آماده‌ست؛ بذار بخش هایلایت نشونت بدم.`;
      case 'coaching':
        return `برای تیر ${tier}، تمرکز روی ثبات تاکتیک ${n.consistency} درصدی بهترین رشدو میاره. یک دریل میکروگیم بزن تا DNA مهارتت آنالیز شه.`;
      case 'greeting':
        return `سلام ${name}! هولوگرام فعاله — وین‌ریت ${n.winRate}٪ و ${n.verified} بازی وریفای‌شده. روی این‌ها می‌تونم عمیق بشیم: ۱) تحلیل باخت‌های اخیر و رفع ضعف ۲) برنامه‌ی تمرین امروز ۳) وضعیت رنک و مسیر تیر بعدی ۴) اقتصاد و اسکرو کلاب. کدوم؟`;
      case 'profile':
      default:
        return `پروفایل اسپیشل‌آیدی ${name} سینک مونده: تیر ${tier}، وین‌ریت ${n.winRate} درصد، ریتینگ ${n.rating}. همه‌چی از دیتابیس واقعی خودت میاد.`;
    }
  }

  switch (intent) {
    case 'disputes':
      return `${name} here — you have ${n.disputes} open High Court case. With ${n.consistency}% consistency, the C2PA evidence stands on its own. Check the Agents view for the forensic brief.`;
    case 'queue':
      return `Local queue is live, ${name}: ${n.queued} match waiting, rating locked at ${n.rating}. Run a 10-second drill while the lobby fills.`;
    case 'rating':
      return `Your competitive rating is ${n.rating} at ${tier}. With a ${n.winRate}% win rate you're two verified wins from the next tier.`;
    case 'matches':
      return `You've banked ${n.verified} verified matches, ${name}. The latest C2PA-signed highlight is ready — let me open Highlights.`;
    case 'coaching':
      return `At ${tier}, pushing your ${n.consistency}% tactical consistency is the fastest growth. Fire a micro-game drill and I'll audit your Skill DNA.`;
    case 'greeting':
      return `Online, ${name} — ${n.winRate}% win rate over ${n.verified} verified matches. I can go deep on: 1) reviewing recent losses & fixing weaknesses 2) today's training plan 3) rank trajectory to the next tier 4) club economy & escrow. Which one?`;
    case 'profile':
    default:
      return `Spatial ID synced, ${name}: ${tier}, ${n.winRate}% win rate, rating ${n.rating}. Everything comes from your real database.`;
  }
}

/* ------------------------------------------------------------------ */
/* Deterministic WAV voice synthesis (pure PCM, no network)            */
/* ------------------------------------------------------------------ */

function synthesizeVoiceWav(text: string, voiceSeed: string): string {
  const sampleRate = 8000;
  const syllables = Math.max(3, Math.min(28, text.replace(/\s+/g, ' ').split(/\s+/).length));
  const perSyllable = 0.14; // seconds
  const totalSamples = Math.floor(sampleRate * syllables * perSyllable);

  // deterministic pitch contour from persona seed
  let seed = 0x811c9dc5;
  for (const ch of voiceSeed) {
    seed ^= ch.charCodeAt(0);
    seed = Math.imul(seed, 0x01000193);
  }

  const data = Buffer.alloc(totalSamples * 2);
  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / sampleRate;
    const syllable = Math.floor(t / perSyllable);
    // pitch varies per syllable (140-220 Hz), smooth envelope per syllable
    const baseHz = 150 + ((seed >>> (syllable % 16)) % 70);
    const progress = (t % perSyllable) / perSyllable;
    const envelope = Math.sin(Math.PI * progress) ** 2;
    const sample = Math.sin(2 * Math.PI * baseHz * t) * 0.35 * envelope;
    data.writeInt16LE(Math.round(sample * 32767), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  return Buffer.concat([header, data]).toString('base64');
}

/* ------------------------------------------------------------------ */
/* Main entry                                                          */
/* ------------------------------------------------------------------ */

export async function runHologramLiveAgent(input: {
  message: string;
  personaContext: HologramPersonaContext;
  includeVoice?: boolean;
}): Promise<HologramInteractResponse> {
  const startedAt = Date.now();
  const ctx = input.personaContext;
  const metaProfile = computeMetaHumanProfile(ctx.gender ?? 'male', ctx.age ?? 36);

  const fa = isPersian(input.message);
  const intent = detectIntent(input.message);
  const rawReply = synthesizeReply(ctx, intent, fa);

  // Body-language: emotion/gesture derived deterministically from intent + telemetry
  let emotion: HologramEmotion = 'Speaking';
  let gesture: HologramGesture = 'Explain';
  switch (intent) {
    case 'disputes':
      emotion = 'Alert';
      gesture = 'Thinking';
      break;
    case 'queue':
      emotion = 'Focused';
      gesture = 'Point';
      break;
    case 'rating':
      emotion = 'Confident';
      gesture = 'Point';
      break;
    case 'coaching':
      emotion = 'Thinking';
      gesture = 'Explain';
      break;
    case 'greeting':
      emotion = 'Speaking';
      gesture = 'Wave';
      break;
    default:
      emotion = 'Speaking';
      gesture = 'Explain';
  }
  if (ctx.openDisputesCount > 0 && intent === 'profile') {
    emotion = 'Alert';
  }

  let suggestedView: 'overview' | 'agents' | 'highlights' | null = null;
  if (intent === 'disputes' || intent === 'coaching') suggestedView = 'agents';
  else if (intent === 'matches') suggestedView = 'highlights';
  else if (intent === 'profile') suggestedView = 'overview';

  // Normalize through the same tag parser the UI expects
  const normalized = parseHologramAgentTags(`[Emotion: ${emotion}] [Gesture: ${gesture}] ${rawReply}`);

  const audioBase64 = input.includeVoice ? synthesizeVoiceWav(normalized.cleanText, `${ctx.handle}:${metaProfile.ttsVoiceName}`) : null;

  return {
    replyText: normalized.cleanText,
    emotion: normalized.emotion,
    gesture: normalized.gesture,
    suggestedView,
    audioBase64,
    audioMimeType: audioBase64 ? 'audio/wav' : null,
    latencyMs: Date.now() - startedAt,
    model: INTERNAL_HOLOGRAM_MODEL,
    traceId: `agent_hol_${Date.now().toString(36)}_${normalized.cleanText.length}`,
  };
}
