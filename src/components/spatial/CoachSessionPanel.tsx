import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { GraduationCap, Play, RefreshCw, Send, Search } from 'lucide-react';
import { toPersianDigits } from '../../services/liveMetaSyncService';
import { QuestionSuggestions } from './QuestionSuggestions';
import { GameChoiceBar } from './GameChoiceBar';
import { HudStatGauges } from './HudStatGauges';
import type { CoachSession, CoachSessionModule } from '../../agents/coachSession';
import type { LobbyGameId } from '../../utils/lobbySkillCatalog';

interface CoachSessionPanelProps {
  gameId: string;
  gameName: string;
  realm: string;
  problemQuery: string;
  accentHex: string;
  onSubmitQuestion: (question: string) => void;
}

type SessionData = { session: CoachSession };

/** Short labels appended to the question so the backend resolves the game unambiguously. */
const GAME_LABEL: Record<string, string> = {
  fc27: 'FC 27',
  efootball: 'eFootball',
  nba2k: 'NBA 2K',
  mlb: 'MLB',
  cs2: 'CS2',
  valorant: 'Valorant',
  cod: 'Call of Duty',
  'apex-legends': 'Apex Legends',
  'f1-25': 'F1 25',
  gta: 'GTA',
  dota2: 'Dota 2',
  'elden-ring': 'Elden Ring',
  minecraft: 'Minecraft',
  roblox: 'Roblox',
  fortnite: 'Fortnite',
  genshin: 'Genshin Impact',
  'baldur-s-gate-3': 'Baldurs Gate 3',
  'cyberpunk-2077': 'Cyberpunk 2077',
  'rocket-league': 'Rocket League',
  'league-of-legends': 'League of Legends',
};

export const CoachSessionPanel: React.FC<CoachSessionPanelProps> = ({
  gameId,
  gameName,
  realm,
  problemQuery,
  accentHex,
  onSubmitQuestion,
}) => {
  const { languageCode: sessionLang } = useLanguage();
  const wantsFa = (sessionLang || 'fa').startsWith('fa');
  const [session, setSession] = useState<CoachSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModuleId, setActiveModuleId] = useState('finishing');
  const [chipQuery, setChipQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);

  // Topic-lock: clicking a chip re-queries the session with THAT topic so the
  // backend returns strictly on-topic tips + clips for the active module.
  const moduleTopicQuery = (moduleId: string): string => {
    switch (moduleId) {
      case 'finishing': return realm === 'sports' ? 'finishing shooting timing' : 'crosshair aim';
      case 'formation': return realm === 'sports' ? 'best formation roles' : 'best tactics roles';
      case 'player-updates': return 'meta update patch';
      case 'mistakes': return 'mistake review';
      case 'training': return 'training drills';
      default: return '';
    }
  };

  const requestKey = `${gameId}|${realm}|${problemQuery}|${chipQuery}`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPlayingClipId(null);
    const params = new URLSearchParams({ gameId, realm, name: gameName, q: chipQuery || problemQuery });
    // Coach session language follows the app UI language (English UI → English coach page)
    if (sessionLang) params.set('lang', sessionLang.slice(0, 2));
    fetch(`/api/ai/coach-session?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
      .then((body: SessionData) => {
        if (!cancelled && body?.session) {
          setSession(body.session);
          // Keep the selected chip selected across refetches (topic change/game
          // switch), only falling back to the first module when it's gone.
          setActiveModuleId((prev) => body.session!.modules.some((m) => m.id === prev) ? prev : body.session!.modules[0]?.id ?? '');
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey, gameId, realm, gameName, problemQuery, chipQuery]);

  const activeModule: CoachSessionModule | undefined = useMemo(
    () => session?.modules.find((m) => m.id === activeModuleId) ?? session?.modules[0],
    [session, activeModuleId]
  );
  // App language is the source of truth (session language can lag one render).
  const isFa = wantsFa;

  return (
    <section
      data-testid="coach-session-panel"
      aria-label="Professional coach class"
      className="rounded-3xl bg-[#070B14]/85 backdrop-blur-xl border border-white/12 shadow-[0_18px_50px_rgba(2,6,23,0.5)] p-3 flex flex-col gap-2.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: accentHex }}
          >
            <GraduationCap className="w-4 h-4 text-[#05070B]" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-black text-white truncate">
              {isFa ? 'کلاس حرفه‌ای مربی — یک سوال، یک جلسه کامل' : 'Pro coach class — one question, one full session'}
            </p>
            {session && (
              <p dir="ltr" className="text-[10px] font-mono-tabular font-bold text-white/55 text-left">
                {/* Game-strict: OVR is football vocabulary — every other game is
                    labeled by its own id (CS2 RATING 88 …), never "OVR". */}
                {session.realm === 'sports' ? 'OVR' : `${session.gameId.toUpperCase()} RATING`} {session.telemetry.ovr} · {session.telemetry.strongest.name} {session.telemetry.strongest.val} · {session.telemetry.weakest.name} {session.telemetry.weakest.val}
                {session.telemetry.lastMatch ? ` · ${session.telemetry.lastMatch.score} ${session.telemetry.lastMatch.opponent}` : ''}
              </p>
            )}
            {session && (
              <div className="hud-stats-inline">
                <HudStatGauges
                  dataTestId="session-header-stats"
                  stats={[
                    { label: session.realm === 'sports' ? (isFa ? 'امتیاز کل' : 'OVR') : `${session.gameId.toUpperCase()} RATING`, value: session.telemetry.ovr, max: 100 },
                    { label: session.telemetry.strongest.name, value: session.telemetry.strongest.val, max: 100 },
                    { label: session.telemetry.weakest.name, value: session.telemetry.weakest.val, max: 100 },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
          {loading ? (
            <div className="flex items-center gap-2 text-[12px] font-bold" style={{ color: accentHex }}>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              {isFa ? 'در حال ساخت جلسه کامل (تا ۲۰ ثانیه)…' : 'Building your full class (up to 20s)…'}
            </div>
          ) : (
            <RefreshCw className="w-4 h-4 text-white/60 shrink-0" />
          )}
      </div>

      {/* Free question box — no limits on what can be asked */}
      <form
        data-testid="coach-session-question-form"
        onSubmit={(e) => {
          e.preventDefault();
          const q = draft.trim();
          if (q.length >= 3) {
            onSubmitQuestion(q);
            setDraft('');
          }
        }}
        className="flex items-center gap-1.5"
      >
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 right-3 text-white/40 pointer-events-none" />
          <input
            data-testid="coach-session-question-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={isFa ? 'هر سوالی داری بپرس: شوت، ترکیب، بازیکن، اشتباهات، تمرین…' : 'Ask anything: shooting, formation, players, mistakes, training…'}
            dir="rtl"
            className="w-full h-10 rounded-full bg-slate-950/70 border border-white/15 focus:border-emerald-300/70 pl-4 pr-9 text-[12.5px] font-bold text-white placeholder:text-white/35 outline-none transition"
          />
        </div>
        <button
          type="submit"
          data-testid="coach-session-question-submit"
          aria-label={isFa ? 'ساختن جلسه جدید' : 'Build new session'}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer"
          style={{ backgroundColor: accentHex, color: '#05070B' }}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Ambiguous question → the user picks the game explicitly (never guessed) */}
      <GameChoiceBar
        query={draft}
        onSelect={(gid) => {
          const label = GAME_LABEL[gid] ?? gid;
          onSubmitQuestion(`${draft.trim()} ${label}`);
          setDraft('');
        }}
      />

      {/* Live suggested questions — appear while typing, clickable to run instantly */}
      <QuestionSuggestions
        gameId={gameId as LobbyGameId}
        query={draft}
        accentHex={accentHex}
        onSelectQuestion={(q) => {
          onSubmitQuestion(q);
          setDraft('');
        }}
        limit={8}
      />

      {/* Module tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {(session?.modules ?? []).map((m) => {
          const active = m.id === activeModuleId;
          return (
            <button
              key={m.id}
              type="button"
              data-testid={`session-module-tab-${m.id}`}
              onClick={() => {
                setActiveModuleId(m.id);
                setPlayingClipId(null);
                setChipQuery(moduleTopicQuery(m.id));
              }}
              className="px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap transition cursor-pointer border"
              style={{
                backgroundColor: active ? accentHex : 'rgba(255,255,255,0.06)',
                color: active ? '#05070B' : '#FFFFFF',
                borderColor: active ? accentHex : 'rgba(255,255,255,0.15)',
              }}
            >
              {(isFa ? m.titleFa : m.titleEn).split('—')[0].trim()}
            </button>
          );
        })}
      </div>

      {/* Active module content */}
      {activeModule && (
        <div data-testid={`session-module-${activeModule.id}`} className="flex flex-col gap-2">
          <p className="text-[12.5px] font-black" style={{ color: accentHex }}>
            {isFa ? activeModule.titleFa : activeModule.titleEn}
          </p>

          {activeModule.stats.length > 0 && (
            <HudStatGauges
              dataTestId={`session-stats-${activeModule.id}`}
              stats={activeModule.stats.map((st) => ({ label: isFa ? st.labelFa : st.labelEn, value: st.value, max: st.max }))}
            />
          )}

          <div className="flex flex-col gap-1.5">
            {(isFa ? activeModule.linesFa : activeModule.linesEn).map((line, i) => (
              <p key={i} className="text-[12.5px] text-white/85 font-bold leading-relaxed flex items-start gap-1.5">
                <span style={{ color: accentHex }} className="shrink-0">
                  ▸
                </span>
                <span>{line}</span>
              </p>
            ))}
          </div>

          {/* Per-module on-topic clips */}
          {activeModule.clips.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[11px] font-black text-white/60">
                {isFa ? `فیلم‌های آموزشی این بخش (${toPersianDigits(String(activeModule.clips.length))}):` : `Section tutorials (${activeModule.clips.length}):`}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {activeModule.clips.map((clip) => (
                  <div key={clip.id} className="flex flex-col gap-1">
                    {playingClipId === clip.id ? (
                      <div className="rounded-lg overflow-hidden border border-white/15 aspect-video bg-black">
                        <iframe
                          src={`https://www.youtube.com/embed/${clip.youtubeId}?autoplay=1&rel=0`}
                          title={clip.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-testid={`session-clip-${clip.id}`}
                        onClick={() => setPlayingClipId(clip.id)}
                        className="relative rounded-lg overflow-hidden border border-white/15 aspect-video bg-slate-900 group cursor-pointer"
                      >
                        <img
                          src={clip.thumbnailUrl}
                          alt={clip.title}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition">
                          <Play className="w-5 h-5 fill-white text-white drop-shadow" />
                        </span>
                      </button>
                    )}
                    <p className="text-[10px] font-bold text-white/70 leading-snug line-clamp-2">{clip.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live sources for the update module */}
          {activeModule.sources.length > 0 && (
            <div className="flex flex-col gap-1">
              {activeModule.sources.slice(0, 3).map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-[11px] font-bold text-emerald-200/90 hover:text-emerald-100 truncate"
                >
                  <span className="text-white/50">[{s.source}]</span> {s.title}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && !session && (
        <p className="text-[12px] font-bold text-white/60 text-center py-4">
          {isFa ? 'مربی در حال ساختن کلاس کامل توست…' : 'Coach is building your full class…'}
        </p>
      )}
    </section>
  );
};
