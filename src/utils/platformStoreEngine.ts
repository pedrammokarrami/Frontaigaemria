import type { MasterHubId } from '../components/spatial/MasterHubSwitcher';

export type StoreSourceKind = 'online-store' | 'community' | 'collection';
export type StoreItemRarity = 'mythic' | 'epic' | 'rare' | 'standard';
export type StoreSortMode = 'featured' | 'price-asc' | 'price-desc' | 'newest';

export interface StoreCollectionShelf {
  id: string;
  hub: MasterHubId;
  titleEn: string;
  titleFa: string;
  curatorEn: string;
  curatorFa: string;
  sourceLabelEn: string;
  sourceLabelFa: string;
  itemCountLabelEn: string;
  itemCountLabelFa: string;
  accentHex: string;
}

export interface StoreProductItem {
  id: string;
  hub: MasterHubId;
  sourceKind: StoreSourceKind;
  isUserListing: boolean;
  hasImageUpload: boolean; // Always false for community user listings!
  imageUrl: string | null; // Null for user listings without upload
  titleEn: string;
  titleFa: string;
  descriptionEn: string;
  descriptionFa: string;
  category: string;
  priceUsd: number;
  sellerName: string;
  partnerSiteName: string;
  collectionId?: string;
  rarity: StoreItemRarity;
  conditionLabelEn: string;
  conditionLabelFa: string;
  rating: number;
  createdAtMs: number;
  tags: string[];
}

export interface StoreFilterOptions {
  hub: MasterHubId;
  query: string;
  source: 'all' | StoreSourceKind;
  category: string; // 'all' or category name
  collectionId: string | null;
  maxPriceUsd: number | null;
  sortBy: StoreSortMode;
}

export interface NewUserListingInput {
  hub: MasterHubId;
  title: string;
  priceRaw: string;
  category: string;
  condition: 'New' | 'Mint Used' | 'Digital / Code' | 'Collector';
  description: string;
  sellerName: string;
}

export interface ValidationResult<T> {
  ok: boolean;
  errorEn?: string;
  errorFa?: string;
  item?: T;
}

const USER_LISTINGS_STORAGE_KEY = 'aipetros-store-user-listings-v1';

export const STORE_CATEGORIES_BY_HUB: Record<MasterHubId, string[]> = {
  game: ['all', 'Peripherals', 'Controllers', 'Audio & Mics', 'In-Game Items', 'Collectibles'],
  cinema: ['all', '4K UHD & Blu-ray', 'Cameras & Lenses', 'Books & Scripts', 'Posters & Props', 'Home Theater'],
  audio: ['all', 'Vinyl Records', 'Synthesizers', 'Headphones & Amps', 'Microphones', 'Audiobooks & Scores'],
};

export const STORE_COLLECTIONS: StoreCollectionShelf[] = [
  // GAME COLLECTIONS
  {
    id: 'game-pro-armory',
    hub: 'game',
    titleEn: 'Cyberware Pro Aim Loadout',
    titleFa: 'کالکشن تجهیزات حرفه‌ای سایبرور',
    curatorEn: 'Curated from Razer, Wooting & Steam Community',
    curatorFa: 'پیشنهاد از فروشگاه‌های Razer، Wooting و کامیونیتی استیم',
    sourceLabelEn: 'Partner Store Drop',
    sourceLabelFa: 'پیشنهاد فروشگاه آنلاین',
    itemCountLabelEn: '18 Items',
    itemCountLabelFa: '۱۸ آیتم',
    accentHex: '#00F0FF',
  },
  {
    id: 'game-community-setups',
    hub: 'game',
    titleEn: 'Verified Player Setups & Trades',
    titleFa: 'کالکشن ستاپ‌ها و تبادلات کاربران',
    curatorEn: 'Listed directly by ranked arena players nearby',
    curatorFa: 'ثبت‌شده مستقیم توسط گیمرهای رنک‌دار',
    sourceLabelEn: 'User Collection',
    sourceLabelFa: 'کالکشن کاربران',
    itemCountLabelEn: '12 Listings',
    itemCountLabelFa: '۱۲ آگهی کاربر',
    accentHex: '#FCEE0A',
  },
  // CINEMA COLLECTIONS
  {
    id: 'cinema-criterion-vault',
    hub: 'cinema',
    titleEn: 'Noir & Criterion 4K Master Vault',
    titleFa: 'کالکشن شاهکارهای نوآر و ۴K کرایتریون',
    curatorEn: 'Sourced from Criterion, A24 Shop & MUBI Editions',
    curatorFa: 'گردآوری از Criterion، فروشگاه A24 و MUBI',
    sourceLabelEn: 'Film Store Collection',
    sourceLabelFa: 'کالکشن فروشگاه فیلم',
    itemCountLabelEn: '24 Editions',
    itemCountLabelFa: '۲۴ نسخه',
    accentHex: '#E5A93C',
  },
  {
    id: 'cinema-posters-props',
    hub: 'cinema',
    titleEn: 'Indie Directors & Props Curated Shelf',
    titleFa: 'قفسه پلات‌پوینت، پوستر و کتاب‌های فیلم‌سازی',
    curatorEn: 'Shared by film school archivists & cinema collectors',
    curatorFa: 'منتخب آرشیویست‌ها و کارگردانان مستقل',
    sourceLabelEn: 'Community Archive',
    sourceLabelFa: 'آرشیو کاربران سینما',
    itemCountLabelEn: '9 Finds',
    itemCountLabelFa: '۹ اثر کمیاب',
    accentHex: '#E11D48',
  },
  // AUDIO COLLECTIONS
  {
    id: 'audio-studio-sanctuary',
    hub: 'audio',
    titleEn: 'Warm Tube & Analog Synth Rack',
    titleFa: 'کالکشن سینتی‌سایزرهای آنالوگ و آمپ لامپی',
    curatorEn: 'Suggested from Sweetwater, Thomann & Moog Archive',
    curatorFa: 'پیشنهاد از Sweetwater، Thomann و آرشیو موگ',
    sourceLabelEn: 'Boutique Audio Feed',
    sourceLabelFa: 'فروشگاه تجهیزات صدا',
    itemCountLabelEn: '16 Instruments',
    itemCountLabelFa: '۱۶ ساز و تجهیزات',
    accentHex: '#D4AF37',
  },
  {
    id: 'audio-vinyl-crates',
    hub: 'audio',
    titleEn: 'Midnight Jazz & Poetry Vinyl Crates',
    titleFa: 'جعبه‌های وینیل جز نیمه‌شب و کتاب‌های صوتی',
    curatorEn: 'Bandcamp Independent Labels & Community Crates',
    curatorFa: 'لیبل‌های مستقل بندکمپ و کالکشن کاربران',
    sourceLabelEn: 'Vinyl Collection',
    sourceLabelFa: 'کالکشن وینیل و کتاب',
    itemCountLabelEn: '21 Pressings',
    itemCountLabelFa: '۲۱ صفحه و کتاب',
    accentHex: '#FA243C',
  },
];

export const INITIAL_STORE_PRODUCTS: StoreProductItem[] = [
  // ============================================================================
  // GAME HUB PRODUCTS
  // ============================================================================
  {
    id: 'prod-game-1',
    hub: 'game',
    sourceKind: 'online-store',
    isUserListing: false,
    hasImageUpload: false,
    imageUrl: '/src/assets/images/store_game_gear_1795266468570.jpg',
    titleEn: 'Zero-Latency Carbon Esports Mouse + Modded Pad Bundle',
    titleFa: 'باندل موس بی‌سیم کربن و کنترلر تاکتیکال اسپورت',
    descriptionEn: '49g magnesium-carbon shell, 8KHz polling sensor paired with custom back-paddle DualSense pro shell.',
    descriptionFa: 'بدنه فوق‌سبک ۴۹ گرمی کربن با سنسور ۸۰۰۰ هرتز به همراه کنترلر پرو پدال‌دار.',
    category: 'Peripherals',
    priceUsd: 169,
    sellerName: 'Razer & Scuf Official Feed',
    partnerSiteName: 'Amazon Gaming / BestBuy',
    collectionId: 'game-pro-armory',
    rarity: 'mythic',
    conditionLabelEn: 'New · Partner Store',
    conditionLabelFa: 'آکبند · فروشگاه رسمی',
    rating: 4.9,
    createdAtMs: 1763600000000,
    tags: ['mouse', 'controller', 'carbon', 'esports', 'cs2', 'fc27', 'razer'],
  },
  {
    id: 'prod-game-2',
    hub: 'game',
    sourceKind: 'collection',
    isUserListing: false,
    hasImageUpload: false,
    imageUrl: '/src/assets/images/lab_room_valorant_1795174736628.jpg',
    titleEn: 'Hall-Effect 65% Rapid Trigger Keyboard (Radianite Edition)',
    titleFa: 'کیبورد مکانیکال رپید-تریگر ۶۵٪ نسخه رادیانیت',
    descriptionEn: '0.1mm actuation reset point engineered for pixel-accurate counter-strafing in CS2 and Valorant.',
    descriptionFa: 'نقطه قطع ۰.۱ میلی‌متری مخصوص استریپ و شلیک دقیق در CS2 و ولورانت.',
    category: 'Peripherals',
    priceUsd: 195,
    sellerName: 'Wooting Global Direct',
    partnerSiteName: 'wooting.io',
    collectionId: 'game-pro-armory',
    rarity: 'epic',
    conditionLabelEn: 'In Stock · Direct Feed',
    conditionLabelFa: 'موجود · ارسال مستقیم',
    rating: 5.0,
    createdAtMs: 1763590000000,
    tags: ['keyboard', 'hall-effect', 'valorant', 'cs2', 'rapid-trigger'],
  },
  {
    id: 'prod-game-3',
    hub: 'game',
    sourceKind: 'online-store',
    isUserListing: false,
    hasImageUpload: false,
    imageUrl: '/src/assets/images/ue5_gta_social_hub_1795036738605.jpg',
    titleEn: 'Vice Marina Collector Steelbook + Custom Heist Blueprints',
    titleFa: 'پک کلکسیونی وایس مارینا + نقشه چاپی هایست',
    descriptionEn: 'Limited neon embossed case with stitched tactical street map and digital soundtrack voucher.',
    descriptionFa: 'قاب فلزی نئونی نسخه محدود همراه نقشه پارچه‌ای تاکتیکال و کد آلبوم موسیقی.',
    category: 'Collectibles',
    priceUsd: 78,
    sellerName: 'PlayStation Direct Showcase',
    partnerSiteName: 'direct.playstation.com',
    collectionId: 'game-community-setups',
    rarity: 'rare',
    conditionLabelEn: 'Collector Drop',
    conditionLabelFa: 'نسخه کلکسیونی',
    rating: 4.8,
    createdAtMs: 1763580000000,
    tags: ['gta', 'steelbook', 'map', 'collectible', 'playstation'],
  },
  {
    id: 'prod-game-4',
    hub: 'game',
    sourceKind: 'community',
    isUserListing: true,
    hasImageUpload: false,
    imageUrl: null,
    titleEn: 'DualSense Edge Custom Tension Sticks (Used 2 Weeks)',
    titleFa: 'کنترلر DualSense Edge با استیک‌های تنظیم‌پذیر',
    descriptionEn: 'Mint condition from local arena player. Includes full braided lockable USB-C cable, 4 domes, and hard travel case.',
    descriptionFa: 'کاملاً تمیز و در حد نو از گیمر آرنا؛ همراه کیف سخت، کابل قفل‌دار و ۴ سری اضافه.',
    category: 'Controllers',
    priceUsd: 135,
    sellerName: '@Saman_Valkyrie',
    partnerSiteName: 'Community Player Market',
    collectionId: 'game-community-setups',
    rarity: 'epic',
    conditionLabelEn: 'Mint Used · Community',
    conditionLabelFa: 'در حد نو · آگهی کاربر',
    rating: 4.9,
    createdAtMs: 1763570000000,
    tags: ['controller', 'dualsense', 'used', 'community', 'fc27'],
  },

  // ============================================================================
  // CINEMA & TV HUB PRODUCTS
  // ============================================================================
  {
    id: 'prod-cin-1',
    hub: 'cinema',
    sourceKind: 'online-store',
    isUserListing: false,
    hasImageUpload: false,
    imageUrl: '/src/assets/images/store_cinema_collector_1795266469643.jpg',
    titleEn: 'Super-8 Heritage Camera + Noir Monograph & 4K Steelbook Box',
    titleFa: 'پک دوربین کلاسیک سوپر۸ + مونوگراف نوآر و استیل‌بوک ۴K',
    descriptionEn: 'Restored optical Super-8 body paired with a 320-page hardcover cinematography study and anodized steelbook.',
    descriptionFa: 'دوربین کلاسیک سرویس‌شده سوپر۸ به همراه کتاب ۳۲۰ صفحه‌ای نورپردازی نوآر و قاب استیل‌بوک.',
    category: 'Cameras & Lenses',
    priceUsd: 340,
    sellerName: 'Criterion & Kodak Vault',
    partnerSiteName: 'criterion.com / B&H',
    collectionId: 'cinema-criterion-vault',
    rarity: 'mythic',
    conditionLabelEn: 'Curated Store Bundle',
    conditionLabelFa: 'پک ویژه فروشگاه فیلم',
    rating: 5.0,
    createdAtMs: 1763600000000,
    tags: ['super8', 'camera', 'criterion', 'noir', '4k', 'book'],
  },
  {
    id: 'prod-cin-2',
    hub: 'cinema',
    sourceKind: 'collection',
    isUserListing: false,
    hasImageUpload: false,
    imageUrl: '/src/assets/images/room_cinema_noir_hall_1795254621048.jpg',
    titleEn: 'Blade Runner 2049 Dolby Vision 4K Collector Edition',
    titleFa: 'نسخه کلکسیونی بلید رانر ۲۰۴۹ (4K Dolby Vision)',
    descriptionEn: 'Triple-disc UHD Blu-ray with isolated score track, storyboards booklet, and director cut archival essays.',
    descriptionFa: 'سه دیسک بلوری 4K UHD به همراه کتابچه استوری‌بورد و تحلیل پلان‌های دنی ویلنوو.',
    category: '4K UHD & Blu-ray',
    priceUsd: 49,
    sellerName: 'A24 & Warner Archive',
    partnerSiteName: 'shop.a24films.com',
    collectionId: 'cinema-criterion-vault',
    rarity: 'epic',
    conditionLabelEn: 'Limited Pressing',
    conditionLabelFa: 'نسخه محدود ۴K',
    rating: 4.9,
    createdAtMs: 1763590000000,
    tags: ['blade runner', '4k', 'bluray', 'noir', 'steelbook'],
  },
  {
    id: 'prod-cin-3',
    hub: 'cinema',
    sourceKind: 'online-store',
    isUserListing: false,
    hasImageUpload: false,
    imageUrl: '/src/assets/images/room_anime_tokyo_rain_1795254620688.jpg',
    titleEn: 'Studio Tokyo Sakuga Keyframe Artbook (Slipcase Edition)',
    titleFa: 'آرت‌بوک کی‌فریم‌های انیمه توکیو (چاپ ژاپن)',
    descriptionEn: 'High-grammage art folio reproducing 240 hand-inked cyberpunk rain animation frames and camera dope sheets.',
    descriptionFa: 'آلبوم گلاسه سنگین شامل ۲۴۰ فریم کلیدی انیمیشن سایبرپانک بارانی توکیو.',
    category: 'Books & Scripts',
    priceUsd: 64,
    sellerName: 'Kinokuniya Arts Feed',
    partnerSiteName: 'kinokuniya.com',
    collectionId: 'cinema-posters-props',
    rarity: 'rare',
    conditionLabelEn: 'Imported Print',
    conditionLabelFa: 'چاپ کلکسیونی',
    rating: 4.8,
    createdAtMs: 1763580000000,
    tags: ['anime', 'sakuga', 'tokyo', 'artbook', 'book'],
  },
  {
    id: 'prod-cin-4',
    hub: 'cinema',
    sourceKind: 'community',
    isUserListing: true,
    hasImageUpload: false,
    imageUrl: null,
    titleEn: 'Signed True Detective Season 1 Annotated Shooting Script',
    titleFa: 'فیلم‌نامه حاشیه‌نویسی‌شده فصل اول True Detective',
    descriptionEn: 'Spiral-bound collector screenplay copy with hand notes on lighting setups, long-take tracking choreography, and Carcosa motifs.',
    descriptionFa: 'نسخه فنری کلکسیونی با یادداشت‌های کامل نورپردازی و تحلیل سکانس پلان طولانی.',
    category: 'Books & Scripts',
    priceUsd: 42,
    sellerName: '@Parisa_Archivist',
    partnerSiteName: 'Cinema Collectors Exchange',
    collectionId: 'cinema-posters-props',
    rarity: 'rare',
    conditionLabelEn: 'Collector · User Listing',
    conditionLabelFa: 'کلکسیونی · آگهی کاربر',
    rating: 4.9,
    createdAtMs: 1763570000000,
    tags: ['script', 'series', 'true detective', 'screenplay', 'community'],
  },

  // ============================================================================
  // MUSIC & AUDIO HUB PRODUCTS
  // ============================================================================
  {
    id: 'prod-aud-1',
    hub: 'audio',
    sourceKind: 'online-store',
    isUserListing: false,
    hasImageUpload: false,
    imageUrl: '/src/assets/images/store_audio_synth_1795266470797.jpg',
    titleEn: 'Walnut Tube Analog Synthesizer + 180g Audiophile Vinyl Bundle',
    titleFa: 'سینتی‌سایزر آنالوگ گردویی لامپی + صفحه وینیل ۱۸۰ گرم',
    descriptionEn: 'Dual VCO semi-modular analog synth with vacuum tube warmth stage, paired with planar studio headphones and vinyl LP.',
    descriptionFa: 'سینت آنالوگ دو اسیلاتوره با پری‌امپ لامپی واقعی، همراه هدفون پلنار و صفحه وینیل.',
    category: 'Synthesizers',
    priceUsd: 485,
    sellerName: 'Sweetwater Boutique Feed',
    partnerSiteName: 'sweetwater.com / Thomann',
    collectionId: 'audio-studio-sanctuary',
    rarity: 'mythic',
    conditionLabelEn: 'Studio Flagship',
    conditionLabelFa: 'پرچمدار استودیویی',
    rating: 5.0,
    createdAtMs: 1763600000000,
    tags: ['synth', 'analog', 'tube', 'vinyl', 'headphones', 'studio'],
  },
  {
    id: 'prod-aud-2',
    hub: 'audio',
    sourceKind: 'collection',
    isUserListing: false,
    hasImageUpload: false,
    imageUrl: '/src/assets/images/room_audio_westworld_cafe_1795254621285.jpg',
    titleEn: 'Westworld Nocturne Sessions — 180g Gatefold Double Vinyl',
    titleFa: 'آلبوم دوصفحه‌ای وینیل جلسات شبانه کافه وست‌ورلد',
    descriptionEn: 'Pressed at 45 RPM on virgin black vinyl. Features ragtime piano improvisations and desert slide guitar.',
    descriptionFa: 'پرس ۴۵ دور کلکسیونی شامل قطعات زنده پیانو، بلوز و اسلاید گیتار کافه وست‌ورلد.',
    category: 'Vinyl Records',
    priceUsd: 38,
    sellerName: 'Vinyl Me, Please Feed',
    partnerSiteName: 'bandcamp.com / VMP',
    collectionId: 'audio-vinyl-crates',
    rarity: 'epic',
    conditionLabelEn: '180g New Pressing',
    conditionLabelFa: 'چاپ جدید ۱۸۰ گرم',
    rating: 4.9,
    createdAtMs: 1763590000000,
    tags: ['vinyl', 'jazz', 'westworld', 'piano', 'blues'],
  },
  {
    id: 'prod-aud-3',
    hub: 'audio',
    sourceKind: 'online-store',
    isUserListing: false,
    hasImageUpload: false,
    imageUrl: '/src/assets/images/room_audio_podcast_studio_1795263256052.jpg',
    titleEn: 'Broadcast Near-Field Cardioid Condenser Mic + Pop Filter',
    titleFa: 'میکروفون کاندنسر برادکست استودیو پادکست',
    descriptionEn: 'Warm low-self-noise capsule voiced for intimate audiobook narration, philosophy salons, and podcast mastering.',
    descriptionFa: 'کپسول کم‌نویز با گرمای وکال بالا مخصوص ضبط پادکست و کتاب صوتی.',
    category: 'Microphones',
    priceUsd: 215,
    sellerName: 'Shure & Neumann Showcase',
    partnerSiteName: 'thomann.de',
    collectionId: 'audio-studio-sanctuary',
    rarity: 'rare',
    conditionLabelEn: 'Studio Verified',
    conditionLabelFa: 'تایید استودیو',
    rating: 4.8,
    createdAtMs: 1763580000000,
    tags: ['mic', 'podcast', 'condenser', 'audiobook', 'vocal'],
  },
  {
    id: 'prod-aud-4',
    hub: 'audio',
    sourceKind: 'community',
    isUserListing: true,
    hasImageUpload: false,
    imageUrl: null,
    titleEn: 'Handmade 432Hz Brass Singing Bowl + Berlin Techno Patch Pack',
    titleFa: 'کاسه برنجی کوک ۴۳۲ هرتز + پک پچ‌های تکنو برلین',
    descriptionEn: 'Hand-hammered acoustic meditation bowl tested for 432Hz sustain, bundled with 40 analog synth wave patches.',
    descriptionFa: 'کاسه مدیتیشن دست‌ساز با فرکانس دقیق ۴۳۲ هرتز به همراه ۴۰ پچ صوتی سینت.',
    category: 'Audiobooks & Scores',
    priceUsd: 89,
    sellerName: '@Darius_Harmonic',
    partnerSiteName: 'Community Musician Market',
    collectionId: 'audio-vinyl-crates',
    rarity: 'epic',
    conditionLabelEn: 'Handcrafted · User',
    conditionLabelFa: 'دست‌ساز · آگهی کاربر',
    rating: 4.9,
    createdAtMs: 1763570000000,
    tags: ['432hz', 'meditation', 'berlin', 'synth', 'community'],
  },
];

function normalizeStoreText(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/‌/g, ' ');
}

export function filterStoreProducts(
  products: StoreProductItem[],
  options: StoreFilterOptions
): StoreProductItem[] {
  const q = normalizeStoreText(options.query);
  const filtered = products.filter((item) => {
    if (item.hub !== options.hub) return false;
    if (options.source !== 'all' && item.sourceKind !== options.source) return false;
    if (options.category !== 'all' && item.category !== options.category) return false;
    if (options.collectionId && item.collectionId !== options.collectionId) return false;
    if (options.maxPriceUsd !== null && item.priceUsd > options.maxPriceUsd) return false;
    if (!q) return true;
    const hay = normalizeStoreText(
      [
        item.titleEn,
        item.titleFa,
        item.descriptionEn,
        item.descriptionFa,
        item.category,
        item.sellerName,
        item.partnerSiteName,
        ...item.tags,
      ].join(' ')
    );
    return hay.includes(q);
  });

  const sorted = [...filtered];
  if (options.sortBy === 'price-asc') {
    sorted.sort((a, b) => a.priceUsd - b.priceUsd);
  } else if (options.sortBy === 'price-desc') {
    sorted.sort((a, b) => b.priceUsd - a.priceUsd);
  } else if (options.sortBy === 'newest') {
    sorted.sort((a, b) => b.createdAtMs - a.createdAtMs);
  } else {
    // Featured puts newest community listings right after mythic showcase or sorted naturally
    sorted.sort((a, b) => b.createdAtMs - a.createdAtMs);
  }
  return sorted;
}

export function validateAndCreateUserListing(
  input: NewUserListingInput
): ValidationResult<StoreProductItem> {
  const title = input.title.trim();
  const description = input.description.trim();
  const category = input.category.trim();
  const seller = input.sellerName.trim() || '@You';
  const parsedPrice = Number(input.priceRaw.replace(/[^0-9.]/g, ''));

  if (title.length < 3) {
    return {
      ok: false,
      errorEn: 'Product title must be at least 3 characters.',
      errorFa: 'عنوان محصول باید حداقل ۳ کاراکتر باشد.',
    };
  }
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    return {
      ok: false,
      errorEn: 'Please enter a valid price greater than $0.',
      errorFa: 'لطفاً یک قیمت معتبر بیشتر از صفر وارد کنید.',
    };
  }
  if (description.length < 12) {
    return {
      ok: false,
      errorEn: 'Please add a full product description (at least 12 characters).',
      errorFa: 'لطفاً توضیحات کامل محصول (حداقل ۱۲ کاراکتر) را بنویسید.',
    };
  }
  if (!category || category === 'all') {
    return {
      ok: false,
      errorEn: 'Select a valid product category.',
      errorFa: 'لطفاً یک دسته‌بندی مشخص انتخاب کنید.',
    };
  }

  const condFaMap: Record<NewUserListingInput['condition'], string> = {
    New: 'آکبند · آگهی کاربر',
    'Mint Used': 'در حد نو · آگهی کاربر',
    'Digital / Code': 'دیجیتال / کد · آگهی کاربر',
    Collector: 'کلکسیونی · آگهی کاربر',
  };

  const created: StoreProductItem = {
    id: `user-prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    hub: input.hub,
    sourceKind: 'community',
    isUserListing: true,
    hasImageUpload: false,
    imageUrl: null, // Explicitly NO photo upload allowed for user listings
    titleEn: title,
    titleFa: title,
    descriptionEn: description,
    descriptionFa: description,
    category,
    priceUsd: Math.round(parsedPrice * 100) / 100,
    sellerName: seller.startsWith('@') ? seller : `@${seller}`,
    partnerSiteName: 'User Marketplace Listing',
    rarity: input.condition === 'Collector' ? 'epic' : 'rare',
    conditionLabelEn: `${input.condition} · Community`,
    conditionLabelFa: condFaMap[input.condition],
    rating: 5.0,
    createdAtMs: Date.now(),
    tags: [category.toLowerCase(), 'community', 'user-listed'],
  };

  return { ok: true, item: created };
}

export function loadUserStoreListings(): StoreProductItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(USER_LISTINGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is StoreProductItem => Boolean(x && typeof x.id === 'string'))
      .map((item) => ({
        ...item,
        isUserListing: true,
        hasImageUpload: false,
        imageUrl: null, // Enforce no image upload invariant on hydrated records too
      }));
  } catch {
    return [];
  }
}

export function saveUserStoreListings(listings: StoreProductItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const sanitized = listings.map((item) => ({
      ...item,
      isUserListing: true,
      hasImageUpload: false,
      imageUrl: null,
    }));
    window.localStorage.setItem(USER_LISTINGS_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // ignore storage errors
  }
}
