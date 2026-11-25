import type { MasterHubId } from '../components/spatial/MasterHubSwitcher';

export type MapEntityKind = 'user' | 'club' | 'store' | 'drop';

export interface PlatformMapEntity {
  id: string;
  hub: MasterHubId;
  kind: MapEntityKind;
  nameEn: string;
  nameFa: string;
  subtitleEn: string;
  subtitleFa: string;
  districtEn: string;
  districtFa: string;
  xPct: number; // 10..90 inside spatial map canvas
  yPct: number; // 14..86 inside spatial map canvas
  distanceMeters: number;
  rating: number;
  activeCount: number;
  tags: string[];
  linkedStoreCollectionId?: string;
  statusTextEn: string;
  statusTextFa: string;
}

export interface MapFilterOptions {
  hub: MasterHubId;
  query: string;
  kind: 'all' | MapEntityKind;
  maxDistanceMeters: number | null;
}

export const MAP_ENTITIES: PlatformMapEntity[] = [
  // ============================================================================
  // 1. GAME HUB — CYBERPUNK TACTICAL GRID ENTITIES
  // ============================================================================
  {
    id: 'map-game-u1',
    hub: 'game',
    kind: 'user',
    nameEn: 'Vex_Mirage (Radiant Duelist)',
    nameFa: 'وکس میراژ (دولیست رنک بالا)',
    subtitleEn: 'Looking for CS2 & Valorant Premier 5-stack · Mic On',
    subtitleFa: 'آماده اسکواد ۵ نفره CS2 و ولورانت · میکروفون فعال',
    districtEn: 'Sector 04 · Neon Arcade',
    districtFa: 'سکتور ۰۴ · آرکید نئون',
    xPct: 24,
    yPct: 30,
    distanceMeters: 280,
    rating: 4.9,
    activeCount: 1,
    tags: ['cs2', 'valorant', 'duelist', 'squad', 'lfg'],
    statusTextEn: 'In Queue · 14ms Ping',
    statusTextFa: 'در صف مسابقه · پینگ ۱۴ms',
  },
  {
    id: 'map-game-c1',
    hub: 'game',
    kind: 'club',
    nameEn: 'Night City Cyber Arena HQ',
    nameFa: 'کلاب سایبر آرنا نایت سیتی',
    subtitleEn: '240Hz LAN rigs · Weekly FC 27 & CS2 LAN brackets',
    subtitleFa: 'سیستم‌های ۲۴۰ هرتز · براکت هفتگی FC 27 و CS2',
    districtEn: 'Watson Tech Corridor',
    districtFa: 'کوریدور فناوری واتسون',
    xPct: 68,
    yPct: 26,
    distanceMeters: 620,
    rating: 4.8,
    activeCount: 38,
    tags: ['lan', 'arena', 'fc27', 'cs2', 'club', 'tournament'],
    statusTextEn: '38 Players Online',
    statusTextFa: '۳۸ بازیکن آنلاین',
  },
  {
    id: 'map-game-s1',
    hub: 'game',
    kind: 'store',
    nameEn: 'Cyberware Pro Armory Vault',
    nameFa: 'فروشگاه تجهیزات سایبرور گیمینگ',
    subtitleEn: 'Hall-effect keyboards, carbon DualSense & pro mice nearby',
    subtitleFa: 'کیبورد هال‌افکت، کنترلر کربن و موس‌های حرفه‌ای نزدیک شما',
    districtEn: 'Kabuki Tech Market',
    districtFa: 'بازار تکنولوژی کابوکی',
    xPct: 76,
    yPct: 64,
    distanceMeters: 850,
    rating: 4.9,
    activeCount: 19,
    tags: ['store', 'mouse', 'keyboard', 'controller', 'gear', 'cyberware'],
    linkedStoreCollectionId: 'game-pro-armory',
    statusTextEn: 'Open · Same-Day Pickup',
    statusTextFa: 'باز · تحویل فوری حضوری',
  },
  {
    id: 'map-game-u2',
    hub: 'game',
    kind: 'user',
    nameEn: 'Aria_Drift99 (GTA Heist Driver)',
    nameFa: 'آریا دریفت (راننده هایست GTA)',
    subtitleEn: 'Hosting Vice Docks Heist finale · 25% cut',
    subtitleFa: 'میزبان مرحله آخر هایست اسکله وایس · سهم ۲۵٪',
    districtEn: 'Vice Marina Grid',
    districtFa: 'شبکه اسکله وایس',
    xPct: 34,
    yPct: 72,
    distanceMeters: 1150,
    rating: 4.7,
    activeCount: 3,
    tags: ['gta', 'heist', 'driver', 'crew'],
    statusTextEn: 'Lobby 3/4',
    statusTextFa: 'لابی ۳ از ۴',
  },
  {
    id: 'map-game-d1',
    hub: 'game',
    kind: 'drop',
    nameEn: 'Mirage 1v1 Cash Scrim Terminal',
    nameFa: 'ترمینال دوئل ۱ به ۱ میراژ',
    subtitleEn: 'Verified local bracket · Zero packet-loss relay',
    subtitleFa: 'براکت محلی تاییدشده · پینگ مستقیم',
    districtEn: 'Corpo Plaza Node',
    districtFa: 'نود کورپو پلازا',
    xPct: 47,
    yPct: 24,
    distanceMeters: 420,
    rating: 5.0,
    activeCount: 16,
    tags: ['scrim', '1v1', 'mirage', 'drop', 'event'],
    statusTextEn: 'Starts in 12m',
    statusTextFa: 'شروع تا ۱۲ دقیقه دیگر',
  },
  {
    id: 'map-game-s2',
    hub: 'game',
    kind: 'store',
    nameEn: 'PixelVault Retro & Key Exchange',
    nameFa: 'فروشگاه پکسل‌والت (اکانت و آیتم)',
    subtitleEn: 'Verified game keys, coach presets & community gear swaps',
    subtitleFa: 'کلید قانونی بازی، پک‌های مربی و تبادل تجهیزات گیمرها',
    districtEn: 'Westbrook Neon Strip',
    districtFa: 'بلوار وست‌بروک',
    xPct: 18,
    yPct: 54,
    distanceMeters: 1680,
    rating: 4.6,
    activeCount: 11,
    tags: ['keys', 'store', 'exchange', 'presets'],
    linkedStoreCollectionId: 'game-community-setups',
    statusTextEn: 'Active Trade Desk',
    statusTextFa: 'میز تبادل فعال',
  },

  // ============================================================================
  // 2. CINEMA & TV HUB — ANTIQUE TREASURE MAP ENTITIES
  // ============================================================================
  {
    id: 'map-cin-c1',
    hub: 'cinema',
    kind: 'club',
    nameEn: 'Lantern Noir Screening Vault',
    nameFa: 'تالار مخفی اکران سینمای نوآر',
    subtitleEn: 'Candlelit 35mm & 4K noir screenings · Tonight: Blade Runner',
    subtitleFa: 'اکران ۳۵ میلی‌متری و ۴K سینمای نوآر · امشب: بلید رانر',
    districtEn: 'Old Pier Compass Point',
    districtFa: 'بندرگاه قدیمی · دماغه فانوس',
    xPct: 72,
    yPct: 28,
    distanceMeters: 490,
    rating: 4.9,
    activeCount: 24,
    tags: ['noir', '35mm', 'screening', 'club', 'cinema'],
    statusTextEn: '24 Cinephiles Inside',
    statusTextFa: '۲۴ سینمادوست داخل سالن',
  },
  {
    id: 'map-cin-s1',
    hub: 'cinema',
    kind: 'store',
    nameEn: 'Lumiere Steelbook & Camera Guild',
    nameFa: 'گنجینه دوربین سوپر۸ و استیل‌بوک لومیر',
    subtitleEn: 'Rare Criterion editions, vintage Super-8 lenses & directors books',
    subtitleFa: 'نسخه‌های کمیاب کرایتریون، دوربین سوپر۸ و کتاب‌های کارگردانی',
    districtEn: 'Harbor Antiquarian Row',
    districtFa: 'راسته عتیقه‌فروشان سینما',
    xPct: 28,
    yPct: 68,
    distanceMeters: 740,
    rating: 5.0,
    activeCount: 14,
    tags: ['store', 'criterion', 'bluray', 'super8', 'books', 'cinema'],
    linkedStoreCollectionId: 'cinema-criterion-vault',
    statusTextEn: '4 Rare Relics Found',
    statusTextFa: '۴ نسخه کلکسیونی موجود',
  },
  {
    id: 'map-cin-u1',
    hub: 'cinema',
    kind: 'user',
    nameEn: 'Maya_Sakuga (Tokyo Anime Archivist)',
    nameFa: 'مایا ساکوگا (آرشیویست انیمه توکیو)',
    subtitleEn: 'Hosting synced subtitle watch-party for seasonal anime',
    subtitleFa: 'میزبان تماشای گروهی انیمه با زیرنویس هماهنگ‌شده',
    districtEn: 'Misty Strait Lookout',
    districtFa: 'تنگه مه‌آلود',
    xPct: 24,
    yPct: 28,
    distanceMeters: 310,
    rating: 4.8,
    activeCount: 1,
    tags: ['anime', 'sakuga', 'watchparty', 'user'],
    statusTextEn: 'Watching Ep. 12',
    statusTextFa: 'در حال تماشای قسمت ۱۲',
  },
  {
    id: 'map-cin-d1',
    hub: 'cinema',
    kind: 'drop',
    nameEn: 'X-Mark: Lost 80s VHS Climax Reel',
    nameFa: 'نشان گنج: حلقه کمیاب VHS دهه ۸۰',
    subtitleEn: 'Community film-club treasure cache & director commentary feed',
    subtitleFa: 'گنجینه حلقه کالت دهه ۸۰ با تفسیر مستقیم کارگردان',
    districtEn: 'Sunken Reef Lagoon',
    districtFa: 'مرداب صخره‌های غرق‌شده',
    xPct: 58,
    yPct: 64,
    distanceMeters: 1420,
    rating: 4.9,
    activeCount: 9,
    tags: ['vhs', 'treasure', '80s', 'drop', 'cult'],
    statusTextEn: 'Treasure Cache Unlocked',
    statusTextFa: 'صندوقچه گنج باز است',
  },
  {
    id: 'map-cin-u2',
    hub: 'cinema',
    kind: 'user',
    nameEn: 'Det. Kurosawa (Crime Theory Hunter)',
    nameFa: 'کارآگاه کوروساوا (شکارچی تئوری سریال)',
    subtitleEn: 'Decoding True Detective & Mr. Robot timeline clues nearby',
    subtitleFa: 'تحلیل سرنخ‌های سریال‌های جنایی و فینال Mr. Robot',
    districtEn: 'Signal Cliff Watchtower',
    districtFa: 'برج دیده‌بانی سیگنال',
    xPct: 80,
    yPct: 58,
    distanceMeters: 1890,
    rating: 4.7,
    activeCount: 2,
    tags: ['series', 'crime', 'detective', 'mystery'],
    statusTextEn: 'Open Discussion',
    statusTextFa: 'گفتگوی زنده باز',
  },
  {
    id: 'map-cin-s2',
    hub: 'cinema',
    kind: 'store',
    nameEn: 'Atelier Poster & Prop Foundry',
    nameFa: 'کارگاه پوستر و ماکت‌های سینمایی',
    subtitleEn: 'Screen-printed festival posters & cinema room acoustics',
    subtitleFa: 'پوسترهای چاپ دستی جشنواره‌ها و تجهیزات اتاق سینما',
    districtEn: 'Brass Cartographer Square',
    districtFa: 'میدان نقشه‌نگاران برنزی',
    xPct: 44,
    yPct: 24,
    distanceMeters: 960,
    rating: 4.8,
    activeCount: 8,
    tags: ['poster', 'props', 'store', 'collector'],
    linkedStoreCollectionId: 'cinema-posters-props',
    statusTextEn: 'Collector Bazaar Open',
    statusTextFa: 'بازار کلکسیونرها باز است',
  },

  // ============================================================================
  // 3. MUSIC & AUDIO HUB — MUSICAL SCORE / VINYL ACOUSTIC MAP ENTITIES
  // ============================================================================
  {
    id: 'map-aud-c1',
    hub: 'audio',
    kind: 'club',
    nameEn: 'Westworld Velvet Jazz Saloon',
    nameFa: 'سالن مخملی جز وست‌ورلد',
    subtitleEn: 'Live upright piano & dusty blues jam · 84 BPM warm room',
    subtitleFa: 'اجرای زنده پیانو و بلوز گرم · تمپو ۸۴ BPM',
    districtEn: 'Treble Clef Avenue',
    districtFa: 'بلوار کلید سل',
    xPct: 30,
    yPct: 32,
    distanceMeters: 340,
    rating: 4.9,
    activeCount: 31,
    tags: ['jazz', 'piano', 'blues', 'westworld', 'club'],
    statusTextEn: 'Live Trio · 84 BPM',
    statusTextFa: 'اجرای زنده · ۸۴ BPM',
  },
  {
    id: 'map-aud-s1',
    hub: 'audio',
    kind: 'store',
    nameEn: 'Tube & Walnut Vinyl Sanctuary',
    nameFa: 'فروشگاه وینیل و سینتی‌سایزر لامپی',
    subtitleEn: '180g audiophile vinyls, analog synths & planar headphones',
    subtitleFa: 'صفحات وینیل ۱۸۰ گرم، سینت آنالوگ و هدفون پلنار استودیویی',
    districtEn: 'Harmonic Arcade · Fifth Bar',
    districtFa: 'گذر هارمونیک · میزان پنجم',
    xPct: 74,
    yPct: 34,
    distanceMeters: 590,
    rating: 5.0,
    activeCount: 17,
    tags: ['vinyl', 'synth', 'headphones', 'store', 'tube'],
    linkedStoreCollectionId: 'audio-studio-sanctuary',
    statusTextEn: 'Listening Booth Free',
    statusTextFa: 'کابین تست صدا آزاد است',
  },
  {
    id: 'map-aud-u1',
    hub: 'audio',
    kind: 'user',
    nameEn: 'Nora_Modular (Berlin Techno DJ)',
    nameFa: 'نورا ماژولار (دی‌جی تکنو برلین)',
    subtitleEn: 'Patching Eurorack acid basslines · Looking for vocal stem swaps',
    subtitleFa: 'پچ‌کردن یورورک و اسید باس · تبادل سمپل و وکال',
    districtEn: 'Sub-Bass Vaults',
    districtFa: 'طاق‌های ساب‌باس',
    xPct: 70,
    yPct: 72,
    distanceMeters: 920,
    rating: 4.8,
    activeCount: 1,
    tags: ['berlin', 'techno', 'rave', 'modular', 'user'],
    statusTextEn: '142 BPM Live Patch',
    statusTextFa: 'پچ زنده ۱۴۲ BPM',
  },
  {
    id: 'map-aud-d1',
    hub: 'audio',
    kind: 'drop',
    nameEn: '432Hz Midnight Cathedral Session',
    nameFa: 'سشن ۴۳۲ هرتز مدیتیشن نیمه‌شب',
    subtitleEn: 'Synchronized ambient spatial breathing & sleep resonance circle',
    subtitleFa: 'حلقه هم‌زمان امبینت، فرکانس آرامش و مدیتیشن فضایی',
    districtEn: 'Silk Resonance Park',
    districtFa: 'باغ رزونانس ابریشمی',
    xPct: 26,
    yPct: 70,
    distanceMeters: 480,
    rating: 4.9,
    activeCount: 22,
    tags: ['meditation', '432hz', 'ambient', 'sleep', 'drop'],
    statusTextEn: '22 Listeners Tuned In',
    statusTextFa: '۲۲ شنونده هم‌کوک',
  },
  {
    id: 'map-aud-u2',
    hub: 'audio',
    kind: 'user',
    nameEn: 'Hafez_Chronicle (Audiobook Narrator)',
    nameFa: 'راوی حافظیه (گوینده کتاب صوتی و شعر)',
    subtitleEn: 'Hosting philosophy salon & chapter bookmarks from AC Library',
    subtitleFa: 'میزبان محفل شعر، فلسفه و کتاب صوتی کتابخانه قدیمی',
    districtEn: 'Parchment Stave Terrace',
    districtFa: 'ایوان کتابخانه حامل',
    xPct: 50,
    yPct: 22,
    distanceMeters: 1250,
    rating: 4.9,
    activeCount: 4,
    tags: ['audiobook', 'poetry', 'podcast', 'user', 'philosophy'],
    statusTextEn: 'Reading Chapter 2',
    statusTextFa: 'خوانش فصل دوم',
  },
  {
    id: 'map-aud-s2',
    hub: 'audio',
    kind: 'store',
    nameEn: 'Acoustic Press & Podcast Atelier',
    nameFa: 'فروشگاه میکروفون پادکست و کتاب صوتی',
    subtitleEn: 'Condenser mics, literary audio folios & community vinyl crates',
    subtitleFa: 'میکروفون‌های استودیویی، کالکشن کتاب صوتی و صفحات دست‌دوم کاربران',
    districtEn: 'Crescendo Row',
    districtFa: 'راسته کرشندو',
    xPct: 48,
    yPct: 76,
    distanceMeters: 1580,
    rating: 4.7,
    activeCount: 12,
    tags: ['podcast', 'mic', 'store', 'books', 'vinyl'],
    linkedStoreCollectionId: 'audio-vinyl-crates',
    statusTextEn: 'Open · Trade-Ins Accepted',
    statusTextFa: 'باز · خرید و معاوضه فعال',
  },
];

function normalizeSearch(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/‌/g, ' ');
}

export function filterMapEntities(options: MapFilterOptions): PlatformMapEntity[] {
  const q = normalizeSearch(options.query);
  return MAP_ENTITIES.filter((entity) => {
    if (entity.hub !== options.hub) return false;
    if (options.kind !== 'all' && entity.kind !== options.kind) return false;
    if (
      options.maxDistanceMeters !== null &&
      entity.distanceMeters > options.maxDistanceMeters
    ) {
      return false;
    }
    if (!q) return true;
    const haystack = normalizeSearch(
      [
        entity.nameEn,
        entity.nameFa,
        entity.subtitleEn,
        entity.subtitleFa,
        entity.districtEn,
        entity.districtFa,
        entity.statusTextEn,
        entity.statusTextFa,
        ...entity.tags,
      ].join(' ')
    );
    return haystack.includes(q);
  }).sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export function formatDistanceLabel(meters: number, isRtl: boolean): string {
  if (meters < 1000) {
    return isRtl ? `${meters} متر` : `${meters}m`;
  }
  const km = (Math.round(meters / 100) / 10).toFixed(1);
  return isRtl ? `${km} کیلومتر` : `${km}km`;
}
