import {
  authenticateStreamLink,
  scanSpoilerContent,
  type CinemaRoomId,
  type UndergroundStreamPost,
} from './cinemaAgents.ts';

export type FbiSocialTabId = 'feed' | 'chat' | 'friends' | 'clubs';
export type FbiClearanceLevel = 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'TOP SECRET';

export interface FbiComment {
  id: string;
  authorHandle: string;
  authorTag: string;
  avatarUrl: string;
  text: string;
  timestamp: string;
  likesCount: number;
  likedByMe: boolean;
}

export interface FbiCinemaPost {
  id: string;
  caseCode: string;
  clearanceLevel: FbiClearanceLevel;
  authorHandle: string;
  authorDisplayNameFa: string;
  authorBadgeId: string;
  authorTag: string;
  avatarUrl: string;
  roomId: CinemaRoomId;
  divisionFa: string;
  filmTitleTag: string;
  captionFa: string;
  mediaUrl: string;
  videoPreviewUrl?: string;
  streamUrl?: string;
  streamFormat?: string;
  telegramChannel?: string;
  clubId?: string;
  hasSpoiler: boolean;
  timestamp: string;
  likesCount: number;
  dislikesCount: number;
  userReaction: 'like' | 'dislike' | null;
  sharesCount: number;
  sharedByMe: boolean;
  bookmarkedByMe: boolean;
  comments: FbiComment[];
}

export interface FbiCinemaAgent {
  id: string;
  handle: string;
  displayNameFa: string;
  badgeNumber: string;
  divisionFa: string;
  clearanceLabel: string;
  locationFa: string;
  specialtyFa: string;
  favoriteFilmFa: string;
  onlineStatus: 'ACTIVE' | 'BRIEFING' | 'FIELD';
  avatarUrl: string;
  isFriend: boolean;
  repScore: number;
  accuracyPct: number;
  casesSolvedCount: number;
  clanTag: string;
  bioFa: string;
  mainGenres: string[];
}

export interface FbiChatAttachment {
  kind: 'film_stream' | 'video_file' | 'photo_file' | 'dossier_ref';
  titleFa: string;
  url: string;
  streamUrl?: string;
  roomId?: CinemaRoomId;
  format?: string;
  caseCode?: string;
}

export interface FbiSecureMessage {
  id: string;
  channelId: string; // 'bureau-global' | `club-${clubId}` | `dm-${agentId}`
  senderHandle: string;
  senderBadgeId: string;
  senderTag: string;
  text: string;
  timestamp: string;
  isSelf: boolean;
  isConfidential?: boolean;
  attachment?: FbiChatAttachment;
}

export interface FbiClubDispatch {
  id: string;
  authorHandle: string;
  authorBadgeId: string;
  text: string;
  timestamp: string;
  filmTitleFa?: string;
  streamUrl?: string;
  streamFormat?: string;
  roomId?: CinemaRoomId;
}

export interface FbiDivisionClub {
  id: string;
  name: string;
  codeName: string;
  tag: string;
  divisionFa: string;
  mottoFa: string;
  focusLabel: string;
  clearanceRequired: string;
  bannerUrl: string;
  directorHandle: string;
  membersCount: number;
  isJoined: boolean;
  dispatches: FbiClubDispatch[];
}

export interface CinemaFbiSocialState {
  activeTab: FbiSocialTabId;
  userHandle: string;
  userDisplayNameFa: string;
  userBadgeId: string;
  userCrewTag: string;
  userClearanceLevel: string;
  userRep: number;
  posts: FbiCinemaPost[];
  agents: FbiCinemaAgent[];
  messages: FbiSecureMessage[];
  clubs: FbiDivisionClub[];
}

export const FBI_EVIDENCE_PRESETS = [
  {
    id: 'fbi-ev-command',
    label: 'اتاق کنترل CINE-OS',
    url: '/src/assets/images/fbi_command_backdrop_1795259261383.jpg',
  },
  {
    id: 'fbi-ev-desk',
    label: 'میز تدوین و نگاتیو ۳۵ میلی‌متری',
    url: '/src/assets/images/fbi_noir_evidence_1795259259091.jpg',
  },
  {
    id: 'fbi-ev-tokyo',
    label: 'خیابان بارانی توکیو',
    url: '/src/assets/images/fbi_tokyo_surveillance_1795259259795.jpg',
  },
  {
    id: 'fbi-ev-noir',
    label: 'سالن نمایش کلاسیک',
    url: '/src/assets/images/room_cinema_noir_hall_1795254621048.jpg',
  },
];

export function buildInitialCinemaFbiState(): CinemaFbiSocialState {
  return {
    activeTab: 'feed',
    userHandle: 'kian_noir',
    userDisplayNameFa: 'کیانوش راد',
    userBadgeId: 'NODE-084',
    userCrewTag: 'NOIR',
    userClearanceLevel: 'کاربر ویژه سینما',
    userRep: 12480,
    posts: [
      {
        id: 'fbi-post-1',
        caseCode: 'STREAM-4091',
        clearanceLevel: 'TOP SECRET',
        authorHandle: 'deckard_noir',
        authorDisplayNameFa: 'ریک دکارد',
        authorBadgeId: 'ID-2049',
        authorTag: 'NOIR',
        avatarUrl: '/src/assets/images/holo_max_noir_1795172673547.jpg',
        roomId: 'movie',
        divisionFa: 'کلاب فیلم‌های نوآر و ۴K',
        filmTitleTag: 'Blade Runner 2049 · 4K HDR Cut',
        captionFa:
          'نسخه ۴K بلید رانر ۲۰۴۹ با نورپردازی اصلی و لینک پخش مستقیم آماده شد؛ روی دکمه پخش بزنید تا تو سالن ببینیم. هشدار اسپویل: در سکانس برف پایانی مشخص می‌شود خاطره‌ی کاشته‌شده متعلق به دختر دکارد بوده است.',
        mediaUrl: '/src/assets/images/fbi_noir_evidence_1795259259091.jpg',
        streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        streamFormat: 'HLS',
        telegramChannel: 't.me/cineos_noir_4k',
        clubId: 'fbi-club-bau',
        hasSpoiler: true,
        timestamp: '۱۲ دقیقه پیش',
        likesCount: 318,
        dislikesCount: 4,
        userReaction: null,
        sharesCount: 47,
        sharedByMe: false,
        bookmarkedByMe: true,
        comments: [
          {
            id: 'fcm-1',
            authorHandle: 'clarice_cine',
            authorTag: 'CINE',
            avatarUrl: '/src/assets/images/holo_female_commander_1795172646701.jpg',
            text: 'کیفیت رنگ‌ها تو سکانس آزمایشگاه فوق‌العاده تمیزه، بدون ذره‌ای افت فریم پخش شد.',
            timestamp: '۰۲:۱۸',
            likesCount: 24,
            likedByMe: false,
          },
        ],
      },
      {
        id: 'fbi-post-2',
        caseCode: 'STREAM-8812',
        clearanceLevel: 'CONFIDENTIAL',
        authorHandle: 'motoko_anime',
        authorDisplayNameFa: 'موتوکو کوساناگی',
        authorBadgeId: 'ID-0901',
        authorTag: 'ANIME',
        avatarUrl: '/src/assets/images/holo_female_cyber_1795172673060.jpg',
        roomId: 'anime',
        divisionFa: 'کلاب انیمه و سایبرپانک',
        filmTitleTag: 'Ghost in the Shell · 60fps Remaster',
        captionFa:
          'لینک مستقیم نسخه ۶۰ فریم ریمسترشده از سکانس بارانی توکیو رو آپلود کردم. هم داخل شبکه پخش میشه هم از کانال تلگرام می‌تونید مستقیم بازش کنید.',
        mediaUrl: '/src/assets/images/fbi_tokyo_surveillance_1795259259795.jpg',
        streamUrl: 'https://t.me/tokyo_cyber_cinema/402',
        streamFormat: 'TELEGRAM',
        telegramChannel: 't.me/tokyo_cyber_cinema',
        clubId: 'fbi-club-cyb',
        hasSpoiler: false,
        timestamp: '۴۱ دقیقه پیش',
        likesCount: 264,
        dislikesCount: 2,
        userReaction: null,
        sharesCount: 33,
        sharedByMe: false,
        bookmarkedByMe: false,
        comments: [
          {
            id: 'fcm-2',
            authorHandle: 'elliot_series',
            authorTag: 'SERIES',
            avatarUrl: '/src/assets/images/holo_male_prime_1795172645988.jpg',
            text: 'الان با لینک مستقیم بازش کردم، خیلی سریع و بدون بافر لود شد.',
            timestamp: '۰۱:۵۲',
            likesCount: 15,
            likedByMe: false,
          },
        ],
      },
      {
        id: 'fbi-post-3',
        caseCode: 'STREAM-5104',
        clearanceLevel: 'UNCLASSIFIED',
        authorHandle: 'elliot_series',
        authorDisplayNameFa: 'الیوت آندرسون',
        authorBadgeId: 'ID-4409',
        authorTag: 'SERIES',
        avatarUrl: '/src/assets/images/holo_male_prime_1795172645988.jpg',
        roomId: 'series',
        divisionFa: 'کلاب سریال‌های معمایی',
        filmTitleTag: 'Mr. Robot & Mindhunter · P2P Stream',
        captionFa:
          'امشب ساعت ۲۳ واچ‌پارتی گروهی اپیزود آخر سریال‌های دیوید فینچر رو داریم؛ لینک استریم مستقیم همینه که زیر پست گذاشتم، هر کی میاد تو چت کلاب اعلام کنه.',
        mediaUrl: '/src/assets/images/fbi_command_backdrop_1795259261383.jpg',
        streamUrl: 'webrtc://peer-bau.aipetros.local/series-mindhunter',
        streamFormat: 'P2P_WEBRTC',
        telegramChannel: 't.me/cineos_series_club',
        clubId: 'fbi-club-sig',
        hasSpoiler: false,
        timestamp: '۱ ساعت پیش',
        likesCount: 211,
        dislikesCount: 6,
        userReaction: null,
        sharesCount: 29,
        sharedByMe: false,
        bookmarkedByMe: false,
        comments: [],
      },
    ],
    agents: [
      {
        id: 'ag-1',
        handle: 'deckard_noir',
        displayNameFa: 'ریک دکارد',
        badgeNumber: 'ID-2049',
        divisionFa: 'کلاب سینمای نوآر و ۴K',
        clearanceLabel: 'آنلاین',
        locationFa: 'سالن فیلم کلاسیک و نوآر',
        specialtyFa: 'معرفی و اشتراک نسخه‌های کارگردان ۴K و فیلم‌های معمایی و علمی‌تخیلی',
        favoriteFilmFa: 'Blade Runner 2049 / Se7en',
        onlineStatus: 'ACTIVE',
        avatarUrl: '/src/assets/images/holo_max_noir_1795172673547.jpg',
        isFriend: true,
        repScore: 14820,
        accuracyPct: 98,
        casesSolvedCount: 412,
        clanTag: 'NOIR',
        bioFa: 'علاقه‌مند به سینمای نوآر و علمی‌تخیلی؛ همیشه لینک‌های ۴K بدون افت کیفیت رو پیدا می‌کنه.',
        mainGenres: ['نوآر کلاسیک', 'علمی‌تخیلی', 'تریلر جنایی'],
      },
      {
        id: 'ag-2',
        handle: 'clarice_cine',
        displayNameFa: 'کلاریس استارلینگ',
        badgeNumber: 'ID-1991',
        divisionFa: 'کلاب جنایی و مستند',
        clearanceLabel: 'آنلاین',
        locationFa: 'سالن مستند و تریلر',
        specialtyFa: 'تحلیل فیلم‌های جنایی، مستندهای واقعی و پیشنهاد تدوین‌های کمیاب',
        favoriteFilmFa: 'The Silence of the Lambs / Zodiac',
        onlineStatus: 'ACTIVE',
        avatarUrl: '/src/assets/images/holo_female_commander_1795172646701.jpg',
        isFriend: true,
        repScore: 13950,
        accuracyPct: 97,
        casesSolvedCount: 389,
        clanTag: 'CINE',
        bioFa: 'عاشق تریلرهای روان‌شناختی و مستند؛ آرشیو کامل فیلم‌های فستیوالی رو داره.',
        mainGenres: ['مستند جنایی', 'روان‌شناختی', 'درام دادگاهی'],
      },
      {
        id: 'ag-3',
        handle: 'motoko_anime',
        displayNameFa: 'موتوکو کوساناگی',
        badgeNumber: 'ID-0901',
        divisionFa: 'کلاب انیمه و سایبرپانک',
        clearanceLabel: 'در حال تماشا',
        locationFa: 'سالن انیمه توکیو',
        specialtyFa: 'انیمه‌های ۶۰ فریم، سایبرپانک و اشتراک لینک‌های مستقیم تلگرام و P2P',
        favoriteFilmFa: 'Ghost in the Shell / Akira',
        onlineStatus: 'FIELD',
        avatarUrl: '/src/assets/images/holo_female_cyber_1795172673060.jpg',
        isFriend: false,
        repScore: 12190,
        accuracyPct: 95,
        casesSolvedCount: 325,
        clanTag: 'ANIME',
        bioFa: 'خوره‌ی انیمه و انیمیشن ژاپنی؛ بهترین سکانس‌های اکشن و سایبرپانک رو به اشتراک می‌ذاره.',
        mainGenres: ['انیمه سایبرپانک', 'اکشن ۶۰fps', 'استودیو جیبلی'],
      },
      {
        id: 'ag-4',
        handle: 'elliot_series',
        displayNameFa: 'الیوت آندرسون',
        badgeNumber: 'ID-4409',
        divisionFa: 'کلاب سریال و تکنولوژی',
        clearanceLabel: 'آنلاین',
        locationFa: 'سالن سریال‌های معمایی',
        specialtyFa: 'تست لینک‌های HLS و WebRTC، کشف نکات مخفی سریال‌ها و واچ‌پارتی گروهی',
        favoriteFilmFa: 'Mr. Robot / Mindhunter',
        onlineStatus: 'BRIEFING',
        avatarUrl: '/src/assets/images/holo_male_prime_1795172645988.jpg',
        isFriend: false,
        repScore: 11460,
        accuracyPct: 96,
        casesSolvedCount: 298,
        clanTag: 'SERIES',
        bioFa: 'متخصص شبکه و استریم؛ لینک‌های سریع P2P و تئوری‌های سریال‌های معمایی رو میذاره.',
        mainGenres: ['سریال معمایی', 'سایبری', 'تئوری سینمایی'],
      },
      {
        id: 'ag-5',
        handle: 'gordon_classic',
        displayNameFa: 'جیمز گوردون',
        badgeNumber: 'ID-0012',
        divisionFa: 'کلاب آثار کلاسیک',
        clearanceLabel: 'آنلاین',
        locationFa: 'سالن کلاسیک و رترو',
        specialtyFa: 'برگزاری شب‌های فیلم کلاسیک دهه ۷۰ تا ۹۰ و پخش هم‌زمان بدون اسپویل',
        favoriteFilmFa: 'The Godfather / Heat (1995)',
        onlineStatus: 'ACTIVE',
        avatarUrl: '/src/assets/images/holo_male_elder_1795172645312.jpg',
        isFriend: true,
        repScore: 15600,
        accuracyPct: 99,
        casesSolvedCount: 510,
        clanTag: 'NOIR',
        bioFa: 'میزبان واچ‌پارتی‌های شبانه آثار ماندگار تاریخ سینما با قوانین ضد اسپویل.',
        mainGenres: ['کلاسیک هالیوود', 'جنایی دهه ۹۰', 'وسترن'],
      },
    ],
    messages: [
      {
        id: 'fmsg-1',
        channelId: 'bureau-global',
        senderHandle: 'deckard_noir',
        senderBadgeId: 'ID-2049',
        senderTag: 'NOIR',
        text: 'سلام بچه‌ها! لینک مستقیم ۴K بلید رانر ۲۰۴۹ رو چک کردم، خیلی سریع و بدون لگ باز میشه. پایین براتون گذاشتم.',
        timestamp: '۰۲:۱۰',
        isSelf: false,
        attachment: {
          kind: 'film_stream',
          titleFa: 'Blade Runner 2049 · 4K HDR Cut',
          url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          format: 'HLS',
          roomId: 'movie',
          caseCode: 'STREAM-4091',
        },
      },
      {
        id: 'fmsg-2',
        channelId: 'club-fbi-club-bau',
        senderHandle: 'gordon_classic',
        senderBadgeId: 'ID-0012',
        senderTag: 'NOIR',
        text: 'رفقای کلاب نوآر، امشب ساعت ۲۲ دورهمی تماشا و نقد فیلم Heat (1995) رو داریم؛ کسی جا نمونه!',
        timestamp: '۰۱:۵۸',
        isSelf: false,
        isConfidential: true,
      },
      {
        id: 'fmsg-3',
        channelId: 'dm-ag-2',
        senderHandle: 'clarice_cine',
        senderBadgeId: 'ID-1991',
        senderTag: 'CINE',
        text: 'سلام کیانوش! اون نسخه تمیز Zodiac (2007) رو که گفته بودی برات خصوصی فرستادم. هر وقت آماده بودی بزن پخش تو سالن.',
        timestamp: '۰۲:۰۴',
        isSelf: false,
        isConfidential: true,
        attachment: {
          kind: 'film_stream',
          titleFa: 'Zodiac (2007) · Director Cut',
          url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          format: 'HLS',
          roomId: 'movie',
          caseCode: 'DM-1991',
        },
      },
    ],
    clubs: [
      {
        id: 'fbi-club-bau',
        name: 'کلاب نوآر و سینمای ۴K',
        codeName: 'NOIR CLUB',
        tag: 'NOIR',
        divisionFa: 'فیلم‌های کارآگاهی و شاهکارهای ۴K',
        mottoFa: 'پاتوق شبانه علاقه‌مندان سینمای نوآر، تریلرهای فینچر و واچ‌پارتی‌های باکیفیت.',
        focusLabel: '4K Noir · Detective · Watch Party',
        clearanceRequired: 'عضویت آزاد',
        bannerUrl: '/src/assets/images/fbi_noir_evidence_1795259259091.jpg',
        directorHandle: 'deckard_noir',
        membersCount: 184,
        isJoined: true,
        dispatches: [
          {
            id: 'fdisp-1',
            authorHandle: 'deckard_noir',
            authorBadgeId: 'ID-2049',
            text: 'اکران گروهی سه‌گانه نوآر امشب ساعت ۲۳ همراه با لینک استریم مستقیم همین جا.',
            timestamp: '۰۲:۰۵',
            filmTitleFa: 'Noir Night Triple Bill · 4K Stream',
            streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            streamFormat: 'HLS',
            roomId: 'movie',
          },
        ],
      },
      {
        id: 'fbi-club-cyb',
        name: 'کلاب انیمه و سایبرپانک',
        codeName: 'TOKYO STREAM',
        tag: 'ANIME',
        divisionFa: 'انیمه‌های ۶۰ فریم و دنیای سایبری',
        mottoFa: 'اشتراک لینک‌های تمیز انیمه، تحلیل سکانس‌های ساکوگا و همگام‌سازی زیرنویس.',
        focusLabel: '60fps Anime · Telegram Sync · Cyberpunk',
        clearanceRequired: 'عضویت آزاد',
        bannerUrl: '/src/assets/images/fbi_tokyo_surveillance_1795259259795.jpg',
        directorHandle: 'motoko_anime',
        membersCount: 142,
        isJoined: false,
        dispatches: [
          {
            id: 'fdisp-2',
            authorHandle: 'motoko_anime',
            authorBadgeId: 'ID-0901',
            text: 'لینک مستقیم کانال انیمه‌های ۶۰ فریم آپدیت شد و بدون قطعی پخش میشه.',
            timestamp: '۰۱:۳۰',
            filmTitleFa: 'Tokyo Cyber Rain · 60fps Stream',
            streamUrl: 'https://t.me/tokyo_cyber_cinema/402',
            streamFormat: 'TELEGRAM',
            roomId: 'anime',
          },
        ],
      },
      {
        id: 'fbi-club-sig',
        name: 'کلاب سریال و مستندهای معمایی',
        codeName: 'SERIES HUB',
        tag: 'SERIES',
        divisionFa: 'سریال‌های جنایی و مستندهای ویژه',
        mottoFa: 'بحث درباره پایان سریال‌ها، اشتراک لینک‌های سریع P2P و کشف نکات پنهان.',
        focusLabel: 'Crime Series · Docs · P2P WebRTC',
        clearanceRequired: 'عضویت آزاد',
        bannerUrl: '/src/assets/images/fbi_command_backdrop_1795259261383.jpg',
        directorHandle: 'elliot_series',
        membersCount: 119,
        isJoined: false,
        dispatches: [
          {
            id: 'fdisp-3',
            authorHandle: 'elliot_series',
            authorBadgeId: 'ID-4409',
            text: 'نسخه P2P اپیزود ۴۰۹ مستر ربات آماده شد، مستقیم بزنید رو پخش.',
            timestamp: '۰۰:۴۲',
            filmTitleFa: 'Mr. Robot S04E09 · Direct P2P',
            streamUrl: 'webrtc://peer-bau.aipetros.local/series-409',
            streamFormat: 'P2P_WEBRTC',
            roomId: 'series',
          },
        ],
      },
    ],
  };
}

const STORAGE_KEY = 'aipetros_cinema_os_social_v2';

export function loadCinemaFbiState(): CinemaFbiSocialState {
  const seed = buildInitialCinemaFbiState();
  if (typeof window === 'undefined') return seed;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Partial<CinemaFbiSocialState>;
    if (!parsed || !Array.isArray(parsed.posts) || !Array.isArray(parsed.clubs) || !Array.isArray(parsed.agents)) {
      return seed;
    }
    return {
      ...seed,
      ...parsed,
    };
  } catch {
    return seed;
  }
}

export function saveCinemaFbiState(state: CinemaFbiSocialState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage limits
  }
}

export function toggleFbiPostReaction(
  state: CinemaFbiSocialState,
  postId: string,
  reaction: 'like' | 'dislike'
): CinemaFbiSocialState {
  let repDelta = 0;
  const posts = state.posts.map((post) => {
    if (post.id !== postId) return post;
    const prev = post.userReaction;
    let likesCount = post.likesCount;
    let dislikesCount = post.dislikesCount;
    let nextReaction: 'like' | 'dislike' | null = reaction;

    if (prev === reaction) {
      nextReaction = null;
      if (reaction === 'like') {
        likesCount = Math.max(0, likesCount - 1);
        repDelta = -10;
      } else {
        dislikesCount = Math.max(0, dislikesCount - 1);
      }
    } else {
      if (prev === 'like') likesCount = Math.max(0, likesCount - 1);
      if (prev === 'dislike') dislikesCount = Math.max(0, dislikesCount - 1);
      if (reaction === 'like') {
        likesCount += 1;
        repDelta = 15;
      } else {
        dislikesCount += 1;
        repDelta = 5;
      }
    }
    return { ...post, likesCount, dislikesCount, userReaction: nextReaction };
  });

  return {
    ...state,
    userRep: Math.max(0, state.userRep + repDelta),
    posts,
  };
}

export function toggleFbiPostBookmark(
  state: CinemaFbiSocialState,
  postId: string
): CinemaFbiSocialState {
  return {
    ...state,
    posts: state.posts.map((p) =>
      p.id === postId ? { ...p, bookmarkedByMe: !p.bookmarkedByMe } : p
    ),
  };
}

export function addFbiPostComment(
  state: CinemaFbiSocialState,
  postId: string,
  text: string
): CinemaFbiSocialState {
  const clean = text.trim();
  if (!clean) return state;
  const now = new Date();
  const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return {
    ...state,
    userRep: state.userRep + 25,
    posts: state.posts.map((p) =>
      p.id === postId
        ? {
            ...p,
            comments: [
              ...p.comments,
              {
                id: `fcm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                authorHandle: state.userHandle,
                authorTag: state.userCrewTag,
                avatarUrl: '/src/assets/images/athlete_avatar_1794943635940.jpg',
                text: clean,
                timestamp,
                likesCount: 0,
                likedByMe: false,
              },
            ],
          }
        : p
    ),
  };
}

export function toggleFbiCommentLike(
  state: CinemaFbiSocialState,
  postId: string,
  commentId: string
): CinemaFbiSocialState {
  return {
    ...state,
    posts: state.posts.map((p) =>
      p.id === postId
        ? {
            ...p,
            comments: p.comments.map((cm) => {
              if (cm.id !== commentId) return cm;
              const nextLiked = !cm.likedByMe;
              return {
                ...cm,
                likedByMe: nextLiked,
                likesCount: Math.max(0, cm.likesCount + (nextLiked ? 1 : -1)),
              };
            }),
          }
        : p
    ),
  };
}

export function shareFbiPostToChannel(
  state: CinemaFbiSocialState,
  postId: string,
  targetChannelId: string,
  options?: { isConfidential?: boolean }
): CinemaFbiSocialState {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return state;

  const now = new Date();
  const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const isDm = targetChannelId.startsWith('dm-');

  const attachment: FbiChatAttachment | undefined =
    post.streamUrl || post.videoPreviewUrl
      ? {
          kind: post.streamUrl ? 'film_stream' : 'video_file',
          titleFa: post.filmTitleTag || post.divisionFa,
          url: post.streamUrl ?? post.videoPreviewUrl ?? '',
          streamUrl: post.streamUrl ?? post.videoPreviewUrl,
          format: post.streamFormat ?? 'MP4',
          roomId: post.roomId,
          caseCode: post.caseCode,
        }
      : {
          kind: 'dossier_ref',
          titleFa: `${post.caseCode} · ${post.filmTitleTag}`,
          url: post.mediaUrl,
          roomId: post.roomId,
          caseCode: post.caseCode,
        };

  const forwardMsg: FbiSecureMessage = {
    id: `fmsg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    channelId: targetChannelId,
    senderHandle: state.userHandle,
    senderBadgeId: state.userBadgeId,
    senderTag: state.userCrewTag,
    text: isDm
      ? `فیلم و پست «${post.filmTitleTag}» رو برات تو دایرکت فرستادم`
      : `بازنشر پست «${post.filmTitleTag}»: ${post.captionFa.slice(0, 88)}`,
    timestamp,
    isSelf: true,
    isConfidential: options?.isConfidential ?? isDm,
    attachment,
  };

  return {
    ...state,
    userRep: state.userRep + (isDm ? 45 : 35),
    posts: state.posts.map((p) =>
      p.id === postId ? { ...p, sharesCount: p.sharesCount + 1, sharedByMe: true } : p
    ),
    messages: [...state.messages, forwardMsg].slice(-60),
  };
}

export function createFbiFeedPost(
  state: CinemaFbiSocialState,
  input: {
    captionFa: string;
    filmTitleTag: string;
    divisionFa: string;
    roomId: CinemaRoomId;
    clearanceLevel?: FbiClearanceLevel;
    mediaUrl: string;
    videoPreviewUrl?: string;
    streamUrl?: string;
    telegramChannel?: string;
    clubId?: string;
    forceSpoiler?: boolean;
  }
): { ok: boolean; error?: string; state: CinemaFbiSocialState } {
  const cleanCaption = input.captionFa.trim();
  if (!cleanCaption) {
    return { ok: false, error: 'شرح پرونده یا متن گزارش را وارد کنید.', state };
  }

  let validatedUrl = '';
  let formatLabel = '';
  if (input.streamUrl && input.streamUrl.trim()) {
    const report = authenticateStreamLink(input.streamUrl);
    if (!report.isValid || !report.isSafe) {
      return { ok: false, error: report.summaryFa, state };
    }
    validatedUrl = report.sanitizedUrl;
    formatLabel = report.format;
  } else if (input.videoPreviewUrl) {
    validatedUrl = input.videoPreviewUrl;
    formatLabel = 'MP4';
  }

  const spoilerCheck = scanSpoilerContent(cleanCaption);
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const postNum = 5000 + ((Date.now() % 4999) | 0);

  const newPost: FbiCinemaPost = {
    id: `fbi-post-${Date.now()}`,
    caseCode: `STREAM-${postNum}`,
    clearanceLevel: input.clearanceLevel ?? (input.forceSpoiler ? 'TOP SECRET' : 'CONFIDENTIAL'),
    authorHandle: state.userHandle,
    authorDisplayNameFa: state.userDisplayNameFa,
    authorBadgeId: state.userBadgeId,
    authorTag: state.userCrewTag,
    avatarUrl: '/src/assets/images/athlete_avatar_1794943635940.jpg',
    roomId: input.roomId,
    divisionFa: input.divisionFa.trim() || 'شبکه سینمایی CINE-OS',
    filmTitleTag: input.filmTitleTag.trim() || '4K Direct Stream',
    captionFa: cleanCaption,
    mediaUrl: input.mediaUrl,
    videoPreviewUrl: input.videoPreviewUrl,
    streamUrl: validatedUrl || undefined,
    streamFormat: formatLabel || undefined,
    telegramChannel: input.telegramChannel?.trim() || undefined,
    clubId: input.clubId || undefined,
    hasSpoiler: Boolean(input.forceSpoiler) || spoilerCheck.hasSpoiler,
    timestamp: `${hh}:${mm} · هم‌اکنون`,
    likesCount: 1,
    dislikesCount: 0,
    userReaction: 'like',
    sharesCount: 0,
    sharedByMe: false,
    bookmarkedByMe: false,
    comments: [],
  };

  return {
    ok: true,
    state: {
      ...state,
      userRep: state.userRep + 120,
      posts: [newPost, ...state.posts],
    },
  };
}

export function toggleFbiAgentConnection(
  state: CinemaFbiSocialState,
  agentId: string
): CinemaFbiSocialState {
  let repDelta = 0;
  const agents = state.agents.map((ag) => {
    if (ag.id !== agentId) return ag;
    const nextFriend = !ag.isFriend;
    repDelta = nextFriend ? 60 : -60;
    return {
      ...ag,
      isFriend: nextFriend,
      repScore: Math.max(0, ag.repScore + (nextFriend ? 25 : -25)),
    };
  });
  return {
    ...state,
    userRep: Math.max(0, state.userRep + repDelta),
    agents,
  };
}

export function appendFbiChatMessage(
  state: CinemaFbiSocialState,
  input: {
    channelId: string;
    text: string;
    isSelf?: boolean;
    isConfidential?: boolean;
    attachment?: FbiChatAttachment;
  }
): { ok: boolean; error?: string; state: CinemaFbiSocialState } {
  const cleanText = input.text.trim();
  if (!cleanText && !input.attachment) {
    return { ok: false, error: 'متن پیام یا فایل فیلم را وارد کنید.', state };
  }

  let safeAttachment = input.attachment;
  if (safeAttachment?.kind === 'film_stream' && safeAttachment.url) {
    const auth = authenticateStreamLink(safeAttachment.url);
    if (!auth.isValid || !auth.isSafe) {
      return { ok: false, error: auth.summaryFa, state };
    }
    safeAttachment = {
      ...safeAttachment,
      url: auth.sanitizedUrl,
      streamUrl: auth.sanitizedUrl,
      format: auth.format,
    };
  }

  const now = new Date();
  const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const msg: FbiSecureMessage = {
    id: `fmsg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    channelId: input.channelId,
    senderHandle: state.userHandle,
    senderBadgeId: state.userBadgeId,
    senderTag: state.userCrewTag,
    text: cleanText || `ارسال فایل: ${safeAttachment?.titleFa ?? 'پیوست امن'}`,
    timestamp,
    isSelf: input.isSelf ?? true,
    isConfidential: input.isConfidential,
    attachment: safeAttachment,
  };

  return {
    ok: true,
    state: {
      ...state,
      userRep: state.userRep + (msg.attachment ? 35 : 15),
      messages: [...state.messages, msg].slice(-60),
    },
  };
}

export function buildFbiAgentAutoReply(
  state: CinemaFbiSocialState,
  userMessage: string,
  channelId: string,
  hadFilmAttachment: boolean
): FbiSecureMessage {
  const target =
    state.agents.find((a) => channelId === `dm-${a.id}`) ??
    state.agents.find((a) => `club-${a.clanTag}` === channelId) ??
    state.agents[0];
  const now = new Date();
  const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const lower = userMessage.toLowerCase();

  let replyText = '';
  if (hadFilmAttachment) {
    replyText = `عالیه ${state.userDisplayNameFa.split(' ')[0]}! لینک و ویدیوی ارسالی الان برام باز شد، میتونیم مستقیم تو سالن پخشش کنیم.`;
  } else if (channelId.startsWith('dm-')) {
    replyText = `سلام ${state.userDisplayNameFa.split(' ')[0]}، پیامت رو دیدم! الان مشغول تماشای ${target.favoriteFilmFa} هستم؛ هر فیلم یا لینک جدیدی داری همینجا برام بفرست.`;
  } else if (lower.includes('انیمه') || lower.includes('توکیو')) {
    replyText = `آره، کیفیت ۶۰ فریم کلاب انیمه خیلی تمیزه؛ لینک کانال و پخش مستقیمش رو بالای چت هم داریم!`;
  } else if (lower.includes('فیلم') || lower.includes('پیشنهاد') || lower.includes('ببینیم')) {
    replyText = `من امشب ${target.favoriteFilmFa} رو پیشنهاد میدم؛ اگه پایه‌ای لینکش رو بذار بریم واچ‌پارتی تو سالن!`;
  } else {
    replyText = `گرفتم ${state.userDisplayNameFa.split(' ')[0]}! توی ${target.divisionFa} همه‌چیز ردیفه، هر وقت خواستی لینک بذار یا تو چت هماهنگ کنیم.`;
  }

  return {
    id: `frep-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    channelId,
    senderHandle: target.handle,
    senderBadgeId: target.badgeNumber,
    senderTag: target.clanTag,
    text: replyText,
    timestamp,
    isSelf: false,
    isConfidential: channelId.startsWith('dm-'),
  };
}

export function toggleFbiClubMembership(
  state: CinemaFbiSocialState,
  clubId: string
): CinemaFbiSocialState {
  let repDelta = 0;
  let nextTag = state.userCrewTag;
  const clubs = state.clubs.map((club) => {
    if (club.id !== clubId) return club;
    const nextJoined = !club.isJoined;
    if (nextJoined) {
      repDelta = 120;
      nextTag = club.tag;
    } else {
      repDelta = -40;
    }
    return {
      ...club,
      isJoined: nextJoined,
      membersCount: Math.max(1, club.membersCount + (nextJoined ? 1 : -1)),
    };
  });

  return {
    ...state,
    userCrewTag: nextTag,
    userRep: Math.max(0, state.userRep + repDelta),
    clubs,
  };
}

export function createFbiDivisionClub(
  state: CinemaFbiSocialState,
  input: {
    name: string;
    tag: string;
    divisionFa?: string;
    mottoFa?: string;
    focusLabel?: string;
  }
): CinemaFbiSocialState {
  const cleanName = input.name.trim();
  const cleanTag = input.tag.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  if (cleanName.length < 2 || cleanTag.length < 2) return state;

  const newClub: FbiDivisionClub = {
    id: `fbi-club-${Date.now()}`,
    name: cleanName,
    codeName: `${cleanTag} CLUB`,
    tag: cleanTag,
    divisionFa: input.divisionFa?.trim() || 'کلاب فیلم و واچ‌پارتی',
    mottoFa:
      input.mottoFa?.trim() ||
      'دورهمی تماشای فیلم ۴K، گفتگوی دوستانه و اشتراک لینک مستقیم با اعضا.',
    focusLabel: input.focusLabel?.trim() || '4K Streams · Watch Party',
    clearanceRequired: 'عضویت آزاد',
    bannerUrl: '/src/assets/images/fbi_command_backdrop_1795259261383.jpg',
    directorHandle: state.userHandle,
    membersCount: 1,
    isJoined: true,
    dispatches: [
      {
        id: `fdisp-${Date.now()}`,
        authorHandle: state.userHandle,
        authorBadgeId: state.userBadgeId,
        text: `کلاب [${cleanTag}] توسط ${state.userDisplayNameFa} ساخته شد. خوش اومدید!`,
        timestamp: 'هم‌اکنون',
      },
    ],
  };

  return {
    ...state,
    userCrewTag: cleanTag,
    userRep: state.userRep + 250,
    clubs: [newClub, ...state.clubs],
  };
}

export function postFbiClubDispatch(
  state: CinemaFbiSocialState,
  clubId: string,
  input: {
    text: string;
    filmTitleFa?: string;
    streamUrl?: string;
    roomId?: CinemaRoomId;
  }
): { ok: boolean; error?: string; state: CinemaFbiSocialState } {
  const clean = input.text.trim();
  if (!clean && !input.streamUrl?.trim()) {
    return { ok: false, error: 'متن پیام یا لینک فیلم کلاب را وارد کنید.', state };
  }

  let validatedUrl = '';
  let formatLabel = '';
  if (input.streamUrl && input.streamUrl.trim()) {
    const auth = authenticateStreamLink(input.streamUrl);
    if (!auth.isValid || !auth.isSafe) {
      return { ok: false, error: auth.summaryFa, state };
    }
    validatedUrl = auth.sanitizedUrl;
    formatLabel = auth.format;
  }

  const now = new Date();
  const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const dispatch: FbiClubDispatch = {
    id: `fdisp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    authorHandle: state.userHandle,
    authorBadgeId: state.userBadgeId,
    text: clean || `ارسال فیلم جدید در کلاب: ${input.filmTitleFa || 'نسخه ۴K'}`,
    timestamp,
    filmTitleFa: input.filmTitleFa?.trim() || (validatedUrl ? 'فیلم اختصاصی کلاب' : undefined),
    streamUrl: validatedUrl || undefined,
    streamFormat: formatLabel || undefined,
    roomId: input.roomId ?? 'movie',
  };

  // Also mirror into that club's live encrypted chat channel
  const clubMsg: FbiSecureMessage = {
    id: `fmsg-club-${Date.now()}`,
    channelId: `club-${clubId}`,
    senderHandle: state.userHandle,
    senderBadgeId: state.userBadgeId,
    senderTag: state.userCrewTag,
    text: dispatch.text,
    timestamp,
    isSelf: true,
    isConfidential: true,
    attachment: validatedUrl
      ? {
          kind: 'film_stream',
          titleFa: dispatch.filmTitleFa || 'فیلم کلاب',
          url: validatedUrl,
          streamUrl: validatedUrl,
          format: formatLabel,
          roomId: dispatch.roomId,
        }
      : undefined,
  };

  return {
    ok: true,
    state: {
      ...state,
      userRep: state.userRep + 55,
      clubs: state.clubs.map((c) =>
        c.id === clubId ? { ...c, dispatches: [dispatch, ...c.dispatches] } : c
      ),
      messages: [...state.messages, clubMsg].slice(-60),
    },
  };
}

export function toCinemaStreamPost(input: {
  id: string;
  roomId: CinemaRoomId;
  titleFa: string;
  captionFa: string;
  streamUrl: string;
  streamFormat?: string;
  authorHandle: string;
  telegramChannel?: string;
  authorTag: string;
  likesCount?: number;
  timestampLabel?: string;
}): UndergroundStreamPost {
  return {
    id: input.id,
    hub: 'cinema',
    roomId: input.roomId,
    titleFa: input.titleFa,
    captionFa: input.captionFa,
    streamUrl: input.streamUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    streamFormat: (input.streamFormat as UndergroundStreamPost['streamFormat']) ?? 'HLS',
    authorHandle: input.authorHandle,
    authorTelegramChannel: input.telegramChannel ?? 't.me/fbi_cinema_bureau',
    personaBadge: input.authorTag,
    personaAccentHex: '#F59E0B',
    likesCount: input.likesCount ?? 1,
    likedByMe: false,
    createdOrder: 1,
    timestampLabel: input.timestampLabel ?? 'هم‌اکنون',
    comments: [],
  };
}
