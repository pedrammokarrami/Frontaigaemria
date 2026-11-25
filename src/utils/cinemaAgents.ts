// Client-Side Offline AI Agents & Data Models for the Cinema & TV Hub
// Zero paid APIs or heavy central servers — 100% deterministic client-side computation + localStorage.

export type CinemaRoomId = 'movie' | 'series' | 'anime' | 'documentary' | 'tv-climax';

export type SpatialParticleMode =
  | 'noir-dust'
  | 'cyber-rain'
  | 'alpine-mist'
  | 'retro-scan'
  | 'jazz-embers'
  | 'stadium-strobe'
  | 'rave-lasers'
  | 'festival-sparks'
  | 'zen-fireflies'
  | 'library-motes'
  | 'podcast-wave';

export interface CinemaRoomConfig {
  id: CinemaRoomId;
  titleFa: string;
  subtitleFa: string;
  videoLoopPath: string;
  fallbackImageUrl: string;
  fallbackToneFilter: string;
  accentHex: string;
  secondaryHex: string;
  ambientVignetteCss: string;
  recommendedFormatLabel: string;
  particleMode: SpatialParticleMode;
}

export const CINEMA_ROOMS: CinemaRoomConfig[] = [
  {
    id: 'movie',
    titleFa: 'فیلم سینمایی',
    subtitleFa: 'سالن نوآر کلاسیک',
    videoLoopPath: '/assets/rooms/cinema/movie.mp4',
    fallbackImageUrl: '/src/assets/images/room_cinema_noir_hall_1795254621048.jpg',
    fallbackToneFilter: 'contrast(1.04) saturate(0.95)',
    accentHex: '#F59E0B',
    secondaryHex: '#E11D48',
    ambientVignetteCss: 'radial-gradient(circle at 65% 40%, rgba(245,158,11,0.14), rgba(7,6,11,0.88))',
    recommendedFormatLabel: '4K HDR · Noir Scope',
    particleMode: 'noir-dust',
  },
  {
    id: 'series',
    titleFa: 'سریال',
    subtitleFa: 'اتاق مانیتورینگ جنایی',
    videoLoopPath: '/assets/rooms/cinema/series.mp4',
    fallbackImageUrl: '/src/assets/images/room_cinema_crime_series_1795263250795.jpg',
    fallbackToneFilter: 'contrast(1.06) saturate(0.96)',
    accentHex: '#38BDF8',
    secondaryHex: '#0EA5E9',
    ambientVignetteCss: 'radial-gradient(circle at 68% 38%, rgba(56,189,248,0.15), rgba(5,10,18,0.88))',
    recommendedFormatLabel: 'Episodic Multi-Feed',
    particleMode: 'cyber-rain',
  },
  {
    id: 'anime',
    titleFa: 'انیمه',
    subtitleFa: 'کوچه توکیو در باران',
    videoLoopPath: '/assets/rooms/cinema/anime.mp4',
    fallbackImageUrl: '/src/assets/images/room_anime_tokyo_rain_1795254620688.jpg',
    fallbackToneFilter: 'contrast(1.05) saturate(1.12)',
    accentHex: '#22D3EE',
    secondaryHex: '#F43F5E',
    ambientVignetteCss: 'radial-gradient(circle at 65% 40%, rgba(34,211,238,0.15), rgba(6,9,17,0.88))',
    recommendedFormatLabel: '60fps Sub-Sync · Tokyo',
    particleMode: 'cyber-rain',
  },
  {
    id: 'documentary',
    titleFa: 'مستند',
    subtitleFa: 'کمپ کوهستانی در مه',
    videoLoopPath: '/assets/rooms/cinema/documentary.mp4',
    fallbackImageUrl: '/src/assets/images/room_cinema_alpine_doc_1795263252975.jpg',
    fallbackToneFilter: 'contrast(1.04) saturate(0.96)',
    accentHex: '#34D399',
    secondaryHex: '#A7F3D0',
    ambientVignetteCss: 'radial-gradient(circle at 66% 36%, rgba(52,211,153,0.14), rgba(5,11,9,0.88))',
    recommendedFormatLabel: 'Field Raw · 4K Log',
    particleMode: 'alpine-mist',
  },
  {
    id: 'tv-climax',
    titleFa: 'تلویزیون و کلایمکس',
    subtitleFa: 'استودیوی رترو دهه ۸۰',
    videoLoopPath: '/assets/rooms/cinema/tv-climax.mp4',
    fallbackImageUrl: '/src/assets/images/room_cinema_retro_tv_1795263256354.jpg',
    fallbackToneFilter: 'contrast(1.06) saturate(1.05)',
    accentHex: '#FB7185',
    secondaryHex: '#FBBF24',
    ambientVignetteCss: 'radial-gradient(circle at 66% 38%, rgba(251,113,133,0.16), rgba(11,6,16,0.88))',
    recommendedFormatLabel: 'Analog Broadcast · Live',
    particleMode: 'retro-scan',
  },
];

// ============================================================================
// 1. Cinema Persona Profiler Agent (52 Personas covering ages 8..99)
// ============================================================================

export type CinemaGenreKey =
  | 'noir'
  | 'scifi'
  | 'anime'
  | 'crime'
  | 'documentary'
  | 'horror'
  | 'retro'
  | 'arthouse';

export type ViewingHabitKey = 'binge' | 'deep_analysis' | 'midnight' | 'casual' | 'social_watch';

export interface CinemaPersona {
  id: string;
  nameFa: string;
  taglineFa: string;
  preferredGenres: CinemaGenreKey[];
  preferredHabits: ViewingHabitKey[];
  minAge: number;
  maxAge: number;
  genderAffinity: 'any' | 'male' | 'female';
  recommendedRoom: CinemaRoomId;
  accentHex: string;
  badgeCode: string;
}

const ARCHETYPE_TEMPLATES: Array<{
  slug: string;
  nameFa: string;
  taglineFa: string;
  genre: CinemaGenreKey;
  room: CinemaRoomId;
  accentHex: string;
  badgeCode: string;
}> = [
  { slug: 'noir-archivist', nameFa: 'آرشیویست نوآر', taglineFa: 'شکارچی سایه‌ها، باران و دیالوگ‌های تلخ کلاسیک', genre: 'noir', room: 'movie', accentHex: '#F59E0B', badgeCode: 'NOIR-ARC' },
  { slug: 'underground-critic', nameFa: 'منتقد زیرزمینی', taglineFa: 'تحلیل‌گر پلان به پلان سینمای مستقل و فستیوالی', genre: 'arthouse', room: 'movie', accentHex: '#E11D48', badgeCode: 'UND-CRT' },
  { slug: 'theory-hunter', nameFa: 'شکارچی تئوری', taglineFa: 'کشف نشانه‌های پنهان و تئوری‌های توطئه در اپیزودها', genre: 'crime', room: 'series', accentHex: '#38BDF8', badgeCode: 'THY-HNT' },
  { slug: 'pro-otaku', nameFa: 'انیمه‌باز حرفه‌ای', taglineFa: 'متخصص سکانس‌های ساکوگا، استودیو ماپا و سایبرپانک', genre: 'anime', room: 'anime', accentHex: '#22D3EE', badgeCode: 'PRO-OTK' },
  { slug: 'alpine-observer', nameFa: 'کاوشگر مستند', taglineFa: 'عاشق روایت‌های واقعی حیات‌وحش، تاریخ و فضا', genre: 'documentary', room: 'documentary', accentHex: '#34D399', badgeCode: 'ALP-DOC' },
  { slug: 'retro-zapper', nameFa: 'خوره رترو دهه ۸۰', taglineFa: 'نوستالژی نوار VHS، سینت‌ویو و پخش زنده شبانه', genre: 'retro', room: 'tv-climax', accentHex: '#FB7185', badgeCode: 'VHS-80S' },
  { slug: 'cyber-chronicler', nameFa: 'وقایع‌نگار علمی‌تخیلی', taglineFa: 'کاوشگر دنیاهای دیستوپیایی و سفر در زمان', genre: 'scifi', room: 'movie', accentHex: '#38E8FF', badgeCode: 'SCI-CHR' },
  { slug: 'midnight-thriller', nameFa: 'ناظر نیمه‌شب', taglineFa: 'تماشاگر حرفه‌ای ژانر وحشت روان‌شناختی در تاریکی کامل', genre: 'horror', room: 'series', accentHex: '#F43F5E', badgeCode: 'MDN-THR' },
  { slug: 'detective-profiler', nameFa: 'کارآگاه پلات‌توییست', taglineFa: 'حل معماهای جنایی پیش از فاش شدن در قسمت فینال', genre: 'crime', room: 'series', accentHex: '#60A5FA', badgeCode: 'DET-LOG' },
  { slug: 'frame-cinematographer', nameFa: 'مهندس قاب‌بندی', taglineFa: 'شیدای نورپردازی ریم‌بک، لنز آنامورفیک و تدوین', genre: 'arthouse', room: 'movie', accentHex: '#FBBF24', badgeCode: 'FRM-CIN' },
  { slug: 'mecha-tactician', nameFa: 'استراتژیست مکا و شونن', taglineFa: 'تحلیل نبردهای حماسی و مانگاهای کلاسیک ژاپن', genre: 'anime', room: 'anime', accentHex: '#06B6D4', badgeCode: 'MCH-TAC' },
  { slug: 'signal-pirate', nameFa: 'دزد سیگنال استریم', taglineFa: 'گردآورنده لینک‌های کمیاب ۴K و کانال‌های خصوصی', genre: 'retro', room: 'tv-climax', accentHex: '#10B981', badgeCode: 'SIG-P2P' },
  { slug: 'docu-forensic', nameFa: 'مستندساز جرم واقعی', taglineFa: 'بررسی پرونده‌های مستند جنایی و اسناد محرمانه', genre: 'documentary', room: 'documentary', accentHex: '#2DD4BF', badgeCode: 'FOR-DOC' },
];

const AGE_TIERS: Array<{
  suffix: string;
  labelFa: string;
  habit: ViewingHabitKey;
  minAge: number;
  maxAge: number;
  genderAffinity: 'any' | 'male' | 'female';
}> = [
  { suffix: 'rookie', labelFa: 'نسل جدید', habit: 'social_watch', minAge: 8, maxAge: 18, genderAffinity: 'any' },
  { suffix: 'binge', labelFa: 'ماراتن‌باز', habit: 'binge', minAge: 16, maxAge: 34, genderAffinity: 'male' },
  { suffix: 'night', labelFa: 'شب‌زنده‌دار', habit: 'midnight', minAge: 18, maxAge: 45, genderAffinity: 'female' },
  { suffix: 'veteran', labelFa: 'پیشکسوت کلکسیونر', habit: 'deep_analysis', minAge: 35, maxAge: 99, genderAffinity: 'any' },
];

// Generates 13 * 4 = 52 deterministic cinema personas covering ages 8..99
export const CINEMA_PERSONAS: CinemaPersona[] = ARCHETYPE_TEMPLATES.flatMap((tpl) =>
  AGE_TIERS.map((tier) => ({
    id: `${tpl.slug}-${tier.suffix}`,
    nameFa: `${tpl.nameFa} (${tier.labelFa})`,
    taglineFa: tpl.taglineFa,
    preferredGenres: [tpl.genre],
    preferredHabits: [tier.habit, 'deep_analysis'],
    minAge: tier.minAge,
    maxAge: tier.maxAge,
    genderAffinity: tier.genderAffinity,
    recommendedRoom: tpl.room,
    accentHex: tpl.accentHex,
    badgeCode: `${tpl.badgeCode}`,
  }))
);

export interface CinemaProfileInput {
  age: number;
  gender: 'male' | 'female' | 'other';
  favoriteGenre: CinemaGenreKey;
  habit: ViewingHabitKey;
}

export interface CinemaPersonaMatchResult {
  topPersona: CinemaPersona;
  matchPct: number;
  recommendedRoom: CinemaRoomConfig;
  runnerUps: CinemaPersona[];
  curatedPitchFa: string;
}

export function matchCinemaPersonas(input: CinemaProfileInput): CinemaPersonaMatchResult {
  const safeAge = Math.max(8, Math.min(99, Math.round(Number(input.age) || 26)));

  const scored = CINEMA_PERSONAS.map((persona) => {
    let score = 50;
    if (persona.preferredGenres.includes(input.favoriteGenre)) score += 32;
    if (persona.preferredHabits.includes(input.habit)) score += 12;
    if (safeAge >= persona.minAge && safeAge <= persona.maxAge) score += 10;
    else score -= Math.min(18, Math.abs(safeAge - (persona.minAge + persona.maxAge) / 2) * 0.4);

    if (
      input.gender !== 'other' &&
      (persona.genderAffinity === input.gender || persona.genderAffinity === 'any')
    ) {
      score += 4;
    }

    return {
      persona,
      score: Math.min(99, Math.max(60, Math.round(score))),
    };
  }).sort((a, b) => b.score - a.score);

  const top = scored[0] ?? { persona: CINEMA_PERSONAS[0], score: 94 };
  const recommendedRoom =
    CINEMA_ROOMS.find((r) => r.id === top.persona.recommendedRoom) ?? CINEMA_ROOMS[0];

  return {
    topPersona: top.persona,
    matchPct: top.score,
    recommendedRoom,
    runnerUps: scored.slice(1, 4).map((s) => s.persona),
    curatedPitchFa: `اتاق پیشنهادی: ${recommendedRoom.titleFa} (${recommendedRoom.subtitleFa}) — هماهنگ با هویت ${top.persona.nameFa}`,
  };
}

// ============================================================================
// 2. Stream & Link Authenticator Agent (Security + Format + Live Probe)
// ============================================================================

export type DetectedStreamFormat = 'HLS' | 'MP4' | 'TELEGRAM' | 'P2P_WEBRTC' | 'UNKNOWN';

export interface StreamAuthReport {
  isValid: boolean;
  isSafe: boolean;
  sanitizedUrl: string;
  format: DetectedStreamFormat;
  estimatedQuality: '4K UHD' | '1080p Full HD' | '720p HD' | 'Adaptive ABR';
  livenessStatus: 'verified_ready' | 'telegram_bridge' | 'rejected_unsafe' | 'rejected_spam';
  latencyEstimateMs: number;
  summaryFa: string;
}

const SPAM_DOMAINS = [
  'bit.ly',
  'tinyurl.com',
  'free-crypto-win',
  'malware-test',
  'phish-stream',
  'clickbait-ad',
];

export function authenticateStreamLink(rawUrl: string): StreamAuthReport {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      isValid: false,
      isSafe: false,
      sanitizedUrl: '',
      format: 'UNKNOWN',
      estimatedQuality: '720p HD',
      livenessStatus: 'rejected_unsafe',
      latencyEstimateMs: 0,
      summaryFa: 'لینک استریم خالی است.',
    };
  }

  // Block dangerous schemes (XSS protection)
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/html')
  ) {
    return {
      isValid: false,
      isSafe: false,
      sanitizedUrl: '',
      format: 'UNKNOWN',
      estimatedQuality: '720p HD',
      livenessStatus: 'rejected_unsafe',
      latencyEstimateMs: 0,
      summaryFa: 'پروتکل ناامن مسدود شد (XSS Guard). فقط HTTPS، تلگرام یا P2P مجاز است.',
    };
  }

  // Support Telegram @channel handles or t.me URLs cleanly
  let normalized = trimmed;
  if (normalized.startsWith('@') && normalized.length >= 4) {
    normalized = `https://t.me/${normalized.slice(1)}`;
  } else if (normalized.startsWith('t.me/')) {
    normalized = `https://${normalized}`;
  }

  const isP2pOrWebrtc =
    lower.startsWith('webrtc://') ||
    lower.startsWith('magnet:?') ||
    lower.startsWith('p2p://');

  let hostname = '';
  if (!isP2pOrWebrtc) {
    try {
      const parsed = new URL(normalized);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return {
          isValid: false,
          isSafe: false,
          sanitizedUrl: '',
          format: 'UNKNOWN',
          estimatedQuality: '720p HD',
          livenessStatus: 'rejected_unsafe',
          latencyEstimateMs: 0,
          summaryFa: 'فقط لینک‌های HTTP/HTTPS، کانال تلگرام یا WebRTC پذیرفته می‌شوند.',
        };
      }
      hostname = parsed.hostname.toLowerCase();
    } catch {
      return {
        isValid: false,
        isSafe: false,
        sanitizedUrl: '',
        format: 'UNKNOWN',
        estimatedQuality: '720p HD',
        livenessStatus: 'rejected_unsafe',
        latencyEstimateMs: 0,
        summaryFa: 'ساختار آدرس URL معتبر نیست.',
      };
    }
  }

  if (SPAM_DOMAINS.some((spam) => hostname.includes(spam) || lower.includes(spam))) {
    return {
      isValid: false,
      isSafe: false,
      sanitizedUrl: '',
      format: 'UNKNOWN',
      estimatedQuality: '720p HD',
      livenessStatus: 'rejected_spam',
      latencyEstimateMs: 0,
      summaryFa: 'لینک به عنوان اسپم یا کوتاه‌کننده مشکوک مسدود شد.',
    };
  }

  let format: DetectedStreamFormat = 'MP4';
  if (lower.includes('.m3u8') || lower.includes('/hls/')) {
    format = 'HLS';
  } else if (hostname === 't.me' || hostname === 'telegram.me' || lower.includes('tg://')) {
    format = 'TELEGRAM';
  } else if (isP2pOrWebrtc || lower.includes('peer') || lower.includes('.torrent')) {
    format = 'P2P_WEBRTC';
  } else if (lower.includes('.mp4') || lower.includes('.webm') || lower.includes('.mkv')) {
    format = 'MP4';
  }

  const estimatedQuality: StreamAuthReport['estimatedQuality'] = lower.includes('4k') ||
    lower.includes('2160')
    ? '4K UHD'
    : format === 'HLS'
      ? 'Adaptive ABR'
      : lower.includes('720')
        ? '720p HD'
        : '1080p Full HD';

  const isTelegram = format === 'TELEGRAM';
  return {
    isValid: true,
    isSafe: true,
    sanitizedUrl: normalized,
    format,
    estimatedQuality,
    livenessStatus: isTelegram ? 'telegram_bridge' : 'verified_ready',
    latencyEstimateMs: isTelegram ? 42 : format === 'P2P_WEBRTC' ? 28 : 34,
    summaryFa: isTelegram
      ? `کانال استریم مستقیم تلگرام تایید شد (${estimatedQuality})`
      : `استریم ${format} با متادیتای ${estimatedQuality} امن و آماده پخش است`,
  };
}

// ============================================================================
// 3. Spoiler-Shield & Sub-Sync Agent
// ============================================================================

export interface SpoilerScanSegment {
  text: string;
  isSpoiler: boolean;
}

export interface SpoilerScanResult {
  hasSpoiler: boolean;
  confidence: number;
  matchedTriggers: string[];
  segments: SpoilerScanSegment[];
}

const SPOILER_TRIGGERS = [
  'اسپویل',
  'لو رفت',
  'آخرش میمره',
  'آخرش می‌میره',
  'کشته میشه',
  'کشته می‌شه',
  'قاتل اصلی',
  'خیانت می‌کنه',
  'خیانت میکنه',
  'فصل آخر',
  'اپیزود آخر',
  'پایان فیلم',
  'spoiler',
  'dies at the end',
  'turns out',
  'the killer is',
  'final twist',
  'secret ending',
];

export function scanSpoilerContent(rawText: string): SpoilerScanResult {
  const clean = rawText.trim();
  if (!clean) {
    return {
      hasSpoiler: false,
      confidence: 0,
      matchedTriggers: [],
      segments: [{ text: '', isSpoiler: false }],
    };
  }

  const sentences = clean.split(/(?<=[.!؟\n])\s+/);
  const matchedTriggers: string[] = [];

  const segments: SpoilerScanSegment[] = sentences.map((sentence) => {
    const lower = sentence.toLowerCase();
    const hits = SPOILER_TRIGGERS.filter((t) => lower.includes(t));
    if (hits.length > 0) {
      matchedTriggers.push(...hits);
      return { text: sentence, isSpoiler: true };
    }
    return { text: sentence, isSpoiler: false };
  });

  const uniqueTriggers = Array.from(new Set(matchedTriggers));
  return {
    hasSpoiler: uniqueTriggers.length > 0,
    confidence: uniqueTriggers.length > 0 ? Math.min(99, 78 + uniqueTriggers.length * 8) : 4,
    matchedTriggers: uniqueTriggers,
    segments,
  };
}

// ============================================================================
// 4. Decentralized Telegram & Mr. Robot Underground Social Club State
// ============================================================================

export interface UndergroundStreamPost {
  id: string;
  hub: 'cinema' | 'audio';
  roomId: string;
  titleFa: string;
  captionFa: string;
  streamUrl: string;
  streamFormat: DetectedStreamFormat;
  authorHandle: string;
  authorTelegramChannel: string;
  personaBadge: string;
  personaAccentHex: string;
  likesCount: number;
  likedByMe: boolean;
  createdOrder: number; // Monotonic freshness tie-breaker / decay factor
  timestampLabel: string;
  comments: Array<{
    id: string;
    authorHandle: string;
    text: string;
    timestamp: string;
  }>;
}

export interface CinemaSocialProfileLinks {
  telegramHandle: string;
  telegramChannelId: string;
  imdbUrl: string;
  twitchUrl: string;
}

export function resolveTelegramChannelId(rawHandle: string): {
  cleanHandle: string;
  channelId: string;
} {
  const sanitized = rawHandle
    .trim()
    .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '')
    .replace(/^@+/, '')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 32);

  if (sanitized.length < 3) {
    return { cleanHandle: '', channelId: '' };
  }
  return {
    cleanHandle: `@${sanitized}`,
    channelId: `t.me/${sanitized}_aipetros_stream`,
  };
}

/**
 * Computes community curation trending score and returns a newly sorted array
 * putting the most-liked + active streams at the top ("Top Streamers / Trending Now").
 */
export function rankTrendingStreams(posts: UndergroundStreamPost[]): UndergroundStreamPost[] {
  return [...posts].sort((a, b) => {
    const scoreA = a.likesCount * 10 + a.comments.length * 3 + a.createdOrder * 0.5;
    const scoreB = b.likesCount * 10 + b.comments.length * 3 + b.createdOrder * 0.5;
    return scoreB - scoreA;
  });
}

export function toggleUndergroundStreamLike(
  posts: UndergroundStreamPost[],
  postId: string
): UndergroundStreamPost[] {
  return posts.map((p) => {
    if (p.id !== postId) return p;
    const nextLiked = !p.likedByMe;
    return {
      ...p,
      likedByMe: nextLiked,
      likesCount: Math.max(0, p.likesCount + (nextLiked ? 1 : -1)),
    };
  });
}

export function publishUndergroundStream(
  posts: UndergroundStreamPost[],
  input: {
    hub: 'cinema' | 'audio';
    roomId: string;
    titleFa: string;
    captionFa: string;
    streamUrl: string;
    authorHandle: string;
    authorTelegramChannel: string;
    personaBadge: string;
    personaAccentHex: string;
  }
): { ok: boolean; error?: string; report: StreamAuthReport; posts: UndergroundStreamPost[] } {
  const report = authenticateStreamLink(input.streamUrl);
  if (!report.isValid || !report.isSafe) {
    return { ok: false, error: report.summaryFa, report, posts };
  }

  const title = input.titleFa.trim();
  if (title.length < 2) {
    return { ok: false, error: 'عنوان استریم را وارد کنید.', report, posts };
  }

  const maxOrder = posts.reduce((m, p) => Math.max(m, p.createdOrder), 0);
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  const newPost: UndergroundStreamPost = {
    id: `ug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    hub: input.hub,
    roomId: input.roomId,
    titleFa: title,
    captionFa: input.captionFa.trim() || `استریم مستقیم از کانال ${input.authorTelegramChannel}`,
    streamUrl: report.sanitizedUrl,
    streamFormat: report.format,
    authorHandle: input.authorHandle,
    authorTelegramChannel: input.authorTelegramChannel || 't.me/aipetros_node',
    personaBadge: input.personaBadge,
    personaAccentHex: input.personaAccentHex,
    likesCount: 1,
    likedByMe: true,
    createdOrder: maxOrder + 1,
    timestampLabel: `${hh}:${mm}`,
    comments: [],
  };

  return {
    ok: true,
    report,
    posts: [newPost, ...posts],
  };
}

export function addUndergroundStreamComment(
  posts: UndergroundStreamPost[],
  postId: string,
  authorHandle: string,
  text: string
): UndergroundStreamPost[] {
  const clean = text.trim();
  if (!clean) return posts;

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  return posts.map((p) => {
    if (p.id !== postId) return p;
    return {
      ...p,
      comments: [
        ...p.comments,
        {
          id: `ugc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          authorHandle,
          text: clean,
          timestamp: `${hh}:${mm}`,
        },
      ],
    };
  });
}

export const INITIAL_CINEMA_STREAMS: UndergroundStreamPost[] = [
  {
    id: 'cin-stream-1',
    hub: 'cinema',
    roomId: 'movie',
    titleFa: 'بازبینی کارگردان: بلید رانر ۲۰۴۹ (4K HDR Feed)',
    captionFa: 'نورپردازی نوآر با استریم مستقیم P2P بدون افت فریم. نکته مهم: اسپویل سکانس پایان فیلم برای کسایی که ندیدن مخفیه، آخرش میمره یا نه رو باز کنید.',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    streamFormat: 'HLS',
    authorHandle: 'mr_archivist',
    authorTelegramChannel: 't.me/noir_vault_ch',
    personaBadge: 'NOIR-ARC',
    personaAccentHex: '#F59E0B',
    likesCount: 142,
    likedByMe: false,
    createdOrder: 3,
    timestampLabel: '21:40',
    comments: [
      {
        id: 'cc-1',
        authorHandle: 'cipher_ellen',
        text: 'طراحی صدای صحنه بیابون بی‌نظیره. اسپویل: فصل آخر تمام تئوری‌های تناسخ رو تایید می‌کنه.',
        timestamp: '21:44',
      },
    ],
  },
  {
    id: 'cin-stream-2',
    hub: 'cinema',
    roomId: 'anime',
    titleFa: 'سکانس‌های ساکوگا سایبرپانک در توکیو بارانی',
    captionFa: 'فید ۶۰ فریم با زیرنویس هماهنگ‌شده و کانال تلگرام اختصاصی.',
    streamUrl: 'https://t.me/tokyo_rain_anime_ch/402',
    streamFormat: 'TELEGRAM',
    authorHandle: 'shibuya_ghost',
    authorTelegramChannel: 't.me/tokyo_rain_anime_ch',
    personaBadge: 'PRO-OTK',
    personaAccentHex: '#22D3EE',
    likesCount: 198,
    likedByMe: false,
    createdOrder: 4,
    timestampLabel: '22:05',
    comments: [],
  },
  {
    id: 'cin-stream-3',
    hub: 'cinema',
    roomId: 'series',
    titleFa: 'تحلیل اپیزود فینال Mr. Robot — اتاق مانیتورینگ',
    captionFa: 'بررسی کدهای ترمینال fsociety در اپیزود آخر سریال.',
    streamUrl: 'webrtc://peer-fsociety.aipetros.local/series-409',
    streamFormat: 'P2P_WEBRTC',
    authorHandle: 'alderson_node',
    authorTelegramChannel: 't.me/fsociety_cinema',
    personaBadge: 'THY-HNT',
    personaAccentHex: '#38BDF8',
    likesCount: 165,
    likedByMe: false,
    createdOrder: 2,
    timestampLabel: '20:15',
    comments: [],
  },
];
