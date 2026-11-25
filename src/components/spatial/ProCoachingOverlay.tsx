import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Gamepad2,
  Info,
  Mic,
  MicOff,
  Pause,
  Play,
  RefreshCw,
  Search,
  Upload,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import {
  COACH_REALM_ORDER,
  REALM_LABELS_FA,
  getGamesByRealm,
} from '../../services/gameMediaCatalog';
import {
  type LiveGameMetaSnapshot,
  type PcGameSearchResult,
  toPersianDigits,
} from '../../services/liveMetaSyncService';
import type { RealmId } from '../../types/spatial';

interface ProCoachingOverlayProps {
  activeRealm: RealmId;
  meta: LiveGameMetaSnapshot;
  frameIndex: number;
  totalFrames: number;
  isPlaying: boolean;
  isSlowMo: boolean;
  isSpeaking: boolean;
  isListeningVoice: boolean;
  isSyncingMeta: boolean;
  isAnalyzingUpload: boolean;
  onSelectRealm: (nextRealm: RealmId) => void;
  onSelectGame: (game: { id: string; name?: string; realm?: RealmId; steamAppId?: number }) => void;
  onToggleSlowMo: () => void;
  onTogglePlay: () => void;
  onChangeFrame: (nextFrame: number) => void;
  onRefreshLiveMeta: () => void;
  onUploadFile: (file: File) => void;
  onToggleSpeak: () => void;
  onToggleVoiceQa: () => void;
  onOpenSocialWorld: () => void;
  onBackToMenu: () => void;
}

const REALM_ACCENTS: Record<RealmId, string> = {
  sports: '#22C55E',
  shooter: '#22D3EE',
  strategy: '#F59E0B',
  story: '#EC4899',
};

const WAVE_HEIGHTS = [10, 18, 24, 15, 22, 13, 19];

export function ProCoachingOverlay({
  activeRealm,
  meta,
  frameIndex,
  totalFrames,
  isPlaying,
  isSlowMo,
  isSpeaking,
  isListeningVoice,
  isSyncingMeta,
  isAnalyzingUpload,
  onSelectRealm,
  onSelectGame,
  onToggleSlowMo,
  onTogglePlay,
  onChangeFrame,
  onRefreshLiveMeta,
  onUploadFile,
  onToggleSpeak,
  onToggleVoiceQa,
  onOpenSocialWorld,
  onBackToMenu,
}: ProCoachingOverlayProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryFilterRealm, setLibraryFilterRealm] = useState<RealmId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PcGameSearchResult[]>([]);
  const [isSearchingGames, setIsSearchingGames] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const realmGames = getGamesByRealm(activeRealm);

  // Live search across ALL PC Games (4-genre catalog + Steam 100,000+ games) when Library modal is open
  useEffect(() => {
    if (!isLibraryOpen) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setIsSearchingGames(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (libraryFilterRealm !== 'all') params.set('realm', libraryFilterRealm);

      fetch(`/api/games/search?${params.toString()}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (active && Array.isArray(data?.games)) {
            setSearchResults(data.games as PcGameSearchResult[]);
          }
        })
        .catch(() => undefined)
        .finally(() => {
          if (active) setIsSearchingGames(false);
        });
    }, searchQuery.trim() ? 240 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isLibraryOpen, searchQuery, libraryFilterRealm]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
    e.target.value = '';
  };

  const frameProgressPct = Math.round(((frameIndex - 1) / Math.max(1, totalFrames - 1)) * 100);

  return (
    <div
      dir="rtl"
      data-testid="pro-coaching-hud"
      className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between overflow-hidden"
    >
      {/* Hidden file picker for user gameplay clips / screenshots */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        data-testid="upload-scene-input"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* TOP MINIMAL FLOATING HUD */}
      <header className="pointer-events-auto mx-auto w-full max-w-md px-3 pt-2.5">
        {/* Row 1: Back + Active Game Title (opens All-Games Library) + Slow-Mo + Info + Social */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <button
              type="button"
              data-testid="coach-back-to-menu-btn"
              onClick={onBackToMenu}
              className="flex shrink-0 items-center gap-1 rounded-full border border-white/18 bg-[#050B14]/78 px-2.5 py-1.5 text-[11px] font-extrabold text-white/95 hover:bg-white/15 transition cursor-pointer"
            >
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              <span>بازگشت</span>
            </button>

            <button
              type="button"
              data-testid="open-all-games-library-btn"
              onClick={() => {
                setIsInfoOpen(false);
                setIsLibraryOpen((v) => !v);
              }}
              className="flex min-w-0 items-center gap-1.5 rounded-full border border-white/18 bg-[#050B14]/76 px-2.5 py-1.5 shadow-lg hover:border-white/35 transition cursor-pointer"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full animate-pulse"
                style={{ backgroundColor: meta.accentHex }}
              />
              <span
                data-testid="coach-pro-title"
                className="truncate text-[10px] sm:text-[11px] font-black tracking-tight text-white"
              >
                {meta.gameProTitleFa}
              </span>
              <Search className="h-3 w-3 shrink-0 text-white/65" />
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              data-testid="slowmo-toggle-btn"
              onClick={onToggleSlowMo}
              dir="ltr"
              className="rounded-full border px-2 py-1 font-mono-tabular text-[10px] font-black transition cursor-pointer"
              style={{
                backgroundColor: isSlowMo ? `${meta.accentHex}2C` : 'rgba(5, 11, 20, 0.76)',
                borderColor: isSlowMo ? `${meta.accentHex}CC` : 'rgba(255,255,255,0.16)',
                color: isSlowMo ? '#FFFFFF' : 'rgba(255,255,255,0.78)',
              }}
            >
              {isSlowMo ? '0.25x' : '1.0x'}
            </button>

            <button
              type="button"
              data-testid="meta-info-toggle-btn"
              aria-label="وضعیت متای پچ جدید"
              onClick={() => {
                setIsLibraryOpen(false);
                setIsInfoOpen((prev) => !prev);
              }}
              className="relative flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-[#050B14]/76 text-white/85 hover:text-white transition cursor-pointer"
            >
              {isInfoOpen ? <X className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
              {meta.isFresh && !isInfoOpen && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#050B14]" />
              )}
            </button>

            <button
              type="button"
              data-testid="open-gta-social-top-btn"
              aria-label="سوشال مدیا GTA"
              onClick={onOpenSocialWorld}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-400/45 bg-[#061522]/80 text-cyan-300 hover:bg-cyan-400/20 transition cursor-pointer"
            >
              <Users className="h-3.5 w-3.5 shrink-0" />
            </button>
          </div>
        </div>

        {/* Row 2: 4 Coaching Genres (ورزشی | شوتر | استراتژی | داستانی) + Interactive Frame Scrubber */}
        <div className="mt-1.5 flex items-center justify-between gap-1.5">
          <div
            role="tablist"
            aria-label="۴ سبک مربی"
            className="flex shrink-0 items-center gap-0.5 rounded-full border border-white/14 bg-[#050B14]/74 p-0.5"
          >
            {COACH_REALM_ORDER.map((rId) => {
              const active = rId === activeRealm;
              const accent = REALM_ACCENTS[rId];
              return (
                <button
                  key={rId}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-testid={`coach-genre-${rId}`}
                  onClick={() => onSelectRealm(rId)}
                  className="rounded-full px-2 py-0.5 text-[10px] font-black transition cursor-pointer whitespace-nowrap"
                  style={{
                    backgroundColor: active ? `${accent}30` : 'transparent',
                    color: active ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                    boxShadow: active ? `inset 0 0 0 1px ${accent}CC` : undefined,
                  }}
                >
                  {REALM_LABELS_FA[rId]}
                </button>
              );
            })}
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-white/14 bg-[#050B14]/74 px-2 py-0.5">
            <button
              type="button"
              data-testid="frame-play-toggle-btn"
              aria-label={isPlaying ? 'توقف فریم' : 'پخش فریم'}
              onClick={onTogglePlay}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
            >
              {isPlaying ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
            </button>

            <input
              type="range"
              min={1}
              max={totalFrames}
              value={frameIndex}
              data-testid="frame-scrubber-input"
              aria-label="اسکرابر فریم تحلیل"
              onChange={(e) => onChangeFrame(Number(e.target.value))}
              dir="ltr"
              className="h-1 w-full min-w-[38px] cursor-pointer appearance-none rounded-full bg-white/20 accent-emerald-400"
            />

            <span
              data-testid="frame-counter-label"
              className="shrink-0 whitespace-nowrap text-[9px] font-bold text-white/90"
            >
              {toPersianDigits(frameIndex)}/{toPersianDigits(totalFrames)}
            </span>
          </div>
        </div>

        {/* Row 3: Scrollable Quick Games Strip in Active Genre + "همه بازی‌ها" Search Pill */}
        <div
          data-testid="genre-games-strip"
          className="mt-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5"
        >
          <button
            type="button"
            data-testid="search-all-pc-games-chip"
            onClick={() => {
              setIsInfoOpen(false);
              setLibraryFilterRealm('all');
              setIsLibraryOpen(true);
            }}
            className="flex shrink-0 items-center gap-1 rounded-full border border-amber-400/55 bg-amber-500/18 px-2.5 py-0.5 text-[10px] font-black text-amber-200 hover:bg-amber-500/30 transition cursor-pointer whitespace-nowrap"
          >
            <Search className="h-2.5 w-2.5" />
            <span>همه بازی‌ها</span>
          </button>

          {realmGames.map((g) => {
            const active = g.id === meta.gameId;
            return (
              <button
                key={g.id}
                type="button"
                data-testid={`game-chip-${g.id}`}
                onClick={() =>
                  onSelectGame({
                    id: g.id,
                    name: g.name,
                    realm: g.realm,
                    steamAppId: g.steamAppId,
                  })
                }
                dir="ltr"
                className="shrink-0 rounded-full border px-2.5 py-0.5 font-mono-tabular text-[10px] font-black transition cursor-pointer whitespace-nowrap"
                style={{
                  backgroundColor: active ? `${g.accentHex}38` : 'rgba(5, 11, 20, 0.7)',
                  borderColor: active ? `${g.accentHex}DD` : 'rgba(255,255,255,0.16)',
                  color: active ? '#FFFFFF' : 'rgba(255,255,255,0.78)',
                }}
              >
                {g.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Collapsible Live Meta Info Drawer */}
        {isInfoOpen && (
          <div
            data-testid="live-meta-info-drawer"
            className="mt-2 rounded-2xl border border-emerald-400/35 bg-[#050D17]/92 px-3 py-2.5 shadow-xl"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>متای پچ جدید ✓</span>
                <span
                  dir="ltr"
                  className="rounded-full bg-white/10 px-2 py-0.5 font-mono-tabular text-[10px] text-white/90"
                >
                  {meta.patchVersion}
                </span>
              </div>

              <button
                type="button"
                data-testid="sync-live-meta-btn"
                onClick={onRefreshLiveMeta}
                disabled={isSyncingMeta}
                className="flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/90 hover:bg-white/20 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-2.5 w-2.5 ${isSyncingMeta ? 'animate-spin' : ''}`} />
                <span>{isSyncingMeta ? 'همگام‌سازی...' : 'بروزرسانی'}</span>
              </button>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-white/80">
              {meta.patchSummaryFa}
            </p>
          </div>
        )}

        {/* All PC Games Library & Live Steam Search Drawer */}
        {isLibraryOpen && (
          <div
            data-testid="all-games-library-drawer"
            className="mt-2 rounded-2xl border border-white/20 bg-[#050C16]/94 p-3 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-white">
                <Gamepad2 className="h-4 w-4 text-emerald-400" />
                <span>انتخاب از تمام بازی‌های کامپیوتری (۴ سبک)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Live Search Box for ANY PC game on Steam */}
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/50" />
              <input
                type="text"
                data-testid="all-games-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="نام هر بازی PC را بنویسید (مثل Tekken, Forza, Hades, Rust...)"
                className="w-full rounded-xl border border-white/18 bg-black/55 py-1.5 pr-8 pl-3 text-[11px] font-bold text-white placeholder:text-white/45 focus:border-emerald-400/70 focus:outline-none"
              />
            </div>

            {/* Genre filter pills inside drawer */}
            <div className="mt-2 flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setLibraryFilterRealm('all')}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black cursor-pointer ${
                  libraryFilterRealm === 'all'
                    ? 'bg-white text-[#040B12]'
                    : 'bg-white/10 text-white/75'
                }`}
              >
                همه سبک‌ها
              </button>
              {COACH_REALM_ORDER.map((rId) => (
                <button
                  key={rId}
                  type="button"
                  onClick={() => setLibraryFilterRealm(rId)}
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-black cursor-pointer whitespace-nowrap"
                  style={{
                    backgroundColor:
                      libraryFilterRealm === rId ? REALM_ACCENTS[rId] : 'rgba(255,255,255,0.1)',
                    color: libraryFilterRealm === rId ? '#040B12' : 'rgba(255,255,255,0.8)',
                  }}
                >
                  {REALM_LABELS_FA[rId]}
                </button>
              ))}
            </div>

            {/* Results Grid */}
            <div className="mt-2.5 grid max-h-[240px] grid-cols-2 gap-1.5 overflow-y-auto pr-0.5">
              {isSearchingGames ? (
                <div className="col-span-2 py-5 text-center text-[11px] font-bold text-white/65">
                  در حال جستجو در دیتابیس بازی‌های PC...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="col-span-2 py-5 text-center text-[11px] font-bold text-white/60">
                  بازی پیدا نشد؛ نام انگلیسی بازی را امتحان کنید.
                </div>
              ) : (
                searchResults.map((item) => (
                  <button
                    key={`${item.id}-${item.steamAppId ?? ''}`}
                    type="button"
                    data-testid={`library-game-${item.id}`}
                    onClick={() => {
                      onSelectGame({
                        id: item.id,
                        name: item.name,
                        realm: item.realm,
                        steamAppId: item.steamAppId,
                      });
                      setIsLibraryOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/6 p-1.5 text-right hover:border-emerald-400/60 hover:bg-white/12 transition cursor-pointer"
                  >
                    <img
                      src={item.thumbUrl}
                      alt={item.name}
                      onError={(e) => {
                        const fallbackByRealm: Record<RealmId, string> = {
                          sports: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
                          shooter: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
                          strategy: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
                          story: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
                        };
                        const target = e.currentTarget;
                        if (!target.dataset.fbApplied) {
                          target.dataset.fbApplied = '1';
                          target.src = fallbackByRealm[item.realm];
                        }
                      }}
                      className="h-9 w-12 shrink-0 rounded-lg object-cover bg-black/50"
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        dir="ltr"
                        className="truncate text-left font-mono-tabular text-[10px] font-black text-white"
                      >
                        {item.name}
                      </div>
                      <div
                        className="mt-0.5 text-[9px] font-extrabold"
                        style={{ color: REALM_ACCENTS[item.realm] }}
                      >
                        مربی {REALM_LABELS_FA[item.realm]}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </header>

      {/* LOWER-THIRD ULTRA-THIN PRO COACHING STRIP + BOTTOM EDGE VOICE/CTA */}
      <footer className="pointer-events-auto mx-auto w-full max-w-md px-3 pb-3">
        <section
          aria-label="راهنمای تاکتیکی ۳ مرحله‌ای"
          data-testid="pro-3step-strip"
          className="rounded-2xl border border-white/15 bg-[#050B14]/82 px-3 py-2.5 shadow-2xl"
        >
          <div className="grid grid-cols-3 items-center gap-2">
            {/* Step 1: Trigger */}
            <div className="flex flex-col items-center text-center">
              <span
                dir="ltr"
                data-testid="step1-badge"
                className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white/10 px-2 py-0.5 font-mono-tabular text-[10px] font-black text-white whitespace-nowrap"
              >
                [{meta.triggerBadge}]
              </span>
              <span className="mt-1 truncate text-[11px] font-extrabold text-white/92">
                {meta.triggerLabelFa}
              </span>
            </div>

            {/* Step 2: Golden Timing Window */}
            <div className="flex flex-col items-center text-center">
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/12">
                <div
                  className="absolute top-0 bottom-0 rounded-full"
                  style={{
                    left: '34%',
                    width: '34%',
                    background: `linear-gradient(90deg, ${meta.accentHex}88, ${meta.accentHex}, ${meta.accentHex}88)`,
                    boxShadow: `0 0 12px ${meta.accentHex}`,
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 w-1 rounded-full bg-white shadow"
                  style={{
                    left: `${Math.min(94, Math.max(4, frameProgressPct))}%`,
                  }}
                />
              </div>
              <span
                data-testid="step2-timing-label"
                className="mt-1.5 whitespace-nowrap text-[10px] font-black text-emerald-300"
              >
                {meta.timingWindowLabelFa}
              </span>
            </div>

            {/* Step 3: Execution */}
            <div className="flex flex-col items-center text-center">
              <span
                dir="ltr"
                data-testid="step3-badge"
                className="inline-flex items-center justify-center rounded-lg border px-2 py-0.5 font-mono-tabular text-[10px] font-black text-white whitespace-nowrap"
                style={{
                  borderColor: `${meta.accentHex}AA`,
                  backgroundColor: `${meta.accentHex}24`,
                }}
              >
                [{meta.executionBadge}]
              </span>
              <span className="mt-1 truncate text-[11px] font-extrabold text-white/92">
                {meta.executionLabelFa}
              </span>
            </div>
          </div>

          <div
            data-testid="fatal-error-warning"
            className="mt-2 flex items-center justify-center border-t border-white/10 pt-1.5 text-center text-[11px] font-black text-rose-400"
          >
            <span>{meta.fatalErrorFa}</span>
          </div>
        </section>

        {/* Bottom Edge: Animated AI Voice Coach Waveform + Glowing ارسال صحنه جدید Pill + Mic */}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <button
            type="button"
            data-testid="voice-waveform-btn"
            onClick={onToggleSpeak}
            aria-label={isSpeaking ? 'توقف صدای مربی' : 'پخش راهنمای صوتی مربی'}
            className="flex h-10 items-center gap-1.5 rounded-full border border-white/15 bg-[#050B14]/80 px-3 text-white/90 hover:border-emerald-400/50 transition cursor-pointer"
          >
            <Volume2
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: isSpeaking ? meta.accentHex : 'rgba(255,255,255,0.7)' }}
            />
            <div className="flex h-5 items-center gap-[2.5px]">
              {WAVE_HEIGHTS.map((h, idx) => (
                <span
                  key={idx}
                  className="w-[2.5px] rounded-full transition-all duration-150"
                  style={{
                    height:
                      isSpeaking || isListeningVoice
                        ? `${h}px`
                        : `${Math.max(4, Math.round(h * 0.4))}px`,
                    backgroundColor:
                      isSpeaking || isListeningVoice ? meta.accentHex : 'rgba(255,255,255,0.45)',
                    opacity: isSpeaking || isListeningVoice ? 0.95 : 0.65,
                    animation:
                      isSpeaking || isListeningVoice
                        ? `pulse ${0.55 + (idx % 3) * 0.18}s ease-in-out infinite`
                        : undefined,
                  }}
                />
              ))}
            </div>
          </button>

          <button
            type="button"
            data-testid="upload-new-scene-btn"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 text-xs font-black text-[#031109] transition active:scale-[0.98] cursor-pointer"
            style={{
              background: `linear-gradient(90deg, ${meta.accentHex}, #4ADE80)`,
              boxShadow: `0 0 24px ${meta.accentHex}66`,
            }}
          >
            <Upload className="h-3.5 w-3.5 shrink-0" />
            <span>{isAnalyzingUpload ? 'در حال تحلیل صحنه...' : 'ارسال صحنه جدید'}</span>
          </button>

          <button
            type="button"
            data-testid="voice-mic-btn"
            aria-label="پرسش صوتی از مربی"
            onClick={onToggleVoiceQa}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition cursor-pointer"
            style={{
              backgroundColor: isListeningVoice
                ? 'rgba(244, 63, 94, 0.28)'
                : 'rgba(5, 11, 20, 0.8)',
              borderColor: isListeningVoice
                ? 'rgba(244, 63, 94, 0.85)'
                : 'rgba(255, 255, 255, 0.16)',
              color: isListeningVoice ? '#FDA4AF' : '#FFFFFF',
            }}
          >
            {isListeningVoice ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        </div>
      </footer>
    </div>
  );
}
