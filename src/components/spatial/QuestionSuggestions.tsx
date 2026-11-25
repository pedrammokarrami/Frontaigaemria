import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Sparkles } from 'lucide-react';
import { suggestCoachQuestions } from '../../utils/coachQuestionBank';
import type { LobbyGameId } from '../../utils/lobbySkillCatalog';

interface QuestionSuggestionsProps {
  gameId: LobbyGameId;
  query: string;
  accentHex: string;
  onSelectQuestion: (question: string) => void;
  limit?: number;
}

/**
 * Live suggested questions — visible while typing (or as starters when empty),
 * each one clickable to immediately run the coach session for it.
 */
export const QuestionSuggestions: React.FC<QuestionSuggestionsProps> = ({
  gameId,
  query,
  accentHex,
  onSelectQuestion,
  limit = 8,
}) => {
  const { languageCode, isRtl } = useLanguage();
  const lang = languageCode?.slice(0, 2) ?? 'fa';
  const suggestions = suggestCoachQuestions(query, gameId, limit, lang);
  if (suggestions.length === 0) return null;
  return (
    <div
      data-testid="question-suggestions"
      className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <span className="shrink-0 inline-flex items-center gap-1 text-[10.5px] font-black text-white/45">
        <Sparkles className="w-3 h-3" style={{ color: accentHex }} />
        {lang === 'fa' ? 'سوال‌های پیشنهادی:' : 'Suggested questions:'}
      </span>
      {suggestions.map((q) => (
        <button
          key={q}
          type="button"
          data-testid="question-suggestion-chip"
          onClick={() => onSelectQuestion(q)}
          className="shrink-0 whitespace-nowrap min-h-[26px] px-2.5 rounded-full text-[11px] font-bold transition-all duration-150 cursor-pointer border border-white/12 bg-slate-950/55 text-white/85 hover:text-white hover:border-white/40"
          style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.03)` }}
        >
          {q}
        </button>
      ))}
    </div>
  );
};
