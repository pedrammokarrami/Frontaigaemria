import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  Clapperboard,
  Film,
  Menu,
  Moon,
  RotateCcw,
  Search,
  ShieldCheck,
  Sun,
  Users,
  X,
} from 'lucide-react';
import {
  CINEMA_ROOMS,
  type CinemaRoomId,
  INITIAL_CINEMA_STREAMS,
  type StreamAuthReport,
  type UndergroundStreamPost,
  authenticateStreamLink,
} from '../../utils/cinemaAgents';
import {
  CINEMA_CARDS_BY_ROOM,
  CINEMA_CATEGORIES_BY_ROOM,
  type HubCardItem,
  filterHubCards,
} from '../../utils/hubLobbyCatalog';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  getCardCategoryLabel,
  getCardTitle,
  getCategoryLabel,
  getRoomTitle,
} from '../../utils/i18nEngine';
import { MediaSpatialProfilePage } from '../identity/MediaSpatialProfilePage';
import { CinemaGlassPlayer } from '../spatial/CinemaGlassPlayer';
import { NetflixCinemaMenuOverlay } from '../spatial/HubQuickMenuOverlays';
import { MasterHubSwitcher, type MasterHubId } from '../spatial/MasterHubSwitcher';
import { SpatialVideoEnvironment } from '../spatial/SpatialVideoEnvironment';
import { CinemaFbiSocialWorld } from './CinemaFbiSocialWorld';
import { CinemaRoomsTournamentHub } from './CinemaRoomsTournamentHub';

interface CinemaHubViewProps {
  activeHub: MasterHubId;
  onSelectHub: (hub: MasterHubId) => void;
  onOpenMap: () => void;
  onOpenStore: () => void;
}

type CinemaSubViewMode = 'lobby' | 'rooms-hub' | 'player' | 'identity' | 'social';

export const CinemaHubView: React.FC<CinemaHubViewProps> = ({ activeHub, onSelectHub, onOpenMap, onOpenStore }) => {
  const { languageCode, isRtl, copy } = useLanguage();
  const [subView, setSubView] = useState<CinemaSubViewMode>('lobby');
  const [activeRoomId, setActiveRoomId] = useState<CinemaRoomId>('movie');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cinemaDimMode, setCinemaDimMode] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const activeRoom = useMemo(
    () => CINEMA_ROOMS.find((r) => r.id === activeRoomId) ?? CINEMA_ROOMS[0],
    [activeRoomId]
  );

  const effectiveAccent = activeRoom.accentHex;

  const categories = CINEMA_CATEGORIES_BY_ROOM[activeRoomId];
  const filteredCards = useMemo(
    () => filterHubCards(CINEMA_CARDS_BY_ROOM[activeRoomId], activeCategoryId, searchQuery),
    [activeRoomId, activeCategoryId, searchQuery]
  );

  const [activeStreamUrl, setActiveStreamUrl] = useState(INITIAL_CINEMA_STREAMS[0].streamUrl);
  const [activeStreamTitleFa, setActiveStreamTitleFa] = useState(INITIAL_CINEMA_STREAMS[0].titleFa);
  const [activeStreamReport, setActiveStreamReport] = useState<StreamAuthReport>(() =>
    authenticateStreamLink(INITIAL_CINEMA_STREAMS[0].streamUrl)
  );

  const handleRoomSwitch = (roomId: CinemaRoomId) => {
    setActiveRoomId(roomId);
    setActiveCategoryId('all');
    setSearchQuery('');
  };

  const handleOpenCardInPlayer = (card: HubCardItem) => {
    const targetUrl = card.streamUrl ?? INITIAL_CINEMA_STREAMS[0].streamUrl;
    const report = authenticateStreamLink(targetUrl);
    setActiveStreamUrl(report.sanitizedUrl || targetUrl);
    setActiveStreamTitleFa(card.titleFa);
    setActiveStreamReport(report);
    setSubView('player');
  };

  const handlePlayFromClub = (post: UndergroundStreamPost) => {
    const validRoom = CINEMA_ROOMS.some((r) => r.id === post.roomId);
    if (validRoom) setActiveRoomId(post.roomId as CinemaRoomId);
    const report = authenticateStreamLink(post.streamUrl);
    if (report.isValid && report.isSafe) {
      setActiveStreamUrl(report.sanitizedUrl);
      setActiveStreamTitleFa(post.titleFa);
      setActiveStreamReport(report);
      setSubView('player');
    }
  };

  if (subView === 'rooms-hub') {
    return (
      <div
        data-testid="cinema-hub-view"
        className="relative w-full h-dvh min-h-dvh overflow-hidden select-none bg-[#05060B]"
      >
        <CinemaRoomsTournamentHub
          initialRoomId={activeRoomId}
          activeStreamUrl={activeStreamUrl}
          activeStreamTitleFa={activeStreamTitleFa}
          activeStreamReport={activeStreamReport}
          cinemaDimMode={cinemaDimMode}
          onToggleCinemaDim={() => setCinemaDimMode((d) => !d)}
          onLoadVerifiedStream={(url, report, titleFa) => {
            setActiveStreamUrl(url);
            setActiveStreamReport(report);
            if (titleFa) setActiveStreamTitleFa(titleFa);
          }}
          onSelectRoomExternal={(rid) => handleRoomSwitch(rid)}
          onBack={() => setSubView('lobby')}
        />
      </div>
    );
  }

  if (subView === 'identity') {
    return (
      <div data-testid="cinema-hub-view" className="relative w-full min-h-dvh">
        <MediaSpatialProfilePage
          hub="cinema"
          initialRoomId={activeRoomId}
          onSelectRoomExternal={(rid) => handleRoomSwitch(rid as CinemaRoomId)}
          onBackToLobby={() => setSubView('lobby')}
        />
      </div>
    );
  }

  if (subView === 'social') {
    return (
      <div
        data-testid="cinema-hub-view"
        className="relative w-full h-dvh min-h-dvh overflow-hidden"
      >
        <CinemaFbiSocialWorld
          activeRoomId={activeRoomId}
          onPlayStreamInHub={handlePlayFromClub}
          onBack={() => setSubView('lobby')}
        />
      </div>
    );
  }

  return (
    <div
      data-testid="cinema-hub-view"
      className="relative w-full h-dvh min-h-dvh overflow-hidden select-none"
    >
      {/* Full-bleed Multi-Layer Unreal 5.8 + Three.js Spatial Environment (exact CoachStage3D architecture) */}
      <SpatialVideoEnvironment
        videoSrc={activeRoom.videoLoopPath}
        fallbackImageUrl={activeRoom.fallbackImageUrl}
        fallbackToneFilter={activeRoom.fallbackToneFilter}
        accentHex={effectiveAccent}
        secondaryHex={activeRoom.secondaryHex}
        vignetteCss={activeRoom.ambientVignetteCss}
        cinemaDimMode={cinemaDimMode}
        roomTitleFa={activeRoom.titleFa}
        particleMode={activeRoom.particleMode}
        isReactiveActive={subView === 'player'}
      />

      {/* SUB-VIEW 1: DEDICATED STREAM PLAYER STUDIO (Parity with RealClipCoachRoom) */}
      {subView === 'player' ? (
        <div
          data-testid="cinema-player-room"
          dir={isRtl ? 'rtl' : 'ltr'}
          className="relative z-20 max-w-4xl mx-auto w-full h-dvh overflow-y-auto px-4 pt-4 pb-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between gap-2 shrink-0 pl-14 sm:pl-16">
            <button
              type="button"
              data-testid="cinema-back-to-lobby-btn"
              onClick={() => setSubView('lobby')}
              className="shrink-0 whitespace-nowrap min-h-[38px] px-3.5 rounded-full bg-slate-950/70 backdrop-blur-xl border border-white/15 text-[12px] font-bold text-white hover:bg-slate-900/90 inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <ArrowRight className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
              <span>{copy.backToCinemaLobby}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSubView('social')}
                className="shrink-0 whitespace-nowrap min-h-[36px] px-3 rounded-full bg-slate-950/65 backdrop-blur-xl border border-white/15 text-[11.5px] font-bold text-cyan-200 hover:bg-cyan-500/15 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{copy.socialClub}</span>
              </button>
            </div>
          </div>

          <CinemaGlassPlayer
            room={activeRoom}
            activeStreamUrl={activeStreamUrl}
            activeStreamTitleFa={activeStreamTitleFa}
            activeStreamReport={activeStreamReport}
            cinemaDimMode={cinemaDimMode}
            onToggleCinemaDim={() => setCinemaDimMode((d) => !d)}
            onLoadVerifiedStream={(url, report, titleFa) => {
              setActiveStreamUrl(url);
              setActiveStreamReport(report);
              if (titleFa) setActiveStreamTitleFa(titleFa);
            }}
            accentHex={effectiveAccent}
          />
        </div>
      ) : (
        /* MAIN LOBBY: 100% IDENTICAL STORYBOARD & UX TO GAME LOBBY */
        <div
          data-testid="cinema-lobby-foreground-shell"
          className="relative z-20 max-w-md mx-auto w-full h-dvh min-h-dvh overflow-x-hidden px-4 pt-2.5 pb-4 flex flex-col justify-between gap-2"
        >
          {/* TOP STACK: MasterHubSwitcher + Cinema Room Switcher + Search & Chips */}
          <div className="w-full flex flex-col gap-2 shrink-0">
            <div className="flex justify-center pl-12 sm:pl-0">
              <MasterHubSwitcher
                activeHub={activeHub}
                onSelectHub={onSelectHub}
                accentHex={effectiveAccent}
              />
            </div>

            {/* Room Switcher Bar + Unclipped Action Destinations */}
            <header className="w-full shrink-0 flex flex-col gap-1.5 pl-11 sm:pl-0">
              <nav
                aria-label={copy.cinemaRooms5}
                data-testid="cinema-switcher-bar"
                dir={isRtl ? 'rtl' : 'ltr'}
                className="flex items-center justify-center flex-wrap gap-1.5 py-0.5 px-0.5"
              >
                {CINEMA_ROOMS.map((room) => {
                  const isActive = room.id === activeRoomId;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      data-testid={`cinema-room-btn-${room.id}`}
                      aria-pressed={isActive}
                      onClick={() => handleRoomSwitch(room.id)}
                      className={`shrink-0 whitespace-nowrap min-h-[34px] px-2.5 rounded-full text-[11.5px] font-bold tracking-wide backdrop-blur-xl transition-all duration-200 cursor-pointer border ${
                        isActive
                          ? 'text-white'
                          : 'border-white/15 bg-slate-950/45 text-white/80 hover:bg-slate-900/65 hover:text-white'
                      }`}
                      style={
                        isActive
                          ? {
                              borderColor: `${effectiveAccent}B0`,
                              backgroundColor: `${effectiveAccent}30`,
                              boxShadow: `0 0 16px ${effectiveAccent}45`,
                            }
                          : undefined
                      }
                    >
                      {getRoomTitle(room.id, room.titleFa, languageCode)}
                    </button>
                  );
                })}
              </nav>

              <div className="flex items-center justify-center gap-1.5 flex-wrap" dir={isRtl ? 'rtl' : 'ltr'}>
                <button
                  type="button"
                  data-testid="open-cinema-identity-top-btn"
                  onClick={() => setSubView('identity')}
                  dir="ltr"
                  className="shrink-0 whitespace-nowrap min-h-[34px] px-3 rounded-full text-[11px] font-bold backdrop-blur-xl transition-all duration-200 cursor-pointer border border-sky-300/45 bg-slate-950/55 text-sky-100 hover:border-sky-300/80 hover:bg-sky-500/20 hover:text-white inline-flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span>{copy.spatialId}</span>
                </button>

                <button
                  type="button"
                  data-testid="open-cinema-rooms-hub-btn"
                  onClick={() => setSubView('rooms-hub')}
                  className="shrink-0 whitespace-nowrap min-h-[34px] px-3 rounded-full text-[11px] font-bold backdrop-blur-xl transition-all duration-200 cursor-pointer border border-amber-400/45 bg-slate-950/55 text-amber-200 hover:border-amber-300/75 hover:bg-amber-500/15 hover:text-white inline-flex items-center gap-1"
                >
                  <Clapperboard className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>{copy.cinemaRooms5}</span>
                </button>

                <button
                  type="button"
                  data-testid="open-cinema-social-top-btn"
                  onClick={() => setSubView('social')}
                  className="shrink-0 whitespace-nowrap min-h-[34px] px-3 rounded-full text-[11px] font-bold backdrop-blur-xl transition-all duration-200 cursor-pointer border border-white/15 bg-slate-950/45 text-cyan-200 hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-white inline-flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                  <span>{copy.socialClub}</span>
                </button>
              </div>
            </header>

            {/* Instant Search + Category Chips (exact SkillSearchHeader UX) */}
            <section
              aria-label={copy.searchCinemaPlaceholder}
              className="w-full shrink-0 flex flex-col gap-2.5"
            >
              <div
                dir={isRtl ? 'rtl' : 'ltr'}
                className="flex items-center gap-2 min-h-[44px] px-3.5 rounded-full bg-slate-950/50 backdrop-blur-xl border border-white/15 transition-all"
              >
                <Search className="w-4 h-4 text-white/60 shrink-0" aria-hidden="true" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={copy.searchCinemaPlaceholder}
                  data-testid="cinema-search-input"
                  className="w-full bg-transparent text-[13px] font-medium text-white placeholder:text-white/55 focus:outline-none py-2"
                />
                {searchQuery.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={copy.showAll}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white/65 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div
                role="tablist"
                aria-label={copy.searchCinemaPlaceholder}
                dir={isRtl ? 'rtl' : 'ltr'}
                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5"
              >
                {categories.map((chip) => {
                  const isActive = chip.id === activeCategoryId;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveCategoryId(chip.id)}
                      className={`shrink-0 whitespace-nowrap min-h-[32px] px-3 rounded-full text-[12px] font-bold backdrop-blur-xl transition-all duration-150 cursor-pointer border ${
                        isActive
                          ? 'bg-white/90 text-slate-950 border-white shadow-[0_4px_14px_rgba(255,255,255,0.2)]'
                          : 'bg-slate-950/45 text-white/80 border-white/15 hover:bg-slate-900/65 hover:text-white'
                      }`}
                    >
                      {getCategoryLabel(chip.id, chip.labelFa, languageCode)}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* CENTER-LEFT NUMBERED CARDS (exact SkillCardList UX keeping right stage clean) */}
          <main
            aria-label={copy.hubCinema}
            dir="ltr"
            className="flex-1 w-full flex flex-col justify-end items-start min-h-0 pb-2"
          >
            <div
              data-testid="cinema-card-list"
              className="w-[70%] min-w-[238px] max-w-[292px] flex flex-col gap-2.5 overflow-y-auto no-scrollbar py-1"
            >
              {filteredCards.length === 0 ? (
                <div
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className="w-full rounded-2xl bg-slate-950/55 backdrop-blur-xl border border-white/15 p-4 text-start flex flex-col gap-3"
                >
                  <p className="text-[13px] font-bold text-white/90 leading-relaxed">
                    {copy.noItemsFound}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategoryId('all');
                      setSearchQuery('');
                    }}
                    className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-[12px] font-bold hover:bg-white/20 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{copy.showAll}</span>
                  </button>
                </div>
              ) : (
                filteredCards.map((card) => {
                  const title = getCardTitle(card.id, card.titleFa, languageCode);
                  const categoryLabel = getCardCategoryLabel(card.id, card.categoryLabelFa, languageCode);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      data-testid={`cinema-card-${card.num}`}
                      onClick={() => handleOpenCardInPlayer(card)}
                      dir={isRtl ? 'rtl' : 'ltr'}
                      className="group w-full text-start rounded-2xl bg-slate-950/45 backdrop-blur-xl border border-white/12 p-3.5 hover:bg-slate-900/60 active:scale-[0.985] transition-all duration-200 cursor-pointer shadow-[0_8px_28px_rgba(2,6,23,0.45)] flex flex-col gap-2"
                    >
                      <div className="w-full flex items-center justify-between gap-2">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 border border-white/12"
                          style={{ color: effectiveAccent }}
                        >
                          {categoryLabel}
                        </span>
                        <span className="font-mono-tabular text-[11px] font-bold tracking-wider text-white/50 group-hover:text-white transition-colors">
                          {card.num}
                        </span>
                      </div>

                      <div className="w-full flex items-end justify-between gap-1.5">
                        <span className="text-[14px] font-extrabold text-white leading-snug break-words">
                          {title.split(/(\([^)]+\))/g).map((part, idx) =>
                            part.startsWith('(') && part.endsWith(')') ? (
                              <span
                                key={idx}
                                dir="ltr"
                                className="inline-block font-mono-tabular text-[12.5px] font-bold mx-0.5"
                                style={{ color: effectiveAccent }}
                              >
                                {part}
                              </span>
                            ) : (
                              <React.Fragment key={idx}>{part}</React.Fragment>
                            )
                          )}
                        </span>
                        <ChevronLeft
                          className={`w-4 h-4 text-white/45 group-hover:text-white transition-all shrink-0 mb-0.5 ${
                            isRtl ? 'group-hover:-translate-x-0.5' : 'rotate-180 group-hover:translate-x-0.5'
                          }`}
                          aria-hidden="true"
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </main>

          {/* BOTTOM FLOATING GLASS DOCK (exact LobbyBottomDock UX) */}
          <footer
            aria-label={copy.sendOrStreamLink}
            data-testid="cinema-bottom-dock"
            className="relative w-full shrink-0 pt-1"
          >
            <NetflixCinemaMenuOverlay
              open={quickMenuOpen}
              activeRoomTitleFa={getRoomTitle(activeRoom.id, activeRoom.titleFa, languageCode)}
              cinemaDimMode={cinemaDimMode}
              onToggleCinemaDim={() => setCinemaDimMode((d) => !d)}
              onClose={() => setQuickMenuOpen(false)}
              onSelectSubView={(view) => setSubView(view)}
              onOpenMap={onOpenMap}
              onOpenStore={onOpenStore}
            />

            <div
              dir="ltr"
              className="w-full rounded-full bg-slate-950/60 backdrop-blur-2xl border border-white/15 p-1.5 shadow-[0_12px_36px_rgba(2,6,23,0.65)] flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => setQuickMenuOpen((p) => !p)}
                aria-expanded={quickMenuOpen}
                aria-label={copy.quickMenuAria}
                data-testid="cinema-quick-menu-btn"
                className={`w-11 h-11 rounded-full flex items-center justify-center border transition cursor-pointer shrink-0 ${
                  quickMenuOpen
                    ? 'bg-white/15 border-white/30 text-white'
                    : 'bg-white/5 border-white/12 text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {quickMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setSubView('player')}
                data-testid="cinema-open-player-dock-btn"
                dir={isRtl ? 'rtl' : 'ltr'}
                className="flex-1 min-h-[44px] px-4 rounded-full bg-slate-950/75 border active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  borderColor: `${effectiveAccent}8C`,
                  boxShadow: `0 0 20px ${effectiveAccent}38`,
                }}
              >
                <Film className="w-4 h-4 shrink-0" style={{ color: effectiveAccent }} />
                <span className="text-[13.5px] font-extrabold text-white whitespace-nowrap">
                  {copy.sendOrStreamLink}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCinemaDimMode((d) => !d)}
                aria-label={cinemaDimMode ? 'نور عادی محیط' : 'حالت سینما'}
                data-testid="cinema-mode-toggle"
                className={`w-11 h-11 rounded-full flex items-center justify-center border transition cursor-pointer shrink-0 ${
                  cinemaDimMode
                    ? 'bg-amber-500/25 border-amber-400/70 text-amber-200'
                    : 'bg-white/5 border-white/12 text-white/80 hover:bg-white/10'
                }`}
              >
                {cinemaDimMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};
