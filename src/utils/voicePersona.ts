/**
 * Voice persona engine — Web Speech API only (open, built into the browser,
 * zero paid API). Per user mandate (2026-11-23):
 *  • ONLY the coach speaks — no menu/map/UI sounds or voices.
 *  • Coach speech breathes: short pause between sentences (casual, not formal).
 *  • Sports coach = deep Ferguson-style male voice.
 */

export type VoicePersonaId = 'tacticalCoach' | 'mapGuide' | 'uiHelper';

interface PersonaProfile {
  female: boolean;
  pitch: number;
  rate: number;
}

const PERSONAS: Record<VoicePersonaId, PersonaProfile> = {
  // Ferguson-style: deep, commanding, unhurried, casual — never robotic-fast.
  tacticalCoach: { female: false, pitch: 0.82, rate: 0.94 },
  mapGuide: { female: true, pitch: 1.05, rate: 0.86 },
  uiHelper: { female: false, pitch: 1.15, rate: 0.95 },
};

const FEMALE_HINTS = /(female|woman|zira|hala|salma|samantha|victoria|karen|moira|tessa|fiona|susan|farida|google\s*(us|uk)?\s*english|amira|laila|zeina|maria)/i;
const MALE_HINTS = /(male|man|hamed|hendi|david|mark|daniel|alex|fred|george|maged|naayf|tarik|philip|rishi)/i;

function pickVoice(lang: string, female: boolean): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const langPrefix = lang.slice(0, 2).toLowerCase();
  const sameLang = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
  const pool = sameLang.length ? sameLang : voices;
  const natural = pool.filter((v) => /natural|neural|google|premium|enhanced/i.test(v.name));
  const base = natural.length ? natural : pool;
  const genderMatch = base.filter((v) =>
    female ? FEMALE_HINTS.test(v.name) : MALE_HINTS.test(v.name)
  );
  if (genderMatch.length) return genderMatch[0];
  return base[0] ?? null;
}

/** Split into sentences so speech can "breathe" between them. */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?؟…])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Speak text with the given persona and app language. Fire-and-forget. */
export function speakWithPersona(
  persona: VoicePersonaId,
  text: string,
  lang: string,
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  if (!text?.trim()) return false;
  try {
    window.speechSynthesis.cancel();
    const profile = PERSONAS[persona];
    const voice = pickVoice(lang || 'fa', profile.female);
    // Sentence-by-sentence queueing: a short breath pause between sentences
    // sounds far less robotic than one long monologue.
    const sentences = splitSentences(text);
    if (!sentences.length) return false;
    let i = 0;
    const speakNext = () => {
      if (i >= sentences.length) return;
      const piece = sentences[i++];
      const utterance = new SpeechSynthesisUtterance(piece);
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang || (lang || 'fa');
      // persona tone shaping on top of the matched voice
      utterance.pitch = Math.min(2, profile.pitch);
      utterance.rate = profile.rate;
      // breathing pause between sentences — casual, human rhythm
      const breathMs = persona === 'tacticalCoach' ? 260 : 200;
      utterance.onend = () => {
        window.setTimeout(speakNext, breathMs);
      };
      window.speechSynthesis.speak(utterance);
    };
    speakNext();
    return true;
  } catch {
    return false;
  }
}
