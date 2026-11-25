import type React from 'react';
import type { CrossGameKey } from '../../data/offlineAgentsData';

export interface GameStageFrameConfig {
  key: CrossGameKey;
  shortLabel: string;
  outerClass: string;
  headerBgClass: string;
  titleColorClass: string;
  subtitleColorClass: string;
  accentHex: string;
  secondaryHex: string;
  badgeLabel: string;
  /** Full-page dynamic background base color (NEVER white!) */
  pageBgHex: string;
  /** Full-page atmospheric radial/linear background image that transforms per game */
  pageBgGradient: string;
  /** Sticky top bar surface background & border */
  topBarBg: string;
  topBarBorder: string;
  /** Surface styling for secondary cards (e.g., SocialLinksCard) */
  cardSurfaceBg: string;
  cardBorderColor: string;
  /** Active tab pill style in top switcher */
  activeTabBg: string;
  activeTabText: string;
  activeTabBorder: string;
  clipStyle?: React.CSSProperties;
}

/**
 * Exact 11 registered game spaces in AIPETROS + Unified overview pass.
 * Matches all 10 Tournament Hub worlds (FC 27, NBA 2K, FORTNITE, DOTA 2, F1, WARZONE, CS2, GTA, RDR2, APEX)
 * plus VALORANT from the main Spatial Coach Hub.
 */
export const REGISTERED_GAME_SWITCHER_ORDER: CrossGameKey[] = [
  'unified',
  'fc27',
  'cs2',
  'valorant',
  'gta',
  'rdr2',
  'warzone',
  'apex',
  'nba2k',
  'fortnite',
  'dota2',
  'f1',
];

export const GAME_STAGE_FRAME_CONFIG: Record<CrossGameKey, GameStageFrameConfig> = {
  unified: {
    key: 'unified',
    shortLabel: 'Unified',
    outerClass:
      'rounded-[26px] border border-sky-400/35 bg-[#08101E] shadow-[0_24px_60px_rgba(2,132,199,0.22)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#0B1528] via-[#0E1B33] to-[#08101E] border-b border-sky-400/25',
    titleColorClass: 'text-sky-100',
    subtitleColorClass: 'text-sky-300',
    accentHex: '#38BDF8',
    secondaryHex: '#6366F1',
    badgeLabel: 'AIPETROS · UNIFIED SPATIAL PASS',
    pageBgHex: '#060B16',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 18% 12%, rgba(56,189,248,0.22) 0%, transparent 62%), radial-gradient(ellipse 65% 50% at 85% 82%, rgba(99,102,241,0.18) 0%, transparent 62%), linear-gradient(160deg, #060B16 0%, #091326 52%, #050914 100%)',
    topBarBg: 'rgba(7, 13, 26, 0.84)',
    topBarBorder: 'rgba(56, 189, 248, 0.22)',
    cardSurfaceBg: 'rgba(11, 20, 38, 0.86)',
    cardBorderColor: 'rgba(56, 189, 248, 0.24)',
    activeTabBg: '#38BDF8',
    activeTabText: '#04101E',
    activeTabBorder: '#7DD3FC',
  },
  fc27: {
    key: 'fc27',
    shortLabel: 'FC 27',
    outerClass:
      'rounded-[26px] border-2 border-[#D4AF37]/80 bg-[#0E120B] shadow-[0_24px_64px_rgba(212,175,55,0.24)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#17160C] via-[#241F0E] to-[#0C140D] border-b border-[#D4AF37]/45',
    titleColorClass: 'text-[#F7E396]',
    subtitleColorClass: 'text-[#00E676]',
    accentHex: '#EAB308',
    secondaryHex: '#00E676',
    badgeLabel: 'EA SPORTS FC 27 · ULTIMATE ICON',
    pageBgHex: '#06110B',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 20% 10%, rgba(0,230,118,0.22) 0%, transparent 60%), radial-gradient(ellipse 70% 55% at 84% 26%, rgba(212,175,55,0.24) 0%, transparent 60%), linear-gradient(160deg, #05110A 0%, #0B1A11 48%, #0C0E07 100%)',
    topBarBg: 'rgba(8, 19, 12, 0.86)',
    topBarBorder: 'rgba(212, 175, 55, 0.34)',
    cardSurfaceBg: 'rgba(15, 22, 14, 0.86)',
    cardBorderColor: 'rgba(212, 175, 55, 0.30)',
    activeTabBg: '#EAB308',
    activeTabText: '#110E05',
    activeTabBorder: '#FDE047',
  },
  cs2: {
    key: 'cs2',
    shortLabel: 'CS2',
    outerClass:
      'rounded-[16px] border border-[#A855F7]/55 bg-[#111621] shadow-[0_24px_64px_rgba(168,85,247,0.24)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#161C29] via-[#1F1A33] to-[#121722] border-b border-[#A855F7]/45',
    titleColorClass: 'text-[#F1F5F9]',
    subtitleColorClass: 'text-[#C084FC]',
    accentHex: '#A855F7',
    secondaryHex: '#DE6B24',
    badgeLabel: 'COUNTER-STRIKE 2 · PREMIER',
    pageBgHex: '#090C16',
    pageBgGradient:
      'radial-gradient(ellipse 70% 55% at 22% 14%, rgba(168,85,247,0.24) 0%, transparent 60%), radial-gradient(ellipse 65% 50% at 82% 80%, rgba(222,107,36,0.20) 0%, transparent 60%), linear-gradient(160deg, #090C16 0%, #121526 52%, #0A0E17 100%)',
    topBarBg: 'rgba(12, 16, 28, 0.86)',
    topBarBorder: 'rgba(168, 85, 247, 0.34)',
    cardSurfaceBg: 'rgba(17, 22, 34, 0.88)',
    cardBorderColor: 'rgba(168, 85, 247, 0.28)',
    activeTabBg: '#9333EA',
    activeTabText: '#FFFFFF',
    activeTabBorder: '#D8B4FE',
  },
  valorant: {
    key: 'valorant',
    shortLabel: 'VALORANT',
    outerClass:
      'rounded-none border border-[#FF4655]/70 bg-[#0F1923] shadow-[0_24px_64px_rgba(255,70,85,0.22)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#18222F] via-[#261620] to-[#0F1923] border-b border-[#FF4655]/55',
    titleColorClass: 'text-[#ECE8E1]',
    subtitleColorClass: 'text-[#FF4655]',
    accentHex: '#FF4655',
    secondaryHex: '#19C37D',
    badgeLabel: 'VALORANT · COMPETITIVE ACT',
    pageBgHex: '#0A111A',
    pageBgGradient:
      'radial-gradient(ellipse 72% 55% at 16% 12%, rgba(255,70,85,0.26) 0%, transparent 58%), radial-gradient(ellipse 62% 52% at 84% 78%, rgba(25,195,125,0.16) 0%, transparent 60%), linear-gradient(155deg, #0B121C 0%, #161824 50%, #0A1018 100%)',
    topBarBg: 'rgba(15, 25, 35, 0.88)',
    topBarBorder: 'rgba(255, 70, 85, 0.40)',
    cardSurfaceBg: 'rgba(15, 25, 35, 0.90)',
    cardBorderColor: 'rgba(255, 70, 85, 0.35)',
    activeTabBg: '#FF4655',
    activeTabText: '#FFFFFF',
    activeTabBorder: '#FDA4AF',
    clipStyle: {
      clipPath:
        'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))',
    },
  },
  gta: {
    key: 'gta',
    shortLabel: 'GTA',
    outerClass:
      'rounded-[24px] border border-[#EC4899]/70 bg-[#12071B] shadow-[0_24px_64px_rgba(236,72,153,0.28)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#230B2E] via-[#1B0E2E] to-[#0B1B28] border-b border-[#EC4899]/45',
    titleColorClass: 'text-[#FCE7F3]',
    subtitleColorClass: 'text-[#22D3EE]',
    accentHex: '#EC4899',
    secondaryHex: '#06B6D4',
    badgeLabel: 'GTA VI · VICE CITY SOCIAL CLUB',
    pageBgHex: '#0E0517',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 18% 12%, rgba(236,72,153,0.30) 0%, transparent 60%), radial-gradient(ellipse 70% 55% at 86% 78%, rgba(6,182,212,0.24) 0%, transparent 60%), linear-gradient(155deg, #11061D 0%, #1C0A2B 48%, #091322 100%)',
    topBarBg: 'rgba(18, 7, 29, 0.86)',
    topBarBorder: 'rgba(236, 72, 153, 0.40)',
    cardSurfaceBg: 'rgba(22, 10, 34, 0.88)',
    cardBorderColor: 'rgba(236, 72, 153, 0.34)',
    activeTabBg: '#EC4899',
    activeTabText: '#FFFFFF',
    activeTabBorder: '#F9A8D4',
  },
  rdr2: {
    key: 'rdr2',
    shortLabel: 'RDR2',
    outerClass:
      'rounded-[14px] border-2 border-[#D97706]/65 bg-[#170B07] shadow-[0_24px_64px_rgba(185,28,28,0.28)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#29100B] via-[#1F120A] to-[#140A07] border-b border-[#D97706]/45',
    titleColorClass: 'text-[#F5E6C8]',
    subtitleColorClass: 'text-[#F59E0B]',
    accentHex: '#D97706',
    secondaryHex: '#B91C1C',
    badgeLabel: 'RED DEAD REDEMPTION 2 · OUTLAW LEDGER',
    pageBgHex: '#140906',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 20% 10%, rgba(185,28,28,0.32) 0%, transparent 60%), radial-gradient(ellipse 68% 55% at 84% 82%, rgba(217,119,6,0.24) 0%, transparent 60%), linear-gradient(160deg, #160A07 0%, #22100A 50%, #110805 100%)',
    topBarBg: 'rgba(22, 10, 7, 0.88)',
    topBarBorder: 'rgba(217, 119, 6, 0.38)',
    cardSurfaceBg: 'rgba(27, 13, 9, 0.90)',
    cardBorderColor: 'rgba(217, 119, 6, 0.34)',
    activeTabBg: '#B91C1C',
    activeTabText: '#F5E6C8',
    activeTabBorder: '#F59E0B',
  },
  warzone: {
    key: 'warzone',
    shortLabel: 'WARZONE',
    outerClass:
      'rounded-[12px] border border-[#F59E0B]/60 bg-[#120F0A] shadow-[0_24px_64px_rgba(245,158,11,0.22)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#1F180D] via-[#261B0D] to-[#110E09] border-b border-[#F59E0B]/45',
    titleColorClass: 'text-[#FEF3C7]',
    subtitleColorClass: 'text-[#F59E0B]',
    accentHex: '#F59E0B',
    secondaryHex: '#EA580C',
    badgeLabel: 'CALL OF DUTY: WARZONE · OPERATOR DOSSIER',
    pageBgHex: '#0F0C07',
    pageBgGradient:
      'radial-gradient(ellipse 72% 55% at 22% 12%, rgba(245,158,11,0.24) 0%, transparent 60%), radial-gradient(ellipse 65% 50% at 82% 80%, rgba(234,88,12,0.20) 0%, transparent 60%), linear-gradient(160deg, #0E0B07 0%, #1B150C 52%, #0C0A06 100%)',
    topBarBg: 'rgba(18, 14, 9, 0.88)',
    topBarBorder: 'rgba(245, 158, 11, 0.34)',
    cardSurfaceBg: 'rgba(22, 18, 12, 0.88)',
    cardBorderColor: 'rgba(245, 158, 11, 0.30)',
    activeTabBg: '#F59E0B',
    activeTabText: '#140D04',
    activeTabBorder: '#FCD34D',
  },
  apex: {
    key: 'apex',
    shortLabel: 'APEX',
    outerClass:
      'rounded-none border border-[#DA292A]/70 bg-[#0D0F15] shadow-[0_24px_64px_rgba(218,41,42,0.24)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#210D10] via-[#171922] to-[#0D0F15] border-b border-[#DA292A]/50',
    titleColorClass: 'text-[#F8FAFC]',
    subtitleColorClass: 'text-[#F87171]',
    accentHex: '#DA292A',
    secondaryHex: '#E5E7EB',
    badgeLabel: 'APEX LEGENDS · RANKED BANNER',
    pageBgHex: '#0B0B10',
    pageBgGradient:
      'radial-gradient(ellipse 72% 55% at 18% 12%, rgba(218,41,42,0.28) 0%, transparent 58%), radial-gradient(ellipse 65% 50% at 84% 80%, rgba(148,163,184,0.16) 0%, transparent 60%), linear-gradient(155deg, #0B0B10 0%, #171218 50%, #090A0F 100%)',
    topBarBg: 'rgba(14, 15, 21, 0.88)',
    topBarBorder: 'rgba(218, 41, 42, 0.40)',
    cardSurfaceBg: 'rgba(17, 19, 27, 0.90)',
    cardBorderColor: 'rgba(218, 41, 42, 0.34)',
    activeTabBg: '#DA292A',
    activeTabText: '#FFFFFF',
    activeTabBorder: '#FCA5A5',
    clipStyle: {
      clipPath:
        'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
    },
  },
  nba2k: {
    key: 'nba2k',
    shortLabel: 'NBA 2K',
    outerClass:
      'rounded-[24px] border border-[#F97316]/65 bg-[#120A07] shadow-[0_24px_64px_rgba(249,115,22,0.24)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#241108] via-[#211026] to-[#120A07] border-b border-[#F97316]/45',
    titleColorClass: 'text-[#FFEDD5]',
    subtitleColorClass: 'text-[#FDE047]',
    accentHex: '#F97316',
    secondaryHex: '#A855F7',
    badgeLabel: 'NBA 2K · MYPLAYER PRO-AM',
    pageBgHex: '#0D0705',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 18% 12%, rgba(249,115,22,0.28) 0%, transparent 60%), radial-gradient(ellipse 70% 55% at 84% 78%, rgba(168,85,247,0.24) 0%, transparent 60%), linear-gradient(155deg, #0D0705 0%, #1A0E12 50%, #0C0709 100%)',
    topBarBg: 'rgba(19, 10, 7, 0.88)',
    topBarBorder: 'rgba(249, 115, 22, 0.38)',
    cardSurfaceBg: 'rgba(22, 13, 12, 0.88)',
    cardBorderColor: 'rgba(249, 115, 22, 0.32)',
    activeTabBg: '#F97316',
    activeTabText: '#140903',
    activeTabBorder: '#FDBA74',
  },
  fortnite: {
    key: 'fortnite',
    shortLabel: 'FORTNITE',
    outerClass:
      'rounded-[22px] border-2 border-[#38BDF8]/65 bg-[#081026] shadow-[0_24px_64px_rgba(59,130,246,0.30)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#0E1E4A] via-[#13295E] to-[#08122B] border-b border-[#38BDF8]/45',
    titleColorClass: 'text-[#E0F2FE]',
    subtitleColorClass: 'text-[#FACC15]',
    accentHex: '#3B82F6',
    secondaryHex: '#FACC15',
    badgeLabel: 'FORTNITE · FNCS UNREAL CAREER',
    pageBgHex: '#060D20',
    pageBgGradient:
      'radial-gradient(ellipse 75% 55% at 20% 10%, rgba(59,130,246,0.34) 0%, transparent 60%), radial-gradient(ellipse 68% 52% at 84% 80%, rgba(56,189,248,0.24) 0%, transparent 60%), linear-gradient(155deg, #060D22 0%, #0C1A3D 50%, #060B1A 100%)',
    topBarBg: 'rgba(8, 16, 38, 0.86)',
    topBarBorder: 'rgba(56, 189, 248, 0.38)',
    cardSurfaceBg: 'rgba(11, 22, 50, 0.88)',
    cardBorderColor: 'rgba(56, 189, 248, 0.34)',
    activeTabBg: '#3B82F6',
    activeTabText: '#FFFFFF',
    activeTabBorder: '#7DD3FC',
  },
  dota2: {
    key: 'dota2',
    shortLabel: 'DOTA 2',
    outerClass:
      'rounded-[16px] border border-[#0EA5E9]/55 bg-[#06101B] shadow-[0_24px_64px_rgba(14,165,233,0.24)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#081A2C] via-[#102030] to-[#06101B] border-b border-[#F59E0B]/40',
    titleColorClass: 'text-[#E0F2FE]',
    subtitleColorClass: 'text-[#F59E0B]',
    accentHex: '#0EA5E9',
    secondaryHex: '#F59E0B',
    badgeLabel: 'DOTA 2 · IMMORTAL BATTLE PROFILE',
    pageBgHex: '#040B14',
    pageBgGradient:
      'radial-gradient(ellipse 72% 55% at 18% 12%, rgba(14,165,233,0.28) 0%, transparent 60%), radial-gradient(ellipse 68% 52% at 84% 80%, rgba(245,158,11,0.20) 0%, transparent 60%), linear-gradient(155deg, #040B14 0%, #081829 52%, #040912 100%)',
    topBarBg: 'rgba(5, 14, 24, 0.88)',
    topBarBorder: 'rgba(14, 165, 233, 0.35)',
    cardSurfaceBg: 'rgba(7, 19, 32, 0.90)',
    cardBorderColor: 'rgba(14, 165, 233, 0.30)',
    activeTabBg: '#0EA5E9',
    activeTabText: '#031019',
    activeTabBorder: '#7DD3FC',
  },
  f1: {
    key: 'f1',
    shortLabel: 'F1',
    outerClass:
      'rounded-[14px] border border-[#FF1E00]/65 bg-[#0A0C12] shadow-[0_24px_64px_rgba(255,30,0,0.24)] overflow-hidden',
    headerBgClass:
      'bg-gradient-to-r from-[#21090A] via-[#141720] to-[#0A0C12] border-b border-[#FF1E00]/50',
    titleColorClass: 'text-[#F8FAFC]',
    subtitleColorClass: 'text-[#FF3B1F]',
    accentHex: '#FF1E00',
    secondaryHex: '#38BDF8',
    badgeLabel: 'FORMULA 1 · SUPER LICENCE TELEMETRY',
    pageBgHex: '#07080C',
    pageBgGradient:
      'radial-gradient(ellipse 72% 55% at 20% 10%, rgba(255,30,0,0.28) 0%, transparent 58%), radial-gradient(ellipse 65% 50% at 84% 80%, rgba(56,189,248,0.16) 0%, transparent 60%), linear-gradient(155deg, #07080C 0%, #141117 50%, #07090E 100%)',
    topBarBg: 'rgba(10, 12, 18, 0.88)',
    topBarBorder: 'rgba(255, 30, 0, 0.40)',
    cardSurfaceBg: 'rgba(14, 17, 24, 0.90)',
    cardBorderColor: 'rgba(255, 30, 0, 0.32)',
    activeTabBg: '#FF1E00',
    activeTabText: '#FFFFFF',
    activeTabBorder: '#FCA5A5',
  },
  chess: {
    key: 'chess',
    shortLabel: 'Chess 10s',
    outerClass:
      'rounded-[22px] border border-[#81B64C]/55 bg-[#22201D] shadow-[0_24px_60px_rgba(129,182,76,0.20)] overflow-hidden',
    headerBgClass: 'bg-[#2C2926] border-b border-[#81B64C]/45',
    titleColorClass: 'text-[#F4F1EA]',
    subtitleColorClass: 'text-[#81B64C]',
    accentHex: '#81B64C',
    secondaryHex: '#EEEED2',
    badgeLabel: 'CHESS.COM · HYPERBULLET 10S',
    pageBgHex: '#171513',
    pageBgGradient:
      'radial-gradient(ellipse 72% 55% at 20% 12%, rgba(129,182,76,0.24) 0%, transparent 60%), radial-gradient(ellipse 65% 50% at 84% 80%, rgba(168,162,158,0.14) 0%, transparent 60%), linear-gradient(155deg, #171513 0%, #24211D 52%, #141210 100%)',
    topBarBg: 'rgba(26, 24, 21, 0.88)',
    topBarBorder: 'rgba(129, 182, 76, 0.34)',
    cardSurfaceBg: 'rgba(38, 36, 33, 0.90)',
    cardBorderColor: 'rgba(129, 182, 76, 0.30)',
    activeTabBg: '#81B64C',
    activeTabText: '#141A0E',
    activeTabBorder: '#BEF264',
  },
};
