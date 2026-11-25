import type { AudioRoomId } from './audioAgents';
import { authenticateStreamLink, type UndergroundStreamPost } from './cinemaAgents';

export type BookSocialTabId = 'feed' | 'chat' | 'friends' | 'clubs';

export interface BookComment {
  id: string;
  authorHandle: string;
  authorTag: string;
  avatarUrl: string;
  text: string;
  timestamp: string;
  likesCount: number;
  likedByMe: boolean;
}

export interface BookAudioPost {
  id: string;
  pageNumberFa: string;
  chapterTitleFa: string;
  epigraphPoemFa?: string;
  authorHandle: string;
  authorDisplayNameFa: string;
  authorTag: string;
  avatarUrl: string;
  roomId: AudioRoomId;
  circleFa: string;
  audioTitleTag: string;
  captionFa: string;
  mediaUrl: string;
  audioPreviewUrl?: string;
  streamUrl?: string;
  streamFormat?: string;
  telegramChannel?: string;
  clubId?: string;
  timestamp: string;
  likesCount: number;
  dislikesCount: number;
  userReaction: 'like' | 'dislike' | null;
  sharesCount: number;
  sharedByMe: boolean;
  bookmarkedByMe: boolean;
  comments: BookComment[];
}

export interface BookAuthorMember {
  id: string;
  handle: string;
  displayNameFa: string;
  penNameLabel: string;
  circleFa: string;
  cityLocationFa: string;
  philosophyQuoteFa: string;
  favoriteWorkFa: string;
  onlineStatus: 'ONLINE' | 'READING' | 'LISTENING';
  avatarUrl: string;
  isFriend: boolean;
  pagesCount: number;
  clanTag: string;
  bioFa: string;
  interests: string[];
}

export interface BookChatAttachment {
  kind: 'audio_stream' | 'audio_file' | 'photo_file' | 'page_ref';
  titleFa: string;
  url: string;
  streamUrl?: string;
  roomId?: AudioRoomId;
  format?: string;
  pageNumberFa?: string;
}

export interface BookLetterMessage {
  id: string;
  channelId: string; // 'book-global' | `club-${clubId}` | `dm-${memberId}`
  senderHandle: string;
  senderDisplayNameFa: string;
  senderTag: string;
  text: string;
  timestamp: string;
  isSelf: boolean;
  isPrivateLetter?: boolean;
  attachment?: BookChatAttachment;
}

export interface BookClubEntry {
  id: string;
  authorHandle: string;
  text: string;
  timestamp: string;
  audioTitleFa?: string;
  streamUrl?: string;
  streamFormat?: string;
  roomId?: AudioRoomId;
}

export interface BookLiteraryClub {
  id: string;
  name: string;
  tag: string;
  circleFa: string;
  mottoFa: string;
  focusLabel: string;
  bannerUrl: string;
  founderHandle: string;
  membersCount: number;
  isJoined: boolean;
  entries: BookClubEntry[];
}

export interface AudioBookSocialState {
  activeTab: BookSocialTabId;
  userHandle: string;
  userDisplayNameFa: string;
  userCrewTag: string;
  userExLibrisQuoteFa: string;
  userRep: number;
  posts: BookAudioPost[];
  members: BookAuthorMember[];
  messages: BookLetterMessage[];
  clubs: BookLiteraryClub[];
}

export const BOOK_INK_PRESETS = [
  {
    id: 'bk-moon',
    label: 'طرح قلمی شب و سه‌تار',
    url: '/src/assets/images/book_sketch_philosophy_moon_1795260960578.jpg',
  },
  {
    id: 'bk-cafe',
    label: 'اسکچ پیانو و گرامافون کافه',
    url: '/src/assets/images/book_sketch_cafe_music_1795260960540.jpg',
  },
  {
    id: 'bk-desk',
    label: 'دفتر شعر و دوات شمع',
    url: '/src/assets/images/book_ink_desk_backdrop_1795260959397.jpg',
  },
  {
    id: 'bk-lib',
    label: 'کتابخانه قدیمی و شمع',
    url: '/src/assets/images/room_audio_ac_library_1795254620400.jpg',
  },
];

export function buildInitialAudioBookState(): AudioBookSocialState {
  return {
    activeTab: 'feed',
    userHandle: 'kian_kalem',
    userDisplayNameFa: 'کیانوش راد',
    userCrewTag: 'دیوان',
    userExLibrisQuoteFa: 'در سکوتِ میانِ دو نت، شعر آغاز می‌شود.',
    userRep: 8420,
    posts: [
      {
        id: 'bk-post-1',
        pageNumberFa: 'صفحه ۱۴',
        chapterTitleFa: 'فصلِ تأملات شبانه و نوای تار',
        epigraphPoemFa:
          'هر چه در خاطرهٔ شب به قلم می‌آید، در دلِ ساز به آوازِ رهایی می‌رسد...',
        authorHandle: 'shams_verse',
        authorDisplayNameFa: 'شمس‌آرا تبریزی',
        authorTag: 'غزل',
        avatarUrl: '/src/assets/images/holo_female_commander_1795172646701.jpg',
        roomId: 'ac-library',
        circleFa: 'کتابخانهٔ قدیمی و داستان‌های صوتی',
        audioTitleTag: 'مثنوی شبانه و نوای سه‌تار · ۲۴ دقیقه',
        captionFa:
          'دیشب کنار شمع، فصل سوم «نامه‌هایی به یک دوستِ نادیده» را با همراهی نوای سه‌تار خواندم و ضبط کردم. اگر دلتان آرامش و اندیشه می‌خواهد، این برگه را همراه با صدا بشنوید و حاشیه‌تان را پایین بنویسید.',
        mediaUrl: '/src/assets/images/book_sketch_philosophy_moon_1795260960578.jpg',
        streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        streamFormat: 'HLS',
        telegramChannel: 't.me/divan_audiobooks',
        clubId: 'bk-club-library',
        timestamp: '۱۲ دقیقه پیش',
        likesCount: 284,
        dislikesCount: 2,
        userReaction: null,
        sharesCount: 41,
        sharedByMe: false,
        bookmarkedByMe: true,
        comments: [
          {
            id: 'bk-cm-1',
            authorHandle: 'khayyam_ink',
            authorTag: 'رباعی',
            avatarUrl: '/src/assets/images/holo_max_noir_1795172673547.jpg',
            text: 'آن مکثِ میانِ مصراع دوم و صدای باران، دقیقاً حسِ ورق‌زدن یک دیوان کهنه را زنده می‌کند.',
            timestamp: '۷ دقیقه پیش',
            likesCount: 19,
            likedByMe: false,
          },
        ],
      },
      {
        id: 'bk-post-2',
        pageNumberFa: 'صفحه ۲۷',
        chapterTitleFa: 'یادداشت‌های یک کافه و گرامافونِ بارانی',
        epigraphPoemFa:
          'موسیقی، زبانِ ناگفتهٔ جملاتی‌ست که هیچ جوهری یارای نوشتنِ آن‌ها را نداشت.',
        authorHandle: 'nima_acoustic',
        authorDisplayNameFa: 'نیما سپهر',
        authorTag: 'جز',
        avatarUrl: '/src/assets/images/holo_arthur_gunslinger_1795172673423.jpg',
        roomId: 'westworld-cafe',
        circleFa: 'کافهٔ پیانو، بلوز و خوانشِ کتاب',
        audioTitleTag: 'پیانو و باران کافه · ۸۴ ضرب در دقیقه',
        captionFa:
          'امروز روی میز چوبی کنار پنجره، اتود جدید پیانو و گرامافون را برای ساعت‌های مطالعه و نوشتن ضبط کردم. فایل مستقیم را پیوست کرده‌ام تا هنگام خواندنِ متن‌ها در پس‌زمینه بنوازد.',
        mediaUrl: '/src/assets/images/book_sketch_cafe_music_1795260960540.jpg',
        streamUrl: 'https://t.me/westworld_vinyl_cafe/72',
        streamFormat: 'TELEGRAM',
        telegramChannel: 't.me/westworld_vinyl_cafe',
        clubId: 'bk-club-cafe',
        timestamp: '۳۸ دقیقه پیش',
        likesCount: 219,
        dislikesCount: 1,
        userReaction: null,
        sharesCount: 29,
        sharedByMe: false,
        bookmarkedByMe: false,
        comments: [
          {
            id: 'bk-cm-2',
            authorHandle: 'sophia_philo',
            authorTag: 'فلسفه',
            avatarUrl: '/src/assets/images/holo_female_prime_1795172675312.jpg',
            text: 'در حین ترجمهٔ یادداشت‌های مارکوس اورلیوس گوش دادم؛ گرمای پیانو بی‌نظیر بود.',
            timestamp: '۱۹ دقیقه پیش',
            likesCount: 14,
            likedByMe: false,
          },
        ],
      },
      {
        id: 'bk-post-3',
        pageNumberFa: 'صفحه ۴۲',
        chapterTitleFa: 'گفت‌وگوی فلسفی دربارهٔ زمان و حافظه',
        epigraphPoemFa:
          'ما نه از گذشتنِ ساعت‌ها، بلکه از نشنیدنِ صدای خویش پیر می‌شویم.',
        authorHandle: 'sophia_philo',
        authorDisplayNameFa: 'سوفیا هانا',
        authorTag: 'فلسفه',
        avatarUrl: '/src/assets/images/holo_female_prime_1795172675312.jpg',
        roomId: 'podcast-studio',
        circleFa: 'محفل پادکست و فلسفهٔ زیستن',
        audioTitleTag: 'پادکست دفترِ زمان · اپیزود دوازدهم',
        captionFa:
          'در این شماره از پادکست، دربارهٔ فلسفهٔ «زیستن در لحظهٔ اکنون» نزد خیام و رواقیون گفت‌وگو کرده‌ایم. نظرتان را دربارهٔ پرسشِ پایانی کتاب برایم بنویسید.',
        mediaUrl: '/src/assets/images/book_ink_desk_backdrop_1795260959397.jpg',
        streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        streamFormat: 'HLS',
        telegramChannel: 't.me/philosophy_podcasts_ir',
        clubId: 'bk-club-philo',
        timestamp: '۱ ساعت پیش',
        likesCount: 256,
        dislikesCount: 3,
        userReaction: null,
        sharesCount: 37,
        sharedByMe: false,
        bookmarkedByMe: false,
        comments: [],
      },
    ],
    members: [
      {
        id: 'bm-1',
        handle: 'shams_verse',
        displayNameFa: 'شمس‌آرا تبریزی',
        penNameLabel: 'شاعر و راوی دیوان',
        circleFa: 'محفل شعر کلاسیک و کتاب‌های صوتی',
        cityLocationFa: 'کتابخانهٔ قدیمی · تالار نور',
        philosophyQuoteFa: 'آنجا که کلام بازمی‌ماند، نغمه آغازِ سلوک است.',
        favoriteWorkFa: 'دیوان شمس / شب‌نامه‌های سه‌تار',
        onlineStatus: 'ONLINE',
        avatarUrl: '/src/assets/images/holo_female_commander_1795172646701.jpg',
        isFriend: true,
        pagesCount: 148,
        clanTag: 'غزل',
        bioFa: 'قصه‌ها و غزل‌های کهن را با صدای آرام و سازهای آکوستیک به دفترهای شبانه می‌سپارد.',
        interests: ['غزل و شعر کلاسیک', 'کتاب صوتی', 'سه‌تار و نی'],
      },
      {
        id: 'bm-2',
        handle: 'khayyam_ink',
        displayNameFa: 'خیام نوری',
        penNameLabel: 'نویسنده و فیلسوفِ رباعی',
        circleFa: 'انجمن اندیشه و فلسفهٔ شرق',
        cityLocationFa: 'اتاق مدیتیشن و سکوت',
        philosophyQuoteFa: 'دمی که در دستِ ماست، تنها حقیقتِ هستی‌ست.',
        favoriteWorkFa: 'رباعیات / تأملاتِ بامداد',
        onlineStatus: 'READING',
        avatarUrl: '/src/assets/images/holo_max_noir_1795172673547.jpg',
        isFriend: true,
        pagesCount: 212,
        clanTag: 'رباعی',
        bioFa: 'در حاشیهٔ کتاب‌های فلسفی یادداشت می‌نویسد و پادکست‌های کوتاه دربارهٔ معنای زمان می‌سازد.',
        interests: ['فلسفهٔ هستی', 'رباعیات', 'موسیقی امبینت'],
      },
      {
        id: 'bm-3',
        handle: 'nima_acoustic',
        displayNameFa: 'نیما سپهر',
        penNameLabel: 'نوازندهٔ پیانو و جز کافه',
        circleFa: 'کافهٔ وست‌ورلد و وینیل',
        cityLocationFa: 'میزِ کنارِ پنجره',
        philosophyQuoteFa: 'باران بهترین هم‌نوازِ نت‌های ناتمام است.',
        favoriteWorkFa: 'Nocturnes / Westworld Piano',
        onlineStatus: 'LISTENING',
        avatarUrl: '/src/assets/images/holo_arthur_gunslinger_1795172673423.jpg',
        isFriend: false,
        pagesCount: 94,
        clanTag: 'جز',
        bioFa: 'قطعات پیانو، بلوز و ملودی‌های مناسبِ مطالعه و خلوتِ نیمه‌شب را منتشر می‌کند.',
        interests: ['پیانو نئوکلاسیک', 'جز و بلوز', 'شعر نو'],
      },
      {
        id: 'bm-4',
        handle: 'sophia_philo',
        displayNameFa: 'سوفیا هانا',
        penNameLabel: 'پژوهشگر فلسفه و پادکستر',
        circleFa: 'استودیوی گفت‌وگوی اندیشه',
        cityLocationFa: 'تالار پادکست و مناظره',
        philosophyQuoteFa: 'پرسشِ درست، نیمی از راهِ روشن‌شدنِ ذهن است.',
        favoriteWorkFa: 'تأملات مارکوس اورلیوس / دنیای سوفی',
        onlineStatus: 'ONLINE',
        avatarUrl: '/src/assets/images/holo_female_prime_1795172675312.jpg',
        isFriend: false,
        pagesCount: 176,
        clanTag: 'فلسفه',
        bioFa: 'اپیزودهای هفتگی دربارهٔ فلسفهٔ اخلاق، رواقی‌گری و ادبیات جهان اجرا می‌کند.',
        interests: ['پادکست فلسفی', 'رمان کلاسیک', 'اخلاق و ذهن'],
      },
      {
        id: 'bm-5',
        handle: 'roumi_voice',
        displayNameFa: 'مولانا راوی',
        penNameLabel: 'خوش‌نویس و قصه‌گوی شب',
        circleFa: 'محفل مثنوی و حکایت',
        cityLocationFa: 'دیوان‌خانهٔ ادب',
        philosophyQuoteFa: 'هر چه بگویی و هر چه بنویسی، نشانِ جست‌وجوی توست.',
        favoriteWorkFa: 'داستان‌های صوتی شبانه / نی‌نامه',
        onlineStatus: 'ONLINE',
        avatarUrl: '/src/assets/images/holo_male_elder_1795172645312.jpg',
        isFriend: true,
        pagesCount: 305,
        clanTag: 'دیوان',
        bioFa: 'میزبان شب‌خوانی کتاب‌ها، خوش‌نویسیِ دیجیتال و حلقه‌های گفت‌وگوی ادبی است.',
        interests: ['حکایت و داستان', 'موسیقی سنتی', 'تأملات شبانه'],
      },
    ],
    messages: [
      {
        id: 'bk-msg-1',
        channelId: 'book-global',
        senderHandle: 'khayyam_ink',
        senderDisplayNameFa: 'خیام نوری',
        senderTag: 'رباعی',
        text: 'درود بر هم‌نشینان دفتر امشب. این قطعهٔ ملایم سه‌تار و باران را برای خوانشِ صفحه‌های کتاب پیوست کردم.',
        timestamp: '۲۲:۱۰',
        isSelf: false,
        attachment: {
          kind: 'audio_stream',
          titleFa: 'نغمهٔ شبانه و سه‌تار · صوتی',
          url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          format: 'HLS',
          roomId: 'ac-library',
          pageNumberFa: 'صفحه ۱۴',
        },
      },
      {
        id: 'bk-msg-2',
        channelId: 'club-bk-club-library',
        senderHandle: 'roumi_voice',
        senderDisplayNameFa: 'مولانا راوی',
        senderTag: 'دیوان',
        text: 'امشب ساعت ۲۲ فصل چهارم کتابِ صوتیِ «شب‌های روشن» را با هم در کتابخانه گوش می‌کنیم.',
        timestamp: '۲۱:۵۰',
        isSelf: false,
        isPrivateLetter: false,
      },
      {
        id: 'bk-msg-3',
        channelId: 'dm-bm-1',
        senderHandle: 'shams_verse',
        senderDisplayNameFa: 'شمس‌آرا تبریزی',
        senderTag: 'غزل',
        text: 'کیانوش جان، نسخهٔ خوانشِ تازهٔ «غزل و باران» را برایت به شکلِ نامهٔ خصوصی فرستادم؛ حاشیه‌ات را برایم بنویس.',
        timestamp: '۲۲:۰۴',
        isSelf: false,
        isPrivateLetter: true,
        attachment: {
          kind: 'audio_stream',
          titleFa: 'غزل و باران · خوانشِ کامل با سه‌تار',
          url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          format: 'HLS',
          roomId: 'ac-library',
          pageNumberFa: 'نامهٔ ۱',
        },
      },
    ],
    clubs: [
      {
        id: 'bk-club-library',
        name: 'انجمن کتاب‌های صوتی و دیوان',
        tag: 'دیوان',
        circleFa: 'کتابخانهٔ قدیمی و داستان‌های صوتی',
        mottoFa: 'پاتوق خوانشِ رمان، شعرِ کلاسیک و نوشتن حاشیه‌های فلسفی در کنار صدای آرام.',
        focusLabel: 'کتاب صوتی · شعر کهن · خوانشِ شبانه',
        bannerUrl: '/src/assets/images/book_sketch_philosophy_moon_1795260960578.jpg',
        founderHandle: 'shams_verse',
        membersCount: 196,
        isJoined: true,
        entries: [
          {
            id: 'bk-ent-1',
            authorHandle: 'shams_verse',
            text: 'خوانش امشب: بخش نخستِ دفترِ شمس به همراه نوای آرام سه‌تار و باران.',
            timestamp: '۲۲:۰۰',
            audioTitleFa: 'مثنوی شبانه · لینک مستقیم پخش',
            streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            streamFormat: 'HLS',
            roomId: 'ac-library',
          },
        ],
      },
      {
        id: 'bk-club-cafe',
        name: 'محفل کافه، جَز و شعر نو',
        tag: 'کافه',
        circleFa: 'کافه وست‌ورلد و موسیقی آکوستیک',
        mottoFa: 'جایی برای شنیدنِ پیانوی بارانی، بلوز، شعر معاصر و گپ‌وگفتِ دوستانه سرِ یک فنجان قهوه.',
        focusLabel: 'پیانو و جَز · شعر نو · آرامش مطالعه',
        bannerUrl: '/src/assets/images/book_sketch_cafe_music_1795260960540.jpg',
        founderHandle: 'nima_acoustic',
        membersCount: 158,
        isJoined: false,
        entries: [
          {
            id: 'bk-ent-2',
            authorHandle: 'nima_acoustic',
            text: 'پلی‌لیستِ پیانو و گرامافون ویژهٔ شب‌های نوشتن و کتاب‌خوانی منتشر شد.',
            timestamp: '۲۱:۱۵',
            audioTitleFa: 'اتودِ پیانو در باران',
            streamUrl: 'https://t.me/westworld_vinyl_cafe/72',
            streamFormat: 'TELEGRAM',
            roomId: 'westworld-cafe',
          },
        ],
      },
      {
        id: 'bk-club-philo',
        name: 'حلقهٔ پادکست و فلسفهٔ اندیشه',
        tag: 'فلسفه',
        circleFa: 'استودیوی پادکست و تاملات',
        mottoFa: 'گفت‌وگو دربارهٔ کتاب‌های فلسفی، پادکست‌های عمیق، روایتِ تاریخ و هنرِ زیستن.',
        focusLabel: 'پادکست فلسفی · رواقی‌گری · اندیشه',
        bannerUrl: '/src/assets/images/book_ink_desk_backdrop_1795260959397.jpg',
        founderHandle: 'sophia_philo',
        membersCount: 134,
        isJoined: false,
        entries: [
          {
            id: 'bk-ent-3',
            authorHandle: 'sophia_philo',
            text: 'شمارهٔ تازهٔ پادکست «فلسفه در سکوت» برای بحث اعضای حلقه روی خط آمد.',
            timestamp: '۲۰:۳۰',
            audioTitleFa: 'پادکست دفتر زمان · اپیزود ۱۲',
            streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            streamFormat: 'HLS',
            roomId: 'podcast-studio',
          },
        ],
      },
    ],
  };
}

const STORAGE_KEY = 'aipetros_audio_book_social_v1';

export function loadAudioBookState(): AudioBookSocialState {
  const seed = buildInitialAudioBookState();
  if (typeof window === 'undefined') return seed;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Partial<AudioBookSocialState>;
    if (
      !parsed ||
      !Array.isArray(parsed.posts) ||
      !Array.isArray(parsed.members) ||
      !Array.isArray(parsed.clubs)
    ) {
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

export function saveAudioBookState(state: AudioBookSocialState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota
  }
}

export function toggleBookPostReaction(
  state: AudioBookSocialState,
  postId: string,
  reaction: 'like' | 'dislike'
): AudioBookSocialState {
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
        repDelta = -8;
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
        repDelta = 4;
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

export function toggleBookPostBookmark(
  state: AudioBookSocialState,
  postId: string
): AudioBookSocialState {
  return {
    ...state,
    posts: state.posts.map((p) =>
      p.id === postId ? { ...p, bookmarkedByMe: !p.bookmarkedByMe } : p
    ),
  };
}

export function addBookPostComment(
  state: AudioBookSocialState,
  postId: string,
  text: string
): AudioBookSocialState {
  const clean = text.trim();
  if (!clean) return state;
  const now = new Date();
  const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return {
    ...state,
    userRep: state.userRep + 20,
    posts: state.posts.map((p) =>
      p.id === postId
        ? {
            ...p,
            comments: [
              ...p.comments,
              {
                id: `bk-cm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
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

export function toggleBookCommentLike(
  state: AudioBookSocialState,
  postId: string,
  commentId: string
): AudioBookSocialState {
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

export function shareBookPostToChannel(
  state: AudioBookSocialState,
  postId: string,
  targetChannelId: string
): AudioBookSocialState {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return state;
  const now = new Date();
  const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const isDm = targetChannelId.startsWith('dm-');

  const attachment: BookChatAttachment =
    post.streamUrl || post.audioPreviewUrl
      ? {
          kind: post.streamUrl ? 'audio_stream' : 'audio_file',
          titleFa: post.audioTitleTag || post.chapterTitleFa,
          url: post.streamUrl ?? post.audioPreviewUrl ?? '',
          streamUrl: post.streamUrl ?? post.audioPreviewUrl,
          format: post.streamFormat ?? 'MP3',
          roomId: post.roomId,
          pageNumberFa: post.pageNumberFa,
        }
      : {
          kind: 'page_ref',
          titleFa: `${post.pageNumberFa} · ${post.chapterTitleFa}`,
          url: post.mediaUrl,
          roomId: post.roomId,
          pageNumberFa: post.pageNumberFa,
        };

  const forwardMsg: BookLetterMessage = {
    id: `bk-msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    channelId: targetChannelId,
    senderHandle: state.userHandle,
    senderDisplayNameFa: state.userDisplayNameFa,
    senderTag: state.userCrewTag,
    text: isDm
      ? `این برگه («${post.chapterTitleFa}») و قطعهٔ صوتی‌اش را برایت در نامهٔ خصوصی فرستادم.`
      : `نقل از ${post.pageNumberFa}: «${post.captionFa.slice(0, 90)}»`,
    timestamp,
    isSelf: true,
    isPrivateLetter: isDm,
    attachment,
  };

  return {
    ...state,
    userRep: state.userRep + (isDm ? 35 : 25),
    posts: state.posts.map((p) =>
      p.id === postId ? { ...p, sharesCount: p.sharesCount + 1, sharedByMe: true } : p
    ),
    messages: [...state.messages, forwardMsg].slice(-60),
  };
}

export function createBookFeedPost(
  state: AudioBookSocialState,
  input: {
    chapterTitleFa: string;
    epigraphPoemFa?: string;
    captionFa: string;
    audioTitleTag: string;
    roomId: AudioRoomId;
    mediaUrl: string;
    audioPreviewUrl?: string;
    streamUrl?: string;
    telegramChannel?: string;
  }
): { ok: boolean; error?: string; state: AudioBookSocialState } {
  const cleanCaption = input.captionFa.trim();
  if (!cleanCaption) {
    return { ok: false, error: 'متن دل‌نوشته، شعر یا معرفی خود را بنویسید.', state };
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
  } else if (input.audioPreviewUrl) {
    validatedUrl = input.audioPreviewUrl;
    formatLabel = 'AUDIO';
  }

  const nextPageNum = 43 + state.posts.length * 3;
  const newPost: BookAudioPost = {
    id: `bk-post-${Date.now()}`,
    pageNumberFa: `صفحه ${nextPageNum}`,
    chapterTitleFa: input.chapterTitleFa.trim() || 'برگهٔ تازهٔ دفتر',
    epigraphPoemFa: input.epigraphPoemFa?.trim() || undefined,
    authorHandle: state.userHandle,
    authorDisplayNameFa: state.userDisplayNameFa,
    authorTag: state.userCrewTag,
    avatarUrl: '/src/assets/images/athlete_avatar_1794943635940.jpg',
    roomId: input.roomId,
    circleFa: 'دفتر شعر، موسیقی و فلسفه',
    audioTitleTag: input.audioTitleTag.trim() || 'قطعهٔ صوتی و نغمهٔ همراه',
    captionFa: cleanCaption,
    mediaUrl: input.mediaUrl,
    audioPreviewUrl: input.audioPreviewUrl,
    streamUrl: validatedUrl || undefined,
    streamFormat: formatLabel || undefined,
    telegramChannel: input.telegramChannel?.trim() || undefined,
    timestamp: 'هم‌اکنون',
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
      userRep: state.userRep + 100,
      posts: [newPost, ...state.posts],
    },
  };
}

export function toggleBookFriendConnection(
  state: AudioBookSocialState,
  memberId: string
): AudioBookSocialState {
  let repDelta = 0;
  const members = state.members.map((m) => {
    if (m.id !== memberId) return m;
    const nextFriend = !m.isFriend;
    repDelta = nextFriend ? 45 : -45;
    return { ...m, isFriend: nextFriend };
  });
  return {
    ...state,
    userRep: Math.max(0, state.userRep + repDelta),
    members,
  };
}

export function appendBookChatMessage(
  state: AudioBookSocialState,
  input: {
    channelId: string;
    text: string;
    isPrivateLetter?: boolean;
    attachment?: BookChatAttachment;
  }
): { ok: boolean; error?: string; state: AudioBookSocialState } {
  const cleanText = input.text.trim();
  if (!cleanText && !input.attachment) {
    return { ok: false, error: 'سطری بنویسید یا فایل صوتی / لینک پیوست کنید.', state };
  }

  let safeAttachment = input.attachment;
  if (safeAttachment?.kind === 'audio_stream' && safeAttachment.url) {
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

  const msg: BookLetterMessage = {
    id: `bk-msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    channelId: input.channelId,
    senderHandle: state.userHandle,
    senderDisplayNameFa: state.userDisplayNameFa,
    senderTag: state.userCrewTag,
    text: cleanText || `پیوست صوتی: ${safeAttachment?.titleFa ?? 'برگهٔ صدا'}`,
    timestamp,
    isSelf: true,
    isPrivateLetter: input.isPrivateLetter ?? input.channelId.startsWith('dm-'),
    attachment: safeAttachment,
  };

  return {
    ok: true,
    state: {
      ...state,
      userRep: state.userRep + (msg.attachment ? 30 : 12),
      messages: [...state.messages, msg].slice(-60),
    },
  };
}

export function buildBookAuthorAutoReply(
  state: AudioBookSocialState,
  userMessage: string,
  channelId: string,
  hadAudioAttachment: boolean
): BookLetterMessage {
  const target =
    state.members.find((m) => channelId === `dm-${m.id}`) ?? state.members[0];
  const now = new Date();
  const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const lower = userMessage.toLowerCase();
  const firstName = state.userDisplayNameFa.split(' ')[0];

  let replyText = '';
  if (hadAudioAttachment) {
    replyText = `سپاس ${firstName} جان؛ این نغمه و فایل صوتی کنار دفترِ من باز شد و الان در سکوت شب به آن گوش می‌سپارم.`;
  } else if (channelId.startsWith('dm-')) {
    replyText = `نامه‌ات به دستم رسید ${firstName} عزیز. در حاشیهٔ «${target.favoriteWorkFa}» می‌نویسم؛ هر شعر، کتاب صوتی یا قطعه‌ای دوست داشتی برایم بفرست.`;
  } else if (lower.includes('شعر') || lower.includes('کتاب') || lower.includes('فلسفه')) {
    replyText = `چه پرسشِ زیبایی! به قول خیام، قدرِ این لحظهٔ گفت‌وگو را با نوای آرام و خوانشِ یک برگ تازه پاس بداریم.`;
  } else {
    replyText = `دریافت شد ${firstName} جان — در ${target.circleFa} همراه با سایر دوستان آمادهٔ هم‌نشینی هستیم.`;
  }

  return {
    id: `bk-rep-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    channelId,
    senderHandle: target.handle,
    senderDisplayNameFa: target.displayNameFa,
    senderTag: target.clanTag,
    text: replyText,
    timestamp,
    isSelf: false,
    isPrivateLetter: channelId.startsWith('dm-'),
  };
}

export function toggleBookClubMembership(
  state: AudioBookSocialState,
  clubId: string
): AudioBookSocialState {
  let repDelta = 0;
  let nextTag = state.userCrewTag;
  const clubs = state.clubs.map((club) => {
    if (club.id !== clubId) return club;
    const nextJoined = !club.isJoined;
    if (nextJoined) {
      repDelta = 100;
      nextTag = club.tag;
    } else {
      repDelta = -35;
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

export function createBookLiteraryClub(
  state: AudioBookSocialState,
  input: {
    name: string;
    tag: string;
    mottoFa?: string;
  }
): AudioBookSocialState {
  const cleanName = input.name.trim();
  const cleanTag = input.tag.trim().slice(0, 8) || 'دیوان';
  if (cleanName.length < 2) return state;

  const newClub: BookLiteraryClub = {
    id: `bk-club-${Date.now()}`,
    name: cleanName,
    tag: cleanTag,
    circleFa: 'محفل تازهٔ کتاب، شعر و موسیقی',
    mottoFa:
      input.mottoFa?.trim() ||
      'دورهمی آرام برای خواندن شعر، شنیدن کتاب صوتی و گفت‌وگوی فلسفی.',
    focusLabel: 'شعر · فلسفه · موسیقی آکوستیک',
    bannerUrl: '/src/assets/images/book_ink_desk_backdrop_1795260959397.jpg',
    founderHandle: state.userHandle,
    membersCount: 1,
    isJoined: true,
    entries: [
      {
        id: `bk-ent-${Date.now()}`,
        authorHandle: state.userHandle,
        text: `این محفل به قلمِ ${state.userDisplayNameFa} گشوده شد؛ خوش آمدید.`,
        timestamp: 'هم‌اکنون',
      },
    ],
  };

  return {
    ...state,
    userCrewTag: cleanTag,
    userRep: state.userRep + 200,
    clubs: [newClub, ...state.clubs],
  };
}

export function postBookClubEntry(
  state: AudioBookSocialState,
  clubId: string,
  input: {
    text: string;
    audioTitleFa?: string;
    streamUrl?: string;
    roomId?: AudioRoomId;
  }
): { ok: boolean; error?: string; state: AudioBookSocialState } {
  const clean = input.text.trim();
  if (!clean && !input.streamUrl?.trim()) {
    return { ok: false, error: 'سطری بنویسید یا لینک قطعهٔ صوتی محفل را وارد کنید.', state };
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

  const entry: BookClubEntry = {
    id: `bk-ent-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    authorHandle: state.userHandle,
    text: clean || `قطعهٔ صوتی جدید برای محفل: ${input.audioTitleFa || 'نغمهٔ آرام'}`,
    timestamp,
    audioTitleFa: input.audioTitleFa?.trim() || (validatedUrl ? 'قطعهٔ صوتی محفل' : undefined),
    streamUrl: validatedUrl || undefined,
    streamFormat: formatLabel || undefined,
    roomId: input.roomId ?? 'ac-library',
  };

  const clubMsg: BookLetterMessage = {
    id: `bk-msg-club-${Date.now()}`,
    channelId: `club-${clubId}`,
    senderHandle: state.userHandle,
    senderDisplayNameFa: state.userDisplayNameFa,
    senderTag: state.userCrewTag,
    text: entry.text,
    timestamp,
    isSelf: true,
    attachment: validatedUrl
      ? {
          kind: 'audio_stream',
          titleFa: entry.audioTitleFa || 'صوت محفل',
          url: validatedUrl,
          streamUrl: validatedUrl,
          format: formatLabel,
          roomId: entry.roomId,
        }
      : undefined,
  };

  return {
    ok: true,
    state: {
      ...state,
      userRep: state.userRep + 50,
      clubs: state.clubs.map((c) =>
        c.id === clubId ? { ...c, entries: [entry, ...c.entries] } : c
      ),
      messages: [...state.messages, clubMsg].slice(-60),
    },
  };
}

export function toAudioStreamPost(input: {
  id: string;
  roomId: AudioRoomId;
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
    hub: 'audio',
    roomId: input.roomId,
    titleFa: input.titleFa,
    captionFa: input.captionFa,
    streamUrl: input.streamUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    streamFormat: (input.streamFormat as UndergroundStreamPost['streamFormat']) ?? 'HLS',
    authorHandle: input.authorHandle,
    authorTelegramChannel: input.telegramChannel ?? 't.me/divan_audiobooks',
    personaBadge: input.authorTag,
    personaAccentHex: '#9A6B22',
    likesCount: input.likesCount ?? 1,
    likedByMe: false,
    createdOrder: 1,
    timestampLabel: input.timestampLabel ?? 'هم‌اکنون',
    comments: [],
  };
}
