import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  ChevronLeft,
  Disc3,
  ListMusic,
  Menu,
  Music,
  Pause,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import {
  AUDIO_ROOMS,
  type AudioRoomId,
  type ChapterizerPersistenceState,
  formatTimecodeMmSs,
  saveAudioProgressTimecode,
  upsertTrackBookmarkNote,
} from '../../utils/audioAgents';
import { SpatialAudioDspEngine } from '../../utils/audioSpatialEngine';
import type { UndergroundStreamPost } from '../../utils/cinemaAgents';
import {
  AUDIO_CARDS_BY_ROOM,
  AUDIO_CATEGORIES_BY_ROOM,
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
import { AudioGlassPlayer } from '../spatial/AudioGlassPlayer';
import { SpotifyAudioMenuSheet } from '../spatial/HubQuickMenuOverlays';
import { MasterHubSwitcher, type MasterHubId } from '../spatial/MasterHubSwitcher';
import { SpatialVideoEnvironment } from '../spatial/SpatialVideoEnvironment';
import { AudioBookSocialWorld } from './AudioBookSocialWorld';
import { AudioRoomsTournamentHub } from './AudioRoomsTournamentHub';

interface AudioHubViewProps {
  activeHub: MasterHubId;
  onSelectHub: (hub: MasterHubId) => void;
  onOpenMap: () => void;
  onOpenStore: () => void;
}

type AudioSubViewMode = 'lobby' | 'rooms-hub' | 'player' | 'identity' | 'social';

const CHAPTERIZER_STORAGE_KEY = 'aipetros-audio-chapterizer-v1';

export const AudioHubView: React.FC<AudioHubViewProps> = ({ activeHub, onSelectHub, onOpenMap, onOpenStore }) => {
  const { languageCode, isRtl, copy } = useLanguage();
  const [subView, setSubView] = useState<AudioSubViewMode>('lobby');
  const [activeRoomId, setActiveRoomId] = useState<AudioRoomId>('westworld-cafe');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const [trackIndex, setTrackIndex] = useState(0);
  const [customStreamLabel, setCustomStreamLabel] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [volume01, setVolume01] = useState(0.72);

  // Chapterizer Persistence
  const [chapterState, setChapterState] = useState<ChapterizerPersistenceState>(() => {
    try {
      const raw = window.localStorage.getItem(CHAPTERIZER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChapterizerPersistenceState;
        if (parsed && typeof parsed.progressByTrackSec === 'object' && Array.isArray(parsed.notes)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return {
      progressByTrackSec: {},
      notes: [
        {
          id: 'note-seed-1',
          trackId: 'tr-ac-1',
          roomId: 'ac-library',
          timeSec: 410,
          noteText: 'نکته کلیدی: رمزگشایی طومار داوینچی در فصل دوم',
          createdAtLabel: '06:50',
        },
      ],
    };
  });
  const [noteInput, setNoteInput] = useState('');

  const dspRef = useRef<SpatialAudioDspEngine | null>(null);
  if (!dspRef.current) {
    dspRef.current = new SpatialAudioDspEngine();
  }

  const activeRoom = useMemo(
    () => AUDIO_ROOMS.find((r) => r.id === activeRoomId) ?? AUDIO_ROOMS[0],
    [activeRoomId]
  );

  const activeTrack =
    activeRoom.defaultPlaylist[trackIndex % activeRoom.defaultPlaylist.length] ??
    activeRoom.defaultPlaylist[0];

  const categories = AUDIO_CATEGORIES_BY_ROOM[activeRoomId];
  const filteredCards = useMemo(
    () => filterHubCards(AUDIO_CARDS_BY_ROOM[activeRoomId], activeCategoryId, searchQuery),
    [activeRoomId, activeCategoryId, searchQuery]
  );

  useEffect(() => {
    const engine = dspRef.current;
    return () => {
      engine?.dispose();
    };
  }, []);

  useEffect(() => {
    const engine = dspRef.current;
    if (!engine) return;
    engine.applyAcousticProfile(activeRoom.acoustic);
    engine.setVolume(volume01);
    if (isPlaying) {
      void engine.start(activeRoom.acoustic, activeTrack.bpm);
    }
  }, [activeRoom, activeTrack.bpm, isPlaying, volume01]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setCurrentTimeSec((prev) => {
        const next = prev + 1 >= activeTrack.durationSec ? 0 : prev + 1;
        setChapterState((st) => saveAudioProgressTimecode(st, activeTrack.id, next));
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isPlaying, activeTrack.durationSec, activeTrack.id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAPTERIZER_STORAGE_KEY, JSON.stringify(chapterState));
    } catch {
      // ignore
    }
  }, [chapterState]);

  const handleSelectRoom = (nextRoomId: AudioRoomId) => {
    setActiveRoomId(nextRoomId);
    setActiveCategoryId('all');
    setSearchQuery('');
    setTrackIndex(0);
    setCustomStreamLabel(null);
    const nextRoom = AUDIO_ROOMS.find((r) => r.id === nextRoomId);
    const nextTrack = nextRoom?.defaultPlaylist[0];
    setCurrentTimeSec(nextTrack ? chapterState.progressByTrackSec[nextTrack.id] ?? 0 : 0);
  };

  const handleTogglePlay = async () => {
    const engine = dspRef.current;
    if (!engine) return;
    if (isPlaying) {
      engine.stop();
      setIsPlaying(false);
    } else {
      await engine.start(activeRoom.acoustic, activeTrack.bpm);
      engine.setVolume(volume01);
      setIsPlaying(true);
    }
  };

  const handleOpenCardInStudio = async (card: HubCardItem) => {
    setCustomStreamLabel(card.streamUrl ? `${card.titleFa} · Telegram` : null);
    if (typeof card.seekSec === 'number') {
      setCurrentTimeSec(card.seekSec);
    }
    if (dspRef.current) {
      await dspRef.current.start(activeRoom.acoustic, card.bpm ?? activeTrack.bpm);
      dspRef.current.setVolume(volume01);
      setIsPlaying(true);
    }
    setSubView('player');
  };

  const handleSeek = (sec: number) => {
    setCurrentTimeSec(sec);
    setChapterState((st) => saveAudioProgressTimecode(st, activeTrack.id, sec));
  };

  const handleSaveBookmarkNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = noteInput.trim() || `نشانه زمانی ${formatTimecodeMmSs(currentTimeSec)}`;
    setChapterState((st) =>
      upsertTrackBookmarkNote(st, {
        trackId: activeTrack.id,
        roomId: activeRoom.id,
        timeSec: currentTimeSec,
        noteText: text,
      })
    );
    setNoteInput('');
  };

  const handlePlayFromClub = async (post: UndergroundStreamPost) => {
    const validRoom = AUDIO_ROOMS.some((r) => r.id === post.roomId);
    if (validRoom) setActiveRoomId(post.roomId as AudioRoomId);
    setCustomStreamLabel(`${post.titleFa} · ${post.authorTelegramChannel}`);
    setCurrentTimeSec(0);
    if (dspRef.current) {
      const targetRoom =
        AUDIO_ROOMS.find((r) => r.id === (validRoom ? post.roomId : activeRoomId)) ?? activeRoom;
      await dspRef.current.start(targetRoom.acoustic, targetRoom.acoustic.baseSynthBpm);
      setIsPlaying(true);
    }
    setSubView('player');
  };

  const roomNotes = useMemo(
    () => chapterState.notes.filter((n) => n.roomId === activeRoom.id || n.trackId === activeTrack.id),
    [chapterState.notes, activeRoom.id, activeTrack.id]
  );

  const handleSaveBookmarkNoteText = (overrideText?: string) => {
    const rawText = typeof overrideText === 'string' ? overrideText : noteInput;
    const text = rawText.trim() || `نشانه زمانی ${formatTimecodeMmSs(currentTimeSec)}`;
    setChapterState((st) =>
      upsertTrackBookmarkNote(st, {
        trackId: activeTrack.id,
        roomId: activeRoom.id,
        timeSec: currentTimeSec,
        noteText: text,
      })
    );
    if (typeof overrideText !== 'string') {
      setNoteInput('');
    }
  };

  if (subView === 'rooms-hub' && dspRef.current) {
    return (
      <div
        data-testid="audio-hub-view"
        className="relative w-full h-dvh min-h-dvh overflow-hidden select-none bg-[#05060B]"
      >
        <AudioRoomsTournamentHub
          initialRoomId={activeRoomId}
          dspEngine={dspRef.current}
          isPlaying={isPlaying}
          currentTimeSec={currentTimeSec}
          volume01={volume01}
          trackIndex={trackIndex}
          customStreamLabel={customStreamLabel}
          chapterState={chapterState}
          onSelectRoomExternal={(rid) => handleSelectRoom(rid)}
          onSelectTrackIndex={(idx) => {
            setTrackIndex(idx);
            setCustomStreamLabel(null);
            const target = activeRoom.defaultPlaylist[idx % activeRoom.defaultPlaylist.length];
            setCurrentTimeSec(target ? chapterState.progressByTrackSec[target.id] ?? 0 : 0);
          }}
          onTogglePlay={handleTogglePlay}
          onSeek={handleSeek}
          onVolumeChange={(v) => {
            setVolume01(v);
            dspRef.current?.setVolume(v);
          }}
          onSaveBookmarkNote={handleSaveBookmarkNoteText}
          onBack={() => setSubView('lobby')}
        />
      </div>
    );
  }

  if (subView === 'identity') {
    return (
      <div data-testid="audio-hub-view" className="relative w-full min-h-dvh">
        <MediaSpatialProfilePage
          hub="audio"
          initialRoomId={activeRoomId}
          onSelectRoomExternal={(rid) => handleSelectRoom(rid as AudioRoomId)}
          onBackToLobby={() => setSubView('lobby')}
        />
      </div>
    );
  }

  if (subView === 'social') {
    return (
      <div
        data-testid="audio-hub-view"
        className="relative w-full h-dvh min-h-dvh overflow-hidden"
      >
        <AudioBookSocialWorld
          activeRoomId={activeRoomId}
          onPlayStreamInHub={handlePlayFromClub}
          onBack={() => setSubView('lobby')}
        />
      </div>
    );
  }

  return (
    <div
      data-testid="audio-hub-view"
      className="relative w-full h-dvh min-h-dvh overflow-hidden select-none"
    >
      {/* Full-bleed Multi-Layer Unreal 5.8 + Three.js Spatial Environment */}
      <SpatialVideoEnvironment
        videoSrc={activeRoom.videoLoopPath}
        fallbackImageUrl={activeRoom.fallbackImageUrl}
        fallbackToneFilter={activeRoom.fallbackToneFilter}
        accentHex={activeRoom.accentHex}
        secondaryHex={activeRoom.secondaryHex}
        roomTitleFa={activeRoom.titleFa}
        particleMode={activeRoom.particleMode}
        isReactiveActive={isPlaying || subView === 'player'}
      />

      {/* SUB-VIEW 1: AUDIO STUDIO + LIVE EQUALIZER + CHAPTERIZER (Parity with RealClipCoachRoom) */}
      {subView === 'player' ? (
        <div
          data-testid="audio-player-room"
          dir={isRtl ? 'rtl' : 'ltr'}
          className="relative z-20 max-w-4xl mx-auto w-full h-dvh overflow-y-auto px-4 pt-4 pb-4 flex flex-col justify-between gap-3"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 shrink-0 pl-14 sm:pl-16">
              <button
                type="button"
                data-testid="audio-back-to-lobby-btn"
                onClick={() => setSubView('lobby')}
                className="shrink-0 whitespace-nowrap min-h-[38px] px-3.5 rounded-full bg-slate-950/70 backdrop-blur-xl border border-white/15 text-[12px] font-bold text-white hover:bg-slate-900/90 inline-flex items-center gap-1.5 cursor-pointer transition"
              >
                <ArrowRight className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
                <span>{copy.backToAudioLobby}</span>
              </button>

              <span className="text-[11.5px] font-bold text-white/80 inline-flex items-center gap-1.5">
                <Disc3 className="w-4 h-4" style={{ color: activeRoom.accentHex }} />
                <span>{getRoomTitle(activeRoom.id, activeRoom.titleFa, languageCode)}</span>
              </span>
            </div>

            {/* Room Playlist */}
            <section className="rounded-3xl bg-slate-950/70 backdrop-blur-2xl border border-white/15 p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[12px] font-bold text-white/85">
                <span className="inline-flex items-center gap-1.5">
                  <ListMusic className="w-4 h-4" style={{ color: activeRoom.accentHex }} />
                  <span>پلی‌لیست اتاق {activeRoom.titleFa}</span>
                </span>
                <span className="text-[11px] font-mono-tabular text-white/55">
                  {activeRoom.defaultPlaylist.length} tracks
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeRoom.defaultPlaylist.map((track, idx) => {
                  const selected = track.id === activeTrack.id && !customStreamLabel;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={async () => {
                        setTrackIndex(idx);
                        setCustomStreamLabel(null);
                        setCurrentTimeSec(chapterState.progressByTrackSec[track.id] ?? 0);
                        if (dspRef.current) {
                          await dspRef.current.start(activeRoom.acoustic, track.bpm);
                          setIsPlaying(true);
                        }
                      }}
                      className={`text-right rounded-2xl p-2.5 border transition cursor-pointer flex items-center justify-between gap-2 ${
                        selected
                          ? 'bg-white/10 border-white/30'
                          : 'bg-black/35 border-white/8 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-white truncate">{track.titleFa}</p>
                        <p className="text-[10.5px] text-white/60 truncate">
                          {track.artistFa} · {track.genreLabel}
                        </p>
                      </div>
                      <span
                        className="text-[11px] font-mono-tabular shrink-0"
                        style={{ color: selected ? activeRoom.accentHex : 'rgba(255,255,255,0.55)' }}
                      >
                        {track.bpm} BPM
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Chapterizer & Timestamped Bookmarks */}
            <section
              data-testid="audio-chapterizer-panel"
              className="rounded-3xl bg-slate-950/70 backdrop-blur-2xl border border-white/15 p-3.5 sm:p-4 flex flex-col gap-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-extrabold text-white">
                  <BookOpen className="w-4 h-4" style={{ color: activeRoom.accentHex }} />
                  <span>
                    {activeRoom.supportsChapters
                      ? 'فصل‌بندی و بوکمارک هوشمند کتاب صوتی و پادکست'
                      : 'بوکمارک زمانی لحظه‌های موزیک (Chapterizer Engine)'}
                  </span>
                </span>
                <span className="text-[11px] font-mono-tabular text-white/60">
                  Saved Timecode: {formatTimecodeMmSs(currentTimeSec)}
                </span>
              </div>

              {activeRoom.chapters && activeRoom.chapters.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {activeRoom.chapters.map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      data-testid={`chapter-jump-${ch.id}`}
                      onClick={() => handleSeek(ch.timeSec)}
                      className="text-right rounded-xl bg-white/5 hover:bg-white/12 border border-white/10 px-2.5 py-2 flex items-center justify-between gap-2 text-[11.5px] text-white cursor-pointer transition"
                    >
                      <span className="truncate">{ch.titleFa}</span>
                      <span className="font-mono-tabular shrink-0" style={{ color: activeRoom.accentHex }}>
                        {formatTimecodeMmSs(ch.timeSec)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSaveBookmarkNote} className="flex items-center gap-2">
                <input
                  type="text"
                  data-testid="chapterizer-note-input"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder={`یادداشت روی زمان ${formatTimecodeMmSs(currentTimeSec)}...`}
                  className="flex-1 min-h-[36px] px-3 rounded-xl bg-black/50 border border-white/10 text-[12px] text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
                />
                <button
                  type="submit"
                  data-testid="chapterizer-save-note-btn"
                  className="shrink-0 whitespace-nowrap min-h-[36px] px-3.5 rounded-xl bg-white/12 hover:bg-white/20 border border-white/15 text-[11.5px] font-bold text-white inline-flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Bookmark className="w-3.5 h-3.5" style={{ color: activeRoom.accentHex }} />
                  <span>ثبت نوت</span>
                </button>
              </form>

              {roomNotes.length > 0 && (
                <div data-testid="chapterizer-notes-list" className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                  {roomNotes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => handleSeek(note.timeSec)}
                      className="text-right rounded-xl bg-black/40 hover:bg-black/60 border border-white/8 px-2.5 py-1.5 flex items-center justify-between gap-2 text-[11px] text-white/85 cursor-pointer"
                    >
                      <span className="truncate">{note.noteText}</span>
                      <span className="font-mono-tabular shrink-0" style={{ color: activeRoom.accentHex }}>
                        {note.createdAtLabel}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          {dspRef.current && (
            <AudioGlassPlayer
              room={activeRoom}
              activeTrack={activeTrack}
              customStreamLabel={customStreamLabel}
              isPlaying={isPlaying}
              currentTimeSec={currentTimeSec}
              volume01={volume01}
              dspEngine={dspRef.current}
              onTogglePlay={handleTogglePlay}
              onPrevTrack={() => {
                setTrackIndex((i) =>
                  i - 1 < 0 ? activeRoom.defaultPlaylist.length - 1 : i - 1
                );
                setCustomStreamLabel(null);
                setCurrentTimeSec(0);
              }}
              onNextTrack={() => {
                setTrackIndex((i) => (i + 1) % activeRoom.defaultPlaylist.length);
                setCustomStreamLabel(null);
                setCurrentTimeSec(0);
              }}
              onSeek={handleSeek}
              onVolumeChange={(v) => {
                setVolume01(v);
                dspRef.current?.setVolume(v);
              }}
              onQuickBookmark={() => handleSaveBookmarkNote()}
            />
          )}
        </div>
      ) : (
        /* MAIN LOBBY: 100% IDENTICAL STORYBOARD & UX TO GAME LOBBY */
        <div
          data-testid="audio-lobby-foreground-shell"
          className="relative z-20 max-w-md mx-auto w-full h-dvh min-h-dvh overflow-x-hidden px-4 pt-2.5 pb-4 flex flex-col justify-between gap-2"
        >
          {/* TOP STACK: MasterHubSwitcher + 7 Audio Rooms + Search & Chips */}
          <div className="w-full flex flex-col gap-2 shrink-0">
            <div className="flex justify-center pl-12 sm:pl-0">
              <MasterHubSwitcher
                activeHub={activeHub}
                onSelectHub={onSelectHub}
                accentHex={activeRoom.accentHex}
              />
            </div>

            <header className="w-full shrink-0 flex flex-col gap-1.5 pl-11 sm:pl-0">
              <nav
                aria-label={copy.audioRooms7}
                data-testid="audio-switcher-bar"
                dir={isRtl ? 'rtl' : 'ltr'}
                className="flex items-center justify-center flex-wrap gap-1 py-0.5 px-0.5"
              >
                {AUDIO_ROOMS.map((room) => {
                  const isActive = room.id === activeRoomId;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      data-testid={`audio-room-btn-${room.id}`}
                      aria-pressed={isActive}
                      onClick={() => handleSelectRoom(room.id)}
                      className={`shrink-0 whitespace-nowrap min-h-[28px] px-2 rounded-full text-[10.5px] font-bold tracking-tight backdrop-blur-xl transition-all duration-200 cursor-pointer border ${
                        isActive
                          ? 'text-white'
                          : 'border-white/15 bg-slate-950/45 text-white/80 hover:bg-slate-900/65 hover:text-white'
                      }`}
                      style={
                        isActive
                          ? {
                              borderColor: `${activeRoom.accentHex}B0`,
                              backgroundColor: `${activeRoom.accentHex}30`,
                              boxShadow: `0 0 16px ${activeRoom.accentHex}45`,
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
                  data-testid="open-audio-identity-top-btn"
                  onClick={() => setSubView('identity')}
                  dir="ltr"
                  className="shrink-0 whitespace-nowrap min-h-[34px] px-3 rounded-full text-[11px] font-bold backdrop-blur-xl transition-all duration-200 cursor-pointer border border-sky-300/45 bg-slate-950/55 text-sky-100 hover:border-sky-300/80 hover:bg-sky-500/20 hover:text-white inline-flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span>{copy.spatialId}</span>
                </button>

                <button
                  type="button"
                  data-testid="open-audio-rooms-hub-btn"
                  onClick={() => setSubView('rooms-hub')}
                  className="shrink-0 whitespace-nowrap min-h-[34px] px-3 rounded-full text-[11px] font-bold backdrop-blur-xl transition-all duration-200 cursor-pointer border border-amber-400/45 bg-slate-950/55 text-amber-200 hover:border-amber-300/75 hover:bg-amber-500/15 hover:text-white inline-flex items-center gap-1"
                >
                  <Music className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>{copy.audioRooms7}</span>
                </button>

                <button
                  type="button"
                  data-testid="open-audio-social-top-btn"
                  onClick={() => setSubView('social')}
                  className="shrink-0 whitespace-nowrap min-h-[34px] px-3 rounded-full text-[11px] font-bold backdrop-blur-xl transition-all duration-200 cursor-pointer border border-white/15 bg-slate-950/45 text-cyan-200 hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-white inline-flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                  <span>{copy.socialClub}</span>
                </button>
              </div>
            </header>

            <section
              aria-label={copy.searchAudioPlaceholder}
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
                  placeholder={copy.searchAudioPlaceholder}
                  data-testid="audio-search-input"
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
                aria-label={copy.searchAudioPlaceholder}
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

          {/* CENTER-LEFT NUMBERED CARDS (exact SkillCardList UX) */}
          <main
            aria-label={copy.hubAudio}
            dir="ltr"
            className="flex-1 w-full flex flex-col justify-end items-start min-h-0 pb-2"
          >
            <div
              data-testid="audio-card-list"
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
                      data-testid={`audio-card-${card.num}`}
                      onClick={() => handleOpenCardInStudio(card)}
                      dir={isRtl ? 'rtl' : 'ltr'}
                      className="group w-full text-start rounded-2xl bg-slate-950/45 backdrop-blur-xl border border-white/12 p-3.5 hover:bg-slate-900/60 active:scale-[0.985] transition-all duration-200 cursor-pointer shadow-[0_8px_28px_rgba(2,6,23,0.45)] flex flex-col gap-2"
                    >
                      <div className="w-full flex items-center justify-between gap-2">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 border border-white/12"
                          style={{ color: activeRoom.accentHex }}
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
                                style={{ color: activeRoom.accentHex }}
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
            aria-label={copy.audioStudioEq}
            data-testid="audio-bottom-dock"
            className="relative w-full shrink-0 pt-1"
          >
            <SpotifyAudioMenuSheet
              open={quickMenuOpen}
              activeRoomTitleFa={getRoomTitle(activeRoom.id, activeRoom.titleFa, languageCode)}
              activeTrackTitleFa={activeTrack.titleFa}
              activeTrackArtistFa={activeTrack.artistFa}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
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
                data-testid="audio-quick-menu-btn"
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
                data-testid="audio-open-player-dock-btn"
                dir={isRtl ? 'rtl' : 'ltr'}
                className="flex-1 min-h-[44px] px-4 rounded-full bg-slate-950/75 border active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  borderColor: `${activeRoom.accentHex}8C`,
                  boxShadow: `0 0 20px ${activeRoom.accentHex}38`,
                }}
              >
                <Disc3 className="w-4 h-4 shrink-0" style={{ color: activeRoom.accentHex }} />
                <span className="text-[13px] font-extrabold text-white truncate max-w-[200px]">
                  {isPlaying ? `${activeTrack.titleFa}` : copy.audioStudioEq}
                </span>
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                aria-label={isPlaying ? 'توقف پخش' : 'پخش فضای سه‌بعدی'}
                data-testid="audio-play-toggle"
                className="w-11 h-11 rounded-full flex items-center justify-center border transition cursor-pointer shrink-0"
                style={
                  isPlaying
                    ? {
                        backgroundColor: `${activeRoom.accentHex}35`,
                        borderColor: `${activeRoom.accentHex}B0`,
                        color: '#ffffff',
                      }
                    : {
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderColor: 'rgba(255,255,255,0.12)',
                        color: activeRoom.accentHex,
                      }
                }
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
              </button>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};
