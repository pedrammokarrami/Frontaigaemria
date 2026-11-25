import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  Disc3,
  ListMusic,
  Play,
  Radio,
  Rotate3d,
  UserPlus,
  X,
} from 'lucide-react';
import {
  AUDIO_ROOMS,
  type AudioRoomId,
  type ChapterizerPersistenceState,
  formatTimecodeMmSs,
} from '../../utils/audioAgents';
import type { SpatialAudioDspEngine } from '../../utils/audioSpatialEngine';
import {
  AUDIO_ROOM_ORDER,
  AUDIO_ROOM_THEMES,
  getMediaRosterCountDisplay,
} from '../../data/mediaRoomsThemes';
import { toPersianNum } from '../../data/gameTournamentThemes';
import { AudioGlassPlayer } from '../spatial/AudioGlassPlayer';
import { StadiumTurntable } from '../spatial/StadiumTurntable';

interface AudioRoomsTournamentHubProps {
  initialRoomId?: AudioRoomId;
  dspEngine: SpatialAudioDspEngine;
  isPlaying: boolean;
  currentTimeSec: number;
  volume01: number;
  trackIndex: number;
  customStreamLabel: string | null;
  chapterState: ChapterizerPersistenceState;
  onSelectRoomExternal?: (roomId: AudioRoomId) => void;
  onSelectTrackIndex: (idx: number) => void;
  onTogglePlay: () => void;
  onSeek: (sec: number) => void;
  onVolumeChange: (v: number) => void;
  onSaveBookmarkNote: (noteText?: string) => void;
  onBack: () => void;
}

const PERSIAN_FONT = "'Vazirmatn', system-ui, sans-serif";
const DISPLAY_FONT = "'Barlow Condensed', 'Oswald', sans-serif";

export const AudioRoomsTournamentHub: React.FC<AudioRoomsTournamentHubProps> = ({
  initialRoomId = 'westworld-cafe',
  dspEngine,
  isPlaying,
  currentTimeSec,
  volume01,
  trackIndex,
  customStreamLabel,
  chapterState,
  onSelectRoomExternal,
  onSelectTrackIndex,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onSaveBookmarkNote,
  onBack,
}) => {
  const [activeRoomId, setActiveRoomId] = useState<AudioRoomId>(initialRoomId);
  const [filledEmptySlots, setFilledEmptySlots] = useState<Record<string, boolean>>({});
  const [isPlaylistSheetOpen, setIsPlaylistSheetOpen] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  const theme = AUDIO_ROOM_THEMES[activeRoomId];
  const activeRoomConfig = useMemo(
    () => AUDIO_ROOMS.find((r) => r.id === activeRoomId) ?? AUDIO_ROOMS[0],
    [activeRoomId]
  );

  const activeTrack =
    activeRoomConfig.defaultPlaylist[trackIndex % activeRoomConfig.defaultPlaylist.length] ??
    activeRoomConfig.defaultPlaylist[0];

  const rosterSummary = useMemo(
    () => getMediaRosterCountDisplay(theme, filledEmptySlots),
    [theme, filledEmptySlots]
  );

  const roomNotes = useMemo(
    () =>
      chapterState.notes.filter(
        (n) => n.roomId === activeRoomConfig.id || n.trackId === activeTrack.id
      ),
    [chapterState.notes, activeRoomConfig.id, activeTrack.id]
  );

  const handleToggleEmptySlot = (slotId: string) => {
    setFilledEmptySlots((prev) => ({
      ...prev,
      [slotId]: !prev[slotId],
    }));
  };

  const handleSelectRoom = (nextId: AudioRoomId) => {
    setActiveRoomId(nextId);
    setIsPlaylistSheetOpen(false);
    onSelectRoomExternal?.(nextId);
  };

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBookmarkNote(noteInput);
    setNoteInput('');
  };

  return (
    <div
      dir="rtl"
      data-testid="audio-rooms-tournament-hub"
      data-audio-room={activeRoomId}
      style={{
        backgroundColor: theme.colors.roomBg,
        fontFamily: PERSIAN_FONT,
        color: '#F8FAFC',
      }}
      className="relative max-w-md mx-auto w-full h-dvh overflow-hidden select-none"
    >
      {/* LAYER 1: Interactive 360° Turntable Video (/assets/rooms/audio/{room}.mp4) */}
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

      {/* Subtle top & bottom gradient scrims */}
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
        {/* === TOP ZONE: Back + 7 Audio Rooms Switcher + Top Context + Listening Circle === */}
        <div className="w-full flex flex-col gap-2 shrink-0 pointer-events-auto">
          <header className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              data-testid="audio-rooms-back-btn"
              aria-label="بازگشت به لابی موزیک"
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
              aria-label="انتخاب فضای موزیک و پادکست"
              data-testid="audio-rooms-switcher"
              dir="rtl"
              className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
            >
              {AUDIO_ROOM_ORDER.map((rid) => {
                const cfg = AUDIO_ROOM_THEMES[rid];
                const active = rid === activeRoomId;
                return (
                  <button
                    key={rid}
                    type="button"
                    data-testid={`audio-room-tab-${rid}`}
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
            aria-label="اطلاعات فضای صوتی فعال"
            data-testid="audio-rooms-top-context"
            className="flex items-end justify-between gap-2 px-0.5"
          >
            <div className="min-w-0">
              <h1
                data-testid="audio-rooms-title"
                className="text-[19px] leading-tight font-extrabold text-white truncate"
              >
                {theme.fullTitleFa}
              </h1>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] font-medium text-white/80 truncate">
                <span
                  data-testid="audio-rooms-subtitle"
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
                data-testid="audio-rooms-native-code"
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

          {/* Row 3: 4-Slot Listening Circle Lineup */}
          <section
            aria-label="حلقه شنوندگان اتاق"
            data-testid="audio-rooms-roster-strip"
            style={{
              backgroundColor: theme.colors.hudSurface,
              borderColor: theme.colors.hudBorder,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            className="w-full px-3 py-2 rounded-2xl border"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span
                data-testid="audio-rooms-roster-header"
                className="text-[12px] font-extrabold text-white"
              >
                {rosterSummary.headerTextFa}
              </span>
              <span className="text-[10.5px] font-semibold" style={{ color: theme.colors.secondary }}>
                {rosterSummary.filled === rosterSummary.total
                  ? 'حلقه تکمیل شد'
                  : 'برای دعوت روی جایگاه خالی بزنید'}
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
            data-testid="audio-stage-caption"
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

        {/* === BOTTOM ZONE: Live Playing Banner + 3 Metrics Strip + Primary Play CTA & Playlist/Chapter Sheet === */}
        <div className="w-full flex flex-col gap-2 shrink-0 pointer-events-auto">
          {isPlaying && (
            <div
              role="status"
              data-testid="audio-rooms-ready-banner"
              style={{
                backgroundColor: `rgba(${theme.colors.primaryRgb}, 0.16)`,
                borderColor: `rgba(${theme.colors.primaryRgb}, 0.5)`,
                color: '#FFFFFF',
              }}
              className="px-3 py-1.5 rounded-2xl border flex items-center justify-between gap-2 text-[11px] font-bold"
            >
              <span className="inline-flex items-center gap-1.5 truncate">
                <Radio className="w-3.5 h-3.5 shrink-0" style={{ color: theme.colors.primary }} />
                <span className="truncate">{theme.readyToastFa}</span>
              </span>
              <span
                className="text-[10px] font-mono-tabular shrink-0"
                style={{ color: theme.colors.primary }}
              >
                {formatTimecodeMmSs(currentTimeSec)}
              </span>
            </div>
          )}

          {/* 3 Labeled Acoustic Metrics Strip */}
          <section
            aria-label="مشخصات آکوستیک اتاق"
            data-testid="audio-rooms-metrics-strip"
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
                data-testid={`audio-room-metric-${m.id}`}
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

          {/* Footer Primary Play/Equalizer CTA + Playlist/Chapterizer Bottom Sheet Trigger */}
          <footer className="w-full flex items-center gap-2">
            <button
              type="button"
              data-testid="audio-rooms-primary-cta"
              onClick={onTogglePlay}
              style={{
                backgroundColor: isPlaying ? 'rgba(15, 23, 36, 0.92)' : theme.colors.primary,
                color: isPlaying ? theme.colors.primary : theme.colors.ctaText,
                borderColor: theme.colors.primary,
                boxShadow: isPlaying
                  ? `0 0 16px rgba(${theme.colors.primaryRgb}, 0.25)`
                  : `0 8px 26px rgba(${theme.colors.primaryRgb}, 0.38)`,
              }}
              className="flex-1 min-h-[46px] px-4 rounded-2xl border text-[13px] font-extrabold transition-all active:scale-[0.99] inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {isPlaying ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <Play className="w-4 h-4 shrink-0 translate-x-0.5" />
              )}
              <span className="truncate">{isPlaying ? theme.readyCtaFa : theme.primaryCtaFa}</span>
            </button>

            <button
              type="button"
              data-testid="audio-rooms-sheet-btn"
              onClick={() => setIsPlaylistSheetOpen(true)}
              style={{
                backgroundColor: theme.colors.hudSurface,
                borderColor: theme.colors.hudBorder,
                color: '#F8FAFC',
              }}
              className="shrink-0 min-h-[46px] px-3.5 rounded-2xl border text-[12px] font-bold hover:brightness-115 transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ListMusic className="w-4 h-4 shrink-0" style={{ color: theme.colors.primary }} />
              <span>{theme.sheetBtnLabelFa}</span>
            </button>
          </footer>
        </div>
      </div>

      {/* LAYER 3: Translucent Bottom Sheet (`پلی‌لیست` / `فصل‌ها و نوت` + Live FFT Visualizer) */}
      {isPlaylistSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`پلی‌لیست و فصل‌های ${theme.fullTitleFa}`}
          data-testid="audio-rooms-bottom-sheet"
          className="absolute inset-0 z-30 flex flex-col justify-end"
          style={{ backgroundColor: 'rgba(3, 6, 11, 0.72)' }}
          onClick={() => setIsPlaylistSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.colors.roomBg,
              borderColor: theme.colors.hudBorder,
              boxShadow: '0 -18px 48px rgba(0, 0, 0, 0.75)',
            }}
            className="w-full max-h-[82dvh] rounded-t-3xl border-t border-x flex flex-col overflow-hidden"
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
                    {activeRoomConfig.acoustic.profileNameFa}
                  </p>
                </div>

                <button
                  type="button"
                  data-testid="audio-rooms-close-sheet-btn"
                  aria-label="بستن پنل موزیک و فصل‌ها"
                  onClick={() => setIsPlaylistSheetOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/8 border border-white/15 flex items-center justify-center text-white/85 hover:bg-white/15 cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body: Tracklist + Chapterizer + AudioGlassPlayer */}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-3.5 flex flex-col gap-3">
              {/* Playlist Tracks */}
              <div className="flex flex-col gap-1.5">
                {activeRoomConfig.defaultPlaylist.map((track, idx) => {
                  const selected = track.id === activeTrack.id && !customStreamLabel;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => {
                        onSelectTrackIndex(idx);
                        if (!isPlaying) onTogglePlay();
                      }}
                      className={`text-right rounded-2xl px-3 py-2 border transition cursor-pointer flex items-center justify-between gap-2 ${
                        selected
                          ? 'bg-white/10 border-white/30'
                          : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <Disc3
                          className="w-4 h-4 shrink-0"
                          style={{ color: selected ? theme.colors.primary : 'rgba(255,255,255,0.5)' }}
                        />
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-white truncate">{track.titleFa}</p>
                          <p className="text-[10.5px] text-white/60 truncate">
                            {track.artistFa} · {track.genreLabel}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-[11px] font-mono-tabular shrink-0"
                        style={{ color: selected ? theme.colors.primary : 'rgba(255,255,255,0.55)' }}
                      >
                        {track.bpm} BPM
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Chapters (Audiobooks & Podcasts) + Timestamped Notes */}
              <section className="rounded-2xl bg-black/40 border border-white/10 p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 text-[11.5px] font-extrabold text-white">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" style={{ color: theme.colors.primary }} />
                    <span>
                      {activeRoomConfig.supportsChapters
                        ? 'فهرست فصل‌ها و بوکمارک'
                        : 'بوکمارک زمانی لحظه‌ها'}
                    </span>
                  </span>
                  <span className="font-mono-tabular text-white/60">
                    {formatTimecodeMmSs(currentTimeSec)}
                  </span>
                </div>

                {activeRoomConfig.chapters && activeRoomConfig.chapters.length > 0 && (
                  <div className="grid grid-cols-1 gap-1.5">
                    {activeRoomConfig.chapters.map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        data-testid={`audio-hub-chapter-${ch.id}`}
                        onClick={() => onSeek(ch.timeSec)}
                        className="text-right rounded-xl bg-white/5 hover:bg-white/12 border border-white/10 px-2.5 py-1.5 flex items-center justify-between gap-2 text-[11px] text-white cursor-pointer transition"
                      >
                        <span className="truncate">{ch.titleFa}</span>
                        <span
                          className="font-mono-tabular shrink-0"
                          style={{ color: theme.colors.primary }}
                        >
                          {formatTimecodeMmSs(ch.timeSec)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSubmitNote} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder={`یادداشت روی ${formatTimecodeMmSs(currentTimeSec)}...`}
                    data-testid="audio-hub-note-input"
                    className="flex-1 min-h-[34px] px-2.5 rounded-xl bg-white/5 border border-white/10 text-[11.5px] text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
                  />
                  <button
                    type="submit"
                    data-testid="audio-hub-save-note-btn"
                    className="shrink-0 min-h-[34px] px-3 rounded-xl bg-white/12 hover:bg-white/20 border border-white/15 text-[11px] font-bold text-white inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Bookmark className="w-3 h-3" style={{ color: theme.colors.primary }} />
                    <span>ثبت</span>
                  </button>
                </form>

                {roomNotes.length > 0 && (
                  <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                    {roomNotes.map((note) => (
                      <button
                        key={note.id}
                        type="button"
                        onClick={() => onSeek(note.timeSec)}
                        className="text-right rounded-lg bg-black/50 hover:bg-black/70 border border-white/8 px-2 py-1 flex items-center justify-between gap-2 text-[10.5px] text-white/80 cursor-pointer"
                      >
                        <span className="truncate">{note.noteText}</span>
                        <span
                          className="font-mono-tabular shrink-0"
                          style={{ color: theme.colors.primary }}
                        >
                          {note.createdAtLabel}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Embedded Glass Player with live FFT Equalizer Canvas */}
              <AudioGlassPlayer
                compact
                room={activeRoomConfig}
                activeTrack={activeTrack}
                customStreamLabel={customStreamLabel}
                isPlaying={isPlaying}
                currentTimeSec={currentTimeSec}
                volume01={volume01}
                dspEngine={dspEngine}
                onTogglePlay={onTogglePlay}
                onPrevTrack={() =>
                  onSelectTrackIndex(
                    trackIndex - 1 < 0 ? activeRoomConfig.defaultPlaylist.length - 1 : trackIndex - 1
                  )
                }
                onNextTrack={() =>
                  onSelectTrackIndex((trackIndex + 1) % activeRoomConfig.defaultPlaylist.length)
                }
                onSeek={onSeek}
                onVolumeChange={onVolumeChange}
                onQuickBookmark={() => onSaveBookmarkNote()}
              />
            </div>

            <div className="px-4 py-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60 shrink-0">
              <span>{toPersianNum(activeRoomConfig.defaultPlaylist.length)} ترک فعال در این فضا</span>
              <button
                type="button"
                onClick={() => setIsPlaylistSheetOpen(false)}
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
