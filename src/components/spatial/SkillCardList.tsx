import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getSkillCategoryLabel, getSkillTitle } from '../../utils/i18nEngine';
import type { LobbySkillCardItem, LobbyGameId } from '../../utils/lobbySkillCatalog';

interface SkillCardListProps {
  skills: LobbySkillCardItem[];
  gameId: LobbyGameId;
  searchQuery: string;
  onSelectSkill: (skill: LobbySkillCardItem) => void;
  onResetFilters: () => void;
}

function renderBidiSafeTitle(title: string): React.ReactNode {
  const parts = title.split(/(\([^)]+\))/g);
  return parts.map((part, idx) => {
    if (part.startsWith('(') && part.endsWith(')')) {
      return (
        <span
          key={idx}
          dir="ltr"
          className="inline-block font-mono-tabular text-[12.5px] font-bold text-emerald-200 mx-0.5"
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const SkillCardList: React.FC<SkillCardListProps> = ({
  skills,
  gameId,
  searchQuery,
  onSelectSkill,
  onResetFilters,
}) => {
  const { languageCode, isRtl, copy } = useLanguage();

  return (
    <main
      aria-label={copy.hubGame}
      data-testid="skill-card-list-region"
      dir="ltr"
      className="flex-1 w-full flex flex-col justify-end items-start min-h-0 pb-2"
    >
      {/* Left ~70% column keeps the UE 5.8 stadium-tunnel character unobstructed on the right */}
      <div
        data-testid="skill-card-list"
        className="w-[70%] min-w-[238px] max-w-[292px] flex flex-col gap-2.5 overflow-y-auto no-scrollbar py-1"
      >
        {skills.length === 0 ? (
          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            data-testid="skill-empty-state"
            className="w-full rounded-2xl bg-slate-950/55 backdrop-blur-xl border border-white/15 p-4 text-start flex flex-col gap-3"
          >
            <p className="text-[13px] font-bold text-white/90 leading-relaxed">
              {copy.noSkillsFound}
            </p>
            <button
              type="button"
              onClick={onResetFilters}
              data-testid="skill-reset-filters-btn"
              className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-[12px] font-bold hover:bg-emerald-500/30 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{copy.showAllSkills}</span>
            </button>
          </div>
        ) : (
          skills.map((skill) => {
            const title = getSkillTitle(skill.id, skill.titleFa, languageCode);
            const category = getSkillCategoryLabel(skill.id, skill.categoryLabelFa, languageCode);
            return (
              <button
                key={skill.id}
                type="button"
                data-testid={`topic-btn-${skill.num}`}
                onClick={() => onSelectSkill(skill)}
                dir={isRtl ? 'rtl' : 'ltr'}
                className="group w-full text-start rounded-2xl bg-slate-950/45 backdrop-blur-xl border border-white/12 p-3.5 hover:bg-slate-900/60 hover:border-emerald-400/50 active:scale-[0.985] transition-all duration-200 cursor-pointer shadow-[0_8px_28px_rgba(2,6,23,0.45)] flex flex-col gap-2"
              >
                <div className="w-full flex items-center justify-between gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 border border-white/12 text-emerald-200">
                    {category}
                  </span>
                  <span className="font-mono-tabular text-[11px] font-bold tracking-wider text-white/50 group-hover:text-emerald-300 transition-colors">
                    {skill.num}
                  </span>
                </div>

                <div className="w-full flex items-end justify-between gap-1.5">
                  <span className="text-[14px] font-extrabold text-white leading-snug break-words">
                    {renderBidiSafeTitle(title)}
                  </span>
                  {isRtl ? (
                    <ChevronLeft
                      className="w-4 h-4 text-white/45 group-hover:text-emerald-300 group-hover:-translate-x-0.5 transition-all shrink-0 mb-0.5"
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronRight
                      className="w-4 h-4 text-white/45 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all shrink-0 mb-0.5"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </main>
  );
};
