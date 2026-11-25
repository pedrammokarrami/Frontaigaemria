import React, { useEffect, useState } from 'react';
import { useAutoTranslateFa, isMostlyEnglish } from '../../utils/autoTranslate';
import { Globe, ExternalLink, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { LobbyGameId } from '../../utils/lobbySkillCatalog';
import { CoachYouTubeEmbed, findYoutubeSourceId } from './CoachYouTubeEmbed';

interface LiveWebAnswerProps {
  gameId: LobbyGameId;
  searchQuery: string;
}

const GAME_REALM: Record<string, string> = {
  fc27: 'sports',
  efootball: 'sports',
  nba2k: 'sports',
  mlb: 'sports',
  'f1-25': 'sports',
  cs2: 'shooter',
  valorant: 'shooter',
  cod: 'shooter',
  'apex-legends': 'shooter',
  'rocket-league': 'sports',
  gta: 'story',
  'cyberpunk-2077': 'story',
  'baldur-s-gate-3': 'story',
  'elden-ring': 'strategy',
  dota2: 'strategy',
  'league-of-legends': 'strategy',
  minecraft: 'strategy',
  roblox: 'story',
  fortnite: 'shooter',
  genshin: 'story',
};

interface GameChoice {
  gameId: string;
  labelFa: string;
  labelEn?: string;
  icon: string;
  reason: string;
}

interface CoachTopic {
  titleFa: string;
  titleEn?: string;
  coachAdviceFa: string;
  coachVoiceEn: string;
  answerBlock?: {
    intent: string;
    titleFa: string;
    titleEn: string;
    linesFa: string[];
    linesEn: string[];
    options?: string[];
  };
  adkIntel?: {
    liveSources?: Array<{ title: string; url: string; source: string }>;
  };
}

/**
 * Live-web fallback: when the local skill catalog has no match, the coach
 * fan-outs to Wikipedia/Reddit/HN/Steam through /api/coach/search and shows
 * real online sources — the user never hits a dead end.
 */
export const LiveWebAnswer: React.FC<LiveWebAnswerProps> = ({ gameId, searchQuery }) => {
  const { languageCode, isRtl } = useLanguage();
  const isFa = languageCode === 'fa' || languageCode.startsWith('fa') || languageCode === 'prs';
  const [topic, setTopic] = useState<CoachTopic | null>(null);
  const coachNoteRaw = topic ? (isFa ? topic.coachAdviceFa : topic.coachVoiceEn || topic.coachAdviceFa) : '';
  const coachNoteText = useAutoTranslateFa(coachNoteRaw, isFa && isMostlyEnglish(coachNoteRaw));
  const [gameChoices, setGameChoices] = useState<GameChoice[] | null>(null);
  const [forcedGameId, setForcedGameId] = useState<string | null>(null);
  const [choicesDismissed, setChoicesDismissed] = useState(false);
  const [replayTick, setReplayTick] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForcedGameId(null);
    setChoicesDismissed(false);
  }, [searchQuery]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 3) {
      setTopic(null);
      setGameChoices(null);
      return;
    }
    const activeGameId = forcedGameId ?? gameId;
    let cancelled = false;
    setLoading(true);
    setTopic(null);
    fetch(`/api/coach/search?realm=${GAME_REALM[activeGameId as LobbyGameId] ?? 'shooter'}&gameId=${encodeURIComponent(activeGameId)}&q=${encodeURIComponent(query)}&_t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
      .then((body) => {
        if (cancelled) return;
        if (body?.topic) setTopic(body.topic as CoachTopic);
        const choices = body?.gameChoices as { ambiguous: boolean; candidates: GameChoice[] } | undefined;
        setGameChoices(choices?.ambiguous && !choicesDismissed ? (choices.candidates ?? null) : null);
      })
      .catch(() => {
        /* offline — card just stays hidden */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, forcedGameId, searchQuery, choicesDismissed]);

  const sources = topic?.adkIntel?.liveSources ?? [];
  // Official YouTube playback (user-approved 2026-11): official nocookie IFrame
  // instead of any stream proxying.
  const ytSource = findYoutubeSourceId(sources);

  // Remount the phase-choreography on every NEW answer: key by topic id/query.
  // (CSS animations only fire when the element is (re)mounted — a reused node
  // that keeps the .is-playing class stays frozen at opacity 0 in some browsers.)
  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      data-testid="live-web-answer"
      key={`${searchQuery}|${forcedGameId}|${topic ? 'loaded' : 'pending'}|r${replayTick}`}
      className="hud-motion-card is-playing w-full flex flex-col gap-2.5 text-start"
    >
      {/* خط اسکن لیزری — مرحله اول نمایش */}
      <div className="laser-scanner" aria-hidden="true" />
      <div className="hud-header">
        <span className="live-badge">
          <span className="pulse-dot" aria-hidden="true" />
          {isFa ? 'پاسخ زنده از وب' : 'Live web answer'}
        </span>
        <button
          type="button"
          data-testid="hud-replay-btn"
          className="hud-replay"
          onClick={() => setReplayTick((t) => t + 1)}
          title={isFa ? 'اجرای دوباره انیمیشن' : 'Replay motion'}
        >
          ↻ {isFa ? 'بازپخش موشن' : 'Replay'}
        </button>
      </div>

      {!loading && gameChoices && (
        <div data-testid="game-choice-bar" className="flex flex-col gap-1.5">
          <span className="text-[12px] font-black text-amber-200">
            {isFa ? '🤔 این سوال برای چند بازی معنی‌داره — کدوم رو می‌خوای؟' : 'This question fits several games — pick one:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {gameChoices.map((c) => (
              <button
                key={c.gameId}
                data-testid={`game-choice-${c.gameId}`}
                onClick={() => { setChoicesDismissed(true); setForcedGameId(c.gameId); }}
                className="px-2.5 py-1 rounded-full bg-sky-500/20 border border-sky-300/40 text-[12px] font-bold text-sky-100 hover:bg-sky-500/40 active:scale-95 transition"
              >
                {c.icon} {isFa ? c.labelFa : (c.labelEn || c.labelFa)}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-[12.5px] text-white/70">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {isFa ? 'ایجنت‌ها در حال جستجوی آنلاین…' : 'Agents searching the live web…'}
        </div>
      )}

      {!loading && topic && (
        <>
          <h3 className="kinetic-title" style={{ fontSize: 15.5, margin: 0 }}>{isFa ? topic.titleFa : (topic.titleEn || topic.titleFa)}</h3>
          {topic.answerBlock && (
            <div className="rounded-xl border border-sky-400/25 bg-sky-950/40 p-2.5 flex flex-col gap-1.5">
              <span className="text-[12px] font-black text-sky-200">{isFa ? topic.answerBlock.titleFa : (topic.answerBlock.titleEn || topic.answerBlock.titleFa)}</span>
              {topic.answerBlock.options && topic.answerBlock.options.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {topic.answerBlock.options.map((opt) => (
                    <span
                      key={opt}
                      dir="ltr"
                      className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-300/40 text-[11px] font-bold text-sky-100"
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              )}
              {(isFa ? topic.answerBlock.linesFa : topic.answerBlock.linesEn).map((line, i) => (
                <p key={i} className="text-[12.5px] text-white/80 leading-relaxed flex items-start gap-1.5">
                  <span className="text-sky-300 shrink-0">▸</span>
                  <span>{line}</span>
                </p>
              ))}
            </div>
          )}
          <div className="tips-stack">
            <div className="tip-module" style={{ cursor: 'default' }}>
              <div className="tip-title">
                <span className="tip-dot" aria-hidden="true" />
                {isFa ? 'نکته مربی' : 'Coach note'}
              </div>
              <p className="tip-desc whitespace-pre-line">
                {coachNoteText}
              </p>
            </div>
          </div>
          {ytSource && (
            <CoachYouTubeEmbed videoId={ytSource.videoId} title={ytSource.title} />
          )}
          {sources.length > 0 && (
            <div className="sources-row" data-testid="live-sources-row">
              {sources.slice(0, 6).map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="source-chip"
                >
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                  <span className="src-tag">{s.source}:</span>
                  <span className="min-w-0 truncate">{s.title}</span>
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
