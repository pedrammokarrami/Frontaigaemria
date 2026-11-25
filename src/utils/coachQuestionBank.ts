import type { LobbyGameId } from './lobbySkillCatalog';

/**
 * Massive question bank per game — combinatorially generated (thousands of
 * unique real-style questions per game), plus a curated starter list.
 * Powers the live suggestion box: as the user types, matching questions
 * surface automatically and are clickable.
 */

interface GameDomain {
  /** concrete subjects: maps, weapons, agents, mechanics… */
  subjects: string[];
  /** in-game contexts the subject can live in */
  contexts: string[];
  /** Persian intent templates — `{s}` = subject, `{c}` = context, `{m}` = modifier */
  intents: string[];
  /** quality/skill modifiers */
  modifiers: string[];
  /** high-value curated starters shown before typing */
  starters: string[];
}

const FC_DOMAIN: GameDomain = {
  subjects: [
    'فرماسیون ۴-۲-۳-۱', 'فرماسیون ۴-۳-۳', 'فرماسیون ۳-۵-۲', 'فرماسیون ۴-۲-۱-۳',
    'شوت فینس', 'شوت از راه دور', 'ضرب آزاد', 'هریک سرزنی', 'ضرب ایستگاهی', 'دبل‌س', 'پنالتی', 'کرنر', 'پاس عمقی', 'پاس کوتاه',
    'دیبل درابل', 'دابل‌اسکیل', 'روанای جلو', 'بازیکن مترایال', 'SBC', 'پک‌ها', 'مارکت انتقالات',
    'دفاع عمقی', 'فشار بالا', 'پرس', 'آفساید تله', 'درِوازه‌بان', 'مهاجم نوک', 'وینگر',
    'هافبک دفاعی', 'کنج آرنا', 'تیم پرس', 'تکنیک فلیر', 'چمیون شپ', 'فینال چهار',
  ],
  contexts: ['تو حریف قوی', 'تو رند آخر', 'با باد پشت سر', 'با خستگی بازیکن‌ها', 'تو باران', 'بعد از پچ جدید', 'تو کول‌داون', 'با تیم دفاعی', 'با تیم جوان', 'با کاپیتان'],
  intents: [
    '{s} رو چطور بهتر کنم؟', '{s} کی بهتره؟', 'بهترین تنظیمات {s} چیه؟', '{s} کجا باید استفاده کنم؟',
    'چرا {s} جواب نمی‌ده؟', 'بهترین ترفند {s} چیه؟', '{s} رو چطور تمرین کنم؟', 'بهترین کامبو با {s} چیه؟',
    'با {s} چطور پیشرفت کنم؟', 'بهترین {s} چیه؟', '{s} تو {c} چطور بزنم؟', 'بهترین {s} برای {c} چیه؟',
    '{s} {m} چطور استفاده می‌شه؟', 'برای {m}، {s} چطور بذارم؟',
  ],
  modifiers: ['برای مبتدی', 'برای رنک بالا', 'حرفه‌ای', 'سریع', 'با کمترین هزینه', 'بدون کمیسیون'],
  starters: [
    'بهترین ترکیب فرماسیون برای فشار بالاست؟',
    'کی شوت بزنم تا گیر نکنه؟',
    'بهترین حالت درست کردن SBC چیه؟',
    'چه بازیکن‌هایی بعد از پچ آپدیت شدن؟',
    'دفاع عمق ۷۱ بهتره یا فشار ۸۰؟',
    'چطور پاس عمقی دقیق بدم؟',
  ],
};

const CS_DOMAIN: GameDomain = {
  subjects: [
    'ایم', 'کروس‌هیر', 'فلش‌شات', 'اسموک میراژ', 'اسموک اینفرنو', 'اسموک داست ۲', 'مولوتوف',
    'کانتر-استرِیف', 'پکینگ', 'ریتِیک', 'اکونومی راند', 'فورس بای', 'AWP', 'AK-47', 'M4A4',
    'پیک واتر', 'کراس‌فایر', 'دیفیوز', 'بومب سایت A', 'بومب سایت B', 'مید', 'لیفت', 'راش B',
    'اسلو راند', 'تریک بوتر', 'نیف راند', 'هاوک-ای', 'ونتیج پوزیشن',
  ],
  contexts: ['دور میراژ', 'دور اینفرنو', 'دور نیکی', 'دور داست ۲', 'تو رند اکو', 'تو کلانچ ۱v۲', 'تو پست‌پلنت', 'با سگک', 'با تیم‌میت بی‌سیم', 'بعد از پچ'],
  intents: [
    '{s} رو چطور بهتر کنم؟', 'بهترین روش {s} چیه؟', '{s} کجا بذارم؟', '{s} رو کی باید بزنم؟',
    'چرا {s} خطا می‌زنه؟', 'بهترین تمرین {s} چیه؟', '{s} رو چطور اجرا کنم؟', 'بهترین پوزیشن {s} چیه؟',
    'با {s} چطور دفاع کنم؟', 'بهترین استراتژی {s} چیه؟', '{s} تو {c} چطور بذارم؟', 'بهترین {s} برای {c} چیه؟',
    '{s} {m} چطوره؟', 'برای {m}، {s} رو چطور بزنم؟',
  ],
  modifiers: ['برای مبتدی', 'برای لول فیس', 'حرفه‌ای', 'سریع', 'بدون بت', 'تو پینگ بالا'],
  starters: [
    'چطور ایمم رو بهتر کنم؟',
    'کروس‌هیر کجا بذارم که سریع هدشات بزنم؟',
    'اکونومی روند درست چیه؟',
    'اسموک درست وسایت چطوری اجرا کنم؟',
    'کانتر-استرِیف دقیقاً چیه؟',
    'چطور پرس حریف رو بشکنم؟',
  ],
};

const VALORANT_DOMAIN: GameDomain = {
  subjects: [
    'ویکچر', 'جت', 'سیفر', 'اومن', 'کیو', 'ریز', 'اسموک هایندر', 'فلش لاین', 'سایت A اتک', 'سایت B اتک',
    'مید کنترل', 'ایم روتین', 'اکونومی راند', 'اسپایک پلنت', 'پست‌پلنت دیفنس', 'ریتِیک', 'کلانچ',
    'اپراتور', 'واندال', 'فانتوم', 'شریف', 'چمبر لوداوت', 'جیت دشف', 'سایفر کم',
  ],
  contexts: ['دور هایندر', 'دور اسپلیت', 'دور بایند', 'دور اسینت', 'تو راند گان', 'تو کلانچ ۱v۳', 'تو اکو راند', 'با تیم‌میت‌های رندوم', 'بعد از پچ جدید'],
  intents: [
    'بهترین لوداوت {s} چیه؟', '{s} رو چطور بهتر کنم؟', '{s} کجا بندازم؟', '{s} رو کی باید استفاده کنم؟',
    'بهترین روش اجرای {s} چیه؟', '{s} رو چطور تمرین کنم؟', 'بهترین پوزیشن {s} چیه؟',
    'با {s} چطور کلانچ ببرم؟', 'بهترین استراتژی {s} تو راند آخر چیه؟',
    '{s} تو {c} چطور اجرا شه؟', 'بهترین {s} برای {c} چیه؟', '{s} {m} چطوره؟', 'برای {m}، {s} رو چیکار کنم؟',
  ],
  modifiers: ['برای مبتدی', 'برای رنک امرالد', 'حرفه‌ای', 'با کمترین هزینه', 'تو پینگ بالا'],
  starters: [
    'بهترین لوداوت ویکچر برای سایت A؟',
    'اسموک هایندر چطوری بندازم؟',
    'سایت A اتک چطور اجرا شه؟',
    'ایم ترینگ روزانه چیه؟',
    'اکونومی راند چطور مدیریت شه؟',
    'بهترین ایجنت برای دیفنس کدومه؟',
  ],
};

const GTA_DOMAIN: GameDomain = {
  subjects: [
    'هیست کاسینو', 'هیست پاسیفیک', 'کازینو دیامند', 'VIP مأموریت', 'بیزینس بیکری', 'آپارات مِت',
    'بایک ران', 'تعقیب پلیس', '۵ ستاره', 'پول سریع', 'بهترین ماشین', 'رانندگی دراماتیک',
    'کشتن سریع', 'هیلی‌کوپتر', 'تایتان', 'کِیو مأموریت', 'تیل‌بیلدینگ', 'راکستار سوشیال کلاب',
  ],
  contexts: ['تو آنلاین', 'با دو تا دوست', 'تو سرور پر', 'با کمدی بازیکن', 'تو شب', 'بعد از آپدیت'],
  intents: [
    '{s} رو چطور انجام بدم؟', 'بهترین روش {s} چیه؟', 'با {s} چطور پول جمع کنم؟', '{s} کجا پناه بگیرم؟',
    'بهترین مسیر {s} چیه؟', 'با {s} چطور زنده بمونم؟', 'بهترین استراتژی {s} چیه؟',
    'با {s} چطور سریع پیشرفت کنم؟', '{s} تو {c} چطور انجام بدم؟', 'بهترین {s} برای {c} چیه؟',
    '{s} {m} چطوره؟', 'برای {m}، {s} رو چیکار کنم؟',
  ],
  modifiers: ['برای مبتدی', 'برای لون وولف', 'با تیم', 'بدون سپند'],
  starters: [
    'هیست کاسینو چطوری انجام بدم؟',
    'چطور سریع پول جمع کنم؟',
    'کجا پناه بگیرم وقتی ۵ ستاره شدم؟',
    'بهترین ماشین برای تعقیب؟',
  ],
};

/** English mirror domains — full English suggestion coverage in English UI mode. */
const EN_DOMAINS: Record<LobbyGameId, GameDomain> = {
  fc27: {
    subjects: [
      '4-2-3-1 formation', '4-3-3 formation', '3-5-2 formation', '4-2-1-3 formation',
      'finesse shot', 'long shot', 'free kick', 'header', 'set piece', 'double S', 'penalty', 'corner', 'through pass', 'short pass',
      'dribbling', 'double skill', 'running forward', 'meta player', 'SBC', 'packs', 'transfer market',
      'low block defense', 'high press', 'press', 'offside trap', 'goalkeeper', 'striker', 'winger',
      'defensive midfielder', 'arena corner', 'pressing team', 'flair technique', 'championship', 'final four',
    ],
    contexts: ['vs a strong opponent', 'in the last round', 'with wind behind you', 'with player fatigue', 'in the rain', 'after the new patch', 'on cooldown', 'with a defensive team', 'with a young squad', 'with the captain'],
    intents: [
      'How do I improve {s}?', 'When is {s} better?', 'What are the best settings for {s}?', 'Where should I use {s}?',
      'Why does {s} not work?', 'What is the best trick for {s}?', 'How do I practice {s}?', 'What is the best combo with {s}?',
      'How do I progress with {s}?', 'What is the best {s}?', 'How do I use {s} in {c}?', 'What is the best {s} for {c}?',
      'How is {s} used {m}?', 'For {m}, how do I set up {s}?',
    ],
    modifiers: ['for beginners', 'for high ranks', 'like a pro', 'fast', 'at the lowest cost'],
    starters: [
      'What is the best formation for high press?',
      'When should I shoot so it lands?',
      'What is the best way to complete SBCs?',
      'Which players got updated after the patch?',
      'Is depth 71 defense better or press 80?',
      'How do I play precise through balls?',
    ],
  },
  cs2: {
    subjects: [
      'crosshair placement', 'flash', 'Mirage smoke', 'Inferno smoke', 'Dust 2 smoke', 'Molotov',
      'counter-strafe', 'peeking', 'retake', 'eco round economy', 'force buy', 'AWP', 'AK-47', 'M4A4',
      'peek advantage', 'crossfire', 'defuse', 'A site', 'B site', 'mid', 'lift', 'B rush',
      'slow round', 'aim trainer', 'knife round', 'hawk-eye', 'vintage position',
    ],
    contexts: ['on Mirage', 'on Inferno', 'on Nuke', 'on Dust 2', 'in an eco round', 'in a 1v2 clutch', 'on post-plant', 'with your team', 'after the patch'],
    intents: [
      'How do I improve {s}?', 'What is the best method for {s}?', 'Where do I place {s}?', 'When should I hit {s}?',
      'Why does my {s} fail?', 'What is the best practice for {s}?', 'How do I execute {s}?', 'What is the best position for {s}?',
      'How do I defend with {s}?', 'What is the best strategy for {s}?', 'How do I use {s} in {c}?', 'What is the best {s} for {c}?',
    ],
    modifiers: ['for beginners', 'for high ranks', 'like a pro', 'fast'],
    starters: [
      'Where should I place my crosshair for fast headshots?',
      'What is the right economy rule?',
      'How do I smoke mid correctly?',
      'What exactly is counter-strafing?',
      'How do I break the enemy press?',
    ],
  },
  valorant: {
    subjects: [
      'Jett', 'Omen', 'Sova dart', 'Astra wall', 'Viper smoke', 'Recon bolt',
      'crosshair placement', 'flick shot', 'recoil', 'smurf', 'entry fragging', 'ecology',
    ],
    contexts: ['on Ascent', 'on Bind', 'on Haven', 'in a save round', 'in a clutch'],
    intents: [
      'How do I improve {s}?', 'What is the best method for {s}?', 'Where do I place {s}?', 'When should I use {s}?',
      'What is the best practice for {s}?', 'What is the best position for {s}?', 'How do I use {s} in {c}?',
    ],
    modifiers: ['for beginners', 'for high ranks', 'like a pro'],
    starters: [
      'Where should my crosshair be on Ascent mid?',
      'How do I line up Recon bolts on Haven?',
      'What is the right save-round buy?',
    ],
  },
  gta: {
    subjects: [
      'Cayo Perico heist', 'Diamond Casino heist', 'Vault, and poker', 'Kosatka', 'Sparrow', 'Nightclub',
      'MC business', 'bunker', 'cargo warehouse', 'VIP work', 'Oppressor Mk II',
    ],
    contexts: ['solo', 'with a full crew', 'on hard mode', 'in a public lobby', 'after the patch'],
    intents: [
      'How do I run the {s} {c}?', 'What is the best setup for the {s}?', 'How much does the {s} pay {c}?',
      'What is the fastest method for the {s}?', 'How do I start the {s} {c}?',
    ],
    modifiers: ['for beginners', 'fast', 'like a pro'],
    starters: [
      'What is the fastest Cayo Perico approach solo?',
      'Which heist pays best after the patch?',
      'How do I buy the best nightclub location?',
    ],
  },
};

const DOMAINS: Record<LobbyGameId, GameDomain> = {
  fc27: FC_DOMAIN,
  cs2: CS_DOMAIN,
  valorant: VALORANT_DOMAIN,
  gta: GTA_DOMAIN,
};

interface IndexedQuestion {
  q: string;
  hay: string;
  tokens: string[];
}

const BANKS: Record<string, IndexedQuestion[]> = {};
const STARTERS: Record<string, string[]> = {};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064A\u0649]/g, 'ی')
    .replace(/[\u0643]/g, 'ک')
    .replace(/[\u0622\u0623\u0625]/g, 'ا')
    .replace(/[\u200c\u200f\u200e]/g, ' ')
    .replace(/[؟?.,،!!:؛]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(hay: string): string[] {
  return hay.split(' ').filter((t) => t.length >= 3);
}

function buildBankFrom(domain: GameDomain): { bank: IndexedQuestion[]; starters: string[] } {
  const seen = new Set<string>();
  const bank: IndexedQuestion[] = [];
  const push = (q: string) => {
    const hay = normalize(q);
    if (seen.has(hay) || hay.length < 8) return;
    seen.add(hay);
    bank.push({ q, hay, tokens: tokenize(hay) });
  };
  domain.starters.forEach(push);
  const fill = (tpl: string, subject: string, context: string, modifier: string): string =>
    tpl.replace(/\{s\}/g, subject).replace(/\{c\}/g, context).replace(/\{m\}/g, modifier);
  for (const subject of domain.subjects) {
    for (const intent of domain.intents) {
      const needsContext = intent.includes('{c}');
      const needsModifier = intent.includes('{m}');
      if (!needsContext && !needsModifier) {
        push(fill(intent, subject, domain.contexts[0], domain.modifiers[0]));
        continue;
      }
      const poolC = needsContext ? domain.contexts : [domain.contexts[0]];
      const poolM = needsModifier ? domain.modifiers : [domain.modifiers[0]];
      for (const c of poolC) {
        for (const m of poolM) {
          push(fill(intent, subject, c, m));
        }
      }
    }
  }
  return { bank, starters: domain.starters };
}

function bankFor(gameId: LobbyGameId, lang: string = 'fa'): { bank: IndexedQuestion[]; starters: string[] } {
  const key = `${gameId}::${lang.slice(0, 2)}`;
  if (!BANKS[key]) {
    const domain = lang.slice(0, 2) === 'fa' ? DOMAINS[gameId] : EN_DOMAINS[gameId];
    const built = buildBankFrom(domain);
    BANKS[key] = built.bank;
    STARTERS[key] = built.starters;
  }
  return { bank: BANKS[key], starters: STARTERS[key] };
}

/** Live suggestions: direct word hits ranked; the game whose bank covers MOST of
 *  the typed tokens wins (typing «فرماسیون» inside shooter → football questions).
 *  Off-topic typing falls back to the current game's curated starters. */
export function suggestCoachQuestions(query: string, gameId: LobbyGameId, limit = 8, lang = 'fa'): string[] {
  const gameIds = Object.keys(DOMAINS) as LobbyGameId[];
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return bankFor(gameId, lang).starters.slice(0, limit);
  const tokens = tokenize(normalizedQuery);
  if (tokens.length === 0) return bankFor(gameId, lang).starters.slice(0, limit);

  const rankBank = (bank: IndexedQuestion[]) => {
    const scored: { q: string; score: number; coverage: number }[] = [];
    for (const entry of bank) {
      let score = 0;
      let coverage = 0;
      for (const token of tokens) {
        if (entry.hay.includes(token)) {
          score += 3;
          coverage += 1;
        } else if (entry.tokens.some((w) => w.startsWith(token.slice(0, 4)) || token.startsWith(w.slice(0, 4)))) {
          score += 1;
        }
      }
      if (score > 0) scored.push({ q: entry.q, score, coverage });
    }
    scored.sort((a, b) => b.score - a.score || a.q.length - b.q.length);
    return scored;
  };

  // Pick the game bank with the best token coverage (current game wins ties).
  let best: { gameId: LobbyGameId; scored: ReturnType<typeof rankBank>; coverage: number } | null = null;
  for (const g of [gameId, ...gameIds.filter((x) => x !== gameId)]) {
    const scored = rankBank(bankFor(g, lang).bank);
    const coverage = Math.max(0, ...scored.map((s) => s.coverage));
    if (coverage > (best?.coverage ?? 0)) best = { gameId: g, scored, coverage };
    if (g === gameId && coverage > 0 && (best?.gameId ?? g) === g && coverage === best?.coverage && coverage >= tokens.length) break; // full coverage locally — stop early
  }
  if (!best || best.scored.length === 0) return bankFor(gameId, lang).starters.slice(0, limit);
  const { starters } = bankFor(best.gameId, lang);
  const result = best.scored.slice(0, limit).map((e) => e.q);
  for (const s of starters) {
    if (result.length >= limit) break;
    if (!result.includes(s)) result.push(s);
  }
  return result;
}
