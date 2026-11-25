import type { MasterHubId } from '../components/spatial/MasterHubSwitcher';

export type LanguageRegion =
  | 'All'
  | 'Americas'
  | 'Europe'
  | 'Middle East'
  | 'Asia-Pacific'
  | 'Africa';

export interface WorldLanguageItem {
  code: string;
  englishName: string;
  nativeName: string;
  region: Exclude<LanguageRegion, 'All'>;
  dir: 'ltr' | 'rtl';
  voiceBcp47: string;
  aliases?: string[];
}

export const DEFAULT_LANGUAGE_CODE = 'en';

export const LANGUAGE_REGIONS: LanguageRegion[] = [
  'All',
  'Americas',
  'Europe',
  'Middle East',
  'Asia-Pacific',
  'Africa',
];

export const WORLD_LANGUAGES: WorldLanguageItem[] = [
  { code: 'en', englishName: 'English (US / Global)', nativeName: 'English', region: 'Americas', dir: 'ltr', voiceBcp47: 'en-US', aliases: ['english', 'انگلیسی', 'us', 'uk'] },
  { code: 'en-GB', englishName: 'English (United Kingdom)', nativeName: 'English (UK)', region: 'Europe', dir: 'ltr', voiceBcp47: 'en-GB', aliases: ['british', 'uk', 'انگلیسی'] },
  { code: 'es', englishName: 'Spanish', nativeName: 'Español', region: 'Americas', dir: 'ltr', voiceBcp47: 'es-ES', aliases: ['espanol', 'اسپانیایی', 'latam'] },
  { code: 'es-MX', englishName: 'Spanish (Latin America)', nativeName: 'Español (Latinoamérica)', region: 'Americas', dir: 'ltr', voiceBcp47: 'es-MX', aliases: ['mexico', 'latam'] },
  { code: 'pt-BR', englishName: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', region: 'Americas', dir: 'ltr', voiceBcp47: 'pt-BR', aliases: ['brazil', 'پرتغالی'] },
  { code: 'pt', englishName: 'Portuguese (Portugal)', nativeName: 'Português', region: 'Europe', dir: 'ltr', voiceBcp47: 'pt-PT', aliases: ['portugal', 'پرتغالی'] },
  { code: 'fr', englishName: 'French', nativeName: 'Français', region: 'Europe', dir: 'ltr', voiceBcp47: 'fr-FR', aliases: ['francais', 'فرانسوی'] },
  { code: 'fr-CA', englishName: 'French (Canada)', nativeName: 'Français (Canada)', region: 'Americas', dir: 'ltr', voiceBcp47: 'fr-CA', aliases: ['quebec', 'canada'] },
  { code: 'de', englishName: 'German', nativeName: 'Deutsch', region: 'Europe', dir: 'ltr', voiceBcp47: 'de-DE', aliases: ['deutsch', 'آلمانی'] },
  { code: 'it', englishName: 'Italian', nativeName: 'Italiano', region: 'Europe', dir: 'ltr', voiceBcp47: 'it-IT', aliases: ['italiano', 'ایتالیایی'] },
  { code: 'fa', englishName: 'Persian (Farsi)', nativeName: 'فارسی', region: 'Middle East', dir: 'rtl', voiceBcp47: 'fa-IR', aliases: ['farsi', 'persian', 'ایران', 'فارسی'] },
  { code: 'ar', englishName: 'Arabic', nativeName: 'العربية', region: 'Middle East', dir: 'rtl', voiceBcp47: 'ar-SA', aliases: ['arabic', 'عربی'] },
  { code: 'tr', englishName: 'Turkish', nativeName: 'Türkçe', region: 'Middle East', dir: 'ltr', voiceBcp47: 'tr-TR', aliases: ['turkce', 'ترکی'] },
  { code: 'he', englishName: 'Hebrew', nativeName: 'עברית', region: 'Middle East', dir: 'rtl', voiceBcp47: 'he-IL', aliases: ['ivrit', 'عبری'] },
  { code: 'ku', englishName: 'Kurdish (Sorani)', nativeName: 'کوردی', region: 'Middle East', dir: 'rtl', voiceBcp47: 'ckb-IQ', aliases: ['kurdi', 'کوردی', 'کردی'] },
  { code: 'az', englishName: 'Azerbaijani', nativeName: 'Azərbaycan dili', region: 'Middle East', dir: 'ltr', voiceBcp47: 'az-AZ', aliases: ['azeri', 'آذری'] },
  { code: 'ps', englishName: 'Pashto', nativeName: 'پښتو', region: 'Middle East', dir: 'rtl', voiceBcp47: 'ps-AF', aliases: ['afghan', 'پشتو'] },
  { code: 'prs', englishName: 'Dari', nativeName: 'دری', region: 'Middle East', dir: 'rtl', voiceBcp47: 'fa-AF', aliases: ['دری', 'dari'] },
  { code: 'hy', englishName: 'Armenian', nativeName: 'Հայերեն', region: 'Middle East', dir: 'ltr', voiceBcp47: 'hy-AM', aliases: ['ارمنی'] },
  { code: 'ka', englishName: 'Georgian', nativeName: 'ქართული', region: 'Middle East', dir: 'ltr', voiceBcp47: 'ka-GE', aliases: ['گرجی'] },
  { code: 'ja', englishName: 'Japanese', nativeName: '日本語', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'ja-JP', aliases: ['nihongo', 'ژاپنی', 'にほんご'] },
  { code: 'ko', englishName: 'Korean', nativeName: '한국어', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'ko-KR', aliases: ['hangul', 'کره‌ای', 'korean'] },
  { code: 'zh', englishName: 'Chinese (Simplified)', nativeName: '简体中文', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'zh-CN', aliases: ['mandarin', 'چینی', 'zhongwen'] },
  { code: 'zh-TW', englishName: 'Chinese (Traditional)', nativeName: '繁體中文', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'zh-TW', aliases: ['taiwan', 'hong kong'] },
  { code: 'yue', englishName: 'Cantonese', nativeName: '廣東話', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'zh-HK', aliases: ['cantonese'] },
  { code: 'hi', englishName: 'Hindi', nativeName: 'हिन्दी', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'hi-IN', aliases: ['هندی', 'india'] },
  { code: 'ur', englishName: 'Urdu', nativeName: 'اردو', region: 'Asia-Pacific', dir: 'rtl', voiceBcp47: 'ur-PK', aliases: ['اردو', 'pakistan'] },
  { code: 'bn', englishName: 'Bengali', nativeName: 'বাংলা', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'bn-BD', aliases: ['bangla'] },
  { code: 'pa', englishName: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'pa-IN' },
  { code: 'ta', englishName: 'Tamil', nativeName: 'தமிழ்', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'ta-IN' },
  { code: 'te', englishName: 'Telugu', nativeName: 'తెలుగు', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'te-IN' },
  { code: 'mr', englishName: 'Marathi', nativeName: 'मराठी', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'mr-IN' },
  { code: 'gu', englishName: 'Gujarati', nativeName: 'ગુજરાતી', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'gu-IN' },
  { code: 'kn', englishName: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'kn-IN' },
  { code: 'ml', englishName: 'Malayalam', nativeName: 'മലയാളം', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'ml-IN' },
  { code: 'si', englishName: 'Sinhala', nativeName: 'සිංහල', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'si-LK' },
  { code: 'ne', englishName: 'Nepali', nativeName: 'नेपाली', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'ne-NP' },
  { code: 'th', englishName: 'Thai', nativeName: 'ไทย', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'th-TH', aliases: ['تایلندی'] },
  { code: 'vi', englishName: 'Vietnamese', nativeName: 'Tiếng Việt', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'vi-VN', aliases: ['ویتنامی'] },
  { code: 'id', englishName: 'Indonesian', nativeName: 'Bahasa Indonesia', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'id-ID', aliases: ['اندونزیایی'] },
  { code: 'ms', englishName: 'Malay', nativeName: 'Bahasa Melayu', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'ms-MY' },
  { code: 'tl', englishName: 'Filipino (Tagalog)', nativeName: 'Filipino', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'fil-PH', aliases: ['tagalog'] },
  { code: 'my', englishName: 'Burmese', nativeName: 'မြန်မာဘာသာ', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'my-MM' },
  { code: 'km', englishName: 'Khmer', nativeName: 'ភាសាខ្មែរ', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'km-KH' },
  { code: 'lo', englishName: 'Lao', nativeName: 'ລາວ', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'lo-LA' },
  { code: 'mn', englishName: 'Mongolian', nativeName: 'Монгол', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'mn-MN' },
  { code: 'kk', englishName: 'Kazakh', nativeName: 'Қазақша', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'kk-KZ' },
  { code: 'uz', englishName: 'Uzbek', nativeName: 'Oʻzbekcha', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'uz-UZ' },
  { code: 'tg', englishName: 'Tajik', nativeName: 'Тоҷикӣ', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'tg-TJ', aliases: ['تاجیکی'] },
  { code: 'ru', englishName: 'Russian', nativeName: 'Русский', region: 'Europe', dir: 'ltr', voiceBcp47: 'ru-RU', aliases: ['روسی'] },
  { code: 'uk', englishName: 'Ukrainian', nativeName: 'Українська', region: 'Europe', dir: 'ltr', voiceBcp47: 'uk-UA', aliases: ['اوکراینی'] },
  { code: 'pl', englishName: 'Polish', nativeName: 'Polski', region: 'Europe', dir: 'ltr', voiceBcp47: 'pl-PL', aliases: ['لهستانی'] },
  { code: 'nl', englishName: 'Dutch', nativeName: 'Nederlands', region: 'Europe', dir: 'ltr', voiceBcp47: 'nl-NL', aliases: ['هلندی'] },
  { code: 'sv', englishName: 'Swedish', nativeName: 'Svenska', region: 'Europe', dir: 'ltr', voiceBcp47: 'sv-SE', aliases: ['سوئدی'] },
  { code: 'no', englishName: 'Norwegian', nativeName: 'Norsk', region: 'Europe', dir: 'ltr', voiceBcp47: 'nb-NO' },
  { code: 'da', englishName: 'Danish', nativeName: 'Dansk', region: 'Europe', dir: 'ltr', voiceBcp47: 'da-DK' },
  { code: 'fi', englishName: 'Finnish', nativeName: 'Suomi', region: 'Europe', dir: 'ltr', voiceBcp47: 'fi-FI' },
  { code: 'is', englishName: 'Icelandic', nativeName: 'Íslenska', region: 'Europe', dir: 'ltr', voiceBcp47: 'is-IS' },
  { code: 'el', englishName: 'Greek', nativeName: 'Ελληνικά', region: 'Europe', dir: 'ltr', voiceBcp47: 'el-GR', aliases: ['یونانی'] },
  { code: 'cs', englishName: 'Czech', nativeName: 'Čeština', region: 'Europe', dir: 'ltr', voiceBcp47: 'cs-CZ' },
  { code: 'sk', englishName: 'Slovak', nativeName: 'Slovenčina', region: 'Europe', dir: 'ltr', voiceBcp47: 'sk-SK' },
  { code: 'hu', englishName: 'Hungarian', nativeName: 'Magyar', region: 'Europe', dir: 'ltr', voiceBcp47: 'hu-HU' },
  { code: 'ro', englishName: 'Romanian', nativeName: 'Română', region: 'Europe', dir: 'ltr', voiceBcp47: 'ro-RO' },
  { code: 'bg', englishName: 'Bulgarian', nativeName: 'Български', region: 'Europe', dir: 'ltr', voiceBcp47: 'bg-BG' },
  { code: 'sr', englishName: 'Serbian', nativeName: 'Српски', region: 'Europe', dir: 'ltr', voiceBcp47: 'sr-RS' },
  { code: 'hr', englishName: 'Croatian', nativeName: 'Hrvatski', region: 'Europe', dir: 'ltr', voiceBcp47: 'hr-HR' },
  { code: 'sl', englishName: 'Slovenian', nativeName: 'Slovenščina', region: 'Europe', dir: 'ltr', voiceBcp47: 'sl-SI' },
  { code: 'et', englishName: 'Estonian', nativeName: 'Eesti', region: 'Europe', dir: 'ltr', voiceBcp47: 'et-EE' },
  { code: 'lv', englishName: 'Latvian', nativeName: 'Latviešu', region: 'Europe', dir: 'ltr', voiceBcp47: 'lv-LV' },
  { code: 'lt', englishName: 'Lithuanian', nativeName: 'Lietuvių', region: 'Europe', dir: 'ltr', voiceBcp47: 'lt-LT' },
  { code: 'ga', englishName: 'Irish', nativeName: 'Gaeilge', region: 'Europe', dir: 'ltr', voiceBcp47: 'ga-IE' },
  { code: 'cy', englishName: 'Welsh', nativeName: 'Cymraeg', region: 'Europe', dir: 'ltr', voiceBcp47: 'cy-GB' },
  { code: 'ca', englishName: 'Catalan', nativeName: 'Català', region: 'Europe', dir: 'ltr', voiceBcp47: 'ca-ES' },
  { code: 'eu', englishName: 'Basque', nativeName: 'Euskara', region: 'Europe', dir: 'ltr', voiceBcp47: 'eu-ES' },
  { code: 'gl', englishName: 'Galician', nativeName: 'Galego', region: 'Europe', dir: 'ltr', voiceBcp47: 'gl-ES' },
  { code: 'sq', englishName: 'Albanian', nativeName: 'Shqip', region: 'Europe', dir: 'ltr', voiceBcp47: 'sq-AL' },
  { code: 'mk', englishName: 'Macedonian', nativeName: 'Македонски', region: 'Europe', dir: 'ltr', voiceBcp47: 'mk-MK' },
  { code: 'bs', englishName: 'Bosnian', nativeName: 'Bosanski', region: 'Europe', dir: 'ltr', voiceBcp47: 'bs-BA' },
  { code: 'be', englishName: 'Belarusian', nativeName: 'Беларуская', region: 'Europe', dir: 'ltr', voiceBcp47: 'be-BY' },
  { code: 'sw', englishName: 'Swahili', nativeName: 'Kiswahili', region: 'Africa', dir: 'ltr', voiceBcp47: 'sw-KE' },
  { code: 'am', englishName: 'Amharic', nativeName: 'አማርኛ', region: 'Africa', dir: 'ltr', voiceBcp47: 'am-ET' },
  { code: 'yo', englishName: 'Yoruba', nativeName: 'Yorùbá', region: 'Africa', dir: 'ltr', voiceBcp47: 'yo-NG' },
  { code: 'ha', englishName: 'Hausa', nativeName: 'Hausa', region: 'Africa', dir: 'ltr', voiceBcp47: 'ha-NG' },
  { code: 'zu', englishName: 'Zulu', nativeName: 'isiZulu', region: 'Africa', dir: 'ltr', voiceBcp47: 'zu-ZA' },
  { code: 'af', englishName: 'Afrikaans', nativeName: 'Afrikaans', region: 'Africa', dir: 'ltr', voiceBcp47: 'af-ZA' },
  { code: 'so', englishName: 'Somali', nativeName: 'Soomaali', region: 'Africa', dir: 'ltr', voiceBcp47: 'so-SO' },
  { code: 'mi', englishName: 'Māori', nativeName: 'Te Reo Māori', region: 'Asia-Pacific', dir: 'ltr', voiceBcp47: 'mi-NZ' },
  { code: 'qu', englishName: 'Quechua', nativeName: 'Runasimi', region: 'Americas', dir: 'ltr', voiceBcp47: 'qu-PE' },
  { code: 'ht', englishName: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen', region: 'Americas', dir: 'ltr', voiceBcp47: 'ht-HT' },
];

export function findWorldLanguage(code: string): WorldLanguageItem {
  return (
    WORLD_LANGUAGES.find((item) => item.code.toLowerCase() === code.toLowerCase()) ??
    WORLD_LANGUAGES.find((item) => item.code.split('-')[0].toLowerCase() === code.split('-')[0].toLowerCase()) ??
    WORLD_LANGUAGES[0]
  );
}

export function normalizeLanguageQuery(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/‌/g, ' ');
}

export function filterWorldLanguages(
  languages: WorldLanguageItem[],
  query: string,
  region: LanguageRegion = 'All'
): WorldLanguageItem[] {
  const q = normalizeLanguageQuery(query);
  return languages.filter((item) => {
    if (region !== 'All' && item.region !== region) return false;
    if (!q) return true;
    const haystack = normalizeLanguageQuery(
      [
        item.code,
        item.englishName,
        item.nativeName,
        item.region,
        ...(item.aliases ?? []),
      ].join(' ')
    );
    return haystack.includes(q);
  });
}

export interface UiCopy {
  hubGame: string;
  hubCinema: string;
  hubAudio: string;
  spatialId: string;
  tournament: string;
  socialClub: string;
  cinemaRooms5: string;
  audioRooms7: string;
  searchSkillsPlaceholder: string;
  searchCinemaPlaceholder: string;
  searchAudioPlaceholder: string;
  noSkillsFound: string;
  noItemsFound: string;
  showAllSkills: string;
  showAll: string;
  uploadGameScene: string;
  sendOrStreamLink: string;
  audioStudioEq: string;
  backToCinemaLobby: string;
  backToAudioLobby: string;
  back: string;
  quickMenuAria: string;
  earthButtonAria: string;
  activeLanguageLabel: string;
  searchWorldLanguagesPlaceholder: string;
  noLanguageMatched: string;
  resetLanguageSearch: string;
  languagesCountSuffix: string;
  regionLabels: Record<LanguageRegion, string>;
  // Menu headers
  ps5HeaderTitle: string;
  ps5HeaderSubtitle: string;
  ps5Ready: string;
  ps5Select: string;
  ps5FooterConfirm: string;
  ps5FooterClose: string;
  ps5FooterHint: string;
  ps5SoundOn: string;
  ps5SoundOff: string;
  spotifyHeaderTitle: string;
  spotifyActiveSpace: string;
  netflixHeaderTitle: string;
  netflixCurrentRoom: string;
  netflixEnterRun: string;
  netflixFooterClick: string;
  netflixFooterEsc: string;
  // Language modal headers per hub
  xboxBreadcrumb: string;
  xboxTitle: string;
  xboxSubtitle: string;
  xboxFooterSelect: string;
  xboxFooterBack: string;
  xboxFooterNav: string;
  visionTitle: string;
  visionSubtitle: string;
  appleMusicTitle: string;
  appleMusicSubtitle: string;
  // Left Menu (Map & Store across all platforms)
  leftMenuLabel: string;
  navMap: string;
  navStore: string;
  // Map Modal
  mapTitleGame: string;
  mapSubtitleGame: string;
  mapTitleCinema: string;
  mapSubtitleCinema: string;
  mapTitleAudio: string;
  mapSubtitleAudio: string;
  mapSearchPlaceholder: string;
  mapFilterAll: string;
  mapFilterUsers: string;
  mapFilterClubs: string;
  mapFilterStores: string;
  mapFilterDrops: string;
  mapRadiusAll: string;
  mapOpenStoreCta: string;
  mapPingCta: string;
  mapPingedDone: string;
  mapNoResults: string;
  mapYouAreHere: string;
  // Boot & section loading states
  bootStageFonts: string;
  bootStageCache: string;
  bootStageServer: string;
  bootStageReady: string;
  sectionWarming: string;
  // Store Modal
  storeTitleGame: string;
  storeSubtitleGame: string;
  storeTitleCinema: string;
  storeSubtitleCinema: string;
  storeTitleAudio: string;
  storeSubtitleAudio: string;
  storeSearchPlaceholder: string;
  storeCollectionsHeading: string;
  storeAllCollections: string;
  storeSourceAll: string;
  storeSourceOnline: string;
  storeSourceCommunity: string;
  storeSourceCollection: string;
  storeAddProductBtn: string;
  storeNoPhotoNote: string;
  storeSubmitProduct: string;
  storeCancel: string;
  storeAddToBag: string;
  storeBagTitle: string;
  storeCheckoutBtn: string;
  storeOrderConfirmed: string;
  storeNoProducts: string;
}

const EN_COPY: UiCopy = {
  hubGame: 'Game',
  hubCinema: 'Cinema & TV',
  hubAudio: 'Music & Audio',
  spatialId: 'Spatial ID',
  tournament: 'Tournament',
  socialClub: 'Social Club',
  cinemaRooms5: '5 Cinema Rooms',
  audioRooms7: '7 Audio Spaces',
  searchSkillsPlaceholder: 'Quick search skills, tactics or combos...',
  searchCinemaPlaceholder: 'Search movies, series or stream channels...',
  searchAudioPlaceholder: 'Search music, book chapters or BPM...',
  noSkillsFound: 'No skills matched your search.',
  noItemsFound: 'Nothing matched your search.',
  showAllSkills: 'Show All Skills',
  showAll: 'Show All',
  uploadGameScene: 'Upload Game Scene',
  sendOrStreamLink: 'Stream or Paste Video Link',
  audioStudioEq: 'Music Studio & Equalizer',
  backToCinemaLobby: 'Back to Cinema Lobby',
  backToAudioLobby: 'Back to Music Lobby',
  back: 'Back',
  quickMenuAria: 'Quick Menu',
  earthButtonAria: 'Global Language & Region Selector',
  activeLanguageLabel: 'Active Language',
  searchWorldLanguagesPlaceholder: 'Search 85+ world languages (English, فارسی, Español, 日本語...)',
  noLanguageMatched: 'No matching language found.',
  resetLanguageSearch: 'Show All Languages',
  languagesCountSuffix: 'world languages',
  regionLabels: {
    All: 'All World',
    Americas: 'Americas',
    Europe: 'Europe',
    'Middle East': 'Middle East',
    'Asia-Pacific': 'Asia-Pacific',
    Africa: 'Africa',
  },
  ps5HeaderTitle: 'Game Control Center',
  ps5HeaderSubtitle: 'DualSense tactile acoustic quick launcher',
  ps5Ready: 'Ready to launch',
  ps5Select: 'Select',
  ps5FooterConfirm: '× Confirm & Enter',
  ps5FooterClose: '○ or Esc to Close',
  ps5FooterHint: 'Arrow keys to navigate with tactile tick audio',
  ps5SoundOn: 'PS5 Sound',
  ps5SoundOff: 'Muted',
  spotifyHeaderTitle: 'Audio Library & Quick Controls',
  spotifyActiveSpace: 'Active space',
  netflixHeaderTitle: 'Cinema Showcase & Screening Rooms',
  netflixCurrentRoom: 'Current theater',
  netflixEnterRun: 'Enter & Launch',
  netflixFooterClick: 'Select any showcase card to launch',
  netflixFooterEsc: 'Esc · Return to Theater',
  xboxBreadcrumb: 'Profile & system › Settings › System › Language & location',
  xboxTitle: 'System Language & Region',
  xboxSubtitle: 'Xbox Guide · Instant cross-hub localization across all world languages',
  xboxFooterSelect: 'Ⓐ Select',
  xboxFooterBack: 'Ⓑ Back',
  xboxFooterNav: 'Ⓨ Search · D-Pad Navigate',
  visionTitle: 'System Language',
  visionSubtitle: 'visionOS Spatial Settings · Live Scene & Interface Localization',
  appleMusicTitle: 'Music & App Language',
  appleMusicSubtitle: 'Apple Music · Global Catalog & Lyrics Localization',
  leftMenuLabel: 'Platform Menu',
  navMap: 'Map',
  navStore: 'Store',
  mapTitleGame: 'Night City Cyber Grid Map',
  mapSubtitleGame: 'Nearby players, esports arenas, drops & cyberware shops around you',
  bootStageFonts: 'Preparing the spatial engine',
  bootStageCache: 'Caching worlds & assets',
  bootStageServer: 'Syncing with the server',
  bootStageReady: 'Everything is cached — launching',
  sectionWarming: 'Preparing this space',
  mapTitleCinema: 'Theatrical Treasure Map',
  mapSubtitleCinema: 'Secret screening clubs, cinephiles nearby & collector vaults',
  mapTitleAudio: 'Harmonic Stage & Vinyl Map',
  mapSubtitleAudio: 'Musicians, listening salons, studios & analog shops around you',
  mapSearchPlaceholder: 'Search users, clubs, shops, districts...',
  mapFilterAll: 'All Nearby',
  mapFilterUsers: 'People',
  mapFilterClubs: 'Clubs',
  mapFilterStores: 'Stores',
  mapFilterDrops: 'Drops',
  mapRadiusAll: 'All Area',
  mapOpenStoreCta: 'Browse Storefront',
  mapPingCta: 'Connect / Ping',
  mapPingedDone: 'Connected',
  mapNoResults: 'No nearby spots matched your search.',
  mapYouAreHere: 'YOU',
  storeTitleGame: 'Armory & In-Game Item Vault',
  storeSubtitleGame: 'Partner web stores, verified player gear & curated loadouts',
  storeTitleCinema: 'Criterion & Film Collector Store',
  storeSubtitleCinema: 'Curated film shops, 4K editions, cameras & community finds',
  storeTitleAudio: 'Vinyl Sanctuary & Studio Gear Shop',
  storeSubtitleAudio: 'Boutique music stores, analog synths, vinyls & user listings',
  storeSearchPlaceholder: 'Advanced search: products, collections, users or partner sites...',
  storeCollectionsHeading: 'Featured Collections & Partner Sites',
  storeAllCollections: 'All Collections',
  storeSourceAll: 'All Sources',
  storeSourceOnline: 'Online Stores',
  storeSourceCommunity: 'User Listings',
  storeSourceCollection: 'Collections',
  storeAddProductBtn: 'List Your Product',
  storeNoPhotoNote: 'User listings include title, price & full description (photo uploads disabled).',
  storeSubmitProduct: 'Publish Listing',
  storeCancel: 'Cancel',
  storeAddToBag: 'Add to Bag',
  storeBagTitle: 'Shopping Bag',
  storeCheckoutBtn: 'Confirm Order',
  storeOrderConfirmed: 'Order confirmed cleanly.',
  storeNoProducts: 'No products match these filters.',
};

const FA_COPY: UiCopy = {
  hubGame: 'گیم',
  hubCinema: 'سینما و تلویزیون',
  hubAudio: 'موزیک و پادکست',
  spatialId: 'Spatial ID',
  tournament: 'تورنمنت',
  socialClub: 'سوشال کلاب',
  cinemaRooms5: '۵ اتاق سینما',
  audioRooms7: '۷ فضای موزیک',
  searchSkillsPlaceholder: 'جستجوی سریع مهارت یا دکمه...',
  searchCinemaPlaceholder: 'جستجوی سریع فیلم، سریال یا کانال...',
  searchAudioPlaceholder: 'جستجوی سریع موزیک، فصل کتاب یا BPM...',
  noSkillsFound: 'مهارتی با این عبارت پیدا نشد.',
  noItemsFound: 'موردی با این عبارت پیدا نشد.',
  showAllSkills: 'نمایش همه مهارت‌ها',
  showAll: 'نمایش همه',
  uploadGameScene: 'ارسال صحنه بازی',
  sendOrStreamLink: 'ارسال یا پخش لینک استریم',
  audioStudioEq: 'استودیو موزیک و اکولایزر',
  backToCinemaLobby: 'بازگشت به لابی سینما',
  backToAudioLobby: 'بازگشت به لابی موزیک',
  back: 'بازگشت',
  quickMenuAria: 'منوی سریع',
  earthButtonAria: 'انتخاب زبان جهانی',
  activeLanguageLabel: 'زبان فعال',
  searchWorldLanguagesPlaceholder: 'جستجو بین تمام زبان‌های دنیا (فارسی، English, العربية...)',
  noLanguageMatched: 'زبانی با این نام پیدا نشد.',
  resetLanguageSearch: 'نمایش همه زبان‌ها',
  languagesCountSuffix: 'زبان جهانی',
  regionLabels: {
    All: 'همه مناطق',
    Americas: 'قاره آمریکا',
    Europe: 'اروپا',
    'Middle East': 'خاورمیانه',
    'Asia-Pacific': 'آسیا و اقیانوسیه',
    Africa: 'آفریقا',
  },
  ps5HeaderTitle: 'مرکز فرماندهی گیم',
  ps5HeaderSubtitle: 'انتخاب سریع با افکت صوتی DualSense',
  ps5Ready: 'آماده اجرا',
  ps5Select: 'انتخاب',
  ps5FooterConfirm: '× تأیید و ورود',
  ps5FooterClose: '○ یا Esc بستن منو',
  ps5FooterHint: 'کلیدهای جهت‌نما برای حرکت و صدای تیک',
  ps5SoundOn: 'صدای PS5',
  ps5SoundOff: 'صدا خاموش',
  spotifyHeaderTitle: 'کتابخانه و پخش سریع صدا',
  spotifyActiveSpace: 'فضای فعال',
  netflixHeaderTitle: 'تالار پخش و بخش‌های سینما',
  netflixCurrentRoom: 'سالن کنونی',
  netflixEnterRun: 'ورود و اجرا',
  netflixFooterClick: 'برای ورود روی هر بخش کلیک کنید',
  netflixFooterEsc: 'Esc · بازگشت به سالن',
  xboxBreadcrumb: 'پروفایل و سیستم › تنظیمات › سیستم › زبان و موقعیت',
  xboxTitle: 'زبان سیستم و منطقه',
  xboxSubtitle: 'داشبورد ایکس‌باکس · تغییر آنی زبان تمام بخش‌ها',
  xboxFooterSelect: 'Ⓐ انتخاب',
  xboxFooterBack: 'Ⓑ بازگشت',
  xboxFooterNav: 'Ⓨ جستجو · جهت‌نماها برای حرکت',
  visionTitle: 'زبان سیستم',
  visionSubtitle: 'تنظیمات فضایی visionOS · تغییر زنده زبان رابط و صحنه‌ها',
  appleMusicTitle: 'زبان موزیک و برنامه',
  appleMusicSubtitle: 'اپل موزیک · تنظیم جهانی زبان کاتالوگ و استودیو',
  leftMenuLabel: 'منوی پلتفرم',
  navMap: 'نقشه',
  navStore: 'فروشگاه',
  mapTitleGame: 'نقشه تاکتیکال سایبرپانک',
  mapSubtitleGame: 'کاربران، کلاب‌های گیمینگ، تورنمنت‌ها و فروشگاه‌های اطراف شما',
  bootStageFonts: 'آماده‌سازی موتور فضایی',
  bootStageCache: 'کش کردن دنیاها و فایل‌ها',
  bootStageServer: 'همگام‌سازی با سرور',
  bootStageReady: 'همه‌چیز کش شد — در حال اجرا',
  sectionWarming: 'در حال آماده‌سازی این فضا',
  mapTitleCinema: 'نقشه گنج سینمایی',
  mapSubtitleCinema: 'کلاب‌های مخفی اکران، سینمادوستان و گنجینه فروشگاه‌های فیلم اطراف',
  mapTitleAudio: 'نقشه موسیقی و سالن‌های صدا',
  mapSubtitleAudio: 'نوازندگان، کلاب‌های موسیقی، استودیوها و فروشگاه‌های وینیل اطراف شما',
  mapSearchPlaceholder: 'جستجوی کاربران، کلاب‌ها، فروشگاه‌ها یا محله...',
  mapFilterAll: 'همه اطراف',
  mapFilterUsers: 'کاربران',
  mapFilterClubs: 'کلاب‌ها',
  mapFilterStores: 'فروشگاه‌ها',
  mapFilterDrops: 'رویدادها',
  mapRadiusAll: 'کل محدوده',
  mapOpenStoreCta: 'ورود به فروشگاه',
  mapPingCta: 'ارسال پیام / اتصال',
  mapPingedDone: 'متصل شد',
  mapNoResults: 'موردی با این جستجو روی نقشه پیدا نشد.',
  mapYouAreHere: 'موقعیت شما',
  storeTitleGame: 'فروشگاه آیتم‌ها و تجهیزات گیمینگ',
  storeSubtitleGame: 'پیشنهاد فروشگاه‌های اینترنتی، کالکشن‌ها و آگهی گیمرها',
  storeTitleCinema: 'فروشگاه تخصصی سینما و فیلم',
  storeSubtitleCinema: 'نسخه‌های کلکسیونی، دوربین‌ها، کتاب‌ها و آگهی کاربران سینما',
  storeTitleAudio: 'فروشگاه موزیک، وینیل و تجهیزات استودیو',
  storeSubtitleAudio: 'کالکشن صفحات وینیل، سینتی‌سایزر، هدفون و آگهی موزیسین‌ها',
  storeSearchPlaceholder: 'جستجوی پیشرفته بین محصولات، سایت‌ها، کالکشن‌ها و کاربران...',
  storeCollectionsHeading: 'کالکشن‌های پیشنهادی و فروشگاه‌های همکار',
  storeAllCollections: 'همه کالکشن‌ها',
  storeSourceAll: 'همه منابع',
  storeSourceOnline: 'فروشگاه‌های اینترنتی',
  storeSourceCommunity: 'محصولات کاربران',
  storeSourceCollection: 'کالکشن‌ها',
  storeAddProductBtn: 'ثبت محصول من',
  storeNoPhotoNote: 'محصولات کاربران فقط با نام، قیمت و توضیحات کامل ثبت می‌شوند (آپلود عکس غیرفعال است).',
  storeSubmitProduct: 'انتشار محصول',
  storeCancel: 'انصراف',
  storeAddToBag: 'افزودن به سبد',
  storeBagTitle: 'سبد خرید',
  storeCheckoutBtn: 'تأیید نهایی سفارش',
  storeOrderConfirmed: 'سفارش شما با موفقیت ثبت شد.',
  storeNoProducts: 'محصولی با این فیلترها پیدا نشد.',
};

const EXTRA_UI_OVERRIDES: Record<string, Partial<UiCopy>> = {
  ar: {
    hubGame: 'الألعاب',
    hubCinema: 'السينما والتلفزيون',
    hubAudio: 'الموسيقى والبودكاست',
    tournament: 'البطولة',
    socialClub: 'النادي الاجتماعي',
    cinemaRooms5: '٥ قاعات سينما',
    audioRooms7: '٧ مساحات صوتية',
    uploadGameScene: 'إرسال لقطة اللعب',
    sendOrStreamLink: 'بث أو لصق رابط الفيديو',
    audioStudioEq: 'استوديو الموسيقى والمعادل',
    back: 'رجوع',
    visionTitle: 'لغة النظام',
    appleMusicTitle: 'لغة الموسيقى والتطبيق',
    xboxTitle: 'لغة النظام والمنطقة',
    activeLanguageLabel: 'اللغة النشطة',
    navMap: 'الخريطة',
    navStore: 'المتجر',
    leftMenuLabel: 'قائمة المنصة',
  },
  es: {
    hubGame: 'Juegos',
    hubCinema: 'Cine y TV',
    hubAudio: 'Música y Audio',
    tournament: 'Torneo',
    socialClub: 'Club Social',
    cinemaRooms5: '5 Salas de Cine',
    audioRooms7: '7 Espacios Sonoros',
    uploadGameScene: 'Subir Escena de Juego',
    sendOrStreamLink: 'Transmitir o Pegar Enlace',
    audioStudioEq: 'Estudio Musical y Ecualizador',
    back: 'Volver',
    visionTitle: 'Idioma del sistema',
    appleMusicTitle: 'Idioma de Música y App',
    xboxTitle: 'Idioma y región del sistema',
    activeLanguageLabel: 'Idioma activo',
    navMap: 'Mapa',
    navStore: 'Tienda',
    leftMenuLabel: 'Menú',
  },
  fr: {
    hubGame: 'Jeux',
    hubCinema: 'Cinéma & TV',
    hubAudio: 'Musique & Audio',
    tournament: 'Tournoi',
    socialClub: 'Club Social',
    cinemaRooms5: '5 Salles Cinéma',
    audioRooms7: '7 Espaces Audio',
    uploadGameScene: 'Envoyer Scène de Jeu',
    sendOrStreamLink: 'Diffuser ou Coller un Lien',
    audioStudioEq: 'Studio Musical & Égaliseur',
    back: 'Retour',
    visionTitle: 'Langue du système',
    appleMusicTitle: 'Langue de Musique & App',
    xboxTitle: 'Langue et région du système',
    activeLanguageLabel: 'Langue active',
    navMap: 'Carte',
    navStore: 'Boutique',
    leftMenuLabel: 'Menu',
  },
  de: {
    hubGame: 'Spiele',
    hubCinema: 'Kino & TV',
    hubAudio: 'Musik & Audio',
    tournament: 'Turnier',
    socialClub: 'Social Club',
    cinemaRooms5: '5 Kinosäle',
    audioRooms7: '7 Audioräume',
    uploadGameScene: 'Spielszene Hochladen',
    sendOrStreamLink: 'Streamen oder Link Einfügen',
    audioStudioEq: 'Musikstudio & Equalizer',
    back: 'Zurück',
    visionTitle: 'Systemsprache',
    appleMusicTitle: 'Musik- & App-Sprache',
    xboxTitle: 'Systemsprache & Region',
    activeLanguageLabel: 'Aktive Sprache',
    navMap: 'Karte',
    navStore: 'Shop',
    leftMenuLabel: 'Menü',
  },
  ja: {
    hubGame: 'ゲーム',
    hubCinema: 'シネマ＆TV',
    hubAudio: 'ミュージック＆音声',
    tournament: 'トーナメント',
    socialClub: 'ソーシャルクラブ',
    cinemaRooms5: '5つのシネマルーム',
    audioRooms7: '7つの音響空間',
    uploadGameScene: 'ゲームシーンを送信',
    sendOrStreamLink: '動画リンクを再生',
    audioStudioEq: '音楽スタジオ＆イコライザー',
    back: '戻る',
    visionTitle: 'システム言語',
    appleMusicTitle: 'ミュージック＆アプリ言語',
    xboxTitle: 'システム言語と地域',
    activeLanguageLabel: '選択中の言語',
    navMap: 'マップ',
    navStore: 'ストア',
    leftMenuLabel: 'メニュー',
  },
  ko: {
    hubGame: '게임',
    hubCinema: '시네마 & TV',
    hubAudio: '음악 & 오디오',
    tournament: '토너먼트',
    socialClub: '소셜 클럽',
    cinemaRooms5: '5개 시네마 룸',
    audioRooms7: '7개 오디오 공간',
    uploadGameScene: '게임 장면 업로드',
    sendOrStreamLink: '영상 링크 스트리밍',
    audioStudioEq: '뮤직 스튜디오 & 이퀄라이저',
    back: '뒤로',
    visionTitle: '시스템 언어',
    appleMusicTitle: '음악 및 앱 언어',
    xboxTitle: '시스템 언어 및 지역',
    activeLanguageLabel: '현재 언어',
    navMap: '지도',
    navStore: '스토어',
    leftMenuLabel: '메뉴',
  },
  zh: {
    hubGame: '游戏',
    hubCinema: '影视厅',
    hubAudio: '音乐与播客',
    tournament: '锦标赛',
    socialClub: '社交俱乐部',
    cinemaRooms5: '5 个影厅',
    audioRooms7: '7 个声场空间',
    uploadGameScene: '上传游戏画面',
    sendOrStreamLink: '播放或粘贴视频链接',
    audioStudioEq: '音乐工作室与均衡器',
    back: '返回',
    visionTitle: '系统语言',
    appleMusicTitle: '音乐与应用语言',
    xboxTitle: '系统语言与地区',
    activeLanguageLabel: '当前语言',
    navMap: '地图',
    navStore: '商店',
    leftMenuLabel: '菜单',
  },
  tr: {
    hubGame: 'Oyun',
    hubCinema: 'Sinema & TV',
    hubAudio: 'Müzik & Ses',
    tournament: 'Turnuva',
    socialClub: 'Sosyal Kulüp',
    cinemaRooms5: '5 Sinema Odası',
    audioRooms7: '7 Ses Alanı',
    uploadGameScene: 'Oyun Sahnesi Yükle',
    sendOrStreamLink: 'Video Akışı veya Bağlantı',
    audioStudioEq: 'Müzik Stüdyosu & Ekolayzer',
    back: 'Geri',
    visionTitle: 'Sistem Dili',
    appleMusicTitle: 'Müzik ve Uygulama Dili',
    xboxTitle: 'Sistem Dili ve Bölge',
    activeLanguageLabel: 'Etkin Dil',
    navMap: 'Harita',
    navStore: 'Mağaza',
    leftMenuLabel: 'Menü',
  },
  ru: {
    hubGame: 'Игры',
    hubCinema: 'Кино и ТВ',
    hubAudio: 'Музыка и аудио',
    tournament: 'Турнир',
    socialClub: 'Социальный клуб',
    cinemaRooms5: '5 кинозалов',
    audioRooms7: '7 аудиопространств',
    uploadGameScene: 'Загрузить сцену игры',
    sendOrStreamLink: 'Стрим или ссылка на видео',
    audioStudioEq: 'Студия и эквалайзер',
    back: 'Назад',
    visionTitle: 'Язык системы',
    appleMusicTitle: 'Язык музыки и приложения',
    xboxTitle: 'Язык и регион системы',
    activeLanguageLabel: 'Активный язык',
    navMap: 'Карта',
    navStore: 'Магазин',
    leftMenuLabel: 'Меню',
  },
};

export function getUiCopy(langCode: string): UiCopy {
  const base = langCode.toLowerCase();
  if (base === 'fa' || base === 'prs') return FA_COPY;
  const short = base.split('-')[0];
  const override = EXTRA_UI_OVERRIDES[base] ?? EXTRA_UI_OVERRIDES[short];
  if (!override) return EN_COPY;
  return {
    ...EN_COPY,
    ...override,
    regionLabels: {
      ...EN_COPY.regionLabels,
      ...(override.regionLabels ?? {}),
    },
  };
}

export function isRtlLanguage(langCode: string): boolean {
  return findWorldLanguage(langCode).dir === 'rtl';
}

const ROOM_TITLES_EN: Record<string, string> = {
  movie: 'Feature Film',
  series: 'Crime Series',
  anime: 'Tokyo Anime',
  documentary: 'Documentary',
  'tv-climax': 'TV & Climax',
  'westworld-cafe': 'Westworld Cafe',
  'mj-concert': 'MJ Stadium Concert',
  'berlin-rave': 'Berlin Industrial Rave',
  tomorrowland: 'Tomorrowland Festival',
  meditation: 'Meditation Space',
  'ac-library': 'Assassin Archive Library',
  'podcast-studio': 'Podcast Studio',
};

const CATEGORY_LABELS_EN: Record<string, string> = {
  all: 'All',
  shoot: 'Finishing',
  defense: 'Defense',
  attack: 'Attack',
  pass: 'Passing',
  aim: 'Aim',
  smoke: 'Smoke',
  peek: 'Peek',
  clutch: 'Clutch',
  heist: 'Heist',
  flank: 'Flank',
  cover: 'Cover',
  escape: 'Escape',
  utility: 'Utility',
  noir: 'Noir',
  stream: '4K Stream',
  analysis: 'Frame Analysis',
  telegram: 'Telegram',
  mystery: 'Mystery',
  theory: 'Theories',
  sakuga: 'Sakuga',
  cyberpunk: 'Cyberpunk',
  subsync: 'SubSync',
  nature: 'Nature',
  science: 'Space & Science',
  crime: 'True Crime',
  retro: '80s Retro',
  live: 'Live Feed',
  vhs: 'Cult VHS',
  p2p: 'P2P Mesh',
  jazz: 'Jazz & Piano',
  blues: 'Blues',
  country: 'Country',
  eq: 'Acoustic EQ',
  funk: 'Funk & Pop',
  arena: 'Arena Acoustics',
  techno: 'Techno',
  acid: 'Hard Rave',
  trance: 'Trance',
  edm: 'Mainstage EDM',
  festival: 'Festival',
  sleep: 'Deep Sleep',
  freq: '432Hz Solfeggio',
  ambient: 'Ambient',
  chapter: 'Chapters',
  lore: 'Historical Lore',
  bookmark: 'Bookmarks',
  tech: 'Tech & P2P',
};

const SKILL_EN: Record<string, { title: string; category: string }> = {
  'fc27-01': { title: 'Break Heavy 4-2-3-1 Press', category: 'Attack Tactics' },
  'fc27-02': { title: 'Precision Driven Through Ball (L1+R1+△)', category: 'Passing Tech' },
  'fc27-03': { title: 'Green-Timed Finesse Curler', category: 'Shooting Tech' },
  'fc27-04': { title: 'Defensive Setup & 71 Depth Line', category: 'Defense' },
  'cs2-01': { title: 'Counter-Strafe & Precision One-Tap (A/D)', category: 'Pro Aim' },
  'cs2-02': { title: 'Mirage Window Smoke & A Site Execute', category: 'Smoke Lineups' },
  'cs2-03': { title: 'Jiggle Peek & Mid Anti-AWP Duel', category: 'Peeking Tech' },
  'cs2-04': { title: '1v2 Clutch & Post-Plant Isolation', category: 'Clutch Tactics' },
  'gta-01': { title: 'Rapid Penthouse Flank Roll (L2+R2+◯)', category: 'Flank Maneuver' },
  'gta-02': { title: 'Tactical Hard Cover & Snap Peek (R1)', category: 'Cover & Peek' },
  'gta-03': { title: 'Silent Casino Heist Vault Route', category: 'Heist Strategy' },
  'gta-04': { title: '5-Star Tunnel Escape & Pursuit Lose', category: 'Escape Route' },
  'val-01': { title: 'Deadzone Movement & 2-Bullet Vandal Burst (A-D)', category: 'Vandal Aim' },
  'val-02': { title: 'Pop-Flash & Duelist Site Entry Dash', category: 'Team Utility' },
  'val-03': { title: 'Slicing the Pie & Anti-Operator Long Peek', category: 'Angle Clearing' },
  'val-04': { title: 'Coordinated Site Retake & Crossfire Hold', category: 'Site Defense' },
  'fc27-05': { title: 'Best Formation & Squad Build', category: 'Formation' },
  'fc27-06': { title: 'SBC Guide & Squad Building', category: 'SBC' },
};

const HUB_CARD_EN: Record<string, { title: string; category: string }> = {
  'cin-mov-01': { title: "Director's Cut: Blade Runner 2049 (4K HDR)", category: 'Noir Theater' },
  'cin-mov-02': { title: 'Anatomy of Chiaroscuro Shadow Lighting', category: 'Frame Analysis' },
  'cin-mov-03': { title: 'Noir Vault Curated Feed (Telegram Node)', category: 'Telegram Node' },
  'cin-mov-04': { title: 'European Arthouse Cinema Direct (P2P)', category: '4K Stream' },
  'cin-ser-01': { title: 'Mr. Robot Finale Breakdown (Control Room)', category: 'Theory Hunter' },
  'cin-ser-02': { title: 'Decoding Clues in True Detective Season 1', category: 'Crime Mystery' },
  'cin-ser-03': { title: 'Sci-Fi Series Live Marathon Broadcast', category: 'Direct Stream' },
  'cin-ser-04': { title: 'Underground Episode Spoilers & Theory Channel', category: 'Telegram Node' },
  'cin-ani-01': { title: 'Cyberpunk Sakuga Keyframes (Tokyo Rain)', category: '60fps Sakuga' },
  'cin-ani-02': { title: 'Ghost in the Shell — Rain Remaster Edition', category: 'Cyberpunk' },
  'cin-ani-03': { title: 'Auto-Synced Multi-Language Seasonal Subtitles', category: 'Subtitle Sync' },
  'cin-ani-04': { title: 'Studio MAPPA Midnight Watch Party (P2P)', category: 'Telegram Node' },
  'cin-doc-01': { title: 'Alpine Summit in Shifting Mist (4K Raw)', category: 'Nature Docu' },
  'cin-doc-02': { title: 'James Webb Deep-Space Infrared Voyage', category: 'Space & Science' },
  'cin-doc-03': { title: '90s Cybercrime Declassified Case Files', category: 'True Crime' },
  'cin-doc-04': { title: 'Independent Documentary Collective Live Feed', category: '4K Stream' },
  'cin-tv-01': { title: '80s Retro Studio Late Night Tape (VHS)', category: '80s Retro' },
  'cin-tv-02': { title: 'Analog Live: Greatest Television Climaxes', category: 'Live Broadcast' },
  'cin-tv-03': { title: 'Cult Cinema Magnetic Tape Filter Archive', category: 'Cult VHS' },
  'cin-tv-04': { title: 'Climax Community Decentralized Mesh Stream', category: 'P2P Stream' },
  'aud-ww-01': { title: 'Dusty Saloon Ragtime Piano (84 BPM)', category: 'Lounge Jazz' },
  'aud-ww-02': { title: 'Red Canyon Slide Guitar (92 BPM)', category: 'Country & Blues' },
  'aud-ww-03': { title: 'Late-Night Cafe Jazz Telegram Playlist', category: 'Telegram Stream' },
  'aud-ww-04': { title: 'Engage Vintage Wood Tube EQ (Warm Mid)', category: 'Cafe Acoustics' },
  'aud-mj-01': { title: 'Bucharest Stadium Energy (Live Encore)', category: 'Arena Pop' },
  'aud-mj-02': { title: 'Midnight Funk Bassline Groove (122 BPM)', category: 'Funk & Rhythm' },
  'aud-mj-03': { title: 'Open-Air Stadium Spatial Calibration (Wide Hall)', category: 'Arena Acoustics' },
  'aud-mj-04': { title: 'Classic Arena Pop Concerts Feed (Telegram)', category: 'Telegram Channel' },
  'aud-br-01': { title: 'Kraftwerk Cold Concrete — Warehouse Set (142 BPM)', category: 'Industrial Techno' },
  'aud-br-02': { title: '4 AM Acid Pulse Generator (148 BPM)', category: 'Hard Rave' },
  'aud-br-03': { title: 'Berlin Underground Bunker Set (Telegram Stream)', category: 'Direct Mixer' },
  'aud-br-04': { title: 'Concrete Room Sub-Bass Boost (+8dB Low Punch)', category: 'Club Acoustics' },
  'aud-tl-01': { title: 'Mainstage Sunrise — Trance Anthem 2026 (134 BPM)', category: 'Festival Trance' },
  'aud-tl-02': { title: 'Mainstage EDM Grand Opening Drop', category: 'Live EDM' },
  'aud-tl-03': { title: 'Outdoor Stereo Stage Sync (Wide Trance)', category: 'Stage Acoustics' },
  'aud-tl-04': { title: 'Boom Belgium Night Horizon Live Archive', category: 'Telegram Stream' },
  'aud-md-01': { title: 'Night Rain + 432Hz Deep Sleep Resonance', category: 'Deep Sleep' },
  'aud-md-02': { title: 'Theta Wave Focus Session (56 BPM)', category: 'Theta Frequency' },
  'aud-md-03': { title: 'Spatial Ambient 65% Silky Cathedral Reverb', category: 'Pure Ambient' },
  'aud-md-04': { title: 'Pre-Sleep Guided Breath & Calm Timer', category: 'Calm Session' },
  'aud-ac-01': { title: 'Chapter 1: Gate of the Secret Archive (00:00)', category: 'Chapter 1' },
  'aud-ac-02': { title: 'Chapter 2: Hidden Da Vinci Cipher (06:50)', category: 'Lore & Mystery' },
  'aud-ac-03': { title: 'Chapter 3: Duel Under Candlelight (14:50)', category: 'Chapter 3' },
  'aud-ac-04': { title: 'Bookmarks & Resume from Last Saved Timecode', category: 'Smart Bookmark' },
  'aud-pod-01': { title: 'Ep. 42: P2P Mesh & Telegram Edge Architecture', category: 'Tech Podcast' },
  'aud-pod-02': { title: 'Why Decentralized Streaming Matters (04:12)', category: 'Chapter 2 Talk' },
  'aud-pod-03': { title: 'Roundtable with Next-Gen Game Audio Designers (11:30)', category: 'Live Studio' },
  'aud-pod-04': { title: 'Near-Field Condenser Mic Profile (Vocal Clarity)', category: 'Studio Acoustics' },
};

const MENU_EN: Record<string, { title: string; subtitle: string; badge?: string }> = {
  demo: {
    title: 'Quick Launch AI Coach',
    subtitle: 'Jump straight into 3D tactical telestrator & voice coaching',
    badge: 'Live Game',
  },
  tournament: {
    title: '3D Tournament Hub',
    subtitle: 'Brackets, live prediction arenas & prize leagues',
    badge: 'Tournament',
  },
  social: {
    title: 'Enter Social Club',
    subtitle: 'Squad chats, underground clubs & direct clip sharing',
    badge: 'Clubs & Chat',
  },
  identity: {
    title: 'Spatial ID Profile',
    subtitle: '3D gamer card & custom procedural character identity',
    badge: '3D Identity',
  },
  backdrop: {
    title: 'Toggle Stage Backdrop',
    subtitle: 'Switch between real-time UE 5.8 scene & looping stadium video',
    badge: 'Display Mode',
  },
  'audio-rooms-hub': {
    title: '7 Spatial Music Environments',
    subtitle: 'Westworld Cafe, MJ Arena, Berlin Rave, Library & Meditation',
    badge: '7 Sound Rooms',
  },
  'audio-player': {
    title: 'Studio Player + EQ + Bookmarks',
    subtitle: 'Live acoustic synth, book chapters & timestamped notes',
    badge: 'Player & EQ',
  },
  'audio-identity': {
    title: '3D Music Profile (Ages 8–99)',
    subtitle: 'Craft your musical persona across 7 acoustic realms',
    badge: 'Persona',
  },
  'audio-social': {
    title: 'Poetic Codex · Bookish Social Club',
    subtitle: 'Manuscript poetry, philosophy salons & audio letters',
    badge: 'Literary Salon',
  },
  'cinema-rooms-hub': {
    title: '5 Spatial Cinema Rooms',
    subtitle: 'Noir, Crime Series, Tokyo Anime, Alps Docu & 80s Retro',
    badge: '5 Theaters',
  },
  'cinema-player': {
    title: 'Stream Player & Link Verifier',
    subtitle: 'Direct HLS/P2P screening with stream integrity scanner',
    badge: 'Zero Buffer',
  },
  'cinema-identity': {
    title: '3D Cinema Profile (Ages 8–99)',
    subtitle: 'Build your film & TV persona with iconic silhouettes',
    badge: 'ID Card',
  },
  'cinema-social': {
    title: 'CINE-OS · Secure Social Terminal',
    subtitle: 'Encrypted agent chats, watch rooms & direct stream links',
    badge: 'Secure Mesh',
  },
  map: {
    title: '3D Neighborhood Map',
    subtitle: 'Live GTA radar with your real GPS location',
    badge: 'Map',
  },
  store: {
    title: 'AIGAMERIA Store',
    subtitle: 'Gear, collections & gaming goods',
    badge: 'Store',
  },
  'audio-map': {
    title: '3D Neighborhood Map',
    subtitle: 'Live GTA radar with your real GPS location',
    badge: 'Map',
  },
  'audio-store': {
    title: 'AIGAMERIA Store',
    subtitle: 'Gear, collections & gaming goods',
    badge: 'Store',
  },
  'cinema-map': {
    title: '3D Neighborhood Map',
    subtitle: 'Live GTA radar with your real GPS location',
    badge: 'Map',
  },
  'cinema-store': {
    title: 'AIGAMERIA Store',
    subtitle: 'Gear, collections & gaming goods',
    badge: 'Store',
  },
  dim: {
    title: 'Toggle Theater Lighting',
    subtitle: 'Dim peripheral lighting for pure cinema screen focus',
    badge: 'Theater Mode',
  },
};

export function getRoomTitle(roomId: string, fallbackFa: string, langCode: string): string {
  if (langCode.toLowerCase() === 'fa' || langCode.toLowerCase() === 'prs') return fallbackFa;
  return ROOM_TITLES_EN[roomId] ?? fallbackFa;
}

export function getCategoryLabel(categoryId: string, fallbackFa: string, langCode: string): string {
  if (langCode.toLowerCase() === 'fa' || langCode.toLowerCase() === 'prs') return fallbackFa;
  return CATEGORY_LABELS_EN[categoryId] ?? fallbackFa;
}

export function getSkillTitle(skillId: string, fallbackFa: string, langCode: string): string {
  if (langCode.toLowerCase() === 'fa' || langCode.toLowerCase() === 'prs') return fallbackFa;
  return SKILL_EN[skillId]?.title ?? fallbackFa;
}

export function getSkillCategoryLabel(skillId: string, fallbackFa: string, langCode: string): string {
  if (langCode.toLowerCase() === 'fa' || langCode.toLowerCase() === 'prs') return fallbackFa;
  return SKILL_EN[skillId]?.category ?? fallbackFa;
}

export function getCardTitle(cardId: string, fallbackFa: string, langCode: string): string {
  if (langCode.toLowerCase() === 'fa' || langCode.toLowerCase() === 'prs') return fallbackFa;
  return HUB_CARD_EN[cardId]?.title ?? fallbackFa;
}

export function getCardCategoryLabel(cardId: string, fallbackFa: string, langCode: string): string {
  if (langCode.toLowerCase() === 'fa' || langCode.toLowerCase() === 'prs') return fallbackFa;
  return HUB_CARD_EN[cardId]?.category ?? fallbackFa;
}

export function getMenuDescriptor(
  hub: MasterHubId,
  id: string,
  fallbackTitle: string,
  fallbackSub: string,
  fallbackBadge: string | undefined,
  langCode: string
): { title: string; subtitle: string; badge?: string } {
  if (langCode.toLowerCase() === 'fa' || langCode.toLowerCase() === 'prs') {
    return { title: fallbackTitle, subtitle: fallbackSub, badge: fallbackBadge };
  }
  const key = hub === 'game' ? id : `${hub}-${id}`;
  const entry = MENU_EN[key] ?? MENU_EN[id];
  if (!entry) return { title: fallbackTitle, subtitle: fallbackSub, badge: fallbackBadge };
  return { title: entry.title, subtitle: entry.subtitle, badge: entry.badge ?? fallbackBadge };
}
