import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Film,
  Moon,
  Play,
  Rotate3d,
  ShieldCheck,
  Sun,
  Tv,
  UserPlus,
  X,
} from 'lucide-react';
import {
  CINEMA_ROOMS,
  type CinemaRoomId,
  INITIAL_CINEMA_STREAMS,
  type StreamAuthReport,
  authenticateStreamLink,
} from '../../utils/cinemaAgents';
import { CINEMA_CARDS_BY_ROOM } from '../../utils/hubLobbyCatalog';
import {
  CINEMA_ROOM_ORDER,
  CINEMA_ROOM_THEMES,
  getMediaRosterCountDisplay,
} from '../../data/mediaRoomsThemes';
import { toPersianNum } from '../../data/gameTournamentThemes';
import { CinemaGlassPlayer } from '../spatial/CinemaGlassPlayer';
import { StadiumTurntable } from '../spatial/StadiumTurntable';

interface CinemaRoomsTournamentHubProps {
  initialRoomId?: CinemaRoomId;
  activeStreamUrl: string;
  activeStreamTitleFa: string;
  activeStreamReport: StreamAuthReport;
  cinemaDimMode: boolean;
  onToggleCinemaDim: () => void;
  onLoadVerifiedStream: (url: string, report: StreamAuthReport, titleFa?: string) => void;
  onSelectRoomExternal?: (roomId: CinemaRoomId) => void;
  onBack: () => void;
}

const PERSIAN_FONT = "'Vazirmatn', system-ui, sans-serif";
const DISPLAY_FONT = "'Barlow Condensed', 'Oswald', sans-serif";

export const CinemaRoomsTournamentHub: React.FC<CinemaRoomsTournamentHubProps> = ({
  initialRoomId = 'movie',
  activeStreamUrl,
  activeStreamTitleFa,
  activeStreamReport,
  cinemaDimMode,
  onToggleCinemaDim,
  onLoadVerifiedStream,
  onSelectRoomExternal,
  onBack,
}) => {
  const [activeRoomId, setActiveRoomId] = useState<CinemaRoomId>(initialRoomId);
  const [filledEmptySlots, setFilledEmptySlots] = useState<Record<string, boolean>>({});
  const [readyByRoom, setReadyByRoom] = useState<Record<CinemaRoomId, boolean>>({
    movie: false,
    series: false,
    anime: false,
    documentary: false,
    'tv-climax': false,
  });
  const [isStreamSheetOpen, setIsStreamSheetOpen] = useState(false);

  const theme = CINEMA_ROOM_THEMES[activeRoomId];
  const activeRoomConfig = useMemo(
    () => CINEMA_ROOMS.find((r) => r.id === activeRoomId) ?? CINEMA_ROOMS[0],
    [activeRoomId]
  );
  const roomCards = CINEMA_CARDS_BY_ROOM[activeRoomId] ?? [];
  const isReady = readyByRoom[activeRoomId];

  const rosterSummary = useMemo(
    () => getMediaRosterCountDisplay(theme, filledEmptySlots),
    [theme, filledEmptySlots]
  );

  const handleToggleEmptySlot = (slotId: string) => {
    setFilledEmptySlots((prev) => ({
      ...prev,
      [slotId]: !prev[slotId],
    }));
  };

  const handleToggleReady = () => {
    const nextVal = !readyByRoom[activeRoomId];
    setReadyByRoom((prev) => ({
      ...prev,
      [activeRoomId]: nextVal,
    }));
    if (nextVal !== cinemaDimMode) {
      onToggleCinemaDim();
    }
  };

  const handleSelectRoom = (nextId: CinemaRoomId) => {
    setActiveRoomId(nextId);
    setIsStreamSheetOpen(false);
    onSelectRoomExternal?.(nextId);
  };

  const handlePlayRoomPreset = (titleFa: string, rawUrl?: string) => {
    const url = rawUrl || INITIAL_CINEMA_STREAMS[0].streamUrl;
    const report = authenticateStreamLink(url);
    if (report.isValid && report.isSafe) {
      onLoadVerifiedStream(report.sanitizedUrl, report, titleFa);
    }
  };

  return (
    <div
      dir="rtl"
      data-testid="cinema-rooms-tournament-hub"
      data-cinema-room={activeRoomId}
      style={{
        backgroundColor: theme.colors.roomBg,
        fontFamily: PERSIAN_FONT,
        color: '#F8FAFC',
      }}
      className="relative max-w-md mx-auto w-full h-dvh overflow-hidden select-none"
    >
      {/* LAYER 1: Interactive 360° Turntable Video (/assets/rooms/cinema/{room}.mp4) */}
      <StadiumTurntable
        key={theme.id}
        src={theme.videoSrc}
        fallbackImageUrl={theme.fallbackImageUrl}
        roomBg={theme.colors.roomBg}
        primaryHex={theme.colors.primary}
        primaryRgb={theme.colors.primaryRgb}
        secondaryHex={theme.colors.secondary}
        displayFont={DISPLAY_FONT}
        ariaLabel={`نمای سه‌بعدی ${theme.fullTitleFa} — برای چرخش افقی بکشید`}
        pins={theme.pins}
      />

      {/* Cinema Dim Overlay when active */}
      {cinemaDimMode && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] bg-black/35 transition-opacity duration-500"
        />
      )}

      {/* Subtle top & bottom gradient scrims for crisp legibility over 360° stage */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-60 z-[1]"
        style={{
          background: `linear-gradient(180deg, ${theme.colors.roomBg}F2 0%, ${theme.colors.roomBg}A6 62%, transparent 100%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56 z-[1]"
        style={{
          background: `linear-gradient(0deg, ${theme.colors.roomBg}F5 0%, ${theme.colors.roomBg}AD 56%, transparent 100%)`,
        }}
      />

      {/* LAYER 2: Crystal-Clear Spatial HUD (Unobstructed Center Turntable Viewport) */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between px-3.5 pt-[max(3.75rem,env(safe-area-inset-top))] pb-3.5 pointer-events-none">
        {/* === TOP ZONE: Back + 5 Cinema Rooms Switcher + Top Context + Watch-Party Lineup === */}
        <div className="w-full flex flex-col gap-2 shrink-0 pointer-events-auto">
          {/* Row 1: Back + 5 Cinema Rooms Switcher */}
          <header className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              data-testid="cinema-rooms-back-btn"
              aria-label="بازگشت به لابی سینما"
              className="shrink-0 h-9 px-2.5 rounded-2xl inline-flex items-center gap-1 text-[11.5px] font-bold transition cursor-pointer border"
              style={{
                backgroundColor: theme.colors.hudSurface,
                borderColor: 'rgba(255,255,255,0.16)',
                color: '#F8FAFC',
              }}
            >
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">بازگشت</span>
            </button>

            <nav
              aria-label="انتخاب سالن سه‌بعدی سینما و تلویزیون"
              data-testid="cinema-rooms-switcher"
              dir="rtl"
              className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
            >
              {CINEMA_ROOM_ORDER.map((rid) => {
                const cfg = CINEMA_ROOM_THEMES[rid];
                const active = rid === activeRoomId;
                return (
                  <button
                    key={rid}
                    type="button"
                    data-testid={`cinema-room-tab-${rid}`}
                    aria-pressed={active}
                    onClick={() => handleSelectRoom(rid)}
                    style={{
                      backgroundColor: active ? cfg.colors.primary : 'rgba(9, 13, 20, 0.78)',
                      color: active ? cfg.colors.ctaText : 'rgba(248, 250, 252, 0.80)',
                      borderColor: active ? cfg.colors.primary : 'rgba(255, 255, 255, 0.14)',
                      boxShadow: active ? `0 0 18px rgba(${cfg.colors.primaryRgb}, 0.42)` : 'none',
                    }}
                    className="shrink-0 whitespace-nowrap min-h-[34px] px-3 rounded-2xl text-[12px] font-bold transition-all cursor-pointer border"
                  >
                    {cfg.shortLabel}
                  </button>
                );
              })}
            </nav>
          </header>

          {/* Row 2: Top Context Block */}
          <section
            aria-label="اطلاعات سالن سینمای فعال"
            data-testid="cinema-rooms-top-context"
            className="flex items-end justify-between gap-2 px-0.5"
          >
            <div className="min-w-0">
              <h1
                data-testid="cinema-rooms-title"
                className="text-[19px] leading-tight font-extrabold text-white truncate"
              >
                {theme.fullTitleFa}
              </h1>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] font-medium text-white/80 truncate">
                <span
                  data-testid="cinema-rooms-subtitle"
                  style={{ color: theme.colors.primary }}
                  className="font-bold truncate"
                >
                  {theme.subtitleFa}
                </span>
                <span aria-hidden="true" className="text-white/35">
                  ·
                </span>
                <span className="text-white/80 shrink-0">{theme.activeCountFa}</span>
              </div>
            </div>

            <div className="shrink-0 text-left">
              <span
                dir="ltr"
                data-testid="cinema-rooms-native-code"
                style={{
                  fontFamily: DISPLAY_FONT,
                  color: theme.colors.secondary,
                }}
                className="block text-[17px] leading-none font-bold tracking-widest uppercase"
              >
                {theme.nativeCode}
              </span>
              <span className="block mt-0.5 text-[10px] text-white/55 whitespace-nowrap">
                {theme.roomLabelFa}
              </span>
            </div>
          </section>

          {/* Row 3: 4-Slot Watch-Party Lineup */}
          <section
            aria-label="اعضای واچ‌پارتی سالن"
            data-testid="cinema-rooms-roster-strip"
            style={{
              backgroundColor: theme.colors.hudSurface,
              borderColor: theme.colors.hudBorder,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            className="w-full px-3 py-2 rounded-2xl border"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span
                data-testid="cinema-rooms-roster-header"
                className="text-[12px] font-extrabold text-white"
              >
                {rosterSummary.headerTextFa}
              </span>
              <span className="text-[10.5px] font-semibold" style={{ color: theme.colors.secondary }}>
                {rosterSummary.filled === rosterSummary.total
                  ? 'سالن تکمیل شد'
                  : 'برای دعوت روی صندلی خالی بزنید'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {theme.roster.slots.map((slot) => {
                const isDynamicallyFilled = !slot.filled && Boolean(filledEmptySlots[slot.id]);
                const effectiveFilled = slot.filled || isDynamicallyFilled;

                if (!effectiveFilled) {
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      data-testid={`roster-empty-slot-${slot.id}`}
                      onClick={() => handleToggleEmptySlot(slot.id)}
                      style={{
                        borderColor: theme.colors.primary,
                        backgroundColor: `rgba(${theme.colors.primaryRgb}, 0.16)`,
                        color: theme.colors.primary,
                      }}
                      className="min-w-0 min-h-[38px] px-1.5 py-1 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center transition hover:brightness-110 cursor-pointer"
                    >
                      <UserPlus className="w-3 h-3 shrink-0 mb-0.5" />
                      <span className="text-[9.5px] leading-tight font-extrabold truncate max-w-full">
                        {slot.emptyLabel}
                      </span>
                    </button>
                  );
                }

                const handleText = isDynamicallyFilled
                  ? theme.roster.inviteCandidateHandle
                  : slot.memberHandle;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    data-testid={`roster-filled-slot-${slot.id}`}
                    onClick={() => {
                      if (!slot.filled) handleToggleEmptySlot(slot.id);
                    }}
                    style={{
                      backgroundColor: isDynamicallyFilled
                        ? `rgba(${theme.colors.primaryRgb}, 0.22)`
                        : 'rgba(255, 255, 255, 0.06)',
                      borderColor: isDynamicallyFilled
                        ? theme.colors.primary
                        : 'rgba(255, 255, 255, 0.12)',
                    }}
                    className={`min-w-0 min-h-[38px] px-1.5 py-1 rounded-2xl border flex flex-col justify-center items-center text-center transition ${
                      !slot.filled ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <span
                      style={{
                        color: isDynamicallyFilled ? theme.colors.primary : theme.colors.secondary,
                      }}
                      className="text-[10.5px] leading-none font-bold tracking-wide truncate max-w-full"
                    >
                      {slot.roleLabel}
                    </span>
                    <span
                      dir="ltr"
                      className="mt-1 text-[9px] leading-none text-white/75 font-medium truncate max-w-full"
                    >
                      {handleText}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* === CENTER ZONE: Unobstructed 360° Turntable Window === */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-end pb-2 pointer-events-none">
          <div
            data-testid="cinema-stage-caption"
            style={{
              backgroundColor: 'rgba(6, 10, 16, 0.72)',
              borderColor: `rgba(${theme.colors.primaryRgb}, 0.35)`,
            }}
            className="px-3 py-1 rounded-full border inline-flex items-center gap-2 text-[10.5px] font-semibold text-white/85"
          >
            <Rotate3d className="w-3.5 h-3.5 shrink-0" style={{ color: theme.colors.primary }} />
            <span>{theme.stageTitleFa}</span>
            <span aria-hidden="true" className="text-white/35">
              ·
            </span>
            <span style={{ color: theme.colors.primary }} className="font-bold">
              {theme.stageSubtitleFa}
            </span>
          </div>
        </div>

        {/* === BOTTOM ZONE: Ready Status + 3 Metrics Strip + Primary CTA & Bottom Sheet Trigger === */}
        <div className="w-full flex flex-col gap-2 shrink-0 pointer-events-auto">
          {isReady && (
            <div
              role="status"
              data-testid="cinema-rooms-ready-banner"
              style={{
                backgroundColor: `rgba(${theme.colors.primaryRgb}, 0.16)`,
                borderColor: `rgba(${theme.colors.primaryRgb}, 0.5)`,
                color: '#FFFFFF',
              }}
              className="px-3 py-1.5 rounded-2xl border flex items-center justify-between gap-2 text-[11px] font-bold"
            >
              <span className="inline-flex items-center gap-1.5 truncate">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: theme.colors.primary }} />
                <span className="truncate">{theme.readyToastFa}</span>
              </span>
              <span className="text-[10px] shrink-0" style={{ color: theme.colors.primary }}>
                سینک فعال
              </span>
            </div>
          )}

          {/* 3 Labeled Spatial Metrics Strip */}
          <section
            aria-label="مشخصات پخش سالن"
            data-testid="cinema-rooms-metrics-strip"
            style={{
              backgroundColor: theme.colors.hudSurface,
              borderColor: theme.colors.hudBorder,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            className="w-full grid grid-cols-3 divide-x divide-x-reverse divide-white/10 rounded-2xl border py-2.5"
          >
            {theme.metrics.map((m) => (
              <div
                key={m.id}
                data-testid={`cinema-room-metric-${m.id}`}
                className="px-2 flex flex-col items-center justify-center text-center min-w-0"
              >
                <span className="text-[10px] leading-tight font-semibold text-white/65 truncate max-w-full">
                  {m.labelFa}
                </span>
                <span
                  dir={m.isLtrValue ? 'ltr' : 'rtl'}
                  style={{
                    fontFamily: m.isLtrValue ? DISPLAY_FONT : PERSIAN_FONT,
                    color: m.highlight ? theme.colors.primary : '#FFFFFF',
                  }}
                  className="mt-1 text-[19px] leading-none font-bold tracking-wide tabular-nums whitespace-nowrap"
                >
                  {m.valueDisplay}
                </span>
              </div>
            ))}
          </section>

          {/* Footer Primary CTA + Slide-up Stream/Player Sheet Trigger */}
          <footer className="w-full flex items-center gap-2">
            <button
              type="button"
              data-testid="cinema-rooms-primary-cta"
              onClick={handleToggleReady}
              style={{
                backgroundColor: isReady ? 'rgba(15, 23, 36, 0.92)' : theme.colors.primary,
                color: isReady ? theme.colors.primary : theme.colors.ctaText,
                borderColor: theme.colors.primary,
                boxShadow: isReady
                  ? `0 0 16px rgba(${theme.colors.primaryRgb}, 0.25)`
                  : `0 8px 26px rgba(${theme.colors.primaryRgb}, 0.38)`,
              }}
              className="flex-1 min-h-[46px] px-4 rounded-2xl border text-[13px] font-extrabold transition-all active:scale-[0.99] inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {isReady ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <Tv className="w-4 h-4 shrink-0" />
              )}
              <span className="truncate">{isReady ? theme.readyCtaFa : theme.primaryCtaFa}</span>
            </button>

            <button
              type="button"
              data-testid="cinema-rooms-sheet-btn"
              onClick={() => setIsStreamSheetOpen(true)}
              style={{
                backgroundColor: theme.colors.hudSurface,
                borderColor: theme.colors.hudBorder,
                color: '#F8FAFC',
              }}
              className="shrink-0 min-h-[46px] px-3.5 rounded-2xl border text-[12px] font-bold hover:brightness-115 transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Film className="w-4 h-4 shrink-0" style={{ color: theme.colors.primary }} />
              <span>{theme.sheetBtnLabelFa}</span>
            </button>
          </footer>
        </div>
      </div>

      {/* LAYER 3: Translucent Bottom Sheet (`استریم و لینک` + CinemaGlassPlayer) */}
      {isStreamSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`پخش و لینک‌های ${theme.fullTitleFa}`}
          data-testid="cinema-rooms-bottom-sheet"
          className="absolute inset-0 z-30 flex flex-col justify-end"
          style={{ backgroundColor: 'rgba(3, 6, 11, 0.72)' }}
          onClick={() => setIsStreamSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.colors.roomBg,
              borderColor: theme.colors.hudBorder,
              boxShadow: '0 -18px 48px rgba(0, 0, 0, 0.75)',
            }}
            className="w-full max-h-[80dvh] rounded-t-3xl border-t border-x flex flex-col overflow-hidden"
          >
            {/* Sheet Grab Handle & Header */}
            <div className="px-4 pt-3 pb-2.5 border-b border-white/10 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-2.5" />
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-[15.5px] font-extrabold text-white truncate">
                    {theme.sheetBtnLabelFa} · {theme.fullTitleFa}
                  </h2>
                  <p className="mt-0.5 text-[11px] font-medium text-white/60 truncate">
                    انتخاب استریم آماده یا بررسی لینک تلگرام و HLS
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={onToggleCinemaDim}
                    aria-label={cinemaDimMode ? 'نور عادی محیط' : 'حالت سینما'}
                    className="w-9 h-9 rounded-full bg-white/8 border border-white/15 flex items-center justify-center text-white/85 hover:bg-white/15 cursor-pointer"
                  >
                    {cinemaDimMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    data-testid="cinema-rooms-close-sheet-btn"
                    aria-label="بستن پنل استریم"
                    onClick={() => setIsStreamSheetOpen(false)}
                    className="w-9 h-9 rounded-full bg-white/8 border border-white/15 flex items-center justify-center text-white/85 hover:bg-white/15 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Body: Quick Room Presets + CinemaGlassPlayer */}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-3.5 flex flex-col gap-3">
              {/* Quick Stream Presets for this room */}
              <div className="grid grid-cols-2 gap-2">
                {roomCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handlePlayRoomPreset(card.titleFa, card.streamUrl)}
                    className="text-right rounded-2xl bg-white/[0.04] hover:bg-white/10 border border-white/10 p-2.5 transition cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span
                        className="text-[10px] font-bold block truncate"
                        style={{ color: theme.colors.primary }}
                      >
                        {card.categoryLabelFa}
                      </span>
                      <span className="text-[11.5px] font-extrabold text-white block truncate">
                        {card.titleFa}
                      </span>
                    </div>
                    <Play
                      className="w-3.5 h-3.5 shrink-0 translate-x-0.5"
                      style={{ color: theme.colors.primary }}
                    />
                  </button>
                ))}
              </div>

              <CinemaGlassPlayer
                room={activeRoomConfig}
                activeStreamUrl={activeStreamUrl}
                activeStreamTitleFa={activeStreamTitleFa}
                activeStreamReport={activeStreamReport}
                cinemaDimMode={cinemaDimMode}
                onToggleCinemaDim={onToggleCinemaDim}
                onLoadVerifiedStream={onLoadVerifiedStream}
                accentHex={theme.colors.primary}
              />
            </div>

            <div className="px-4 py-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60 shrink-0">
              <span>{toPersianNum(roomCards.length)} استریم آماده در این سالن</span>
              <button
                type="button"
                onClick={() => setIsStreamSheetOpen(false)}
                style={{ color: theme.colors.primary }}
                className="font-extrabold cursor-pointer"
              >
                بازگشت به نمای ۳۶۰°
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
