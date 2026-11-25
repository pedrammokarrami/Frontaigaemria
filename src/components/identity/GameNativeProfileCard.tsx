import React from 'react';
import {
  Award,
  Crosshair,
  Crown,
  Flame,
  Gauge,
  Shield,
  Sparkles,
  Star,
  Swords,
  Target,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react';
import type { IconicGameCharacter } from '../../data/iconicGameCharacters';
import type { CrossGameHandleProfile, CrossGameKey } from '../../data/offlineAgentsData';
import { GAME_STAGE_FRAME_CONFIG, type GameStageFrameConfig } from './gameProfileThemes';
import { HOLOGRAM_PLATE_URLS } from './hologramPlateAssets';

export { GAME_STAGE_FRAME_CONFIG, type GameStageFrameConfig };

interface GameNativeProfileCardProps {
  gameKey: CrossGameKey;
  unifiedId: string;
  displayName: string;
  profile: CrossGameHandleProfile;
  matchedCharacter: IconicGameCharacter;
  similarityPct: number;
  userTraitsFa: string[];
  linkedCount: number;
}

export const GameNativeProfileCard: React.FC<GameNativeProfileCardProps> = ({
  gameKey,
  unifiedId,
  displayName,
  profile,
  matchedCharacter,
  similarityPct,
  userTraitsFa,
  linkedCount,
}) => {
  const plateUrl = HOLOGRAM_PLATE_URLS[matchedCharacter.plateKey];
  const shortLastName = displayName.trim().split(/\s+/).slice(-1)[0].toUpperCase();

  // ===========================================================================
  // 1. EA SPORTS FC 27 — Authentic FUT Ultimate Team Icon Gold Shield Card
  // ===========================================================================
  if (gameKey === 'fc27') {
    const ovr = Math.min(99, Math.max(82, Math.round(profile.competitiveRating / 23.6)));
    const futStats = [
      { label: 'PAC', val: 92 },
      { label: 'DRI', val: 94 },
      { label: 'SHO', val: 90 },
      { label: 'DEF', val: 68 },
      { label: 'PAS', val: 93 },
      { label: 'PHY', val: 82 },
    ];

    return (
      <section
        data-testid="game-native-profile-card"
        data-game-theme="fc27"
        aria-label="EA SPORTS FC 27 Ultimate Team Profile Card"
        className="relative mx-auto w-full max-w-[380px] select-none"
      >
        <div
          className="relative p-[2.5px] shadow-[0_22px_54px_rgba(146,112,26,0.38)]"
          style={{
            background:
              'linear-gradient(145deg, #FBF0B2 0%, #D4AF37 32%, #8A6B1E 65%, #F4DA7A 100%)',
            clipPath:
              'polygon(8% 0%, 92% 0%, 100% 6%, 100% 86%, 50% 100%, 0% 86%, 0% 6%)',
          }}
        >
          <div
            className="relative px-6 pt-6 pb-16 text-[#F7E8B5] overflow-hidden"
            style={{
              background:
                'radial-gradient(circle at 68% 24%, rgba(212,175,55,0.32) 0%, rgba(24,20,10,0.97) 54%, #0D0B07 100%)',
              clipPath:
                'polygon(8% 0%, 92% 0%, 100% 6%, 100% 86%, 50% 100%, 0% 86%, 0% 6%)',
            }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(135deg, rgba(247,227,150,0.28) 0px, rgba(247,227,150,0.28) 1px, transparent 1px, transparent 18px)',
              }}
            />

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="flex flex-col items-center w-20 pt-1">
                <span
                  data-testid="metric-rating"
                  className="text-[48px] font-black leading-none tracking-tight text-[#FBF0B2] font-mono-tabular"
                >
                  {ovr}
                </span>
                <span className="text-[16px] font-extrabold tracking-widest text-[#E6CA6E] mt-0.5">
                  CAM
                </span>
                <div className="w-10 h-[1px] bg-[#D4AF37]/55 my-2" />
                <div className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-[#F7E8B5]">
                  <span>IR</span>
                  <span className="text-[#D4AF37]">·</span>
                  <span>DIV 1</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2" aria-label="Chemistry 3 of 3">
                  {[0, 1, 2].map((idx) => (
                    <span
                      key={idx}
                      className="w-2.5 h-2.5 rotate-45 bg-[#38BDF8] border border-[#FBF0B2]/80"
                    />
                  ))}
                </div>
              </div>

              <div className="relative flex-1 flex flex-col items-end">
                <div className="w-36 h-36 rounded-2xl overflow-hidden border border-[#D4AF37]/45 bg-[#08090D] shadow-inner">
                  <img
                    src={plateUrl}
                    alt={matchedCharacter.nameEn}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top scale-105"
                  />
                </div>
                <span className="mt-1.5 text-[10.5px] font-semibold tracking-wider text-[#D4AF37] uppercase">
                  {profile.handle}
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-3 pt-2.5 pb-2 border-y border-[#D4AF37]/55 text-center">
              <h2
                data-testid="active-game-handle"
                className="text-[22px] font-black tracking-[0.14em] text-[#FFF6CE] uppercase truncate"
              >
                {shortLastName}
              </h2>
              <p className="text-[11px] text-[#D8C17A] mt-0.5">
                {profile.tierLabel} · SR {profile.competitiveRating.toLocaleString()} · WR{' '}
                {profile.winRatePct.toFixed(1)}%
              </p>
            </div>

            <div className="relative z-10 mt-3.5 grid grid-cols-2 gap-x-6 gap-y-1.5 px-3">
              {futStats.map((st) => (
                <div
                  key={st.label}
                  className="flex items-baseline justify-between border-b border-[#D4AF37]/20 pb-1"
                >
                  <span className="text-[20px] font-black text-[#FFF5C8] font-mono-tabular">
                    {st.val}
                  </span>
                  <span className="text-[13px] font-bold tracking-widest text-[#D6B85C]">
                    {st.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative z-10 mt-3.5 flex items-center justify-center gap-2 text-[10.5px] font-bold text-[#F7E396] whitespace-nowrap">
              <span className="inline-flex items-center gap-1">
                <Trophy className="w-3 h-3 text-[#FBBF24]" />
                Finesse+
              </span>
              <span className="text-[#D4AF37]/50">·</span>
              <span>Incisive Pass+</span>
              <span className="text-[#D4AF37]/50">·</span>
              <span>Rapid</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ===========================================================================
  // 2. COUNTER-STRIKE 2 — Authentic Premier CS Rating & Service Medal Dossier
  // ===========================================================================
  if (gameKey === 'cs2') {
    const mapWinRates = [
      { map: 'Mirage', pct: 74 },
      { map: 'Inferno', pct: 68 },
      { map: 'Ancient', pct: 61 },
    ];

    return (
      <section
        data-testid="game-native-profile-card"
        data-game-theme="cs2"
        aria-label="Counter-Strike 2 Premier Profile Card"
        className="rounded-[16px] border border-[#A855F7]/45 bg-[#121722] text-[#E2E8F0] shadow-[0_22px_54px_rgba(0,0,0,0.42)] overflow-hidden"
      >
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#1A202E] via-[#241C36] to-[#151B26] border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-md overflow-hidden border border-[#A855F7]/75 bg-[#0B0F15] shrink-0">
              <img
                src={plateUrl}
                alt={matchedCharacter.nameEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  data-testid="active-game-handle"
                  className="text-[17px] font-extrabold tracking-tight text-white truncate"
                >
                  {profile.handle}
                </h2>
                <span className="text-[10.5px] font-bold text-[#F59E0B] font-mono-tabular">
                  LVL 9
                </span>
              </div>
              <p className="text-[11.5px] text-slate-400 truncate">
                {displayName} · {profile.regionTag}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[#CBD5E1] shrink-0">
            <Shield className="w-5 h-5 text-[#F59E0B]" />
            <span className="text-[10.5px] font-bold tracking-wider uppercase">Medal 26</span>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                CS2 Premier Rating
              </p>
              <p className="text-[12px] text-slate-300 mt-0.5">
                Season 2 · {profile.verifiedMatchesCount} Premier Wins
              </p>
            </div>

            <div className="relative flex items-center">
              <div className="flex gap-[3px] mr-1.5 -skew-x-12">
                <span className="w-[4px] h-9 bg-[#C084FC]" />
                <span className="w-[4px] h-9 bg-[#A855F7]/75" />
              </div>
              <div className="-skew-x-12 bg-gradient-to-r from-[#581C87] via-[#7E22CE] to-[#9333EA] border border-[#D8B4FE]/60 px-4 py-1.5 shadow-[0_0_24px_rgba(168,85,247,0.35)]">
                <span
                  data-testid="metric-rating"
                  className="block skew-x-12 text-[24px] font-black tracking-tight text-white font-mono-tabular leading-none"
                >
                  {profile.competitiveRating.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/10">
            {[
              { k: 'ADR', v: '94.2' },
              { k: 'HS %', v: '58%' },
              { k: 'K/D', v: '1.42' },
              { k: 'Win %', v: `${profile.winRatePct.toFixed(0)}%` },
            ].map((item) => (
              <div
                key={item.k}
                className="rounded-md bg-[#1B2331] border border-white/5 px-2.5 py-2 text-center"
              >
                <p className="text-[10px] font-semibold text-slate-400 uppercase">{item.k}</p>
                <p className="text-[16px] font-extrabold text-white font-mono-tabular mt-0.5">
                  {item.v}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-300">
                <Crosshair className="w-3.5 h-3.5 text-[#F59E0B]" />
                Active Duty Pool
              </span>
              <span className="font-mono-tabular">
                Consistency {profile.tacticalConsistencyPct}%
              </span>
            </div>
            {mapWinRates.map((m) => (
              <div key={m.map} className="flex items-center gap-3">
                <span className="w-16 text-[11.5px] font-semibold text-slate-300">{m.map}</span>
                <div className="flex-1 h-2 rounded-xs bg-[#1E2734] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#F59E0B] to-[#C084FC]"
                    style={{ width: `${m.pct}%` }}
                  />
                </div>
                <span className="w-9 text-right text-[11.5px] font-bold text-slate-200 font-mono-tabular">
                  {m.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ===========================================================================
  // 3. VALORANT — Authentic Tactical Player Card & 9-Triangle Act Rank Pyramid
  // ===========================================================================
  if (gameKey === 'valorant') {
    return (
      <section
        data-testid="game-native-profile-card"
        data-game-theme="valorant"
        aria-label="VALORANT Competitive Player Card"
        className="relative bg-[#0F1923] text-[#ECE8E1] border border-[#FF4655]/65 shadow-[0_22px_54px_rgba(0,0,0,0.45)] overflow-hidden"
        style={{
          clipPath:
            'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))',
        }}
      >
        <div className="h-1.5 w-full bg-[#FF4655]" />

        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-14 h-16 overflow-hidden border border-[#FF4655]/75 bg-[#080F17] shrink-0">
                <img
                  src={plateUrl}
                  alt={matchedCharacter.nameEn}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.22em] text-[#FF4655] uppercase">
                  EPISODE 09 · ACT III
                </p>
                <h2
                  data-testid="active-game-handle"
                  className="text-[20px] font-black tracking-tight text-[#ECE8E1] truncate mt-0.5"
                >
                  {profile.handle}
                </h2>
                <p className="text-[11.5px] text-[#94A3B8] mt-0.5">
                  {profile.regionTag} · {profile.tierLabel}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center" aria-label="Act Rank Pyramid">
              <svg width="64" height="58" viewBox="0 0 64 58" fill="none">
                <polygon points="32,3 41,19 23,19" fill="#19C37D" stroke="#0F1923" strokeWidth="1.5" />
                <polygon points="22,20 31,36 13,36" fill="#14B8A6" stroke="#0F1923" strokeWidth="1.5" />
                <polygon points="32,36 41,20 23,20" fill="#2DD4BF" stroke="#0F1923" strokeWidth="1.5" />
                <polygon points="42,20 51,36 33,36" fill="#19C37D" stroke="#0F1923" strokeWidth="1.5" />
                <polygon points="12,37 21,53 3,53" fill="#0D9488" stroke="#0F1923" strokeWidth="1.5" />
                <polygon points="22,53 31,37 13,37" fill="#14B8A6" stroke="#0F1923" strokeWidth="1.5" />
                <polygon points="32,37 41,53 23,53" fill="#34D399" stroke="#0F1923" strokeWidth="1.5" />
                <polygon points="42,53 51,37 33,37" fill="#14B8A6" stroke="#0F1923" strokeWidth="1.5" />
                <polygon points="52,37 61,53 43,53" fill="#0D9488" stroke="#0F1923" strokeWidth="1.5" />
              </svg>
              <span className="text-[9.5px] font-bold tracking-widest text-[#34D399] uppercase mt-0.5">
                ASC III
              </span>
            </div>
          </div>

          <div className="bg-[#172330] border border-white/10 px-3.5 py-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#94A3B8] tracking-wider uppercase">Rank Rating</span>
              <span data-testid="metric-rating" className="text-[#34D399] font-mono-tabular">
                {profile.tierProgress} / 100 RR
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full bg-[#0A1118] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#19C37D] to-[#FF4655]"
                style={{ width: `${profile.tierProgress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { k: 'ACS', v: '264' },
              { k: 'K/D', v: '1.34' },
              { k: 'HS %', v: '31.4%' },
              { k: 'Win %', v: `${profile.winRatePct.toFixed(0)}%` },
            ].map((st) => (
              <div
                key={st.k}
                className="bg-[#15212E] border-t-2 border-[#FF4655]/80 px-2 py-2 text-center"
              >
                <p className="text-[10px] font-bold tracking-wider text-[#94A3B8]">{st.k}</p>
                <p className="text-[16px] font-black text-[#ECE8E1] font-mono-tabular mt-0.5">
                  {st.v}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11.5px] text-[#94A3B8] pt-1 border-t border-white/10">
            <span className="inline-flex items-center gap-1.5 text-[#ECE8E1] font-semibold">
              <Swords className="w-3.5 h-3.5 text-[#FF4655]" />
              Omen · Clove · Jett
            </span>
            <span className="font-mono-tabular">{unifiedId}</span>
          </div>
        </div>
      </section>
    );
  }

  // ===========================================================================
  // 4. GTA — Rockstar / Vice City Neon Social Club Crew Passport
  // ===========================================================================
  if (gameKey === 'gta') {
    return (
      <section
        data-testid="game-native-profile-card"
        data-game-theme="gta"
        aria-label="GTA Social Club Crew Profile Card"
        className="rounded-[22px] border border-[#EC4899]/60 bg-gradient-to-br from-[#1C0929] via-[#140A24] to-[#0A1726] text-white shadow-[0_24px_56px_rgba(236,72,153,0.24)] overflow-hidden"
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#06B6D4]" />

        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-[#EC4899] bg-[#0B0612] shrink-0">
                <img
                  src={plateUrl}
                  alt={matchedCharacter.nameEn}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded-xs bg-[#EC4899] text-white text-[10px] font-black tracking-wider">
                    [VPH]
                  </span>
                  <h2
                    data-testid="active-game-handle"
                    className="text-[19px] font-black tracking-tight text-white truncate"
                  >
                    {profile.handle}
                  </h2>
                </div>
                <p className="text-[11.5px] text-[#67E8F9] mt-0.5 truncate">
                  {displayName} · Vice Phantoms Crew
                </p>
              </div>
            </div>

            {/* Signature GTA Wanted Stars */}
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-0.5" aria-label="Wanted level 4 of 5">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <Star
                    key={idx}
                    className={`w-3.5 h-3.5 ${
                      idx < 4 ? 'text-[#FDE047] fill-[#FDE047]' : 'text-white/20'
                    }`}
                  />
                ))}
              </div>
              <span
                data-testid="metric-rating"
                className="text-[15px] font-black text-[#F472B6] font-mono-tabular mt-1"
              >
                {profile.competitiveRating.toLocaleString()} REP
              </span>
            </div>
          </div>

          {/* Heist Bank & Crew Cut */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-black/35 border border-[#EC4899]/30 px-3.5 py-2.5">
              <p className="text-[10px] font-bold tracking-widest text-[#F9A8D4] uppercase">
                Heist Vault Cut
              </p>
              <p className="text-[22px] font-black text-[#4ADE80] font-mono-tabular mt-0.5">
                $4.2M
              </p>
            </div>
            <div className="rounded-xl bg-black/35 border border-[#06B6D4]/30 px-3.5 py-2.5">
              <p className="text-[10px] font-bold tracking-widest text-[#67E8F9] uppercase">
                Crew Standing
              </p>
              <p className="text-[22px] font-black text-white font-mono-tabular mt-0.5">
                #2 VICE
              </p>
            </div>
          </div>

          {/* Classic GTA Online Skill Bars */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-white/10">
            {[
              { label: 'Driving', val: 94 },
              { label: 'Shooting', val: 88 },
              { label: 'Stealth', val: 82 },
              { label: 'Flying', val: 79 },
            ].map((sk) => (
              <div key={sk.label} className="flex flex-col gap-1">
                <div className="flex justify-between text-[10.5px] font-bold text-slate-300">
                  <span>{sk.label}</span>
                  <span className="font-mono-tabular text-[#22D3EE]">{sk.val}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#EC4899] to-[#06B6D4]"
                    style={{ width: `${sk.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ===========================================================================
  // 5. RDR2 — Red Dead Redemption 2 Outlaw Bounty & Honor Ledger
  // ===========================================================================
  if (gameKey === 'rdr2') {
    return (
      <section
        data-testid="game-native-profile-card"
        data-game-theme="rdr2"
        aria-label="Red Dead Redemption 2 Outlaw Ledger Card"
        className="rounded-[14px] border-2 border-[#D97706]/70 bg-gradient-to-b from-[#23100A] via-[#1B0D08] to-[#120805] text-[#F5E6C8] shadow-[0_24px_56px_rgba(185,28,28,0.26)] overflow-hidden"
      >
        <div className="px-5 py-2.5 bg-[#B91C1C] text-[#F5E6C8] flex items-center justify-between">
          <span className="text-[11px] font-black tracking-[0.22em] uppercase">
            WANTED · DEAD OR ALIVE
          </span>
          <span className="text-[12px] font-black font-mono-tabular">$1,850 BOUNTY</span>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-15 h-16 rounded-md overflow-hidden border-2 border-[#D97706]/80 bg-[#0D0604] shrink-0">
              <img
                src={plateUrl}
                alt={matchedCharacter.nameEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                data-testid="active-game-handle"
                className="text-[20px] font-black tracking-wide text-[#F5E6C8] truncate"
              >
                {profile.handle}
              </h2>
              <p className="text-[11.5px] text-[#E5B874] mt-0.5">
                {displayName} · Posse: Red Eagle
              </p>
              <p className="text-[11px] text-[#C89F72] mt-0.5">
                Territory: Valentine & Heartlands
              </p>
            </div>
          </div>

          {/* Signature RDR2 Honor Gauge */}
          <div className="rounded-lg bg-black/35 border border-[#D97706]/35 px-3.5 py-2.5">
            <div className="flex items-center justify-between text-[10.5px] font-bold uppercase tracking-wider">
              <span className="text-[#EF4444]">Outlaw</span>
              <span className="text-[#F5E6C8]">Honor · High</span>
              <span className="text-[#FBBF24]">Honorable</span>
            </div>
            <div className="relative mt-2 h-2 rounded-full bg-gradient-to-r from-[#991B1B] via-[#78716C] to-[#F5E6C8]">
              <span className="absolute top-1/2 left-[78%] -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#F5E6C8] border-2 border-[#120805]" />
            </div>
          </div>

          {/* RDR2 Cores Strip */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { k: 'Dead Eye', v: 'LVL 8' },
              { k: 'Territory', v: `${profile.competitiveRating}` },
              { k: 'Duel WR', v: `${profile.winRatePct.toFixed(0)}%` },
            ].map((st) => (
              <div
                key={st.k}
                className="rounded-md bg-[#2A140D] border border-[#D97706]/30 px-2.5 py-2 text-center"
              >
                <p className="text-[10px] font-bold text-[#D9A86C] uppercase">{st.k}</p>
                <p
                  data-testid={st.k === 'Territory' ? 'metric-rating' : undefined}
                  className="text-[16px] font-black text-[#F5E6C8] font-mono-tabular mt-0.5"
                >
                  {st.v}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ===========================================================================
  // 6. WARZONE — Call of Duty: Warzone Tactical Operator Dossier
  // ===========================================================================
  if (gameKey === 'warzone') {
    return (
      <section
        data-testid="game-native-profile-card"
        data-game-theme="warzone"
        aria-label="Call of Duty Warzone Operator Dossier"
        className="rounded-[12px] border border-[#F59E0B]/55 bg-[#120F0A] text-[#FEF3C7] shadow-[0_22px_54px_rgba(0,0,0,0.45)] overflow-hidden"
      >
        <div className="px-5 py-3 bg-gradient-to-r from-[#241A0C] via-[#1B140A] to-[#120F0A] border-b border-[#F59E0B]/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-md overflow-hidden border border-[#F59E0B]/80 bg-black shrink-0">
              <img
                src={plateUrl}
                alt={matchedCharacter.nameEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold tracking-[0.2em] text-[#F59E0B] uppercase">
                PRESTIGE 12 · CRIMSON III
              </p>
              <h2
                data-testid="active-game-handle"
                className="text-[18px] font-black text-white truncate"
              >
                {profile.handle}
              </h2>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p
              data-testid="metric-rating"
              className="text-[20px] font-black text-[#F59E0B] font-mono-tabular leading-none"
            >
              {profile.competitiveRating.toLocaleString()}
            </p>
            <p className="text-[10px] font-bold text-amber-200/70 uppercase mt-1">Ranked SR</p>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-3.5">
          <div className="grid grid-cols-4 gap-2">
            {[
              { k: 'K/D', v: '2.46' },
              { k: 'Wins', v: `${profile.verifiedMatchesCount}` },
              { k: 'Avg Dmg', v: '3.8K' },
              { k: 'Top 5', v: '64%' },
            ].map((st) => (
              <div
                key={st.k}
                className="rounded-md bg-[#1D170E] border border-[#F59E0B]/25 px-2 py-2 text-center"
              >
                <p className="text-[10px] font-bold text-amber-200/65 uppercase">{st.k}</p>
                <p className="text-[16px] font-black text-white font-mono-tabular mt-0.5">
                  {st.v}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-[#1A140C] border border-white/10 px-3.5 py-2.5 flex items-center justify-between text-[11.5px]">
            <span className="inline-flex items-center gap-1.5 text-amber-100 font-semibold">
              <Target className="w-3.5 h-3.5 text-[#F59E0B]" />
              Loadout: MCW · Kar98k
            </span>
            <span className="text-amber-300/80 font-mono-tabular">Urzikstan</span>
          </div>
        </div>
      </section>
    );
  }

  // ===========================================================================
  // 7. APEX LEGENDS — Authentic Corner-Clipped Ranked Master Banner Card
  // ===========================================================================
  if (gameKey === 'apex') {
    return (
      <section
        data-testid="game-native-profile-card"
        data-game-theme="apex"
        aria-label="Apex Legends Ranked Banner Card"
        className="relative bg-[#0E1017] text-white border border-[#DA292A]/70 shadow-[0_24px_56px_rgba(218,41,42,0.22)] overflow-hidden"
        style={{
          clipPath:
            'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
        }}
      >
        <div className="px-5 py-3 bg-gradient-to-r from-[#DA292A] via-[#991B1B] to-[#1A1318] flex items-center justify-between">
          <span className="text-[11px] font-black tracking-[0.2em] uppercase">
            APEX MASTER · SPLIT 2
          </span>
          <span
            data-testid="metric-rating"
            className="text-[14px] font-black font-mono-tabular text-white"
          >
            {profile.competitiveRating.toLocaleString()} RP
          </span>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-16 overflow-hidden border-2 border-[#DA292A] bg-black shrink-0">
              <img
                src={plateUrl}
                alt={matchedCharacter.nameEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                data-testid="active-game-handle"
                className="text-[19px] font-black tracking-tight text-white truncate"
              >
                {profile.handle}
              </h2>
              <p className="text-[11.5px] text-slate-300 mt-0.5">
                {displayName} · Wraith / Horizon Main
              </p>
              {/* 3 Iconic Apex Badges */}
              <div className="flex items-center gap-2 mt-2">
                {['4K DMG', '20 BOMB', 'MASTER'].map((badge) => (
                  <span
                    key={badge}
                    className="px-2 py-0.5 bg-[#DA292A]/20 border border-[#DA292A]/60 text-[9.5px] font-black tracking-wider text-rose-200"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Authentic Horizontal Apex Stat Trackers */}
          <div className="flex flex-col gap-2">
            {[
              { k: 'SEASON KILLS', v: '6,412' },
              { k: 'CAREER DAMAGE', v: '2,184,900' },
              { k: 'AVG MATCH DMG', v: '3,460' },
            ].map((tr) => (
              <div
                key={tr.k}
                className="flex items-center justify-between bg-[#161924] border-l-4 border-[#DA292A] px-3.5 py-2"
              >
                <span className="text-[10.5px] font-bold tracking-widest text-slate-400">
                  {tr.k}
                </span>
                <span className="text-[16px] font-black text-white font-mono-tabular">
                  {tr.v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ===========================================================================
  // 8. NBA 2K — Authentic MyPLAYER Pro-AM Hardwood Card
  // ===========================================================================
  if (gameKey === 'nba2k') {
    return (
      <section
        data-testid="game-native-profile-card"
        data-game-theme="nba2k"
        aria-label="NBA 2K MyPLAYER Pro-AM Card"
        className="rounded-[22px] border border-[#F97316]/65 bg-gradient-to-br from-[#20100A] via-[#1A0D1E] to-[#110908] text-white shadow-[0_24px_56px_rgba(249,115,22,0.24)] overflow-hidden"
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-[#F97316] via-[#FDE047] to-[#A855F7]" />

        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-14 h-16 rounded-xl overflow-hidden border-2 border-[#F97316] bg-black shrink-0">
                <img
                  src={plateUrl}
                  alt={matchedCharacter.nameEn}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black tracking-[0.2em] text-[#FDE047] uppercase">
                  PG · PLAYMAKING SHOT CREATOR
                </p>
                <h2
                  data-testid="active-game-handle"
                  className="text-[19px] font-black text-white truncate mt-0.5"
                >
                  {profile.handle}
                </h2>
                <p className="text-[11.5px] text-orange-200/80 mt-0.5">
                  {displayName} · Tehran Kings Pro-AM
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F97316] to-[#A855F7] text-white shrink-0">
              <span
                data-testid="metric-rating"
                className="text-[28px] font-black leading-none font-mono-tabular"
              >
                {profile.competitiveRating}
              </span>
              <span className="text-[9px] font-extrabold tracking-widest uppercase">OVR</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { k: 'PPG', v: '28.4' },
              { k: 'APG', v: '9.2' },
              { k: '3PT%', v: '64%' },
              { k: 'WIN%', v: `${profile.winRatePct.toFixed(0)}%` },
            ].map((st) => (
              <div
                key={st.k}
                className="rounded-xl bg-black/35 border border-[#F97316]/30 px-2 py-2.5 text-center"
              >
                <p className="text-[10px] font-bold text-orange-200/75">{st.k}</p>
                <p className="text-[16px] font-black text-white font-mono-tabular mt-0.5">
                  {st.v}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11.5px] pt-2 border-t border-white/10">
            <span className="inline-flex items-center gap-1.5 text-[#FDE047] font-bold">
              <Award className="w-3.5 h-3.5 text-[#A855F7]" />
              HOF: Limitless Range · Ankle Breaker
            </span>
            <span className="text-slate-300 font-mono-tabular">18-4</span>
          </div>
        </div>
      </section>
    );
  }

  // ===========================================================================
  // 9. FORTNITE — Authentic FNCS Unreal Career Banner
  // ===========================================================================
  if (gameKey === 'fortnite') {
    return (
      <section
        data-testid="game-native-profile-card"
        data-game-theme="fortnite"
        aria-label="Fortnite FNCS Unreal Career Card"
        className="rounded-[22px] border-2 border-[#38BDF8]/65 bg-gradient-to-br from-[#0F2354] via-[#0B1738] to-[#070E24] text-white shadow-[0_24px_56px_rgba(59,130,246,0.32)] overflow-hidden"
      >
        <div className="px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#0284C7] flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-[0.18em] uppercase text-white">
            <Crown className="w-3.5 h-3.5 text-[#FACC15]" />
            RANKED UNREAL · FNCS
          </span>
          <span className="text-[11.5px] font-black text-[#FACC15] font-mono-tabular">
            42 CROWN WINS
          </span>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-[#38BDF8] bg-[#060C1D] shrink-0">
                <img
                  src={plateUrl}
                  alt={matchedCharacter.nameEn}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="min-w-0">
                <h2
                  data-testid="active-game-handle"
                  className="text-[19px] font-black text-white truncate"
                >
                  {profile.handle}
                </h2>
                <p className="text-[11.5px] text-sky-200/85 mt-0.5">
                  {displayName} · Storm Squad IGL
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p
                data-testid="metric-rating"
                className="text-[22px] font-black text-[#FACC15] font-mono-tabular leading-none"
              >
                {profile.competitiveRating.toLocaleString()}
              </p>
              <p className="text-[10px] font-bold text-sky-200 uppercase mt-1">FNCS PR</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { k: 'VR', v: '42' },
              { k: 'K/D', v: '4.8' },
              { k: 'WIN%', v: `${profile.winRatePct.toFixed(0)}%` },
              { k: 'TOP 10', v: '78%' },
            ].map((st) => (
              <div
                key={st.k}
                className="rounded-xl bg-[#07112B] border border-[#38BDF8]/30 px-2 py-2.5 text-center"
              >
                <p className="text-[10px] font-bold text-sky-300/80">{st.k}</p>
                <p className="text-[16px] font-black text-white font-mono-tabular mt-0.5">
                  {st.v}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ===========================================================================
  // 10. DOTA 2 — Authentic Immortal Battle Profile Card
  // ===========================================================================
  if (gameKey === 'dota2') {
    return (
      <section
        data-testid="game-native-profile-card"
        data-game-theme="dota2"
        aria-label="Dota 2 Immortal Battle Profile Card"
        className="rounded-[16px] border border-[#0EA5E9]/55 bg-gradient-to-b from-[#081A2C] via-[#061220] to-[#040B14] text-white shadow-[0_24px_56px_rgba(14,165,233,0.24)] overflow-hidden"
      >
        <div className="px-5 py-3 bg-gradient-to-r from-[#0C253D] via-[#132234] to-[#071320] border-b border-[#F59E0B]/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-13 h-13 rounded-lg overflow-hidden border-2 border-[#F59E0B] bg-black shrink-0">
              <img
                src={plateUrl}
                alt={matchedCharacter.nameEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold tracking-[0.2em] text-[#F59E0B] uppercase">
                IMMORTAL · RANK #1,420
              </p>
              <h2
                data-testid="active-game-handle"
                className="text-[18px] font-black text-white truncate"
              >
                {profile.handle}
              </h2>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p
              data-testid="metric-rating"
              className="text-[21px] font-black text-[#38BDF8] font-mono-tabular leading-none"
            >
              {profile.competitiveRating.toLocaleString()}
            </p>
            <p className="text-[10px] font-bold text-amber-300/80 uppercase mt-1">MMR</p>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-3.5">
          <div className="grid grid-cols-4 gap-2">
            {[
              { k: 'KDA', v: '5.4' },
              { k: 'GPM', v: '692' },
              { k: 'XPM', v: '785' },
              { k: 'WIN%', v: `${profile.winRatePct.toFixed(0)}%` },
            ].map((st) => (
              <div
                key={st.k}
                className="rounded-lg bg-[#0A1E33] border border-[#0EA5E9]/25 px-2 py-2 text-center"
              >
                <p className="text-[10px] font-bold text-sky-300/75">{st.k}</p>
                <p className="text-[16px] font-black text-white font-mono-tabular mt-0.5">
                  {st.v}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11.5px] pt-2 border-t border-white/10">
            <span className="inline-flex items-center gap-1.5 text-amber-200 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#0EA5E9]" />
              Invoker · Storm Spirit · Ember
            </span>
            <span className="text-sky-300 font-mono-tabular">Pos 2 Mid</span>
          </div>
        </div>
      </section>
    );
  }

  // ===========================================================================
  // 11. F1 — Authentic Formula 1 Super Licence & Pit-Wall Telemetry Card
  // ===========================================================================
  if (gameKey === 'f1') {
    return (
      <section
        data-testid="game-native-profile-card"
        data-game-theme="f1"
        aria-label="Formula 1 Super Licence Telemetry Card"
        className="rounded-[14px] border border-[#FF1E00]/65 bg-[#0C0F16] text-white shadow-[0_24px_56px_rgba(255,30,0,0.22)] overflow-hidden flex"
      >
        {/* Signature F1 Racing Red Left Stripe */}
        <div className="w-2 bg-[#FF1E00] shrink-0" />

        <div className="flex-1 p-5 flex flex-col gap-4 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-13 h-14 rounded-lg overflow-hidden border border-[#FF1E00]/75 bg-black shrink-0">
                <img
                  src={plateUrl}
                  alt={matchedCharacter.nameEn}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black tracking-[0.2em] text-[#FF3B1F] uppercase">
                  SUPER LICENCE S+ · P1 POLE
                </p>
                <h2
                  data-testid="active-game-handle"
                  className="text-[18px] font-black tracking-wide text-white truncate mt-0.5"
                >
                  {profile.handle}
                </h2>
                <p className="text-[11px] text-slate-400">Persia Motorsport · #10</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p
                data-testid="metric-rating"
                className="text-[24px] font-black text-white font-mono-tabular leading-none"
              >
                {profile.competitiveRating}
              </p>
              <p className="text-[10px] font-bold text-[#FF3B1F] uppercase mt-1">PTS</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { k: 'FAST LAP', v: '1:18.4' },
              { k: 'POLES', v: '9' },
              { k: 'PODIUMS', v: '15' },
              { k: 'DRS EFF', v: '96%' },
            ].map((st) => (
              <div
                key={st.k}
                className="rounded-md bg-[#141925] border border-white/10 px-2 py-2 text-center"
              >
                <p className="text-[9.5px] font-bold text-slate-400">{st.k}</p>
                <p className="text-[15px] font-black text-white font-mono-tabular mt-0.5">
                  {st.v}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11.5px] pt-2 border-t border-white/10">
            <span className="inline-flex items-center gap-1.5 text-slate-200 font-semibold">
              <Gauge className="w-3.5 h-3.5 text-[#FF1E00]" />
              Compound: Soft (S) · Inter (I)
            </span>
            <span className="text-[#38BDF8] font-mono-tabular">DRS READY</span>
          </div>
        </div>
      </section>
    );
  }

  // ===========================================================================
  // 12. CHESS 10s — Authentic Chess.com Master / Hyperbullet Profile Card
  // ===========================================================================
  if (gameKey === 'chess') {
    return (
      <section
        data-testid="game-native-profile-card"
        data-game-theme="chess"
        aria-label="Chess 10s Grandmaster Profile Card"
        className="rounded-[18px] border border-[#81B64C]/55 bg-[#262421] text-[#F4F1EA] shadow-[0_22px_54px_rgba(0,0,0,0.40)] overflow-hidden"
      >
        <div className="h-2 w-full grid grid-cols-16 opacity-85" aria-hidden="true">
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className={i % 2 === 0 ? 'bg-[#81B64C]' : 'bg-[#EEEED2]/85'} />
          ))}
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-[#81B64C] bg-[#1A1816] shrink-0">
              <img
                src={plateUrl}
                alt={matchedCharacter.nameEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded-xs bg-[#B33430] text-white text-[11px] font-black tracking-wide leading-none">
                  CM
                </span>
                <h2
                  data-testid="active-game-handle"
                  className="text-[19px] font-extrabold text-white truncate"
                >
                  {profile.handle}
                </h2>
                <Crown className="w-4 h-4 text-[#FBBF24] shrink-0" />
              </div>
              <p className="text-[12px] text-[#BABABA] mt-0.5 truncate">
                {displayName} · IR · {profile.verifiedMatchesCount} Rated Games
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-[#312E2B] border border-[#81B64C]/40 px-3 py-3 text-center">
              <Zap className="w-4 h-4 text-[#F59E0B] mx-auto" />
              <p className="text-[10.5px] font-semibold text-[#C7C4BE] mt-1">Hyper 10s</p>
              <p
                data-testid="metric-rating"
                className="text-[21px] font-black text-white font-mono-tabular mt-0.5 leading-none"
              >
                {profile.competitiveRating}
              </p>
            </div>

            <div className="rounded-xl bg-[#312E2B] border border-white/5 px-3 py-3 text-center">
              <Flame className="w-4 h-4 text-[#E6912C] mx-auto" />
              <p className="text-[10.5px] font-semibold text-[#C7C4BE] mt-1">Bullet 1m</p>
              <p className="text-[21px] font-black text-[#F4F1EA] font-mono-tabular mt-0.5 leading-none">
                {profile.competitiveRating + 46}
              </p>
            </div>

            <div className="rounded-xl bg-[#312E2B] border border-white/5 px-3 py-3 text-center">
              <Timer className="w-4 h-4 text-[#81B64C] mx-auto" />
              <p className="text-[10.5px] font-semibold text-[#C7C4BE] mt-1">Blitz 3m</p>
              <p className="text-[21px] font-black text-[#F4F1EA] font-mono-tabular mt-0.5 leading-none">
                {profile.competitiveRating - 28}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="font-bold text-[#81B64C] font-mono-tabular">
                {profile.winRatePct.toFixed(0)}% Win
              </span>
              <span className="text-[#A8A59E] font-mono-tabular">11% Draw</span>
              <span className="font-bold text-[#CA3431] font-mono-tabular">
                {(100 - Math.round(profile.winRatePct) - 11).toFixed(0)}% Loss
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-[#1B1917]">
              <div className="bg-[#81B64C]" style={{ width: `${profile.winRatePct}%` }} />
              <div className="bg-[#8B8982]" style={{ width: '11%' }} />
              <div className="bg-[#CA3431] flex-1" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[12px] text-[#D1CEC7] pt-1">
            <span>
              CAPS Accuracy:{' '}
              <strong className="text-[#81B64C] font-mono-tabular">
                {profile.tacticalConsistencyPct.toFixed(1)}%
              </strong>
            </span>
            <span className="text-[#A8A59E]">Sicilian Najdorf</span>
          </div>
        </div>
      </section>
    );
  }

  // ===========================================================================
  // 13. UNIFIED — Dark Obsidian AIPETROS Spatial Identity Passport (Never white!)
  // ===========================================================================
  return (
    <section
      data-testid="game-native-profile-card"
      data-game-theme="unified"
      aria-label="Unified Spatial Identity Card"
      className="rounded-[24px] border border-sky-400/30 bg-[#0B1426]/90 text-white shadow-[0_22px_54px_rgba(2,132,199,0.20)] p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold tracking-tight text-white truncate">
            {displayName}
          </h2>
          <p className="text-[12px] text-slate-400 mt-0.5 font-mono-tabular truncate">
            <span data-testid="active-game-handle" className="text-sky-300 font-semibold">
              {profile.handle}
            </span>{' '}
            · {unifiedId}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p
            data-testid="metric-rating"
            className="text-[22px] font-extrabold text-sky-400 font-mono-tabular leading-none"
          >
            {profile.competitiveRating.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{profile.tierLabel}</p>
        </div>
      </div>

      <div
        dir="rtl"
        className="flex items-center justify-between gap-3 pt-3.5 border-t border-white/10"
      >
        <div className="min-w-0">
          <p className="text-[11px] text-slate-400">همزاد انتخاب‌شده از ۵۰ اسطوره گیم</p>
          <p className="text-[14px] font-bold text-white mt-0.5 truncate">
            {matchedCharacter.nameFa}{' '}
            <span className="font-normal text-slate-400 text-[12px]">
              ({matchedCharacter.franchise})
            </span>
          </p>
        </div>
        <span className="text-[13px] font-bold text-sky-400 font-mono-tabular shrink-0">
          {similarityPct}% تطابق
        </span>
      </div>

      {userTraitsFa.length > 0 && (
        <div dir="rtl" className="text-[12px] text-slate-300 pt-2.5 border-t border-white/10">
          {userTraitsFa.join(' · ')}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
        <div>
          <p className="text-[11px] text-slate-400">Win Rate</p>
          <p className="text-[16px] font-bold text-white font-mono-tabular mt-0.5">
            {profile.winRatePct.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">Consistency</p>
          <p className="text-[16px] font-bold text-white font-mono-tabular mt-0.5">
            {profile.tacticalConsistencyPct.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">اکانت متصل</p>
          <p className="text-[16px] font-bold text-white font-mono-tabular mt-0.5">
            {linkedCount}
          </p>
        </div>
      </div>
    </section>
  );
};
