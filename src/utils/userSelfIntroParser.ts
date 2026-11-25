import type { CrossGameKey } from '../data/offlineAgentsData';
import type { HologramGender } from './hologramAvatarEngine';

export interface ParsedSelfIntro {
  detectedGender: HologramGender | null;
  detectedAge: number | null;
  detectedName: string | null;
  detectedGameKey: CrossGameKey | null;
  extractedTraitsFa: string[];
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function normalizeDigitsToAscii(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const pIdx = PERSIAN_DIGITS.indexOf(ch);
    if (pIdx >= 0) {
      out += String(pIdx);
      continue;
    }
    const aIdx = ARABIC_DIGITS.indexOf(ch);
    if (aIdx >= 0) {
      out += String(aIdx);
      continue;
    }
    out += ch;
  }
  return out;
}

const FEMALE_KEYWORDS = [
  'دختر',
  'دخترم',
  'دخترانه',
  'زن',
  'زنم',
  'خانم',
  'خانوم',
  'بانو',
  'female',
  'woman',
  'girl',
  'lady',
  'she',
  'her',
  'سارا',
  'مریم',
  'نازنین',
  'الناز',
  'نیلوفر',
  'تارا',
  'سحر',
  'زهرا',
  'فاطمه',
  'نگار',
  'مهسا',
  'آوا',
  'هستی',
  'یاسمن',
  'لارا',
];

const MALE_KEYWORDS = [
  'پسر',
  'پسرم',
  'پسرانه',
  'مرد',
  'مردم',
  'آقا',
  'آقای',
  'male',
  'man',
  'boy',
  'guy',
  'he',
  'him',
  'کیان',
  'علی',
  'رضا',
  'محمد',
  'امیر',
  'حسین',
  'آرش',
  'سروش',
  'ماهان',
  'پویا',
  'مهدی',
  'نیما',
  'آرتور',
];

/**
 * Extracts user identity cues (gender, age 8..99, name, favorite game, and personality tags)
 * directly from natural Persian or English self-introduction chat messages so the 3D character
 * morphs automatically without requiring manual sliders.
 */
export function parseUserSelfIntro(rawMessage: string): ParsedSelfIntro {
  const normalized = normalizeDigitsToAscii(rawMessage).trim();
  const lower = normalized.toLowerCase();

  // 1. Detect Age (8..99)
  let detectedAge: number | null = null;
  const agePatterns = [
    /(\d{1,2})\s*(?:ساله|سالمه|سالم|سال\s*دارم|سال|years?\s*old|yo\b|y\/o\b)/i,
    /(?:سنم|سن|age(?:\s*is)?)\s*[:：]?\s*(\d{1,2})\b/i,
  ];
  for (const rx of agePatterns) {
    const match = normalized.match(rx);
    if (match && match[1]) {
      const parsed = Number.parseInt(match[1], 10);
      if (parsed >= 8 && parsed <= 99) {
        detectedAge = parsed;
        break;
      }
    }
  }

  // 2. Detect Gender
  let femaleHits = 0;
  let maleHits = 0;
  for (const kw of FEMALE_KEYWORDS) {
    if (lower.includes(kw)) femaleHits += 1;
  }
  for (const kw of MALE_KEYWORDS) {
    if (lower.includes(kw)) maleHits += 1;
  }
  let detectedGender: HologramGender | null = null;
  if (femaleHits > maleHits) detectedGender = 'female';
  else if (maleHits > femaleHits) detectedGender = 'male';

  // 3. Detect Name (Persian or English self-intro patterns)
  let detectedName: string | null = null;
  const namePatterns = [
    /(?:اسمم|نامم|من)\s+([\u0600-\u06FF]{2,18})\s+(?:هستم|ام|هست)/i,
    /(?:اسمم|نامم)\s+([\u0600-\u06FF]{2,18})(?:\s|[،,.]|$)/i,
    /(?:i am|i'm|my name is)\s+([a-z]{2,18})(?:\s|[,.]|$)/i,
  ];
  const stopWords = new Set(['دختر', 'پسر', 'زن', 'مرد', 'عاشق', 'اهل', 'گیمر', 'بازیکن', 'یک', 'یه']);
  for (const rx of namePatterns) {
    const m = normalized.match(rx);
    if (m && m[1]) {
      const candidate = m[1].trim();
      if (!stopWords.has(candidate.toLowerCase()) && !/^\d+$/.test(candidate)) {
        detectedName = candidate;
        break;
      }
    }
  }

  // 4. Detect Favorite Game / Realm Affinity (all 11 registered game spaces + chess)
  let detectedGameKey: CrossGameKey | null = null;
  if (/(?:فوتبال|فیفا|fc\s*27|fc27|fifa|fut|پاس|گل)/i.test(lower)) {
    detectedGameKey = 'fc27';
  } else if (/(?:بسکتبال|nba|2k|پرو-ام)/i.test(lower)) {
    detectedGameKey = 'nba2k';
  } else if (/(?:فورتنایت|fortnite|fncs|بتل‌باس)/i.test(lower)) {
    detectedGameKey = 'fortnite';
  } else if (/(?:دوتا|dota|انشنت|میدلاین)/i.test(lower)) {
    detectedGameKey = 'dota2';
  } else if (/(?:فرمول|f1|ریسینگ|پیست|گرندپری)/i.test(lower)) {
    detectedGameKey = 'f1';
  } else if (/(?:وارزون|کالاف|warzone|cod|بتل\s*رویال)/i.test(lower)) {
    detectedGameKey = 'warzone';
  } else if (/(?:کانتر|cs2|csgo|counter|میراژ|mirage|ایم|کلچ|شوتر)/i.test(lower)) {
    detectedGameKey = 'cs2';
  } else if (/(?:جی\s*تی\s*ای|جی‌تی‌ای|gta|وایس\s*سیتی|کازینو|سرقت)/i.test(lower)) {
    detectedGameKey = 'gta';
  } else if (/(?:رد\s*دد|rdr2|آرتور|وسترن|کابوی)/i.test(lower)) {
    detectedGameKey = 'rdr2';
  } else if (/(?:اپکس|ایپکس|apex|ورایث)/i.test(lower)) {
    detectedGameKey = 'apex';
  } else if (/(?:ولورانت|والورانت|valorant|رادیانت|ایجنت|ریوت)/i.test(lower)) {
    detectedGameKey = 'valorant';
  } else if (/(?:شطرنج|chess|بلیتز|بولت|مات|استراتژی)/i.test(lower)) {
    detectedGameKey = 'chess';
  }

  // 5. Extract Clean Personality Trait Tags (Persian)
  const extractedTraitsFa: string[] = [];
  if (/(?:تهاجمی|سریع|کلچ|رقابتی|جنگجو|aggressive|clutch)/i.test(lower)) {
    extractedTraitsFa.push('سبک تهاجمی و کلچ');
  }
  if (/(?:استراتژ|تاکتیک|فکر|آرام|دقیق|شطرنج|tactical|calm)/i.test(lower)) {
    extractedTraitsFa.push('ذهن تاکتیکی و دقیق');
  }
  if (/(?:ماجراجو|خلاق|کاوش|آزاد|adventure|creative)/i.test(lower)) {
    extractedTraitsFa.push('روحیه ماجراجو و خلاق');
  }
  if (/(?:تیمی|رهبر|کاپیتان|پاس|رفیق|team|leader)/i.test(lower)) {
    extractedTraitsFa.push('رهبر و بازیکن تیمی');
  }

  return {
    detectedGender,
    detectedAge,
    detectedName,
    detectedGameKey,
    extractedTraitsFa,
  };
}
