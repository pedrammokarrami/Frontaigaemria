import type { CrossGameKey } from '../../data/offlineAgentsData';

export interface LabRoomEnvironment {
  key: CrossGameKey;
  imageUrl: string;
  labNameFa: string;
  labNameEn: string;
  ambientBgHex: string;
  beamPrimaryHex: string;
  beamSecondaryHex: string;
  roomRimHex: string;
  floorGlowHex: string;
}

/**
 * Client-only registry of Unreal Engine 5.8 Lumen Engineering Lab rooms
 * for all 11 registered game spaces (+ Unified & Chess).
 * Each game dynamically switches the 3D architectural chamber and volumetric beam/rim lighting.
 */
export const LAB_ROOM_ENVIRONMENTS: Record<CrossGameKey, LabRoomEnvironment> = {
  unified: {
    key: 'unified',
    imageUrl: '/src/assets/images/lab_room_unified_1795174736509.jpg',
    labNameFa: 'لابراتوار مرکزی AIPETROS',
    labNameEn: 'Core Character Forge Lab · UE 5.8',
    ambientBgHex: '#050b16',
    beamPrimaryHex: '#38BDF8',
    beamSecondaryHex: '#BAE6FD',
    roomRimHex: '#60A5FA',
    floorGlowHex: '#0EA5E9',
  },
  fc27: {
    key: 'fc27',
    imageUrl: '/src/assets/images/lab_room_fc27_1795174738692.jpg',
    labNameFa: 'لابراتوار استادیوم FC 27',
    labNameEn: 'Stadium Mocap Engineering Lab · UE 5.8',
    ambientBgHex: '#04100B',
    beamPrimaryHex: '#00E676',
    beamSecondaryHex: '#FACC15',
    roomRimHex: '#34D399',
    floorGlowHex: '#10B981',
  },
  nba2k: {
    key: 'nba2k',
    imageUrl: '/src/assets/images/lab_room_fc27_1795174738692.jpg',
    labNameFa: 'لابراتوار سالن پارکت NBA 2K',
    labNameEn: 'Pro-AM Hardwood Mocap Lab · UE 5.8',
    ambientBgHex: '#100805',
    beamPrimaryHex: '#F97316',
    beamSecondaryHex: '#A855F7',
    roomRimHex: '#FDBA74',
    floorGlowHex: '#EA580C',
  },
  fortnite: {
    key: 'fortnite',
    imageUrl: '/src/assets/images/lab_room_unified_1795174736509.jpg',
    labNameFa: 'لابراتوار طوفان FORTNITE',
    labNameEn: 'FNCS Storm Forge Chamber · UE 5.8',
    ambientBgHex: '#060C1C',
    beamPrimaryHex: '#3B82F6',
    beamSecondaryHex: '#38BDF8',
    roomRimHex: '#60A5FA',
    floorGlowHex: '#2563EB',
  },
  dota2: {
    key: 'dota2',
    imageUrl: '/src/assets/images/lab_room_chess_1795174736568.jpg',
    labNameFa: 'لابراتوار انشنت DOTA 2',
    labNameEn: 'Ancient Sanctum Strategy Lab · UE 5.8',
    ambientBgHex: '#040C16',
    beamPrimaryHex: '#0EA5E9',
    beamSecondaryHex: '#F59E0B',
    roomRimHex: '#38BDF8',
    floorGlowHex: '#0284C7',
  },
  f1: {
    key: 'f1',
    imageUrl: '/src/assets/images/lab_room_valorant_1795174736628.jpg',
    labNameFa: 'لابراتوار پیت‌لین F1',
    labNameEn: 'Wind-Tunnel Telemetry Lab · UE 5.8',
    ambientBgHex: '#08090D',
    beamPrimaryHex: '#FF1E00',
    beamSecondaryHex: '#38BDF8',
    roomRimHex: '#F87171',
    floorGlowHex: '#DC2626',
  },
  warzone: {
    key: 'warzone',
    imageUrl: '/src/assets/images/lab_room_cs2_1795174736867.jpg',
    labNameFa: 'لابراتوار عملیات ویژه WARZONE',
    labNameEn: 'Tactical Armory Operations Lab · UE 5.8',
    ambientBgHex: '#0E0B07',
    beamPrimaryHex: '#F59E0B',
    beamSecondaryHex: '#EA580C',
    roomRimHex: '#FBBF24',
    floorGlowHex: '#D97706',
  },
  cs2: {
    key: 'cs2',
    imageUrl: '/src/assets/images/lab_room_cs2_1795174736867.jpg',
    labNameFa: 'لابراتوار بالستیک CS2',
    labNameEn: 'Tactical Ballistics Forge Lab · UE 5.8',
    ambientBgHex: '#0B0D14',
    beamPrimaryHex: '#A855F7',
    beamSecondaryHex: '#38BDF8',
    roomRimHex: '#C084FC',
    floorGlowHex: '#9333EA',
  },
  gta: {
    key: 'gta',
    imageUrl: '/src/assets/images/lab_room_unified_1795174736509.jpg',
    labNameFa: 'پنت‌هاوس نئونی GTA',
    labNameEn: 'Vice City Neon Penthouse Lab · UE 5.8',
    ambientBgHex: '#100618',
    beamPrimaryHex: '#EC4899',
    beamSecondaryHex: '#06B6D4',
    roomRimHex: '#F472B6',
    floorGlowHex: '#DB2777',
  },
  rdr2: {
    key: 'rdr2',
    imageUrl: '/src/assets/images/lab_room_cs2_1795174736867.jpg',
    labNameFa: 'اتاق فرماندهی سرحد RDR2',
    labNameEn: 'Frontier Twilight Forge Lab · UE 5.8',
    ambientBgHex: '#130906',
    beamPrimaryHex: '#D97706',
    beamSecondaryHex: '#B91C1C',
    roomRimHex: '#F59E0B',
    floorGlowHex: '#991B1B',
  },
  apex: {
    key: 'apex',
    imageUrl: '/src/assets/images/lab_room_valorant_1795174736628.jpg',
    labNameFa: 'لابراتوار سفینه پرش APEX',
    labNameEn: 'Outlands Dropship Forge Lab · UE 5.8',
    ambientBgHex: '#0B0B10',
    beamPrimaryHex: '#DA292A',
    beamSecondaryHex: '#E5E7EB',
    roomRimHex: '#EF4444',
    floorGlowHex: '#B91C1C',
  },
  valorant: {
    key: 'valorant',
    imageUrl: '/src/assets/images/lab_room_valorant_1795174736628.jpg',
    labNameFa: 'لابراتوار ایجنت VALORANT',
    labNameEn: 'Radianite Agent Forge Lab · UE 5.8',
    ambientBgHex: '#0D0810',
    beamPrimaryHex: '#FF4655',
    beamSecondaryHex: '#19C37D',
    roomRimHex: '#FB7185',
    floorGlowHex: '#E11D48',
  },
  chess: {
    key: 'chess',
    imageUrl: '/src/assets/images/lab_room_chess_1795174736568.jpg',
    labNameFa: 'لابراتوار کوانتومی شطرنج ۱۰ ثانیه',
    labNameEn: 'Quantum Strategy Engineering Lab · UE 5.8',
    ambientBgHex: '#12110F',
    beamPrimaryHex: '#81B64C',
    beamSecondaryHex: '#FDE68A',
    roomRimHex: '#A3E635',
    floorGlowHex: '#65A30D',
  },
};
