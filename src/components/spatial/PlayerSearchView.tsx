import React, { useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import {
  type GtaGamerProfile,
  filterAndSortPlayersForSearch,
} from '../../utils/gtaSocialRules';

interface PlayerSearchViewProps {
  gamers: GtaGamerProfile[];
  onToggleFriend: (gamerId: string) => void;
  onSelectPlayerProfile: (gamer: GtaGamerProfile) => void;
  onClose?: () => void;
}

const FILTER_PILLS: Array<{
  id: 'all' | 'online' | 'top_rep';
  labelFa: string;
}> = [
  { id: 'all', labelFa: 'همه' },
  { id: 'online', labelFa: 'آنلاینها' },
  { id: 'top_rep', labelFa: 'پرامتیازترین' },
];

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
function toPersianDigits(num: number | string): string {
  return String(num).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

function computeMiniOvr(gamer: GtaGamerProfile): number {
  const base = gamer.winRatePct ?? 80;
  return Math.min(99, Math.max(82, Math.round(base + 12)));
}

export const PlayerSearchView: React.FC<PlayerSearchViewProps> = ({
  gamers,
  onToggleFriend,
  onSelectPlayerProfile,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'online' | 'top_rep'>('all');

  const results = filterAndSortPlayersForSearch(gamers, searchQuery, filterMode);

  return (
    <div
      data-testid="player-search-view"
      dir="rtl"
      className="flex-1 min-h-0 flex flex-col justify-between gap-2.5 overflow-hidden"
    >
      {/* 1. FC 27 Transfer Market / Scout Search Bar */}
      <div className="shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#CCFF00] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <input
              type="text"
              dir="rtl"
              data-testid="player-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی آیدی یا نام بازیکن..."
              aria-label="جستجوی آیدی یا نام بازیکن..."
              className="w-full min-h-[40px] bg-[#090E16]/95 border border-white/15 fc27-chamfer-sm pr-10 pl-8 py-2 text-xs text-white placeholder:text-white/45 focus:outline-none focus:border-[#CCFF00]"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="پاک کردن جستجو"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-white/55 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {onClose && (
            <button
              type="button"
              data-testid="close-player-search-btn"
              onClick={onClose}
              className="min-h-[38px] px-3 py-1.5 fc27-btn-dark text-xs font-extrabold text-white/90 cursor-pointer shrink-0"
            >
              بستن
            </button>
          )}
        </div>

        {/* 2. FC 27 Filter Tab Bar: همه | آنلاینها | پرامتیازترین */}
        <div className="grid grid-cols-3 gap-1 fc27-tab-bar p-1">
          {FILTER_PILLS.map((pill) => {
            const active = filterMode === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                data-testid={`player-search-filter-${pill.id}`}
                onClick={() => setFilterMode(pill.id)}
                className={`min-h-[32px] fc27-chamfer-sm px-2.5 py-1 text-xs font-extrabold transition cursor-pointer ${
                  active
                    ? 'bg-[#CCFF00] text-[#05070B]'
                    : 'text-white/75 hover:text-white hover:bg-white/5'
                }`}
              >
                {pill.labelFa}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. FC 27 Ultimate Team Mini Player Cards */}
      <div
        data-testid="player-search-results"
        className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2 pr-0.5"
      >
        {results.length === 0 ? (
          <div className="h-36 fc27-card flex items-center justify-center text-center text-white/65 text-xs font-bold">
            بازیکنی با این مشخصات یافت نشد.
          </div>
        ) : (
          results.map((gamer) => {
            const winRatePct = gamer.winRatePct ?? 82;
            const clanTag = gamer.clanTag ?? 'SAS';
            const ovr = computeMiniOvr(gamer);
            const isGoldTier = ovr >= 93;

            return (
              <article
                key={gamer.id}
                data-testid={`search-result-card-${gamer.id}`}
                className={`p-2.5 transition ${
                  isGoldTier ? 'fc27-card-gold' : 'fc27-card'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Tapping OVR / Shield / @handle opens PlayerProfileModal */}
                  <button
                    type="button"
                    data-testid={`open-player-profile-${gamer.id}`}
                    onClick={() => onSelectPlayerProfile(gamer)}
                    className="flex items-center gap-2.5 min-w-0 text-right flex-1 cursor-pointer group"
                  >
                    {/* FUT Mini OVR & Club Column */}
                    <div className="flex flex-col items-center justify-center shrink-0 pl-2 border-l border-white/12 leading-none min-w-[34px]">
                      <span
                        dir="ltr"
                        className={`font-display text-2xl font-black italic tracking-tight ${
                          isGoldTier ? 'text-[#F5C542]' : 'text-[#CCFF00]'
                        }`}
                      >
                        {ovr}
                      </span>
                      <span
                        dir="ltr"
                        className="font-mono-tabular text-[9px] font-black text-white/70 mt-0.5"
                      >
                        {clanTag}
                      </span>
                    </div>

                    {/* FUT Shield Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={gamer.avatarUrl}
                        alt={gamer.displayNameFa}
                        referrerPolicy="no-referrer"
                        className={`w-10 h-11 fc27-fut-shield object-cover group-hover:scale-105 transition ${
                          isGoldTier
                            ? 'ring-1 ring-[#F5C542]'
                            : 'ring-1 ring-[#CCFF00]/75'
                        }`}
                      />
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#CCFF00] ring-2 ring-[#070B10]"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          dir="ltr"
                          className={`font-mono-tabular text-xs font-black group-hover:underline truncate ${
                            isGoldTier ? 'text-[#F5C542]' : 'text-white'
                          }`}
                        >
                          @{gamer.handle.toUpperCase()}
                        </span>
                      </div>

                      {/* Subtitle: نرخ برد ۸۲٪ • ۹,۲۰۰ امتیاز • کلاب SAS */}
                      <p className="text-[11px] font-bold text-white/90 mt-0.5 leading-snug">
                        نرخ برد {toPersianDigits(winRatePct)}٪ •{' '}
                        <span className="text-[#F5C542]">
                          {toPersianDigits(gamer.repScore.toLocaleString())} امتیاز
                        </span>{' '}
                        • کلاب{' '}
                        <span dir="ltr" className="font-mono-tabular text-[#CCFF00]">
                          {clanTag}
                        </span>
                      </p>

                      <p className="text-[10px] text-white/65 mt-0.5 truncate">
                        {gamer.richPresenceFa ?? gamer.displayNameFa}
                      </p>
                    </div>
                  </button>

                  {/* Interactive افزودن + / ارسال شد ✓ FC 27 Button */}
                  <button
                    type="button"
                    data-testid={`friend-toggle-btn-${gamer.id}`}
                    onClick={() => onToggleFriend(gamer.id)}
                    className={`min-h-[34px] px-2.5 py-1.5 text-xs font-black flex items-center gap-1 transition cursor-pointer shrink-0 ${
                      gamer.isFriend
                        ? 'fc27-chamfer-sm bg-[#CCFF00]/18 border border-[#CCFF00]/75 text-[#CCFF00]'
                        : 'fc27-btn-volt'
                    }`}
                  >
                    {gamer.isFriend ? (
                      <span>ارسال شد ✓</span>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 text-[#05070B]" />
                        <span>افزودن +</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PlayerSearchView;
