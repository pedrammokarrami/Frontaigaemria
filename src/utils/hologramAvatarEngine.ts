export type HologramEmotion = 'Idle' | 'Speaking' | 'Thinking' | 'Confident' | 'Focused' | 'Alert';
export type HologramGesture = 'Point' | 'Wave' | 'Thinking' | 'Explain' | 'Idle';
export type HologramDisplayMode = 'standard' | 'peppers-ghost';
export type HologramGender = 'female' | 'male';
export type HologramRenderMode = 'ue58-hybrid' | 'niagara-points';

export interface MetaHumanMorphParams {
  gender: HologramGender;
  /** Clamped continuously between 8 and 99 */
  age: number;
  /** 0 at age 8 .. 1 at age 99 */
  ageFactor: number;
  /** 0 = male, 1 = female */
  femininity: number;
  /** 0 = youth smoothness (8..26), 1 = grandmaster maturity (60..99) */
  maturityFactor: number;
  /** 0 = electric cyan youth glow, 1 = distinguished silver-platinum legend glow (55..99) */
  hairSilverRatio: number;
  /** Subtle scale adjustment for youthful prodigy vs full adult frame */
  frameScale: number;
  /** Cinematic contrast boost as legend ages */
  cinematicContrast: number;
  stageLabelFa: string;
  stageLabelEn: string;
  ttsVoiceName: string;
}

export interface ParsedAgentDirective {
  cleanText: string;
  emotion: HologramEmotion;
  gesture: HologramGesture;
}

const VALID_EMOTIONS: HologramEmotion[] = [
  'Idle',
  'Speaking',
  'Thinking',
  'Confident',
  'Focused',
  'Alert',
];

const VALID_GESTURES: HologramGesture[] = [
  'Point',
  'Wave',
  'Thinking',
  'Explain',
  'Idle',
];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Computes continuous Unreal Engine 5.8 MetaHuman visual & voice profile
 * across Gender (Female / Male) and full Age span (8 to 99 years).
 */
export function computeMetaHumanProfile(
  gender: HologramGender,
  rawAge: number
): MetaHumanMorphParams {
  const age = Math.round(clamp(rawAge, 8, 99));
  const ageFactor = clamp((age - 8) / (99 - 8), 0, 1);
  const maturityFactor = smoothstep(26, 75, age);
  const hairSilverRatio = smoothstep(46, 82, age);
  const isFemale = gender === 'female';
  const femininity = isFemale ? 1 : 0;

  // Youthful prodigy frame (8-17) grows smoothly into full athletic adult scale (18-99)
  const frameScale = lerp(0.92, 1.02, smoothstep(8, 22, age));
  const cinematicContrast = lerp(1.0, 1.14, maturityFactor);

  let stageLabelFa: string;
  let stageLabelEn: string;
  if (isFemale) {
    if (age <= 12) {
      stageLabelFa = `دختر نابغه ${age} ساله`;
      stageLabelEn = `Young Prodigy Girl · ${age}y`;
    } else if (age <= 17) {
      stageLabelFa = `دختر نوجوان ${age} ساله`;
      stageLabelEn = `Teen Heroine · ${age}y`;
    } else if (age <= 29) {
      stageLabelFa = `دختر جوان ${age} ساله`;
      stageLabelEn = `Prime Heroine · ${age}y`;
    } else if (age <= 48) {
      stageLabelFa = `بانوی فرمانده ${age} ساله`;
      stageLabelEn = `Veteran Commander · ${age}y`;
    } else if (age <= 69) {
      stageLabelFa = `بانوی پخته ${age} ساله`;
      stageLabelEn = `Seasoned Tactician · ${age}y`;
    } else {
      stageLabelFa = `استاد ارشد ${age} ساله`;
      stageLabelEn = `Grandmaster Legend · ${age}y`;
    }
  } else {
    if (age <= 12) {
      stageLabelFa = `پسر نابغه ${age} ساله`;
      stageLabelEn = `Young Prodigy Boy · ${age}y`;
    } else if (age <= 17) {
      stageLabelFa = `پسر نوجوان ${age} ساله`;
      stageLabelEn = `Teen Hero · ${age}y`;
    } else if (age <= 29) {
      stageLabelFa = `پسر جوان ${age} ساله`;
      stageLabelEn = `Prime Hero · ${age}y`;
    } else if (age <= 48) {
      stageLabelFa = `مرد اسطوره‌ای ${age} ساله`;
      stageLabelEn = `Iconic Legend · ${age}y`;
    } else if (age <= 69) {
      stageLabelFa = `مرد کهنه‌کار ${age} ساله`;
      stageLabelEn = `Seasoned Veteran · ${age}y`;
    } else {
      stageLabelFa = `استاد بزرگ ${age} ساله`;
      stageLabelEn = `Grandmaster Elder · ${age}y`;
    }
  }

  const ttsVoiceName = isFemale ? 'Aoede' : 'Charon';

  return {
    gender,
    age,
    ageFactor,
    femininity,
    maturityFactor,
    hairSilverRatio,
    frameScale,
    cinematicContrast,
    stageLabelFa,
    stageLabelEn,
    ttsVoiceName,
  };
}

/**
 * Parses inline AI tags such as `[Emotion: Thinking]` and `[Gesture: Wave]`
 * from an agent response and returns normalized directive + clean spoken text.
 */
export function parseHologramAgentTags(
  rawText: string,
  fallbackEmotion: HologramEmotion = 'Speaking',
  fallbackGesture: HologramGesture = 'Point'
): ParsedAgentDirective {
  let emotion: HologramEmotion = fallbackEmotion;
  let gesture: HologramGesture = fallbackGesture;

  const emotionMatch = rawText.match(/\[Emotion:\s*([A-Za-z]+)\s*\]/i);
  if (emotionMatch) {
    const found = VALID_EMOTIONS.find(
      (e) => e.toLowerCase() === emotionMatch[1].trim().toLowerCase()
    );
    if (found) emotion = found;
  }

  const gestureMatch = rawText.match(/\[Gesture:\s*([A-Za-z]+)\s*\]/i);
  if (gestureMatch) {
    const found = VALID_GESTURES.find(
      (g) => g.toLowerCase() === gestureMatch[1].trim().toLowerCase()
    );
    if (found) gesture = found;
  }

  const cleanText = rawText
    .replace(/\[Emotion:\s*[A-Za-z]+\s*\]/gi, '')
    .replace(/\[Gesture:\s*[A-Za-z]+\s*\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    cleanText: cleanText || rawText.trim(),
    emotion,
    gesture,
  };
}

/**
 * Computes smoothed 0..1 lip-sync amplitude from either real Web Audio byte frequency data
 * or a synthetic syllable cadence fallback when Web Speech / text-only speaking is active.
 */
export function computeLipSyncAmplitude(
  isSpeaking: boolean,
  elapsedSec: number,
  audioRmsNormalized?: number
): number {
  if (!isSpeaking) return 0;
  if (typeof audioRmsNormalized === 'number' && Number.isFinite(audioRmsNormalized)) {
    const boosted = Math.max(0, Math.min(1, audioRmsNormalized * 2.6));
    if (boosted > 0.03) return boosted;
  }
  const cadenceA = Math.sin(elapsedSec * 14.5) * 0.5 + 0.5;
  const cadenceB = Math.sin(elapsedSec * 23.0 + 1.1) * 0.5 + 0.5;
  const pauseGate = Math.sin(elapsedSec * 3.1) > -0.68 ? 1 : 0.18;
  return Math.max(0, Math.min(1, (0.2 + 0.72 * cadenceA * (0.45 + 0.55 * cadenceB)) * pauseGate));
}
