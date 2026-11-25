import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import type { CrossGameHandleProfile } from '../../data/offlineAgentsData';

interface IdentityCardProps {
  unifiedId: string;
  displayName: string;
  profile: CrossGameHandleProfile;
  lastLocalSyncAt: string;
  onQuickInspectAgents: () => void;
}

export const IdentityCard: React.FC<IdentityCardProps> = ({
  unifiedId,
  displayName,
  profile,
  lastLocalSyncAt,
  onQuickInspectAgents,
}) => {
  const ringRadius = 32;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const dashOffset = ringCircumference * (1 - Math.min(100, Math.max(0, profile.tierProgress)) / 100);

  return (
    <section
      aria-label="Unified Cross-Game Spatial Identity Card"
      data-testid="spatial-identity-card"
      className="rounded-[28px] border border-slate-200/90 bg-white/85 backdrop-blur-xl shadow-[0_18px_48px_rgba(15,23,42,0.06)] p-6 flex flex-col gap-5"
    >
      {/* Identity Header + Skill Tier SVG Ring */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-semibold mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>{profile.presenceStatus}</span>
          </div>

          <h2 className="text-[22px] leading-tight font-bold tracking-tight text-slate-900 truncate">
            {displayName}
          </h2>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-slate-600">
            <span
              data-testid="active-game-handle"
              className="font-semibold text-slate-900"
            >
              {profile.handle}
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-mono-tabular text-[11.5px] text-slate-500">
              {unifiedId}
            </span>
          </div>

          <p className="mt-1.5 text-[11.5px] font-medium text-slate-500">
            {profile.gameTitle} · {profile.regionTag}
          </p>
        </div>

        {/* SVG Skill Tier Ring */}
        <div
          className="relative w-20 h-20 shrink-0 flex items-center justify-center"
          aria-label={`Skill tier ${profile.tierLabel} at ${profile.tierProgress}%`}
        >
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r={ringRadius}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="6"
            />
            <circle
              cx="40"
              cy="40"
              r={ringRadius}
              fill="none"
              stroke={profile.accentHex}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[14px] font-bold text-slate-900 font-mono-tabular leading-none">
              {profile.tierProgress}%
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mt-1">
              Tier
            </span>
          </div>
        </div>
      </div>

      {/* Core Tabular Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200/80">
        <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200/70 px-3.5 py-3">
          <p className="text-[11px] font-medium text-slate-500">Win Rate</p>
          <p
            data-testid="metric-win-rate"
            className="mt-1 text-[20px] font-bold text-slate-900 font-mono-tabular leading-none"
          >
            {profile.winRatePct.toFixed(1)}%
          </p>
        </div>

        <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200/70 px-3.5 py-3">
          <p className="text-[11px] font-medium text-slate-500">Consistency</p>
          <p
            data-testid="metric-consistency"
            className="mt-1 text-[20px] font-bold text-slate-900 font-mono-tabular leading-none"
          >
            {profile.tacticalConsistencyPct.toFixed(1)}%
          </p>
        </div>

        <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200/70 px-3.5 py-3">
          <p className="text-[11px] font-medium text-slate-500 truncate">
            {profile.ratingLabel}
          </p>
          <p
            data-testid="metric-rating"
            className="mt-1 text-[20px] font-bold font-mono-tabular leading-none"
            style={{ color: profile.accentHex }}
          >
            {profile.competitiveRating.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tier Summary & Offline Ready Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
        <div className="flex items-center gap-2 text-[12px] text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong className="font-semibold text-slate-900">{profile.tierLabel}</strong> ·{' '}
            <span className="font-mono-tabular">{profile.verifiedMatchesCount}</span> verified matches
          </span>
        </div>

        <button
          type="button"
          data-testid="identity-open-agents-btn"
          onClick={onQuickInspectAgents}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Inspect 5 Offline Agents</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-400 font-mono-tabular -mt-2">
        Local state snapshot synced · {lastLocalSyncAt}
      </p>
    </section>
  );
};
