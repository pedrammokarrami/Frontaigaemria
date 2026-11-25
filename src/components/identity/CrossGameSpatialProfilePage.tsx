import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { type OfflineAgentsState } from '../../data/offlineAgentsData';
import {
  loadOfflineProfileSnapshot,
  persistOfflineProfileSnapshot,
  switchCrossGameHandle,
} from '../../services/offlineAgents';
import {
  type HologramEmotion,
  type HologramGender,
  type HologramGesture,
} from '../../utils/hologramAvatarEngine';
import { matchIconicCharacters } from '../../utils/iconicCharacterMatcher';
import { MaxPayneNoirAudioEngine } from '../../utils/maxPayneNoirAudio';
import { parseUserSelfIntro } from '../../utils/userSelfIntroParser';
import { AccountSettingsPage } from './AccountSettingsPage';
import {
  GAME_STAGE_FRAME_CONFIG,
  REGISTERED_GAME_SWITCHER_ORDER,
} from './gameProfileThemes';
import { GameNativeProfileCard } from './GameNativeProfileCard';
import { type LinkedSocialMap, SocialLinksCard } from './SocialLinksCard';
import { SpatialStage3D } from './SpatialStage3D';

interface CrossGameSpatialProfilePageProps {
  onBackToLobby?: () => void;
}

interface HologramSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const SOCIAL_LINKS_STORAGE_KEY = 'aipetros_social_links_v1';

const DEFAULT_SOCIAL_LINKS: LinkedSocialMap = {
  discord: 'kian.spatial',
  steam: 'kian_mirage',
};

function loadSavedSocialLinks(): LinkedSocialMap {
  if (typeof window === 'undefined') return { ...DEFAULT_SOCIAL_LINKS };
  try {
    const raw = window.localStorage.getItem(SOCIAL_LINKS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SOCIAL_LINKS };
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') {
      return { ...(parsed as LinkedSocialMap) };
    }
  } catch {
    // Ignore storage read issues
  }
  return { ...DEFAULT_SOCIAL_LINKS };
}

export const CrossGameSpatialProfilePage: React.FC<CrossGameSpatialProfilePageProps> = ({
  onBackToLobby,
}) => {
  const [profileState, setProfileState] = useState<OfflineAgentsState>(() =>
    loadOfflineProfileSnapshot()
  );
  const [linkedSocials, setLinkedSocials] = useState<LinkedSocialMap>(() => loadSavedSocialLinks());
  const [userTraitsFa, setUserTraitsFa] = useState<string[]>(['ذهن تاکتیکی و دقیق']);

  // Dedicated Full-Page Max Payne Noir Account Settings Screen
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  // Live 3D Character Identity State (driven by self-intro chat; camera locked on 3D view)
  const [gender, setGender] = useState<HologramGender>('male');
  const [age, setAge] = useState<number>(36);
  const [pinnedCharacterId, setPinnedCharacterId] = useState<string | null>(null);

  const [emotion, setEmotion] = useState<HologramEmotion>('Confident');
  const [gesture, setGesture] = useState<HologramGesture>('Point');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>(
    'سلام! کمی از خودت، سنت و سبک بازیت بنویس تا کاراکتر سه‌بعدیت دقیقاً شبیه شخصیتت ساخته بشه.'
  );

  const audioRmsRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeAudioElRef = useRef<HTMLAudioElement | null>(null);
  const analyserRafRef = useRef<number>(0);
  const speechTimerRef = useRef<number>(0);
  const recognitionRef = useRef<HologramSpeechRecognition | null>(null);
  const noirAudioEngineRef = useRef<MaxPayneNoirAudioEngine | null>(null);
  if (!noirAudioEngineRef.current) {
    noirAudioEngineRef.current = new MaxPayneNoirAudioEngine();
  }

  const activeProfile =
    profileState.profiles[profileState.activeGameKey] ?? profileState.profiles.unified;
  const activePageTheme =
    GAME_STAGE_FRAME_CONFIG[profileState.activeGameKey] ?? GAME_STAGE_FRAME_CONFIG.unified;

  const linkedCount = useMemo(
    () => Object.values(linkedSocials).filter((v) => v.trim().length > 0).length,
    [linkedSocials]
  );

  // Live 50-Character Iconic Matching Engine
  const matchReport = useMemo(
    () =>
      matchIconicCharacters({
        gender,
        age,
        activeGameKey: profileState.activeGameKey,
        winRatePct: activeProfile.winRatePct,
        tacticalConsistencyPct: activeProfile.tacticalConsistencyPct,
        competitiveRating: activeProfile.competitiveRating,
      }),
    [
      activeProfile.competitiveRating,
      activeProfile.tacticalConsistencyPct,
      activeProfile.winRatePct,
      age,
      gender,
      profileState.activeGameKey,
    ]
  );

  const activeMatch = useMemo(() => {
    if (pinnedCharacterId) {
      const found = matchReport.allRanked.find((m) => m.character.id === pinnedCharacterId);
      if (found) return found;
    }
    return matchReport.topMatch;
  }, [matchReport, pinnedCharacterId]);

  useEffect(() => {
    persistOfflineProfileSnapshot(profileState);
  }, [profileState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SOCIAL_LINKS_STORAGE_KEY, JSON.stringify(linkedSocials));
    } catch {
      // Ignore storage write issues
    }
  }, [linkedSocials]);

  useEffect(() => {
    return () => {
      noirAudioEngineRef.current?.dispose();
    };
  }, []);

  const handleSaveSocialLink = useCallback((platformId: string, handle: string) => {
    setLinkedSocials((prev) => ({ ...prev, [platformId]: handle }));
  }, []);

  const handleRemoveSocialLink = useCallback((platformId: string) => {
    setLinkedSocials((prev) => {
      const next = { ...prev };
      delete next[platformId];
      return next;
    });
  }, []);

  const handleOpenAccountSettings = useCallback(() => {
    // Start Max Payne Noir Soundtrack synchronously inside user gesture click
    noirAudioEngineRef.current?.start();
    setShowAccountSettings(true);
  }, []);

  const handleCloseAccountSettings = useCallback(() => {
    noirAudioEngineRef.current?.stop();
    setShowAccountSettings(false);
  }, []);

  const stopVoicePlayback = useCallback(() => {
    if (analyserRafRef.current) {
      window.cancelAnimationFrame(analyserRafRef.current);
      analyserRafRef.current = 0;
    }
    if (speechTimerRef.current) {
      window.clearTimeout(speechTimerRef.current);
      speechTimerRef.current = 0;
    }
    if (activeAudioElRef.current) {
      activeAudioElRef.current.pause();
      activeAudioElRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    audioRmsRef.current = 0;
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      stopVoicePlayback();
      recognitionRef.current?.stop();
      audioCtxRef.current?.close().catch(() => undefined);
    };
  }, [stopVoicePlayback]);

  const playVoiceWithRealTimeLipSync = useCallback(
    async (text: string, audioBase64: string | null, audioMimeType: string | null) => {
      stopVoicePlayback();
      const estimatedMs = Math.max(2200, Math.min(7000, text.length * 50));

      if (!voiceEnabled) {
        setIsSpeaking(true);
        speechTimerRef.current = window.setTimeout(() => {
          setIsSpeaking(false);
        }, estimatedMs);
        return;
      }

      if (audioBase64) {
        try {
          const mime = audioMimeType || 'audio/wav';
          const audio = new Audio(`data:${mime};base64,${audioBase64}`);
          activeAudioElRef.current = audio;

          const AudioContextCtor =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

          if (AudioContextCtor) {
            const ctx = audioCtxRef.current ?? new AudioContextCtor();
            audioCtxRef.current = ctx;
            if (ctx.state === 'suspended') {
              await ctx.resume().catch(() => undefined);
            }
            const source = ctx.createMediaElementSource(audio);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyser.connect(ctx.destination);
            const timeDomain = new Uint8Array(analyser.frequencyBinCount);

            const sampleLoop = () => {
              if (!activeAudioElRef.current || activeAudioElRef.current.paused) {
                audioRmsRef.current = 0;
                return;
              }
              analyser.getByteTimeDomainData(timeDomain);
              let sumSq = 0;
              for (let i = 0; i < timeDomain.length; i += 1) {
                const centered = (timeDomain[i] - 128) / 128;
                sumSq += centered * centered;
              }
              audioRmsRef.current = Math.sqrt(sumSq / timeDomain.length);
              analyserRafRef.current = window.requestAnimationFrame(sampleLoop);
            };

            audio.onplay = () => {
              setIsSpeaking(true);
              sampleLoop();
            };
            audio.onended = () => {
              stopVoicePlayback();
            };
            audio.onerror = () => {
              stopVoicePlayback();
            };
            await audio.play();
            return;
          }
        } catch {
          // Fall through cleanly to Web Speech fallback
        }
      }

      setIsSpeaking(true);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          const utter = new SpeechSynthesisUtterance(text);
          utter.lang = /[\u0600-\u06FF]/.test(text) ? 'fa-IR' : 'en-US';
          utter.rate = 1.02;
          utter.onend = () => setIsSpeaking(false);
          utter.onerror = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utter);
        } catch {
          // Keep timer-bounded lip-sync active
        }
      }
      speechTimerRef.current = window.setTimeout(() => {
        setIsSpeaking(false);
      }, estimatedMs);
    },
    [stopVoicePlayback, voiceEnabled]
  );

  const handleSendHologramPrompt = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;

      stopVoicePlayback();
      setAgentError(null);
      setIsThinking(true);
      setEmotion('Thinking');
      setGesture('Thinking');

      // 1. Parse natural self-introduction cues immediately so the 3D character morphs live!
      const parsed = parseUserSelfIntro(trimmed);
      const nextGender = parsed.detectedGender ?? gender;
      const nextAge = parsed.detectedAge ?? age;
      const nextGameKey = parsed.detectedGameKey ?? profileState.activeGameKey;
      const nextDisplayName = parsed.detectedName ?? profileState.displayName;

      if (parsed.detectedGender) setGender(parsed.detectedGender);
      if (parsed.detectedAge !== null) setAge(parsed.detectedAge);
      if (parsed.detectedGender || parsed.detectedAge !== null || parsed.detectedGameKey) {
        setPinnedCharacterId(null);
      }

      if (parsed.extractedTraitsFa.length > 0) {
        setUserTraitsFa((prev) => {
          const merged = Array.from(new Set([...parsed.extractedTraitsFa, ...prev]));
          return merged.slice(0, 4);
        });
      }

      if (parsed.detectedName || parsed.detectedGameKey) {
        setProfileState((prev) => {
          const switched = parsed.detectedGameKey
            ? switchCrossGameHandle(prev, parsed.detectedGameKey)
            : prev;
          return parsed.detectedName
            ? { ...switched, displayName: parsed.detectedName }
            : switched;
        });
      }

      const targetProfile = profileState.profiles[nextGameKey];
      const nextMatch = matchIconicCharacters({
        gender: nextGender,
        age: nextAge,
        activeGameKey: nextGameKey,
        winRatePct: targetProfile.winRatePct,
        tacticalConsistencyPct: targetProfile.tacticalConsistencyPct,
        competitiveRating: targetProfile.competitiveRating,
      }).topMatch;

      const buildGracefulPersianReply = () => {
        const who = parsed.detectedName ? `${parsed.detectedName} عزیز، ` : '';
        const traitSummary =
          parsed.extractedTraitsFa.length > 0
            ? ` با ویژگی‌های «${parsed.extractedTraitsFa.join(' و ')}»`
            : '';
        return `${who}کاراکترت بر اساس سن ${nextAge} سال${traitSummary} به نزدیک‌ترین اسطوره یعنی ${nextMatch.character.nameFa} (${nextMatch.character.franchise}) آپدیت شد.`;
      };

      // Instant live feedback so the user sees immediate confirmation while optional AI reply streams in
      const instantReply = buildGracefulPersianReply();
      setLiveTranscript(instantReply);

      try {
        const res = await fetch('/api/hologram/interact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            includeVoice: voiceEnabled,
            personaContext: {
              displayName: nextDisplayName,
              handle: targetProfile.handle,
              unifiedId: profileState.unifiedId,
              activeGameTitle: targetProfile.gameTitle,
              tierLabel: targetProfile.tierLabel,
              winRatePct: targetProfile.winRatePct,
              tacticalConsistencyPct: targetProfile.tacticalConsistencyPct,
              competitiveRating: targetProfile.competitiveRating,
              verifiedMatchesCount: targetProfile.verifiedMatchesCount,
              queuedMatchesCount: profileState.scoreboardAgent.queuedCount,
              openDisputesCount: profileState.disputeAgent.cases.filter(
                (c) => c.status === 'Open Review'
              ).length,
              gender: nextGender,
              age: nextAge,
              matchedCharacterName: nextMatch.character.nameEn,
              matchedCharacterFranchise: nextMatch.character.franchise,
              matchedCharacterArchetype: nextMatch.character.archetypeEn,
            },
          }),
        });

        const payload = (await res.json()) as {
          replyText?: string;
          emotion?: HologramEmotion;
          gesture?: HologramGesture;
          audioBase64?: string | null;
          audioMimeType?: string | null;
          error?: string;
        };

        if (!res.ok) {
          throw new Error(payload.error || 'fallback');
        }

        const nextReply = payload.replyText || buildGracefulPersianReply();
        setLiveTranscript(nextReply);
        setEmotion(payload.emotion ?? 'Speaking');
        setGesture(payload.gesture ?? 'Wave');

        await playVoiceWithRealTimeLipSync(
          nextReply,
          payload.audioBase64 ?? null,
          payload.audioMimeType ?? null
        );
      } catch {
        // Offline / preview fallback: keep the live character morph seamless with a warm Persian reply
        const fallbackReply = buildGracefulPersianReply();
        setLiveTranscript(fallbackReply);
        setEmotion('Confident');
        setGesture('Wave');
        await playVoiceWithRealTimeLipSync(fallbackReply, null, null);
      } finally {
        setIsThinking(false);
      }
    },
    [age, gender, playVoiceWithRealTimeLipSync, profileState, stopVoicePlayback, voiceEnabled]
  );

  const handleToggleMic = () => {
    if (isListeningMic) {
      recognitionRef.current?.stop();
      setIsListeningMic(false);
      return;
    }

    const SpeechCtor =
      (window as unknown as { SpeechRecognition?: new () => HologramSpeechRecognition })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => HologramSpeechRecognition })
        .webkitSpeechRecognition;

    if (!SpeechCtor) {
      setAgentError('ضبط صوت در این مرورگر پشتیبانی نمی‌شود؛ می‌توانید پیام خود را تایپ کنید.');
      return;
    }

    setAgentError(null);
    const rec = new SpeechCtor();
    rec.lang = 'fa-IR';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const spoken = event.results?.[0]?.[0]?.transcript?.trim();
      setIsListeningMic(false);
      if (spoken) {
        handleSendHologramPrompt(spoken);
      }
    };
    rec.onerror = () => setIsListeningMic(false);
    rec.onend = () => setIsListeningMic(false);
    recognitionRef.current = rec;
    setIsListeningMic(true);
    setEmotion('Focused');
    rec.start();
  };

  if (showAccountSettings && noirAudioEngineRef.current) {
    return (
      <AccountSettingsPage
        audioEngine={noirAudioEngineRef.current}
        onBack={handleCloseAccountSettings}
        onDisplayNameChange={(nextName) =>
          setProfileState((prev) => ({
            ...prev,
            displayName: nextName,
          }))
        }
      />
    );
  }

  return (
    <div
      data-testid="crossgame-spatial-profile-page"
      data-active-game={profileState.activeGameKey}
      data-page-bg={activePageTheme.pageBgHex}
      dir="ltr"
      className="relative w-full h-dvh overflow-y-auto overflow-x-hidden text-white select-text transition-colors duration-500"
      style={{
        fontFamily: "'Plus Jakarta Sans', 'Outfit', system-ui, -apple-system, sans-serif",
        backgroundColor: activePageTheme.pageBgHex,
        backgroundImage: activePageTheme.pageBgGradient,
      }}
    >
      {/* Dynamic Game-Themed 3-Zone Top Bar: Brand | 11 Game Spaces Switcher | Settings */}
      <header
        className="sticky top-0 z-30 border-b transition-colors duration-300"
        style={{
          backgroundColor: activePageTheme.topBarBg,
          borderColor: activePageTheme.topBarBorder,
        }}
      >
        <div className="max-w-7xl mx-auto pl-14 sm:pl-16 pr-4 sm:pr-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Zone 1: Back + Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            {onBackToLobby && (
              <button
                type="button"
                data-testid="spatial-profile-back-btn"
                onClick={onBackToLobby}
                aria-label="بازگشت به لابی"
                className="w-9 h-9 rounded-xl border border-white/15 bg-white/8 hover:bg-white/14 flex items-center justify-center text-white transition cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-[11px] tracking-tight shrink-0 transition-colors duration-300"
                style={{
                  backgroundColor: activePageTheme.accentHex,
                  color: activePageTheme.activeTabText,
                }}
              >
                AG
              </div>
              <span className="hidden md:inline text-[14px] font-extrabold tracking-tight text-white whitespace-nowrap">
                AIPETROS
              </span>
            </div>
          </div>

          {/* Zone 2: All 11 Registered Game Spaces + Unified Switcher */}
          <nav
            aria-label="انتخاب فضای بازی از ۱۱ بازی ثبت‌شده"
            data-testid="registered-games-switcher"
            className="flex-1 min-w-0 flex items-center gap-1 p-1 rounded-2xl bg-black/35 border border-white/12 overflow-x-auto no-scrollbar"
          >
            {REGISTERED_GAME_SWITCHER_ORDER.map((gameKey) => {
              const cfg = GAME_STAGE_FRAME_CONFIG[gameKey];
              const active = profileState.activeGameKey === gameKey;
              return (
                <button
                  key={gameKey}
                  type="button"
                  data-testid={`handle-tab-${gameKey}`}
                  aria-pressed={active}
                  onClick={() =>
                    setProfileState((prev) => switchCrossGameHandle(prev, gameKey))
                  }
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11.5px] font-bold cursor-pointer whitespace-nowrap shrink-0 border ${
                    active
                      ? 'shadow-sm'
                      : 'border-transparent text-slate-300 hover:text-white hover:bg-white/8'
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: cfg.activeTabBg,
                          color: cfg.activeTabText,
                          borderColor: cfg.activeTabBorder,
                        }
                      : undefined
                  }
                >
                  {cfg.shortLabel}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Dedicated Account Settings Page Trigger (Email, Password, Sign Out) */}
          <button
            type="button"
            data-testid="open-account-settings-btn"
            onClick={handleOpenAccountSettings}
            aria-label="تنظیمات حساب کاربری، ایمیل، رمز عبور و خروج"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-white/15 bg-white/8 hover:bg-white/15 text-white text-[12px] font-semibold transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تنظیمات حساب</span>
          </button>
        </div>
      </header>

      {/* Character-First Minimal Main Stage */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Primary Hero: 3D Volumetric Character Locked to 3D View + Self-Intro Chat */}
          <div className="lg:col-span-7">
            <SpatialStage3D
              activeGameKey={profileState.activeGameKey}
              accentHex={activePageTheme.accentHex}
              focusPreset="stage"
              gender={gender}
              age={age}
              renderMode="ue58-hybrid"
              matchedCharacter={activeMatch.character}
              similarityPct={activeMatch.similarityPct}
              emotion={emotion}
              gesture={gesture}
              displayMode="standard"
              isSpeaking={isSpeaking}
              isThinking={isThinking}
              voiceEnabled={voiceEnabled}
              isListeningMic={isListeningMic}
              liveTranscript={liveTranscript}
              agentError={agentError}
              audioRmsRef={audioRmsRef}
              onToggleVoiceEnabled={() => setVoiceEnabled((v) => !v)}
              onToggleMic={handleToggleMic}
              onSendPrompt={handleSendHologramPrompt}
            />
          </div>

          {/* Right Rail: Authentic Game-Native Profile Card + Dynamic Themed Social Links */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <GameNativeProfileCard
              gameKey={profileState.activeGameKey}
              unifiedId={profileState.unifiedId}
              displayName={profileState.displayName}
              profile={activeProfile}
              matchedCharacter={activeMatch.character}
              similarityPct={activeMatch.similarityPct}
              userTraitsFa={userTraitsFa}
              linkedCount={linkedCount}
            />

            <SocialLinksCard
              links={linkedSocials}
              accentHex={activePageTheme.accentHex}
              surfaceBg={activePageTheme.cardSurfaceBg}
              borderColor={activePageTheme.cardBorderColor}
              onSaveLink={handleSaveSocialLink}
              onRemoveLink={handleRemoveSocialLink}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
