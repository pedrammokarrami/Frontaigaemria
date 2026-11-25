import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  ChevronLeft,
  Clapperboard,
  Compass,
  Disc3,
  Film,
  Headphones,
  ListMusic,
  Moon,
  Pause,
  Play,
  PlayCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  getAudioSpotifyMenuItems,
  getCinemaNetflixMenuItems,
  getGamePs5MenuItems,
  isHubMenuSoundMuted,
  playNetflixMenuSound,
  playPs5UiSound,
  playSpotifyTapSound,
  setHubMenuSoundMuted,
  stepMenuFocusIndex,
} from '../../utils/hubQuickMenu';
import { getMenuDescriptor } from '../../utils/i18nEngine';

/* ============================================================================
 * 1. PLAYSTATION 5 CONTROL CENTER QUICK MENU (GAME HUB)
 * ========================================================================== */

interface Ps5GameControlCenterProps {
  open: boolean;
  hasVideoBackdrop: boolean;
  useVideoBackdrop: boolean;
  onClose: () => void;
  onOpenQuickDemo: () => void;
  onOpenTournamentHub: () => void;
  onOpenSocialClub: () => void;
  onOpenIdentityProfile?: () => void;
  onOpenMap: () => void;
  onOpenStore: () => void;
  onToggleBackdropMode: () => void;
}

const PlayStationGlyphs: React.FC = () => (
  <svg
    viewBox="0 0 112 24"
    className="w-20 h-5 text-white/80 shrink-0"
    fill="none"
    aria-hidden="true"
  >
    {/* Triangle */}
    <polygon
      points="14,5 21,18 7,18"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
    {/* Circle */}
    <circle cx="42" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.9" />
    {/* Cross */}
    <path
      d="M64 6.5L75 17.5M75 6.5L64 17.5"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    {/* Square */}
    <rect
      x="91"
      y="5.5"
      width="13"
      height="13"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="1.9"
    />
  </svg>
);

export const Ps5GameControlCenter: React.FC<Ps5GameControlCenterProps> = ({
  open,
  hasVideoBackdrop,
  useVideoBackdrop,
  onClose,
  onOpenQuickDemo,
  onOpenTournamentHub,
  onOpenSocialClub,
  onOpenIdentityProfile,
  onOpenMap,
  onOpenStore,
  onToggleBackdropMode,
}) => {
  const { languageCode, isRtl, copy } = useLanguage();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [muted, setMuted] = useState(() => isHubMenuSoundMuted());

  const rawItems = getGamePs5MenuItems({ hasVideoBackdrop, useVideoBackdrop });
  const items = onOpenIdentityProfile
    ? rawItems
    : rawItems.filter((item) => item.id !== 'identity');

  useEffect(() => {
    if (!open) return;
    setFocusedIndex(0);
    playPs5UiSound('open');
  }, [open]);

  const executeItem = (id: string) => {
    playPs5UiSound('confirm');
    onClose();
    if (id === 'demo') onOpenQuickDemo();
    else if (id === 'tournament') onOpenTournamentHub();
    else if (id === 'social') onOpenSocialClub();
    else if (id === 'identity') onOpenIdentityProfile?.();
    else if (id === 'map') onOpenMap();
    else if (id === 'store') onOpenStore();
    else if (id === 'backdrop') onToggleBackdropMode();
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        playPs5UiSound('close');
        onClose();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = stepMenuFocusIndex(prev, items.length, 1);
          playPs5UiSound('tick');
          return next;
        });
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = stepMenuFocusIndex(prev, items.length, -1);
          playPs5UiSound('tick');
          return next;
        });
      } else if (e.key === 'Enter') {
        const current = items[focusedIndex];
        if (current) {
          e.preventDefault();
          executeItem(current.id);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (typeof document === 'undefined') return null;

  const handleClose = () => {
    playPs5UiSound('close');
    onClose();
  };

  const handleHoverOrFocus = (idx: number) => {
    if (focusedIndex !== idx) {
      setFocusedIndex(idx);
      playPs5UiSound('tick');
    }
  };

  const renderPs5Icon = (id: string, accentHex: string) => {
    if (id === 'demo') return <PlayCircle className="w-6 h-6" style={{ color: accentHex }} />;
    if (id === 'tournament') return <Trophy className="w-6 h-6" style={{ color: accentHex }} />;
    if (id === 'social') return <Users className="w-6 h-6" style={{ color: accentHex }} />;
    if (id === 'identity') return <ShieldCheck className="w-6 h-6" style={{ color: accentHex }} />;
    if (id === 'map') return <Compass className="w-6 h-6" style={{ color: accentHex }} />;
    if (id === 'store') return <ShoppingBag className="w-6 h-6" style={{ color: accentHex }} />;
    return useVideoBackdrop ? (
      <Sparkles className="w-6 h-6" style={{ color: accentHex }} />
    ) : (
      <Film className="w-6 h-6" style={{ color: accentHex }} />
    );
  };

  const testIdFor = (id: string) => {
    if (id === 'demo') return 'quick-menu-demo-btn';
    if (id === 'tournament') return 'quick-menu-tournament-btn';
    if (id === 'social') return 'quick-menu-social-btn';
    if (id === 'identity') return 'quick-menu-identity-btn';
    if (id === 'map') return 'quick-menu-map-btn';
    if (id === 'store') return 'quick-menu-store-btn';
    return 'toggle-backdrop-mode';
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="ps5-control-center"
          dir={isRtl ? 'rtl' : 'ltr'}
          data-testid="lobby-quick-menu-popover"
          role="dialog"
          aria-modal="true"
          aria-label={copy.ps5HeaderTitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleClose}
          className="fixed inset-0 z-50 flex flex-col justify-between px-4 py-5 sm:px-8 sm:py-7 overflow-y-auto select-none"
          style={{
            background:
              'radial-gradient(ellipse 85% 50% at 50% 0%, rgba(37, 99, 235, 0.24) 0%, rgba(6, 10, 24, 0.88) 58%, rgba(3, 5, 13, 0.94) 100%)',
            backdropFilter: 'blur(26px)',
          }}
        >
          {/* PS5 Top Control Bar */}
          <motion.header
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full mx-auto flex items-center justify-between gap-4 border-b border-white/10 pb-4 pl-14 sm:pl-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-white/[0.08] border border-white/20 flex items-center justify-center shrink-0">
                <span className="text-[12px] font-black tracking-tighter text-white">PS5</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-[16px] sm:text-[18px] font-extrabold text-white whitespace-nowrap truncate">
                  {copy.ps5HeaderTitle}
                </h2>
                <p className="text-[11.5px] text-sky-200/75 whitespace-nowrap truncate">
                  {copy.ps5HeaderSubtitle}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center justify-center">
              <PlayStationGlyphs />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                data-testid="ps5-sound-toggle-btn"
                onClick={() => {
                  const nextMuted = !muted;
                  setHubMenuSoundMuted(nextMuted);
                  setMuted(nextMuted);
                  if (!nextMuted) playPs5UiSound('tick');
                }}
                aria-label={muted ? copy.ps5SoundOff : copy.ps5SoundOn}
                className="min-h-[40px] px-3 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/15 text-[11.5px] font-bold text-white/90 inline-flex items-center gap-1.5 cursor-pointer transition"
              >
                {muted ? (
                  <VolumeX className="w-4 h-4 text-white/60" />
                ) : (
                  <Volume2 className="w-4 h-4 text-sky-300" />
                )}
                <span className="hidden sm:inline">{muted ? copy.ps5SoundOff : copy.ps5SoundOn}</span>
              </button>

              <button
                type="button"
                data-testid="ps5-close-btn"
                onClick={handleClose}
                aria-label={languageCode?.startsWith('fa') ? 'بستن منوی کنترل سنتر' : 'Close the control center menu'}
                className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/20 border border-white/20 flex items-center justify-center text-white cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.header>

          {/* Center-Bottom PS5 Control Center Horizontal / Responsive Cards */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`${items.length >= 5 ? 'max-w-6xl' : 'max-w-5xl'} w-full mx-auto my-auto py-4`}
          >
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 ${
                items.length >= 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
              } gap-3.5 items-stretch`}
            >
              {items.map((item, idx) => {
                const isFocused = focusedIndex === idx;
                const desc = getMenuDescriptor(
                  'game',
                  item.id,
                  item.titleFa,
                  item.subtitleFa,
                  item.badgeText,
                  languageCode
                );
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    data-testid={testIdFor(item.id)}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 14, scale: 0.96 }}
                    transition={{
                      duration: 0.24,
                      delay: idx * 0.035,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    onMouseEnter={() => handleHoverOrFocus(idx)}
                    onFocus={() => handleHoverOrFocus(idx)}
                    onClick={() => executeItem(item.id)}
                    className={`group relative text-start rounded-2xl p-4 sm:p-5 outline-none focus:outline-none transition-colors duration-150 cursor-pointer flex sm:flex-col items-center sm:items-start justify-between gap-3.5 min-h-[76px] sm:min-h-[178px] ${
                      isFocused
                        ? 'bg-[#131C33]/95 border border-transparent'
                        : 'bg-[#0B1122]/85 border border-white/12 hover:border-white/40'
                    }`}
                  >
                    {isFocused && (
                      <motion.span
                        layoutId="ps5-active-card-frame"
                        transition={{ type: 'spring', stiffness: 440, damping: 34 }}
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-white shadow-[0_0_26px_rgba(255,255,255,0.26)]"
                      />
                    )}
                    <div className="relative z-10 flex items-center justify-between w-auto sm:w-full gap-3 shrink-0">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/15 shrink-0 transition-transform duration-150 group-hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${item.accentHex}24 0%, rgba(15,23,42,0.85) 100%)`,
                        }}
                      >
                        {renderPs5Icon(item.id, item.accentHex)}
                      </div>

                      {desc.badge && (
                        <span className="hidden sm:inline text-[11px] font-semibold text-white/60">
                          {desc.badge}
                        </span>
                      )}
                    </div>

                    <div className="relative z-10 flex-1 sm:w-full min-w-0">
                      <div className="text-[14px] sm:text-[15px] font-extrabold text-white leading-snug">
                        {desc.title}
                      </div>
                      <p className="text-[11.5px] text-slate-300/75 mt-1 leading-relaxed line-clamp-2">
                        {desc.subtitle}
                      </p>
                    </div>

                    <div className="relative z-10 hidden sm:flex items-center justify-between w-full pt-2 border-t border-white/10 text-[11px] font-bold text-white/75">
                      <span style={{ color: isFocused ? '#FFFFFF' : item.accentHex }}>
                        {isFocused ? copy.ps5Ready : copy.ps5Select}
                      </span>
                      <ChevronLeft
                        className={`w-3.5 h-3.5 transition-transform ${
                          isRtl ? 'group-hover:-translate-x-1' : 'rotate-180 group-hover:translate-x-1'
                        }`}
                      />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* PS5 Clean Navigation Legend Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-[11.5px] text-white/60"
          >
            <div className="flex items-center gap-4">
              <span>{copy.ps5FooterConfirm}</span>
              <span aria-hidden="true">·</span>
              <span>{copy.ps5FooterClose}</span>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">{copy.ps5FooterHint}</span>
            </div>
            <div className="sm:hidden">
              <PlayStationGlyphs />
            </div>
          </motion.footer>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

/* ============================================================================
 * 2. SPOTIFY DARK LIBRARY / NOW PLAYING QUICK SHEET (AUDIO HUB)
 * ========================================================================== */

interface SpotifyAudioMenuSheetProps {
  open: boolean;
  activeRoomTitleFa: string;
  activeTrackTitleFa: string;
  activeTrackArtistFa: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
  onSelectSubView: (view: 'rooms-hub' | 'player' | 'identity' | 'social') => void;
  onOpenMap: () => void;
  onOpenStore: () => void;
}

export const SpotifyAudioMenuSheet: React.FC<SpotifyAudioMenuSheetProps> = ({
  open,
  activeRoomTitleFa,
  activeTrackTitleFa,
  activeTrackArtistFa,
  isPlaying,
  onTogglePlay,
  onClose,
  onSelectSubView,
  onOpenMap,
  onOpenStore,
}) => {
  const { languageCode, isRtl, copy } = useLanguage();
  const items = getAudioSpotifyMenuItems();

  useEffect(() => {
    if (!open) return;
    playSpotifyTapSound('open');
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  const renderCoverArt = (id: string) => {
    if (id === 'rooms-hub') {
      return (
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#1DB954] to-[#0D5C2A] flex items-center justify-center shrink-0 shadow-md">
          <ListMusic className="w-6 h-6 text-[#121212]" />
        </div>
      );
    }
    if (id === 'player') {
      return (
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#535353] via-[#191414] to-[#1DB954]/80 flex items-center justify-center shrink-0 shadow-md">
          <Headphones className="w-6 h-6 text-[#1ED760]" />
        </div>
      );
    }
    if (id === 'identity') {
      return (
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#2E77D0] to-[#12264A] flex items-center justify-center shrink-0 shadow-md">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
      );
    }
    if (id === 'map') {
      return (
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#0E7490] to-[#082F49] flex items-center justify-center shrink-0 shadow-md">
          <Compass className="w-6 h-6 text-cyan-300" />
        </div>
      );
    }
    if (id === 'store') {
      return (
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#9D174D] to-[#500724] flex items-center justify-center shrink-0 shadow-md">
          <ShoppingBag className="w-6 h-6 text-pink-200" />
        </div>
      );
    }
    return (
      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#8C2D19] to-[#42140B] flex items-center justify-center shrink-0 shadow-md">
        <BookOpen className="w-6 h-6 text-[#FAF4E4]" />
      </div>
    );
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="spotify-audio-sheet-backdrop"
          dir={isRtl ? 'rtl' : 'ltr'}
          role="dialog"
          aria-modal="true"
          aria-label={copy.spotifyHeaderTitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 select-none"
        >
          <motion.div
            data-testid="audio-quick-menu-popover"
            initial={{ y: '100%', opacity: 0.7 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-t-3xl sm:rounded-2xl bg-[#121212] border border-white/10 shadow-[0_-20px_64px_rgba(0,0,0,0.9)] overflow-hidden"
          >
            {/* Spotify Drag Handle */}
            <div className="pt-3 pb-1 flex justify-center sm:hidden">
              <span className="w-10 h-1 rounded-full bg-white/25" />
            </div>

            {/* Header */}
            <div className="px-5 pt-3 sm:pt-5 pb-3 flex items-center justify-between gap-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#1DB954] flex items-center justify-center shrink-0">
                  <Disc3
                    className={`w-5 h-5 text-[#121212] ${isPlaying ? 'animate-spin' : ''}`}
                    style={isPlaying ? { animationDuration: '5s' } : undefined}
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[16px] font-extrabold text-white truncate">
                    {copy.spotifyHeaderTitle}
                  </h2>
                  <p className="text-[11.5px] text-[#B3B3B3] truncate">
                    {copy.spotifyActiveSpace}: {activeRoomTitleFa}
                  </p>
                </div>
              </div>

              <button
                type="button"
                data-testid="spotify-close-btn"
                onClick={onClose}
                aria-label={languageCode?.startsWith('fa') ? 'بستن منوی موزیک' : 'Close the music menu'}
                className="w-9 h-9 rounded-full bg-[#242424] hover:bg-[#333333] flex items-center justify-center text-white cursor-pointer transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 max-h-[80dvh] overflow-y-auto">
              {/* Live Spotify Now-Playing Mini Card */}
              <div className="rounded-xl bg-[#181818] border border-white/[0.07] p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-md bg-gradient-to-br from-[#1DB954]/30 to-[#282828] border border-[#1DB954]/40 flex items-center justify-center shrink-0">
                    <div className="flex items-end gap-0.5 h-4" aria-hidden="true">
                      <span
                        className={`w-1 bg-[#1DB954] rounded-full ${
                          isPlaying ? 'h-4 animate-pulse' : 'h-2'
                        }`}
                      />
                      <span
                        className={`w-1 bg-[#1ED760] rounded-full ${
                          isPlaying ? 'h-2.5 animate-pulse' : 'h-3.5'
                        }`}
                      />
                      <span
                        className={`w-1 bg-[#1DB954] rounded-full ${
                          isPlaying ? 'h-3.5 animate-pulse' : 'h-1.5'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-white truncate">
                      {activeTrackTitleFa}
                    </div>
                    <div className="text-[11px] text-[#B3B3B3] truncate">
                      {activeTrackArtistFa} · {activeRoomTitleFa}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="spotify-quick-play-toggle"
                  onClick={() => {
                    playSpotifyTapSound('tap');
                    onTogglePlay();
                  }}
                  aria-label={isPlaying ? 'توقف پخش' : 'پخش سریع'}
                  className="w-10 h-10 rounded-full bg-[#1DB954] hover:bg-[#1ED760] hover:scale-105 active:scale-95 text-[#121212] flex items-center justify-center transition cursor-pointer shrink-0 shadow-lg"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  )}
                </button>
              </div>

              {/* Spotify Library Bento Rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {items.map((item) => {
                  const desc = getMenuDescriptor(
                    'audio',
                    item.id,
                    item.titleFa,
                    item.subtitleFa,
                    item.badgeText,
                    languageCode
                  );
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`spotify-menu-item-${item.id}`}
                      onClick={() => {
                        playSpotifyTapSound('tap');
                        onClose();
                        if (item.id === 'map') onOpenMap();
                        else if (item.id === 'store') onOpenStore();
                        else onSelectSubView(
                          item.id as 'rooms-hub' | 'player' | 'identity' | 'social'
                        );
                      }}
                      className="group text-start rounded-xl bg-[#181818] hover:bg-[#282828] border border-white/[0.05] p-2.5 flex items-center justify-between gap-3 transition-colors duration-150 cursor-pointer min-h-[72px]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {renderCoverArt(item.id)}
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-bold text-white leading-snug line-clamp-1 group-hover:text-[#1ED760] transition-colors">
                            {desc.title}
                          </div>
                          <p className="text-[11px] text-[#B3B3B3] mt-0.5 line-clamp-2 leading-relaxed">
                            {desc.subtitle}
                          </p>
                        </div>
                      </div>

                      <span className="w-8 h-8 rounded-full bg-[#1DB954] text-[#121212] flex items-center justify-center shrink-0 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150">
                        <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

/* ============================================================================
 * 3. NETFLIX CINEMA SHOWCASE ANIMATED OVERLAY (CINEMA HUB)
 * ========================================================================== */

interface NetflixCinemaMenuOverlayProps {
  open: boolean;
  activeRoomTitleFa: string;
  cinemaDimMode: boolean;
  onToggleCinemaDim: () => void;
  onClose: () => void;
  onSelectSubView: (view: 'rooms-hub' | 'player' | 'identity' | 'social') => void;
  onOpenMap: () => void;
  onOpenStore: () => void;
}

export const NetflixCinemaMenuOverlay: React.FC<NetflixCinemaMenuOverlayProps> = ({
  open,
  activeRoomTitleFa,
  cinemaDimMode,
  onToggleCinemaDim,
  onClose,
  onSelectSubView,
  onOpenMap,
  onOpenStore,
}) => {
  const { languageCode, isRtl, copy } = useLanguage();
  const items = getCinemaNetflixMenuItems(cinemaDimMode);

  useEffect(() => {
    if (!open) return;
    playNetflixMenuSound('open');
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  const renderPosterIcon = (id: string) => {
    if (id === 'rooms-hub') return <Clapperboard className="w-7 h-7 text-[#E50914]" />;
    if (id === 'player') return <PlayCircle className="w-7 h-7 text-amber-400" />;
    if (id === 'identity') return <ShieldCheck className="w-7 h-7 text-sky-400" />;
    if (id === 'social') return <Users className="w-7 h-7 text-cyan-300" />;
    if (id === 'map') return <Compass className="w-7 h-7 text-cyan-300" />;
    if (id === 'store') return <ShoppingBag className="w-7 h-7 text-pink-300" />;
    return cinemaDimMode ? (
      <Sun className="w-7 h-7 text-amber-300" />
    ) : (
      <Moon className="w-7 h-7 text-red-400" />
    );
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="netflix-cinema-overlay"
          dir={isRtl ? 'rtl' : 'ltr'}
          data-testid="cinema-quick-menu-popover"
          role="dialog"
          aria-modal="true"
          aria-label={copy.netflixHeaderTitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex flex-col justify-between px-4 py-5 sm:px-8 sm:py-8 overflow-y-auto select-none"
          style={{
            background:
              'radial-gradient(ellipse 75% 45% at 50% 0%, rgba(229, 9, 20, 0.24) 0%, rgba(16, 16, 20, 0.94) 55%, rgba(8, 8, 10, 0.98) 100%)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Netflix Crimson Light Sweep Ribbon */}
          <motion.div
            aria-hidden="true"
            initial={{ scaleX: 0, opacity: 0.3 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#E50914] to-transparent origin-center pointer-events-none"
          />

          {/* Top Netflix Browse Header */}
          <motion.header
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-6xl w-full mx-auto flex items-center justify-between gap-4 pb-4 border-b border-white/10 pl-14 sm:pl-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Signature Crimson Ribbon N-Mark */}
              <div
                aria-hidden="true"
                className="w-9 h-9 rounded-md bg-[#E50914] flex items-center justify-center shadow-[0_6px_22px_rgba(229,9,20,0.5)] shrink-0"
              >
                <span className="text-[18px] font-black tracking-tighter text-white leading-none">
                  N
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="text-[17px] sm:text-[20px] font-black text-white whitespace-nowrap truncate">
                  {copy.netflixHeaderTitle}
                </h2>
                <p className="text-[12px] text-[#B3B3B3] whitespace-nowrap truncate">
                  {copy.netflixCurrentRoom}: {activeRoomTitleFa}
                </p>
              </div>
            </div>

            <button
              type="button"
              data-testid="netflix-close-btn"
              onClick={onClose}
              aria-label={copy.back}
              className="w-10 h-10 rounded-full bg-[#1F1F1F] hover:bg-[#E50914] border border-white/15 flex items-center justify-center text-white cursor-pointer transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.header>

          {/* Animated Staggered Netflix Poster Showcase Cards */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-6xl w-full mx-auto my-auto py-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-stretch">
              {items.map((item, idx) => {
                const desc = getMenuDescriptor(
                  'cinema',
                  item.id,
                  item.titleFa,
                  item.subtitleFa,
                  item.badgeText,
                  languageCode
                );
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    data-testid={`netflix-menu-item-${item.id}`}
                    initial={{ opacity: 0, y: 26, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.94 }}
                    transition={{
                      duration: 0.28,
                      delay: 0.04 + idx * 0.038,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    onMouseEnter={() => playNetflixMenuSound('hover')}
                    onClick={() => {
                      playNetflixMenuSound('select');
                      onClose();
                      if (item.id === 'dim') {
                        onToggleCinemaDim();
                      } else if (item.id === 'map') {
                        onOpenMap();
                      } else if (item.id === 'store') {
                        onOpenStore();
                      } else {
                        onSelectSubView(
                          item.id as 'rooms-hub' | 'player' | 'identity' | 'social'
                        );
                      }
                    }}
                    className="group relative text-start rounded-xl bg-[#141414] border border-white/12 hover:border-[#E50914] hover:scale-[1.04] hover:z-10 transition-all duration-200 overflow-hidden shadow-[0_14px_40px_rgba(0,0,0,0.75)] hover:shadow-[0_18px_46px_rgba(229,9,20,0.28)] cursor-pointer flex sm:flex-col justify-between min-h-[88px] sm:min-h-[210px]"
                  >
                    {/* Top Poster Artwork Stage */}
                    <div
                      className="relative w-24 sm:w-full h-auto sm:h-28 shrink-0 flex items-center justify-center overflow-hidden"
                      style={{
                        background: `linear-gradient(145deg, ${item.accentHex}26 0%, #1C1C22 60%, #0D0D10 100%)`,
                      }}
                    >
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 8px)',
                        }}
                      />
                      <span className="relative z-10 transition-transform duration-200 group-hover:scale-110">
                        {renderPosterIcon(item.id)}
                      </span>
                      <span className="hidden sm:block absolute top-2.5 right-3 text-[10px] font-black text-[#E50914] tracking-wider">
                        0{idx + 1}
                      </span>
                    </div>

                    {/* Poster Details & Netflix Bottom Crimson Bar */}
                    <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between gap-2">
                      <div>
                        {desc.badge && (
                          <div className="text-[11px] font-bold text-[#E50914] mb-1">
                            {desc.badge}
                          </div>
                        )}
                        <div className="text-[14px] sm:text-[15px] font-extrabold text-white leading-snug">
                          {desc.title}
                        </div>
                        <p className="text-[11.5px] text-[#B3B3B3] mt-1 leading-relaxed line-clamp-2">
                          {desc.subtitle}
                        </p>
                      </div>

                      <div className="hidden sm:flex items-center justify-between pt-2 text-[11.5px] font-bold text-white/80 group-hover:text-white">
                        <span>{copy.netflixEnterRun}</span>
                        <Play className="w-3.5 h-3.5 fill-current text-[#E50914] transition-transform group-hover:scale-110" />
                      </div>
                    </div>

                    {/* Signature Netflix Red Progress Accent Strip */}
                    <div
                      aria-hidden="true"
                      className="hidden sm:block h-1 w-full bg-white/10"
                    >
                      <div className="h-full w-0 group-hover:w-full bg-[#E50914] transition-all duration-300" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-6xl w-full mx-auto pt-3 border-t border-white/10 flex items-center justify-between text-[11.5px] text-[#B3B3B3]"
          >
            <span>{copy.netflixFooterClick}</span>
            <span>{copy.netflixFooterEsc}</span>
          </motion.footer>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
