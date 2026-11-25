import type { RealmId } from '../types/spatial';

export interface CatalogGameEntry {
  id: string;
  name: string;
  shortLabel: string;
  realm: RealmId;
  steamAppId?: number;
  wikiTitle?: string;
  accentHex: string;
  secondaryHex: string;
  patchVersion: string;
  patchSummaryFa: string;
  triggerBadge: string;
  triggerLabelFa: string;
  timingMs: number;
  timingWindowLabelFa: string;
  executionBadge: string;
  executionLabelFa: string;
  fatalErrorFa: string;
  arPrimaryLabelFa: string;
  arLaserLabelFa: string;
  arDangerLabelFa: string;
  arSpeedPinFa: string;
  voiceScriptFa: string;
  voiceScriptEn: string;
  fallbackScreenshotUrl: string;
}

export interface GameVideoClip {
  id: string;
  title: string;
  hlsUrl?: string;
  mp4Url?: string;
  webmUrl?: string;
  thumbnailUrl: string;
}

export interface GameScreenshotItem {
  id: string;
  title: string;
  fullUrl: string;
  thumbUrl: string;
}

export interface ResolvedGameMediaBundle {
  gameId: string;
  gameName: string;
  realm: RealmId;
  steamAppId?: number;
  videos: GameVideoClip[];
  screenshots: GameScreenshotItem[];
  sourceLabel: string;
}

export const REALM_LABELS_FA: Record<RealmId, string> = {
  sports: 'ورزشی',
  shooter: 'شوتر',
  strategy: 'استراتژی',
  story: 'داستانی',
};

export const REALM_LABELS_EN: Record<RealmId, string> = {
  sports: 'Sports',
  shooter: 'Shooter',
  strategy: 'Strategy',
  story: 'Story',
};

export const COACH_REALM_ORDER: RealmId[] = ['sports', 'shooter', 'strategy', 'story'];

export const PC_GAME_CATALOG: CatalogGameEntry[] = [
  // ==================== 1. SPORTS (ورزشی) ====================
  {
    id: 'fc27',
    name: 'EA SPORTS FC 27',
    shortLabel: 'FC 27',
    realm: 'sports',
    steamAppId: 3405690,
    accentHex: '#22C55E',
    secondaryHex: '#38BDF8',
    patchVersion: 'Patch 1.14.2',
    patchSummaryFa: 'تنظیم پنجره رهاسازی پاس عمقی و واکنش مدافع میانی در متای جدید',
    triggerBadge: 'L1',
    triggerLabelFa: 'تحریک فرار',
    timingMs: 250,
    timingWindowLabelFa: 'پنجره رهاسازی: ۰.۲۵s',
    executionBadge: 'L1 + R1 + △',
    executionLabelFa: 'پاس عمقی',
    fatalErrorFa: '⚠ تاخیر ۰.۳۰s = آفساید',
    arPrimaryLabelFa: 'فضای خالی ۱۴ متر • شانس گل ۷۸٪',
    arLaserLabelFa: 'خط مدافع CB',
    arDangerLabelFa: 'تله آفساید',
    arSpeedPinFa: '۳۱ km/h',
    voiceScriptFa: 'با ال یک فرار مهاجم را تحریک کن، داخل پنجره بیست و پنج صدم ثانیه پاس عمقی را بزن.',
    voiceScriptEn: 'Trigger the forward run with L1, release inside the 250ms window, and thread L1 R1 Triangle.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
  },
  {
    id: 'efootball',
    name: 'eFootball 2026',
    shortLabel: 'eFootball',
    realm: 'sports',
    steamAppId: 1665460,
    accentHex: '#38BDF8',
    secondaryHex: '#FACC15',
    patchVersion: 'v4.3.0',
    patchSummaryFa: 'بهبود دقت پاس Stunning و کنترل مچ‌آپ خط دفاعی',
    triggerBadge: 'L2',
    triggerLabelFa: 'مچ‌آپ دفاعی',
    timingMs: 220,
    timingWindowLabelFa: 'پنجره رهاسازی: ۰.۲۲s',
    executionBadge: 'R2 + △',
    executionLabelFa: 'پاس استنینگ',
    fatalErrorFa: '⚠ اسپرینت بی‌موقع = جا ماندن دفاع',
    arPrimaryLabelFa: 'کانال نیم‌فضا • دقت پاس ۸۶٪',
    arLaserLabelFa: 'خط پوشش هافبک',
    arDangerLabelFa: 'پرس سنگین حریف',
    arSpeedPinFa: '۲۹ km/h',
    voiceScriptFa: 'زاویه را با ال دو ببند و در لحظه باز شدن کانال نیم‌فضا پاس استنینگ بزن.',
    voiceScriptEn: 'Hold L2 match-up, wait for the half-space channel to open, then unleash a stunning through pass.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
  },
  {
    id: 'f1-25',
    name: 'F1 25',
    shortLabel: 'F1 25',
    realm: 'sports',
    steamAppId: 3059520,
    accentHex: '#EF4444',
    secondaryHex: '#F59E0B',
    patchVersion: 'Patch 1.11',
    patchSummaryFa: 'بالانس چسبندگی تایر مدیوم و نقطه ترمزگیری تریل‌بریکینگ',
    triggerBadge: 'L2 100%',
    triggerLabelFa: 'نقطه ترمز',
    timingMs: 180,
    timingWindowLabelFa: 'رهاسازی ترمز: ۰.۱۸s',
    executionBadge: 'ERS + DRS',
    executionLabelFa: 'خروج اپکس',
    fatalErrorFa: '⚠ گاز زودهنگام = سر خوردن عقب ماشین',
    arPrimaryLabelFa: 'خط ایده‌آل اپکس • کاهش ۰.۳۴s لپ',
    arLaserLabelFa: 'نقطه ۱۰۰ متر ترمز',
    arDangerLabelFa: 'منطقه قفل چرخ',
    arSpeedPinFa: '۳۱۸ km/h',
    voiceScriptFa: 'در تابلوی صد متر ترمز کامل بزن، با تریل‌بریکینگ نرم وارد اپکس شو و هنگام صاف شدن فرمان ERS را فعال کن.',
    voiceScriptEn: 'Hit peak brake pressure at the 100 meter board, trail-brake smoothly into the apex, and deploy ERS on exit.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
  },
  {
    id: 'nba2k',
    name: 'NBA 2K26',
    shortLabel: 'NBA 2K',
    realm: 'sports',
    steamAppId: 2878980,
    accentHex: '#F97316',
    secondaryHex: '#38BDF8',
    patchVersion: 'Season 5',
    patchSummaryFa: 'پنجره رهاسازی شوت سبز ریتم‌شوتینگ و پیک‌اند‌رول',
    triggerBadge: 'L1',
    triggerLabelFa: 'اسکرین پیک',
    timingMs: 140,
    timingWindowLabelFa: 'پنجره سبز: ۰.۱۴s',
    executionBadge: 'R-Stick ↑',
    executionLabelFa: 'ریتم شوت سبز',
    fatalErrorFa: '⚠ شلیک زیر دست دفاع = افت ۴۵٪ شانس',
    arPrimaryLabelFa: 'فضای شوت سه‌امتیازی • شانس ۸۱٪',
    arLaserLabelFa: 'خط اسکرین سنتر',
    arDangerLabelFa: 'بلاک حریف',
    arSpeedPinFa: 'ریلیز ۴۸ms',
    voiceScriptFa: 'با ال یک اسکرین بگیر، از شانه سنتر عبور کن و در نقطه اوج پرش شوت ریتم سبز بزن.',
    voiceScriptEn: 'Call the L1 pick, brush the screener shoulder, and release at the visual cue for a green three.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
  },
  {
    id: 'rocket-league',
    name: 'Rocket League',
    shortLabel: 'Rocket League',
    realm: 'sports',
    steamAppId: 252950,
    wikiTitle: 'Rocket League',
    accentHex: '#3B82F6',
    secondaryHex: '#F97316',
    patchVersion: 'Season 18',
    patchSummaryFa: 'تایمینگ Fast Aerial و حفظ مومنتوم بوست در چرخش بک‌پست',
    triggerBadge: 'Jump + ↑',
    triggerLabelFa: 'فست اریال',
    timingMs: 160,
    timingWindowLabelFa: 'دابل جامپ: ۰.۱۶s',
    executionBadge: 'Boost + AirRoll',
    executionLabelFa: 'پاورشات هوایی',
    fatalErrorFa: '⚠ دابل‌کامیت = دروازه خالی',
    arPrimaryLabelFa: 'قوس ضربه هوایی • سرعت ۱۱۴ km/h',
    arLaserLabelFa: 'مسیر چرخش بک‌پست',
    arDangerLabelFa: 'ضدحمله حریف',
    arSpeedPinFa: 'بوست ۷۴٪',
    voiceScriptFa: 'پرش اول را همزمان با بوست بزن، در شانزده صدم ثانیه پرش دوم را اجرا کن و با ایررول زاویه ضربه را ببند.',
    voiceScriptEn: 'Execute a fast aerial with boost on first jump, second jump within 160ms, and air-roll into the top corner.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
  },

  // ==================== 2. SHOOTER (شوتر) ====================
  {
    id: 'cs2',
    name: 'Counter-Strike 2',
    shortLabel: 'CS2',
    realm: 'shooter',
    steamAppId: 730,
    accentHex: '#22D3EE',
    secondaryHex: '#F97316',
    patchVersion: 'Sub-Tick 2.8.1',
    patchSummaryFa: 'بالانس دقت کانتر-استریف و زاویه پیک مید میراژ در متای فعلی',
    triggerBadge: 'A / D',
    triggerLabelFa: 'کانتر-استریف',
    timingMs: 80,
    timingWindowLabelFa: 'پنجره رهاسازی: ۰.۰۸s',
    executionBadge: 'LMB + ↓',
    executionLabelFa: 'وان-تپ دقیق',
    fatalErrorFa: '⚠ شلیک در حرکت = خطای اسپری',
    arPrimaryLabelFa: 'مسیر پیک مید • شانس هدشات ۸۲٪',
    arLaserLabelFa: 'خط کراس‌هر',
    arDangerLabelFa: 'زاویه پیک حریف',
    arSpeedPinFa: 'اسموک پنجره • ۶۴ms',
    voiceScriptFa: 'کانتر استریف سریع با ای یا دی بزن و در پنجره هشت صدم ثانیه توقف کامل شلیک وان تپ بزن.',
    voiceScriptEn: 'Tap counter-strafe A or D, fire inside the 80 millisecond zero-velocity window, and lock head level.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
  },
  {
    id: 'valorant',
    name: 'VALORANT',
    shortLabel: 'Valorant',
    realm: 'shooter',
    wikiTitle: 'Valorant',
    accentHex: '#FF4655',
    secondaryHex: '#22D3EE',
    patchVersion: 'Patch 10.04',
    patchSummaryFa: 'کنترل ریکویل فانتوم و وندال با برست ۲تایی و جگل‌پیک',
    triggerBadge: 'A-D Tap',
    triggerLabelFa: 'ددزنینگ',
    timingMs: 90,
    timingWindowLabelFa: 'پنجره شلیک: ۰.۰۹s',
    executionBadge: '2-Bullet Burst',
    executionLabelFa: 'برست هدشات',
    fatalErrorFa: '⚠ کرچ سریع = هدف ثابت برای هدشات',
    arPrimaryLabelFa: 'زاویه اسلایس پای • شانس دوئل ۷۹٪',
    arLaserLabelFa: 'ارتفاع هدلاین',
    arDangerLabelFa: 'خط اپراتور حریف',
    arSpeedPinFa: 'فلش پاپ • ۹۰ms',
    voiceScriptFa: 'با جگل پیک اطلاعات بگیر، لحظه توقف کامل دو تیر دقیق به هدلاین بزن و بلافاصله استریف کن.',
    voiceScriptEn: 'Slice the angle, deadzone a two-bullet burst at head height, and strafe immediately between bursts.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
  },
  {
    id: 'warzone',
    name: 'Call of Duty: Warzone',
    shortLabel: 'Warzone',
    realm: 'shooter',
    steamAppId: 1938090,
    accentHex: '#84CC16',
    secondaryHex: '#22D3EE',
    patchVersion: 'Season 3 Reloaded',
    patchSummaryFa: 'تایمینگ اسلاید-کنسل و شکستن دوربین در درگیری نزدیک',
    triggerBadge: 'Sprint + C',
    triggerLabelFa: 'اسلاید کنسل',
    timingMs: 130,
    timingWindowLabelFa: 'شکست دوربین: ۰.۱۳s',
    executionBadge: 'ADS + Jump',
    executionLabelFa: 'جامپ‌شات دقیق',
    fatalErrorFa: '⚠ پرش در فضای باز = لیزر شدن',
    arPrimaryLabelFa: 'زاویه فلنک هدگلیچ • برتری ۸۴٪',
    arLaserLabelFa: 'خط دید اسنایپر',
    arDangerLabelFa: 'منطقه نارنجک سمی',
    arSpeedPinFa: 'TTK ۵۴۰ms',
    voiceScriptFa: 'قبل از گوشه اسلاید کنسل بزن، با جامپ‌شات دوربین حریف را بشکن و ایم را روی بالای سینه قفل کن.',
    voiceScriptEn: 'Slide-cancel around the corner to break camera, snap ADS on upper chest, and strafe out of sightline.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
  },
  {
    id: 'apex',
    name: 'Apex Legends',
    shortLabel: 'Apex',
    realm: 'shooter',
    steamAppId: 1172470,
    accentHex: '#F43F5E',
    secondaryHex: '#F59E0B',
    patchVersion: 'Season 24',
    patchSummaryFa: 'مومنتوم Tap-Strafe و کنترل ریکویل اسموتینگ در فایت میان‌برد',
    triggerBadge: 'Scroll + W',
    triggerLabelFa: 'تپ-استریف',
    timingMs: 110,
    timingWindowLabelFa: 'پنجره چرخش: ۰.۱۱s',
    executionBadge: 'Strafe + Track',
    executionLabelFa: 'ریکویل اسموت',
    fatalErrorFa: '⚠ خروج از کاور = شکستن شیلد',
    arPrimaryLabelFa: 'های‌گراند تاکتیکی • برتری ۸۷٪',
    arLaserLabelFa: 'خط پوشش تیم',
    arDangerLabelFa: 'ترد پارتی پشت سر',
    arSpeedPinFa: 'شیلد ۱۰۰٪',
    voiceScriptFa: 'روی های‌گراند بمان، با استریف عرضی ریکویل را صاف کن و قبل از خالی شدن خشاب به کاور برگرد.',
    voiceScriptEn: 'Hold high ground, mirror-strafe for recoil smoothing, and dip back into cover before reloading.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
  },
  {
    id: 'pubg',
    name: 'PUBG: BATTLEGROUNDS',
    shortLabel: 'PUBG',
    realm: 'shooter',
    steamAppId: 578080,
    accentHex: '#F59E0B',
    secondaryHex: '#22D3EE',
    patchVersion: 'Update 34.2',
    patchSummaryFa: 'پیک سریع Q/E و کنترل اسپری اسکوپ ۳x در حالت نشسته',
    triggerBadge: 'C + Q/E',
    triggerLabelFa: 'پیک نشسته',
    timingMs: 120,
    timingWindowLabelFa: 'بازگشت سر: ۰.۱۲s',
    executionBadge: 'ADS 3x + ↓',
    executionLabelFa: 'اسپری کنترلی',
    fatalErrorFa: '⚠ پیک تکراری از یک نقطه = هدشات اسنایپر',
    arPrimaryLabelFa: 'کاور تپه زون آخر • شانس برد ۸۰٪',
    arLaserLabelFa: 'خط زون آبی',
    arDangerLabelFa: 'زاویه اسنایپر دشمن',
    arSpeedPinFa: 'فاصله ۱۲۵m',
    voiceScriptFa: 'بنشین و با پیک سریع شلیک کن، بعد از ۵ تیر بلافاصله زاویه پیکت را عوض کن.',
    voiceScriptEn: 'Crouch-lean peek for recoil reduction, fire a controlled five-round burst, and reset your angle.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
  },
  {
    id: 'r6siege',
    name: 'Rainbow Six Siege',
    shortLabel: 'R6 Siege',
    realm: 'shooter',
    steamAppId: 359550,
    accentHex: '#38BDF8',
    secondaryHex: '#EF4444',
    patchVersion: 'Y10S1',
    patchSummaryFa: 'پری‌فایر پیکسل‌انگل و دروُن‌زنی سریع قبل از ورود به سایت',
    triggerBadge: 'Drone + Ping',
    triggerLabelFa: 'اسکن سایت',
    timingMs: 95,
    timingWindowLabelFa: 'پری‌فایر: ۰.۰۹s',
    executionBadge: 'Q/E QuickPeek',
    executionLabelFa: 'شایگو پیک',
    fatalErrorFa: '⚠ ورود بدون دروُن = تله کاپکان/رومر',
    arPrimaryLabelFa: 'زاویه پیکسل درب • شانس کیل ۸۵٪',
    arLaserLabelFa: 'خط دیوار نرم',
    arDangerLabelFa: 'تله لیزری حریف',
    arSpeedPinFa: 'کراس‌هر ۱۰۰٪',
    voiceScriptFa: 'ابتدا با دروُن رومر را چک کن، سپس با کوئیک‌پیک و پری‌فایر روی ارتفاع سر وارد سایت شو.',
    voiceScriptEn: 'Clear the flank on drone, quick-peek for intel, and pre-fire head height through the doorway.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
  },

  // ==================== 3. STRATEGY & MOBA (استراتژی) ====================
  {
    id: 'dota2',
    name: 'Dota 2',
    shortLabel: 'Dota 2',
    realm: 'strategy',
    steamAppId: 570,
    accentHex: '#F59E0B',
    secondaryHex: '#EF4444',
    patchVersion: 'Patch 7.38c',
    patchSummaryFa: 'تایمینگ اسموک روشان، کنترل ویزژن و کانتراینیشیت تیم‌فایت',
    triggerBadge: 'Smoke + Ward',
    triggerLabelFa: 'اسموک تیمی',
    timingMs: 320,
    timingWindowLabelFa: 'پنجره اینیشیت: ۰.۳۲s',
    executionBadge: 'Blink + BKB',
    executionLabelFa: 'کمبو استان',
    fatalErrorFa: '⚠ BKB دیرهنگام = زنجیره استان حریف',
    arPrimaryLabelFa: 'زاویه اسموک روشان • شانس فایت ۸۳٪',
    arLaserLabelFa: 'مرز وارد حریف',
    arDangerLabelFa: 'منطقه آلتیمیت دشمن',
    arSpeedPinFa: 'کول‌داون ۵.۰s',
    voiceScriptFa: 'زیر پوشش اسموک از های‌گراند وارد شو، قبل از پرش BKB را آماده کن و ساپورت عقب حریف را قفل کن.',
    voiceScriptEn: 'Wrap under smoke from high ground, pop BKB on blink initiation, and lock down the enemy backline.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
  },
  {
    id: 'lol',
    name: 'League of Legends',
    shortLabel: 'LoL',
    realm: 'strategy',
    wikiTitle: 'League of Legends',
    accentHex: '#38BDF8',
    secondaryHex: '#F59E0B',
    patchVersion: 'Patch 25.S1',
    patchSummaryFa: 'مدیریت فریز ویو، تایمینگ ترید لول ۲ و روتیشن دراگون',
    triggerBadge: 'Wave Freeze',
    triggerLabelFa: 'فریز لاین',
    timingMs: 260,
    timingWindowLabelFa: 'پنجره ترید: ۰.۲۶s',
    executionBadge: 'Flash + Q-R',
    executionLabelFa: 'اینگیج سریع',
    fatalErrorFa: '⚠ پوش بدون وارد = گنک جانگلر',
    arPrimaryLabelFa: 'کنترل رودخانه دراگون • برتری ۷۹٪',
    arLaserLabelFa: 'خط رنج تاور',
    arDangerLabelFa: 'مسیر گنک جانگلر',
    arSpeedPinFa: 'تایمر ۶۰s',
    voiceScriptFa: 'سه مینیون کستر را جلوی تاور فریز کن، وارد رودخانه بگذار و در لحظه لست‌هیت حریف ترید بزن.',
    voiceScriptEn: 'Freeze three caster minions outside tower range, ward river bush, and punish the enemy last-hit.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
  },
  {
    id: 'aoe4',
    name: 'Age of Empires IV',
    shortLabel: 'AoE IV',
    realm: 'strategy',
    steamAppId: 1466860,
    accentHex: '#EAB308',
    secondaryHex: '#38BDF8',
    patchVersion: 'Season 10',
    patchSummaryFa: 'بیلد اوردر Feudal سریع و مایکروی سواره نظام در رید اقتصادی',
    triggerBadge: 'Ctrl+1 Raid',
    triggerLabelFa: 'رید طلا',
    timingMs: 380,
    timingWindowLabelFa: 'زمان واکنش: ۰.۳۸s',
    executionBadge: 'A-Move + Split',
    executionLabelFa: 'اسپلیت کماندار',
    fatalErrorFa: '⚠ توقف تولید ویلیجر = عقب افتادن اکو',
    arPrimaryLabelFa: 'فلنک معدن طلا • خسارت +۱۸٪ اکو',
    arLaserLabelFa: 'خط نیزه‌دار دفاعی',
    arDangerLabelFa: 'برد تیر تاون‌سنتر',
    arSpeedPinFa: '۴:۱۵ Feudal',
    voiceScriptFa: 'تولید ویلیجر را قطع نکن، همزمان با سواره نظام به معدن طلای حریف فشار بیاور و خارج از برد تاون‌سنتر بمان.',
    voiceScriptEn: 'Keep villager production nonstop while raiding the gold vein outside Town Center arrow range.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
  },
  {
    id: 'civ7',
    name: 'Civilization VII',
    shortLabel: 'Civ VII',
    realm: 'strategy',
    steamAppId: 1295660,
    accentHex: '#F97316',
    secondaryHex: '#22C55E',
    patchVersion: 'Patch 1.1.1',
    patchSummaryFa: 'بهینه‌سازی زنجیره مجاورت مناطق علمی و تایمینگ عصر اکتشاف',
    triggerBadge: 'Yield Lens',
    triggerLabelFa: 'چیدمان کاشی',
    timingMs: 420,
    timingWindowLabelFa: 'اولویت نوبت: ۰.۴۲s',
    executionBadge: 'District + Trade',
    executionLabelFa: 'بونوس مجاورت',
    fatalErrorFa: '⚠ گسترش بدون دفاع = سقوط مرز',
    arPrimaryLabelFa: 'تایل علمی +۶ • جهش ۲۴٪ علم',
    arLaserLabelFa: 'خط دفاع مرزی',
    arDangerLabelFa: 'تهدید ارتش همسایه',
    arSpeedPinFa: 'نوبت ۴۸',
    voiceScriptFa: 'منطقه علمی را کنار کوهستان و رودخانه بچین تا بونوس مجاورت حداکثری بگیری و واحد کماندار در مرز نگه دار.',
    voiceScriptEn: 'Place your Science quarter next to mountain adjacency tiles and fortify the chokepoint border.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
  },
  {
    id: 'chess',
    name: 'Chess Tactical Pro',
    shortLabel: 'Chess',
    realm: 'strategy',
    wikiTitle: 'Chess',
    accentHex: '#FBBF24',
    secondaryHex: '#22D3EE',
    patchVersion: 'Engine 17.1',
    patchSummaryFa: 'محاسبه فورک تاکتیکی، کنترل مرکز و جلوگیری از بلندر آخر بازی',
    triggerBadge: 'Checks First',
    triggerLabelFa: 'بررسی کیش',
    timingMs: 350,
    timingWindowLabelFa: 'تعمق تاکتیک: ۰.۳۵s',
    executionBadge: 'Nd5! Fork',
    executionLabelFa: 'چنگال اسب',
    fatalErrorFa: '⚠ حرکت عجولانه = بلندر مات بک‌رنک',
    arPrimaryLabelFa: 'برتری موقعیتی +۳.۴ • شانس برد ۸۹٪',
    arLaserLabelFa: 'قطر باز فیل',
    arDangerLabelFa: 'تهدید آچمزی وزیر',
    arSpeedPinFa: 'دقت ۹۶٪',
    voiceScriptFa: 'اول تمام کیش‌ها و تعویض‌های اجباری را چک کن، سپس با چنگال اسب در خانه دی پنج برتری قطعی بگیر.',
    voiceScriptEn: 'Calculate checks, captures, and threats first, then land the knight fork on d5 for a winning endgame.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
  },

  // ==================== 4. STORY / ACTION / RPG (داستانی) ====================
  {
    id: 'gta',
    name: 'GTA V / GTA VI Online',
    shortLabel: 'GTA',
    realm: 'story',
    steamAppId: 271590,
    accentHex: '#EC4899',
    secondaryHex: '#22D3EE',
    patchVersion: 'Vice Meta 3.4',
    patchSummaryFa: 'آپدیت مسیر فلنک شبانه، کاور تاکتیکی و زمان‌بندی هایست',
    triggerBadge: 'R1',
    triggerLabelFa: 'کاور تاکتیکی',
    timingMs: 400,
    timingWindowLabelFa: 'پنجره رهاسازی: ۰.۴۰s',
    executionBadge: 'L2 + R2 + ◯',
    executionLabelFa: 'فلنک سریع',
    fatalErrorFa: '⚠ خروج بدون اسموک = شکار اسنایپر',
    arPrimaryLabelFa: 'مسیر فلنک پنت‌هاوس • پوشش ۸۶٪',
    arLaserLabelFa: 'بردار پیشروی',
    arDangerLabelFa: 'منطقه خطر',
    arSpeedPinFa: 'کول‌داون ۵.۲s',
    voiceScriptFa: 'با آر یک کاور تاکتیکی بگیر، در پنجره چهار دهم ثانیه چرخش دید حریف فلنک سریع را اجرا کن.',
    voiceScriptEn: 'Lock tactical cover with R1, cross during the 400ms patrol turn, and execute the fast flank roll.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
  },
  {
    id: 'elden-ring',
    name: 'ELDEN RING',
    shortLabel: 'Elden Ring',
    realm: 'story',
    steamAppId: 1245620,
    accentHex: '#F59E0B',
    secondaryHex: '#EC4899',
    patchVersion: 'Patch 1.16',
    patchSummaryFa: 'پنجره آی‌فریم داج به داخل و شکستن پویز باس با ضربه سنگین',
    triggerBadge: '◯ Dodge In',
    triggerLabelFa: 'داج به داخل',
    timingMs: 210,
    timingWindowLabelFa: 'پنجره آی‌فریم: ۰.۲۱s',
    executionBadge: 'Jump + R2',
    executionLabelFa: 'شکستن پویز',
    fatalErrorFa: '⚠ داج به عقب = خوردن ضربه تاخیری باس',
    arPrimaryLabelFa: 'پنجره پانیش باس • +۴۰ پویز دمیج',
    arLaserLabelFa: 'محدوده اسلش باس',
    arDangerLabelFa: 'ضربه غیرقابل بلاک',
    arSpeedPinFa: '۱۳ i-Frames',
    voiceScriptFa: 'به جای عقب رفتن، دقیقاً در لحظه پایین آمدن شمشیر به داخل دست چپ باس داج بده و با جامپ آر دو پویز را بشکن.',
    voiceScriptEn: 'Roll diagonally inward through the delayed swing at 210ms, then punish with a jump R2 poise break.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    shortLabel: 'Cyberpunk',
    realm: 'story',
    steamAppId: 1091500,
    accentHex: '#FACC15',
    secondaryHex: '#22D3EE',
    patchVersion: 'Patch 2.21',
    patchSummaryFa: 'کمبو ساندویستان + دش هوایی و زنجیره کوئیک‌هک نت‌رانر',
    triggerBadge: 'E Sandevistan',
    triggerLabelFa: 'فعال‌سازی زمان',
    timingMs: 280,
    timingWindowLabelFa: 'پنجره کمبو: ۰.۲۸s',
    executionBadge: 'AirDash + Katana',
    executionLabelFa: 'اسلش بحرانی',
    fatalErrorFa: '⚠ اتمام استامینا = افت ۶۰٪ دمیج',
    arPrimaryLabelFa: 'مسیر دش کاتانا • کریت ۱۰۰٪',
    arLaserLabelFa: 'خط اسکن دوربین',
    arDangerLabelFa: 'تیرانداز مکس‌تک',
    arSpeedPinFa: 'اسلومو ۸۵٪',
    voiceScriptFa: 'ساندویستان را فعال کن، با ایر‌دش به پشت دشمن برو و قبل از پایان زمان با سه ضربه کاتانا فایت را ببند.',
    voiceScriptEn: 'Pop Sandevistan, air-dash behind the turret sightline, and chain three critical katana finishers.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
  },
  {
    id: 'rdr2',
    name: 'Red Dead Redemption 2',
    shortLabel: 'RDR 2',
    realm: 'story',
    steamAppId: 1174180,
    accentHex: '#EF4444',
    secondaryHex: '#F59E0B',
    patchVersion: 'Ultimate Build',
    patchSummaryFa: 'علامت‌گذاری سریع Dead Eye و ریلود فوری در درگیری چندنفره',
    triggerBadge: 'R3 Dead Eye',
    triggerLabelFa: 'ددآی فوری',
    timingMs: 240,
    timingWindowLabelFa: 'پنجره نشانه: ۰.۲۴s',
    executionBadge: 'R1 Tag + R2',
    executionLabelFa: 'هدشات زنجیره‌ای',
    fatalErrorFa: '⚠ ماندن خارج از کاور = خالی شدن هسته جان',
    arPrimaryLabelFa: 'قفل ۳ هدف همزمان • دقت ۹۴٪',
    arLaserLabelFa: 'خط شلیک شاتگان',
    arDangerLabelFa: 'فلنک سواره‌نظام',
    arSpeedPinFa: 'ددآی ۸۸٪',
    voiceScriptFa: 'با آر سه ددآی را فعال کن تا ریلود فوری انجام شود، سریع سه سر را علامت بزن و شلیک کن.',
    voiceScriptEn: 'Trigger Dead Eye for instant reload, tag three headshots with R1, and clear the ambush.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
  },
  {
    id: 'wukong',
    name: 'Black Myth: Wukong',
    shortLabel: 'Wukong',
    realm: 'story',
    steamAppId: 2358720,
    accentHex: '#F97316',
    secondaryHex: '#FACC15',
    patchVersion: 'Patch 1.0.14',
    patchSummaryFa: 'تایمینگ See-Through ضدحمله استنس اسمش و داج پرفکت',
    triggerBadge: 'Light ×2',
    triggerLabelFa: 'ستاپ کمبو',
    timingMs: 170,
    timingWindowLabelFa: 'پنجره See-Through: ۰.۱۷s',
    executionBadge: 'Heavy Counter',
    executionLabelFa: 'ضدحمله طلایی',
    fatalErrorFa: '⚠ مصرف بی‌موقع فوکوس = از دست رفتن استان',
    arPrimaryLabelFa: 'پنجره See-Through • استان ۱۰۰٪',
    arLaserLabelFa: 'برد حمله باس',
    arDangerLabelFa: 'کمبو قرمز باس',
    arSpeedPinFa: 'فوکوس ۳/۳',
    voiceScriptFa: 'دو ضربه سبک بزن و دقیقاً هنگام تماس ضربه باس، ضربه سنگین را بزن تا ضدحمله See-Through فعال شود.',
    voiceScriptEn: 'Land two light hits, then press Heavy right on boss impact to trigger the invincible See-Through counter.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
  },
  {
    id: 'witcher3',
    name: 'The Witcher 3',
    shortLabel: 'Witcher 3',
    realm: 'story',
    steamAppId: 292030,
    accentHex: '#DC2626',
    secondaryHex: '#38BDF8',
    patchVersion: 'Next-Gen 4.04',
    patchSummaryFa: 'سیکل شیلد Quen، داج کوتاه بدون مصرف استامینا و ضربه پشت',
    triggerBadge: 'Quen Sign',
    triggerLabelFa: 'شیلد کوئن',
    timingMs: 230,
    timingWindowLabelFa: 'پنجره داج: ۰.۲۳s',
    executionBadge: 'Sidestep + Fast',
    executionLabelFa: 'ضربه پشت کریت',
    fatalErrorFa: '⚠ رول طولانی = قطع شدن ریکاوری استامینا',
    arPrimaryLabelFa: 'زاویه پشت هیولا • +۵۰٪ کریت',
    arLaserLabelFa: 'شعاع حمله چرخشی',
    arDangerLabelFa: 'حمله سنگین شکستن شیلد',
    arSpeedPinFa: 'کوئن فعال',
    voiceScriptFa: 'شیلد کوئن را بالا نگه دار، به جای رول از سایداستپ کوتاه استفاده کن و از پشت ضربه سریع بزن.',
    voiceScriptEn: 'Keep Quen active, use short sidesteps to preserve stamina, and punish from behind for bonus crits.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
  },
  {
    id: 'sekiro',
    name: 'Sekiro: Shadows Die Twice',
    shortLabel: 'Sekiro',
    realm: 'story',
    steamAppId: 814380,
    accentHex: '#E11D48',
    secondaryHex: '#F59E0B',
    patchVersion: 'GOTY 1.06',
    patchSummaryFa: 'ریتم دیفلکت پرفکت (L1) و میکیرى-کانتر روی ضربات نیزه‌ای',
    triggerBadge: 'L1 Deflect',
    triggerLabelFa: 'دیفلکت ریتمیک',
    timingMs: 120,
    timingWindowLabelFa: 'پنجره دیفلکت: ۰.۱۲s',
    executionBadge: '◯ Mikiri',
    executionLabelFa: 'میکیری کانتر',
    fatalErrorFa: '⚠ اسپم L1 = کاهش پنجره دیفلکت به نصف',
    arPrimaryLabelFa: 'نوار پوسچر دشمن ۸۸٪ • آماده دث‌بلو',
    arLaserLabelFa: 'خط حمله نیزه‌ای',
    arDangerLabelFa: 'هشدار کانجی قرمز',
    arSpeedPinFa: '۱۲۰ms پرفکت',
    voiceScriptFa: 'اسپم ال یک نکن؛ با ریتم شمشیر حریف دیفلکت بزن و با دیدن علامت قرمز نیزه مستقیم دایره میکیرى کانتر بزن.',
    voiceScriptEn: 'Tap L1 on impact without spamming, then dash forward with Mikiri Counter on the red thrust kanji.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
  },
  {
    id: 'god-of-war',
    name: 'God of War',
    shortLabel: 'God of War',
    realm: 'story',
    steamAppId: 1593500,
    accentHex: '#38BDF8',
    secondaryHex: '#F97316',
    patchVersion: 'PC Build',
    patchSummaryFa: 'پری سپر روی حلقه زرد و سوئیچ سریع تبر و بلیدز برای کمبو رانیک',
    triggerBadge: 'L1 Parry',
    triggerLabelFa: 'پری حلقه زرد',
    timingMs: 190,
    timingWindowLabelFa: 'پنجره پری: ۰.۱۹s',
    executionBadge: 'L1 + R1 Runic',
    executionLabelFa: 'کمبو رانیک',
    fatalErrorFa: '⚠ دفاع روی حلقه قرمز = شکستن گارد',
    arPrimaryLabelFa: 'پنجره استان والکری • دمیج ۲.۲x',
    arLaserLabelFa: 'برد زنجیر بلیدز',
    arDangerLabelFa: 'حمله حلقه قرمز',
    arSpeedPinFa: 'ریست رانیک',
    voiceScriptFa: 'ضربه حلقه زرد را با ال یک پری کن، روی حلقه قرمز داج بده و بلافاصله کمبوی رانیک را اجرا کن.',
    voiceScriptEn: 'Parry yellow rings with L1, sidestep red rings cleanly, and cancel into your fast Runic attack.',
    fallbackScreenshotUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
  },
];

export function getGamesByRealm(realm: RealmId): CatalogGameEntry[] {
  return PC_GAME_CATALOG.filter((g) => g.realm === realm);
}

export function findCatalogGameById(gameId: string): CatalogGameEntry | undefined {
  const norm = gameId.trim().toLowerCase();
  return PC_GAME_CATALOG.find(
    (g) => g.id === norm || g.shortLabel.toLowerCase() === norm || g.name.toLowerCase() === norm
  );
}

export function inferRealmFromGameTitle(title: string, fallbackRealm: RealmId = 'story'): RealmId {
  const lower = title.toLowerCase();
  if (
    /fc\s?2|fifa|efootball|pes|nba|2k|f1|forza|gran turismo|rocket league|madden|ufc|tennis|golf|wwe|nhl|mlb|football manager/.test(
      lower
    )
  ) {
    return 'sports';
  }
  if (
    /counter-strike|cs2|csgo|valorant|call of duty|warzone|apex|pubg|fortnite|rainbow six|siege|overwatch|battlefield|halo|doom|destiny|tarkov|hunt|delta force|marvel rivals|finals/.test(
      lower
    )
  ) {
    return 'shooter';
  }
  if (
    /dota|league of legends|age of empires|civilization|starcraft|warcraft|total war|chess|hearts of iron|crusader kings|xcom|factorio|frostpunk|stellaris|anno|manor lords|tft|teamfight/.test(
      lower
    )
  ) {
    return 'strategy';
  }
  return fallbackRealm;
}

export function buildDynamicGameEntry(input: {
  id: string;
  name: string;
  steamAppId?: number;
  realm?: RealmId;
  fallbackImage?: string;
}): CatalogGameEntry {
  const existing = findCatalogGameById(input.id) || findCatalogGameById(input.name);
  if (existing) {
    return {
      ...existing,
      steamAppId: input.steamAppId ?? existing.steamAppId,
    };
  }

  const realm = input.realm ?? inferRealmFromGameTitle(input.name, 'story');
  const template = getGamesByRealm(realm)[0] ?? PC_GAME_CATALOG[0];
  const shortLabel = input.name.length > 16 ? `${input.name.slice(0, 15)}…` : input.name;

  return {
    ...template,
    id: input.id,
    name: input.name,
    shortLabel,
    realm,
    steamAppId: input.steamAppId,
    patchVersion: 'Live Meta',
    patchSummaryFa: `تحلیل هوشمند متای روز و تایمینگ‌های کلیدی ${input.name}`,
    fallbackScreenshotUrl: input.fallbackImage || template.fallbackScreenshotUrl,
  };
}
