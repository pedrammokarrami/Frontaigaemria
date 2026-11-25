import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface GameChoiceOption {
  gameId: string;
  labelFa: string;
  labelEn?: string;
  icon: string;
}

interface GameChoiceBarProps {
  query: string;
  onSelect: (gameId: string) => void;
  /** label override; defaults to a Persian prompt */
  promptFa?: string;
  className?: string;
}

/**
 * Renders clickable game options whenever a question is meaningful for more
 * than one game («بهترین ترکیب بارسا» → FC 27 / eFootball). Nothing is guessed:
 * the user always picks the game explicitly.
 */
export const GameChoiceBar: React.FC<GameChoiceBarProps> = ({ query, onSelect, promptFa, className }) => {
  const { languageCode } = useLanguage();
  const isFa = languageCode === 'fa' || languageCode.startsWith('fa') || languageCode === 'prs';
  const [options, setOptions] = useState<GameChoiceOption[] | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setOptions(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/ai/game-choices?q=${encodeURIComponent(q)}&_t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled) return;
        const cands = body?.candidates as GameChoiceOption[] | undefined;
        setOptions(body?.ambiguous && cands && cands.length >= 2 ? cands : null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [query]);

  if (!options) return null;

  return (
    <div
      data-testid="game-choice-bar"
      className={className ?? 'w-full flex flex-col gap-1.5 rounded-2xl border border-amber-300/30 bg-amber-950/30 px-3 py-2'}
    >
      <span className="text-[12px] font-black text-amber-100">
        {promptFa ?? (isFa ? '🤔 این سوال برای چند بازی معنی‌داره — کدوم رو می‌خوای؟' : 'Which game do you mean?')}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((c) => (
          <button
            key={c.gameId}
            type="button"
            data-testid={`game-choice-${c.gameId}`}
            onClick={() => onSelect(c.gameId)}
            className="px-2.5 py-1 rounded-full bg-sky-500/20 border border-sky-300/40 text-[12px] font-bold text-sky-100 hover:bg-sky-500/40 active:scale-95 transition"
          >
            {c.icon} {isFa ? c.labelFa : (c.labelEn || c.labelFa)}
          </button>
        ))}
      </div>
    </div>
  );
};
