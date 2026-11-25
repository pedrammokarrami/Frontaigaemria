/**
 * PetrosUnifiedCoachPage — unified coach page (user-provided reference code,
 * faithful reconstruction with corrected JSX syntax).
 *
 * Self-contained: per-game catalog (topics/tips/video/stage presets), EN/FA
 * toggle with RTL, direct video playback, analyz tactical stage iframe with
 * the hard pitch-guard, and the controller layer slot.
 */
import React, { useMemo, useState } from 'react';
import { resolvePlayableVideoUrl, FALLBACK_VIDEO_URL, type ResolvedPlayableVideo } from '../../utils/videoPlayback';

export type GameId = 'cs2' | 'fc27' | 'warzone' | 'nba2k' | 'dota2';
export type LangCode = 'en' | 'fa';

export interface CoachTopicPack {
  id: string;
  label: string;
  headline: string;
  tips: string[];
  videoUrl: string;
  posterUrl: string;
  stagePreset: {
    mode: 'pitch' | 'court' | 'gun' | 'map' | 'moba';
    title: string;
    subtitle: string;
    markers: string[];
  };
}

export interface GameConfig {
  id: GameId;
  name: string;
  ratingLabel: string;
  ratingValue: number;
  statOneLabel: string;
  statOneValue: number;
  statTwoLabel: string;
  statTwoValue: number;
  accentColor: string;
  topics: CoachTopicPack[];
}

const GAME_CATALOG: Record<GameId, GameConfig> = {
  cs2: {
    id: 'cs2',
    name: 'CS2',
    ratingLabel: 'CS2 RATING',
    ratingValue: 88,
    statOneLabel: 'Trade Timing',
    statOneValue: 99,
    statTwoLabel: 'Utility IQ',
    statTwoValue: 86,
    accentColor: '#38bdf8',
    topics: [
      {
        id: 'crosshair-aim',
        label: 'Crosshair & aim',
        headline: 'Crosshair & aim — pre-aiming & counter-strafing',
        tips: [
          "Keep crosshair at head level while clearing angles so you don't rely on wide flicks.",
          'Tap the opposite movement key (counter-strafe) right before firing for first-bullet accuracy.',
          'Pre-aim common peeking lanes as you swing rather than adjusting after seeing the enemy.',
          'Commit to tight bursts or short sprays; reset position if a fight drags past 5 bullets.',
        ],
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        stagePreset: {
          mode: 'map',
          title: 'Mirage A-Site — Crosshair & Peek Lanes',
          subtitle: 'Head-level angles: Ramp, Jungle, Connector & Stairs',
          markers: ['Ramp Head-Level', 'Jungle Angle', 'Stairs Trade Line'],
        },
      },
      {
        id: 'smokes-utility',
        label: 'Smokes & utility',
        headline: 'Smokes & utility — clean site executes',
        tips: [
          'Pair one vision-denial smoke with a pop-flash before stepping into open sightlines.',
          'Save utility for post-plant or retake delays instead of throwing all nades in the first 10 seconds.',
        ],
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
        stagePreset: {
          mode: 'map',
          title: 'Inferno B-Site — Utility & Post-Plant',
          subtitle: 'CT Smoke, Coffins Molotov & Retake Crossfire',
          markers: ['CT Smoke', 'Coffins Fire', 'Banana Entry'],
        },
      },
    ],
  },
  fc27: {
    id: 'fc27',
    name: 'FC 27',
    ratingLabel: 'OVR',
    ratingValue: 88,
    statOneLabel: 'Attack Build-Up',
    statOneValue: 91,
    statTwoLabel: 'Press Discipline',
    statTwoValue: 84,
    accentColor: '#22c55e',
    topics: [
      {
        id: 'high-press',
        label: 'High press & roles',
        headline: '4-3-3 High Press — half-space spacing',
        tips: [
          'Pin opposing fullbacks with wide wingers while midfielders cover central passing lanes.',
          'Trigger second-man press only when the ball carrier faces away from goal.',
        ],
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
        stagePreset: {
          mode: 'pitch',
          title: '4-3-3 Vertical Press',
          subtitle: 'Half-space runs & compact mid-block rotation',
          markers: ['LW Width', '8 Half-Space Run', 'CDM Cover'],
        },
      },
    ],
  },
  warzone: {
    id: 'warzone',
    name: 'Warzone',
    ratingLabel: 'COMBAT IQ',
    ratingValue: 87,
    statOneLabel: 'Rotation Speed',
    statOneValue: 90,
    statTwoLabel: 'Recoil Control',
    statTwoValue: 85,
    accentColor: '#f59e0b',
    topics: [
      {
        id: 'loadout-rotation',
        label: 'Loadout & rotation',
        headline: 'Mid-range beam & early circle rotation',
        tips: [
          'Rotate to high ground before the zone pulls so you hold incoming teams instead of fighting uphill.',
          'Pair a low-recoil AR/LMG with a fast close-quarters SMG for building clears.',
        ],
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=1200&q=80',
        stagePreset: {
          mode: 'gun',
          title: 'Mid-Range AR — Recoil & ADS Balance',
          subtitle: 'Stabilized barrel, optic clarity & sprint-to-fire',
          markers: ['Muzzle Control', 'Optic Sightline', 'Underbarrel'],
        },
      },
    ],
  },
  nba2k: {
    id: 'nba2k',
    name: 'NBA 2K',
    ratingLabel: 'COURT IQ',
    ratingValue: 89,
    statOneLabel: 'Pick & Roll',
    statOneValue: 92,
    statTwoLabel: 'Spacing',
    statTwoValue: 86,
    accentColor: '#fb923c',
    topics: [
      {
        id: 'horns-spacing',
        label: 'Horns & spacing',
        headline: 'Horns set — short-roll reads & corner kick-outs',
        tips: [
          'Keep weak-side corners spaced wide so the roller has room on a 4-on-3 advantage.',
          'Read the low-man defender first: lob if they step up, kick to the corner if they drop.',
        ],
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
        stagePreset: {
          mode: 'court',
          title: 'Horns Rip & Short-Roll',
          subtitle: 'Elbow screen angle, paint dive & corner shooters',
          markers: ['Ball Handler', 'Elbow Screen', 'Corner Shooter'],
        },
      },
    ],
  },
  dota2: {
    id: 'dota2',
    name: 'Dota 2',
    ratingLabel: 'MACRO IQ',
    ratingValue: 88,
    statOneLabel: 'Lane Control',
    statOneValue: 87,
    statTwoLabel: 'Teamfight Timing',
    statTwoValue: 91,
    accentColor: '#c084fc',
    topics: [
      {
        id: 'lane-gank',
        label: 'Lane & objectives',
        headline: 'Wave equilibrium & objective timings',
        tips: [
          'Pull or aggro creeps to keep the wave near safe terrain before contesting runes or power spikes.',
          'Push side lanes right before major neutral or tower objectives spawn to force split reactions.',
        ],
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirts.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80',
        stagePreset: {
          mode: 'moba',
          title: '3-Lane Tempo & Objective Window',
          subtitle: 'Vision control, wave push & initiation timing',
          markers: ['Mid Tempo', 'River Vision', 'Objective Push'],
        },
      },
    ],
  },
};

export interface PetrosUnifiedCoachPageProps {
  initialGameId?: GameId;
  initialLang?: LangCode;
  analyzStageUrl?: string; // e.g. the Ai-petros-game-analyz build URL
  gamepadUrl?: string; // e.g. the Petros-gamepad build URL
  onBack?: () => void;
}

export const PetrosUnifiedCoachPage: React.FC<PetrosUnifiedCoachPageProps> = ({
  initialGameId = 'cs2',
  initialLang = 'en',
  analyzStageUrl,
  gamepadUrl,
  onBack,
}) => {
  const [gameId, setGameId] = useState<GameId>(initialGameId);
  const [lang, setLang] = useState<LangCode>(initialLang);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    GAME_CATALOG[initialGameId].topics[0].id
  );
  const [stageTab, setStageTab] = useState<'video' | 'tactical'>('video');
  const [promptText, setPromptText] = useState<string>('');
  const [customNote, setCustomNote] = useState<string | null>(null);
  const [playableVideo, setPlayableVideo] = useState<ResolvedPlayableVideo | null>(null);

  const activeGame = GAME_CATALOG[gameId];

  // Safe lock on the active game: if the topic doesn't belong to the current
  // game, the first topic of that game is selected instead.
  const activeTopic = useMemo(() => {
    const found = activeGame.topics.find((t) => t.id === selectedTopicId);
    return found ?? activeGame.topics[0];
  }, [activeGame, selectedTopicId]);

  // Resolve the active topic's video with the 8h-cached playable resolver —
  // a tap NEVER ends in a dead player: blocked/non-stream links fall back to
  // a known-good direct MP4 automatically.
  React.useEffect(() => {
    let cancelled = false;
    setPlayableVideo(null);
    resolvePlayableVideoUrl(gameId, activeTopic.videoUrl, activeTopic.posterUrl)
      .then((r) => {
        if (!cancelled) setPlayableVideo(r);
      })
      .catch(() => {
        if (!cancelled) {
          setPlayableVideo({ url: activeTopic.videoUrl, source: 'direct', resolvedAt: Date.now() });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, activeTopic.videoUrl, activeTopic.posterUrl]);

  // Absolute guard: no non-football game can ever take pitch mode or a
  // football formation.
  const safeStagePreset = useMemo(() => {
    const preset = activeTopic.stagePreset;
    if (gameId !== 'fc27' && preset.mode === 'pitch') {
      return {
        ...preset,
        mode: gameId === 'warzone' ? ('gun' as const) : ('map' as const),
        title: `${activeGame.name} — ${activeTopic.label}`,
      };
    }
    return preset;
  }, [gameId, activeGame.name, activeTopic]);

  const handleSelectGame = (nextGame: GameId) => {
    setGameId(nextGame);
    setSelectedTopicId(GAME_CATALOG[nextGame].topics[0].id);
    setCustomNote(null);
    setStageTab('video');
  };

  // Zero dead click: tapping any topic/tutorial card opens + plays video.
  const handleSelectTopic = (topicId: string) => {
    setSelectedTopicId(topicId);
    setCustomNote(null);
    setStageTab('video');
  };

  const handleAskCoach = (e: React.FormEvent) => {
    e.preventDefault();
    const q = promptText.trim();
    if (!q) return;
    setCustomNote(
      lang === 'en'
        ? `[${activeGame.name} · ${activeTopic.label}] Focused plan for "${q}": execute with clear spacing, timing discipline, and immediate post-action review.`
        : `[${activeGame.name} · ${activeTopic.label}] برنامه متمرکز برای «${q}»: اجرای دقیق با زمان‌بندی درست و بدون خروج از فضای بازی ${activeGame.name}.`
    );
    setPromptText('');
  };

  const stageFrameRef = React.useRef<HTMLIFrameElement | null>(null);
  // Push the safe stage preset into the analyz stage once it loads (fresh
  // key = gameId-topic destroys any previous stage state).
  React.useEffect(() => {
    if (stageTab !== 'tactical') return;
    const send = () => {
      try {
        stageFrameRef.current?.contentWindow?.postMessage(
          {
            type: 'RENDER_STAGE',
            payload: {
              prompt: `${activeGame.name}. ${safeStagePreset.title}. ${safeStagePreset.subtitle}`,
            },
          },
          '*'
        );
      } catch {
        /* ignore */
      }
    };
    send();
    const t = window.setTimeout(send, 700);
    return () => window.clearTimeout(t);
  }, [stageTab, gameId, activeTopic.id, activeGame.name, safeStagePreset.title, safeStagePreset.subtitle]);

  return (
    <div
      dir={lang === 'fa' ? 'rtl' : 'ltr'}
      data-testid="petros-unified-coach-page"
      className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col items-center px-3 py-4"
    >
      <div className="w-full max-w-md flex flex-col gap-4">
        {/* 1. Top bar: game picker + language */}
        <header className="flex items-center justify-between rounded-2xl bg-slate-900/90 border border-white/10 px-3 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(Object.keys(GAME_CATALOG) as GameId[]).map((id) => {
              const item = GAME_CATALOG[id];
              const isSelected = id === gameId;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectGame(id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/10 cursor-pointer"
              >
                {lang === 'en' ? 'Back' : 'بازگشت'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setLang((prev) => (prev === 'en' ? 'fa' : 'en'))}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/10 cursor-pointer"
            >
              {lang.toUpperCase()}
            </button>
          </div>
        </header>

        {/* 2. Coach card, topic chips and exact on-topic tips */}
        <section className="rounded-3xl bg-slate-900/85 border border-white/10 p-4 flex flex-col gap-3.5">
          <div>
            <h1 className="text-base font-bold text-white">
              {lang === 'en'
                ? `${activeGame.name} Pro Coach Session`
                : `جلسه مربیگری حرفه‌ای ${activeGame.name}`}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {activeGame.ratingLabel} {activeGame.ratingValue} · {activeGame.statOneLabel}{' '}
              {activeGame.statOneValue} · {activeGame.statTwoLabel} {activeGame.statTwoValue}
            </p>
          </div>

          {/* Topic chips — this game only */}
          <div className="flex flex-wrap gap-2">
            {activeGame.topics.map((topic) => {
              const active = topic.id === activeTopic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  data-testid={`coach-topic-${topic.id}`}
                  onClick={() => handleSelectTopic(topic.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                    active
                      ? 'bg-emerald-400 text-slate-950 font-semibold'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {topic.label}
                </button>
              );
            })}
          </div>

          {/* Direct coach question form */}
          <form onSubmit={handleAskCoach} className="flex gap-2">
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={
                lang === 'en'
                  ? `Ask ${activeGame.name} coach about ${activeTopic.label}...`
                  : `از مربی ${activeGame.name} درباره ${activeTopic.label} بپرس...`
              }
              className="flex-1 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-sky-500 text-slate-950 text-xs font-bold hover:bg-sky-400 transition cursor-pointer"
            >
              {lang === 'en' ? 'Ask' : 'بپرس'}
            </button>
          </form>

          {customNote && (
            <div className="rounded-2xl bg-sky-500/10 border border-sky-400/30 p-3 text-xs text-sky-200 leading-relaxed">
              {customNote}
            </div>
          )}

          {/* Headline + tips locked to the selected topic */}
          <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
            <div className="text-xs font-semibold text-sky-300">{activeTopic.headline}</div>
            <ul className="space-y-2 text-xs text-slate-200 leading-relaxed list-disc ps-4">
              {activeTopic.tips.map((tip, idx) => (
                <li key={`${activeGame.id}-${activeTopic.id}-${idx}`}>{tip}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3. Unified projector / analysis stage box (direct video + game-matched stage) */}
        <section
          key={`${gameId}-${activeTopic.id}`}
          className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">{safeStagePreset.title}</div>
              <div className="text-[11px] text-slate-400">{safeStagePreset.subtitle}</div>
            </div>

            <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setStageTab('video')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  stageTab === 'video'
                    ? 'bg-white text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {lang === 'en' ? 'Direct Video' : 'پخش فیلم'}
              </button>
              <button
                type="button"
                onClick={() => setStageTab('tactical')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  stageTab === 'tactical'
                    ? 'bg-white text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {lang === 'en' ? 'Stage' : 'استیج'}
              </button>
            </div>
          </div>

          {stageTab === 'video' ? (
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
              <video
                key={playableVideo?.url ?? activeTopic.videoUrl}
                data-testid="unified-coach-video"
                src={playableVideo?.url ?? activeTopic.videoUrl}
                poster={activeTopic.posterUrl}
                controls
                autoPlay
                playsInline
                preload="metadata"
                onError={() => {
                  // Even after resolution, if playback fails → force fallback stream.
                  setPlayableVideo((prev) =>
                    prev && prev.source === 'fallback' && prev.url === FALLBACK_VIDEO_URL
                      ? prev
                      : { url: FALLBACK_VIDEO_URL, source: 'fallback', resolvedAt: Date.now() }
                  );
                }}
                className="w-full h-full object-cover"
              />
            </div>
          ) : analyzStageUrl ? (
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
              <iframe
                ref={stageFrameRef}
                title="Petros Game Analyz Stage"
                key={`analyz-${gameId}-${activeTopic.id}`}
                src={`${analyzStageUrl}?transparent=1&autoplay=1`}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen"
              />
            </div>
          ) : (
            <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-slate-800/80 via-slate-900 to-black border border-white/10 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400">
                <span>GAME: {activeGame.name}</span>
                <span>MODE: {safeStagePreset.mode}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {safeStagePreset.markers.map((marker) => (
                  <span
                    key={marker}
                    className="px-2.5 py-1 rounded-full text-xs bg-white/10 text-slate-100 border border-white/10"
                  >
                    {marker}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 4. Gamepad layer (Petros-gamepad) below the stage */}
        <section className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">
              {lang === 'en'
                ? `${activeGame.name} Controller & Input Layer`
                : `لایه کنترلر و دکمه‌ها — ${activeGame.name}`}
            </span>
            <span className="text-[11px] text-slate-400">Petros-gamepad</span>
          </div>

          {gamepadUrl ? (
            <div className="w-full h-56 rounded-2xl overflow-hidden bg-black border border-white/10">
              <iframe
                title="Petros Gamepad"
                src={`${gamepadUrl}?gameId=${encodeURIComponent(gameId)}`}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="rounded-2xl bg-black/40 border border-white/10 p-3.5 text-xs text-slate-300 flex items-center justify-between">
              <span>
                {lang === 'en'
                  ? `Active profile synced for ${activeGame.name}`
                  : `پروفایل کنترلر برای ${activeGame.name} همگام شد`}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-mono">
                {gameId.toUpperCase()}
              </span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PetrosUnifiedCoachPage;
