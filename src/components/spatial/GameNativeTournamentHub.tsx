import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowRight,
  Check,
  ListOrdered,
  Rotate3d,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import {
  GAME_THEMES,
  TOURNAMENT_GAME_ORDER,
  type GameThemeConfig,
  type Hologram3DGameId,
  type TournamentGameId,
  getRosterCountDisplay,
  getInviteCandidateName,
  toPersianNum,
} from '../../data/gameTournamentThemes';
import { TournamentHologramTable3D } from './TournamentHologramTable3D';
import { StadiumTurntable } from './StadiumTurntable';

interface GameNativeTournamentHubProps {
  initialGameId?: TournamentGameId;
  onBack: () => void;
}

function getCardRadiusClass(shapeStyle: GameThemeConfig['shapeStyle']): string {
  switch (shapeStyle) {
    case 'tactical':
    case 'sharp':
    case 'scifi':
      return 'rounded-md';
    case 'frontier':
      return 'rounded-sm';
    case 'neon':
      return 'rounded-xl';
    case 'sleek':
    default:
      return 'rounded-2xl';
  }
}

export const GameNativeTournamentHub: React.FC<GameNativeTournamentHubProps> = ({
  initialGameId = 'FC27',
  onBack,
}) => {
  const [activeGameId, setActiveGameId] = useState<TournamentGameId>(initialGameId);
  const [filledEmptySlots, setFilledEmptySlots] = useState<Record<string, boolean>>({});
  const [readyByGame, setReadyByGame] = useState<Record<TournamentGameId, boolean>>({
    FC27: false,
    NBA2K: false,
    FORTNITE: false,
    DOTA2: false,
    F1: false,
    WARZONE: false,
    CS2: false,
    GTA: false,
    RDR2: false,
    APEX: false,
  });
  const [isStandingsOpen, setIsStandingsOpen] = useState(false);

  const theme = GAME_THEMES[activeGameId];
  const { languageCode: tourLang } = useLanguage();
  const isFaTour = tourLang?.startsWith('fa') ?? true;
  // English twins when the app UI is English; Persian otherwise
  const t = {
    fullTitle: isFaTour ? theme.fullTitleFa : theme.fullTitleEn,
    subtitle: isFaTour ? theme.subtitleFa : theme.subtitleEn,
    lobbyCount: isFaTour ? theme.lobbyCountFa : theme.lobbyCountEn,
    hologramTitle: (isFaTour ? theme.hologramTitleFa : (theme.hologramTitleEn ?? theme.hologramTitleFa)),
    hologramSubtitle: isFaTour ? theme.hologramSubtitleFa : theme.hologramSubtitleEn,
    roomLabel: isFaTour ? theme.roomLabelFa : theme.roomLabelEn,
    invite: getInviteCandidateName(theme, isFaTour),
    primaryCta: isFaTour ? theme.primaryCtaFa : theme.primaryCtaEn,
    readyCta: isFaTour ? theme.readyCtaFa : theme.readyCtaEn,
    readyToast: isFaTour ? theme.readyToastFa : theme.readyToastEn,
    fullTitlePlain: isFaTour ? theme.fullTitleFa : theme.fullTitleEn,
    ruleBadge: (isFaTour ? theme.standingsHeaders.ruleBadgeFa : (theme.standingsHeaders.ruleBadgeEn ?? theme.standingsHeaders.ruleBadgeFa)),
    teamCol: (isFaTour ? theme.standingsHeaders.teamColFa : (theme.standingsHeaders.teamColEn ?? theme.standingsHeaders.teamColFa)),
    stat1Col: (isFaTour ? theme.standingsHeaders.stat1ColFa : (theme.standingsHeaders.stat1ColEn ?? theme.standingsHeaders.stat1ColFa)),
    stat2Col: (isFaTour ? theme.standingsHeaders.stat2ColFa : (theme.standingsHeaders.stat2ColEn ?? theme.standingsHeaders.stat2ColFa)),
    scoreCol: (isFaTour ? theme.standingsHeaders.scoreColFa : (theme.standingsHeaders.scoreColEn ?? theme.standingsHeaders.scoreColFa)),
    rosterDone: (isFaTour ? 'ترکیب تکمیل شد' : 'Squad locked in') as string,
    rosterInv: (isFaTour ? 'برای دعوت روی جایگاه خالی بزنید' : 'Tap an empty slot to invite') as string,
    sheetTitle: isFaTour ? 'جدول کامل · ' : 'Full standings · ',
    sheetOpen: isFaTour ? 'جدول کامل' : 'Full standings',
    back: isFaTour ? 'بازگشت' : 'Back',
    totalTeams: isFaTour
      ? `تعداد کل شرکت‌کنندگان: ${toPersianNum(theme.standings.length)}+ تیم فعال`
      : `Total participants: ${theme.standings.length}+ active teams`,
    backToTable: (isFaTour ? 'بازگشت به میز ۳بعدی' : 'Back to the 3D table') as string,
  };
  const isReady = readyByGame[activeGameId];
  const radiusClass = getCardRadiusClass(theme.shapeStyle);

  const rosterSummary = useMemo(
    () => getRosterCountDisplay(theme, filledEmptySlots),
    [theme, filledEmptySlots]
  );

  const cssVars = useMemo(
    () =>
      ({
        '--hub-primary': theme.colors.primary,
        '--hub-secondary': theme.colors.secondary,
        '--hub-accent': theme.colors.accent,
        '--hub-surface': theme.colors.hudSurface,
        '--hub-border': theme.colors.hudBorder,
        '--hub-font-display': theme.fonts.display,
        '--hub-font-numeral': theme.fonts.numeral,
        '--hub-font-persian': theme.fonts.persian,
        '--hub-font-heading': theme.fonts.persianHeading,
      }) as React.CSSProperties,
    [theme]
  );

  const handleToggleEmptySlot = (slotId: string) => {
    setFilledEmptySlots((prev) => ({
      ...prev,
      [slotId]: !prev[slotId],
    }));
  };

  const handleToggleReady = () => {
    setReadyByGame((prev) => ({
      ...prev,
      [activeGameId]: !prev[activeGameId],
    }));
  };

  const handleSelectGame = (nextId: TournamentGameId) => {
    setActiveGameId(nextId);
    setIsStandingsOpen(false);
  };

  const isFrontier = theme.shapeStyle === 'frontier';
  const isNeon = theme.shapeStyle === 'neon';
  // High-contrast readable foreground accent for small text on dark surfaces (e.g., RDR2 uses bright amber-gold / parchment for micro-labels while keeping #B91C1C crimson on CTA & seal)
  const readableAccent = isFrontier ? theme.colors.secondary : theme.colors.primary;
  const rosterGridCols =
    theme.roster.slots.length === 3
      ? 'grid-cols-3'
      : theme.roster.slots.length === 5
        ? 'grid-cols-5'
        : 'grid-cols-4';

  return (
    <div
      dir="rtl"
      data-testid="game-native-tournament-hub"
      data-tournament-game={activeGameId}
      style={{
        ...cssVars,
        backgroundColor: theme.colors.roomBg,
        fontFamily: theme.fonts.persian,
        color: '#F8FAFC',
      }}
      className="relative max-w-md mx-auto w-full h-dvh overflow-hidden select-none"
    >
      {/* LAYER 1: Interactive 360° Turntable Video (FC27, NBA2K, FORTNITE, DOTA2) / 3D GLSL Hologram Table Room */}
      {theme.turntableVideo ? (
        <StadiumTurntable
          key={theme.id}
          src={theme.turntableVideo.src}
          roomBg={theme.colors.roomBg}
          primaryHex={theme.colors.primary}
          primaryRgb={theme.colors.primaryRgb}
          secondaryHex={theme.colors.secondary}
          displayFont={theme.fonts.display}
          ariaLabel={theme.turntableVideo.ariaLabelFa}
          pins={theme.turntableVideo.pins}
        />
      ) : (
        <TournamentHologramTable3D gameId={activeGameId as Hologram3DGameId} />
      )}

      {/* Subtle top & bottom gradient scrims for guaranteed WCAG AA legibility over 3D room */}
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

      {/* LAYER 2: Crystal-Clear Spatial HUD (Unobstructed Center 3D Window + Safe-Area Top Clearance) */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between px-3.5 pt-[max(3.75rem,env(safe-area-inset-top))] pb-3.5 pointer-events-none">
        {/* === TOP ZONE: Game Switcher + Top Context + Squad Lineup === */}
        <div className="w-full flex flex-col gap-2 shrink-0 pointer-events-auto">
          {/* Row 1: Back + Multi-Game Native Switcher */}
          <header className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              data-testid="tournament-back-btn"
              aria-label={isFaTour ? 'بازگشت به منوی اصلی' : 'Back to the main menu'}
              className={`shrink-0 h-9 px-2.5 inline-flex items-center gap-1 text-[11.5px] font-bold transition cursor-pointer border ${radiusClass}`}
              style={{
                backgroundColor: theme.colors.hudSurface,
                borderColor: 'rgba(255,255,255,0.16)',
                color: '#F8FAFC',
              }}
            >
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{t.back}</span>
            </button>

            <nav
              aria-label={isFaTour ? 'انتخاب بازی تورنمنت' : 'Pick the tournament game'}
              data-testid="tournament-game-switcher"
              dir="ltr"
              className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
            >
              {TOURNAMENT_GAME_ORDER.map((gid) => {
                const gCfg = GAME_THEMES[gid];
                const active = gid === activeGameId;
                return (
                  <button
                    key={gid}
                    type="button"
                    data-testid={`tournament-tab-${gid}`}
                    aria-pressed={active}
                    onClick={() => handleSelectGame(gid)}
                    style={{
                      fontFamily: gCfg.fonts.display,
                      backgroundColor: active ? gCfg.colors.primary : 'rgba(9, 13, 20, 0.78)',
                      color: active ? gCfg.colors.ctaText : 'rgba(248, 250, 252, 0.78)',
                      borderColor: active ? gCfg.colors.primary : 'rgba(255, 255, 255, 0.14)',
                      boxShadow: active ? `0 0 18px rgba(${gCfg.colors.primaryRgb}, 0.42)` : 'none',
                    }}
                    className={`shrink-0 whitespace-nowrap min-h-[34px] px-3 text-[13px] font-bold tracking-wider transition-all cursor-pointer border ${radiusClass}`}
                  >
                    {gCfg.shortLabel}
                  </button>
                );
              })}
            </nav>
          </header>

          {/* Row 2: Top Context Block (Zero Static Pill Clutter — Pure Game-Native Typography) */}
          <section
            aria-label={isFaTour ? 'اطلاعات تورنمنت فعال' : 'Active tournament info'}
            data-testid="tournament-top-context"
            className="flex items-end justify-between gap-2 px-0.5"
          >
            <div className="min-w-0">
              <h1
                data-testid="tournament-title"
                style={{
                  fontFamily: theme.fonts.persianHeading,
                  color: isFrontier ? theme.colors.accent : '#FFFFFF',
                  letterSpacing: isFrontier ? '0.02em' : '0em',
                }}
                className="text-[19px] leading-tight font-extrabold truncate"
              >
                {t.fullTitle}
              </h1>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] font-medium text-white/80 truncate">
                <span
                  data-testid="tournament-subtitle"
                  style={{ color: readableAccent }}
                  className="font-bold truncate"
                >
                  {t.subtitle}
                </span>
                <span aria-hidden="true" className="text-white/35">
                  ·
                </span>
                <span className="text-white/80 shrink-0">{t.lobbyCount}</span>
              </div>
            </div>

            <div className="shrink-0 text-left">
              <span
                dir="ltr"
                data-testid="tournament-native-code"
                style={{
                  fontFamily: theme.fonts.display,
                  color: theme.colors.secondary,
                }}
                className="block text-[18px] leading-none font-bold tracking-widest uppercase"
              >
                {theme.shortLabel}
              </span>
              <span className="block mt-0.5 text-[10px] text-white/55 whitespace-nowrap">
                {t.roomLabel}
              </span>
            </div>
          </section>

          {/* Row 3: Squad / Club / Crew / Posse Lineup with Interactive Empty Slot */}
          <section
            aria-label={isFaTour ? 'ترکیب تیم شما' : 'Your squad lineup'}
            data-testid="tournament-roster-strip"
            style={{
              backgroundColor: theme.colors.hudSurface,
              borderColor: theme.colors.hudBorder,
              boxShadow: isNeon
                ? `0 0 22px rgba(${theme.colors.primaryRgb}, 0.16), inset 0 1px 0 rgba(255,255,255,0.08)`
                : 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            className={`w-full px-3 py-2 border ${radiusClass}`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span
                data-testid="tournament-roster-header"
                className="text-[12px] font-extrabold text-white"
              >
                {isFaTour ? rosterSummary.headerTextFa : rosterSummary.headerTextEn}
              </span>
              <span className="text-[10.5px] font-semibold" style={{ color: theme.colors.secondary }}>
                {rosterSummary.filled === rosterSummary.total
                  ? t.rosterDone
                  : t.rosterInv}
              </span>
            </div>

            <div className={`grid ${rosterGridCols} gap-1.5`}>
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
                        borderColor: readableAccent,
                        backgroundColor: `rgba(${theme.colors.primaryRgb}, 0.16)`,
                        color: isFrontier ? theme.colors.accent : theme.colors.primary,
                      }}
                      className={`min-w-0 min-h-[38px] px-1.5 py-1 border border-dashed flex flex-col items-center justify-center text-center transition hover:brightness-110 cursor-pointer ${radiusClass}`}
                    >
                      <UserPlus className="w-3 h-3 shrink-0 mb-0.5" />
                      <span className="text-[9.5px] leading-tight font-extrabold truncate max-w-full">
                        {(isFaTour ? slot.emptyLabel : (slot.emptyLabelEn ?? slot.emptyLabel))}
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
                        ? readableAccent
                        : 'rgba(255, 255, 255, 0.12)',
                    }}
                    className={`min-w-0 min-h-[38px] px-1.5 py-1 border flex flex-col justify-center items-center text-center transition ${
                      !slot.filled ? 'cursor-pointer' : 'cursor-default'
                    } ${radiusClass}`}
                  >
                    <span
                      dir={slot.isLtrRole ? 'ltr' : 'rtl'}
                      style={{
                        fontFamily: slot.isLtrRole ? theme.fonts.display : theme.fonts.persian,
                        color: isDynamicallyFilled
                          ? readableAccent
                          : isFrontier
                            ? theme.colors.accent
                            : theme.colors.secondary,
                      }}
                      className="text-[10.5px] leading-none font-bold tracking-wide truncate max-w-full"
                    >
                      {(isFaTour ? slot.roleLabel : (slot.roleLabelEn ?? slot.roleLabel))}
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

        {/* === CENTER ZONE: Unobstructed 3D Hologram Table Viewport === */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-end pb-2 pointer-events-none">
          <div
            data-testid="hologram-stage-caption"
            style={{
              backgroundColor: 'rgba(6, 10, 16, 0.72)',
              borderColor: `rgba(${theme.colors.primaryRgb}, 0.35)`,
            }}
            className="px-3 py-1 rounded-full border inline-flex items-center gap-2 text-[10.5px] font-semibold text-white/85"
          >
            <Rotate3d className="w-3.5 h-3.5 shrink-0" style={{ color: readableAccent }} />
            <span>{t.hologramTitle}</span>
            <span aria-hidden="true" className="text-white/35">
              ·
            </span>
            <span style={{ color: readableAccent }} className="font-bold">
              {t.hologramSubtitle}
            </span>
          </div>
        </div>

        {/* === BOTTOM ZONE: 3 Labeled Metrics + Primary CTA & Standings Trigger === */}
        <div className="w-full flex flex-col gap-2 shrink-0 pointer-events-auto">
          {/* Ready Confirmation Banner (only shown when user confirms primary CTA) */}
          {isReady && (
            <div
              role="status"
              data-testid="tournament-ready-banner"
              style={{
                backgroundColor: `rgba(${theme.colors.primaryRgb}, 0.16)`,
                borderColor: `rgba(${theme.colors.primaryRgb}, 0.5)`,
                color: '#FFFFFF',
              }}
              className={`px-3 py-1.5 border flex items-center justify-between gap-2 text-[11px] font-bold ${radiusClass}`}
            >
              <span className="inline-flex items-center gap-1.5 truncate">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: theme.colors.primary }} />
                <span className="truncate">{t.readyToast}</span>
              </span>
              <span className="text-[10px] shrink-0" style={{ color: theme.colors.primary }}>
                
              </span>
            </div>
          )}

          {/* 3 Labeled Spatial Metrics Strip (Clean Hairline Dividers, Zero Spreadsheet Clutter) */}
          <section
            aria-label={isFaTour ? 'آمار کلیدی تورنمنت' : 'Tournament key stats'}
            data-testid="tournament-metrics-strip"
            style={{
              backgroundColor: theme.colors.hudSurface,
              borderColor: theme.colors.hudBorder,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            className={`w-full grid grid-cols-3 divide-x divide-x-reverse divide-white/10 border py-2.5 ${radiusClass}`}
          >
            {theme.metrics.map((m) => (
              <div
                key={m.id}
                data-testid={`tournament-metric-${m.id}`}
                className="px-2 flex flex-col items-center justify-center text-center min-w-0"
              >
                <span className="text-[10px] leading-tight font-semibold text-white/65 truncate max-w-full">
                  {(isFaTour ? m.labelFa : (m.labelEn ?? m.labelFa))}
                </span>
                <span
                  dir={m.isLtrValue ? 'ltr' : 'rtl'}
                  style={{
                    fontFamily: m.isLtrValue ? theme.fonts.numeral : theme.fonts.persianHeading,
                    color: m.highlight
                      ? readableAccent
                      : isFrontier
                        ? theme.colors.accent
                        : '#FFFFFF',
                  }}
                  className="mt-1 text-[20px] leading-none font-bold tracking-wide tabular-nums whitespace-nowrap"
                >
                  {m.valueDisplay}
                </span>
              </div>
            ))}
          </section>

          {/* Primary Game-Native CTA + Full Standings Drawer Trigger */}
          <footer className="w-full flex items-center gap-2">
            <button
              type="button"
              data-testid="tournament-primary-cta"
              onClick={handleToggleReady}
              style={{
                backgroundColor: isReady ? 'rgba(15, 23, 36, 0.92)' : theme.colors.primary,
                color: isReady ? theme.colors.primary : theme.colors.ctaText,
                borderColor: theme.colors.primary,
                boxShadow: isReady
                  ? `0 0 16px rgba(${theme.colors.primaryRgb}, 0.25)`
                  : `0 8px 26px rgba(${theme.colors.primaryRgb}, 0.38)`,
              }}
              className={`flex-1 min-h-[46px] px-4 border text-[13.5px] font-extrabold transition-all active:scale-[0.99] inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${radiusClass}`}
            >
              {isReady && <Check className="w-4 h-4 shrink-0" />}
              <span className="truncate">{isReady ? t.readyCta : t.primaryCta}</span>
            </button>

            <button
              type="button"
              data-testid="open-full-standings-btn"
              onClick={() => setIsStandingsOpen(true)}
              style={{
                backgroundColor: theme.colors.hudSurface,
                borderColor: theme.colors.hudBorder,
                color: '#F8FAFC',
              }}
              className={`shrink-0 min-h-[46px] px-3.5 border text-[12px] font-bold hover:brightness-115 transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${radiusClass}`}
            >
              <ListOrdered className="w-4 h-4 shrink-0" style={{ color: theme.colors.primary }} />
              <span>{t.sheetOpen}</span>
            </button>
          </footer>
        </div>
      </div>

      {/* LAYER 3: Translucent Standings Bottom Sheet (`جدول کامل`) */}
      {isStandingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${t.sheetOpen} · ${t.fullTitle}`}
          data-testid="tournament-standings-sheet"
          className="absolute inset-0 z-30 flex flex-col justify-end"
          style={{ backgroundColor: 'rgba(3, 6, 11, 0.72)' }}
          onClick={() => setIsStandingsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.colors.roomBg,
              borderColor: theme.colors.hudBorder,
              boxShadow: `0 -18px 48px rgba(0, 0, 0, 0.72)`,
            }}
            className="w-full max-h-[76dvh] rounded-t-3xl border-t border-x flex flex-col overflow-hidden"
          >
            {/* Sheet Grab Handle & Header */}
            <div className="px-4 pt-3 pb-2.5 border-b border-white/10 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-2.5" />
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2
                    style={{
                      fontFamily: theme.fonts.persianHeading,
                      color: '#FFFFFF',
                    }}
                    className="text-[16px] font-extrabold truncate"
                  >
                    {t.sheetTitle}{t.fullTitle}
                  </h2>
                  <p className="mt-0.5 text-[11px] font-medium text-white/65 truncate">
                    {t.ruleBadge}
                  </p>
                </div>

                <button
                  type="button"
                  data-testid="close-standings-sheet-btn"
                  aria-label={isFaTour ? 'بستن جدول کامل' : 'Close full standings'}
                  onClick={() => setIsStandingsOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/8 border border-white/15 flex items-center justify-center text-white/85 hover:bg-white/15 cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Clean Column Header */}
            <div className="px-4 py-2 grid grid-cols-12 gap-1 text-[10.5px] font-bold text-white/55 border-b border-white/8 shrink-0">
              <span className="col-span-1 text-center">#</span>
              <span className="col-span-5">{t.teamCol}</span>
              <span className="col-span-2 text-center">{t.stat1Col}</span>
              <span className="col-span-2 text-center">{t.stat2Col}</span>
              <span className="col-span-2 text-left">{t.scoreCol}</span>
            </div>

            {/* Standings Rows */}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar divide-y divide-white/8 px-3 py-1">
              {theme.standings.map((row) => (
                <div
                  key={`${theme.id}-${row.rank}`}
                  data-testid={`standing-row-${row.rank}`}
                  style={
                    row.isUserTeam
                      ? {
                          backgroundColor: `rgba(${theme.colors.primaryRgb}, 0.14)`,
                          borderColor: `rgba(${theme.colors.primaryRgb}, 0.45)`,
                        }
                      : undefined
                  }
                  className={`px-2 py-2.5 grid grid-cols-12 items-center gap-1 text-[12px] ${
                    row.isUserTeam ? `${radiusClass} border my-0.5` : ''
                  }`}
                >
                  <span
                    dir="ltr"
                    style={{
                      fontFamily: theme.fonts.numeral,
                      color:
                        row.rank === 1
                          ? '#FACC15'
                          : row.isUserTeam
                            ? readableAccent
                            : '#E2E8F0',
                    }}
                    className="col-span-1 text-center text-[15px] font-bold tabular-nums"
                  >
                    {row.rank}
                  </span>

                  <div className="col-span-5 min-w-0 flex items-center gap-1.5">
                    <span className="font-bold text-white truncate">{isFaTour ? row.nameFa : (row.nameEn ?? row.nameFa)}</span>
                    <span
                      dir="ltr"
                      style={{ fontFamily: theme.fonts.display }}
                      className="text-[11px] font-bold text-white/50 shrink-0"
                    >
                      {row.tag}
                    </span>
                  </div>

                  <span
                    dir="ltr"
                    style={{ fontFamily: theme.fonts.numeral }}
                    className="col-span-2 text-center text-[13px] font-semibold text-white/80 tabular-nums"
                  >
                    {row.statPrimary}
                  </span>

                  <span
                    dir="ltr"
                    style={{ fontFamily: theme.fonts.numeral }}
                    className="col-span-2 text-center text-[13px] font-semibold text-white/80 tabular-nums"
                  >
                    {row.statSecondary}
                  </span>

                  <span
                    dir="ltr"
                    style={{
                      fontFamily: theme.fonts.numeral,
                      color: row.isUserTeam ? theme.colors.primary : '#FFFFFF',
                    }}
                    className="col-span-2 text-left text-[15px] font-bold tabular-nums"
                  >
                    {row.score}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-4 py-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60 shrink-0">
              <span>{t.totalTeams}</span>
              <button
                type="button"
                onClick={() => setIsStandingsOpen(false)}
                style={{ color: theme.colors.primary }}
                className="font-extrabold cursor-pointer"
              >
                {t.backToTable}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
