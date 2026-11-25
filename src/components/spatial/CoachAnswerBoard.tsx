import React, { useEffect, useState } from 'react';
import { useAutoTranslateFa, isMostlyEnglish } from '../../utils/autoTranslate';
import { useLanguage } from '../../contexts/LanguageContext';
import { Crosshair, Package, MapPin, Coins, ListChecks, Users } from 'lucide-react';
import type { CoachAnswerBlock, PlayerAssignment } from '../../utils/coachSearchRules';

interface CoachAnswerBoardProps {
  answerBlock: CoachAnswerBlock;
  accentHex: string;
  gameId?: string;
  gameClipThumbnail?: string | null;
}

/** Player dot positions per formation (xPct, yPct from top). */
const FORMATION_LAYOUTS: Record<string, Array<{ x: number; y: number; role: 'gk' | 'def' | 'mid' | 'att' }>> = {
  '4-2-3-1': [
    { x: 50, y: 90, role: 'gk' },
    { x: 15, y: 70, role: 'def' }, { x: 37, y: 74, role: 'def' }, { x: 63, y: 74, role: 'def' }, { x: 85, y: 70, role: 'def' },
    { x: 36, y: 54, role: 'mid' }, { x: 64, y: 54, role: 'mid' },
    { x: 24, y: 36, role: 'att' }, { x: 50, y: 32, role: 'att' }, { x: 76, y: 36, role: 'att' },
    { x: 50, y: 13, role: 'att' },
  ],
  '4-3-3 (2)': [
    { x: 50, y: 90, role: 'gk' },
    { x: 15, y: 70, role: 'def' }, { x: 37, y: 74, role: 'def' }, { x: 63, y: 74, role: 'def' }, { x: 85, y: 70, role: 'def' },
    { x: 28, y: 54, role: 'mid' }, { x: 50, y: 60, role: 'mid' }, { x: 72, y: 54, role: 'mid' },
    { x: 15, y: 28, role: 'att' }, { x: 50, y: 14, role: 'att' }, { x: 85, y: 28, role: 'att' },
  ],
  '4-2-1-3': [
    { x: 50, y: 90, role: 'gk' },
    { x: 15, y: 70, role: 'def' }, { x: 37, y: 74, role: 'def' }, { x: 63, y: 74, role: 'def' }, { x: 85, y: 70, role: 'def' },
    { x: 38, y: 58, role: 'mid' }, { x: 62, y: 58, role: 'mid' },
    { x: 50, y: 42, role: 'att' },
    { x: 14, y: 24, role: 'att' }, { x: 50, y: 12, role: 'att' }, { x: 86, y: 24, role: 'att' },
  ],
  '3-5-2': [
    { x: 50, y: 90, role: 'gk' },
    { x: 30, y: 72, role: 'def' }, { x: 50, y: 76, role: 'def' }, { x: 70, y: 72, role: 'def' },
    { x: 10, y: 52, role: 'mid' }, { x: 30, y: 50, role: 'mid' }, { x: 50, y: 56, role: 'mid' }, { x: 70, y: 50, role: 'mid' }, { x: 90, y: 52, role: 'mid' },
    { x: 40, y: 18, role: 'att' }, { x: 60, y: 18, role: 'att' },
  ],
};

/** Real player photos from Wikipedia — keyless, cached in-memory per name. */
const PHOTO_CACHE = new Map<string, string | null>();
async function fetchPlayerPhoto(name: string): Promise<string | null> {
  if (PHOTO_CACHE.has(name)) return PHOTO_CACHE.get(name) ?? null;
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 3500);
    const res = await fetch(`/api/ai/player-photo?name=${encodeURIComponent(name)}`, { signal: ctl.signal });
    clearTimeout(timer);
    const url = res.ok ? ((await res.json())?.photo ?? null) : null;
    PHOTO_CACHE.set(name, url);
    return url;
  } catch {
    PHOTO_CACHE.set(name, null);
    return null;
  }
}

const PlayerDot: React.FC<{
  dot: { x: number; y: number; role: 'gk' | 'def' | 'mid' | 'att' };
  assignment: PlayerAssignment | undefined;
  selected: boolean;
  accentHex: string;
  onSelect: () => void;
}> = ({ dot, assignment, selected, accentHex, onSelect }) => {
  const style = ROLE_STYLE[dot.role] ?? ROLE_STYLE.mid;
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (assignment?.playerName) {
      fetchPlayerPhoto(assignment.playerName).then((p) => {
        if (!cancelled) setPhoto(p);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [assignment?.playerName]);
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`player-slot-${assignment?.slot ?? dot.role}-${assignment?.playerName ?? 'x'}`}
      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition ${selected ? 'z-20' : 'z-10'}`}
      style={{ left: `${dot.x}%`, top: `${dot.y}%`, width: '16%' }}
    >
      <span
        className={`relative w-full aspect-square rounded-full border-2 flex items-center justify-center overflow-hidden shadow-lg ${selected ? 'scale-110' : ''}`}
        style={{
          backgroundColor: selected ? accentHex : style.bg,
          borderColor: selected ? '#FFFFFF' : 'rgba(0,0,0,0.45)',
        }}
      >
        {photo ? (
          <img src={photo} alt={assignment?.playerName ?? style.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="font-mono-tabular text-[8px] font-black" style={{ color: '#05070B' }}>{style.label || (assignment?.slot ?? '')}</span>
        )}
      </span>
      {assignment && (
        <span dir="ltr" className="mt-0.5 w-full truncate text-center text-[8px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {assignment.playerName}
        </span>
      )}
    </button>
  );
};

const ROLE_STYLE: Record<string, { bg: string; label: string }> = {
  gk: { bg: '#F5C542', label: 'GK' },
  def: { bg: '#38BDF8', label: '' },
  mid: { bg: '#34D399', label: '' },
  att: { bg: '#EF4444', label: '' },
};

const INTENT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  formation: Users,
  loadout: Crosshair,
  item: Package,
  map: MapPin,
  economy: Coins,
  tactic: ListChecks,
};

/** Pick a formation layout from the answer text (falls back to first option). */
function resolveFormationFromText(lines: string[], options: string[]): { key: string; layout: Array<{ x: number; y: number; role: string }> } {
  const candidates = options.filter((o) => FORMATION_LAYOUTS[o]);
  const key = candidates[0] ?? '4-2-3-1';
  const found = lines
    .map((l) => candidates.find((o) => l.includes(o)))
    .find(Boolean);
  const chosen = found ?? key;
  return { key: chosen, layout: FORMATION_LAYOUTS[chosen] ?? FORMATION_LAYOUTS['4-2-3-1'] };
}

/** Per-game pitch identity — every game its own surface, colors and look. */
const PITCH_THEME_BY_GAME: Record<string, { bg: string; line: string; label: string }> = {
  fc27: { bg: 'repeating-linear-gradient(90deg, #0e5c2f 0px, #0e5c2f 34px, #0f6433 34px, #0f6433 68px)', line: 'rgba(255,255,255,0.25)', label: 'FC 27' },
  efootball: { bg: 'repeating-linear-gradient(90deg, #123a2c 0px, #123a2c 34px, #144434 34px, #144434 68px)', line: 'rgba(160,255,220,0.3)', label: 'eFootball' },
  nba: { bg: 'linear-gradient(180deg, #8a5a2b 0%, #a06a33 45%, #8a5a2b 100%)', line: 'rgba(255,255,255,0.35)', label: 'NBA' },
  baseball: { bg: 'radial-gradient(circle at 50% 85%, #7a9d4e 0%, #6c8f44 55%, #55743a 100%)', line: 'rgba(255,255,255,0.35)', label: 'Baseball' },
};

export const CoachAnswerBoard: React.FC<CoachAnswerBoardProps> = ({ answerBlock, accentHex, gameId, gameClipThumbnail }) => {
  const [selectedFormation, setSelectedFormation] = useState<string | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const boardRef = React.useRef<HTMLDivElement | null>(null);
  const Icon = INTENT_ICON[answerBlock.intent] ?? ListChecks;
  const isFaLines = answerBlock.linesFa?.length > 0;
  const { languageCode: boardLang } = useLanguage();
  const wantsFa = boardLang === 'fa' || boardLang.startsWith('fa');
  // Always follow the APP language — never auto-pick Persian (user bug report).
  const lines = wantsFa ? answerBlock.linesFa : (answerBlock.linesEn?.length ? answerBlock.linesEn : answerBlock.linesFa);

  const formationState =
    answerBlock.intent === 'formation'
      ? resolveFormationFromText(lines, answerBlock.options ?? [])
      : null;
  const activeFormation = selectedFormation ?? formationState?.key ?? null;
  const formationDots = activeFormation ? FORMATION_LAYOUTS[activeFormation] : null;

  return (
    <div
      ref={boardRef}
      data-testid="coach-answer-board"
      className="hud-motion-card is-playing flex flex-col gap-2.5"
    >
      {/* خط اسکن لیزری — مرحله اول نمایش */}
      <div className="laser-scanner" aria-hidden="true" />
      <div className="hud-header">
        <span className="live-badge">
          <span className="pulse-dot" aria-hidden="true" />
          AnswerBoardAgent
        </span>
        <button
          type="button"
          data-testid="hud-replay-btn"
          className="hud-replay"
          onClick={() => {
            const el = boardRef.current;
            if (!el) return;
            el.classList.remove('is-playing');
            void el.offsetWidth; // force reflow so the choreography restarts
            el.classList.add('is-playing');
          }}
          title={isFaLines ? 'اجرای دوباره انیمیشن' : 'Replay motion'}
        >
          ↻ {isFaLines ? 'بازپخش موشن' : 'Replay'}
        </button>
      </div>
      <h3 className="kinetic-title" style={{ fontSize: 16, margin: 0 }}>
        {boardLang?.startsWith('fa') ? answerBlock.titleFa : (answerBlock.titleEn || answerBlock.titleFa)}
      </h3>

      {/* Formation pitch */}
      {answerBlock.intent === 'formation' && formationDots && (
        <div className="flex flex-col gap-2">
          <div
            data-testid="formation-pitch"
            className="relative w-full rounded-lg overflow-hidden border border-white/15"
            style={{
              aspectRatio: '16 / 10',
              background: PITCH_THEME_BY_GAME[gameId ?? 'fc27']?.bg ?? PITCH_THEME_BY_GAME.fc27.bg,
            }}
          >
            {gameClipThumbnail && (
              <img
                src={gameClipThumbnail}
                alt="گیم‌پلی واقعی همین بازی"
                referrerPolicy="no-referrer"
                data-testid="pitch-real-gameplay-bg"
                className="absolute inset-0 w-full h-full object-cover opacity-35"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,7,11,0.55), rgba(5,7,11,0.25))' }} />
            {/* halfway line + center circle + boxes */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-white/25" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[22%] aspect-square rounded-full border border-white/25" />
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[36%] h-[13%] border border-white/25 border-b-0 rounded-t-sm" />
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[36%] h-[13%] border border-white/25 border-t-0 rounded-b-sm" />
            {formationDots.map((dot, i) => {
              const assignments = answerBlock.playerAssignments ?? {};
              const assignment = (assignments[activeFormation ?? ''] ?? Object.values(assignments)[0])?.[i];
              return (
                <PlayerDot
                  key={i}
                  dot={dot}
                  assignment={assignment}
                  selected={selectedSlotIndex === i}
                  accentHex={accentHex}
                  onSelect={() => setSelectedSlotIndex(selectedSlotIndex === i ? null : i)}
                />
              );
            })}
          </div>
          {(() => {
            const assignments = answerBlock.playerAssignments ?? {};
            const list = assignments[activeFormation ?? ''] ?? Object.values(assignments)[0];
            const sel = selectedSlotIndex !== null ? list?.[selectedSlotIndex] : null;
            if (!sel) {
              return list ? (
                <p className="text-[11px] font-bold text-white/60 text-center">روی هر بازیکن کلیک کن تا نقش و دستور دقیقش رو ببینی</p>
              ) : null;
            }
            return (
              <div data-testid="player-slot-detail" className="px-2.5 py-2 rounded-lg bg-white/5 border border-white/10">
                <p className="text-[12px] font-black text-white">
                  <span dir="ltr" className="font-mono-tabular">{sel.slot}</span>
                  {' — '}
                  <span dir="ltr">{sel.playerName}</span>
                  <span className="text-white/50"> ({sel.roleFa})</span>
                </p>
                <p className="text-[11.5px] font-bold" style={{ color: accentHex }}>▸ {sel.noteFa}</p>
              </div>
            );
          })()}
          {answerBlock.options && answerBlock.options.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {answerBlock.options.map((opt) => {
                const active = opt === activeFormation;
                const known = Boolean(FORMATION_LAYOUTS[opt]);
                return (
                  <button
                    key={opt}
                    type="button"
                    data-testid={`formation-chip-${opt.replace(/[^0-9a-z-]/gi, '')}`}
                    onClick={() => known && setSelectedFormation(opt)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-black transition cursor-pointer border"
                    style={{
                      backgroundColor: active ? accentHex : 'rgba(255,255,255,0.08)',
                      color: active ? '#05070B' : '#FFFFFF',
                      borderColor: active ? accentHex : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {opt}
                    {known ? '' : ' ℹ'}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Map board */}
      {answerBlock.intent === 'map' && (
        <div
          data-testid="answer-map-board"
          className="relative w-full rounded-lg overflow-hidden border border-white/15"
          style={{ aspectRatio: '16 / 9', background: 'linear-gradient(135deg, #101b26, #0a1118)' }}
        >
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '16.6% 25%' }} />
          <div className="absolute left-[18%] top-[38%] w-[18%] aspect-square rounded-full border-2 border-[#EF4444]/70 bg-[#EF4444]/10 flex items-center justify-center">
            <span className="font-mono-tabular text-[9px] font-black text-[#EF4444]">DANGER</span>
          </div>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 56" preserveAspectRatio="none">
            <path d="M 42 38 L 62 24 L 84 18" stroke={accentHex} strokeWidth="1.6" fill="none" markerEnd="none" />
            <polygon points="84,18 78,16.4 80.4,21.4" fill={accentHex} />
          </svg>
          <div className="absolute right-[8%] top-[18%] w-[7%] aspect-square rounded-full border-2 border-[#10B981] bg-[#10B981]/20 flex items-center justify-center">
            <span className="font-mono-tabular text-[9px] font-black text-[#10B981]">GOAL</span>
          </div>
        </div>
      )}

      {/* Loadout slots */}
      {answerBlock.intent === 'loadout' && (
        <div data-testid="answer-loadout-board" className="tips-stack">
          {lines.map((line, i) => (
            <AutoTipLine key={i} index={i} line={line} wantsFa={wantsFa} labelFa="" labelEn="" numbered />
          ))}
        </div>
      )}

      {/* Generic structured lines (item / economy / tactic / fallback) */}
      {answerBlock.intent !== 'formation' && answerBlock.intent !== 'map' && answerBlock.intent !== 'loadout' && (
        <div className="tips-stack">
          {lines.map((line, i) => (
            <AutoTipLine key={i} index={i} line={line} wantsFa={wantsFa} labelFa={`نکته ${i + 1}`} labelEn={`Tip ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
};


const AutoTipLine: React.FC<{
  index: number;
  line: string;
  wantsFa: boolean;
  labelFa: string;
  labelEn: string;
  numbered?: boolean;
}> = ({ index, line, wantsFa, labelFa, labelEn, numbered }) => {
  const translated = useAutoTranslateFa(line, wantsFa && isMostlyEnglish(line));
  return (
    <div className="tip-module" style={{ cursor: 'default' }}>
      <div className="tip-title">
        <span className="tip-dot" aria-hidden="true" />
        {numbered ? (
          <span dir="ltr" className="font-mono-tabular">{index + 1}</span>
        ) : (
          <span>{wantsFa ? labelFa : labelEn}</span>
        )}
      </div>
      <p className="tip-desc">{translated}</p>
    </div>
  );
};
