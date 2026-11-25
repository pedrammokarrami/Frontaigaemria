declare const __BUILD_ID__: string;
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { AudioHubView } from './components/audio/AudioHubView';
import { CinemaHubView } from './components/cinema/CinemaHubView';
import { CoachStage3D } from './components/spatial/CoachStage3D';
import { CrossGameSpatialProfilePage } from './components/identity/CrossGameSpatialProfilePage';
import { GameNativeTournamentHub } from './components/spatial/GameNativeTournamentHub';
import { GameSwitcherBar } from './components/spatial/GameSwitcherBar';
import { QuestionSuggestions } from './components/spatial/QuestionSuggestions';
import { loadCuratedTop, mergeCuratedIntoSkills, type CuratedTop } from './utils/curatedTrends';
import { loadLastStyleSelection, saveLastStyleSelection, defaultGameForStyle, gameStyleForGame } from './utils/gameStyles';
import { speakWithPersona } from './utils/voicePersona';
import { triageImageMedia, triageVideoMedia, type MediaTriageState } from './utils/mediaTriage';
import { GlobalEarthLanguageButton } from './components/spatial/GlobalEarthLanguageButton';
import { LanguageSelectorModal } from './components/spatial/LanguageSelectorModal';
import { LobbyBottomDock } from './components/spatial/LobbyBottomDock';
import { MasterHubSwitcher, type MasterHubId } from './components/spatial/MasterHubSwitcher';
import { PlatformMapModal } from './components/spatial/PlatformMapModal';
import { PlatformStoreModal } from './components/spatial/PlatformStoreModal';
import {
  RealClipCoachRoom,
  type UploadedCoachMedia,
} from './components/spatial/RealClipCoachRoom';
import { PetrosUnifiedCoachPage, type GameId as UnifiedCoachGameId } from './components/spatial/PetrosUnifiedCoachPage';
import { PetrosCleanLobby } from './components/spatial/PetrosCleanLobby';
import { SkillCardList } from './components/spatial/SkillCardList';
import { LiveWebAnswer } from './components/spatial/LiveWebAnswer';
import { SkillSearchHeader } from './components/spatial/SkillSearchHeader';
import {
  type TournamentGameId,
  resolveTournamentGameFromLobby,
} from './data/gameTournamentThemes';
import { REALM_CONFIGS } from './data/realmsData';
import { IS_GAME_ONLY_HOST } from './utils/hostBrand';
import { initFcmPush } from './services/fcmClient';
import { AppBootGate, useAppBoot, useSectionWarmup } from './components/spatial/AppBootGate';
import { useAuthGate } from './components/spatial/AuthGate';
import { AppErrorBoundary } from './components/spatial/AppErrorBoundary';
import { useLanguage } from './contexts/LanguageContext';
import { SocialClubApp } from './connection/SocialClubApp';
import {
  type MotionCoachPayload,
  getInstantMotionCoachPayload,
} from './agents/motionCoachAgent';
import type { ProClipAnalyzerResponse } from './agents/proClipAnalyzerAgent';
import {
  buildDynamicGameEntry,
  findCatalogGameById,
  inferRealmFromGameTitle,
} from './services/gameMediaCatalog';
import {
  mapRealmToGameId,
  normalizeCoachGameId,
} from './services/liveMetaSyncService';
import type { MediaManifest, RealmId } from './types/spatial';
import {
  type CoachConsultationTopic,
  REALM_CONSULTATION_TOPICS,
  recomputeTelestratorFromTap,
  resolveCoachTopic,
} from './utils/coachSearchRules';
import { RAF_FROZEN_EVENT, isRafShimmed } from './utils/rafFallback';
import {
  LOBBY_CATEGORIES_BY_GAME,
  type LobbyGameId,
  type LobbySkillCardItem,
  filterLobbySkills,
  getLobbyGameTab,
  resolveLobbyGameFromAppState,
} from './utils/lobbySkillCatalog';
import { LOBBY_SKILLS_BY_GAME } from './utils/lobbySkillCatalog';
import { trackDwell, trackGameSelect, trackQuestion, trackSessionStart } from './utils/behaviorTracker';

const STORAGE_REALM_KEY = 'aipetros-coach-realm-v5';

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SelectedCoachGame {
  id: string;
  name?: string;
  realm: RealmId;
  steamAppId?: number;
}

export function App() {
  // Manifest tracking for the boot gate (resolves once the media manifest fetch settles)
  const [manifestResolved, setManifestResolved] = useState(false);
  const [activeRealm, setActiveRealm] = useState<RealmId>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_REALM_KEY) as RealmId | null;
      if (saved && saved in REALM_CONFIGS) return saved;
    } catch {
      // ignore
    }
    return 'sports';
  });

  const [activeMasterHub, setActiveMasterHub] = useState<MasterHubId>(() => {
    if (IS_GAME_ONLY_HOST) return 'game'; // game-only brand: hub locked
    try {
      const params = new URLSearchParams(window.location.search);
      const hub = params.get('hub');
      if (hub === 'cinema' || hub === 'audio' || hub === 'game') return hub;
    } catch {
      // ignore
    }
    return 'game';
  });

  // Game-only brand (aigameria.com): hub switching to cinema/audio is blocked.
  const selectHub = React.useCallback((hub: MasterHubId) => {
    if (IS_GAME_ONLY_HOST && hub !== 'game') return;
    setActiveMasterHub(hub);
  }, []);

  const [isGtaSocialOpen, setIsGtaSocialOpen] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('social') === '1';
    } catch {
      return false;
    }
  });

  const [isTournamentHubOpen, setIsTournamentHubOpen] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return Boolean(params.get('tournament'));
    } catch {
      return false;
    }
  });

  const [isIdentityProfileOpen, setIsIdentityProfileOpen] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('identity') === '1' || params.get('profile') === '1';
    } catch {
      return false;
    }
  });

  const [activeLeftOverlay, setActiveLeftOverlay] = useState<'map' | 'store' | null>(null);
  const [storeInitialCollectionId, setStoreInitialCollectionId] = useState<string | null>(null);

  const [tournamentInitialGame, setTournamentInitialGame] = useState<TournamentGameId>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tParam = params.get('tournament');
      if (tParam && tParam !== '1') {
        return resolveTournamentGameFromLobby(tParam);
      }
    } catch {
      // ignore
    }
    return 'FC27';
  });


  const [manifest, setManifest] = useState<MediaManifest>({
    lobbyVideoUrl: null,
    avatarGlbUrl: null,
    coachGlbs: { shooter: null, sports: null, strategy: null, story: null },
  });

  // Active Coach Topic — when non-null, activates the dedicated Real-Gameplay AR Coach screen
  const [activeTopic, setActiveTopic] = useState<CoachConsultationTopic | null>(null);
  // Guards against out-of-order coach/search responses overwriting newer topics.
  const coachSearchSeqRef = useRef(0);
  const nextCoachSearchSeq = () => ++coachSearchSeqRef.current;
  const [useVideoBackdrop, setUseVideoBackdrop] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Selected PC Game & Independent Agent 1 (ProClipAnalyzerAgent) + Agent 2 (MotionCoachAgent) state
  const [selectedGame, setSelectedGame] = useState<SelectedCoachGame>(() => ({
    id: mapRealmToGameId('sports'),
    realm: 'sports',
  }));
  const [lobbyGameId, setLobbyGameId] = useState<LobbyGameId>(() =>
    // Default = the LAST style/game the user selected (persisted), else current realm.
    loadLastStyleSelection()?.gameId ??
    resolveLobbyGameFromAppState(mapRealmToGameId(activeRealm), activeRealm)
  );
  const [lobbyStyleId, setLobbyStyleId] = useState<string>(
    () => loadLastStyleSelection()?.styleId ?? gameStyleForGame(
      loadLastStyleSelection()?.gameId ?? resolveLobbyGameFromAppState(mapRealmToGameId(activeRealm), activeRealm)
    ).id
  );
  const [lobbyCategoryId, setLobbyCategoryId] = useState<string>('all');
  const [lobbySearchQuery, setLobbySearchQuery] = useState<string>('');
  const [isListeningSearchVoice, setIsListeningSearchVoice] = useState<boolean>(false);

  const [motionPayloadMap, setMotionPayloadMap] = useState<Record<string, MotionCoachPayload>>({});
  const [proClipsMap, setProClipsMap] = useState<Record<string, ProClipAnalyzerResponse>>({});
  const [isLoadingClips, setIsLoadingClips] = useState(false);
  const [isSyncingMotion, setIsSyncingMotion] = useState(false);
  const [clipProblemQuery, setClipProblemQuery] = useState<string>('');

  const [uploadedMedia, setUploadedMedia] = useState<UploadedCoachMedia | null>(null);
  const [isAnalyzingUpload, setIsAnalyzingUpload] = useState<boolean>(false);
  const [uploadTriage, setUploadTriage] = useState<MediaTriageState | null>(null);
  const [uploadTriageNoteFa, setUploadTriageNoteFa] = useState<string>('');
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);

  const speakTimerRef = useRef<number | null>(null);
  const neuralAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const realmCfg = REALM_CONFIGS[activeRealm];
  const realmTopics = REALM_CONSULTATION_TOPICS[activeRealm];

  // Global boot gate — nothing renders/executes until fonts + critical assets + probe settle
  const { languageCode: appLang } = useLanguage();
  const { copy: bootCopy } = useLanguage();
  const criticalAssets = useMemo(
    () => (manifest.lobbyVideoUrl ? [manifest.lobbyVideoUrl] : []),
    [manifest.lobbyVideoUrl]
  );
  const boot = useAppBoot(criticalAssets, manifestResolved);
  // Aigameria v1.02 — auth gate (register/login/OAuth) before the app; guest
  // keeps the app open. Session persists in localStorage.
  const authGate = useAuthGate();
  const sectionWarming = useSectionWarmup(
    [
      activeMasterHub,
      activeRealm,
      activeTopic,
      isGtaSocialOpen,
      isTournamentHubOpen,
      isIdentityProfileOpen,
      activeLeftOverlay,
    ],
    620
  );

  const lobbyCategories = LOBBY_CATEGORIES_BY_GAME[lobbyGameId];
  const [curatedTop, setCuratedTop] = useState<CuratedTop | null>(null);
  useEffect(() => {
    let alive = true;
    loadCuratedTop().then((d) => { if (alive) setCuratedTop(d); });
    trackSessionStart(lobbyGameId);
    return () => { alive = false; };
  }, []);
  // Dwell beacon: report engaged time per active game to the behavior agent.
  useEffect(() => {
    const startedAt = Date.now();
    const onLeave = () => {
      const dwellMs = Date.now() - startedAt;
      if (dwellMs > 5000) trackDwell(lobbyGameId, dwellMs);
    };
    window.addEventListener('pagehide', onLeave);
    return () => {
      window.removeEventListener('pagehide', onLeave);
      onLeave();
    };
  }, [lobbyGameId]);
  const filteredLobbySkills = useMemo(
    () => mergeCuratedIntoSkills(lobbyGameId, lobbyCategoryId, filterLobbySkills(lobbyGameId, lobbyCategoryId, lobbySearchQuery), curatedTop, appLang),
    [lobbyGameId, lobbyCategoryId, lobbySearchQuery, curatedTop, appLang]
  );

  const activeMotionPayload: MotionCoachPayload =
    motionPayloadMap[selectedGame.id] ??
    getInstantMotionCoachPayload({
      gameId: selectedGame.id,
      gameName: selectedGame.name,
      realm: selectedGame.realm,
      steamAppId: selectedGame.steamAppId,
    });

  const clipCacheKey = `${selectedGame.id}:${clipProblemQuery.trim().toLowerCase()}`;
  const activeProClipsData = proClipsMap[clipCacheKey] ?? proClipsMap[`${selectedGame.id}:`] ?? null;

  // When the tab's rAF is frozen to zero ticks (background/idle), motion exit
  // animations can never finish and hub swaps visually stall. rafFallback
  // detects that and drives the frameloop manually; while frozen we also
  // skip animations entirely so swaps complete instantly.
  const [isRafFrozen, setIsRafFrozen] = useState(() => isRafShimmed());
  useEffect(() => {
    const onRafFrozen = (event: Event) => {
      setIsRafFrozen(Boolean((event as CustomEvent).detail));
    };
    // Sync-read: the shim can install between first render and this effect
    // (its install timer can fire on a janked main thread first).
    setIsRafFrozen(isRafShimmed());
    window.addEventListener(RAF_FROZEN_EVENT, onRafFrozen);
    return () => window.removeEventListener(RAF_FROZEN_EVENT, onRafFrozen);
  }, []);

  useEffect(() => {
    // Web push (FCM): best-effort registration once per session.
    void initFcmPush();
  }, []);

  useEffect(() => {
    // Split-brand: game-only host carries the AIGAMERIA title.
    if (IS_GAME_ONLY_HOST) document.title = 'AIGAMERIA v1.02 — Game';
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-realm', activeRealm);
    document.body.dataset.state =
      activeMasterHub === 'cinema'
        ? 'cinema-hub'
        : activeMasterHub === 'audio'
          ? 'audio-hub'
          : isIdentityProfileOpen
            ? 'spatial-identity'
            : isTournamentHubOpen
              ? 'tournament-hub'
              : isGtaSocialOpen
                ? 'gta-social'
                : activeTopic
                  ? 'coach-ar'
                  : 'playing';
    try {
      window.localStorage.setItem(STORAGE_REALM_KEY, activeRealm);
    } catch {
      // ignore
    }
  }, [activeMasterHub, activeRealm, isIdentityProfileOpen, isTournamentHubOpen, isGtaSocialOpen, activeTopic]);


  useEffect(() => {
    let mounted = true;
    fetch('/api/media/manifest')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data) {
          setManifest({
            lobbyVideoUrl: data.lobbyVideoUrl ?? null,
            avatarGlbUrl: data.avatarGlbUrl ?? null,
            coachGlbs: {
              shooter: data.coachGlbs?.shooter ?? null,
              sports: data.coachGlbs?.sports ?? null,
              strategy: data.coachGlbs?.strategy ?? null,
              story: data.coachGlbs?.story ?? null,
            },
          });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setManifestResolved(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Agent 1 — ProClipAnalyzerAgent (Real YouTube/Reddit Clips + 3 Interactive Scrubber Chapters)
  const fetchProClipsAgent = useCallback(
    (game: SelectedCoachGame, queryText: string, force = false) => {
      setIsLoadingClips(true);
      const qTrim = queryText.trim();
      const params = new URLSearchParams({ gameId: game.id, realm: game.realm });
      if (game.name) params.set('name', game.name);
      if (qTrim) params.set('q', qTrim);
      if (force) params.set('force', '1');

      const key = `${game.id}:${qTrim.toLowerCase()}`;

      fetch(`/api/agents/pro-clips?${params.toString()}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.clips) {
            setProClipsMap((prev) => ({
              ...prev,
              [key]: data as ProClipAnalyzerResponse,
            }));
          }
        })
        .catch(() => undefined)
        .finally(() => {
          setIsLoadingClips(false);
        });
    },
    []
  );

  // Agent 2 — MotionCoachAgent (Per-Game Animated Motion Graphic & Synchronized Voice Coaching)
  const fetchMotionCoachAgent = useCallback((game: SelectedCoachGame, force = false) => {
    setIsSyncingMotion(true);
    const params = new URLSearchParams({ gameId: game.id, realm: game.realm });
    if (game.name) params.set('name', game.name);
    if (game.steamAppId) params.set('steamAppId', String(game.steamAppId));
    if (force) params.set('force', '1');

    fetch(`/api/agents/motion-coach?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.archetype) {
          setMotionPayloadMap((prev) => ({
            ...prev,
            [game.id]: data as MotionCoachPayload,
          }));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        setIsSyncingMotion(false);
      });
  }, []);

  // Trigger both specialized agents independently whenever Coach section opens or game/problem changes
  useEffect(() => {
    if (activeTopic && !isGtaSocialOpen) {
      fetchMotionCoachAgent(selectedGame, false);
      fetchProClipsAgent(selectedGame, clipProblemQuery, false);
    }
  }, [activeTopic, isGtaSocialOpen, selectedGame, clipProblemQuery, fetchMotionCoachAgent, fetchProClipsAgent]);

  const stopSpeaking = useCallback(() => {
    if (speakTimerRef.current) {
      window.clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // ignore
    }
    try {
      if (neuralAudioRef.current) {
        neuralAudioRef.current.pause();
        neuralAudioRef.current.onended = null;
        neuralAudioRef.current = null;
      }
    } catch {
      // ignore
    }
    setIsSpeaking(false);
  }, []);

  const triggerCoachSpeech = useCallback(
    (text: string) => {
      stopSpeaking();
      setIsSpeaking(true);

      // PRIMARY voice: rany2/edge-tts neural audio via our own server proxy
      // (free & keyless, Microsoft Edge neural voices — Ferguson-style quality).
      const speechAudio = new Audio();
      neuralAudioRef.current = speechAudio;
      let started = false;
      const fallbackToLocal = () => {
        if (started) return;
        started = true;
        try {
          speakWithPersona('tacticalCoach', text, appLang);
        } catch {
          // ignore
        }
        speakTimerRef.current = window.setTimeout(() => setIsSpeaking(false), 5500);
      };
      // First neural generation can take ~6-8s (cached afterwards = instant);
      // the old 4s fallback raced it and produced the robotic browser voice.
      const timeoutId = window.setTimeout(fallbackToLocal, 9000);
      fetch(
        `/api/tts?lang=${encodeURIComponent(appLang.slice(0, 2))}&text=${encodeURIComponent(text.slice(0, 900))}`
      )
        .then(async (r) => {
          if (!r.ok) throw new Error('tts-bad-status');
          const blob = await r.blob();
          if (!blob || blob.size < 512) throw new Error('tts-empty-audio');
          return URL.createObjectURL(blob);
        })
        .then((url) => {
          if (neuralAudioRef.current !== speechAudio) return; // superseded
          window.clearTimeout(timeoutId);
          started = true;
          // Neural audio won — stop any robotic local TTS that already started.
          try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
          speechAudio.src = url;
          speechAudio.onended = () => setIsSpeaking(false);
          speechAudio.onerror = () => setIsSpeaking(false);
          void speechAudio.play().catch(() => {
            // Autoplay blocked (no user gesture yet, esp. iOS): stay silent
            // instead of switching to the robotic voice mid-playback.
            setIsSpeaking(false);
          });
        })
        .catch(() => {
          window.clearTimeout(timeoutId);
          fallbackToLocal();
        });
    },
    [appLang, stopSpeaking]
  );

  useEffect(() => {
    return () => {
      stopSpeaking();
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, [stopSpeaking]);

  const handleSelectCoachGame = useCallback(
    (game: { id: string; name?: string; realm?: RealmId; steamAppId?: number }) => {
      stopSpeaking();
      const catalogHit = findCatalogGameById(game.id) || (game.name ? findCatalogGameById(game.name) : undefined);
      const nextRealm: RealmId =
        game.realm ?? catalogHit?.realm ?? inferRealmFromGameTitle(game.name || game.id, activeRealm);
      const normId = catalogHit?.id ?? normalizeCoachGameId(game.id);
      const resolvedName = game.name || catalogHit?.name || game.id;
      const resolvedSteamId = game.steamAppId ?? catalogHit?.steamAppId;

      if (!motionPayloadMap[normId]) {
        const dynEntry = buildDynamicGameEntry({
          id: normId,
          name: resolvedName,
          realm: nextRealm,
          steamAppId: resolvedSteamId,
        });
        setMotionPayloadMap((prev) => ({
          ...prev,
          [normId]: getInstantMotionCoachPayload({
            gameId: dynEntry.id,
            gameName: dynEntry.name,
            realm: dynEntry.realm,
            steamAppId: dynEntry.steamAppId,
          }),
        }));
      }

      setActiveRealm(nextRealm);
      setLobbyGameId(resolveLobbyGameFromAppState(normId, nextRealm));
      setSelectedGame({
        id: normId,
        name: resolvedName,
        realm: nextRealm,
        steamAppId: resolvedSteamId,
      });
      setClipProblemQuery('');
      setUploadedMedia(null);

      const firstTopic = REALM_CONSULTATION_TOPICS[nextRealm][0];
      setActiveTopic(resolveCoachTopic(nextRealm, firstTopic.id));
    },
    [activeRealm, motionPayloadMap, stopSpeaking]
  );

  const launchTopicSearch = useCallback(
    (queryOrTopicId: string, tapX?: number, tapY?: number) => {
      setIsGtaSocialOpen(false);
      const directCatalogMatch = findCatalogGameById(queryOrTopicId);
      const targetRealm = directCatalogMatch?.realm ?? activeRealm;
      const targetGameId =
        directCatalogMatch?.id ??
        (selectedGame.realm === targetRealm ? selectedGame.id : mapRealmToGameId(targetRealm));
      const targetCatalogHit = directCatalogMatch ?? findCatalogGameById(targetGameId);
      const isPresetTopicId = REALM_CONSULTATION_TOPICS[targetRealm].some(
        (t) => t.id === queryOrTopicId
      );

      setActiveRealm(targetRealm);
      setSelectedGame({
        id: targetGameId,
        name: targetCatalogHit?.name ?? selectedGame.name,
        realm: targetRealm,
        steamAppId: targetCatalogHit?.steamAppId ?? selectedGame.steamAppId,
      });
      setClipProblemQuery(directCatalogMatch || isPresetTopicId ? '' : queryOrTopicId.trim());
      setUploadedMedia(null);

      const baseTopic = resolveCoachTopic(targetRealm, queryOrTopicId);
      const initialTopic =
        typeof tapX === 'number' && typeof tapY === 'number'
          ? recomputeTelestratorFromTap(baseTopic, tapX, tapY)
          : baseTopic;
      setActiveTopic(initialTopic);
      if (typeof tapX !== 'number') {
        triggerCoachSpeech(initialTopic.coachVoiceEn);
      }

      const tapParams =
        typeof tapX === 'number' && typeof tapY === 'number'
          ? `&tapX=${encodeURIComponent(Math.round(tapX))}&tapY=${encodeURIComponent(Math.round(tapY))}`
          : '';

      const seq2 = nextCoachSearchSeq();
      fetch(
        `/api/coach/search?realm=${encodeURIComponent(targetRealm)}&q=${encodeURIComponent(
          queryOrTopicId
        )}${tapParams}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.topic && seq2 === coachSearchSeqRef.current) {
            setActiveTopic(data.topic as CoachConsultationTopic);
          }
        })
        .catch(() => undefined);
    },
    [activeRealm, selectedGame, triggerCoachSpeech]
  );

  const handleLobbyGameSwitch = useCallback(
    (nextGameId: LobbyGameId) => {
      stopSpeaking();
      setIsGtaSocialOpen(false);
      trackGameSelect(nextGameId);
      const tab = getLobbyGameTab(nextGameId);
      const catalogHit = findCatalogGameById(tab.catalogGameId);
      setLobbyGameId(nextGameId);
      setLobbyStyleId((prevStyle) => {
        const style = gameStyleForGame(nextGameId, prevStyle);
        saveLastStyleSelection(nextGameId, style.id); // remember last selection → next visit defaults to it
        return style.id;
      });
      setLobbyCategoryId('all');
      setLobbySearchQuery('');
      setActiveRealm(tab.realm);
      setSelectedGame({
        id: tab.catalogGameId,
        name: catalogHit?.name ?? tab.catalogGameName,
        realm: tab.realm,
        steamAppId: catalogHit?.steamAppId,
      });
      setClipProblemQuery('');
    },
    [stopSpeaking]
  );

  const handleSelectLobbySkill = useCallback(
    (skill: LobbySkillCardItem, questionOverride?: string) => {
      const askedQuestion = questionOverride?.trim() || skill.problemQuery;
      setIsGtaSocialOpen(false);
      const tab = getLobbyGameTab(skill.gameId);
      const catalogHit = findCatalogGameById(tab.catalogGameId);
      setActiveRealm(tab.realm);
      setSelectedGame({
        id: tab.catalogGameId,
        name: catalogHit?.name ?? tab.catalogGameName,
        realm: tab.realm,
        steamAppId: catalogHit?.steamAppId,
      });
      setClipProblemQuery(askedQuestion);
      setUploadedMedia(null);

      const baseTopic = resolveCoachTopic(tab.realm, skill.topicId);
      const resolvedTopic: CoachConsultationTopic = {
        ...baseTopic,
        titleFa: questionOverride?.trim() || skill.titleFa,
      };
      setActiveTopic(resolvedTopic);
      triggerCoachSpeech(resolvedTopic.coachVoiceEn);

      const seq = nextCoachSearchSeq();
      fetch(
        `/api/coach/search?realm=${encodeURIComponent(tab.realm)}&gameId=${encodeURIComponent(tab.id)}&q=${encodeURIComponent(
          askedQuestion
        )}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.topic && seq === coachSearchSeqRef.current) {
            setActiveTopic({
              ...(data.topic as CoachConsultationTopic),
              titleFa: questionOverride?.trim() || skill.titleFa,
            });
          }
        })
        .catch(() => undefined);
    },
    [triggerCoachSpeech]
  );

  /** Ask a free question from the lobby: best local skill wins, else the coach session gets the raw question. */
  /** Free question asked inside the coach room: refresh the intent answer board
   *  (race-guarded) so the board matches THIS question, not the previous topic. */
  const handleCoachRoomQuestion = useCallback(
    (q: string) => {
      setClipProblemQuery(q);
      fetchProClipsAgent(selectedGame, q, false);
      const seq = nextCoachSearchSeq();
      fetch(
        `/api/coach/search?realm=${encodeURIComponent(selectedGame.realm)}&gameId=${encodeURIComponent(lobbyGameId)}&q=${encodeURIComponent(q)}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.topic && seq === coachSearchSeqRef.current) {
            setActiveTopic((prev) => (prev ? { ...prev, answerBlock: data.topic.answerBlock } : prev));
          }
        })
        .catch(() => undefined);
    },
    [selectedGame]
  );

  const handleAskLobbyQuestion = useCallback(
    (question: string) => {
      trackQuestion(lobbyGameId, question);
      setLobbySearchQuery(question);
      const matches = filterLobbySkills(lobbyGameId, lobbySearchQuery === question ? lobbySearchQuery : '', question);
      const ranked = matches.length > 0 ? matches : filterLobbySkills(lobbyGameId, question, 'all');
      if (ranked.length > 0) {
        handleSelectLobbySkill(ranked[0], question);
        return;
      }
      // No local skill matched → open coach room with the game's default topic but the real question.
      const fallback = (LOBBY_SKILLS_BY_GAME[lobbyGameId] ?? [])[0];
      if (fallback) handleSelectLobbySkill(fallback, question);
    },
    [lobbyGameId, lobbySearchQuery, handleSelectLobbySkill]
  );

  const handleToggleLobbyVoiceSearch = useCallback(() => {
    if (isListeningSearchVoice) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListeningSearchVoice(false);
      return;
    }

    const SpeechRecCtor =
      (
        window as unknown as {
          SpeechRecognition?: new () => BrowserSpeechRecognition;
          webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecCtor) {
      setLobbySearchQuery((prev) => (prev ? '' : 'L1'));
      return;
    }

    try {
      const rec = new SpeechRecCtor();
      rec.lang = 'fa-IR';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? '';
        setIsListeningSearchVoice(false);
        if (transcript) {
          setLobbySearchQuery(transcript);
        }
      };
      rec.onerror = () => {
        setIsListeningSearchVoice(false);
      };
      rec.onend = () => {
        setIsListeningSearchVoice(false);
      };
      recognitionRef.current = rec;
      setIsListeningSearchVoice(true);
      rec.start();
    } catch {
      setIsListeningSearchVoice(false);
    }
  }, [isListeningSearchVoice]);

  const handleUploadFile = (file: File) => {
    setIsGtaSocialOpen(false);
    const nextGameId = selectedGame.id || mapRealmToGameId(activeRealm);
    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = async () => {
      const resultUrl = typeof reader.result === 'string' ? reader.result : undefined;
      if (!resultUrl) return;

      const base = resolveCoachTopic(activeRealm, realmTopics[0].id);
      const uploadedTopic: CoachConsultationTopic = {
        ...base,
        id: `upload-${Date.now()}`,
        titleFa: `صحنه بازی من: ${file.name}`,
        titleEn: `My Gameplay Scene · ${file.name}`,
      };
      setActiveTopic(uploadedTopic);
      setUploadedMedia({
        url: resultUrl,
        isVideo,
        fileName: file.name,
      });
      triggerCoachSpeech(activeMotionPayload.voiceExplanationEn);

      // Honest 3-state triage (client-side pixel analysis, no external AI APIs):
      // 1) precise → detailed analysis, 2) unrecognized → ask to resend,
      // 3) irrelevant → tell the user the media is not gameplay.
      const triage = isVideo ? await triageVideoMedia(resultUrl) : await triageImageMedia(resultUrl);
      setUploadTriage(triage.state);
      setUploadTriageNoteFa(triage.reasonFa);
      if (triage.state !== 'precise') {
        setActiveTopic((prev) => (prev ? {
          ...prev,
          titleFa: triage.state === 'irrelevant' ? 'رسانه غیرمرتبط' : 'تشخیص ممکن نبود',
          titleEn: triage.state === 'irrelevant' ? 'Irrelevant media' : 'Not recognizable',
          coachAdviceFa: triage.reasonFa,
          coachVoiceEn: triage.reasonEn,
        } : prev));
        if (triage.state === 'unrecognized') {
          setUploadTriageNoteFa((prev) => prev + ' · لطفاً دوباره عکس/ویدیو بفرست');
        }
        return; // skip the fake vision pipeline for non-gameplay media
      }

      if (!isVideo) {
        setIsAnalyzingUpload(true);
        fetch('/api/adk/consult', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            realm: activeRealm,
            query: file.name,
            imageDataUrl: resultUrl,
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.topic) {
              setActiveTopic(data.topic as CoachConsultationTopic);
              if (data.topic.coachVoiceEn) {
                setMotionPayloadMap((prev) => ({
                  ...prev,
                  [nextGameId]: {
                    ...(prev[nextGameId] ?? activeMotionPayload),
                    voiceExplanationEn: String(data.topic.coachVoiceEn),
                  },
                }));
              }
            }
          })
          .catch(() => undefined)
          .finally(() => {
            setIsAnalyzingUpload(false);
          });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleVoiceQa = () => {
    if (isListeningVoice) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListeningVoice(false);
      return;
    }

    const SpeechRecCtor =
      (
        window as unknown as {
          SpeechRecognition?: new () => BrowserSpeechRecognition;
          webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecCtor) {
      triggerCoachSpeech(activeMotionPayload.voiceExplanationEn);
      return;
    }

    try {
      const rec = new SpeechRecCtor();
      rec.lang = 'fa-IR';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? '';
        setIsListeningVoice(false);
        if (transcript) {
          fetch(
            `/api/coach/search?realm=${encodeURIComponent(activeRealm)}&q=${encodeURIComponent(
              transcript
            )}`
          )
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              triggerCoachSpeech(
                data?.topic?.coachVoiceEn ?? activeMotionPayload.voiceExplanationEn
              );
            })
            .catch(() => triggerCoachSpeech(activeMotionPayload.voiceExplanationEn));
        } else {
          triggerCoachSpeech(activeMotionPayload.voiceExplanationEn);
        }
      };
      rec.onerror = () => {
        setIsListeningVoice(false);
        triggerCoachSpeech(activeMotionPayload.voiceExplanationEn);
      };
      rec.onend = () => {
        setIsListeningVoice(false);
      };
      recognitionRef.current = rec;
      setIsListeningVoice(true);
      rec.start();
    } catch {
      setIsListeningVoice(false);
      triggerCoachSpeech(activeMotionPayload.voiceExplanationEn);
    }
  };


  return (
    <div className="aigameria-desktop-shell">
    <MotionConfig skipAnimations={isRafFrozen}>
    {/* App-root ErrorBoundary: a single module crash (3D scene / video / map)
        must never blank the whole site — bounded Persian/English fallback. */}
    <AppErrorBoundary>
    <div
      data-realm={activeRealm}
      data-build={__BUILD_ID__}
      data-raf-frozen={isRafFrozen ? '1' : '0'}
      data-testid="aipetros-spatial-root"
      aria-busy={!boot.ready}
      className="relative w-full h-dvh min-h-dvh overflow-hidden select-none"
      style={{ backgroundColor: 'var(--realm-bg)', color: 'var(--realm-text)' }}
    >
      <AppBootGate ready={boot.ready} progress={boot.progress} stageKey={boot.stageKey} />
      {/* Aigameria v1.02 auth gate — full-cover before the app until signed in / guest */}
      {!authGate.ready && authGate.gate}
      {/* Section warmup — slim glass cover while a hub/section is being prepared */}
      <AnimatePresence>
        {sectionWarming && (
          <motion.div
            key="section-warmup"
            data-testid="section-warmup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={isRafFrozen ? undefined : { opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              background: 'rgba(5,7,13,0.42)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 26px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(10,14,24,0.72)',
                boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: '2px solid rgba(140,180,255,0.25)',
                  borderTopColor: 'rgba(140,180,255,0.95)',
                  animation: 'aig-spin 0.8s linear infinite',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: 13, color: 'rgba(220,230,250,0.9)', fontWeight: 600 }}>
                {bootCopy.sectionWarming}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <GlobalEarthLanguageButton />
      <LanguageSelectorModal activeHub={activeMasterHub} />
      <PlatformMapModal
        open={activeLeftOverlay === 'map'}
        activeHub={activeMasterHub}
        onClose={() => setActiveLeftOverlay(null)}
        onJumpToStoreCollection={(collectionId) => {
          setStoreInitialCollectionId(collectionId ?? null);
          setActiveLeftOverlay('store');
        }}
      />
      <PlatformStoreModal
        open={activeLeftOverlay === 'store'}
        activeHub={activeMasterHub}
        initialCollectionId={storeInitialCollectionId}
        onClose={() => setActiveLeftOverlay(null)}
      />
      <AnimatePresence>
        {activeMasterHub === 'cinema' ? (
          <motion.div
            key="hub-cinema"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={isRafFrozen ? undefined : { opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <CinemaHubView
              activeHub={activeMasterHub}
              onSelectHub={selectHub}
              onOpenMap={() => setActiveLeftOverlay('map')}
              onOpenStore={() => {
                setStoreInitialCollectionId(null);
                setActiveLeftOverlay('store');
              }}
            />
          </motion.div>
        ) : activeMasterHub === 'audio' ? (
          <motion.div
            key="hub-audio"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={isRafFrozen ? undefined : { opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <AudioHubView
              activeHub={activeMasterHub}
              onSelectHub={selectHub}
              onOpenMap={() => setActiveLeftOverlay('map')}
              onOpenStore={() => {
                setStoreInitialCollectionId(null);
                setActiveLeftOverlay('store');
              }}
            />
          </motion.div>
        ) : isIdentityProfileOpen ? (
          <motion.div
            key="hub-game-identity"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={isRafFrozen ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <CrossGameSpatialProfilePage
              onBackToLobby={() => setIsIdentityProfileOpen(false)}
            />
          </motion.div>
        ) : isTournamentHubOpen ? (
          <motion.div
            key="hub-game-tournament"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={isRafFrozen ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <GameNativeTournamentHub
              initialGameId={tournamentInitialGame}
              onBack={() => setIsTournamentHubOpen(false)}
            />
          </motion.div>
        ) : isGtaSocialOpen ? (
          <motion.div
            key="hub-game-social"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={isRafFrozen ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {/* 1. Aigameria Social Club — unified Petros-connection social layer */}
            <SocialClubApp skipInviteGate onExit={() => setIsGtaSocialOpen(false)} />
          </motion.div>
        ) : activeTopic ? (
          <motion.div
            key="hub-game-coach"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={isRafFrozen ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {/* 2. Unified Coach Page (PetrosUnifiedCoachPage) — per-game topic
                packs, direct video, analyz stage with pitch-guard, gamepad layer.
                The active app game maps into the unified catalog when available. */}
            <PetrosUnifiedCoachPage
              initialGameId={(
                ['cs2', 'fc27', 'warzone', 'nba2k', 'dota2'] as UnifiedCoachGameId[]
              ).includes(selectedGame.id as UnifiedCoachGameId)
                ? (selectedGame.id as UnifiedCoachGameId)
                : 'cs2'}
              initialLang={appLang.startsWith('fa') ? 'fa' : 'en'}
              analyzStageUrl="/analyz/"
              onBack={() => {
                stopSpeaking();
                setUploadedMedia(null);
                setClipProblemQuery('');
                setActiveTopic(null);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="hub-game-lobby"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={isRafFrozen ? undefined : { opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {/* 3. Clean Raw First Page — wordmark over the stadium-tunnel
                backdrop, zero data; only the left quick-menu button remains
                (PlayStation 5 Control Center style). */}
            <PetrosCleanLobby
              realm={activeRealm}
              manifest={manifest}
              useVideoBackdrop={useVideoBackdrop}
              onToggleBackdropMode={() => setUseVideoBackdrop((v) => !v)}
              onOpenQuickDemo={() => {
                const firstSkill = filteredLobbySkills[0];
                if (firstSkill) {
                  handleSelectLobbySkill(firstSkill);
                } else {
                  launchTopicSearch(realmTopics[0].id, 22, 74);
                }
              }}
              onOpenTournamentHub={() => {
                setTournamentInitialGame(resolveTournamentGameFromLobby(lobbyGameId));
                setIsTournamentHubOpen(true);
              }}
              onOpenSocialClub={() => setIsGtaSocialOpen(true)}
              onOpenIdentityProfile={() => setIsIdentityProfileOpen(true)}
              onOpenMap={() => setActiveLeftOverlay('map')}
              onOpenStore={() => {
                setStoreInitialCollectionId(null);
                setActiveLeftOverlay('store');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </AppErrorBoundary>
    </MotionConfig>
    </div>
  );
}

export default App;

try { console.log('[AIPETROS] build', __BUILD_ID__); } catch { /* ignore */ }
