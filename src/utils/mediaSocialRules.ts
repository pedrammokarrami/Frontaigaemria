import type {
  GtaChatMessage,
  GtaClub,
  GtaGamerProfile,
  GtaSocialPost,
} from './gtaSocialRules.ts';
import {
  authenticateStreamLink,
  scanSpoilerContent,
  type UndergroundStreamPost,
} from './cinemaAgents.ts';
import type { MediaHubKind } from '../data/iconicMediaCharacters.ts';

export type MediaSocialTabId = 'feed' | 'chat' | 'friends' | 'clubs';

export interface MediaSocialPost extends GtaSocialPost {
  roomId: string;
  streamUrl?: string;
  streamFormat?: string;
  telegramChannel?: string;
  hasSpoiler?: boolean;
}

export interface MediaSocialState {
  hub: MediaHubKind;
  activeTab: MediaSocialTabId;
  userHandle: string;
  userCrewTag: string;
  userStreetRep: number;
  posts: MediaSocialPost[];
  members: GtaGamerProfile[];
  messages: GtaChatMessage[];
  clubs: GtaClub[];
}

export const CINEMA_MEDIA_PRESETS = [
  {
    id: 'cin-noir',
    label: 'سالن نوآر کلاسیک',
    url: '/src/assets/images/room_cinema_noir_hall_1795254621048.jpg',
  },
  {
    id: 'cin-anime',
    label: 'کوچه توکیو بارانی',
    url: '/src/assets/images/room_anime_tokyo_rain_1795254620688.jpg',
  },
  {
    id: 'cin-series',
    label: 'اتاق مانیتورینگ سریال',
    url: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
  },
  {
    id: 'cin-retro',
    label: 'استودیو رترو دهه ۸۰',
    url: '/src/assets/images/gta6_vice_sunset_backdrop_1795183788003.jpg',
  },
];

export const AUDIO_MEDIA_PRESETS = [
  {
    id: 'aud-cafe',
    label: 'کافه وست‌ورلد',
    url: '/src/assets/images/room_audio_westworld_cafe_1795254621285.jpg',
  },
  {
    id: 'aud-rave',
    label: 'ریو صنعتی برلین',
    url: '/src/assets/images/room_audio_berlin_rave_1795254620559.jpg',
  },
  {
    id: 'aud-library',
    label: 'کتابخانه اساسینز کرید',
    url: '/src/assets/images/room_audio_ac_library_1795254620400.jpg',
  },
  {
    id: 'aud-festival',
    label: 'جشنواره تومارلند',
    url: '/src/assets/images/gta6_post_yacht_party_1795183787708.jpg',
  },
];

export function buildInitialMediaSocialState(hub: MediaHubKind): MediaSocialState {
  if (hub === 'cinema') {
    return {
      hub: 'cinema',
      activeTab: 'feed',
      userHandle: 'Kian_Noir4K',
      userCrewTag: 'NOIR',
      userStreetRep: 9240,
      posts: [
        {
          id: 'cin-post-1',
          authorHandle: 'mr_archivist',
          authorDisplayNameFa: 'دکارد · آرشیویست سالن نوآر',
          authorTag: 'NOIR',
          avatarUrl: '/src/assets/images/holo_max_noir_1795172673547.jpg',
          districtFa: 'سالن نوآر کلاسیک',
          gameTag: '4K HDR · Blade Runner 2049',
          roomId: 'movie',
          streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          streamFormat: 'HLS',
          telegramChannel: 't.me/noir_vault_ch',
          hasSpoiler: true,
          captionFa:
            'بازبینی کات کارگردان بلید رانر ۲۰۴۹ با کیفیت ۴K بدون افت فریم. هشدار اسپویل: در سکانس برف پایانی مشخص میشه افسر K پسر واقعی نیست اما خاطره‌اش به دختر ریک دکارد پیوند می‌خوره.',
          mediaUrl: '/src/assets/images/room_cinema_noir_hall_1795254621048.jpg',
          timestamp: '۸ دقیقه پیش',
          likesCount: 248,
          dislikesCount: 5,
          userReaction: null,
          sharesCount: 38,
          sharedByMe: false,
          comments: [
            {
              id: 'cin-cm-1',
              authorHandle: 'shibuya_ghost',
              authorTag: 'OTK',
              avatarUrl: '/src/assets/images/holo_female_cyber_1795172673060.jpg',
              text: 'نورپردازی نارنجی لاس‌وگاس توی این نسخه ریمستر باورنکردنیه! واچ‌پارتی ساعت ۲۳ عالی میشه.',
              timestamp: '۵ دقیقه پیش',
              likesCount: 16,
              likedByMe: false,
            },
          ],
        },
        {
          id: 'cin-post-2',
          authorHandle: 'shibuya_ghost',
          authorDisplayNameFa: 'موتوکو · کیوریتور انیمه توکیو',
          authorTag: 'OTK',
          avatarUrl: '/src/assets/images/holo_female_cyber_1795172673060.jpg',
          districtFa: 'کوچه توکیو در باران',
          gameTag: '60fps Anime · Telegram Sync',
          roomId: 'anime',
          streamUrl: 'https://t.me/tokyo_rain_anime_ch/402',
          streamFormat: 'TELEGRAM',
          telegramChannel: 't.me/tokyo_rain_anime_ch',
          hasSpoiler: false,
          captionFa:
            'پلی‌لیست امشب سکانس‌های ساکوگا و سایبرپانک ژاپنی توی اتاق انیمه با زیرنویس هماهنگ و لینک مستقیم کانال تلگرام آماده پخشه!',
          mediaUrl: '/src/assets/images/room_anime_tokyo_rain_1795254620688.jpg',
          timestamp: '۲۴ دقیقه پیش',
          likesCount: 194,
          dislikesCount: 3,
          userReaction: null,
          sharesCount: 27,
          sharedByMe: false,
          comments: [
            {
              id: 'cin-cm-2',
              authorHandle: 'alderson_node',
              authorTag: 'DET',
              avatarUrl: '/src/assets/images/holo_male_prime_1795172645988.jpg',
              text: 'لینک تلگرام رو توی پلیر تست کردم، درجا ۶۰ فریم بالا اومد!',
              timestamp: '۱۴ دقیقه پیش',
              likesCount: 12,
              likedByMe: false,
            },
          ],
        },
        {
          id: 'cin-post-3',
          authorHandle: 'alderson_node',
          authorDisplayNameFa: 'الیوت · کارآگاه سریال‌های معمایی',
          authorTag: 'DET',
          avatarUrl: '/src/assets/images/holo_male_prime_1795172645988.jpg',
          districtFa: 'اتاق مانیتورینگ جنایی',
          gameTag: 'P2P Stream · Mr. Robot',
          roomId: 'series',
          streamUrl: 'webrtc://peer-fsociety.aipetros.local/series-409',
          streamFormat: 'P2P_WEBRTC',
          telegramChannel: 't.me/fsociety_cinema',
          hasSpoiler: false,
          captionFa:
            'تحلیل فریم به فریم اپیزود ۴۰۹ سریال Mr. Robot امشب داخل کلاب کارآگاه‌های سریال برگزار میشه. هر کی پایه تئوری‌پردازیه عضو کلاب بشه!',
          mediaUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
          timestamp: '۴۵ دقیقه پیش',
          likesCount: 173,
          dislikesCount: 8,
          userReaction: null,
          sharesCount: 22,
          sharedByMe: false,
          comments: [],
        },
      ],
      members: [
        {
          id: 'cm-1',
          handle: 'mr_archivist',
          displayNameFa: 'دکارد · آرشیویست نوآر',
          realm: 'story',
          favoriteGame: 'سالن نوآر کلاسیک · ۴K Scope',
          rankLabel: 'Noir Curator · 4K Archive',
          cityDistrict: 'سالن ۱ · نوآر کلاسیک',
          dnaMatchPct: 97,
          playStyleFa: 'تحلیل پلان به پلان و کات‌های کارگردان بدون اسپویل',
          micReady: true,
          onlineStatus: 'ONLINE',
          avatarUrl: '/src/assets/images/holo_max_noir_1795172673547.jpg',
          isFriend: true,
          repScore: 11200,
          clanTag: 'NOIR',
          richPresenceFa: 'در حال تماشای بلید رانر ۲۰۴۹',
          mainGames: ['فیلم نوآر', 'علمی‌تخیلی', 'مستند ۴K'],
          winsCount: 340,
          lossesCount: 12,
          championshipsCount: 8,
          winRatePct: 96,
          seasonBadgeFa: 'آرشیویست برتر',
          fanClubTitleFa: 'کلاب آرشیو نوآر',
          fanClubMembersCount: 1180,
        },
        {
          id: 'cm-2',
          handle: 'shibuya_ghost',
          displayNameFa: 'موتوکو · متخصص انیمه توکیو',
          realm: 'strategy',
          favoriteGame: 'انیمه · کوچه توکیو در باران',
          rankLabel: 'Sakuga Master · 60fps Sub',
          cityDistrict: 'اتاق انیمه · شیبویا',
          dnaMatchPct: 94,
          playStyleFa: 'واچ‌پارتی انیمه‌های سایبرپانک و استودیو جیبلی',
          micReady: true,
          onlineStatus: 'ONLINE',
          avatarUrl: '/src/assets/images/holo_female_cyber_1795172673060.jpg',
          isFriend: false,
          repScore: 9850,
          clanTag: 'OTK',
          richPresenceFa: 'آنلاین در کوچه توکیو · زیرنویس هماهنگ',
          mainGames: ['انیمه سایبرپانک', 'استودیو جیبلی', 'سریال توکیو'],
          winsCount: 280,
          lossesCount: 18,
          championshipsCount: 6,
          winRatePct: 92,
          seasonBadgeFa: 'ملکه ساکوگا',
          fanClubTitleFa: 'کلوپ انیمه‌بازان توکیو',
          fanClubMembersCount: 940,
        },
        {
          id: 'cm-3',
          handle: 'alderson_node',
          displayNameFa: 'الیوت · کارآگاه تئوری سریال',
          realm: 'shooter',
          favoriteGame: 'سریال · اتاق مانیتورینگ جنایی',
          rankLabel: 'Theory Hunter · P2P Host',
          cityDistrict: 'مانیتورینگ مرکزی · اتاق ۲',
          dnaMatchPct: 92,
          playStyleFa: 'کشف نشانه‌های پنهان و استریم غیرمتمرکز بدون سانسور',
          micReady: true,
          onlineStatus: 'IN MATCH',
          avatarUrl: '/src/assets/images/holo_male_prime_1795172645988.jpg',
          isFriend: false,
          repScore: 8940,
          clanTag: 'DET',
          richPresenceFa: 'در حال استریم P2P اپیزود فینال',
          mainGames: ['سریال جنایی', 'تریلر روان‌شناختی', 'مستند سایبری'],
          winsCount: 215,
          lossesCount: 24,
          championshipsCount: 5,
          winRatePct: 89,
          seasonBadgeFa: 'شکارچی تئوری',
          fanClubTitleFa: 'انجمن تحلیلگران سریال',
          fanClubMembersCount: 790,
        },
        {
          id: 'cm-4',
          handle: 'clarice_reel',
          displayNameFa: 'کلاریس · مستندساز و منتقد فستیوال',
          realm: 'sports',
          favoriteGame: 'مستند و تلویزیون رترو',
          rankLabel: 'Festival Critic · 4K Doc',
          cityDistrict: 'کمپ کوهستانی · اتاق ۴',
          dnaMatchPct: 91,
          playStyleFa: 'بررسی سینمای مستقل، مستندهای حیات‌وحش و پرونده واقعی',
          micReady: false,
          onlineStatus: 'CREW LOBBY',
          avatarUrl: '/src/assets/images/holo_female_prime_1795172675312.jpg',
          isFriend: true,
          repScore: 8620,
          clanTag: 'DOC',
          richPresenceFa: 'در حال بررسی مستندهای کوهستانی',
          mainGames: ['مستند طبیعت', 'سینمای مستقل', 'تلویزیون ۸۰'],
          winsCount: 198,
          lossesCount: 15,
          championshipsCount: 4,
          winRatePct: 91,
          seasonBadgeFa: 'منتقد فستیوال',
          fanClubTitleFa: 'حلقه مستند و سینما',
          fanClubMembersCount: 650,
        },
      ],
      messages: [
        {
          id: 'cin-msg-1',
          channelId: 'global-cinema',
          senderHandle: 'mr_archivist',
          senderTag: 'NOIR',
          text: 'بچه‌ها امشب ساعت ۲۳ اکران جمعی بلید رانر ۴K تو سالن نوآر داریم؛ محافظ اسپویل فعاله!',
          timestamp: '22:15',
          accentHex: '#F59E0B',
        },
        {
          id: 'cin-msg-2',
          channelId: 'global-cinema',
          senderHandle: 'shibuya_ghost',
          senderTag: 'OTK',
          text: 'لینک تلگرام اپیزود جدید سایبرپانک هم از فیلتر اصالت سنج رد شد و با ۶۰ فریم آماده پخشه.',
          timestamp: '22:18',
          accentHex: '#22D3EE',
        },
      ],
      clubs: [
        {
          id: 'club-noir-vault',
          name: 'Noir Cinema Syndicate',
          tag: 'NOIR',
          districtFa: 'سالن نوآر کلاسیک · ۴K HDR',
          mottoFa: 'کلاب تخصصی فیلم‌های نوآر، نسخه کارگردان و نقد پلان به پلان بدون اسپویل.',
          gameFocus: 'Cinema 4K · Director Cut · Noir',
          bannerUrl: '/src/assets/images/room_cinema_noir_hall_1795254621048.jpg',
          accentHex: '#F59E0B',
          bossHandle: 'mr_archivist',
          membersCount: 184,
          turfRank: 1,
          repTotal: 164200,
          isJoined: true,
          announcements: [
            {
              id: 'cann-1',
              authorHandle: 'mr_archivist',
              text: 'واچ‌پارتی امشب: سه‌گانه کلاسیک نوآر با زیرنویس هماهنگ‌شده و محافظ اسپویل.',
              timestamp: '21:50',
            },
          ],
        },
        {
          id: 'club-shibuya-otk',
          name: 'Shibuya Sakuga Guild',
          tag: 'OTK',
          districtFa: 'کوچه توکیو در باران · انیمه',
          mottoFa: 'اجتماع انیمه‌بازهای حرفه‌ای برای پخش زنده ۶۰ فریم و لینک‌های تمیز تلگرام.',
          gameFocus: 'Anime 60fps · Ghibli · Cyberpunk',
          bannerUrl: '/src/assets/images/room_anime_tokyo_rain_1795254620688.jpg',
          accentHex: '#22D3EE',
          bossHandle: 'shibuya_ghost',
          membersCount: 142,
          turfRank: 2,
          repTotal: 132800,
          isJoined: false,
          announcements: [
            {
              id: 'cann-2',
              authorHandle: 'shibuya_ghost',
              text: 'آرشیو کامل استودیو جیبلی و آکیرا با صدای ۵.۱ در اتاق انیمه قرار گرفت.',
              timestamp: '20:40',
            },
          ],
        },
        {
          id: 'club-detective-tv',
          name: 'Midnight Series Detectives',
          tag: 'DET',
          districtFa: 'اتاق مانیتورینگ جنایی',
          mottoFa: 'بررسی پرونده‌های مرموز سریال‌ها، مستندهای جنایی و پخش P2P اپیزودها.',
          gameFocus: 'Series · Crime · Documentary',
          bannerUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
          accentHex: '#38BDF8',
          bossHandle: 'alderson_node',
          membersCount: 98,
          turfRank: 3,
          repTotal: 108500,
          isJoined: false,
          announcements: [
            {
              id: 'cann-3',
              authorHandle: 'alderson_node',
              text: 'میزگرد تئوری اپیزود فینال امشب راس ساعت ۲۳:۳۰ باز میشه.',
              timestamp: '19:20',
            },
          ],
        },
      ],
    };
  }

  // AUDIO HUB SOCIAL STATE
  return {
    hub: 'audio',
    activeTab: 'feed',
    userHandle: 'Kian_AnalogEQ',
    userCrewTag: 'WST',
    userStreetRep: 9610,
    posts: [
      {
        id: 'aud-post-1',
        authorHandle: 'tresor_queen',
        authorDisplayNameFa: 'شارلوت · دی‌جی کلاب برلین',
        authorTag: 'TRS',
        avatarUrl: '/src/assets/images/holo_female_cyber_1795172673060.jpg',
        districtFa: 'ریو صنعتی برلین',
        gameTag: '142 BPM · Acid Techno',
        roomId: 'berlin-rave',
        streamUrl: 'https://t.me/berlin_sub_rave/108',
        streamFormat: 'TELEGRAM',
        telegramChannel: 't.me/berlin_sub_rave',
        captionFa:
          'ست زنده ساعت ۴ صبح انبار بتنی برلین با پروفایل ساب‌بیس +۸ دسی‌بل آماده است! وارد اتاق برلین بشید و اکولایزر زنده رو روی سیستم‌تون تست کنید.',
        mediaUrl: '/src/assets/images/room_audio_berlin_rave_1795254620559.jpg',
        timestamp: '۵ دقیقه پیش',
        likesCount: 312,
        dislikesCount: 6,
        userReaction: null,
        sharesCount: 49,
        sharedByMe: false,
        comments: [
          {
            id: 'aud-cm-1',
            authorHandle: 'outlaw_blues',
            authorTag: 'WST',
            avatarUrl: '/src/assets/images/holo_arthur_gunslinger_1795172673423.jpg',
            text: 'پانچ ساب‌بیس توی اتاق برلین دیوانه‌کننده‌ست! بعدش میام کافه وست‌ورلد برای بلوز آخر شب.',
            timestamp: '۲ دقیقه پیش',
            likesCount: 18,
            likedByMe: false,
          },
        ],
      },
      {
        id: 'aud-post-2',
        authorHandle: 'outlaw_blues',
        authorDisplayNameFa: 'آرتور · نوازنده کافه وست‌ورلد',
        authorTag: 'WST',
        avatarUrl: '/src/assets/images/holo_arthur_gunslinger_1795172673423.jpg',
        districtFa: 'کافه وستورلد',
        gameTag: '84 BPM · Jazz & Outlaw Blues',
        roomId: 'westworld-cafe',
        streamUrl: 'https://t.me/westworld_vinyl_cafe/72',
        streamFormat: 'TELEGRAM',
        telegramChannel: 't.me/westworld_vinyl_cafe',
        captionFa:
          'پلی‌لیست پیانو و گیتار اسلاید کافه وست‌ورلد با گرمای لامپی وینیل آپدیت شد. برای کدنویسی و استراحت شبانه عالیه.',
        mediaUrl: '/src/assets/images/room_audio_westworld_cafe_1795254621285.jpg',
        timestamp: '۲۰ دقیقه پیش',
        likesCount: 229,
        dislikesCount: 2,
        userReaction: null,
        sharesCount: 31,
        sharedByMe: false,
        comments: [],
      },
      {
        id: 'aud-post-3',
        authorHandle: 'lore_narrator',
        authorDisplayNameFa: 'لورنا · راوی کتابخانه اساسینز',
        authorTag: 'AAC',
        avatarUrl: '/src/assets/images/holo_female_commander_1795172646701.jpg',
        districtFa: 'کتابخانه قدیمی اساسینز کرید',
        gameTag: 'Audiobook · Chapterizer Sync',
        roomId: 'ac-library',
        streamUrl: 'https://t.me/alamut_audiobooks/33',
        streamFormat: 'TELEGRAM',
        telegramChannel: 't.me/alamut_audiobooks',
        captionFa:
          'فصل سوم کتاب صوتی راز طومارهای آلموت با ۴ بوکمارک زمانی دقیق اضافه شد. نظراتتون رو روی تایم‌کد ۰۶:۵۰ بنویسید!',
        mediaUrl: '/src/assets/images/room_audio_ac_library_1795254620400.jpg',
        timestamp: '۴۴ دقیقه پیش',
        likesCount: 185,
        dislikesCount: 1,
        userReaction: null,
        sharesCount: 26,
        sharedByMe: false,
        comments: [],
      },
    ],
    members: [
      {
        id: 'am-1',
        handle: 'tresor_queen',
        displayNameFa: 'شارلوت · دی‌جی کلاب برلین',
        realm: 'shooter',
        favoriteGame: 'ریو صنعتی برلین · 142 BPM',
        rankLabel: 'Acid Techno Curator',
        cityDistrict: 'انبار برلین · اتاق ۳',
        dnaMatchPct: 96,
        playStyleFa: 'میکس زنده تکنو و تنظیم ساب‌بیس روی اکولایزر کوبنده',
        micReady: true,
        onlineStatus: 'ONLINE',
        avatarUrl: '/src/assets/images/holo_female_cyber_1795172673060.jpg',
        isFriend: false,
        repScore: 11850,
        clanTag: 'TRS',
        richPresenceFa: 'در حال پخش ست زنده برلین (۱۴۲ BPM)',
        mainGames: ['ریو برلین', 'تومارلند EDM', 'تکنو زیرزمینی'],
        winsCount: 410,
        lossesCount: 15,
        championshipsCount: 9,
        winRatePct: 95,
        seasonBadgeFa: 'سلطان بیس برلین',
        fanClubTitleFa: 'کلاب طرفداران ریو برلین',
        fanClubMembersCount: 1420,
      },
      {
        id: 'am-2',
        handle: 'outlaw_blues',
        displayNameFa: 'آرتور · نوازنده کافه وست‌ورلد',
        realm: 'story',
        favoriteGame: 'کافه وستورلد · ۸۴ BPM',
        rankLabel: 'Vinyl & Jazz Host',
        cityDistrict: 'کافه سوییت‌واتر · اتاق ۱',
        dnaMatchPct: 98,
        playStyleFa: 'جاز لامپی، بلوز کلاسیک و قطعات آکوستیک نیمه‌شب',
        micReady: true,
        onlineStatus: 'ONLINE',
        avatarUrl: '/src/assets/images/holo_arthur_gunslinger_1795172673423.jpg',
        isFriend: true,
        repScore: 10340,
        clanTag: 'WST',
        richPresenceFa: 'آنلاین در کافه وست‌ورلد · پخش وینیل',
        mainGames: ['کافه وست‌ورلد', 'کنسرت مایکل جکسون', 'جاز کلاسیک'],
        winsCount: 295,
        lossesCount: 11,
        championshipsCount: 7,
        winRatePct: 94,
        seasonBadgeFa: 'میزبان کافه',
        fanClubTitleFa: 'کلوپ جاز و کافه وست‌ورلد',
        fanClubMembersCount: 980,
      },
      {
        id: 'am-3',
        handle: 'lore_narrator',
        displayNameFa: 'لورنا · راوی کتاب صوتی آلموت',
        realm: 'strategy',
        favoriteGame: 'کتابخانه اساسینز · بوکمارک',
        rankLabel: 'Chapterizer Archivist',
        cityDistrict: 'تالار کتابخانه · اتاق ۶',
        dnaMatchPct: 93,
        playStyleFa: 'فصل‌بندی دقیق کتاب‌های صوتی و گفتگوهای پادکست',
        micReady: true,
        onlineStatus: 'IN MATCH',
        avatarUrl: '/src/assets/images/holo_female_commander_1795172646701.jpg',
        isFriend: false,
        repScore: 9120,
        clanTag: 'AAC',
        richPresenceFa: 'در حال ثبت بوکمارک فصل ۴ کتابخانه',
        mainGames: ['کتابخانه اساسینز', 'استودیوی پادکست', 'مدیتیشن ۴۳۲Hz'],
        winsCount: 260,
        lossesCount: 9,
        championshipsCount: 5,
        winRatePct: 93,
        seasonBadgeFa: 'راوی برتر',
        fanClubTitleFa: 'انجمن شنوندگان کتاب صوتی',
        fanClubMembersCount: 860,
      },
      {
        id: 'am-4',
        handle: 'lex_podstudio',
        displayNameFa: 'لکس · میزبان استودیوی پادکست',
        realm: 'sports',
        favoriteGame: 'استودیوی پادکستر · ۸۸ BPM',
        rankLabel: 'Broadcast Mic Pro',
        cityDistrict: 'استودیو پادکست · اتاق ۷',
        dnaMatchPct: 90,
        playStyleFa: 'میزگردهای زنده فناوری، تاریخ و موسیقی متن بازی‌ها',
        micReady: true,
        onlineStatus: 'CREW LOBBY',
        avatarUrl: '/src/assets/images/holo_male_prime_1795172645988.jpg',
        isFriend: false,
        repScore: 8740,
        clanTag: 'POD',
        richPresenceFa: 'ضبط اپیزود ۴۳ پادکست شبانه',
        mainGames: ['استودیوی پادکست', 'تومارلند', 'مدیتیشن'],
        winsCount: 204,
        lossesCount: 16,
        championshipsCount: 4,
        winRatePct: 90,
        seasonBadgeFa: 'پادکستر فصل',
        fanClubTitleFa: 'کلوپ شنوندگان پادکست',
        fanClubMembersCount: 740,
      },
    ],
    messages: [
      {
        id: 'aud-msg-1',
        channelId: 'global-audio',
        senderHandle: 'outlaw_blues',
        senderTag: 'WST',
        text: 'در کافه وست‌ورلد صفحه پیانوی سوییت‌واتر رو گذاشتیم؛ هر کی تمرکز یا آرامش شبانه می‌خواد بیاد داخل.',
        timestamp: '22:10',
        accentHex: '#F59E0B',
      },
      {
        id: 'aud-msg-2',
        channelId: 'global-audio',
        senderHandle: 'tresor_queen',
        senderTag: 'TRS',
        text: 'ست زنده ۱۴۲ BPM برلین تا ۱۰ دقیقه دیگه استارت می‌خوره؛ ساب‌بیس‌ها رو چک کنید!',
        timestamp: '22:14',
        accentHex: '#FB7185',
      },
    ],
    clubs: [
      {
        id: 'club-westworld',
        name: 'Westworld Vinyl Lounge',
        tag: 'WST',
        districtFa: 'کافه وستورلد · جاز و بلوز',
        mottoFa: 'جمع علاقه‌مندان به موسیقی کافه، جاز، بلوز آکوستیک و گپ‌های شبانه.',
        gameFocus: 'Jazz · Blues · Acoustic 84 BPM',
        bannerUrl: '/src/assets/images/room_audio_westworld_cafe_1795254621285.jpg',
        accentHex: '#F59E0B',
        bossHandle: 'outlaw_blues',
        membersCount: 196,
        turfRank: 1,
        repTotal: 158900,
        isJoined: true,
        announcements: [
          {
            id: 'aann-1',
            authorHandle: 'outlaw_blues',
            text: 'سشن شبانه جاز و بلوز راس ساعت ۲۳ با اکولایزر لامپی در کافه وست‌ورلد برگزار میشه.',
            timestamp: '21:45',
          },
        ],
      },
      {
        id: 'club-berlin-tresor',
        name: 'Berlin Industrial Rave',
        tag: 'TRS',
        districtFa: 'ریو صنعتی برلین · تکنو',
        mottoFa: 'کلاب تخصصی هارد ریو، تکنوی زیرزمینی و استیج تومارلند بالای ۱۳۰ BPM.',
        gameFocus: 'Techno · Acid · Trance 142 BPM',
        bannerUrl: '/src/assets/images/room_audio_berlin_rave_1795254620559.jpg',
        accentHex: '#FB7185',
        bossHandle: 'tresor_queen',
        membersCount: 214,
        turfRank: 2,
        repTotal: 149200,
        isJoined: false,
        announcements: [
          {
            id: 'aann-2',
            authorHandle: 'tresor_queen',
            text: 'تست ست ۴ ساعته تکنو امشب داخل کلاب برلین فعال شد.',
            timestamp: '20:55',
          },
        ],
      },
      {
        id: 'club-alamut-books',
        name: 'Alamut Audiobook & Podcast',
        tag: 'AAC',
        districtFa: 'کتابخانه اساسینز و استودیو پادکست',
        mottoFa: 'انجمن شنوندگان کتاب‌های صوتی، فصل‌بندی هوشمند و گفتگوهای عمیق پادکست.',
        gameFocus: 'Audiobooks · Podcasts · 432Hz Focus',
        bannerUrl: '/src/assets/images/room_audio_ac_library_1795254620400.jpg',
        accentHex: '#D97706',
        bossHandle: 'lore_narrator',
        membersCount: 131,
        turfRank: 3,
        repTotal: 112400,
        isJoined: false,
        announcements: [
          {
            id: 'aann-3',
            authorHandle: 'lore_narrator',
            text: 'بحث فصل دوم کتاب طومارهای آلموت با یادداشت‌های صوتی باز شد.',
            timestamp: '19:30',
          },
        ],
      },
    ],
  };
}

function getStorageKey(hub: MediaHubKind): string {
  return `aipetros_media_social_${hub}_v1`;
}

export function loadMediaSocialState(hub: MediaHubKind): MediaSocialState {
  const seed = buildInitialMediaSocialState(hub);
  if (typeof window === 'undefined') return seed;
  try {
    const raw = window.localStorage.getItem(getStorageKey(hub));
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Partial<MediaSocialState>;
    if (!parsed || !Array.isArray(parsed.posts) || !Array.isArray(parsed.clubs)) {
      return seed;
    }
    return {
      ...seed,
      ...parsed,
      hub,
    };
  } catch {
    return seed;
  }
}

export function saveMediaSocialState(state: MediaSocialState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getStorageKey(state.hub), JSON.stringify(state));
  } catch {
    // ignore storage limits
  }
}

export function toggleMediaPostReaction(
  state: MediaSocialState,
  postId: string,
  reaction: 'like' | 'dislike'
): MediaSocialState {
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
    userStreetRep: Math.max(0, state.userStreetRep + repDelta),
    posts,
  };
}

export function addMediaPostComment(
  state: MediaSocialState,
  postId: string,
  text: string
): MediaSocialState {
  const clean = text.trim();
  if (!clean) return state;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  const posts = state.posts.map((post) => {
    if (post.id !== postId) return post;
    return {
      ...post,
      comments: [
        ...post.comments,
        {
          id: `mcm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          authorHandle: state.userHandle,
          authorTag: state.userCrewTag,
          avatarUrl: '/src/assets/images/athlete_avatar_1794943635940.jpg',
          text: clean,
          timestamp: `${hh}:${mm}`,
          likesCount: 0,
          likedByMe: false,
        },
      ],
    };
  });

  return {
    ...state,
    userStreetRep: state.userStreetRep + 25,
    posts,
  };
}

export function toggleMediaCommentLike(
  state: MediaSocialState,
  postId: string,
  commentId: string
): MediaSocialState {
  const posts = state.posts.map((post) => {
    if (post.id !== postId) return post;
    return {
      ...post,
      comments: post.comments.map((cm) => {
        if (cm.id !== commentId) return cm;
        const nextLiked = !cm.likedByMe;
        return {
          ...cm,
          likedByMe: nextLiked,
          likesCount: Math.max(0, cm.likesCount + (nextLiked ? 1 : -1)),
        };
      }),
    };
  });
  return { ...state, posts };
}

export function shareMediaSocialPost(
  state: MediaSocialState,
  postId: string,
  targetChannelId?: string
): MediaSocialState {
  const targetPost = state.posts.find((p) => p.id === postId);
  if (!targetPost) return state;

  const posts = state.posts.map((p) =>
    p.id === postId ? { ...p, sharesCount: p.sharesCount + 1, sharedByMe: true } : p
  );

  let nextMessages = state.messages;
  if (targetChannelId) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    nextMessages = [
      ...state.messages,
      {
        id: `msh-${Date.now()}`,
        channelId: targetChannelId,
        senderHandle: state.userHandle,
        senderTag: state.userCrewTag,
        text: `پست @${targetPost.authorHandle} از ${targetPost.districtFa} را به اشتراک گذاشت: «${targetPost.captionFa.slice(0, 72)}...»`,
        timestamp: `${hh}:${mm}`,
        isSelf: true,
        accentHex: '#38E8FF',
      },
    ].slice(-30);
  }

  return {
    ...state,
    userStreetRep: state.userStreetRep + 35,
    posts,
    messages: nextMessages,
  };
}

export function createMediaSocialPost(
  state: MediaSocialState,
  input: {
    captionFa: string;
    districtFa: string;
    gameTag: string;
    roomId: string;
    mediaUrl: string;
    streamUrl?: string;
    telegramChannel?: string;
  }
): { ok: boolean; error?: string; state: MediaSocialState } {
  const cleanCaption = input.captionFa.trim();
  if (!cleanCaption) {
    return { ok: false, error: 'متن پست را وارد کنید.', state };
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
  }

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const spoilerCheck = state.hub === 'cinema' ? scanSpoilerContent(cleanCaption) : null;

  const newPost: MediaSocialPost = {
    id: `mpost-${Date.now()}`,
    authorHandle: state.userHandle,
    authorDisplayNameFa:
      state.hub === 'cinema' ? 'شما · آرشیویست کلاب سینما' : 'شما · کیوریتور کلاب موزیک',
    authorTag: state.userCrewTag,
    avatarUrl: '/src/assets/images/athlete_avatar_1794943635940.jpg',
    districtFa: input.districtFa.trim() || (state.hub === 'cinema' ? 'سالن نوآر' : 'کافه وست‌ورلد'),
    gameTag: input.gameTag.trim() || (state.hub === 'cinema' ? '4K Stream' : 'Hi-Res Audio'),
    roomId: input.roomId,
    streamUrl: validatedUrl || undefined,
    streamFormat: formatLabel || undefined,
    telegramChannel: input.telegramChannel?.trim() || undefined,
    hasSpoiler: spoilerCheck?.hasSpoiler ?? false,
    captionFa: cleanCaption,
    mediaUrl: input.mediaUrl,
    timestamp: `هم‌اکنون · ${hh}:${mm}`,
    likesCount: 1,
    dislikesCount: 0,
    userReaction: 'like',
    sharesCount: 0,
    sharedByMe: false,
    comments: [],
  };

  return {
    ok: true,
    state: {
      ...state,
      userStreetRep: state.userStreetRep + 110,
      posts: [newPost, ...state.posts],
    },
  };
}

export function toggleMediaFriendship(
  state: MediaSocialState,
  memberId: string
): MediaSocialState {
  let repDelta = 0;
  const members = state.members.map((m) => {
    if (m.id !== memberId) return m;
    const nextFriend = !m.isFriend;
    repDelta = nextFriend ? 60 : -60;
    return {
      ...m,
      isFriend: nextFriend,
      repScore: m.repScore + (nextFriend ? 25 : -25),
    };
  });

  return {
    ...state,
    userStreetRep: Math.max(0, state.userStreetRep + repDelta),
    members,
  };
}

export function appendMediaChatMessage(
  state: MediaSocialState,
  input: { channelId: string; text: string; isSelf?: boolean; senderHandle?: string; senderTag?: string }
): MediaSocialState {
  const clean = input.text.trim();
  if (!clean) return state;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  const msg: GtaChatMessage = {
    id: `mmsg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    channelId: input.channelId,
    senderHandle: input.senderHandle ?? state.userHandle,
    senderTag: input.senderTag ?? state.userCrewTag,
    text: clean,
    timestamp: `${hh}:${mm}`,
    isSelf: input.isSelf ?? true,
    accentHex: state.hub === 'cinema' ? '#F59E0B' : '#38E8FF',
  };

  return {
    ...state,
    userStreetRep: state.userStreetRep + (msg.isSelf ? 15 : 0),
    messages: [...state.messages, msg].slice(-30),
  };
}

export function buildMediaAutoReply(
  state: MediaSocialState,
  userMessage: string,
  channelId: string
): GtaChatMessage {
  const lower = userMessage.toLowerCase();
  const target =
    state.members.find((m) => channelId === `dm-${m.id}`) ?? state.members[0];
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  let replyText = '';
  if (state.hub === 'cinema') {
    replyText = lower.includes('انیمه') || lower.includes('توکیو')
      ? `ایول @${state.userHandle}! اتاق انیمه توکیو بارانی با ۶۰ فریم و زیرنویس هماهنگ بازه؛ لینک استریم رو تو فید گذاشتم!`
      : `پیامتو توی کلاب گرفتم @${state.userHandle}! استریم ${target.favoriteGame} با محافظ اسپویل آماده‌ست، بزن روی پخش در اتاق.`;
  } else {
    replyText = lower.includes('برلین') || lower.includes('ریو') || lower.includes('تکنو')
      ? `بیس ۱۴۲ BPM برلین روشنه @${state.userHandle}! اکولایزر صنعتی رو فعال کن و بیا توی سشن زنده.`
      : `عالیه @${state.userHandle}! توی ${target.cityDistrict} منتظرتیم تا با هم پلی‌لیست و بوکمارک‌های صوتی رو بشنویم.`;
  }

  return {
    id: `mreply-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    channelId,
    senderHandle: target.handle,
    senderTag: target.clanTag ?? 'VIP',
    text: replyText,
    timestamp: `${hh}:${mm}`,
    isSelf: false,
    accentHex: '#38E8FF',
  };
}

export function toggleMediaClubMembership(
  state: MediaSocialState,
  clubId: string
): MediaSocialState {
  let repDelta = 0;
  let nextTag = state.userCrewTag;

  const clubs = state.clubs.map((club) => {
    if (club.id !== clubId) return club;
    const nextJoined = !club.isJoined;
    if (nextJoined) {
      repDelta = 120;
      nextTag = club.tag;
    } else {
      repDelta = -50;
    }
    return {
      ...club,
      isJoined: nextJoined,
      membersCount: Math.max(1, club.membersCount + (nextJoined ? 1 : -1)),
      repTotal: Math.max(0, club.repTotal + (nextJoined ? 250 : -250)),
    };
  });

  return {
    ...state,
    userCrewTag: nextTag,
    userStreetRep: Math.max(0, state.userStreetRep + repDelta),
    clubs,
  };
}

export function createMediaSocialClub(
  state: MediaSocialState,
  input: {
    name: string;
    tag: string;
    districtFa?: string;
    mottoFa?: string;
    gameFocus?: string;
  }
): MediaSocialState {
  const cleanName = input.name.trim();
  const cleanTag = input.tag.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  if (cleanName.length < 2 || cleanTag.length < 2) return state;

  const defaultBanner =
    state.hub === 'cinema'
      ? '/src/assets/images/room_cinema_noir_hall_1795254621048.jpg'
      : '/src/assets/images/room_audio_westworld_cafe_1795254621285.jpg';

  const newClub: GtaClub = {
    id: `mclub-${Date.now()}`,
    name: cleanName,
    tag: cleanTag,
    districtFa:
      input.districtFa?.trim() ||
      (state.hub === 'cinema' ? 'سالن اختصاصی کلاب سینما' : 'استودیو اختصاصی کلاب موزیک'),
    mottoFa:
      input.mottoFa?.trim() ||
      (state.hub === 'cinema'
        ? 'کلاب تخصصی واچ‌پارتی فیلم و سریال بدون اسپویل'
        : 'کلاب تخصصی پخش زنده موزیک، پادکست و کتاب صوتی'),
    gameFocus:
      input.gameFocus?.trim() ||
      (state.hub === 'cinema' ? '4K Films · Anime · Series' : 'Vinyl Jazz · Techno · Podcasts'),
    bannerUrl: defaultBanner,
    accentHex: '#FF3B8B',
    bossHandle: state.userHandle,
    membersCount: 1,
    turfRank: state.clubs.length + 1,
    repTotal: 1500,
    isJoined: true,
    announcements: [
      {
        id: `mann-${Date.now()}`,
        authorHandle: state.userHandle,
        text: `کلاب [${cleanTag}] با موفقیت تأسیس شد — عضویت برای تمام اعضا باز است.`,
        timestamp: 'هم‌اکنون',
      },
    ],
  };

  return {
    ...state,
    userCrewTag: cleanTag,
    userStreetRep: state.userStreetRep + 250,
    clubs: [newClub, ...state.clubs],
  };
}

export function postMediaClubAnnouncement(
  state: MediaSocialState,
  clubId: string,
  text: string
): MediaSocialState {
  const clean = text.trim();
  if (!clean) return state;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  const clubs = state.clubs.map((c) => {
    if (c.id !== clubId) return c;
    return {
      ...c,
      announcements: [
        {
          id: `mann-${Date.now()}`,
          authorHandle: state.userHandle,
          text: clean,
          timestamp: `${hh}:${mm}`,
        },
        ...c.announcements,
      ],
    };
  });

  return {
    ...state,
    userStreetRep: state.userStreetRep + 40,
    clubs,
  };
}

export function toUndergroundStreamPost(
  post: MediaSocialPost,
  hub: MediaHubKind
): UndergroundStreamPost {
  return {
    id: post.id,
    hub,
    roomId: post.roomId,
    titleFa: post.gameTag || post.districtFa,
    captionFa: post.captionFa,
    streamUrl: post.streamUrl ?? 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    streamFormat: (post.streamFormat as UndergroundStreamPost['streamFormat']) ?? 'HLS',
    authorHandle: post.authorHandle,
    authorTelegramChannel: post.telegramChannel ?? 't.me/aipetros_node',
    personaBadge: post.authorTag,
    personaAccentHex: '#FF3B8B',
    likesCount: post.likesCount,
    likedByMe: post.userReaction === 'like',
    createdOrder: 1,
    timestampLabel: post.timestamp,
    comments: [],
  };
}
