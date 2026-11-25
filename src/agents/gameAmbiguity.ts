
/**
 * Game-ambiguity detection — when a question could belong to multiple games
 * (e.g. «بهترین ترکیب بارسا» → FC 27 or eFootball), the engine must ASK which
 * game instead of guessing. Everything multi-option surfaces as clickable choices.
 */

interface GameAlias {
  gameId: string;
  labelFa: string;
  labelEn?: string;
  icon: string;
  patterns: RegExp[];
  /** domains that imply this game even without an explicit alias */
  domains?: RegExp[];
}

const GAME_ALIASES: GameAlias[] = [
  { gameId: 'fc27', labelFa: 'FC 27', labelEn: 'FC 27', icon: '⚽', patterns: [/fc ?2[0-9]/i, /fifa/i, /\bفی\b/, /فیفا/], domains: [/هریک/, /فرماسیون/, /ترکیب/, /SBC|اس ?بی ?سی/i, /پنالتی/, /کرنر/, /فینس/, /اولتیمیت ?تیم/i] },
  { gameId: 'efootball', labelFa: 'eFootball', labelEn: 'eFootball', icon: '⚽', patterns: [/e ?football/i, /pes/i, /ای ?فوتبال/], domains: [/فرماسیون/, /ترکیب/, /بارسا|رئال مادرید|لیورپول|یوونتوس|بایرن|پی ?اس ?جی/] },
  { gameId: 'nba2k', labelFa: 'NBA 2K', labelEn: 'NBA 2K', icon: '🏀', patterns: [/nba ?2?k?\d?/i, /ان ?بی ?ای/], domains: [/دانک/, /سه ?امتیازی/, /پارک/] },
  { gameId: 'mlb', labelFa: 'MLB The Show', labelEn: 'MLB The Show', icon: '⚾', patterns: [/mlb/i, /بیسبال/] },
  { gameId: 'cs2', labelFa: 'CS2', labelEn: 'CS2', icon: '🎯', patterns: [/cs ?2/i, /کانتر/i, /counter ?strike/i], domains: [/اسموک/, /ایم/, /کروس ?هیر/, /AK/i, /AWP/i, /اکونومی/, /لوداوت/] },
  { gameId: 'valorant', labelFa: 'Valorant', labelEn: 'Valorant', icon: '🎯', patterns: [/valorant/i, /ولورانت/], domains: [/ویکچر/, /اسپایک/, /ایجنت/, /ایم/, /لوداوت/] },
  { gameId: 'cod', labelFa: 'Call of Duty', labelEn: 'Call of Duty', icon: '🎯', patterns: [/call of duty/i, /\bcod\b/i, /کالاف|کال ?اوب ?دیوتی/, /warzone/i], domains: [/لوداوت/, /اتچمنت/] },
  { gameId: 'f1-25', labelFa: 'F1 25', labelEn: 'F1 25', icon: '🏎️', patterns: [/f1 ?2?5?/i, /فرمول یک/i], domains: [/ستاپ/, /پیت/] },
  { gameId: 'dota2', labelFa: 'Dota 2', labelEn: 'Dota 2', icon: '🧠', patterns: [/dota ?2?/i, /دوتا/], domains: [/روشن/, /وارد/] },
  { gameId: 'elden-ring', labelFa: 'Elden Ring', icon: '⚔️', patterns: [/elden ?ring/i, /الدن ?رینگ/] },
  { gameId: 'gta', labelFa: 'GTA', icon: '🌆', patterns: [/gta/i, /جی ?تی ?ای/], domains: [/هیست/, /کاسینو/, /پنج ?ستاره/] },
  { gameId: 'roblox', labelFa: 'Roblox', icon: '🧱', patterns: [/roblox/i, /رابلاکس/], domains: [/obbie/, /بروکهاون/] },
  { gameId: 'minecraft', labelFa: 'Minecraft', icon: '⛏️', patterns: [/minecraft/i, /ماینکرفت/], domains: [/کرفت/] },
  { gameId: 'fortnite', labelFa: 'Fortnite', icon: '🪂', patterns: [/fortnite/i, /فورتنایت/] },
  { gameId: 'genshin', labelFa: 'Genshin Impact', icon: '🌋', patterns: [/genshin/i, /GENSHIN/, /گنشین/] },
  { gameId: 'baldur-s-gate-3', labelFa: "Baldur's Gate 3", icon: '🐉', patterns: [/baldur/i, /بالدور/] },
  { gameId: 'apex-legends', labelFa: 'Apex Legends', icon: '🎯', patterns: [/apex/i, /اپکس/] },
  { gameId: 'cyberpunk-2077', labelFa: 'Cyberpunk 2077', icon: '🌃', patterns: [/cyberpunk/i, /سایبرپانک/] },
  { gameId: 'rocket-league', labelFa: 'Rocket League', icon: '🚗', patterns: [/rocket ?league/i, /راکت ?لیگ/] },
  { gameId: 'league-of-legends', labelFa: 'League of Legends', icon: '🧠', patterns: [/league of legends/i, /لول|لئجندز/i] },
];

export interface GameChoice {
  gameId: string;
  labelFa: string;
  icon: string;
  reason: 'explicit' | 'domain';
}

export interface AmbiguityResult {
  ambiguous: boolean;
  /** the single game when unambiguous (null when truly unknown) */
  resolvedGameId: string | null;
  candidates: GameChoice[];
}

export function detectGameAmbiguity(query: string): AmbiguityResult {
  const q = query.toLowerCase();
  const explicit: GameChoice[] = [];
  const domain: GameChoice[] = [];
  for (const alias of GAME_ALIASES) {
    if (alias.patterns.some((p) => p.test(q))) {
      explicit.push({ gameId: alias.gameId, labelFa: alias.labelFa, icon: alias.icon, reason: 'explicit' });
    } else if ((alias.domains ?? []).some((p) => p.test(q))) {
      domain.push({ gameId: alias.gameId, labelFa: alias.labelFa, icon: alias.icon, reason: 'domain' });
    }
  }
  if (explicit.length === 1) {
    return { ambiguous: false, resolvedGameId: explicit[0].gameId, candidates: explicit };
  }
  if (explicit.length === 0 && domain.length === 1) {
    return { ambiguous: false, resolvedGameId: domain[0].gameId, candidates: domain };
  }
  // multiple explicit OR (no explicit but multiple domains) → ASK the user
  const merged = [...explicit, ...domain.filter((d) => !explicit.some((e) => e.gameId === d.gameId))];
  if (merged.length >= 2) {
    return { ambiguous: true, resolvedGameId: null, candidates: merged.slice(0, 4) };
  }
  // single domain match with no explicit → unambiguous enough
  if (merged.length === 1) {
    return { ambiguous: false, resolvedGameId: merged[0].gameId, candidates: merged };
  }
  return { ambiguous: false, resolvedGameId: null, candidates: [] };
}
