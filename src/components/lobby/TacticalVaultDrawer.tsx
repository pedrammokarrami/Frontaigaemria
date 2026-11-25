import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Award, Check, Lock, ShieldCheck, Sparkles, Wallet, X } from 'lucide-react';
import type { GamerProfile } from '../../types/aipetros';

interface TacticalVaultDrawerProps {
  open: boolean;
  profile: GamerProfile;
  onClose: () => void;
  onClaimMission: (missionId: string) => Promise<void>;
}

export function TacticalVaultDrawer({
  open,
  profile,
  onClose,
  onClaimMission,
}: TacticalVaultDrawerProps) {
  const [tab, setTab] = useState<'missions' | 'wallet'>('missions');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const level = Math.floor(profile.wallet.xp / 1000) + 1;
  const levelProgressPct = Math.round(((profile.wallet.xp % 1000) / 1000) * 100);
  const reputationPct = Math.min(100, Math.round((profile.wallet.reputation / 1000) * 100));

  return (
    <AnimatePresence>
      {open && (
        <div
          className="absolute inset-0 z-40 flex justify-end bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-label="Tactical Vault and Missions"
        >
          {/* Backdrop tap to close */}
          <button
            type="button"
            aria-label="Close Tactical Vault backdrop"
            onClick={onClose}
            className="flex-1 cursor-default bg-transparent"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="aaa-sheet flex h-full w-[90%] max-w-[356px] flex-col border-l border-white/12 px-4 pb-5 pt-4"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between pb-3">
              <div>
                <h2 className="font-display text-2xl font-extrabold tracking-wide text-[#F4F5F7]">
                  TACTICAL VAULT
                </h2>
                <p className="text-[11px] font-medium text-[#F4F5F7]/60">
                  Missions & Multi-Tier Balance
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Tactical Vault"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-[#F4F5F7]/75 hover:bg-white/15"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Clean Two-Tab Switcher */}
            <div className="mb-4 flex shrink-0 rounded-xl bg-[#0A0B0E] p-1">
              <button
                type="button"
                onClick={() => setTab('missions')}
                className={`flex-1 rounded-lg py-2 text-xs font-bold tracking-wide transition-colors ${
                  tab === 'missions' ? 'bg-[#CCFF00] text-[#0A0B0E]' : 'text-[#F4F5F7]/65'
                }`}
              >
                DAILY MISSIONS
              </button>
              <button
                type="button"
                onClick={() => setTab('wallet')}
                className={`flex-1 rounded-lg py-2 text-xs font-bold tracking-wide transition-colors ${
                  tab === 'wallet' ? 'bg-[#CCFF00] text-[#0A0B0E]' : 'text-[#F4F5F7]/65'
                }`}
              >
                DIGITAL WALLET
              </button>
            </div>

            {/* Tab Content */}
            <div className="aaa-scroll flex-1 overflow-y-auto pr-0.5">
              {tab === 'missions' ? (
                <div className="space-y-3">
                  {profile.missions.map((ms) => {
                    const readyToClaim = ms.completed && !ms.claimed;
                    const claimed = ms.claimed;

                    return (
                      <div
                        key={ms.id}
                        className={`rounded-2xl border p-4 transition-colors ${
                          readyToClaim
                            ? 'border-[#CCFF00]/60 bg-[#161920]'
                            : 'border-white/10 bg-[#0A0B0E]/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold text-[#F4F5F7]">{ms.title}</div>
                            <div className="mt-1 font-mono-tabular text-[11px] font-semibold text-[#CCFF00]">
                              +{ms.rewardXp} XP · +{ms.rewardPoints} PTS
                            </div>
                          </div>
                          <span className="font-mono-tabular text-xs font-bold text-[#F4F5F7]/70">
                            {ms.progress}/{ms.target}
                          </span>
                        </div>

                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-[#CCFF00] transition-all duration-300"
                            style={{ width: `${Math.min(100, (ms.progress / ms.target) * 100)}%` }}
                          />
                        </div>

                        <div className="mt-3">
                          {claimed ? (
                            <div className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-[#F4F5F7]/60">
                              <Check className="h-3.5 w-3.5 text-[#CCFF00]" />
                              CLAIMED
                            </div>
                          ) : readyToClaim ? (
                            <button
                              type="button"
                              disabled={claimingId === ms.id}
                              onClick={async () => {
                                setClaimingId(ms.id);
                                try {
                                  await onClaimMission(ms.id);
                                } finally {
                                  setClaimingId(null);
                                }
                              }}
                              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#CCFF00] text-xs font-extrabold tracking-wide text-[#0A0B0E] transition-transform active:scale-[0.98] disabled:opacity-50"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              {claimingId === ms.id ? 'CLAIMING...' : 'CLAIM'}
                            </button>
                          ) : (
                            <div className="flex h-10 w-full items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-[11px] font-medium text-[#F4F5F7]/50">
                              In Progress
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 1. XP & Level */}
                  <div className="rounded-2xl border border-white/10 bg-[#0A0B0E]/80 p-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-semibold text-[#F4F5F7]">
                        <Award className="h-4 w-4 text-[#CCFF00]" />
                        XP & Level
                      </span>
                      <span className="font-display text-lg font-extrabold text-[#CCFF00]">
                        LVL {level}
                      </span>
                    </div>
                    <div className="mt-1.5 font-mono-tabular text-xl font-bold text-[#F4F5F7]">
                      {profile.wallet.xp.toLocaleString()} XP
                    </div>
                    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#CCFF00]"
                        style={{ width: `${levelProgressPct}%` }}
                      />
                    </div>
                    <div className="mt-1.5 text-[11px] text-[#F4F5F7]/55">
                      Season progression · {1000 - (profile.wallet.xp % 1000)} XP to Level {level + 1}
                    </div>
                  </div>

                  {/* 2. Reputation Score */}
                  <div className="rounded-2xl border border-white/10 bg-[#0A0B0E]/80 p-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-semibold text-[#F4F5F7]">
                        <ShieldCheck className="h-4 w-4 text-[#CCFF00]" />
                        Reputation Score
                      </span>
                      <span className="font-mono-tabular text-xs font-bold text-[#F4F5F7]/80">
                        Tier {profile.avatarTier}
                      </span>
                    </div>
                    <div className="mt-1.5 font-mono-tabular text-xl font-bold text-[#F4F5F7]">
                      {profile.wallet.reputation} <span className="text-xs text-[#F4F5F7]/45">/ 1000</span>
                    </div>
                    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#F4F5F7]"
                        style={{ width: `${reputationPct}%` }}
                      />
                    </div>
                    <div className="mt-1.5 text-[11px] text-[#F4F5F7]/55">
                      Non-transferable Fair Play trust metric
                    </div>
                  </div>

                  {/* 3. Platform Points (PTS) */}
                  <div className="rounded-2xl border border-white/10 bg-[#0A0B0E]/80 p-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-semibold text-[#F4F5F7]">
                        <Wallet className="h-4 w-4 text-[#CCFF00]" />
                        Platform Points (PTS)
                      </span>
                    </div>
                    <div className="mt-1.5 font-mono-tabular text-xl font-bold text-[#CCFF00]">
                      {profile.wallet.platformPoints.toLocaleString()} PTS
                    </div>
                    <div className="mt-1.5 text-[11px] text-[#F4F5F7]/55">
                      Redeemable for Weekend Cups & Squad Escrows
                    </div>
                  </div>

                  {/* 4. Petros Vault (Ready) */}
                  <div className="rounded-2xl border border-white/10 bg-[#161920]/70 p-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-semibold text-[#F4F5F7]">
                        <Lock className="h-4 w-4 text-[#F4F5F7]/70" />
                        Petros Vault (Ready)
                      </span>
                      <span className="font-mono-tabular text-[11px] font-semibold text-[#F4F5F7]/65">
                        {profile.wallet.collectiblesCount} Badges
                      </span>
                    </div>
                    <div className="mt-2.5 rounded-xl border border-white/10 bg-[#0A0B0E]/80 px-3 py-2 text-[11px] font-semibold text-[#F4F5F7]/80">
                      Petros Mainnet Integration: Phase 3 Ready
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
