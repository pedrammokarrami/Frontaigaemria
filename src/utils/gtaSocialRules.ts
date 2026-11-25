import type { RealmId } from '../types/spatial';

export type GtaSocialTabId = 'feed' | 'chat' | 'friends' | 'clubs' | 'teammates' | 'rivalry';

export interface GtaSocialBackgroundConfig {
  tabId: GtaSocialTabId;
  tabNum: string;
  labelFa: string;
  labelEn: string;
  districtTag: string;
  characterName: string;
  characterTitleFa: string;
  accentHex: string;
  secondaryHex: string;
  ue5BackdropUrl: string;
}

export interface GtaPostComment {
  id: string;
  authorHandle: string;
  authorTag: string;
  avatarUrl: string;
  text: string;
  timestamp: string;
  likesCount: number;
  likedByMe: boolean;
}

export interface GtaSocialPost {
  id: string;
  authorHandle: string;
  authorDisplayNameFa: string;
  authorTag: string;
  avatarUrl: string;
  districtFa: string;
  gameTag: string;
  captionFa: string;
  mediaUrl: string;
  timestamp: string;
  likesCount: number;
  dislikesCount: number;
  userReaction: 'like' | 'dislike' | null;
  sharesCount: number;
  sharedByMe: boolean;
  comments: GtaPostComment[];
}

export interface GtaClubAnnouncement {
  id: string;
  authorHandle: string;
  text: string;
  timestamp: string;
}

export interface GtaClub {
  id: string;
  name: string;
  tag: string;
  districtFa: string;
  mottoFa: string;
  gameFocus: string;
  bannerUrl: string;
  accentHex: string;
  bossHandle: string;
  membersCount: number;
  turfRank: number;
  repTotal: number;
  isJoined: boolean;
  announcements: GtaClubAnnouncement[];
}

export interface GtaFanClubPost {
  id: string;
  authorHandle: string;
  text: string;
  timestamp: string;
}

export interface GtaGamerProfile {
  id: string;
  handle: string;
  displayNameFa: string;
  realm: RealmId;
  favoriteGame: string;
  rankLabel: string;
  cityDistrict: string;
  dnaMatchPct: number;
  playStyleFa: string;
  micReady: boolean;
  onlineStatus: 'ONLINE' | 'IN MATCH' | 'CREW LOBBY';
  avatarUrl: string;
  isFriend: boolean;
  repScore: number;
  clanTag?: string;
  richPresenceFa?: string;
  kdOrWinRate?: string;
  mainGames?: string[];
  winsCount?: number;
  lossesCount?: number;
  championshipsCount?: number;
  winRatePct?: number;
  seasonBadgeFa?: string;
  fanClubTitleFa?: string;
  fanClubMembersCount?: number;
  fanClubPosts?: GtaFanClubPost[];
}

export interface GtaHighlightClip {
  id: string;
  authorHandle: string;
  authorTag: string;
  avatarUrl: string;
  gameTag: string;
  captionFa: string;
  thumbnailUrl: string;
  videoUrl?: string;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  timestamp: string;
}

export interface GtaChatMessage {
  id: string;
  channelId: string;
  senderHandle: string;
  senderTag: string;
  text: string;
  timestamp: string;
  isSelf?: boolean;
  accentHex?: string;
}

export interface GtaSquadLobby {
  id: string;
  titleFa: string;
  gameTitle: string;
  realm: RealmId;
  hostHandle: string;
  districtTag: string;
  neededRoleFa: string;
  slotsTotal: number;
  members: string[];
  micRequired: boolean;
  minDnaPct: number;
  stakeOrReward: string;
  requiredRank?: string;
  leaderAvatarUrl?: string;
}

export interface GtaLeaderboardEntry {
  id: string;
  rank: number;
  handle: string;
  displayNameFa: string;
  clanTag: string;
  avatarUrl: string;
  repScore: number;
  winStreak: number;
  isCurrentUser?: boolean;
}

export interface GtaWeeklyTournament {
  id: string;
  titleFa: string;
  gameTitle: string;
  countdownText: string;
  prizePoolFa: string;
  formatLabel: string;
  teamsRegistered: number;
  maxTeams: number;
  isRegistered: boolean;
}

export interface GtaScrimChallenge {
  id: string;
  mode: '1v1' | '5v5';
  gameTitle: string;
  challengerHandle: string;
  targetClanOrHandle: string;
  stakeRep: number;
  noteFa: string;
  statusText: string;
}

export interface GtaRivalryBattle {
  id: string;
  titleFa: string;
  gameTitle: string;
  realm: RealmId;
  turfZone: string;
  factionA: {
    id: string;
    name: string;
    tag: string;
    colorHex: string;
    hypePoints: number;
    fansCount: number;
    championHandle: string;
  };
  factionB: {
    id: string;
    name: string;
    tag: string;
    colorHex: string;
    hypePoints: number;
    fansCount: number;
    championHandle: string;
  };
  userBackedFactionId: string | null;
  recentChants: Array<{
    id: string;
    handle: string;
    factionTag: string;
    text: string;
  }>;
}

export type LivePredictionMarketId = 'match_winner' | 'round_mvp' | 'total_rounds';

export interface LiveArenaContender {
  id: 'nima' | 'parsa';
  handle: string;
  displayNameFa: string;
  avatarUrl: string;
  kdText: string;
  kdRatioText: string;
  score: number;
  winChancePct: number;
  multiplier: number;
  roundResults: Array<'win' | 'loss'>;
}

export interface LiveArenaPredictionRecord {
  id: string;
  market: LivePredictionMarketId;
  contenderHandle: string;
  stakeRep: number;
  potentialPayoutRep: number;
  timestamp: string;
}

export interface LiveArenaPredictionState {
  tournamentTitleFa: string;
  mapLabelFa: string;
  viewersCount: number;
  totalPoolRep: number;
  activeMarket: LivePredictionMarketId;
  selectedContenderId: 'nima' | 'parsa';
  selectedStakeRep: number;
  contenders: {
    nima: LiveArenaContender;
    parsa: LiveArenaContender;
  };
  recentPredictions: LiveArenaPredictionRecord[];
}

export interface GtaSocialState {
  activeTab: GtaSocialTabId;
  userHandle: string;
  userCrewTag: string;
  userStreetRep: number;
  gamers: GtaGamerProfile[];
  messages: GtaChatMessage[];
  posts?: GtaSocialPost[];
  clubs?: GtaClub[];
  highlightClips?: GtaHighlightClip[];
  squads: GtaSquadLobby[];
  rivalries: GtaRivalryBattle[];
  leaderboard?: GtaLeaderboardEntry[];
  tournaments?: GtaWeeklyTournament[];
  challenges?: GtaScrimChallenge[];
  liveArena?: LiveArenaPredictionState;
}

export const GTA_SOCIAL_BACKGROUNDS: Record<GtaSocialTabId, GtaSocialBackgroundConfig> = {
  feed: {
    tabId: 'feed',
    tabNum: '01',
    labelFa: 'فید و پست‌ها',
    labelEn: 'LEONIDA SOCIAL FEED',
    districtTag: 'OCEAN DRIVE · VICE CITY',
    characterName: 'LUCIA & JASON VIBES',
    characterTitleFa: 'شبکه اجتماعی وایس‌سیتی · پست‌ها، واکنش‌ها و اشتراک‌گذاری',
    accentHex: '#FF3B8B',
    secondaryHex: '#FF944D',
    ue5BackdropUrl: '/src/assets/images/gta6_vice_sunset_backdrop_1795183788003.jpg',
  },
  friends: {
    tabId: 'friends',
    tabNum: '03',
    labelFa: 'دوستان و ادد',
    labelEn: 'VICE CITY FRIEND RADAR',
    districtTag: 'OCEAN DRIVE · CAR MEET',
    characterName: 'MARCUS "VORTEX" VANCE',
    characterTitleFa: 'لیدر کلاب وایس‌سیتی · جستجو و ادد دوستان',
    accentHex: '#FF3B8B',
    secondaryHex: '#38E8FF',
    ue5BackdropUrl: '/src/assets/images/gta6_vice_sunset_backdrop_1795183788003.jpg',
  },
  chat: {
    tabId: 'chat',
    tabNum: '02',
    labelFa: 'چت زنده و دایرکت',
    labelEn: 'SOCIAL CLUB LIVE COMMS',
    districtTag: 'VICE NEON BOULEVARD · COMMS',
    characterName: 'MARCUS "VORTEX" VANCE',
    characterTitleFa: 'شبکه ارتباط زنده گیمرها و چت خصوصی',
    accentHex: '#38E8FF',
    secondaryHex: '#FF3B8B',
    ue5BackdropUrl: '/src/assets/images/gta6_vice_sunset_backdrop_1795183788003.jpg',
  },
  clubs: {
    tabId: 'clubs',
    tabNum: '04',
    labelFa: 'کلاب‌های وایس‌سیتی',
    labelEn: 'VICE CITY CREWS & CLUBS',
    districtTag: 'STARFISH PENTHOUSE · CREW HQ',
    characterName: 'DANTE "APEX" MOREAU',
    characterTitleFa: 'ساخت کلاب، مدیریت اعضا و جنگ قلمرو وایس‌سیتی',
    accentHex: '#FF944D',
    secondaryHex: '#FF3B8B',
    ue5BackdropUrl: '/src/assets/images/gta6_club_penthouse_hq_1795183788895.jpg',
  },
  teammates: {
    tabId: 'teammates',
    tabNum: '05',
    labelFa: 'اسکواد و هم‌تیمی',
    labelEn: 'HEIST & SQUAD LFG LOUNGE',
    districtTag: 'ECLIPSE PENTHOUSE · CREW HQ',
    characterName: 'DANTE "APEX" MOREAU',
    characterTitleFa: 'فرمانده اسکواد و هایست · جذب هم‌تیمی پرو',
    accentHex: '#38E8FF',
    secondaryHex: '#FF944D',
    ue5BackdropUrl: '/src/assets/images/ue5_gta_crew_lounge_1795036739783.jpg',
  },
  rivalry: {
    tabId: 'rivalry',
    tabNum: '06',
    labelFa: 'رقابت و طرفداری',
    labelEn: 'TURF WARS & FANDOM ARENA',
    districtTag: 'MIDNIGHT TURF · SHOWDOWN',
    characterName: 'JAX "REDLINE" THORNE',
    characterTitleFa: 'آرنای کری‌خوانی، طرفداری و جنگ قلمرو کلاب‌ها',
    accentHex: '#FF3B8B',
    secondaryHex: '#FF944D',
    ue5BackdropUrl: '/src/assets/images/ue5_gta_turf_rivalry_1795036740687.jpg',
  },
};

export const INITIAL_GTA_SOCIAL_STATE: GtaSocialState = {
  activeTab: 'feed',
  userHandle: 'Vortex_IR',
  userCrewTag: 'VICE',
  userStreetRep: 9480,
  posts: [
    {
      id: 'post-vice-1',
      authorHandle: 'tara_outlaw',
      authorDisplayNameFa: 'تارا · فرمانده هایست وایس‌سیتی',
      authorTag: 'VICE',
      avatarUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
      districtFa: 'بلوار اوشن درایو · غروب وایس‌سیتی',
      gameTag: 'GTA VI Online',
      captionFa:
        'امشب با کوپه تیونینگ‌شده کل بلوار اوشن درایو رو دریفت کشیدیم! پلیس ۵ ستاره افتاد دنبالمون ولی اسکواد کلاب [VICE] تو ۲ دقیقه گمشون کرد. کی پایه میتینگ امشبه؟',
      mediaUrl: '/src/assets/images/gta6_post_ocean_drift_1795183788123.jpg',
      timestamp: '۶ دقیقه پیش',
      likesCount: 284,
      dislikesCount: 7,
      userReaction: null,
      sharesCount: 41,
      sharedByMe: false,
      comments: [
        {
          id: 'cm-101',
          authorHandle: 'parsa_vice27',
          authorTag: 'FC27',
          avatarUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
          text: 'رنگ بنفش متالیک زیر نور غروب اوشن درایو دیوانه‌کننده‌ست! ساعت ۲۳ میام میتینگ.',
          timestamp: '۴ دقیقه پیش',
          likesCount: 19,
          likedByMe: false,
        },
        {
          id: 'cm-102',
          authorHandle: 'nima_headshot',
          authorTag: 'SAS',
          avatarUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
          text: 'فقط یادتون باشه اسکواد ما از سمت بندر لئونیدا میاد، جاده ساحلی رو باز نگه دارید!',
          timestamp: '۲ دقیقه پیش',
          likesCount: 11,
          likedByMe: false,
        },
      ],
    },
    {
      id: 'post-vice-2',
      authorHandle: 'parsa_vice27',
      authorDisplayNameFa: 'پارسا · کاپیتان کلاب وایس',
      authorTag: 'FC27',
      avatarUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
      districtFa: 'مارینای لئونیدا کیز',
      gameTag: 'Leonida Marina Club',
      captionFa:
        'بعد از برد ۵-۱ امشب، کل تیم رو آوردیم مارینای لئونیدا کیز روی قایق تندرو GT-77. هر کی تو کلاب عضو باشه آخر هفته تورنمنت جایزه‌دار داریم!',
      mediaUrl: '/src/assets/images/gta6_post_yacht_party_1795183787708.jpg',
      timestamp: '۲۲ دقیقه پیش',
      likesCount: 196,
      dislikesCount: 4,
      userReaction: null,
      sharesCount: 29,
      sharedByMe: false,
      comments: [
        {
          id: 'cm-201',
          authorHandle: 'artin_roshan',
          authorTag: 'AGZ',
          avatarUrl: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
          text: 'ایول پارسا! اسم تیم ما رو هم برای تورنمنت مارینا ثبت کن.',
          timestamp: '۱۵ دقیقه پیش',
          likesCount: 8,
          likedByMe: false,
        },
      ],
    },
    {
      id: 'post-vice-3',
      authorHandle: 'nima_headshot',
      authorDisplayNameFa: 'نیما · اسنایپر سندیکا',
      authorTag: 'SAS',
      avatarUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
      districtFa: 'پنت‌هاوس استارفیش · مقر کلاب',
      gameTag: 'Crew Heist HQ',
      captionFa:
        'جلسه هماهنگی هایست بزرگ بانک مرکزی روی تراس پنت‌هاوس استارفیش. ۲ نفر راننده و هکر حرفه‌ای برای کلاب می‌خوایم — درخواست ادد یا عضویت کلاب بدید.',
      mediaUrl: '/src/assets/images/gta6_club_penthouse_hq_1795183788895.jpg',
      timestamp: '۴۸ دقیقه پیش',
      likesCount: 342,
      dislikesCount: 12,
      userReaction: null,
      sharesCount: 54,
      sharedByMe: false,
      comments: [
        {
          id: 'cm-301',
          authorHandle: 'tara_outlaw',
          authorTag: 'VICE',
          avatarUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
          text: 'راننده فرار با من! فقط مسیر خروجی بزرگراه جنوبی رو تمیز کنید.',
          timestamp: '۳۵ دقیقه پیش',
          likesCount: 24,
          likedByMe: false,
        },
      ],
    },
  ],
  clubs: [
    {
      id: 'club-vice',
      name: 'Vice City Outlaws',
      tag: 'VICE',
      districtFa: 'اوشن درایو · پنت‌هاوس استارفیش',
      mottoFa: 'پادشاهی شب‌های وایس‌سیتی، هایست‌های بی‌نقص و میتینگ‌های سرعت.',
      gameFocus: 'GTA VI · FC 27 · CS2',
      bannerUrl: '/src/assets/images/gta6_club_penthouse_hq_1795183788895.jpg',
      accentHex: '#FF3B8B',
      bossHandle: 'tara_outlaw',
      membersCount: 128,
      turfRank: 1,
      repTotal: 148200,
      isJoined: true,
      announcements: [
        {
          id: 'ann-1',
          authorHandle: 'tara_outlaw',
          text: 'میتینگ ماشین‌های کلاسیک امشب ساعت ۲۳ جلوی هتل کلونی در اوشن درایو برگزار می‌شود.',
          timestamp: '۲۲:۱۰',
        },
        {
          id: 'ann-2',
          authorHandle: 'parsa_vice27',
          text: 'تمام اعضای کلاب [VICE] برای تورنمنت آخر هفته ۵۰۰ امتیاز REP هدیه می‌گیرند.',
          timestamp: '۲۱:۴۵',
        },
      ],
    },
    {
      id: 'club-odc',
      name: 'Ocean Drive Cartel',
      tag: 'ODC',
      districtFa: 'بندر لئونیدا کیز',
      mottoFa: 'کلاب اختصاصی مسابقات خیابانی، قایق‌های سرعتی و شرط‌بندی قلمرو.',
      gameFocus: 'GTA VI Racing · Street Drift',
      bannerUrl: '/src/assets/images/gta6_post_ocean_drift_1795183788123.jpg',
      accentHex: '#FF944D',
      bossHandle: 'parsa_vice27',
      membersCount: 94,
      turfRank: 2,
      repTotal: 119400,
      isJoined: false,
      announcements: [
        {
          id: 'ann-3',
          authorHandle: 'parsa_vice27',
          text: 'تست رکورد پیست ساحلی امشب باز است — زیر ۱:۴۲ بزنید وارد اسکواد اصلی می‌شوید.',
          timestamp: '۲۲:۰۰',
        },
      ],
    },
    {
      id: 'club-lds',
      name: 'Leonida Marina Syndicate',
      tag: 'LMS',
      districtFa: 'اسکله کی کلاب · لئونیدا',
      mottoFa: 'اتحاد گیمرهای پرو برای هایست‌های دریایی و اسکریم‌های شبانه.',
      gameFocus: 'GTA VI · CS2 · Valorant',
      bannerUrl: '/src/assets/images/gta6_post_yacht_party_1795183787708.jpg',
      accentHex: '#38E8FF',
      bossHandle: 'nima_headshot',
      membersCount: 76,
      turfRank: 3,
      repTotal: 96800,
      isJoined: false,
      announcements: [
        {
          id: 'ann-4',
          authorHandle: 'nima_headshot',
          text: 'اسکریم ۵ به ۵ امشب مقابل کارتل اوشن درایو — همه با میکروفون حاضر باشند.',
          timestamp: '۲۰:۳۰',
        },
      ],
    },
  ],
  gamers: [
    {
      id: 'g-1',
      handle: 'parsa_vice27',
      displayNameFa: 'پارسا · مهاجم تکنیکی FC27',
      realm: 'sports',
      favoriteGame: 'EA SPORTS FC 27 · Pro Clubs',
      rankLabel: 'Elite Division · SR 2240',
      cityDistrict: 'Vice Beach · Server EU/ME',
      dnaMatchPct: 98,
      playStyleFa: 'پاسکاری تک‌ضرب، فرار پشت دفاع و Trivela سبز',
      micReady: true,
      onlineStatus: 'ONLINE',
      avatarUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
      isFriend: false,
      repScore: 10850,
      clanTag: 'FC27',
      richPresenceFa: 'آنلاین در وایس‌سیتی · لابی کلاب',
      kdOrWinRate: '76% Win Rate · 2.4 Goals/Match',
      mainGames: ['EA SPORTS FC 27', 'GTA Online', 'Rocket League'],
      winsCount: 128,
      lossesCount: 34,
      championshipsCount: 5,
      winRatePct: 79,
      seasonBadgeFa: 'قهرمان فصل',
      fanClubTitleFa: 'کلوپ هواداران پارسا',
      fanClubMembersCount: 980,
      fanClubPosts: [
        {
          id: 'fc-p1',
          authorHandle: 'parsa_vice27',
          text: 'بچه‌های کلوپ، امشب ساعت ۲۳ ترکیب ۴-۲-۳-۱ رو در فینال جام پایتخت تست می‌کنیم!',
          timestamp: '22:15',
        },
        {
          id: 'fc-p2',
          authorHandle: 'nima_headshot',
          text: 'پاس‌های Trivela پارسا توی کل سرور رقیب نداره!',
          timestamp: '22:20',
        },
      ],
    },
    {
      id: 'g-2',
      handle: 'nima_headshot',
      displayNameFa: 'نیما · اسنایپر و خط‌شکن میراژ',
      realm: 'shooter',
      favoriteGame: 'CS2 Premier & Warzone',
      rankLabel: 'FACEIT Lvl 10 · 2,710 ELO',
      cityDistrict: 'Los Santos Downtown · 18ms',
      dnaMatchPct: 95,
      playStyleFa: 'کانتر-استریف ۶۵ میلی‌ثانیه و فلش Pop برای ورود به سایت',
      micReady: true,
      onlineStatus: 'ONLINE',
      avatarUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
      isFriend: true,
      repScore: 9200,
      clanTag: 'SAS',
      richPresenceFa: 'در حال بازی CS2 · اسکریم میراژ',
      kdOrWinRate: '1.65 K/D · 64% Headshot',
      mainGames: ['CS2 Premier', 'Valorant', 'Call of Duty MW3'],
      winsCount: 142,
      lossesCount: 28,
      championshipsCount: 7,
      winRatePct: 82,
      seasonBadgeFa: 'قهرمان فصل',
      fanClubTitleFa: 'کلوپ هواداران نیما',
      fanClubMembersCount: 1240,
      fanClubPosts: [
        {
          id: 'fc-n1',
          authorHandle: 'nima_headshot',
          text: 'دم همه ۱۲۴۰ عضو کلوپ گرم! امشب نقشه Mirage رو با اسنایپ قفل می‌کنیم.',
          timestamp: '22:30',
        },
        {
          id: 'fc-n2',
          authorHandle: 'tara_outlaw',
          text: 'نیما توی فینال BO3 جام پایتخت ۶۴٪ شانس برد داره، همه حمایت کنین!',
          timestamp: '22:36',
        },
      ],
    },
    {
      id: 'g-3',
      handle: 'artin_roshan',
      displayNameFa: 'آرتین · کاپیتان درفت و ماکرو',
      realm: 'strategy',
      favoriteGame: 'Dota 2 & Chess Blitz',
      rankLabel: 'Immortal #340 · 2310 Blitz',
      cityDistrict: 'Eclipse Tower · High Ground',
      dnaMatchPct: 93,
      playStyleFa: 'اسموک تایمینگ روشان و کنترل واردهای مثلث طلایی',
      micReady: true,
      onlineStatus: 'ONLINE',
      avatarUrl: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
      isFriend: false,
      repScore: 8790,
      clanTag: 'AGZ',
      richPresenceFa: 'آنلاین در وایس‌سیتی · تحلیل درفت',
      kdOrWinRate: '69% Win Rate · +4.2 Macro Tempo',
      mainGames: ['Dota 2', 'Chess Blitz', 'Valorant'],
      winsCount: 114,
      lossesCount: 41,
      championshipsCount: 4,
      winRatePct: 74,
      seasonBadgeFa: 'استراتژیست فصل',
      fanClubTitleFa: 'کلوپ هواداران آرتین',
      fanClubMembersCount: 810,
      fanClubPosts: [
        {
          id: 'fc-a1',
          authorHandle: 'artin_roshan',
          text: 'تحلیل کامل درفت فینال امشب رو داخل کلوپ گذاشتم.',
          timestamp: '21:55',
        },
      ],
    },
    {
      id: 'g-4',
      handle: 'tara_outlaw',
      displayNameFa: 'تارا · شکارچی بانتی و هایست GTA/RDR2',
      realm: 'story',
      favoriteGame: 'GTA VI Online & RDR2 Posse',
      rankLabel: 'Kingpin Rank 412 · High Honor',
      cityDistrict: 'Ocean Drive Penthouse',
      dnaMatchPct: 96,
      playStyleFa: 'فرماندهی هایست بدون لو رفتن و رانندگی حرفه‌ای در تعقیب و گریز',
      micReady: true,
      onlineStatus: 'IN MATCH',
      avatarUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
      isFriend: false,
      repScore: 8420,
      clanTag: 'VICE',
      richPresenceFa: 'در حال بازی GTA Online · هایست شبانه',
      kdOrWinRate: '94% Heist Stealth · S+ Driver',
      mainGames: ['GTA Online', 'Red Dead Online', 'EA SPORTS FC 27'],
      winsCount: 96,
      lossesCount: 19,
      championshipsCount: 6,
      winRatePct: 83,
      seasonBadgeFa: 'قهرمان فصل',
      fanClubTitleFa: 'کلوپ هواداران تارا',
      fanClubMembersCount: 1120,
      fanClubPosts: [
        {
          id: 'fc-t1',
          authorHandle: 'tara_outlaw',
          text: 'هایست Ocean Drive امشب بدون حتی یک آلارم تموم شد!',
          timestamp: '22:18',
        },
      ],
    },
  ],
  messages: [
    {
      id: 'msg-1',
      channelId: 'global-vice',
      senderHandle: 'nima_headshot',
      senderTag: 'SAS',
      text: 'بچه‌ها امشب ساعت ۱۱ تورنمنت Mirage و Pro Clubs داریم، کسی پایه اسکواد ۵ نفره هست؟',
      timestamp: '22:41',
      accentHex: '#22D3EE',
    },
    {
      id: 'msg-2',
      channelId: 'global-vice',
      senderHandle: 'parsa_vice27',
      senderTag: 'FC27',
      text: 'من روی CAM آماده‌ام! ترفند L1+Triangle که ایجنت ADK داد رو تست کردم ۳ تا پاس گل دادم.',
      timestamp: '22:42',
      accentHex: '#22D3EE',
    },
    {
      id: 'msg-3',
      channelId: 'global-vice',
      senderHandle: 'tara_outlaw',
      senderTag: 'VICE',
      text: 'کلاب Vice City الان توی جدول طرفداری جلو افتاده، هایپ رو ببرید بالا!',
      timestamp: '22:44',
      accentHex: '#EC4899',
    },
  ],
  highlightClips: [
    {
      id: 'clip-1',
      authorHandle: 'parsa_vice27',
      authorTag: 'FC27',
      avatarUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
      gameTag: 'EA SPORTS FC 27',
      captionFa: 'گل قیچی برگردان دقیقه ۹۰ با تایمینگ سبز در دربی وایس‌سیتی! 🔥⚽',
      thumbnailUrl: '/src/assets/images/sample_eafc_scoreboard_1794941278189.jpg',
      likesCount: 64,
      commentsCount: 18,
      likedByMe: false,
      timestamp: '22:43',
    },
  ],
  squads: [
    {
      id: 'sq-1',
      titleFa: 'اسکواد Mirage • ۳ از ۵ نفر',
      gameTitle: 'CS2',
      realm: 'shooter',
      hostHandle: 'nima_headshot',
      districtTag: 'LOS SANTOS BUNKER',
      neededRoleFa: 'اسنایپر و پشتیبان اسموک',
      slotsTotal: 5,
      members: ['nima_headshot', 'kian_awp', 'soren_igl'],
      micRequired: true,
      minDnaPct: 92,
      stakeOrReward: '+600 REP · استریک برد',
      requiredRank: 'FACEIT Lvl 9-10',
      leaderAvatarUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
    },
    {
      id: 'sq-2',
      titleFa: 'کلاب FC27 • میکروفون فعال',
      gameTitle: 'FC27',
      realm: 'sports',
      hostHandle: 'parsa_vice27',
      districtTag: 'VICE STADIUM TURF',
      neededRoleFa: 'مهاجم نوک و هافبک خلاق',
      slotsTotal: 5,
      members: ['parsa_vice27', 'amir_winger', 'reza_cdm', 'Vortex_IR'],
      micRequired: true,
      minDnaPct: 90,
      stakeOrReward: '+450 REP · جام شبانه',
      requiredRank: 'Elite Div 2100+',
      leaderAvatarUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
    },
    {
      id: 'sq-3',
      titleFa: 'هایست Vice City • ۲ از ۴ نفر',
      gameTitle: 'GTA',
      realm: 'story',
      hostHandle: 'tara_outlaw',
      districtTag: 'ECLIPSE PENTHOUSE',
      neededRoleFa: 'راننده فرار و هکر حرفه‌ای',
      slotsTotal: 4,
      members: ['tara_outlaw', 'mehdi_drift'],
      micRequired: true,
      minDnaPct: 88,
      stakeOrReward: '+800 REP · سهم هایست',
      requiredRank: 'Kingpin 200+',
      leaderAvatarUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
    },
    {
      id: 'sq-4',
      titleFa: 'اسکواد Valorant • ۴ از ۵ نفر',
      gameTitle: 'Valorant',
      realm: 'shooter',
      hostHandle: 'artin_roshan',
      districtTag: 'VICE CYBER ARENA',
      neededRoleFa: 'کنترلر و بازکننده سایت',
      slotsTotal: 5,
      members: ['artin_roshan', 'sina_jett', 'koorosh_omen', 'arya_fade'],
      micRequired: false,
      minDnaPct: 89,
      stakeOrReward: '+520 REP · تورنمنت شب',
      requiredRank: 'Ascendant / Immortal',
      leaderAvatarUrl: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
    },
  ],
  leaderboard: [
    {
      id: 'lb-1',
      rank: 1,
      handle: 'nima_headshot',
      displayNameFa: 'نیما · کاپیتان سندیکای میراژ',
      clanTag: 'SAS',
      avatarUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
      repScore: 12400,
      winStreak: 11,
    },
    {
      id: 'lb-2',
      rank: 2,
      handle: 'parsa_vice27',
      displayNameFa: 'پارسا · ستاره پرو کلابز',
      clanTag: 'FC27',
      avatarUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
      repScore: 10850,
      winStreak: 8,
    },
    {
      id: 'lb-3',
      rank: 3,
      handle: 'Vortex_IR',
      displayNameFa: 'شما · آرشیتکت کلاب وایس‌سیتی',
      clanTag: 'VICE',
      avatarUrl: '/src/assets/images/athlete_avatar_1794943635940.jpg',
      repScore: 9480,
      winStreak: 6,
      isCurrentUser: true,
    },
    {
      id: 'lb-4',
      rank: 4,
      handle: 'artin_roshan',
      displayNameFa: 'آرتین · استراتژیست ارشد',
      clanTag: 'AGZ',
      avatarUrl: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
      repScore: 8790,
      winStreak: 5,
    },
    {
      id: 'lb-5',
      rank: 5,
      handle: 'tara_outlaw',
      displayNameFa: 'تارا · فرمانده هایست وایس‌سیتی',
      clanTag: 'VICE',
      avatarUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
      repScore: 8420,
      winStreak: 5,
    },
  ],
  tournaments: [
    {
      id: 'tour-1',
      titleFa: 'جام هفتگی Vice City Champions (FC27 & CS2)',
      gameTitle: 'EA SPORTS FC 27 · 5v5 / 11v11',
      countdownText: '۰۴:۱۲:۳۸ تا شروع براکت',
      prizePoolFa: '۲۵,۰۰۰ REP + نشان طلایی کلاب',
      formatLabel: 'حذفی دوگانه · ۳۲ تیم',
      teamsRegistered: 28,
      maxTeams: 32,
      isRegistered: false,
    },
    {
      id: 'tour-2',
      titleFa: 'تورنمنت شبانه Mirage Syndicate Major',
      gameTitle: 'CS2 Premier · 5v5',
      countdownText: '۰۱:۴۵:۰۰ تا شروع براکت',
      prizePoolFa: '۱۸,۰۰۰ REP + اسکین اختصاصی کلاب',
      formatLabel: 'BO3 نیمه‌نهایی · ۱۶ تیم',
      teamsRegistered: 14,
      maxTeams: 16,
      isRegistered: false,
    },
  ],
  challenges: [
    {
      id: 'chal-1',
      mode: '5v5',
      gameTitle: 'CS2 · Mirage',
      challengerHandle: 'nima_headshot',
      targetClanOrHandle: 'INFERNO CARTEL [INF]',
      stakeRep: 1200,
      noteFa: 'امشب ساعت ۲۳:۰۰ سر ۱۲۰۰ امتیاز REP و پرچم کلاب!',
      statusText: 'آماده پذیرش · LIVE',
    },
  ],
  liveArena: {
    tournamentTitleFa: 'جام پایتخت • فینال BO3',
    mapLabelFa: 'نقشه ۲ از ۳: Mirage',
    viewersCount: 1240,
    totalPoolRep: 48500,
    activeMarket: 'match_winner',
    selectedContenderId: 'nima',
    selectedStakeRep: 500,
    contenders: {
      nima: {
        id: 'nima',
        handle: 'nima_headshot',
        displayNameFa: 'نیما · SAS',
        avatarUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
        kdText: 'K/D 24-14',
        kdRatioText: 'K/D 1.65',
        score: 12,
        winChancePct: 64,
        multiplier: 1.75,
        roundResults: ['win', 'win', 'loss', 'win', 'win'],
      },
      parsa: {
        id: 'parsa',
        handle: 'parsa_vice27',
        displayNameFa: 'پارسا · FC27',
        avatarUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
        kdText: 'K/D 18-17',
        kdRatioText: 'K/D 1.28',
        score: 10,
        winChancePct: 36,
        multiplier: 2.2,
        roundResults: ['loss', 'loss', 'win', 'loss', 'win'],
      },
    },
    recentPredictions: [],
  },
  rivalries: [
    {
      id: 'riv-1',
      titleFa: 'دربی بزرگ وایس‌سیتی در برابر تایتان‌های لوس‌سانتوس',
      gameTitle: 'EA SPORTS FC 27 · TURF DERBY',
      realm: 'sports',
      turfZone: 'OCEAN DRIVE ARENA',
      factionA: {
        id: 'fac-vice',
        name: 'VICE CITY VORTEX',
        tag: 'VICE',
        colorHex: '#22D3EE',
        hypePoints: 1840,
        fansCount: 342,
        championHandle: 'parsa_vice27',
      },
      factionB: {
        id: 'fac-ls',
        name: 'LOS SANTOS TITANS',
        tag: 'LST',
        colorHex: '#F59E0B',
        hypePoints: 1690,
        fansCount: 318,
        championHandle: 'madrid_king',
      },
      userBackedFactionId: 'fac-vice',
      recentChants: [
        {
          id: 'ch-1',
          handle: 'parsa_vice27',
          factionTag: 'VICE',
          text: 'امشب با پرس ۴-۲-۳-۱ کل خط هافبک لوس‌سانتوس رو قفل می‌کنیم!',
        },
        {
          id: 'ch-2',
          handle: 'nima_headshot',
          factionTag: 'LST',
          text: 'ضدحمله L1+Triangle تایتان‌ها هیچ دفاعی رو زنده نمی‌ذاره!',
        },
      ],
    },
    {
      id: 'riv-2',
      titleFa: 'جنگ قلمرو شوتر: سندیکای میراژ در برابر کارتل اینفرنو',
      gameTitle: 'CS2 & COD · STREET SYNDICATE WAR',
      realm: 'shooter',
      turfZone: 'DOWNTOWN FOUNDRY',
      factionA: {
        id: 'fac-mirage',
        name: 'MIRAGE SYNDICATE',
        tag: 'MRG',
        colorHex: '#22D3EE',
        hypePoints: 2410,
        fansCount: 489,
        championHandle: 'nima_headshot',
      },
      factionB: {
        id: 'fac-inferno',
        name: 'INFERNO CARTEL',
        tag: 'INF',
        colorHex: '#EC4899',
        hypePoints: 2350,
        fansCount: 471,
        championHandle: 'kilo_actual',
      },
      userBackedFactionId: null,
      recentChants: [
        {
          id: 'ch-3',
          handle: 'nima_headshot',
          factionTag: 'MRG',
          text: 'هر کی جرئت داره بیاد Mid Window، اسنایپ ما خطا نداره!',
        },
      ],
    },
  ],
};

export function toggleGamerFriendship(
  state: GtaSocialState,
  gamerId: string
): GtaSocialState {
  let repDelta = 0;
  const gamers = state.gamers.map((g) => {
    if (g.id !== gamerId) return g;
    const nextFriend = !g.isFriend;
    repDelta = nextFriend ? 60 : -60;
    return {
      ...g,
      isFriend: nextFriend,
      repScore: g.repScore + (nextFriend ? 25 : -25),
    };
  });
  return {
    ...state,
    userStreetRep: Math.max(0, state.userStreetRep + repDelta),
    gamers,
  };
}

export function appendSocialChatMessage(
  state: GtaSocialState,
  input: {
    channelId: string;
    senderHandle?: string;
    senderTag?: string;
    text: string;
    isSelf?: boolean;
    accentHex?: string;
  }
): GtaSocialState {
  const cleanText = input.text.trim();
  if (!cleanText) return state;

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  const newMsg: GtaChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    channelId: input.channelId || 'global-vice',
    senderHandle: input.senderHandle ?? state.userHandle,
    senderTag: input.senderTag ?? state.userCrewTag,
    text: cleanText,
    timestamp: `${hh}:${mm}`,
    isSelf: input.isSelf ?? true,
    accentHex: input.accentHex ?? '#22D3EE',
  };

  return {
    ...state,
    userStreetRep: state.userStreetRep + (newMsg.isSelf ? 15 : 0),
    messages: [...state.messages, newMsg].slice(-30),
  };
}

export function buildAutoCrewReply(
  state: GtaSocialState,
  userMessage: string,
  channelId: string
): GtaChatMessage {
  const lower = userMessage.toLowerCase();
  const targetGamer =
    state.gamers.find((g) => channelId === `dm-${g.id}`) ??
    (lower.includes('fc') || lower.includes('فوتبال') || lower.includes('پاس')
      ? state.gamers[0]
      : lower.includes('cs') || lower.includes('شوتر') || lower.includes('ام')
        ? state.gamers[1]
        : state.gamers[3]);

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  let replyText = `ایول ${state.userHandle}! پیامتو توی رادیو کلاب گرفتم. من توی لابی ${targetGamer.cityDistrict} آنلاينم، بزن بریم توی اسکواد!`;
  if (lower.includes('اسکواد') || lower.includes('همتیمی') || lower.includes('هم‌تیمی') || lower.includes('پایه')) {
    replyText = `من ۱۰۰٪ پایه‌ام! دیسکورد و میکروفونم روشنه (${targetGamer.favoriteGame}). دعوت اسکواد رو بفرست بریم داخل مچ.`;
  } else if (lower.includes('کلاب') || lower.includes('رقابت') || lower.includes('طرفدار') || lower.includes('کری')) {
    replyText = `قلمرو Ocean Drive دست کلاب ماست! الان ۲۰۰ امتیاز هایپ دیگه اضافه کردم تا حریف جرات نکنه نزدیک بشه.`;
  }

  return {
    id: `msg-reply-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    channelId,
    senderHandle: targetGamer.handle,
    senderTag: targetGamer.clanTag ?? targetGamer.realm.toUpperCase(),
    text: replyText,
    timestamp: `${hh}:${mm}`,
    isSelf: false,
    accentHex: '#22D3EE',
  };
}

export function joinOrLeaveGtaSquad(
  state: GtaSocialState,
  squadId: string
): GtaSocialState {
  let repDelta = 0;
  const squads = state.squads.map((sq) => {
    if (sq.id !== squadId) return sq;
    const alreadyIn = sq.members.includes(state.userHandle);
    if (alreadyIn) {
      repDelta = -40;
      return {
        ...sq,
        members: sq.members.filter((m) => m !== state.userHandle),
      };
    }
    if (sq.members.length >= sq.slotsTotal) {
      return sq;
    }
    repDelta = 120;
    return {
      ...sq,
      members: [...sq.members, state.userHandle],
    };
  });

  return {
    ...state,
    userStreetRep: Math.max(0, state.userStreetRep + repDelta),
    squads,
  };
}

export function createGtaSquadLobby(
  state: GtaSocialState,
  input: {
    titleFa: string;
    gameTitle: string;
    realm: RealmId;
    neededRoleFa: string;
    micRequired?: boolean;
    requiredRank?: string;
  }
): GtaSocialState {
  const cleanTitle = input.titleFa.trim();
  if (!cleanTitle) return state;

  const newSquad: GtaSquadLobby = {
    id: `sq-${Date.now()}`,
    titleFa: cleanTitle,
    gameTitle: input.gameTitle.trim() || 'FC27',
    realm: input.realm,
    hostHandle: state.userHandle,
    districtTag: 'VICE PENTHOUSE HQ',
    neededRoleFa: input.neededRoleFa.trim() || 'هم‌تیمی با میکروفون فعال',
    slotsTotal: 5,
    members: [state.userHandle],
    micRequired: input.micRequired ?? true,
    minDnaPct: 90,
    stakeOrReward: '+550 REP · لابی VIP',
    requiredRank: input.requiredRank?.trim() || 'Elite / Pro',
    leaderAvatarUrl: '/src/assets/images/athlete_avatar_1794943635940.jpg',
  };

  return {
    ...state,
    userStreetRep: state.userStreetRep + 150,
    squads: [newSquad, ...state.squads],
  };
}

export function createGtaHighlightClip(
  state: GtaSocialState,
  input: {
    gameTag: string;
    captionFa: string;
    thumbnailUrl?: string;
  }
): GtaSocialState {
  const cleanCaption = input.captionFa.trim();
  if (!cleanCaption) return state;

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  const newClip: GtaHighlightClip = {
    id: `clip-${Date.now()}`,
    authorHandle: state.userHandle,
    authorTag: state.userCrewTag,
    avatarUrl: '/src/assets/images/athlete_avatar_1794943635940.jpg',
    gameTag: input.gameTag.trim() || 'EA SPORTS FC 27',
    captionFa: cleanCaption,
    thumbnailUrl:
      input.thumbnailUrl ||
      '/src/assets/images/sample_eafc_scoreboard_1794941278189.jpg',
    likesCount: 1,
    commentsCount: 0,
    likedByMe: true,
    timestamp: `${hh}:${mm}`,
  };

  const existingClips = state.highlightClips ?? INITIAL_GTA_SOCIAL_STATE.highlightClips ?? [];

  return {
    ...state,
    userStreetRep: state.userStreetRep + 180,
    highlightClips: [newClip, ...existingClips],
  };
}

export function toggleClipFireReaction(
  state: GtaSocialState,
  clipId: string
): GtaSocialState {
  const existingClips = state.highlightClips ?? INITIAL_GTA_SOCIAL_STATE.highlightClips ?? [];
  const nextClips = existingClips.map((c) => {
    if (c.id !== clipId) return c;
    const nextLiked = !c.likedByMe;
    return {
      ...c,
      likedByMe: nextLiked,
      likesCount: Math.max(0, c.likesCount + (nextLiked ? 1 : -1)),
    };
  });

  return {
    ...state,
    userStreetRep: state.userStreetRep + 20,
    highlightClips: nextClips,
  };
}

export function registerForWeeklyTournament(
  state: GtaSocialState,
  tournamentId: string
): GtaSocialState {
  const existing = state.tournaments ?? INITIAL_GTA_SOCIAL_STATE.tournaments ?? [];
  let registeredNow = false;
  const nextTournaments = existing.map((t) => {
    if (t.id !== tournamentId) return t;
    if (t.isRegistered) return t;
    registeredNow = true;
    return {
      ...t,
      isRegistered: true,
      teamsRegistered: Math.min(t.maxTeams, t.teamsRegistered + 1),
    };
  });

  return {
    ...state,
    userStreetRep: state.userStreetRep + (registeredNow ? 220 : 0),
    tournaments: nextTournaments,
  };
}

export function createScrimChallenge(
  state: GtaSocialState,
  input: {
    mode: '1v1' | '5v5';
    gameTitle: string;
    targetClanOrHandle: string;
    stakeRep: number;
    noteFa: string;
  }
): GtaSocialState {
  const target = input.targetClanOrHandle.trim();
  if (!target) return state;

  const newChal: GtaScrimChallenge = {
    id: `chal-${Date.now()}`,
    mode: input.mode,
    gameTitle: input.gameTitle.trim() || 'CS2 · Mirage',
    challengerHandle: state.userHandle,
    targetClanOrHandle: target,
    stakeRep: Math.max(100, Number(input.stakeRep) || 500),
    noteFa: input.noteFa.trim() || 'چالش رسمی کلاب وایس‌سیتی · آماده ورود به لابی!',
    statusText: 'ثبت شد · در انتظار حریف',
  };

  const existing = state.challenges ?? INITIAL_GTA_SOCIAL_STATE.challenges ?? [];
  return {
    ...state,
    userStreetRep: state.userStreetRep + 140,
    challenges: [newChal, ...existing],
  };
}

export function backRivalryFaction(
  state: GtaSocialState,
  rivalryId: string,
  factionId: string,
  chantText?: string
): GtaSocialState {
  const rivalries = state.rivalries.map((riv) => {
    if (riv.id !== rivalryId) return riv;
    const isA = riv.factionA.id === factionId;
    const isB = riv.factionB.id === factionId;
    if (!isA && !isB) return riv;

    const firstTimeBacking = riv.userBackedFactionId !== factionId;
    const hypeBoost = chantText?.trim() ? 160 : 95;

    const nextA = isA
      ? {
          ...riv.factionA,
          hypePoints: riv.factionA.hypePoints + hypeBoost,
          fansCount: riv.factionA.fansCount + (firstTimeBacking ? 1 : 0),
        }
      : riv.factionA;

    const nextB = isB
      ? {
          ...riv.factionB,
          hypePoints: riv.factionB.hypePoints + hypeBoost,
          fansCount: riv.factionB.fansCount + (firstTimeBacking ? 1 : 0),
        }
      : riv.factionB;

    const chosenTag = isA ? riv.factionA.tag : riv.factionB.tag;
    const nextChants = chantText?.trim()
      ? [
          {
            id: `ch-${Date.now()}`,
            handle: state.userHandle,
            factionTag: chosenTag,
            text: chantText.trim(),
          },
          ...riv.recentChants,
        ].slice(0, 6)
      : riv.recentChants;

    return {
      ...riv,
      factionA: nextA,
      factionB: nextB,
      userBackedFactionId: factionId,
      recentChants: nextChants,
    };
  });

  return {
    ...state,
    userStreetRep: state.userStreetRep + 110,
    rivalries,
  };
}

export function computeFactionHypePercentages(rivalry: GtaRivalryBattle): {
  pctA: number;
  pctB: number;
} {
  const total = Math.max(1, rivalry.factionA.hypePoints + rivalry.factionB.hypePoints);
  const pctA = Math.round((rivalry.factionA.hypePoints / total) * 100);
  const pctB = 100 - pctA;
  return { pctA, pctB };
}

export function calculateLivePredictionPayout(
  stakeRep: number,
  multiplier: number
): number {
  if (stakeRep <= 0 || multiplier <= 0) return 0;
  return Math.round(stakeRep * multiplier);
}

export function submitLiveArenaPrediction(
  state: GtaSocialState,
  input: {
    market: LivePredictionMarketId;
    contenderId: 'nima' | 'parsa';
    stakeRep: number;
  }
): GtaSocialState {
  const arena = state.liveArena ?? INITIAL_GTA_SOCIAL_STATE.liveArena!;
  const cleanStake = Math.max(0, Math.round(input.stakeRep));
  if (cleanStake <= 0 || cleanStake > state.userStreetRep) {
    return state;
  }

  const contender = arena.contenders[input.contenderId];
  const potentialPayoutRep = calculateLivePredictionPayout(
    cleanStake,
    contender.multiplier
  );

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  const nextArena: LiveArenaPredictionState = {
    ...arena,
    activeMarket: input.market,
    selectedContenderId: input.contenderId,
    selectedStakeRep: cleanStake,
    totalPoolRep: arena.totalPoolRep + cleanStake,
    recentPredictions: [
      {
        id: `pred-${Date.now()}`,
        market: input.market,
        contenderHandle: contender.handle,
        stakeRep: cleanStake,
        potentialPayoutRep,
        timestamp: `${hh}:${mm}`,
      },
      ...arena.recentPredictions,
    ].slice(0, 8),
  };

  return {
    ...state,
    userStreetRep: state.userStreetRep - cleanStake,
    liveArena: nextArena,
  };
}

export function postFanClubMessage(
  state: GtaSocialState,
  gamerId: string,
  text: string
): GtaSocialState {
  const clean = text.trim();
  if (!clean) return state;

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  const gamers = state.gamers.map((g) => {
    if (g.id !== gamerId) return g;
    const prevPosts = g.fanClubPosts ?? [];
    return {
      ...g,
      fanClubMembersCount: (g.fanClubMembersCount ?? 1000) + 1,
      fanClubPosts: [
        {
          id: `fc-${Date.now()}`,
          authorHandle: state.userHandle,
          text: clean,
          timestamp: `${hh}:${mm}`,
        },
        ...prevPosts,
      ],
    };
  });

  return {
    ...state,
    userStreetRep: state.userStreetRep + 25,
    gamers,
  };
}

export function filterAndSortPlayersForSearch(
  gamers: GtaGamerProfile[],
  query: string,
  filterMode: 'all' | 'online' | 'top_rep'
): GtaGamerProfile[] {
  const q = query.trim().toLowerCase();
  const filtered = gamers.filter((g) => {
    if (filterMode === 'online' && g.onlineStatus !== 'ONLINE') {
      return false;
    }
    if (!q) return true;
    return (
      g.handle.toLowerCase().includes(q) ||
      g.displayNameFa.toLowerCase().includes(q) ||
      (g.clanTag ?? '').toLowerCase().includes(q)
    );
  });

  if (filterMode === 'top_rep') {
    return [...filtered].sort((a, b) => b.repScore - a.repScore);
  }
  return filtered;
}

/**
 * Toggles Like or Dislike on a GTA VI Social Feed post with strict mutual exclusion.
 */
export function togglePostReaction(
  state: GtaSocialState,
  postId: string,
  reaction: 'like' | 'dislike'
): GtaSocialState {
  const existingPosts = state.posts ?? INITIAL_GTA_SOCIAL_STATE.posts ?? [];
  let repDelta = 0;

  const nextPosts = existingPosts.map((post) => {
    if (post.id !== postId) return post;

    let likes = post.likesCount;
    let dislikes = post.dislikesCount;
    let nextReaction: 'like' | 'dislike' | null = reaction;

    if (post.userReaction === reaction) {
      // Toggle off active reaction
      nextReaction = null;
      if (reaction === 'like') {
        likes = Math.max(0, likes - 1);
      } else {
        dislikes = Math.max(0, dislikes - 1);
      }
    } else {
      // Remove previous opposite reaction if set
      if (post.userReaction === 'like') {
        likes = Math.max(0, likes - 1);
      } else if (post.userReaction === 'dislike') {
        dislikes = Math.max(0, dislikes - 1);
      }

      if (reaction === 'like') {
        likes += 1;
        repDelta = 10;
      } else {
        dislikes += 1;
        repDelta = 5;
      }
    }

    return {
      ...post,
      likesCount: likes,
      dislikesCount: dislikes,
      userReaction: nextReaction,
    };
  });

  return {
    ...state,
    userStreetRep: state.userStreetRep + repDelta,
    posts: nextPosts,
  };
}

/**
 * Adds a live comment to a GTA VI Social Feed post.
 */
export function addPostComment(
  state: GtaSocialState,
  postId: string,
  text: string
): GtaSocialState {
  const clean = text.trim();
  if (!clean) return state;

  const existingPosts = state.posts ?? INITIAL_GTA_SOCIAL_STATE.posts ?? [];
  let matched = false;

  const nextPosts = existingPosts.map((post) => {
    if (post.id !== postId) return post;
    matched = true;
    const newComment: GtaPostComment = {
      id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      authorHandle: state.userHandle,
      authorTag: state.userCrewTag,
      avatarUrl: '/src/assets/images/athlete_avatar_1794943635940.jpg',
      text: clean,
      timestamp: 'هم‌اکنون',
      likesCount: 0,
      likedByMe: false,
    };
    return {
      ...post,
      comments: [...post.comments, newComment],
    };
  });

  if (!matched) return state;
  return {
    ...state,
    userStreetRep: state.userStreetRep + 15,
    posts: nextPosts,
  };
}

/**
 * Likes or unlikes an individual comment on a feed post.
 */
export function toggleCommentLike(
  state: GtaSocialState,
  postId: string,
  commentId: string
): GtaSocialState {
  const existingPosts = state.posts ?? INITIAL_GTA_SOCIAL_STATE.posts ?? [];
  const nextPosts = existingPosts.map((post) => {
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

  return {
    ...state,
    posts: nextPosts,
  };
}

/**
 * Increments a post's share counter and optionally reposts it into a live chat channel.
 */
export function shareSocialPost(
  state: GtaSocialState,
  postId: string,
  targetChannelId?: string
): GtaSocialState {
  const existingPosts = state.posts ?? INITIAL_GTA_SOCIAL_STATE.posts ?? [];
  const targetPost = existingPosts.find((p) => p.id === postId);
  if (!targetPost) return state;

  const nextPosts = existingPosts.map((post) =>
    post.id === postId
      ? {
          ...post,
          sharesCount: post.sharesCount + 1,
          sharedByMe: true,
        }
      : post
  );

  let nextState: GtaSocialState = {
    ...state,
    userStreetRep: state.userStreetRep + 20,
    posts: nextPosts,
  };

  if (targetChannelId) {
    nextState = appendSocialChatMessage(nextState, {
      channelId: targetChannelId,
      text: `پست @${targetPost.authorHandle} به اشتراک گذاشته شد: «${targetPost.captionFa.slice(0, 90)}${targetPost.captionFa.length > 90 ? '...' : ''}»`,
      isSelf: true,
      accentHex: '#FF3B8B',
    });
  }

  return nextState;
}

/**
 * Creates and prepends a new GTA VI Vice City Social Feed post.
 */
export function createSocialPost(
  state: GtaSocialState,
  input: {
    captionFa: string;
    gameTag?: string;
    districtFa?: string;
    mediaUrl?: string;
  }
): GtaSocialState {
  const cleanCaption = input.captionFa.trim();
  if (!cleanCaption) return state;

  const existingPosts = state.posts ?? INITIAL_GTA_SOCIAL_STATE.posts ?? [];
  const newPost: GtaSocialPost = {
    id: `post-${Date.now()}`,
    authorHandle: state.userHandle,
    authorDisplayNameFa: 'شما · عضو ارشد وایس‌سیتی',
    authorTag: state.userCrewTag,
    avatarUrl: '/src/assets/images/athlete_avatar_1794943635940.jpg',
    districtFa: input.districtFa?.trim() || 'بلوار اوشن درایو · وایس‌سیتی',
    gameTag: input.gameTag?.trim() || 'GTA VI Online',
    captionFa: cleanCaption,
    mediaUrl:
      input.mediaUrl ||
      '/src/assets/images/gta6_vice_sunset_backdrop_1795183788003.jpg',
    timestamp: 'هم‌اکنون',
    likesCount: 1,
    dislikesCount: 0,
    userReaction: 'like',
    sharesCount: 0,
    sharedByMe: false,
    comments: [],
  };

  return {
    ...state,
    userStreetRep: state.userStreetRep + 80,
    posts: [newPost, ...existingPosts],
  };
}

/**
 * Joins or leaves a GTA VI Vice City Club (Crew) and syncs the user's active crew tag.
 */
export function toggleClubMembership(
  state: GtaSocialState,
  clubId: string
): GtaSocialState {
  const existingClubs = state.clubs ?? INITIAL_GTA_SOCIAL_STATE.clubs ?? [];
  let repDelta = 0;
  let nextCrewTag = state.userCrewTag;

  const nextClubs = existingClubs.map((club) => {
    if (club.id !== clubId) return club;
    const nextJoined = !club.isJoined;
    repDelta = nextJoined ? 100 : -40;
    if (nextJoined) {
      nextCrewTag = club.tag;
    }
    return {
      ...club,
      isJoined: nextJoined,
      membersCount: Math.max(1, club.membersCount + (nextJoined ? 1 : -1)),
      repTotal: Math.max(0, club.repTotal + (nextJoined ? 250 : -100)),
    };
  });

  return {
    ...state,
    userCrewTag: nextCrewTag,
    userStreetRep: Math.max(0, state.userStreetRep + repDelta),
    clubs: nextClubs,
  };
}

/**
 * Creates a brand-new GTA VI Vice City Club and sets the current player as Boss.
 */
export function createGtaClub(
  state: GtaSocialState,
  input: {
    name: string;
    tag: string;
    districtFa?: string;
    mottoFa?: string;
    gameFocus?: string;
  }
): GtaSocialState {
  const cleanName = input.name.trim();
  const cleanTag = input.tag.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  if (!cleanName || cleanTag.length < 2) return state;

  const existingClubs = state.clubs ?? INITIAL_GTA_SOCIAL_STATE.clubs ?? [];
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  const newClub: GtaClub = {
    id: `club-${Date.now()}`,
    name: cleanName,
    tag: cleanTag,
    districtFa: input.districtFa?.trim() || 'اوشن درایو · وایس‌سیتی',
    mottoFa:
      input.mottoFa?.trim() ||
      'کلاب جدید وایس‌سیتی — آماده فتح قلمرو و هایست‌های شبانه.',
    gameFocus: input.gameFocus?.trim() || 'GTA VI · Multi-Game Crew',
    bannerUrl: '/src/assets/images/gta6_club_penthouse_hq_1795183788895.jpg',
    accentHex: '#FF3B8B',
    bossHandle: state.userHandle,
    membersCount: 1,
    turfRank: existingClubs.length + 1,
    repTotal: 2500,
    isJoined: true,
    announcements: [
      {
        id: `ann-${Date.now()}`,
        authorHandle: state.userHandle,
        text: `کلاب ${cleanName} [${cleanTag}] رسمی افتتاح شد! دوستانتان را ادد کنید و وارد اسکواد شوید.`,
        timestamp: `${hh}:${mm}`,
      },
    ],
  };

  return {
    ...state,
    userCrewTag: cleanTag,
    userStreetRep: state.userStreetRep + 200,
    clubs: [newClub, ...existingClubs],
  };
}

/**
 * Posts an announcement to a GTA VI Club wall.
 */
export function postClubAnnouncement(
  state: GtaSocialState,
  clubId: string,
  text: string
): GtaSocialState {
  const clean = text.trim();
  if (!clean) return state;

  const existingClubs = state.clubs ?? INITIAL_GTA_SOCIAL_STATE.clubs ?? [];
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  let matched = false;
  const nextClubs = existingClubs.map((club) => {
    if (club.id !== clubId) return club;
    matched = true;
    return {
      ...club,
      announcements: [
        {
          id: `ann-${Date.now()}`,
          authorHandle: state.userHandle,
          text: clean,
          timestamp: `${hh}:${mm}`,
        },
        ...club.announcements,
      ],
    };
  });

  if (!matched) return state;
  return {
    ...state,
    userStreetRep: state.userStreetRep + 30,
    clubs: nextClubs,
  };
}


