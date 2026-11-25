// Client-Side Offline AI Agents & Data Models for the Music, Audiobook & Podcast Hub
// 7 3D Video Rooms + Mood/BPM Curator + Web Audio Acoustic DSP Profiles + Chapterizer Bookmarks

import type { SpatialParticleMode, UndergroundStreamPost } from './cinemaAgents';

export type AudioRoomId =
  | 'westworld-cafe'
  | 'mj-concert'
  | 'berlin-rave'
  | 'tomorrowland'
  | 'meditation'
  | 'ac-library'
  | 'podcast-studio';

export type AudioMoodKey =
  | 'chill_nostalgia'
  | 'high_energy'
  | 'deep_focus'
  | 'sleep_meditation'
  | 'story_night';

export interface AudioAcousticProfile {
  profileNameFa: string;
  eqLowDb: number;
  eqMidDb: number;
  eqHighDb: number;
  reverbMix: number; // 0..0.75
  reverbDelaySec: number; // 0.04..0.38
  baseSynthBpm: number;
  synthScaleNotesHz: number[];
  synthTimbre: 'warm-jazz' | 'stadium-pop' | 'berlin-acid' | 'trance-lead' | 'ambient-drone' | 'lute-harp' | 'podcast-voice';
}

export interface AudioTrackItem {
  id: string;
  roomId: AudioRoomId;
  titleFa: string;
  artistFa: string;
  durationSec: number;
  bpm: number;
  genreLabel: string;
  streamUrl?: string;
}

export interface AudioChapterMarker {
  id: string;
  titleFa: string;
  timeSec: number;
}

export interface AudioRoomConfig {
  id: AudioRoomId;
  titleFa: string;
  subtitleFa: string;
  videoLoopPath: string;
  fallbackImageUrl: string;
  fallbackToneFilter: string;
  accentHex: string;
  secondaryHex: string;
  bpmRange: [number, number];
  supportedMoods: AudioMoodKey[];
  supportsChapters: boolean;
  acoustic: AudioAcousticProfile;
  defaultPlaylist: AudioTrackItem[];
  chapters?: AudioChapterMarker[];
  particleMode: SpatialParticleMode;
}

export const AUDIO_ROOMS: AudioRoomConfig[] = [
  {
    id: 'westworld-cafe',
    titleFa: 'کافه وستورلد',
    subtitleFa: 'موزیک کافه، جز، بلوز و کانتری',
    videoLoopPath: '/assets/rooms/audio/westworld-cafe.mp4',
    fallbackImageUrl: '/src/assets/images/room_audio_westworld_cafe_1795254621285.jpg',
    fallbackToneFilter: 'contrast(1.04) saturate(1.08)',
    accentHex: '#F59E0B',
    secondaryHex: '#FB923C',
    bpmRange: [70, 105],
    supportedMoods: ['chill_nostalgia', 'deep_focus'],
    supportsChapters: false,
    particleMode: 'jazz-embers',
    acoustic: {
      profileNameFa: 'گرمای لامپی کافه چوبی (Vinyl + Warm Mid)',
      eqLowDb: 3,
      eqMidDb: 4,
      eqHighDb: -1,
      reverbMix: 0.24,
      reverbDelaySec: 0.14,
      baseSynthBpm: 84,
      synthScaleNotesHz: [220, 261.63, 293.66, 329.63, 392, 440],
      synthTimbre: 'warm-jazz',
    },
    defaultPlaylist: [
      {
        id: 'tr-ww-1',
        roomId: 'westworld-cafe',
        titleFa: 'پیانوی غبارآلود سوییت‌واتر',
        artistFa: 'Westworld Jazz Quartet',
        durationSec: 234,
        bpm: 84,
        genreLabel: 'Jazz & Blues',
      },
      {
        id: 'tr-ww-2',
        roomId: 'westworld-cafe',
        titleFa: 'گیتار اسلاید دره سرخ',
        artistFa: 'Dusty Rails Trio',
        durationSec: 198,
        bpm: 92,
        genreLabel: 'Outlaw Country',
      },
    ],
  },
  {
    id: 'mj-concert',
    titleFa: 'کنسرت مایکل جکسون',
    subtitleFa: 'اجراهای زنده و پاپ استادیومی',
    videoLoopPath: '/assets/rooms/audio/mj-concert.mp4',
    fallbackImageUrl: '/src/assets/images/room_audio_stadium_concert_1795263257092.jpg',
    fallbackToneFilter: 'contrast(1.06) saturate(1.08)',
    accentHex: '#FBBF24',
    secondaryHex: '#38BDF8',
    bpmRange: [108, 128],
    supportedMoods: ['high_energy', 'chill_nostalgia'],
    supportsChapters: false,
    particleMode: 'stadium-strobe',
    acoustic: {
      profileNameFa: 'اکوی استادیوم روباز (Wide Arena Hall + Crisp Vocals)',
      eqLowDb: 4,
      eqMidDb: 2,
      eqHighDb: 5,
      reverbMix: 0.48,
      reverbDelaySec: 0.28,
      baseSynthBpm: 118,
      synthScaleNotesHz: [246.94, 293.66, 329.63, 369.99, 440, 493.88],
      synthTimbre: 'stadium-pop',
    },
    defaultPlaylist: [
      {
        id: 'tr-mj-1',
        roomId: 'mj-concert',
        titleFa: 'انرژی استادیوم بوخارست (اجرای زنده)',
        artistFa: 'King of Pop Tribute Live',
        durationSec: 276,
        bpm: 118,
        genreLabel: 'Stadium Pop Live',
      },
      {
        id: 'tr-mj-2',
        roomId: 'mj-concert',
        titleFa: 'گروو بیس‌لاین شبانه',
        artistFa: 'Moonwalk Sessions',
        durationSec: 245,
        bpm: 122,
        genreLabel: 'Funk & Pop',
      },
    ],
  },
  {
    id: 'berlin-rave',
    titleFa: 'ریو صنعتی برلین',
    subtitleFa: 'تکنو، هارد ریو و الکترونیک زیرزمینی',
    videoLoopPath: '/assets/rooms/audio/berlin-rave.mp4',
    fallbackImageUrl: '/src/assets/images/room_audio_berlin_rave_1795254620559.jpg',
    fallbackToneFilter: 'contrast(1.1) saturate(1.05)',
    accentHex: '#FB7185',
    secondaryHex: '#38E8FF',
    bpmRange: [132, 165],
    supportedMoods: ['high_energy', 'deep_focus'],
    supportsChapters: false,
    particleMode: 'rave-lasers',
    acoustic: {
      profileNameFa: 'ساب‌بیس انبار بتنی برلین (Sub Punch + Industrial Slap)',
      eqLowDb: 8,
      eqMidDb: -1,
      eqHighDb: 4,
      reverbMix: 0.36,
      reverbDelaySec: 0.19,
      baseSynthBpm: 140,
      synthScaleNotesHz: [110, 130.81, 146.83, 164.81, 196, 220],
      synthTimbre: 'berlin-acid',
    },
    defaultPlaylist: [
      {
        id: 'tr-br-1',
        roomId: 'berlin-rave',
        titleFa: 'بتن سرد کرفت‌ورک — ست زیرزمینی',
        artistFa: 'Tresor Warehouse 04',
        durationSec: 342,
        bpm: 142,
        genreLabel: 'Industrial Techno',
      },
      {
        id: 'tr-br-2',
        roomId: 'berlin-rave',
        titleFa: 'پالس اسید ساعت ۴ صبح',
        artistFa: 'Ostgut Modular',
        durationSec: 310,
        bpm: 148,
        genreLabel: 'Hard Rave',
      },
    ],
  },
  {
    id: 'tomorrowland',
    titleFa: 'جشنواره تومارلند',
    subtitleFa: 'EDM، ترنس و فستیوالی',
    videoLoopPath: '/assets/rooms/audio/tomorrowland.mp4',
    fallbackImageUrl: '/src/assets/images/room_audio_edm_festival_1795263256141.jpg',
    fallbackToneFilter: 'contrast(1.05) saturate(1.08)',
    accentHex: '#38E8FF',
    secondaryHex: '#EC4899',
    bpmRange: [126, 138],
    supportedMoods: ['high_energy'],
    supportsChapters: false,
    particleMode: 'festival-sparks',
    acoustic: {
      profileNameFa: 'استیج اصلی فستیوال (Wide Stereo Trance + Airy Highs)',
      eqLowDb: 6,
      eqMidDb: 1,
      eqHighDb: 6,
      reverbMix: 0.52,
      reverbDelaySec: 0.32,
      baseSynthBpm: 132,
      synthScaleNotesHz: [261.63, 311.13, 349.23, 392, 466.16, 523.25],
      synthTimbre: 'trance-lead',
    },
    defaultPlaylist: [
      {
        id: 'tr-tl-1',
        roomId: 'tomorrowland',
        titleFa: 'طلوع مین‌استیج — سرود ترنس ۲۰۲۶',
        artistFa: 'Horizon Euphoria',
        durationSec: 288,
        bpm: 134,
        genreLabel: 'Progressive Trance',
      },
    ],
  },
  {
    id: 'meditation',
    titleFa: 'فضای مدیتیشن',
    subtitleFa: 'امبینت، فرکانس‌های آرامش‌بخش و خواب',
    videoLoopPath: '/assets/rooms/audio/meditation.mp4',
    fallbackImageUrl: '/src/assets/images/room_audio_zen_meditation_1795263255401.jpg',
    fallbackToneFilter: 'contrast(1.03) saturate(0.95)',
    accentHex: '#34D399',
    secondaryHex: '#6EE7B7',
    bpmRange: [45, 72],
    supportedMoods: ['sleep_meditation', 'deep_focus'],
    supportsChapters: false,
    particleMode: 'zen-fireflies',
    acoustic: {
      profileNameFa: 'فرکانس ۴۳۲ هرتز تتا (Soft Binaural Wash)',
      eqLowDb: 1,
      eqMidDb: -2,
      eqHighDb: -4,
      reverbMix: 0.65,
      reverbDelaySec: 0.36,
      baseSynthBpm: 56,
      synthScaleNotesHz: [174, 216, 261.63, 324, 396],
      synthTimbre: 'ambient-drone',
    },
    defaultPlaylist: [
      {
        id: 'tr-md-1',
        roomId: 'meditation',
        titleFa: 'باران شبانه + فرکانس ۴۳۲ هرتز خواب عمیق',
        artistFa: 'Theta Sanctum',
        durationSec: 600,
        bpm: 56,
        genreLabel: 'Binaural Ambient',
      },
    ],
  },
  {
    id: 'ac-library',
    titleFa: 'کتابخانه قدیمی اساسینز کرید',
    subtitleFa: 'کتاب‌های صوتی و داستان‌ها',
    videoLoopPath: '/assets/rooms/audio/ac-library.mp4',
    fallbackImageUrl: '/src/assets/images/room_audio_ac_library_1795254620400.jpg',
    fallbackToneFilter: 'contrast(1.04) saturate(1.02)',
    accentHex: '#D97706',
    secondaryHex: '#FCD34D',
    bpmRange: [60, 88],
    supportedMoods: ['story_night', 'deep_focus'],
    supportsChapters: true,
    particleMode: 'library-motes',
    acoustic: {
      profileNameFa: 'تالار سنگی رنسانس (Stone Vault + Narrator Clarity)',
      eqLowDb: 0,
      eqMidDb: 5,
      eqHighDb: 2,
      reverbMix: 0.28,
      reverbDelaySec: 0.2,
      baseSynthBpm: 72,
      synthScaleNotesHz: [196, 220, 261.63, 293.66, 329.63, 392],
      synthTimbre: 'lute-harp',
    },
    defaultPlaylist: [
      {
        id: 'tr-ac-1',
        roomId: 'ac-library',
        titleFa: 'کتاب صوتی: راز طومارهای آلموت — فصل اول تا چهارم',
        artistFa: 'راوی استودیو ائیتروس',
        durationSec: 1840,
        bpm: 72,
        genreLabel: 'Audiobook · History & Lore',
      },
    ],
    chapters: [
      { id: 'ch-ac-1', titleFa: 'فصل ۱: دروازه کتابخانه مرموز', timeSec: 0 },
      { id: 'ch-ac-2', titleFa: 'فصل ۲: کدهای پنهان داوینچی', timeSec: 410 },
      { id: 'ch-ac-3', titleFa: 'فصل ۳: نبرد زیر نور شمع', timeSec: 890 },
      { id: 'ch-ac-4', titleFa: 'فصل ۴: میراث ابدی انجمن', timeSec: 1380 },
    ],
  },
  {
    id: 'podcast-studio',
    titleFa: 'استودیوی پادکستر',
    subtitleFa: 'پادکست‌ها و گفتگوهای زنده',
    videoLoopPath: '/assets/rooms/audio/podcast-studio.mp4',
    fallbackImageUrl: '/src/assets/images/room_audio_podcast_studio_1795263256052.jpg',
    fallbackToneFilter: 'contrast(1.04) saturate(1.0)',
    accentHex: '#38BDF8',
    secondaryHex: '#A855F7',
    bpmRange: [75, 110],
    supportedMoods: ['deep_focus', 'story_night'],
    supportsChapters: true,
    particleMode: 'podcast-wave',
    acoustic: {
      profileNameFa: 'میکروفون کاندنسر نزدیک (Broadcast Vocal Warmth)',
      eqLowDb: 2,
      eqMidDb: 6,
      eqHighDb: 3,
      reverbMix: 0.08,
      reverbDelaySec: 0.05,
      baseSynthBpm: 88,
      synthScaleNotesHz: [220, 246.94, 293.66, 329.63, 392],
      synthTimbre: 'podcast-voice',
    },
    defaultPlaylist: [
      {
        id: 'tr-pod-1',
        roomId: 'podcast-studio',
        titleFa: 'پادکست فناوری زیرزمینی: معماری شبکه‌های P2P و تلگرام',
        artistFa: 'میزگرد مهندسان اپتروس · اپیزود ۴۲',
        durationSec: 2150,
        bpm: 88,
        genreLabel: 'Tech & Culture Podcast',
      },
    ],
    chapters: [
      { id: 'ch-pod-1', titleFa: '۰۰:۰۰ · مقدمه و تیتر خبرها', timeSec: 0 },
      { id: 'ch-pod-2', titleFa: '۰۴:۱۲ · چرا استریم غیرمتمرکز مهم است؟', timeSec: 252 },
      { id: 'ch-pod-3', titleFa: '۱۱:۳۰ · گفتگو با طراحان صوتی بازی', timeSec: 690 },
      { id: 'ch-pod-4', titleFa: '۱۸:۴۵ · جمع‌بندی و پرسش شنوندگان', timeSec: 1125 },
    ],
  },
];

// ============================================================================
// 1. Mood & Frequency Curator Agent
// ============================================================================

export interface MoodCuratorInput {
  hourOfDay: number; // 0..23
  targetBpm: number; // 45..170
  mood: AudioMoodKey;
}

export interface MoodCuratorRecommendation {
  recommendedRoom: AudioRoomConfig;
  recommendedTrack: AudioTrackItem;
  matchScorePct: number;
  reasonFa: string;
}

export function curateAudioRoomByMood(input: MoodCuratorInput): MoodCuratorRecommendation {
  const safeHour = ((Math.round(input.hourOfDay) % 24) + 24) % 24;
  const safeBpm = Math.max(45, Math.min(170, Math.round(input.targetBpm)));

  const scored = AUDIO_ROOMS.map((room) => {
    let score = 45;
    if (room.supportedMoods.includes(input.mood)) score += 34;

    const [minBpm, maxBpm] = room.bpmRange;
    const midBpm = (minBpm + maxBpm) / 2;
    if (safeBpm >= minBpm && safeBpm <= maxBpm) {
      score += 18;
    } else {
      score -= Math.min(24, Math.abs(safeBpm - midBpm) * 0.35);
    }

    // Time-of-day heuristics
    if (safeHour >= 22 || safeHour <= 4) {
      if (room.id === 'berlin-rave' && safeBpm >= 130) score += 8;
      if (room.id === 'meditation' && input.mood === 'sleep_meditation') score += 10;
      if (room.id === 'ac-library' && input.mood === 'story_night') score += 10;
    } else if (safeHour >= 9 && safeHour <= 18) {
      if (room.id === 'podcast-studio' || room.id === 'westworld-cafe') score += 6;
    }

    return {
      room,
      score: Math.min(99, Math.max(55, Math.round(score))),
    };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0] ?? { room: AUDIO_ROOMS[0], score: 92 };
  const track = best.room.defaultPlaylist[0];

  const timePeriodFa =
    safeHour >= 5 && safeHour < 12
      ? 'صبح'
      : safeHour >= 12 && safeHour < 17
        ? 'بعدازظهر'
        : safeHour >= 17 && safeHour < 22
          ? 'عصر'
          : 'نیمه‌شب';

  return {
    recommendedRoom: best.room,
    recommendedTrack: track,
    matchScorePct: best.score,
    reasonFa: `بر اساس ساعت ${timePeriodFa} و تمپوی ${safeBpm} BPM، اتاق «${best.room.titleFa}» با اکولایزر ${best.room.acoustic.profileNameFa} بهترین هماهنگی را دارد.`,
  };
}

// ============================================================================
// 2. Podcast & Audiobook Chapterizer + Smart Bookmark Agent
// ============================================================================

export interface AudioBookmarkNote {
  id: string;
  trackId: string;
  roomId: AudioRoomId;
  timeSec: number;
  noteText: string;
  createdAtLabel: string;
}

export interface ChapterizerPersistenceState {
  progressByTrackSec: Record<string, number>;
  notes: AudioBookmarkNote[];
}

export function formatTimecodeMmSs(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function upsertTrackBookmarkNote(
  state: ChapterizerPersistenceState,
  input: {
    trackId: string;
    roomId: AudioRoomId;
    timeSec: number;
    noteText: string;
  }
): ChapterizerPersistenceState {
  const cleanNote = input.noteText.trim();
  if (!cleanNote) return state;

  const safeTime = Math.max(0, Math.floor(input.timeSec));
  const newNote: AudioBookmarkNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    trackId: input.trackId,
    roomId: input.roomId,
    timeSec: safeTime,
    noteText: cleanNote,
    createdAtLabel: formatTimecodeMmSs(safeTime),
  };

  return {
    progressByTrackSec: {
      ...state.progressByTrackSec,
      [input.trackId]: safeTime,
    },
    notes: [newNote, ...state.notes],
  };
}

export function saveAudioProgressTimecode(
  state: ChapterizerPersistenceState,
  trackId: string,
  timeSec: number
): ChapterizerPersistenceState {
  return {
    ...state,
    progressByTrackSec: {
      ...state.progressByTrackSec,
      [trackId]: Math.max(0, Math.floor(timeSec)),
    },
  };
}

export interface AudioSocialProfileLinks {
  telegramHandle: string;
  telegramChannelId: string;
  spotifyUrl: string;
  soundcloudUrl: string;
}

export const INITIAL_AUDIO_STREAMS: UndergroundStreamPost[] = [
  {
    id: 'aud-stream-1',
    hub: 'audio',
    roomId: 'berlin-rave',
    titleFa: 'ست زنده انبار برلین · 142 BPM Industrial',
    captionFa: 'رکورد مستقیم میکسر با ساب‌بیس تنظیم‌شده برای فضای ریو برلین.',
    streamUrl: 'https://t.me/berlin_rave_archive/108',
    streamFormat: 'TELEGRAM',
    authorHandle: 'modular_hana',
    authorTelegramChannel: 't.me/berlin_rave_archive',
    personaBadge: '142 BPM',
    personaAccentHex: '#FB7185',
    likesCount: 214,
    likedByMe: false,
    createdOrder: 3,
    timestampLabel: '23:10',
    comments: [],
  },
  {
    id: 'aud-stream-2',
    hub: 'audio',
    roomId: 'ac-library',
    titleFa: 'کتاب صوتی تاریخ فلسفه علم (فصل ۱ تا ۴)',
    captionFa: 'با بوکمارک خودکار و نوت‌برداری روی تایم‌کد برای اتاق کتابخانه اساسینز کرید.',
    streamUrl: 'webrtc://peer-library.aipetros.local/audiobook-01',
    streamFormat: 'P2P_WEBRTC',
    authorHandle: 'mentor_ezio',
    authorTelegramChannel: 't.me/almout_audiobooks',
    personaBadge: 'AUDIOBOOK',
    personaAccentHex: '#D97706',
    likesCount: 162,
    likedByMe: false,
    createdOrder: 2,
    timestampLabel: '19:45',
    comments: [],
  },
  {
    id: 'aud-stream-3',
    hub: 'audio',
    roomId: 'westworld-cafe',
    titleFa: 'پلی‌لیست جز شبانه و گیتار بلوز کافه وستورلد',
    captionFa: 'لینک مستقیم استریم کافه برای کارهای تمرکزی شبانه.',
    streamUrl: 'https://t.me/westworld_lounge_fm/77',
    streamFormat: 'TELEGRAM',
    authorHandle: 'saloon_drift',
    authorTelegramChannel: 't.me/westworld_lounge_fm',
    personaBadge: '84 BPM',
    personaAccentHex: '#F59E0B',
    likesCount: 189,
    likedByMe: false,
    createdOrder: 4,
    timestampLabel: '21:15',
    comments: [],
  },
];
