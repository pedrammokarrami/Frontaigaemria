import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import type { MediaHubKind } from '../../data/iconicMediaCharacters';
import { AUDIO_ROOMS, type AudioRoomId } from '../../utils/audioAgents';
import { CINEMA_ROOMS, type CinemaRoomId } from '../../utils/cinemaAgents';
import type {
  HologramEmotion,
  HologramGender,
  HologramGesture,
} from '../../utils/hologramAvatarEngine';
import {
  matchIconicMediaCharacters,
  parseMediaSelfIntro,
} from '../../utils/iconicMediaMatcher';
import { MaxPayneNoirAudioEngine } from '../../utils/maxPayneNoirAudio';
import { AccountSettingsPage } from './AccountSettingsPage';
import { MediaNativeProfileCard } from './MediaNativeProfileCard';
import {
  AUDIO_PROFILE_SWITCHER_ORDER,
  AUDIO_PROFILE_THEMES,
  CINEMA_PROFILE_SWITCHER_ORDER,
  CINEMA_PROFILE_THEMES,
  type MediaProfileThemeConfig,
  type MediaRoomKey,
} from './mediaProfileThemes';
import {
  AUDIO_SOCIAL_PLATFORMS,
  CINEMA_SOCIAL_PLATFORMS,
  type LinkedSocialMap,
  SocialLinksCard,
} from './SocialLinksCard';
import { SpatialStage3D } from './SpatialStage3D';

interface MediaSpatialProfilePageProps {
  hub: MediaHubKind;
  initialRoomId: MediaRoomKey;
  onSelectRoomExternal?: (roomId: MediaRoomKey) => void;
  onBackToLobby: () => void;
}

const CINEMA_SUGGESTIONS = [
  'من سارا هستم، ۱۴ سالمه و عاشق انیمه و توکیو بارانی‌ام',
  'مرد ۶۸ ساله علاقه‌مند به فیلم نوآر کلاسیک و مستند هستم',
];

const AUDIO_SUGGESTIONS = [
  'من دختر ۲۰ ساله عاشق تومارلند و موزیک الکترونیک‌ام',
  'مرد ۷۸ ساله اهل کافه وست‌ورلد و کتاب صوتی هستم',
];

function loadSavedMediaLinks(hub: MediaHubKind): LinkedSocialMap {
  const key = `aipetros_media_links_${hub}_v1`;
  const defaults: LinkedSocialMap =
    hub === 'cinema'
      ? { telegram: 't.me/noir_vault_ch', letterboxd: 'letterboxd.com/kian' }
      : { telegram: 't.me/berlin_sub_ch', spotify: 'spotify:user:kian' };
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object') return { ...(parsed as LinkedSocialMap) };
    }
  } catch {
    // ignore storage errors
  }
  return defaults;
}

export const MediaSpatialProfilePage: React.FC<MediaSpatialProfilePageProps> = ({
  hub,
  initialRoomId,
  onSelectRoomExternal,
  onBackToLobby,
}) => {
  const [activeRoomId, setActiveRoomId] = useState<MediaRoomKey>(initialRoomId);
  const [displayName, setDisplayName] = useState<string>('کیانوش راد');
  const [gender, setGender] = useState<HologramGender>('male');
  const [age, setAge] = useState<number>(hub === 'cinema' ? 32 : 33);
  const [userTraitsFa, setUserTraitsFa] = useState<string[]>(
    hub === 'cinema' ? ['آرشیویست نوآر', 'نگاه کارگردان'] : ['گوش تیز آکوستیک', 'ریتم‌محور']
  );
  const [linkedSocials, setLinkedSocials] = useState<LinkedSocialMap>(() =>
    loadSavedMediaLinks(hub)
  );
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  const [emotion, setEmotion] = useState<HologramEmotion>('Confident');
  const [gesture, setGesture] = useState<HologramGesture>('Point');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>(
    hub === 'cinema'
      ? 'سلام! اسم، سن (۸ تا ۹۹) و ژانر فیلم یا سریالت رو بنویس تا کاراکتر سینمایی سه‌بعدیت زنده ساخته بشه.'
      : 'سلام! اسم، سن (۸ تا ۹۹) و سبک موزیک یا پادکست موردعلاقه‌ات رو بنویس تا کاراکتر صوتی سه‌بعدیت زنده ساخته بشه.'
  );

  const audioRmsRef = useRef<number>(0);
  const speechTimerRef = useRef<number>(0);
  const noirAudioEngineRef = useRef<MaxPayneNoirAudioEngine | null>(null);
  if (!noirAudioEngineRef.current) {
    noirAudioEngineRef.current = new MaxPayneNoirAudioEngine();
  }

  useEffect(() => {
    setActiveRoomId(initialRoomId);
  }, [initialRoomId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        `aipetros_media_links_${hub}_v1`,
        JSON.stringify(linkedSocials)
      );
    } catch {
      // ignore
    }
  }, [hub, linkedSocials]);

  useEffect(() => {
    return () => {
      noirAudioEngineRef.current?.dispose();
      if (speechTimerRef.current) window.clearTimeout(speechTimerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const switcherOrder =
    hub === 'cinema' ? CINEMA_PROFILE_SWITCHER_ORDER : AUDIO_PROFILE_SWITCHER_ORDER;

  const activeTheme: MediaProfileThemeConfig = useMemo(() => {
    if (hub === 'cinema') {
      return CINEMA_PROFILE_THEMES[activeRoomId as CinemaRoomId] ?? CINEMA_PROFILE_THEMES.movie;
    }
    return (
      AUDIO_PROFILE_THEMES[activeRoomId as AudioRoomId] ?? AUDIO_PROFILE_THEMES['westworld-cafe']
    );
  }, [activeRoomId, hub]);

  const roomMeta = useMemo(() => {
    if (hub === 'cinema') {
      const r = CINEMA_ROOMS.find((x) => x.id === activeRoomId) ?? CINEMA_ROOMS[0];
      const parts = r.recommendedFormatLabel.split('·').map((s) => s.trim());
      return {
        subtitleFa: r.subtitleFa,
        primaryLabel: 'STREAM SPEC',
        primaryValue: parts[0] || r.recommendedFormatLabel,
      };
    }
    const r = AUDIO_ROOMS.find((x) => x.id === activeRoomId) ?? AUDIO_ROOMS[0];
    return {
      subtitleFa: r.subtitleFa,
      primaryLabel: 'TEMPO RANGE',
      primaryValue: `${r.bpmRange[0]}–${r.bpmRange[1]} BPM`,
    };
  }, [activeRoomId, hub]);

  const matchReport = useMemo(
    () =>
      matchIconicMediaCharacters({
        hub,
        gender,
        age,
        activeRoomId: activeRoomId as CinemaRoomId | AudioRoomId,
      }),
    [activeRoomId, age, gender, hub]
  );

  const activeMatch = matchReport.topMatch;
  const linkedCount = useMemo(
    () => Object.values(linkedSocials).filter((v) => v.trim().length > 0).length,
    [linkedSocials]
  );

  const handleSelectRoom = (nextRoom: MediaRoomKey) => {
    setActiveRoomId(nextRoom);
    onSelectRoomExternal?.(nextRoom);
  };

  const handleSendPrompt = useCallback(
    (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      setAgentError(null);
      setIsThinking(true);
      setEmotion('Thinking');

      const parsed = parseMediaSelfIntro(trimmed, hub);
      const nextGender = parsed.detectedGender ?? gender;
      const nextAge = parsed.detectedAge ?? age;
      const nextRoom = (parsed.detectedRoomId ?? activeRoomId) as MediaRoomKey;
      const nextName = parsed.detectedName ?? displayName;

      if (parsed.detectedGender) setGender(parsed.detectedGender);
      if (parsed.detectedAge !== null) setAge(parsed.detectedAge);
      if (parsed.detectedName) setDisplayName(parsed.detectedName);
      if (parsed.detectedRoomId) {
        setActiveRoomId(nextRoom);
        onSelectRoomExternal?.(nextRoom);
      }
      if (parsed.extractedTraitsFa.length > 0) {
        setUserTraitsFa((prev) =>
          Array.from(new Set([...parsed.extractedTraitsFa, ...prev])).slice(0, 4)
        );
      }

      const nextMatch = matchIconicMediaCharacters({
        hub,
        gender: nextGender,
        age: nextAge,
        activeRoomId: nextRoom as CinemaRoomId | AudioRoomId,
      }).topMatch;

      const who = parsed.detectedName ? `${nextName} عزیز، ` : '';
      const reply = `${who}کاراکتر سه‌بعدی تو با سن ${nextAge} سال به شخصیت «${nextMatch.character.nameFa}» (${nextMatch.character.franchise}) تغییر کرد.`;
      setLiveTranscript(reply);
      setEmotion('Speaking');
      setGesture('Wave');
      setIsThinking(false);

      if (voiceEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(reply);
          utter.lang = 'fa-IR';
          utter.rate = 1.02;
          setIsSpeaking(true);
          utter.onend = () => setIsSpeaking(false);
          utter.onerror = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utter);
        } catch {
          setIsSpeaking(false);
        }
      } else {
        setIsSpeaking(true);
        if (speechTimerRef.current) window.clearTimeout(speechTimerRef.current);
        speechTimerRef.current = window.setTimeout(() => setIsSpeaking(false), 2600);
      }
    },
    [activeRoomId, age, displayName, gender, hub, onSelectRoomExternal, voiceEnabled]
  );

  const handleToggleMic = () => {
    const SpeechCtor =
      (window as unknown as { SpeechRecognition?: new () => { lang: string; onresult: ((e: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void } })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => { lang: string; onresult: ((e: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void } })
        .webkitSpeechRecognition;
    if (!SpeechCtor) {
      setAgentError('ضبط صوت در این مرورگر پشتیبانی نمی‌شود؛ می‌توانید پیام خود را تایپ کنید.');
      return;
    }
    setAgentError(null);
    const rec = new SpeechCtor();
    rec.lang = 'fa-IR';
    rec.onresult = (event) => {
      const spoken = event.results?.[0]?.[0]?.transcript?.trim();
      setIsListeningMic(false);
      if (spoken) handleSendPrompt(spoken);
    };
    rec.onerror = () => setIsListeningMic(false);
    rec.onend = () => setIsListeningMic(false);
    setIsListeningMic(true);
    rec.start();
  };

  if (showAccountSettings && noirAudioEngineRef.current) {
    return (
      <AccountSettingsPage
        audioEngine={noirAudioEngineRef.current}
        onBack={() => {
          noirAudioEngineRef.current?.stop();
          setShowAccountSettings(false);
        }}
        onDisplayNameChange={(n) => setDisplayName(n)}
      />
    );
  }

  return (
    <div
      data-testid={`${hub}-spatial-profile-page`}
      data-active-room={activeRoomId}
      data-page-bg={activeTheme.pageBgHex}
      dir="ltr"
      className="relative w-full h-dvh overflow-y-auto overflow-x-hidden text-white select-text transition-colors duration-500"
      style={{
        fontFamily: "'Plus Jakarta Sans', 'Outfit', system-ui, -apple-system, sans-serif",
        backgroundColor: activeTheme.pageBgHex,
        backgroundImage: activeTheme.pageBgGradient,
      }}
    >
      {/* Dynamic 3-Zone Sticky Top Bar (Exact mirror of CrossGameSpatialProfilePage) */}
      <header
        className="sticky top-0 z-30 border-b transition-colors duration-300"
        style={{
          backgroundColor: activeTheme.topBarBg,
          borderColor: activeTheme.topBarBorder,
        }}
      >
        <div className="max-w-7xl mx-auto pl-14 sm:pl-16 pr-4 sm:pr-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Zone 1: Back + Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              data-testid={`${hub}-profile-back-btn`}
              onClick={onBackToLobby}
              aria-label="بازگشت به لابی"
              className="w-9 h-9 rounded-xl border border-white/15 bg-white/8 hover:bg-white/14 flex items-center justify-center text-white transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-[11px] tracking-tight shrink-0 transition-colors duration-300"
                style={{
                  backgroundColor: activeTheme.accentHex,
                  color: activeTheme.activeTabText,
                }}
              >
                {hub === 'cinema' ? 'AC' : 'AM'}
              </div>
              <span className="hidden md:inline text-[14px] font-extrabold tracking-tight text-white whitespace-nowrap">
                {hub === 'cinema' ? 'AIPETROS CINEMA' : 'AIPETROS AUDIO'}
              </span>
            </div>
          </div>

          {/* Zone 2: 5 Cinema or 7 Audio Rooms Switcher (dynamically switches page background) */}
          <nav
            dir="rtl"
            aria-label={hub === 'cinema' ? 'انتخاب اتاق سینما' : 'انتخاب اتاق موزیک و پادکست'}
            data-testid={`${hub}-profile-rooms-switcher`}
            className="flex-1 min-w-0 flex items-center gap-1 p-1 rounded-2xl bg-black/35 border border-white/12 overflow-x-auto no-scrollbar"
          >
            {switcherOrder.map((roomKey) => {
              const cfg =
                hub === 'cinema'
                  ? CINEMA_PROFILE_THEMES[roomKey as CinemaRoomId]
                  : AUDIO_PROFILE_THEMES[roomKey as AudioRoomId];
              const active = activeRoomId === roomKey;
              return (
                <button
                  key={roomKey}
                  type="button"
                  data-testid={`${hub}-profile-room-tab-${roomKey}`}
                  aria-pressed={active}
                  onClick={() => handleSelectRoom(roomKey)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11.5px] font-bold cursor-pointer whitespace-nowrap shrink-0 border transition ${
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

          {/* Zone 3: Max Payne Noir Account Settings Trigger */}
          <button
            type="button"
            data-testid={`open-${hub}-account-settings-btn`}
            onClick={() => {
              noirAudioEngineRef.current?.start();
              setShowAccountSettings(true);
            }}
            aria-label="تنظیمات حساب کاربری، ایمیل، رمز عبور و خروج"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-white/15 bg-white/8 hover:bg-white/15 text-white text-[12px] font-semibold transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تنظیمات حساب</span>
          </button>
        </div>
      </header>

      {/* Character-First 12-Col Main Stage (Exact mirror of CrossGameSpatialProfilePage) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 cols: Locked 3D Volumetric Stage + Self-Intro Chat (8..99 Male/Female) */}
          <div className="lg:col-span-7">
            <SpatialStage3D
              activeGameKey="unified"
              accentHex={activeTheme.accentHex}
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
              onSendPrompt={handleSendPrompt}
              customLabEnv={activeTheme.labEnv}
              customStageFrame={activeTheme}
              customSuggestions={hub === 'cinema' ? CINEMA_SUGGESTIONS : AUDIO_SUGGESTIONS}
              customPlaceholder={
                hub === 'cinema'
                  ? 'از خودت بگو... (اسم، سن ۸ تا ۹۹، زن/مرد و فیلم یا سریال موردعلاقه‌ات)'
                  : 'از خودت بگو... (اسم، سن ۸ تا ۹۹، زن/مرد و سبک موزیک یا کتاب صوتی موردعلاقه‌ات)'
              }
            />
          </div>

          {/* Right 5 cols: Domain Native Profile Card + Domain Social Links Card */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <MediaNativeProfileCard
              hub={hub}
              theme={activeTheme}
              displayName={displayName}
              userAge={age}
              userGender={gender}
              matchedCharacter={activeMatch.character}
              similarityPct={activeMatch.similarityPct}
              userTraitsFa={userTraitsFa}
              linkedCount={linkedCount}
              roomSubtitleFa={roomMeta.subtitleFa}
              metricPrimaryLabel={activeMatch.character.signatureStatLabel}
              metricPrimaryValue={activeMatch.character.signatureStatValue}
              metricSecondaryLabel={roomMeta.primaryLabel}
              metricSecondaryValue={roomMeta.primaryValue}
            />

            <SocialLinksCard
              links={linkedSocials}
              accentHex={activeTheme.accentHex}
              surfaceBg={activeTheme.cardSurfaceBg}
              borderColor={activeTheme.cardBorderColor}
              platforms={hub === 'cinema' ? CINEMA_SOCIAL_PLATFORMS : AUDIO_SOCIAL_PLATFORMS}
              titleFa={
                hub === 'cinema'
                  ? 'لینک اکانت‌های سینما، تلگرام و سوشیال'
                  : 'لینک اکانت‌های موزیک، پادکست و سوشیال'
              }
              onSaveLink={(platformId, handle) =>
                setLinkedSocials((prev) => ({ ...prev, [platformId]: handle }))
              }
              onRemoveLink={(platformId) =>
                setLinkedSocials((prev) => {
                  const next = { ...prev };
                  delete next[platformId];
                  return next;
                })
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
};
