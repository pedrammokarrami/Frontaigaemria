import {
  ICONIC_AUDIO_CHARACTERS,
  ICONIC_CINEMA_CHARACTERS,
  type IconicMediaCharacter,
  type MediaHubKind,
} from '../data/iconicMediaCharacters.ts';
import type { HologramGender } from './hologramAvatarEngine.ts';
import type { CinemaRoomId } from './cinemaAgents.ts';
import type { AudioRoomId } from './audioAgents.ts';
import { normalizeDigitsToAscii, parseUserSelfIntro } from './userSelfIntroParser.ts';

export interface MediaCharacterMatchInput {
  hub: MediaHubKind;
  gender: HologramGender;
  age: number;
  activeRoomId: CinemaRoomId | AudioRoomId;
}

export interface ScoredMediaCharacter {
  character: IconicMediaCharacter;
  similarityPct: number;
  rawScore: number;
  ageDelta: number;
  matchReasonsFa: string[];
}

export interface MediaCharacterMatchReport {
  topMatch: ScoredMediaCharacter;
  runnerUps: ScoredMediaCharacter[];
  allRanked: ScoredMediaCharacter[];
  totalRosterCount: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Deterministically ranks all male & female Cinema or Audio characters (ages 8..99)
 * against the user's gender, age, and active spatial room.
 */
export function matchIconicMediaCharacters(
  input: MediaCharacterMatchInput
): MediaCharacterMatchReport {
  const safeAge = Math.round(clamp(input.age, 8, 99));
  const roster =
    input.hub === 'cinema' ? ICONIC_CINEMA_CHARACTERS : ICONIC_AUDIO_CHARACTERS;

  const scored: ScoredMediaCharacter[] = roster.map((char) => {
    // 1. Exact gender match (42 pts)
    const genderScore = char.gender === input.gender ? 42 : 0;

    // 2. Age proximity across full 8..99 human lifespan (38 pts max)
    const ageDelta = Math.abs(safeAge - char.canonicalAge);
    const inBand = safeAge >= char.minAgeFit && safeAge <= char.maxAgeFit;
    const bandBonus = inBand ? 16 : 0;
    const ageGaussian = Math.exp(-Math.pow(ageDelta / 12, 2)) * 22;
    const ageScore = bandBonus + ageGaussian;

    // 3. Room affinity (20 pts max)
    const roomIdx = char.preferredRooms.indexOf(input.activeRoomId);
    const roomScore = roomIdx === 0 ? 20 : roomIdx === 1 ? 14 : roomIdx >= 2 ? 10 : 3;

    const rawScore = genderScore + ageScore + roomScore;
    const similarityPct = Math.round(clamp(55 + rawScore * 0.43, 60, 99));

    const matchReasonsFa: string[] = [];
    if (char.gender === input.gender) {
      matchReasonsFa.push(
        input.gender === 'female' ? 'تطابق کامل کاراکتر زنانه' : 'تطابق کامل کاراکتر مردانه'
      );
    }
    if (inBand || ageDelta <= 6) {
      matchReasonsFa.push(`تناسب سنی دقیق (${safeAge} سال ↔ ${char.canonicalAge} سال)`);
    }
    if (roomIdx >= 0) {
      matchReasonsFa.push(
        input.hub === 'cinema' ? 'هم‌راستا با ژانر و فضای سالن' : 'هماهنگ با حال‌وهوا و BPM اتاق'
      );
    }
    if (matchReasonsFa.length < 2) {
      matchReasonsFa.push(char.archetypeFa);
    }

    return {
      character: char,
      similarityPct,
      rawScore,
      ageDelta,
      matchReasonsFa: matchReasonsFa.slice(0, 3),
    };
  });

  scored.sort((a, b) => {
    if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
    if (a.ageDelta !== b.ageDelta) return a.ageDelta - b.ageDelta;
    return a.character.rank - b.character.rank;
  });

  return {
    topMatch: scored[0],
    runnerUps: scored.slice(1, 5),
    allRanked: scored,
    totalRosterCount: roster.length,
  };
}

export interface ParsedMediaSelfIntro {
  detectedGender: HologramGender | null;
  detectedAge: number | null;
  detectedName: string | null;
  detectedRoomId: CinemaRoomId | AudioRoomId | null;
  extractedTraitsFa: string[];
}

/**
 * Parses natural Persian/English self-intro prompts for Cinema & Music hubs,
 * extracting name, age (8..99), gender, personality cues, and room preferences.
 */
export function parseMediaSelfIntro(
  rawMessage: string,
  hub: MediaHubKind
): ParsedMediaSelfIntro {
  const base = parseUserSelfIntro(rawMessage);
  const lower = normalizeDigitsToAscii(rawMessage).trim().toLowerCase();

  let detectedRoomId: CinemaRoomId | AudioRoomId | null = null;
  if (hub === 'cinema') {
    if (/(?:انیمه|توکیو|ساکوگا|جیبلی|مانگا|anime|tokyo)/i.test(lower)) {
      detectedRoomId = 'anime';
    } else if (/(?:سریال|اپیزود|فصل|جنایی|پلات|series)/i.test(lower)) {
      detectedRoomId = 'series';
    } else if (/(?:مستند|طبیعت|کوهستان|تاریخ|واقعی|doc)/i.test(lower)) {
      detectedRoomId = 'documentary';
    } else if (/(?:تلویزیون|کلایمکس|رترو|دهه\s*۸۰|دهه\s*80|vhs|tv|retro)/i.test(lower)) {
      detectedRoomId = 'tv-climax';
    } else if (/(?:فیلم|سینما|نوآر|کلاسیک|اسکار|movie|noir)/i.test(lower)) {
      detectedRoomId = 'movie';
    }
  } else {
    if (/(?:تومارلند|فستیوال|ترنس|edm|tomorrowland|trance)/i.test(lower)) {
      detectedRoomId = 'tomorrowland';
    } else if (/(?:مایکل|جکسون|کنسرت|استادیوم|پاپ|mj|pop|concert)/i.test(lower)) {
      detectedRoomId = 'mj-concert';
    } else if (/(?:کتاب|صوتی|داستان|کتابخانه|اساسین|audiobook|library|story)/i.test(lower)) {
      detectedRoomId = 'ac-library';
    } else if (/(?:پادکست|گفتگو|میزگرد|راوی|podcast)/i.test(lower)) {
      detectedRoomId = 'podcast-studio';
    } else if (/(?:مدیتیشن|آرامش|خواب|امبینت|فرکانس|meditation|sleep)/i.test(lower)) {
      detectedRoomId = 'meditation';
    } else if (/(?:برلین|ریو|تکنو|الکترونیک|اسید|rave|techno|berlin)/i.test(lower)) {
      detectedRoomId = 'berlin-rave';
    } else if (/(?:کافه|وست‌ورلد|وستورلد|جاز|جز|بلوز|کانتری|پیانو|jazz|cafe)/i.test(lower)) {
      detectedRoomId = 'westworld-cafe';
    }
  }

  const traitsFa = [...base.extractedTraitsFa];
  if (hub === 'cinema') {
    if (/(?:نوآر|سیاه|کارآگاه|تاریک|noir)/i.test(lower)) traitsFa.push('شیفته فضای نوآر');
    if (/(?:تحلیل|فریم|کارگردان|اسپویل|تئوری)/i.test(lower)) traitsFa.push('نقاد دقیق فیلم');
    if (/(?:انیمه|ژاپن|خیال|سایبر|anime)/i.test(lower)) traitsFa.push('ساکوگا و سایبرپانک');
  } else {
    if (/(?:جاز|کافه|بلوز|کلاسیک|پیانو|آرام)/i.test(lower)) traitsFa.push('حس آکوستیک و جاز');
    if (/(?:ریو|تکنو|انرژی|فستیوال|بیس|تند|bpm)/i.test(lower)) traitsFa.push('پرانرژی و ریتم‌محور');
    if (/(?:کتاب|پادکست|داستان|مدیتیشن|تمرکز)/i.test(lower)) traitsFa.push('شنونده عمیق و کتاب‌باز');
  }

  return {
    detectedGender: base.detectedGender,
    detectedAge: base.detectedAge,
    detectedName: base.detectedName,
    detectedRoomId,
    extractedTraitsFa: Array.from(new Set(traitsFa)).slice(0, 3),
  };
}
