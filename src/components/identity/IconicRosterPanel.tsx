import React, { useMemo, useState } from 'react';
import { Check, Crown, RotateCcw, Search, Sparkles, X } from 'lucide-react';
import type { ScoredIconicCharacter } from '../../utils/iconicCharacterMatcher';
import type { HologramGender } from '../../utils/hologramAvatarEngine';
import { HOLOGRAM_PLATE_URLS } from './hologramPlateAssets';

interface IconicRosterPanelProps {
  allRanked: ScoredIconicCharacter[];
  activeCharacterId: string;
  autoMatchedCharacterId: string;
  isManualPinned: boolean;
  onSelectCharacter: (characterId: string) => void;
  onResetAutoMatch: () => void;
  onClose?: () => void;
}

type AgeFilter = 'all' | '8-17' | '18-35' | '36-58' | '59-99';

export const IconicRosterPanel: React.FC<IconicRosterPanelProps> = ({
  allRanked,
  activeCharacterId,
  autoMatchedCharacterId,
  isManualPinned,
  onSelectCharacter,
  onResetAutoMatch,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | HologramGender>('all');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRanked.filter(({ character }) => {
      if (genderFilter !== 'all' && character.gender !== genderFilter) return false;
      if (ageFilter === '8-17' && character.canonicalAge > 17) return false;
      if (ageFilter === '18-35' && (character.canonicalAge < 18 || character.canonicalAge > 35))
        return false;
      if (ageFilter === '36-58' && (character.canonicalAge < 36 || character.canonicalAge > 58))
        return false;
      if (ageFilter === '59-99' && character.canonicalAge < 59) return false;
      if (!q) return true;
      return (
        character.nameEn.toLowerCase().includes(q) ||
        character.nameFa.toLowerCase().includes(q) ||
        character.franchise.toLowerCase().includes(q) ||
        character.archetypeFa.toLowerCase().includes(q)
      );
    });
  }, [ageFilter, allRanked, genderFilter, query]);

  return (
    <section
      data-testid="iconic-50-roster-panel"
      dir="rtl"
      className="rounded-[28px] border border-slate-200/90 bg-white/95 shadow-[0_20px_54px_rgba(15,23,42,0.10)] p-4 sm:p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center shrink-0">
            <Crown className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-[15px] sm:text-[16px] font-bold text-slate-900">
              ۵۰ شخصیت مطرح تاریخ صنعت گیم (رتبه‌بندی هوشمند بر اساس پروفایل شما)
            </h2>
            <p className="text-[11.5px] text-slate-500 mt-0.5">
              از سن ۸ تا ۹۹ سال · شامل آرتور مورگان، مکس پین، گرالت، لارا کرافت، لئون کندی و ۴۵ اسطوره دیگر
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isManualPinned && (
            <button
              type="button"
              data-testid="roster-reset-auto-btn"
              onClick={onResetAutoMatch}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[11.5px] font-semibold hover:bg-sky-100 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              بازگشت به تطابق خودکار
            </button>
          )}
          {onClose && (
            <button
              type="button"
              data-testid="roster-close-btn"
              onClick={onClose}
              aria-label="بستن لیست ۵۰ شخصیت"
              className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            data-testid="roster-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در ۵۰ شخصیت (مثلاً Arthur Morgan، Max Payne، لارا، گرالت...)"
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-[12.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: `همه (${allRanked.length})` },
              { id: 'male', label: 'پسر / مرد' },
              { id: 'female', label: 'دختر / زن' },
            ] as const
          ).map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGenderFilter(g.id)}
              className={`px-2.5 py-1.5 rounded-xl text-[11.5px] font-semibold border transition cursor-pointer ${
                genderFilter === g.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {g.label}
            </button>
          ))}

          <span className="w-px h-5 bg-slate-200 mx-0.5 hidden sm:inline-block" />

          {(
            [
              { id: 'all', label: 'همه سنین' },
              { id: '8-17', label: '۸–۱۷' },
              { id: '18-35', label: '۱۸–۳۵' },
              { id: '36-58', label: '۳۶–۵۸' },
              { id: '59-99', label: '۵۹–۹۹' },
            ] as const
          ).map((af) => (
            <button
              key={af.id}
              type="button"
              onClick={() => setAgeFilter(af.id)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                ageFilter === af.id
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {af.label}
            </button>
          ))}
        </div>
      </div>

      {/* 50-Character Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[540px] overflow-y-auto pr-0.5">
        {filtered.map(({ character, similarityPct }, index) => {
          const isActive = character.id === activeCharacterId;
          const isAutoTop = character.id === autoMatchedCharacterId;
          const thumbUrl = HOLOGRAM_PLATE_URLS[character.plateKey];
          return (
            <button
              key={character.id}
              type="button"
              data-testid={`roster-card-${character.id}`}
              onClick={() => onSelectCharacter(character.id)}
              className={`group text-right rounded-2xl border p-2.5 transition flex items-center gap-3 cursor-pointer ${
                isActive
                  ? 'border-sky-500 bg-sky-50/75 shadow-[0_6px_20px_rgba(14,165,233,0.16)]'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div className="relative w-14 h-[72px] rounded-xl overflow-hidden bg-[#020712] shrink-0 border border-slate-800/80">
                <img
                  src={thumbUrl}
                  alt={character.nameEn}
                  loading="lazy"
                  className="w-full h-full object-cover object-top"
                />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-slate-950/85 text-[9.5px] font-bold text-sky-300 font-mono-tabular">
                  {similarityPct}%
                </span>
              </div>

              <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[12.5px] font-bold text-slate-900 truncate">
                    {character.nameFa}
                  </span>
                  {isActive ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-sky-600 text-white text-[9.5px] font-bold shrink-0">
                      <Check className="w-2.5 h-2.5" />
                      فعال
                    </span>
                  ) : isAutoTop ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9.5px] font-bold shrink-0">
                      <Sparkles className="w-2.5 h-2.5" />
                      برترین تطابق
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono-tabular text-slate-400 shrink-0">
                      #{index + 1}
                    </span>
                  )}
                </div>

                <p className="text-[10.5px] text-slate-500 truncate" dir="ltr">
                  {character.nameEn} · {character.franchise}
                </p>
                <p className="text-[10.5px] text-sky-700 font-medium truncate">
                  {character.archetypeFa}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                  <span>{character.canonicalAge} سال</span>
                  <span>·</span>
                  <span>{character.gender === 'female' ? 'زن' : 'مرد'}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-10 text-center text-[13px] text-slate-500">
          شخصیتی با این فیلتر پیدا نشد. عبارت جستجو یا بازه سنی را تغییر دهید.
        </div>
      )}
    </section>
  );
};
