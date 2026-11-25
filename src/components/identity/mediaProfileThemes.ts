import type { CinemaRoomId } from '../../utils/cinemaAgents';
import type { AudioRoomId } from '../../utils/audioAgents';

export type MediaRoomKey = CinemaRoomId | AudioRoomId;

export interface MediaProfileThemeConfig {
  key: MediaRoomKey;
  shortLabel: string;
  outerClass: string;
  headerBgClass: string;
  titleColorClass: string;
  subtitleColorClass: string;
  accentHex: string;
  secondaryHex: string;
  badgeLabel: string;
  pageBgHex: string;
  pageBgGradient: string;
  topBarBg: string;
  topBarBorder: string;
  cardSurfaceBg: string;
  cardBorderColor: string;
  activeTabBg: string;
  activeTabText: string;
  activeTabBorder: string;
  lightAccentText?: boolean;
  labEnv: {
    imageUrl: string;
    ambientBgHex: string;
    beamPrimaryHex: string;
    beamSecondaryHex: string;
    roomRimHex: string;
    floorGlowHex: string;
  };
}

export const CINEMA_PROFILE_SWITCHER_ORDER: CinemaRoomId[] = [
  'movie',
  'series',
  'anime',
  'documentary',
  'tv-climax',
];

export const AUDIO_PROFILE_SWITCHER_ORDER: AudioRoomId[] = [
  'westworld-cafe',
  'mj-concert',
  'berlin-rave',
  'tomorrowland',
  'meditation',
  'ac-library',
  'podcast-studio',
];

export const CINEMA_PROFILE_THEMES: Record<CinemaRoomId, MediaProfileThemeConfig> = {
  movie: {
    key: 'movie',
    shortLabel: 'فیلم سینمایی',
    outerClass:
      'rounded-[24px] border-2 border-[#F59E0B]/65 bg-[#120D08] shadow-[0_24px_64px_rgba(245,158,11,0.24)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#24160A] via-[#1C110D] to-[#0E0908] border-b border-[#F59E0B]/45',
    titleColorClass: 'text-[#FEF3C7]',
    subtitleColorClass: 'text-[#F59E0B]',
    accentHex: '#F59E0B',
    secondaryHex: '#E11D48',
    badgeLabel: 'CINEMA HALL · NOIR SCOPE 4K',
    pageBgHex: '#0F0906',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 18% 12%, rgba(245,158,11,0.28) 0%, transparent 60%), radial-gradient(ellipse 70% 55% at 84% 80%, rgba(225,29,72,0.22) 0%, transparent 60%), linear-gradient(155deg, #100A06 0%, #1C100B 50%, #0C0708 100%)',
    topBarBg: 'rgba(18, 11, 8, 0.88)',
    topBarBorder: 'rgba(245, 158, 11, 0.36)',
    cardSurfaceBg: 'rgba(22, 14, 10, 0.90)',
    cardBorderColor: 'rgba(245, 158, 11, 0.32)',
    activeTabBg: '#F59E0B',
    activeTabText: '#110A04',
    activeTabBorder: '#FDE68A',
    lightAccentText: true,
    labEnv: {
      imageUrl: '/src/assets/images/room_cinema_noir_hall_1795254621048.jpg',
      ambientBgHex: '#100906',
      beamPrimaryHex: '#F59E0B',
      beamSecondaryHex: '#FDE68A',
      roomRimHex: '#E11D48',
      floorGlowHex: '#D97706',
    },
  },
  series: {
    key: 'series',
    shortLabel: 'سریال',
    outerClass:
      'rounded-[20px] border border-[#38BDF8]/60 bg-[#07111E] shadow-[0_24px_64px_rgba(56,189,248,0.24)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#0A192E] via-[#0F213B] to-[#07111E] border-b border-[#38BDF8]/45',
    titleColorClass: 'text-[#E0F2FE]',
    subtitleColorClass: 'text-[#38BDF8]',
    accentHex: '#38BDF8',
    secondaryHex: '#0EA5E9',
    badgeLabel: 'CRIME MONITOR · EPISODIC LAB',
    pageBgHex: '#050C18',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 18% 12%, rgba(56,189,248,0.28) 0%, transparent 60%), radial-gradient(ellipse 68% 52% at 84% 80%, rgba(14,165,233,0.20) 0%, transparent 60%), linear-gradient(155deg, #050C18 0%, #09182E 52%, #050914 100%)',
    topBarBg: 'rgba(6, 14, 28, 0.88)',
    topBarBorder: 'rgba(56, 189, 248, 0.36)',
    cardSurfaceBg: 'rgba(8, 19, 36, 0.90)',
    cardBorderColor: 'rgba(56, 189, 248, 0.30)',
    activeTabBg: '#38BDF8',
    activeTabText: '#041120',
    activeTabBorder: '#BAE6FD',
    lightAccentText: true,
    labEnv: {
      imageUrl: '/src/assets/images/room_cinema_crime_series_1795263250795.jpg',
      ambientBgHex: '#050D1A',
      beamPrimaryHex: '#38BDF8',
      beamSecondaryHex: '#BAE6FD',
      roomRimHex: '#0EA5E9',
      floorGlowHex: '#0284C7',
    },
  },
  anime: {
    key: 'anime',
    shortLabel: 'انیمه',
    outerClass:
      'rounded-[24px] border border-[#22D3EE]/65 bg-[#0A0B18] shadow-[0_24px_64px_rgba(34,211,238,0.26)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#0C1C2E] via-[#1B102E] to-[#0A0B18] border-b border-[#22D3EE]/45',
    titleColorClass: 'text-[#ECFEFF]',
    subtitleColorClass: 'text-[#22D3EE]',
    accentHex: '#22D3EE',
    secondaryHex: '#F43F5E',
    badgeLabel: 'TOKYO RAIN · SAKUGA 60FPS',
    pageBgHex: '#070916',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 18% 12%, rgba(34,211,238,0.30) 0%, transparent 60%), radial-gradient(ellipse 68% 52% at 84% 80%, rgba(244,63,94,0.24) 0%, transparent 60%), linear-gradient(155deg, #070916 0%, #10162D 50%, #120919 100%)',
    topBarBg: 'rgba(8, 11, 24, 0.88)',
    topBarBorder: 'rgba(34, 211, 238, 0.38)',
    cardSurfaceBg: 'rgba(11, 15, 32, 0.90)',
    cardBorderColor: 'rgba(34, 211, 238, 0.32)',
    activeTabBg: '#22D3EE',
    activeTabText: '#041219',
    activeTabBorder: '#A5F3FC',
    lightAccentText: true,
    labEnv: {
      imageUrl: '/src/assets/images/room_anime_tokyo_rain_1795254620688.jpg',
      ambientBgHex: '#070A17',
      beamPrimaryHex: '#22D3EE',
      beamSecondaryHex: '#A5F3FC',
      roomRimHex: '#F43F5E',
      floorGlowHex: '#06B6D4',
    },
  },
  documentary: {
    key: 'documentary',
    shortLabel: 'مستند',
    outerClass:
      'rounded-[20px] border border-[#34D399]/60 bg-[#06130E] shadow-[0_24px_64px_rgba(52,211,153,0.24)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#0A2018] via-[#0F241D] to-[#06130E] border-b border-[#34D399]/45',
    titleColorClass: 'text-[#ECFDF5]',
    subtitleColorClass: 'text-[#34D399]',
    accentHex: '#34D399',
    secondaryHex: '#A7F3D0',
    badgeLabel: 'ALPINE FIELD · 4K DOCUMENTARY',
    pageBgHex: '#05100B',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 18% 12%, rgba(52,211,153,0.28) 0%, transparent 60%), radial-gradient(ellipse 68% 52% at 84% 80%, rgba(16,185,129,0.20) 0%, transparent 60%), linear-gradient(155deg, #05100B 0%, #0A1F17 52%, #050D09 100%)',
    topBarBg: 'rgba(6, 17, 12, 0.88)',
    topBarBorder: 'rgba(52, 211, 153, 0.36)',
    cardSurfaceBg: 'rgba(9, 23, 17, 0.90)',
    cardBorderColor: 'rgba(52, 211, 153, 0.30)',
    activeTabBg: '#34D399',
    activeTabText: '#03170F',
    activeTabBorder: '#A7F3D0',
    lightAccentText: true,
    labEnv: {
      imageUrl: '/src/assets/images/room_cinema_alpine_doc_1795263252975.jpg',
      ambientBgHex: '#05100B',
      beamPrimaryHex: '#34D399',
      beamSecondaryHex: '#A7F3D0',
      roomRimHex: '#10B981',
      floorGlowHex: '#059669',
    },
  },
  'tv-climax': {
    key: 'tv-climax',
    shortLabel: 'تلویزیون و کلایمکس',
    outerClass:
      'rounded-[24px] border border-[#FB7185]/65 bg-[#150816] shadow-[0_24px_64px_rgba(251,113,133,0.26)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#280D22] via-[#1E0F29] to-[#130816] border-b border-[#FB7185]/45',
    titleColorClass: 'text-[#FFE4E6]',
    subtitleColorClass: 'text-[#FB7185]',
    accentHex: '#FB7185',
    secondaryHex: '#FBBF24',
    badgeLabel: '80s RETRO STUDIO · LIVE BROADCAST',
    pageBgHex: '#120713',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 18% 12%, rgba(251,113,133,0.30) 0%, transparent 60%), radial-gradient(ellipse 68% 52% at 84% 80%, rgba(251,191,36,0.22) 0%, transparent 60%), linear-gradient(155deg, #120713 0%, #220D23 50%, #100816 100%)',
    topBarBg: 'rgba(20, 8, 22, 0.88)',
    topBarBorder: 'rgba(251, 113, 133, 0.38)',
    cardSurfaceBg: 'rgba(25, 11, 27, 0.90)',
    cardBorderColor: 'rgba(251, 113, 133, 0.32)',
    activeTabBg: '#FB7185',
    activeTabText: '#FFFFFF',
    activeTabBorder: '#FECDD3',
    labEnv: {
      imageUrl: '/src/assets/images/room_cinema_retro_tv_1795263256354.jpg',
      ambientBgHex: '#120714',
      beamPrimaryHex: '#FB7185',
      beamSecondaryHex: '#FBBF24',
      roomRimHex: '#F43F5E',
      floorGlowHex: '#E11D48',
    },
  },
};

export const AUDIO_PROFILE_THEMES: Record<AudioRoomId, MediaProfileThemeConfig> = {
  'westworld-cafe': {
    key: 'westworld-cafe',
    shortLabel: 'کافه وستورلد',
    outerClass:
      'rounded-[24px] border-2 border-[#F59E0B]/65 bg-[#150D06] shadow-[0_24px_64px_rgba(245,158,11,0.24)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#281709] via-[#1E1208] to-[#130C06] border-b border-[#F59E0B]/45',
    titleColorClass: 'text-[#FEF3C7]',
    subtitleColorClass: 'text-[#F59E0B]',
    accentHex: '#F59E0B',
    secondaryHex: '#FB923C',
    badgeLabel: 'WESTWORLD CAFE · JAZZ & BLUES',
    pageBgHex: '#110A05',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 18% 12%, rgba(245,158,11,0.28) 0%, transparent 60%), radial-gradient(ellipse 68% 52% at 84% 80%, rgba(251,146,60,0.22) 0%, transparent 60%), linear-gradient(155deg, #110A05 0%, #211409 50%, #0E0804 100%)',
    topBarBg: 'rgba(20, 12, 6, 0.88)',
    topBarBorder: 'rgba(245, 158, 11, 0.36)',
    cardSurfaceBg: 'rgba(24, 15, 8, 0.90)',
    cardBorderColor: 'rgba(245, 158, 11, 0.32)',
    activeTabBg: '#F59E0B',
    activeTabText: '#140B03',
    activeTabBorder: '#FDE68A',
    lightAccentText: true,
    labEnv: {
      imageUrl: '/src/assets/images/room_audio_westworld_cafe_1795254621285.jpg',
      ambientBgHex: '#110A05',
      beamPrimaryHex: '#F59E0B',
      beamSecondaryHex: '#FDE68A',
      roomRimHex: '#FB923C',
      floorGlowHex: '#D97706',
    },
  },
  'mj-concert': {
    key: 'mj-concert',
    shortLabel: 'کنسرت مایکل جکسون',
    outerClass:
      'rounded-[24px] border-2 border-[#FBBF24]/70 bg-[#110F08] shadow-[0_24px_64px_rgba(251,191,36,0.24)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#241E0A] via-[#171928] to-[#0E0F18] border-b border-[#FBBF24]/45',
    titleColorClass: 'text-[#FEF9C3]',
    subtitleColorClass: 'text-[#FBBF24]',
    accentHex: '#FBBF24',
    secondaryHex: '#38BDF8',
    badgeLabel: 'STADIUM LIVE · KING OF POP',
    pageBgHex: '#0C0D14',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 18% 12%, rgba(251,191,36,0.28) 0%, transparent 60%), radial-gradient(ellipse 68% 52% at 84% 80%, rgba(56,189,248,0.22) 0%, transparent 60%), linear-gradient(155deg, #0C0D14 0%, #1C180E 50%, #090C16 100%)',
    topBarBg: 'rgba(15, 15, 22, 0.88)',
    topBarBorder: 'rgba(251, 191, 36, 0.38)',
    cardSurfaceBg: 'rgba(18, 17, 24, 0.90)',
    cardBorderColor: 'rgba(251, 191, 36, 0.32)',
    activeTabBg: '#FBBF24',
    activeTabText: '#141004',
    activeTabBorder: '#FEF08A',
    lightAccentText: true,
    labEnv: {
      imageUrl: '/src/assets/images/room_audio_stadium_concert_1795263257092.jpg',
      ambientBgHex: '#0C0D14',
      beamPrimaryHex: '#FBBF24',
      beamSecondaryHex: '#38BDF8',
      roomRimHex: '#FDE047',
      floorGlowHex: '#EAB308',
    },
  },
  'berlin-rave': {
    key: 'berlin-rave',
    shortLabel: 'ریو صنعتی برلین',
    outerClass:
      'rounded-[16px] border border-[#FB7185]/65 bg-[#12080E] shadow-[0_24px_64px_rgba(251,113,133,0.28)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#280B18] via-[#1B0D1D] to-[#0D0810] border-b border-[#FB7185]/50',
    titleColorClass: 'text-[#FFE4E6]',
    subtitleColorClass: 'text-[#FB7185]',
    accentHex: '#FB7185',
    secondaryHex: '#38E8FF',
    badgeLabel: 'BERLIN TRESOR · INDUSTRIAL RAVE',
    pageBgHex: '#0E060B',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 18% 12%, rgba(251,113,133,0.32) 0%, transparent 60%), radial-gradient(ellipse 68% 52% at 84% 80%, rgba(56,232,255,0.22) 0%, transparent 60%), linear-gradient(155deg, #0E060B 0%, #220B17 50%, #090812 100%)',
    topBarBg: 'rgba(18, 7, 13, 0.88)',
    topBarBorder: 'rgba(251, 113, 133, 0.40)',
    cardSurfaceBg: 'rgba(22, 9, 17, 0.90)',
    cardBorderColor: 'rgba(251, 113, 133, 0.34)',
    activeTabBg: '#FB7185',
    activeTabText: '#FFFFFF',
    activeTabBorder: '#FECDD3',
    labEnv: {
      imageUrl: '/src/assets/images/room_audio_berlin_rave_1795254620559.jpg',
      ambientBgHex: '#0E060B',
      beamPrimaryHex: '#FB7185',
      beamSecondaryHex: '#38E8FF',
      roomRimHex: '#F43F5E',
      floorGlowHex: '#E11D48',
    },
  },
  tomorrowland: {
    key: 'tomorrowland',
    shortLabel: 'تومارلند',
    outerClass:
      'rounded-[24px] border border-[#38E8FF]/65 bg-[#080F1E] shadow-[0_24px_64px_rgba(56,232,255,0.26)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#0A1F33] via-[#1C0F30] to-[#080F1E] border-b border-[#38E8FF]/45',
    titleColorClass: 'text-[#ECFEFF]',
    subtitleColorClass: 'text-[#38E8FF]',
    accentHex: '#38E8FF',
    secondaryHex: '#EC4899',
    badgeLabel: 'TOMORROWLAND · EDM & TRANCE',
    pageBgHex: '#060C1A',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 18% 12%, rgba(56,232,255,0.30) 0%, transparent 60%), radial-gradient(ellipse 68% 52% at 84% 80%, rgba(236,72,153,0.26) 0%, transparent 60%), linear-gradient(155deg, #060C1A 0%, #0E1B36 48%, #160A24 100%)',
    topBarBg: 'rgba(7, 13, 28, 0.88)',
    topBarBorder: 'rgba(56, 232, 255, 0.38)',
    cardSurfaceBg: 'rgba(10, 17, 36, 0.90)',
    cardBorderColor: 'rgba(56, 232, 255, 0.32)',
    activeTabBg: '#38E8FF',
    activeTabText: '#04121E',
    activeTabBorder: '#A5F3FC',
    lightAccentText: true,
    labEnv: {
      imageUrl: '/src/assets/images/room_audio_edm_festival_1795263256141.jpg',
      ambientBgHex: '#060C1A',
      beamPrimaryHex: '#38E8FF',
      beamSecondaryHex: '#EC4899',
      roomRimHex: '#22D3EE',
      floorGlowHex: '#0EA5E9',
    },
  },
  meditation: {
    key: 'meditation',
    shortLabel: 'مدیتیشن',
    outerClass:
      'rounded-[24px] border border-[#34D399]/60 bg-[#05120D] shadow-[0_24px_64px_rgba(52,211,153,0.22)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#082018] via-[#0B231D] to-[#05120D] border-b border-[#34D399]/40',
    titleColorClass: 'text-[#ECFDF5]',
    subtitleColorClass: 'text-[#34D399]',
    accentHex: '#34D399',
    secondaryHex: '#6EE7B7',
    badgeLabel: 'THETA 432HZ · AMBIENT SANCTUM',
    pageBgHex: '#040F0B',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 18% 12%, rgba(52,211,153,0.26) 0%, transparent 60%), radial-gradient(ellipse 68% 52% at 84% 80%, rgba(110,231,183,0.18) 0%, transparent 60%), linear-gradient(155deg, #040F0B 0%, #091E17 52%, #040C09 100%)',
    topBarBg: 'rgba(5, 16, 12, 0.88)',
    topBarBorder: 'rgba(52, 211, 153, 0.34)',
    cardSurfaceBg: 'rgba(7, 21, 16, 0.90)',
    cardBorderColor: 'rgba(52, 211, 153, 0.30)',
    activeTabBg: '#34D399',
    activeTabText: '#03170F',
    activeTabBorder: '#A7F3D0',
    lightAccentText: true,
    labEnv: {
      imageUrl: '/src/assets/images/room_audio_zen_meditation_1795263255401.jpg',
      ambientBgHex: '#040F0B',
      beamPrimaryHex: '#34D399',
      beamSecondaryHex: '#6EE7B7',
      roomRimHex: '#10B981',
      floorGlowHex: '#059669',
    },
  },
  'ac-library': {
    key: 'ac-library',
    shortLabel: 'کتابخانه اساسینز',
    outerClass:
      'rounded-[18px] border-2 border-[#D97706]/65 bg-[#150E07] shadow-[0_24px_64px_rgba(217,119,6,0.24)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#27180B] via-[#1D130A] to-[#130C06] border-b border-[#D97706]/45',
    titleColorClass: 'text-[#FEF3C7]',
    subtitleColorClass: 'text-[#FCD34D]',
    accentHex: '#D97706',
    secondaryHex: '#FCD34D',
    badgeLabel: 'RENAISSANCE VAULT · AUDIOBOOKS',
    pageBgHex: '#120B05',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 18% 12%, rgba(217,119,6,0.28) 0%, transparent 60%), radial-gradient(ellipse 68% 52% at 84% 80%, rgba(252,211,77,0.18) 0%, transparent 60%), linear-gradient(155deg, #120B05 0%, #211509 50%, #0E0905 100%)',
    topBarBg: 'rgba(20, 13, 7, 0.88)',
    topBarBorder: 'rgba(217, 119, 6, 0.36)',
    cardSurfaceBg: 'rgba(24, 16, 9, 0.90)',
    cardBorderColor: 'rgba(217, 119, 6, 0.32)',
    activeTabBg: '#D97706',
    activeTabText: '#FFFFFF',
    activeTabBorder: '#FCD34D',
    labEnv: {
      imageUrl: '/src/assets/images/room_audio_ac_library_1795254620400.jpg',
      ambientBgHex: '#120B05',
      beamPrimaryHex: '#D97706',
      beamSecondaryHex: '#FCD34D',
      roomRimHex: '#F59E0B',
      floorGlowHex: '#B45309',
    },
  },
  'podcast-studio': {
    key: 'podcast-studio',
    shortLabel: 'استودیوی پادکست',
    outerClass:
      'rounded-[22px] border border-[#A855F7]/60 bg-[#0C0B1B] shadow-[0_24px_64px_rgba(168,85,247,0.24)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#131932] via-[#1D1234] to-[#0C0B1B] border-b border-[#A855F7]/45',
    titleColorClass: 'text-[#F3E8FF]',
    subtitleColorClass: 'text-[#38BDF8]',
    accentHex: '#38BDF8',
    secondaryHex: '#A855F7',
    badgeLabel: 'BROADCAST MIC · PODCAST STUDIO',
    pageBgHex: '#080917',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 18% 12%, rgba(56,189,248,0.26) 0%, transparent 60%), radial-gradient(ellipse 68% 52% at 84% 80%, rgba(168,85,247,0.24) 0%, transparent 60%), linear-gradient(155deg, #080917 0%, #13112B 50%, #090C1A 100%)',
    topBarBg: 'rgba(10, 11, 24, 0.88)',
    topBarBorder: 'rgba(168, 85, 247, 0.36)',
    cardSurfaceBg: 'rgba(13, 14, 32, 0.90)',
    cardBorderColor: 'rgba(168, 85, 247, 0.30)',
    activeTabBg: '#A855F7',
    activeTabText: '#FFFFFF',
    activeTabBorder: '#D8B4FE',
    labEnv: {
      imageUrl: '/src/assets/images/room_audio_podcast_studio_1795263256052.jpg',
      ambientBgHex: '#080917',
      beamPrimaryHex: '#38BDF8',
      beamSecondaryHex: '#A855F7',
      roomRimHex: '#C084FC',
      floorGlowHex: '#7C3AED',
    },
  },
};
