import React, { useState } from 'react';
import {
  Check,
  ChevronRight,
  Eye,
  Flame,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import {
  INITIAL_GTA_SOCIAL_STATE,
  type GtaGamerProfile,
  type LiveArenaPredictionState,
  type LivePredictionMarketId,
  calculateLivePredictionPayout,
} from '../../utils/gtaSocialRules';

interface LiveArenaViewProps {
  arenaState?: LiveArenaPredictionState;
  userStreetRep: number;
  gamers: GtaGamerProfile[];
  onSubmitPrediction: (input: {
    market: LivePredictionMarketId;
    contenderId: 'nima' | 'parsa';
    stakeRep: number;
  }) => void;
  onSelectPlayerProfile: (gamer: GtaGamerProfile) => void;
  onClose?: () => void;
  embedded?: boolean;
}

const MARKET_TABS: Array<{ id: LivePredictionMarketId; labelFa: string }> = [
  { id: 'match_winner', labelFa: 'برنده مسابقه' },
  { id: 'round_mvp', labelFa: 'MVP راند' },
  { id: 'total_rounds', labelFa: 'کل راندها' },
];

const STAKE_CHIPS: number[] = [100, 500, 1000];

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
function toPersianDigits(num: number | string): string {
  return String(num).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

function getContenderOvr(contenderId: 'nima' | 'parsa'): { ovr: number; tag: string } {
  return contenderId === 'nima'
    ? { ovr: 94, tag: 'SAS' }
    : { ovr: 91, tag: 'FC27' };
}

export const LiveArenaView: React.FC<LiveArenaViewProps> = ({
  arenaState,
  userStreetRep,
  gamers,
  onSubmitPrediction,
  onSelectPlayerProfile,
  onClose,
  embedded = false,
}) => {
  const arena = arenaState ?? INITIAL_GTA_SOCIAL_STATE.liveArena!;
  const [activeMarket, setActiveMarket] = useState<LivePredictionMarketId>(
    arena.activeMarket
  );
  const [selectedContenderId, setSelectedContenderId] = useState<'nima' | 'parsa'>(
    arena.selectedContenderId
  );
  const [selectedStakeRep, setSelectedStakeRep] = useState<number>(
    arena.selectedStakeRep || 500
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedContender = arena.contenders[selectedContenderId];
  const potentialPayoutRep = calculateLivePredictionPayout(
    selectedStakeRep,
    selectedContender.multiplier
  );

  const handleOpenProfileByHandle = (handle: string) => {
    const matched = gamers.find(
      (g) => g.handle.toLowerCase() === handle.toLowerCase()
    );
    if (matched) {
      onSelectPlayerProfile(matched);
    }
  };

  const handleConfirmPrediction = () => {
    if (selectedStakeRep > userStreetRep) {
      setToastMessage('موجودی REP شما برای این پیشبینی کافی نیست.');
      setTimeout(() => setToastMessage(null), 3200);
      return;
    }
    onSubmitPrediction({
      market: activeMarket,
      contenderId: selectedContenderId,
      stakeRep: selectedStakeRep,
    });
    setToastMessage(
      `پیشبینی ثبت شد • پاداش احتمالی: ${toPersianDigits(
        potentialPayoutRep.toLocaleString()
      )} REP`
    );
    setTimeout(() => setToastMessage(null), 3600);
  };

  return (
    <div
      data-testid="live-arena-view"
      dir="rtl"
      className="flex-1 min-h-0 flex flex-col justify-between gap-1.5 overflow-y-auto no-scrollbar pr-0.5"
    >
      {/* Optional Top Bar when opened as full-screen Live Arena overlay */}
      {!embedded && onClose && (
        <div className="shrink-0 flex items-center justify-between gap-2 pb-0.5">
          <button
            type="button"
            data-testid="live-arena-back-btn"
            onClick={onClose}
            className="min-h-[34px] px-3 py-1 fc27-btn-dark text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5 text-[#CCFF00]" />
            <span>بازگشت</span>
          </button>

          <div className="px-3.5 py-1 fc27-chamfer-sm bg-[#FF2E54] text-white text-xs font-black tracking-wide shadow-[0_0_16px_rgba(255,46,84,0.38)]">
            رقابت زنده
          </div>

          <div
            dir="ltr"
            data-testid="live-arena-rep-pill"
            className="px-3 py-1 fc27-chamfer-sm bg-[#0B1018]/95 border border-[#F5C542]/45 text-[#F5C542] font-mono-tabular text-xs font-black"
          >
            {toPersianDigits(userStreetRep.toLocaleString())} REP
          </div>
        </div>
      )}

      {/* 1. FC 27 Matchday Broadcast Telemetry Card */}
      <section
        data-testid="live-match-telemetry-card"
        className="shrink-0 fc27-card-live p-2.5 space-y-2"
      >
        {/* Header: جام پایتخت • فینال BO3 | ● زنده | نقشه ۲ از ۳: Mirage */}
        <div className="flex items-center justify-between gap-1.5 text-[11px] pb-1.5 border-b border-white/10">
          <span className="font-black text-white truncate">
            {arena.tournamentTitleFa}
          </span>

          <span
            data-testid="live-match-badge"
            className="px-2 py-0.5 fc27-chamfer-sm bg-[#FF2E54] text-white font-black text-[10px] flex items-center gap-1 shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>● زنده</span>
          </span>

          <span className="text-[#CCFF00] font-extrabold text-[10px] truncate shrink-0">
            {arena.mapLabelFa}
          </span>
        </div>

        {/* Contenders Telemetry Row — FC 27 Scoreboard Strips */}
        <div className="grid grid-cols-2 gap-2 items-stretch">
          {/* Contender 1: @NIMA_HEADSHOT */}
          <div className="bg-[#0A0E16]/90 border border-white/12 border-t-2 border-t-[#F5C542] fc27-chamfer-sm p-2 flex flex-col justify-between gap-1">
            <div className="flex items-center justify-between gap-1.5">
              <button
                type="button"
                data-testid="arena-profile-trigger-nima"
                onClick={() => handleOpenProfileByHandle(arena.contenders.nima.handle)}
                className="flex items-center gap-1.5 min-w-0 text-right cursor-pointer group"
              >
                <img
                  src={arena.contenders.nima.avatarUrl}
                  alt={arena.contenders.nima.handle}
                  referrerPolicy="no-referrer"
                  className="w-8 h-9 fc27-fut-shield object-cover ring-1 ring-[#F5C542]/80 shrink-0 group-hover:scale-105 transition"
                />
                <span
                  dir="ltr"
                  className="font-mono-tabular text-[10px] font-bold text-white/85 block whitespace-nowrap"
                >
                  {arena.contenders.nima.kdText}
                </span>
              </button>

              <span
                dir="ltr"
                data-testid="arena-score-nima"
                className="font-mono-tabular text-sm font-black text-[#05070B] bg-[#F5C542] fc27-chamfer-sm px-2 py-0.5 shrink-0"
              >
                {arena.contenders.nima.score}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleOpenProfileByHandle(arena.contenders.nima.handle)}
              dir="ltr"
              className="font-mono-tabular text-[11px] font-black text-[#F5C542] text-left block hover:underline cursor-pointer"
            >
              @{arena.contenders.nima.handle.toUpperCase()}
            </button>
          </div>

          {/* Contender 2: @PARSA_VICE27 */}
          <div className="bg-[#0A0E16]/90 border border-white/12 border-t-2 border-t-[#FF2E54] fc27-chamfer-sm p-2 flex flex-col justify-between gap-1">
            <div className="flex items-center justify-between gap-1.5">
              <button
                type="button"
                data-testid="arena-profile-trigger-parsa"
                onClick={() => handleOpenProfileByHandle(arena.contenders.parsa.handle)}
                className="flex items-center gap-1.5 min-w-0 text-right cursor-pointer group"
              >
                <img
                  src={arena.contenders.parsa.avatarUrl}
                  alt={arena.contenders.parsa.handle}
                  referrerPolicy="no-referrer"
                  className="w-8 h-9 fc27-fut-shield object-cover ring-1 ring-[#FF2E54]/80 shrink-0 group-hover:scale-105 transition"
                />
                <span
                  dir="ltr"
                  className="font-mono-tabular text-[10px] font-bold text-white/85 block whitespace-nowrap"
                >
                  {arena.contenders.parsa.kdText}
                </span>
              </button>

              <span
                dir="ltr"
                data-testid="arena-score-parsa"
                className="font-mono-tabular text-sm font-black text-white bg-[#FF2E54] fc27-chamfer-sm px-2 py-0.5 shrink-0"
              >
                {arena.contenders.parsa.score}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleOpenProfileByHandle(arena.contenders.parsa.handle)}
              dir="ltr"
              className="font-mono-tabular text-[11px] font-black text-rose-200 text-left block hover:underline cursor-pointer"
            >
              @{arena.contenders.parsa.handle.toUpperCase()}
            </button>
          </div>
        </div>

        {/* 5-Round Form Guide Strip (FC 27 W/L Blocks) */}
        <div className="grid grid-cols-2 gap-2">
          <div
            dir="ltr"
            data-testid="round-dots-nima"
            className="flex items-center justify-center gap-1.5 bg-[#06090E]/90 border border-white/10 py-1 px-2"
          >
            {arena.contenders.nima.roundResults.map((res, idx) => (
              <span
                key={`nima-r-${idx}`}
                className={`w-4 h-4 text-[9px] font-mono-tabular font-black flex items-center justify-center ${
                  res === 'win'
                    ? 'bg-[#CCFF00]/20 border border-[#CCFF00]/75 text-[#CCFF00]'
                    : 'bg-[#FF2E54]/20 border border-[#FF2E54]/75 text-rose-300'
                }`}
              >
                {res === 'win' ? '✓' : '✕'}
              </span>
            ))}
          </div>

          <div
            dir="ltr"
            data-testid="round-dots-parsa"
            className="flex items-center justify-center gap-1.5 bg-[#06090E]/90 border border-white/10 py-1 px-2"
          >
            {arena.contenders.parsa.roundResults.map((res, idx) => (
              <span
                key={`parsa-r-${idx}`}
                className={`w-4 h-4 text-[9px] font-mono-tabular font-black flex items-center justify-center ${
                  res === 'win'
                    ? 'bg-[#CCFF00]/20 border border-[#CCFF00]/75 text-[#CCFF00]'
                    : 'bg-[#FF2E54]/20 border border-[#FF2E54]/75 text-rose-300'
                }`}
              >
                {res === 'win' ? '✓' : '✕'}
              </span>
            ))}
          </div>
        </div>

        {/* Live Broadcast Footer */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10 text-[11px]">
          <span className="text-white/85 font-bold flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-[#CCFF00]" />
            <span>{toPersianDigits(arena.viewersCount.toLocaleString())} بیننده</span>
          </span>

          <span
            data-testid="arena-total-pool"
            className="text-[#F5C542] font-black flex items-center gap-1"
          >
            <Flame className="w-3.5 h-3.5 text-[#FF2E54]" />
            <span>
              {toPersianDigits(arena.totalPoolRep.toLocaleString())} REP کل پیشبینی
            </span>
          </span>
        </div>
      </section>

      {/* 2. FC 27 Market Selector Bar: برنده مسابقه | MVP راند | کل راندها */}
      <div
        role="tablist"
        aria-label="بازارهای پیشبینی مسابقه زنده"
        className="shrink-0 grid grid-cols-3 gap-1 fc27-tab-bar p-1"
      >
        {MARKET_TABS.map((mTab) => {
          const active = activeMarket === mTab.id;
          return (
            <button
              key={mTab.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`market-pill-${mTab.id}`}
              onClick={() => setActiveMarket(mTab.id)}
              className={`min-h-[30px] fc27-chamfer-sm px-2 py-0.5 text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#CCFF00] text-[#05070B]'
                  : 'text-white/75 hover:text-white hover:bg-white/5'
              }`}
            >
              {mTab.labelFa}
            </button>
          );
        })}
      </div>

      {/* 3. Side-by-Side FC 27 FUT Contender Cards */}
      <div className="shrink-0 grid grid-cols-2 gap-2">
        {(['nima', 'parsa'] as const).map((cId) => {
          const contender = arena.contenders[cId];
          const isSelected = selectedContenderId === cId;
          const multPersian = toPersianDigits(contender.multiplier.toFixed(2));
          const { ovr, tag } = getContenderOvr(cId);

          return (
            <div
              key={cId}
              role="button"
              tabIndex={0}
              data-testid={`contender-card-${cId}`}
              onClick={() => setSelectedContenderId(cId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedContenderId(cId);
                }
              }}
              className={`p-2.5 text-right transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                isSelected ? 'fc27-card-gold' : 'fc27-card'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col items-center leading-none pr-0.5">
                    <span
                      dir="ltr"
                      className={`font-display text-xl font-black italic tracking-tight ${
                        isSelected ? 'text-[#F5C542]' : 'text-[#CCFF00]'
                      }`}
                    >
                      {ovr}
                    </span>
                    <span
                      dir="ltr"
                      className="font-mono-tabular text-[9px] font-black text-white/65 tracking-wider"
                    >
                      {tag}
                    </span>
                  </div>
                  <img
                    src={contender.avatarUrl}
                    alt={contender.handle}
                    referrerPolicy="no-referrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenProfileByHandle(contender.handle);
                    }}
                    className="w-8 h-9 fc27-fut-shield object-cover ring-1 ring-[#F5C542]/75 shrink-0 hover:scale-105 transition"
                  />
                </div>

                <span
                  data-testid={`multiplier-pill-${cId}`}
                  className={`px-2 py-0.5 fc27-chamfer-sm text-[10px] font-black shrink-0 ${
                    isSelected
                      ? 'bg-[#F5C542] text-[#05070B]'
                      : 'bg-white/10 border border-white/15 text-[#F5C542]'
                  }`}
                >
                  ضریب {multPersian}x
                </span>
              </div>

              <div className="pt-1 border-t border-white/10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenProfileByHandle(contender.handle);
                  }}
                  dir="ltr"
                  className="font-mono-tabular text-[11px] font-black text-white hover:text-[#CCFF00] block cursor-pointer"
                >
                  @{contender.handle.toUpperCase()}
                </button>
                <p className="text-[11px] text-white/80 font-bold mt-0.5">
                  <span className={isSelected ? 'text-[#F5C542]' : 'text-[#CCFF00]'}>
                    {toPersianDigits(contender.winChancePct)}٪ شانس برد
                  </span>{' '}
                  •{' '}
                  <span dir="ltr" className="font-mono-tabular text-white/85">
                    {contender.kdRatioText}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. FC 27 Stake & Dynamic Payout Card */}
      <section className="shrink-0 fc27-card p-2.5 space-y-2">
        {/* Interactive Stake Chips: ۱۰۰, ۵۰۰, ۱,۰۰۰ REP */}
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-xs font-extrabold text-white/85 shrink-0">
            مقدار پیشبینی:
          </span>
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            {STAKE_CHIPS.map((stake) => {
              const active = selectedStakeRep === stake;
              return (
                <button
                  key={stake}
                  type="button"
                  data-testid={`stake-chip-${stake}`}
                  onClick={() => setSelectedStakeRep(stake)}
                  className={`min-h-[28px] px-2.5 py-0.5 fc27-chamfer-sm text-[11px] font-black transition cursor-pointer ${
                    active
                      ? 'bg-[#CCFF00] text-[#05070B]'
                      : 'bg-[#0C1119] border border-white/15 text-white/80 hover:border-[#CCFF00]/50 hover:text-white'
                  }`}
                >
                  {toPersianDigits(stake.toLocaleString())} REP
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto-calculated Live Payout Line */}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#06090F]/95 border border-[#F5C542]/35 border-r-2 border-r-[#CCFF00]">
          <span className="text-xs font-extrabold text-white/90 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#CCFF00]" />
            <span>پاداش احتمالی:</span>
          </span>
          <span
            data-testid="live-potential-payout"
            className="text-sm font-black text-[#F5C542]"
          >
            {toPersianDigits(potentialPayoutRep.toLocaleString())} REP
          </span>
        </div>

        {/* Full-Width FC 27 Volt Broadcast CTA Button: ثبت پیشبینی */}
        <button
          type="button"
          data-testid="submit-live-prediction-btn"
          onClick={handleConfirmPrediction}
          className="w-full min-h-[38px] fc27-btn-volt text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(204,255,0,0.28)] cursor-pointer"
        >
          <Trophy className="w-4 h-4 text-[#05070B]" />
          <span>ثبت پیشبینی</span>
        </button>

        {/* Confirmation Toast */}
        {toastMessage && (
          <div
            data-testid="prediction-toast"
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 fc27-chamfer-sm bg-[#CCFF00]/15 border border-[#CCFF00]/65 text-[#CCFF00] text-[11px] font-extrabold"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Check className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
              <span className="truncate">{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-[#CCFF00] hover:text-white shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default LiveArenaView;
