import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  Compass,
  Star,
  MapPin,
  Music,
  Navigation,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useLanguage as _useLang2 } from '../../contexts/LanguageContext';
import {
  type MapEntityKind,
  type PlatformMapEntity,
  filterMapEntities,
  formatDistanceLabel,
} from '../../utils/platformMapEngine';
import type { MasterHubId } from './MasterHubSwitcher';
import LiveGrid3D from './LiveGrid3D';
import {
  buildFallbackGrid,
  fetchLiveGrid,
  projectToViewport,
  LIVE_GRID_PRESETS,
  type GridCoord,
  type LiveGrid,
} from '../../utils/liveGridEngine';

interface PlatformMapModalProps {
  open: boolean;
  activeHub: MasterHubId;
  onClose: () => void;
  onJumpToStoreCollection: (collectionId?: string) => void;
}

const RADIUS_STEPS: Array<{ labelEn: string; labelFa: string; meters: number | null }> = [
  { labelEn: '500m', labelFa: '۵۰۰ متر', meters: 500 },
  { labelEn: '1km', labelFa: '۱ کیلومتر', meters: 1000 },
  { labelEn: '2km', labelFa: '۲ کیلومتر', meters: 2000 },
  { labelEn: 'All Area', labelFa: 'کل محدوده', meters: null },
];

/** VisionOS-style spatial glass theme tokens per master hub. */
interface MapTheme {
  canvasBg: string;
  scrim: string;
  headerText: string;
  headerMuted: string;
  glassChip: string;
  glassChipActive: string;
  searchGlass: string;
  closeBtn: string;
  card: string;
  cardPrimaryBtn: string;
  cardSecondaryBtn: string;
  mutedText: string;
  ratingBadge: string;
  youHalo: string;
  youChip: string;
  pin: Record<MapEntityKind, string>;
  pinSelectedRing: string;
}

const GAME_THEME: MapTheme = {
  canvasBg: '#05070D',
  scrim: 'bg-gradient-to-b from-[#05070D]/85 via-[#05070D]/35 to-transparent',
  headerText: 'text-slate-100',
  headerMuted: 'text-slate-400',
  glassChip: 'bg-white/[0.07] border-white/12 text-slate-300 backdrop-blur-xl hover:bg-white/[0.12]',
  glassChipActive: 'bg-[#37E6F5] border-[#37E6F5] text-[#04121A] shadow-[0_0_18px_rgba(55,230,245,0.35)]',
  searchGlass: 'bg-white/[0.07] border-white/12 text-slate-100 placeholder:text-slate-500 backdrop-blur-xl',
  closeBtn: 'bg-white/[0.08] border-white/14 text-slate-200 hover:bg-white/[0.16] backdrop-blur-xl',
  card: 'bg-[#0A1220]/78 border-white/14 text-slate-100 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl',
  cardPrimaryBtn: 'bg-[#37E6F5] text-[#04121A] hover:brightness-110 shadow-[0_6px_20px_rgba(55,230,245,0.3)]',
  cardSecondaryBtn: 'bg-white/[0.1] border-white/16 text-slate-200 hover:bg-white/[0.16]',
  mutedText: 'text-slate-400',
  ratingBadge: 'bg-white/[0.09] border-white/14 text-amber-300',
  youHalo: 'bg-[#37E6F5]',
  youChip: 'bg-[#0A1220]/85 border-[#37E6F5]/60 text-[#7FEFFB]',
  pin: {
    user: 'bg-[#37E6F5] text-[#04121A] border-white/70',
    club: 'bg-[#8B7CF6] text-white border-white/70',
    store: 'bg-[#FFD34D] text-[#231A02] border-white/70',
    drop: 'bg-[#FF4D8D] text-white border-white/70',
  },
  pinSelectedRing: 'ring-4 ring-[#37E6F5]/45',
};

const AUDIO_THEME: MapTheme = {
  canvasBg: '#100C08',
  scrim: 'bg-gradient-to-b from-[#100C08]/85 via-[#100C08]/30 to-transparent',
  headerText: 'text-[#F6EFE2]',
  headerMuted: 'text-[#CBB795]/85',
  glassChip: 'bg-white/[0.07] border-[#E8B96B]/20 text-[#EAD9BC] backdrop-blur-xl hover:bg-white/[0.12]',
  glassChipActive: 'bg-[#E8A94B] border-[#E8A94B] text-[#2A1B06] shadow-[0_0_18px_rgba(232,169,75,0.32)]',
  searchGlass: 'bg-white/[0.07] border-[#E8B96B]/25 text-[#F6EFE2] placeholder:text-[#CBB795]/60 backdrop-blur-xl',
  closeBtn: 'bg-white/[0.08] border-[#E8B96B]/25 text-[#F6EFE2] hover:bg-white/[0.16] backdrop-blur-xl',
  card: 'bg-[#17110A]/80 border-[#E8B96B]/25 text-[#F6EFE2] shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl',
  cardPrimaryBtn: 'bg-[#E8A94B] text-[#2A1B06] hover:brightness-110 shadow-[0_6px_20px_rgba(232,169,75,0.28)]',
  cardSecondaryBtn: 'bg-white/[0.1] border-[#E8B96B]/30 text-[#F6EFE2] hover:bg-white/[0.16]',
  mutedText: 'text-[#CBB795]/80',
  ratingBadge: 'bg-white/[0.09] border-[#E8B96B]/25 text-[#E8A94B]',
  youHalo: 'bg-[#E8A94B]',
  youChip: 'bg-[#17110A]/85 border-[#E8A94B]/60 text-[#F3CE96]',
  pin: {
    user: 'bg-[#34C48D] text-[#06231A] border-white/70',
    club: 'bg-[#E8A94B] text-[#2A1B06] border-white/70',
    store: 'bg-[#F2D794] text-[#2A1B06] border-white/70',
    drop: 'bg-[#C96A4A] text-[#FFF3E8] border-white/70',
  },
  pinSelectedRing: 'ring-4 ring-[#E8A94B]/45',
};

const CINEMA_THEME: MapTheme = {
  canvasBg: '#EFE1C2',
  scrim: 'bg-gradient-to-b from-[#3A2410]/38 via-[#3A2410]/10 to-transparent',
  headerText: 'text-[#2D1B0B]',
  headerMuted: 'text-[#5C3A1B]/85',
  glassChip: 'bg-[#FFFBEF]/62 border-[#6B411C]/22 text-[#3A2410] backdrop-blur-xl hover:bg-[#FFFBEF]/85',
  glassChipActive: 'bg-[#7B2C35] border-[#7B2C35] text-[#F8ECD4] shadow-[0_4px_16px_rgba(123,44,53,0.3)]',
  searchGlass: 'bg-[#FFFBEF]/62 border-[#6B411C]/25 text-[#2D1B0B] placeholder:text-[#5C3A1B]/60 backdrop-blur-xl',
  closeBtn: 'bg-[#FFFBEF]/70 border-[#6B411C]/30 text-[#2D1B0B] hover:bg-[#7B2C35] hover:text-[#F8ECD4] backdrop-blur-xl',
  card: 'bg-[#FFFBEF]/82 border-[#6B411C]/22 text-[#2D1B0B] shadow-[0_24px_70px_rgba(40,20,5,0.45)] backdrop-blur-2xl',
  cardPrimaryBtn: 'bg-[#7B2C35] text-[#F8ECD4] hover:brightness-110 shadow-[0_6px_20px_rgba(123,44,53,0.3)]',
  cardSecondaryBtn: 'bg-[#3A2410]/12 border-[#6B411C]/28 text-[#2D1B0B] hover:bg-[#3A2410]/20',
  mutedText: 'text-[#5C3A1B]/85',
  ratingBadge: 'bg-[#7B2C35] text-[#F8ECD4]',
  youHalo: 'bg-[#7B2C35]',
  youChip: 'bg-[#3A2410]/88 border-[#7B2C35]/55 text-[#F4E4C8]',
  pin: {
    user: 'bg-[#B98A4C] text-[#FFF6E3] border-white/70',
    club: 'bg-[#7B2C35] text-[#F8ECD4] border-white/70',
    store: 'bg-[#3A2410] text-[#F4E4C8] border-white/70',
    drop: 'bg-[#9C4238] text-[#FFF3E2] border-white/70',
  },
  pinSelectedRing: 'ring-4 ring-[#7B2C35]/35',
};

const HUB_THEMES: Record<MasterHubId, MapTheme> = {
  game: GAME_THEME,
  audio: AUDIO_THEME,
  cinema: CINEMA_THEME,
};

/** Night City — deep dark canvas, controlled teal neon, soft smooth avenues. */
const NightCityCanvas: React.FC = () => (
  <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none">
    <defs>
      <radialGradient id="nc-core" cx="50%" cy="46%" r="58%">
        <stop offset="0%" stopColor="rgba(30,214,235,0.16)" />
        <stop offset="45%" stopColor="rgba(30,214,235,0.05)" />
        <stop offset="100%" stopColor="rgba(5,7,13,0)" />
      </radialGradient>
      <radialGradient id="nc-corner" cx="85%" cy="90%" r="45%">
        <stop offset="0%" stopColor="rgba(139,124,246,0.1)" />
        <stop offset="100%" stopColor="rgba(5,7,13,0)" />
      </radialGradient>
      <filter id="nc-blur" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
    </defs>
    <rect width="800" height="600" fill="#05070D" />
    <rect width="800" height="600" fill="url(#nc-core)" />
    <rect width="800" height="600" fill="url(#nc-corner)" />
    {/* Soft glowing light bloom patches (district ambience) */}
    <ellipse cx="620" cy="150" rx="120" ry="70" fill="rgba(255,77,141,0.07)" filter="url(#nc-blur)" />
    <ellipse cx="170" cy="430" rx="130" ry="80" fill="rgba(30,214,235,0.06)" filter="url(#nc-blur)" />
    <ellipse cx="430" cy="500" rx="110" ry="60" fill="rgba(139,124,246,0.07)" filter="url(#nc-blur)" />
    {/* Smooth, calm avenues with gentle glow */}
    <g fill="none" strokeLinecap="round" filter="url(#nc-blur)" strokeOpacity="0.5">
      <path d="M-40 210 C 200 190, 420 250, 840 205" stroke="#2BD9EA" strokeWidth="7" />
      <path d="M-40 210 C 200 190, 420 250, 840 205" stroke="#2BD9EA" strokeWidth="1.4" strokeOpacity="0.9" />
      <path d="M255 -40 C 240 180, 300 420, 275 640" stroke="#8B7CF6" strokeWidth="6" strokeOpacity="0.35" />
      <path d="M255 -40 C 240 180, 300 420, 275 640" stroke="#8B7CF6" strokeWidth="1.2" strokeOpacity="0.55" />
      <path d="M-40 470 C 260 440, 560 480, 840 445" stroke="#FFD34D" strokeWidth="5" strokeOpacity="0.25" />
      <path d="M-40 470 C 260 440, 560 480, 840 445" stroke="#FFD34D" strokeWidth="1" strokeOpacity="0.4" />
    </g>
    {/* Sparse ambient city light nodes */}
    <g fill="#7FEFFB">
      {[[95, 120, 0.5], [540, 90, 0.4], [700, 330, 0.45], [120, 555, 0.35], [660, 545, 0.4], [390, 90, 0.3]].map(
        ([cx, cy, o], i) => (
          <circle key={i} cx={cx as number} cy={cy as number} r="2.5" opacity={o as number} />
        )
      )}
    </g>
  </svg>
);

/** Harmonic Stage — warm amber/emerald, vinyl grooves & flowing staff. */
const HarmonicCanvas: React.FC = () => (
  <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none">
    <defs>
      <radialGradient id="hs-glow" cx="50%" cy="46%" r="60%">
        <stop offset="0%" stopColor="rgba(232,169,75,0.14)" />
        <stop offset="55%" stopColor="rgba(52,196,141,0.05)" />
        <stop offset="100%" stopColor="rgba(16,12,8,0)" />
      </radialGradient>
      <filter id="hs-blur" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="16" />
      </filter>
    </defs>
    <rect width="800" height="600" fill="#100C08" />
    <rect width="800" height="600" fill="url(#hs-glow)" />
    <ellipse cx="180" cy="140" rx="130" ry="75" fill="rgba(232,169,75,0.08)" filter="url(#hs-blur)" />
    <ellipse cx="640" cy="470" rx="120" ry="70" fill="rgba(52,196,141,0.07)" filter="url(#hs-blur)" />
    {/* Concentric vinyl grooves, thin and calm */}
    <g fill="none" stroke="#E8A94B">
      {[70, 115, 160, 205, 250].map((r) => (
        <circle key={r} cx="400" cy="300" r={r} strokeOpacity={r === 205 ? 0.3 : 0.12} strokeWidth={r === 205 ? 1.4 : 0.8} />
      ))}
    </g>
    {/* Flowing musical staff */}
    <g fill="none" stroke="#E8A94B" strokeOpacity="0.2" strokeWidth="1.1">
      {[-18, -9, 0, 9, 18].map((o) => (
        <path key={o} d={`M-40 ${290 + o} C 200 ${230 + o}, 480 ${330 + o}, 840 ${285 + o}`} />
      ))}
    </g>
    <text x="52" y="330" fontSize="72" fill="#E8A94B" fillOpacity="0.32" aria-hidden="true">𝄞</text>
    <text x="688" y="272" fontSize="34" fill="#34C48D" fillOpacity="0.4" aria-hidden="true">♫</text>
  </svg>
);

/** Theatrical Treasure — warm parchment paper, beige & wine accents. */
const TheatricalCanvas: React.FC = () => (
  <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none">
    <defs>
      <radialGradient id="tt-paper" cx="50%" cy="44%" r="68%">
        <stop offset="0%" stopColor="#F4E7CC" />
        <stop offset="68%" stopColor="#E6D0A8" />
        <stop offset="100%" stopColor="#CBAE7F" />
      </radialGradient>
      <filter id="tt-blur" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="18" />
      </filter>
    </defs>
    <rect width="800" height="600" fill="url(#tt-paper)" />
    {/* Soft watercolor landmasses */}
    <path
      d="M110,110 C190,60 300,95 325,175 C348,250 280,330 195,315 C120,300 55,170 110,110 Z"
      fill="#D2AF7A" fillOpacity="0.4" stroke="#5D3A1A" strokeOpacity="0.35" strokeWidth="1.6"
    />
    <path
      d="M500,90 C610,70 730,120 740,225 C748,330 650,440 535,410 C445,385 440,160 500,90 Z"
      fill="#CFA872" fillOpacity="0.4" stroke="#5D3A1A" strokeOpacity="0.35" strokeWidth="1.6"
    />
    <ellipse cx="180" cy="470" rx="140" ry="70" fill="#B98A4C" fillOpacity="0.16" filter="url(#tt-blur)" />
    {/* Smooth dashed treasure trail */}
    <path
      d="M200,160 Q340,230 405,275 T 590,170 T 480,360"
      fill="none" stroke="#7B2C35" strokeWidth="2.6" strokeDasharray="11 9" strokeLinecap="round" strokeOpacity="0.65"
    />
    {/* Elegant compass rose */}
    <g transform="translate(716, 520)" stroke="#4B2E14" fill="none">
      <circle r="32" strokeOpacity="0.5" strokeWidth="1.3" />
      <polygon points="0,-30 6,-6 30,0 6,6 0,30 -6,6 -30,0 -6,-6" fill="#7B2C35" fillOpacity="0.7" stroke="none" />
      <text x="-4" y="-37" fontSize="11" fontWeight="bold" fill="#4B2E14" stroke="none">N</text>
    </g>
  </svg>
);

const HUB_CANVAS: Record<MasterHubId, React.FC> = {
  game: NightCityCanvas,
  audio: HarmonicCanvas,
  cinema: TheatricalCanvas,
};

/** Keep pins inside the free band between the floating header (top ~29%) and
 * the floating glass card (bottom ~30%) so nothing ever collides. */
const PIN_BAND_TOP = 31;
const PIN_BAND_BOTTOM = 67;
const pinTopPct = (yPct: number): number => {
  const clamped = Math.min(86, Math.max(14, yPct));
  return PIN_BAND_TOP + ((clamped - 14) / (86 - 14)) * (PIN_BAND_BOTTOM - PIN_BAND_TOP);
};

const KIND_PIN_ICON: Record<MapEntityKind, React.ReactNode> = {
  user: <Users className="w-4 h-4" />,
  club: <Sparkles className="w-4 h-4" />,
  store: <Store className="w-4 h-4" />,
  drop: <MapPin className="w-4 h-4" />,
};

export const PlatformMapModal: React.FC<PlatformMapModalProps> = ({
  open,
  activeHub,
  onClose,
  onJumpToStoreCollection,
}) => {
  const { isRtl, copy, languageCode } = useLanguage();
  const isFa = languageCode === 'fa' || languageCode.startsWith('fa') || languageCode === 'prs';
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | MapEntityKind>('all');
  const [radiusMeters, setRadiusMeters] = useState<number | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [pingedIds, setPingedIds] = useState<Record<string, boolean>>({});
  const [waypointId, setWaypointId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = React.useRef<number | null>(null);
  const showToast = React.useCallback((text: string) => {
    setToast(text);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4000);
  }, []);
  const KIND_LABEL_FA: Record<MapEntityKind, string> = {
    user: 'NEARBY PLAYER',
    club: 'CLUB HQ',
    store: 'AIPETROS STORE',
    drop: 'DROP ZONE',
  };
  // GTA V minimap bars — deterministic per session (no fake randomness)
  const GTA_BARS = { health: 86, armor: 72, stamina: 64 };

  // Auto-start: attempt real GPS on open, fall back to Tehran Azadi when blocked
  const autoStartedRef = React.useRef(false);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    if (!autoStartedRef.current && !liveGrid && !gridLoading) {
      autoStartedRef.current = true;
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setHomeLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: Math.round(pos.coords.accuracy) });
            setHomeError(null);
            loadLiveGrid({ lat: pos.coords.latitude, lng: pos.coords.longitude }, isFa ? 'موقعیت واقعی شما (GPS)' : 'Your real location (GPS)');
          },
          () => {
            setHomeError('unavailable');
            loadLiveGrid({ lat: 35.6997, lng: 51.338 }, isFa ? 'تهران - میدان آزادی (پیش‌فرض)' : 'Tehran - Azadi Square (default)');
          },
          { timeout: 4500 }
        );
      } else {
        loadLiveGrid({ lat: 35.6997, lng: 51.338 }, isFa ? 'تهران - میدان آزادی' : 'Tehran - Azadi Square');
      }
    }
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose]);

  const entities = useMemo(
    () =>
      filterMapEntities({
        hub: activeHub,
        query,
        kind: kindFilter,
        maxDistanceMeters: radiusMeters,
      }),
    [activeHub, query, kindFilter, radiusMeters]
  );

  // 3D radar blips: entities positioned in meters relative to the real GPS center
  const radarBlips = React.useMemo(() => {
    const palette: Record<MapEntityKind, string> = {
      user: '#22d3ee',
      club: '#f43f5e',
      store: '#facc15',
      drop: '#4ade80',
    };
    const span = 1075; // meters across (matches the grid span)
    const nameOf = (entity: PlatformMapEntity) => (isRtl ? entity.nameFa : entity.nameEn);
    return entities.slice(0, 8).map((e) => ({
      id: e.id,
      title: nameOf(e),
      color: palette[e.kind],
      offsetX: Math.round(((e.xPct - 50) / 100) * span),
      offsetZ: Math.round(((e.yPct - 50) / 100) * span),
    }));
  }, [entities, isRtl]);

  // ── LIVE GRID: real OSM buildings + roads around a coordinate ──
  const [liveGrid, setLiveGrid] = useState<LiveGrid | null>(null);
  const [gridLoading, setGridLoading] = useState(false);
  const [gridError, setGridError] = useState<string | null>(null);
  // watchdog: whatever happens (old phone browser, dead network), the loader
  // must NEVER spin forever — after 40s force the simulation city
  const gridWatchdogRef = React.useRef<number | null>(null);
  const clearGridWatchdog = React.useCallback(() => {
    if (gridWatchdogRef.current) {
      window.clearTimeout(gridWatchdogRef.current);
      gridWatchdogRef.current = null;
    }
  }, []);
  const loadLiveGrid = React.useCallback((center: GridCoord, label: string) => {
    setGridLoading(true);
    setGridError(null);
    clearGridWatchdog();
    gridWatchdogRef.current = window.setTimeout(() => {
      gridWatchdogRef.current = null;
      setLiveGrid(buildFallbackGrid(center, label)); // شبیه‌سازی شهری — لودر هیچ‌وقت نمی‌مونه
      setGridError('grid-failed');
      setGridLoading(false);
      showToast(isFa
        ? '⏱ سرور نقشه دیر جواب داد؛ نمای شبیه‌سازی شهری بارگذاری شد.'
        : 'Map server was slow — simulation city view loaded');
    }, 40000);
    fetchLiveGrid(center, label)
      .then((grid) => {
        if (gridWatchdogRef.current) {
          window.clearTimeout(gridWatchdogRef.current);
          gridWatchdogRef.current = null;
        }
        setLiveGrid(grid);
      })
      .catch(() => {
        if (gridWatchdogRef.current) {
          window.clearTimeout(gridWatchdogRef.current);
          gridWatchdogRef.current = null;
        }
        setLiveGrid(buildFallbackGrid(center, label)); // شبیه‌سازی شهری وقتی سرور شلوغه
        setGridError('grid-failed');
        showToast(isFa
          ? '⚠️ سرور نقشه شلوغ بود؛ نمای شبیه‌سازی شهری بارگذاری شد.'
          : 'Map server busy — simulation city view loaded');
      })
      .finally(() => setGridLoading(false));
  }, []);

  // ── Real home location (GPS) — shown live in the GTA-style HUD ──
  const [homeLocation, setHomeLocation] = useState<{ lat: number; lng: number; accuracyM: number } | null>(null);
  const [homeError, setHomeError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    if (!('geolocation' in navigator)) {
      setHomeError('no-gps');
      return;
    }
    let cancelled = false;
    const id = navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setHomeLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: Math.round(pos.coords.accuracy),
        });
        setHomeError(null);
        loadLiveGrid({ lat: pos.coords.latitude, lng: pos.coords.longitude }, isFa ? 'لوکیشن من (GPS)' : 'My location (GPS)');
      },
      (err) => {
        if (!cancelled) setHomeError(err.code === 1 ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
    return () => {
      cancelled = true;
      if (id !== undefined) navigator.geolocation.clearWatch(id as number);
    };
  }, [open]);

  useEffect(() => {
    setSelectedEntityId(entities[0]?.id ?? null);
  }, [activeHub, open]);

  const selectedEntity: PlatformMapEntity | null = useMemo(() => {
    if (selectedEntityId) {
      const hit = entities.find((e) => e.id === selectedEntityId);
      if (hit) return hit;
    }
    return entities[0] ?? null;
  }, [entities, selectedEntityId]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setKindFilter('all');
      setRadiusMeters(null);
    }
  }, [activeHub]);

  if (typeof document === 'undefined') return null;

  const theme = HUB_THEMES[activeHub];
  const isCinema = activeHub === 'cinema';

  const headerTitle = isCinema
    ? copy.mapTitleCinema
    : activeHub === 'audio'
      ? copy.mapTitleAudio
      : copy.mapTitleGame;

  const headerSubtitle = isCinema
    ? copy.mapSubtitleCinema
    : activeHub === 'audio'
      ? copy.mapSubtitleAudio
      : copy.mapSubtitleGame;

  const kindChips: Array<{ id: 'all' | MapEntityKind; label: string }> = [
    { id: 'all', label: copy.mapFilterAll },
    { id: 'user', label: copy.mapFilterUsers },
    { id: 'club', label: copy.mapFilterClubs },
    { id: 'store', label: copy.mapFilterStores },
    { id: 'drop', label: copy.mapFilterDrops },
  ];

  const MapCanvas = HUB_CANVAS[activeHub];

  const entityName = (entity: PlatformMapEntity) => (isRtl ? entity.nameFa : entity.nameEn);
  const entityDistrict = (entity: PlatformMapEntity) => (isRtl ? entity.districtFa : entity.districtEn);
  const entitySubtitle = (entity: PlatformMapEntity) => (isRtl ? entity.subtitleFa : entity.subtitleEn);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="spatial-glass-map"
          dir={isRtl ? 'rtl' : 'ltr'}
          role="dialog"
          aria-modal="true"
          aria-label={headerTitle}
          data-testid={`platform-map-modal-${activeHub}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          style={{ backgroundColor: theme.canvasBg, ...(isCinema ? { fontFamily: "'Cormorant Garamond', Georgia, serif" } : {}) }}
          className="fixed inset-0 z-[95] overflow-hidden select-none"
        >
          {/* Unified deep map canvas */}
          <MapCanvas />

          {/* WebGL unsupported hint (weak phone browsers) */}
          <div
            data-testid="webgl-unsupported-hint"
            className="absolute inset-x-0 top-1/2 z-20 flex justify-center pointer-events-none"
            style={{ display: 'none' }}
            ref={(el) => {
              const g3d = document.querySelector<HTMLElement>('[data-testid="live-grid-3d"]');
              if (el) el.style.display = g3d?.dataset.webgl === 'unsupported' ? 'flex' : 'none';
            }}
          >
            <span className="bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs px-3 py-2 rounded-xl backdrop-blur-sm">
              ⚠️ مرورگرت WebGL رو پشتیبانی نمی‌کنه — نقشه ۳بعدی غیرفعاله. با Chrome/Edge باز کن.
            </span>
          </div>

          {/* ── GTA V 3D LIVE RADAR (WebGL, real OSM geometry) ── */}
          {liveGrid && (
            <LiveGrid3D
              grid={liveGrid}
              blips={radarBlips}
              selectedBlipId={selectedEntityId}
              waypointBlipId={waypointId}
              onPickBlip={(id) => setSelectedEntityId(id)}
            />
          )}

          {/* ── LIVE GRID fallback SVG (2D projection) ── */}
          {liveGrid && (
            <svg
              data-testid="live-grid-svg"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 3, opacity: 0.95 }}
              aria-hidden="true"
            >
              {liveGrid.roads.map((way, i) => {
                const pts = way.points.reduce<string[]>((acc, v, idx) => {
                  if (idx % 2 !== 0) return acc;
                  const { xPct, yPct } = projectToViewport(liveGrid.center, liveGrid.radiusM, { lat: v, lng: way.points[idx + 1] });
                  acc.push(`${xPct.toFixed(2)},${yPct.toFixed(2)}`);
                  return acc;
                }, []);
                return <polyline key={`r${i}`} points={pts.join(' ')} fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth={way.roadClass === 'primary' || way.roadClass === 'secondary' ? 1.1 : 0.6} strokeLinecap="round" />;
              })}
              {liveGrid.buildings.map((way, i) => {
                const pts = way.points.reduce<string[]>((acc, v, idx) => {
                  if (idx % 2 !== 0) return acc;
                  const { xPct, yPct } = projectToViewport(liveGrid.center, liveGrid.radiusM, { lat: v, lng: way.points[idx + 1] });
                  acc.push(`${xPct.toFixed(2)},${yPct.toFixed(2)}`);
                  return acc;
                }, []);
                return <polygon key={`b${i}`} points={pts.join(' ')} fill="rgba(16,185,129,0.16)" stroke="rgba(52,211,153,0.5)" strokeWidth="0.28" />;
              })}
            </svg>
          )}

          {/* Radar vignette (GTA skin) */}
          <div className="radar-vignette" aria-hidden="true" />

          {/* You marker — GTA blip with real GPS coordinates */}
          <div className="gta-blip active" style={{ left: '50%', top: '50%', zIndex: 10, pointerEvents: 'none' }}>
            <span className={`blip-icon ${theme.youHalo} text-white`}>
              <Navigation className="w-4 h-4" />
            </span>
            <span className="blip-label">{copy.mapYouAreHere}</span>
            {homeLocation && (
              <span
                data-testid="map-home-gps"
                dir="ltr"
                className="mt-1 px-2 py-0.5 rounded-md text-[10px] font-mono-tabular font-black bg-[#0c1017]/90 border border-cyan-400/40 text-cyan-200"
              >
                📍 {homeLocation.lat.toFixed(5)}, {homeLocation.lng.toFixed(5)} · ±{homeLocation.accuracyM}m
              </span>
            )}
            {homeError && (
              <span className="mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0c1017]/90 border border-white/15 text-amber-200">
                {homeError === 'denied'
                  ? (isFa ? 'موقعیت GPS غیرفعاله' : 'GPS location off')
                  : (isFa ? 'GPS در دسترس نیست' : 'GPS unavailable')}
              </span>
            )}
          </div>

          {/* Icon-only pins — no text labels, clean shadows */}
          <AnimatePresence>
            {entities.map((entity) => {
              const isSelected = selectedEntity?.id === entity.id;
              return (
                <motion.button
                  key={entity.id}
                  type="button"
                  data-testid={`map-pin-${entity.id}`}
                  onClick={() => setSelectedEntityId(entity.id)}
                  aria-label={entityName(entity)}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  style={{ left: `${entity.xPct}%`, top: `${pinTopPct(entity.yPct)}%` }}
                  className={`gta-blip ${isSelected ? 'active' : ''} outline-none`}
                >
                  <span
                    className={`blip-icon ${theme.pin[entity.kind]} ${isSelected ? 'scale-105' : ''} transition`}
                  >
                    {KIND_PIN_ICON[entity.kind]}
                  </span>
                  <span className="blip-label" dir="rtl">
                    {entityName(entity)}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>

          {/* Slim transparent floating header: title + close, compact search, one continuous glass chip row */}
          <header className="absolute inset-x-0 top-0 z-30">
            <div className={`px-4 pt-4 pb-5 flex flex-col gap-2.5 ${theme.scrim}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 backdrop-blur-xl">
                    <svg className="w-5 h-5 animate-spin" style={{ animationDuration: '9s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" strokeOpacity="0.35" />
                      <path d="M12 3a9 9 0 0 1 9 9" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="2" fill="currentColor" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-gta font-bold text-sm sm:text-base text-white tracking-wider" dir="ltr">
                        LOS SANTOS // LIVE GRID
                      </h2>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                    </div>
                    <p
                      data-testid="grid-location-subtitle"
                      className={`text-[11px] sm:text-xs text-slate-400 truncate max-w-[190px] sm:max-w-xs leading-tight`}
                    >
                      {gridLoading
                        ? (isFa ? 'در حال آماده‌سازی نقشه واقعی…' : 'Loading real map…')
                        : liveGrid
                          ? `${liveGrid.label} (${liveGrid.center.lat.toFixed(4)}, ${liveGrid.center.lng.toFixed(4)}) · BLD ${liveGrid.buildingCount} · RDS ${liveGrid.roadCount}`
                          : homeError
                            ? (isFa ? 'لوکیشن واقعی رو از دکمه GPS انتخاب کن' : 'Pick a real location via GPS')
                            : headerSubtitle}
                    </p>
                  </div>
                </div>
                <div className="pointer-events-auto flex flex-col items-end gap-1.5">
                  {/* GTA V wanted stars */}
                  <div
                    data-testid="map-wanted-stars"
                    className="bg-[#0c1017]/90 backdrop-blur-md border border-white/15 rounded-xl px-3 py-1.5 flex items-center gap-1 shadow-xl"
                    title={isFa ? 'سطح هشدار منطقه' : 'Area alert level'}
                  >
                    <span className="font-gta text-xs text-slate-400 ml-1.5">WANTED</span>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className={`w-4 h-4 ${i < 2 ? 'star-active' : 'star-inactive'}`} fill="currentColor" />
                    ))}
                  </div>
                  {/* Live stats badge */}
                  {liveGrid && (
                    <div className="bg-[#0c1017]/85 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] font-gta text-slate-300 flex items-center gap-2" dir="ltr">
                      <span data-testid="grid-building-count">BLD: {liveGrid.buildingCount}</span>
                      <span className="text-slate-600">|</span>
                      <span data-testid="grid-road-count">RDS: {liveGrid.roadCount}</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  data-testid="map-modal-close-btn"
                  onClick={onClose}
                  aria-label={copy.back}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer transition shrink-0 ${theme.closeBtn}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action bar: real GPS + quick real cities */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pointer-events-auto py-0.5">
                <button
                  type="button"
                  data-testid="btn-my-gps"
                  onClick={() => {
                    if (homeLocation) {
                      showToast(isFa ? '📍 موقعیت واقعی شما پیدا شد!' : 'Your real location found!');
                      loadLiveGrid({ lat: homeLocation.lat, lng: homeLocation.lng }, isFa ? 'لوکیشن من (GPS)' : 'My location (GPS)');
                    } else if ('geolocation' in navigator) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setHomeLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: Math.round(pos.coords.accuracy) });
                          setHomeError(null);
                          showToast(isFa ? '📍 موقعیت واقعی شما پیدا شد!' : 'Your real location found!');
                          loadLiveGrid({ lat: pos.coords.latitude, lng: pos.coords.longitude }, isFa ? 'لوکیشن من (GPS)' : 'My location (GPS)');
                        },
                        (err) => {
                          setHomeError(err.code === 1 ? 'denied' : 'unavailable');
                          showToast(isFa
                            ? '⚠️ دسترسی GPS مسدود است یا در محیط پیش‌نمایش محدود شده؛ از دکمه‌های شهرها استفاده کن.'
                            : 'GPS access blocked or limited in preview; use the city presets.');
                        },
                        { enableHighAccuracy: true, timeout: 10000 }
                      );
                    } else {
                      showToast(isFa ? '⚠️ مرورگر شما از GPS پشتیبانی نمی‌کند. یکی از شهرها را انتخاب کن.' : 'Your browser does not support GPS. Pick a city.');
                    }
                  }}
                  className="shrink-0 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-lg shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                  </svg>
                  <span>{isFa ? 'لوکیشن واقعی من (GPS)' : 'My real location (GPS)'}</span>
                </button>
                {LIVE_GRID_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    data-testid={`grid-preset-${preset.label.replace(/[^\w]/g, '')}`}
                    onClick={() => loadLiveGrid({ lat: preset.lat, lng: preset.lng }, preset.label)}
                    className={`shrink-0 bg-[#131923]/90 hover:bg-slate-800 border border-white/15 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition cursor-pointer ${preset.emoji ? 'font-gta' : ''}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Compact search */}
              <div
                className={`flex items-center gap-2 h-10 px-3.5 rounded-full border ${theme.searchGlass}`}
              >
                <Search className="w-4 h-4 shrink-0 opacity-70" />
                <input
                  type="search"
                  data-testid="map-search-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={copy.mapSearchPlaceholder}
                  className="w-full bg-transparent text-[13px] font-medium focus:outline-none"
                />
                {query.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label={copy.showAll}
                    className="p-1 rounded-full hover:bg-black/10 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* One continuous row of delicate round glass chips (kind + radius) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 pb-0.5">
                {kindChips.map((chip) => {
                  const active = kindFilter === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      data-testid={`map-filter-${chip.id}`}
                      onClick={() => setKindFilter(chip.id)}
                      className={`h-8 px-3.5 rounded-full text-[12px] font-semibold border transition cursor-pointer whitespace-nowrap shrink-0 ${
                        active ? theme.glassChipActive : theme.glassChip
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
                <span aria-hidden="true" className={`w-px h-4 shrink-0 ${isCinema ? 'bg-[#6B411C]/25' : 'bg-white/15'}`} />
                {RADIUS_STEPS.map((step) => {
                  const active = radiusMeters === step.meters;
                  return (
                    <button
                      key={step.labelEn}
                      type="button"
                      onClick={() => setRadiusMeters(step.meters)}
                      className={`h-8 px-3 rounded-full text-[11.5px] font-mono tabular-nums font-semibold border transition cursor-pointer whitespace-nowrap shrink-0 ${
                        active ? theme.glassChipActive : theme.glassChip
                      }`}
                    >
                      {isRtl ? step.labelFa : step.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>
          </header>

          {/* Empty state — quiet glass pill */}
          {entities.length === 0 && (
            <div className="absolute inset-0 z-20 flex items-center justify-center px-8 pointer-events-none">
              <div
                data-testid="map-no-results"
                className={`px-4 py-2.5 rounded-full text-[12.5px] font-medium border text-center backdrop-blur-2xl ${theme.card} ${theme.mutedText}`}
              >
                {copy.mapNoResults}
              </div>
            </div>
          )}

          {/* Floating Glass Card — details of the single selected pin */}
          <AnimatePresence>
            {selectedEntity && (
              <motion.div
                key={selectedEntity.id}
                initial={{ opacity: 0, y: 26, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                data-testid="map-inspector-card"
                className={`absolute inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px] rounded-3xl border p-4 flex flex-col gap-2.5 ${theme.card}`}
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`flex items-center gap-1.5 text-[11px] mb-0.5 ${theme.mutedText}`}>
                      <span className="font-gta uppercase tracking-wider text-cyan-400 font-bold" dir="ltr">
                        {KIND_LABEL_FA[selectedEntity.kind]}
                      </span>
                      <span>•</span>
                      <span dir="ltr" className="font-mono tabular-nums">
                        {formatDistanceLabel(selectedEntity.distanceMeters, isRtl)}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug">{entityName(selectedEntity)}</h3>
                  </div>
                  <span
                    data-testid="map-rating-badge"
                    className="bg-white/10 px-2 py-1 rounded-lg font-gta text-xs font-bold text-amber-300 shrink-0"
                  >
                    ★ {selectedEntity.rating.toFixed(1)}
                  </span>
                </div>

                <p className={`text-xs leading-relaxed ${theme.mutedText}`}>{entitySubtitle(selectedEntity)}</p>

                <div className={`text-[12px] font-medium flex items-center gap-1.5 flex-wrap ${theme.mutedText}`}>
                  <span>{entityDistrict(selectedEntity)}</span>
                </div>

                <p className={`text-[12.5px] leading-relaxed ${theme.mutedText}`}>
                  {entitySubtitle(selectedEntity)}
                </p>

                <div className="flex items-center gap-2">
                  {selectedEntity.kind === 'store' && (
                    <button
                      type="button"
                      data-testid="map-open-storefront-btn"
                      onClick={() => {
                        onClose();
                        onJumpToStoreCollection(selectedEntity.linkedStoreCollectionId);
                      }}
                      className={`flex-1 h-10 rounded-xl text-[12.5px] font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer ${theme.cardPrimaryBtn}`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{copy.mapOpenStoreCta}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    data-testid="btn-set-waypoint"
                    onClick={() => {
                      const next = waypointId === selectedEntity.id ? null : selectedEntity.id;
                      setWaypointId(next);
                      showToast(
                        next
                          ? (isFa ? `مسیر GPS به سمت ${selectedEntity.nameFa} تنظیم شد.` : `GPS route set to ${selectedEntity.nameEn}.`)
                          : (isFa ? 'مسیریابی لغو شد' : 'Waypoint cleared')
                      );
                    }}
                    className={`flex-1 h-10 rounded-xl text-[12.5px] font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer ${
                      waypointId === selectedEntity.id
                        ? 'bg-purple-800 text-white border border-purple-400/40'
                        : 'bg-purple-600 hover:bg-purple-500 active:scale-95 text-white shadow-lg shadow-purple-600/30'
                    }`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                      <path d="M12 2L19 21l-7-4-7 4 7-19z" />
                    </svg>
                    <span>{isFa ? 'مسیریابی GPS به سبک GTA' : 'GTA-style GPS route'}</span>
                  </button>
                  <button
                    type="button"
                    data-testid="btn-radar-view"
                    onClick={() => {
                      setSelectedEntityId(null);
                      setWaypointId(null);
                      showToast(isFa ? '📷 دوربین روی زاویه رادار برگشت' : 'Camera reset to radar view');
                    }}
                    className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-semibold py-2.5 px-3 rounded-xl transition cursor-pointer shrink-0"
                    title={isFa ? 'بازنشانی دوربین' : 'Reset camera'}
                  >
                    {isFa ? 'زاویه رادار' : 'Radar view'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── LOADING OVERLAY (grid fetch) ── */}
          {gridLoading && (
            <div
              data-testid="grid-loader-overlay"
              className="absolute inset-0 z-40 bg-[#07090d]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-14 h-14 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4" aria-hidden="true" />
              <h2 className="text-base sm:text-lg font-bold text-white mb-1">
                {isFa ? 'در حال اسکن ماهواره‌ای محله…' : 'Scanning the neighborhood…'}
              </h2>
              <p className="text-[11px] font-gta text-cyan-300/80 mb-1" dir="ltr">
                {`مختصات: ${liveGrid?.center.lat.toFixed(4) ?? '—'}, ${liveGrid?.center.lng.toFixed(4) ?? '—'}`}
              </p>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xs">
                {isFa
                  ? 'اتصال مستقیم به OpenStreetMap بدون نیاز به API Key برای ساخت خیابان‌ها و ساختمان‌ها'
                  : 'Direct OpenStreetMap connection — no API key needed for streets and buildings'}
              </p>
            </div>
          )}

          {/* ── TOAST (no alert()) ── */}
          {toast && (
            <div
              data-testid="map-toast"
              className="absolute top-28 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-amber-400/50 text-amber-200 text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 max-w-[90vw]"
            >
              <span>{toast}</span>
            </div>
          )}

          {/* ── BOTTOM HUD: GTA V minimap status bars ── */}
          <div className="absolute inset-x-3 bottom-3 z-30 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px] pointer-events-none">
            <div className="bg-[#090c11]/95 border-2 border-slate-700/80 rounded-xl p-1.5 shadow-2xl">
              <div className="grid grid-cols-12 gap-1.5 h-2.5" dir="ltr">
                {/* Health (green, 6 cols) */}
                <div className="col-span-6 bg-emerald-950/90 rounded-sm overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400" style={{ width: `${GTA_BARS.health}%` }} />
                </div>
                {/* Armor (blue, 3 cols) */}
                <div className="col-span-3 bg-sky-950/90 rounded-sm overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-sky-500 to-cyan-400" style={{ width: `${GTA_BARS.armor}%` }} />
                </div>
                {/* Stamina (amber, 3 cols) */}
                <div className="col-span-3 bg-amber-950/90 rounded-sm overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300" style={{ width: `${GTA_BARS.stamina}%` }} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
