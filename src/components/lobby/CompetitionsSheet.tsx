import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Flag, Gavel, ShieldAlert, Trophy, X } from 'lucide-react';
import type { EcosystemState } from '../../types/aipetros';

interface CompetitionsSheetProps {
  state: EcosystemState;
  onClose: () => void;
  onCaptureSector: (id: string) => Promise<void>;
  onJoinCup: (id: string) => Promise<void>;
  onRunReview: (caseId: string) => Promise<void>;
  onVote: (caseId: string, decision: 'uphold' | 'acquit') => Promise<void>;
}

export function CompetitionsSheet({
  state,
  onClose,
  onCaptureSector,
  onJoinCup,
  onRunReview,
  onVote,
}: CompetitionsSheetProps) {
  const [tab, setTab] = useState<'sectors' | 'cups' | 'fair-play'>('sectors');
  const [selectedSectorId, setSelectedSectorId] = useState(state.territories[0]?.id ?? 'lon-uk');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedSector =
    state.territories.find((t) => t.id === selectedSectorId) ?? state.territories[0];
  const activeCase = state.highCourtCases[0];

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="aaa-sheet absolute inset-x-0 bottom-[104px] top-[64px] z-20 flex flex-col overflow-hidden rounded-t-3xl px-4 pb-4 pt-3"
      role="region"
      aria-label="Competitions"
    >
      <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-white/20" />

      <div className="flex shrink-0 items-center justify-between pb-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-wide text-[#F4F5F7]">
            Competitions
          </h2>
          <p className="text-xs text-[#F4F5F7]/60">Club wars, weekend cups & fair play</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Competitions"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-[#F4F5F7]/75 hover:bg-white/15"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Clean Segmented Tabs */}
      <div className="mb-3 flex shrink-0 rounded-xl bg-[#0A0B0E] p-1">
        {[
          { id: 'sectors' as const, label: 'Global Map' },
          { id: 'cups' as const, label: 'Weekend Cups' },
          { id: 'fair-play' as const, label: 'Fair Play' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setFeedback(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
              tab === item.id ? 'bg-[#CCFF00] text-[#0A0B0E]' : 'text-[#F4F5F7]/65'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'sectors' && selectedSector && (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="aaa-scroll flex-1 space-y-2.5 overflow-y-auto pr-0.5">
            {state.territories.map((t) => {
              const selected = t.id === selectedSector.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedSectorId(t.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                    selected
                      ? 'border-[#CCFF00]/70 bg-[#161920]'
                      : 'border-white/8 bg-[#0A0B0E]/70 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-[#F4F5F7]">{t.name}</div>
                    <div className="text-[11px] text-[#F4F5F7]/55">
                      Held by {t.controllingClub} · {t.region}
                    </div>
                  </div>
                  <div className="text-right font-mono-tabular">
                    <div className="text-xs font-bold text-[#CCFF00]">+{t.bonusPointsPerDay} Pts</div>
                    <div className="text-[10px] text-[#F4F5F7]/50">DEF {t.defenseStrength}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {feedback && <p className="shrink-0 text-xs font-medium text-[#CCFF00]">{feedback}</p>}

          <button
            type="button"
            disabled={busyId === selectedSector.id}
            onClick={async () => {
              setBusyId(selectedSector.id);
              try {
                await onCaptureSector(selectedSector.id);
                setFeedback(`${selectedSector.name} claimed for ${state.profile.clubName}.`);
              } finally {
                setBusyId(null);
              }
            }}
            className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#CCFF00] text-sm font-bold text-[#0A0B0E] transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            <Flag className="h-4 w-4" />
            {selectedSector.controllingClub === state.profile.clubName
              ? `Defend ${selectedSector.name}`
              : `Claim ${selectedSector.name}`}
          </button>
        </div>
      )}

      {tab === 'cups' && (
        <div className="aaa-scroll flex-1 space-y-3 overflow-y-auto pr-0.5">
          {state.tournaments.map((cup) => (
            <div
              key={cup.id}
              className="space-y-3 rounded-2xl border border-white/10 bg-[#0A0B0E]/80 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-[#F4F5F7]">{cup.name}</div>
                  <div className="mt-0.5 text-xs text-[#F4F5F7]/60">
                    {cup.roundLabel} · {cup.participantsCount}/{cup.maxParticipants} Clubs
                  </div>
                </div>
                <span className="flex items-center gap-1 font-mono-tabular text-xs font-bold text-[#CCFF00]">
                  <Trophy className="h-3.5 w-3.5" />
                  {cup.prizePoolPoints.toLocaleString()} Pts
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[#F4F5F7]/75">{cup.activeChaosRule}</p>
              <button
                type="button"
                disabled={cup.joined}
                onClick={() => onJoinCup(cup.id)}
                className={`flex h-11 w-full items-center justify-center rounded-xl text-xs font-bold ${
                  cup.joined
                    ? 'border border-[#CCFF00]/40 bg-[#CCFF00]/15 text-[#CCFF00]'
                    : 'bg-[#CCFF00] text-[#0A0B0E]'
                }`}
              >
                {cup.joined ? 'Entered in Cup' : 'Enter Weekend Cup'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'fair-play' && activeCase && (
        <div className="aaa-scroll flex-1 space-y-3.5 overflow-y-auto pr-0.5">
          <div className="rounded-2xl border border-white/10 bg-[#0A0B0E]/80 p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
              <ShieldAlert className="h-4 w-4" />
              Match Integrity Review
            </div>
            <h3 className="mt-1 text-sm font-bold text-[#F4F5F7]">{activeCase.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#F4F5F7]/70">{activeCase.summary}</p>

            {activeCase.evidenceImageUrl && (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black">
                <img
                  src={activeCase.evidenceImageUrl}
                  alt="Submitted match frame"
                  referrerPolicy="no-referrer"
                  className="max-h-40 w-full object-contain"
                />
              </div>
            )}

            {activeCase.aiProsecutorBrief ? (
              <div className="mt-3 rounded-xl border border-[#CCFF00]/30 bg-[#CCFF00]/10 p-3 text-xs text-[#F4F5F7]">
                <div className="font-semibold text-[#CCFF00]">
                  AI Review ({activeCase.aiProsecutorBrief.confidence}% confidence)
                </div>
                <p className="mt-1 text-[#F4F5F7]/85">
                  {activeCase.aiProsecutorBrief.forensicFindings[0]}
                </p>
              </div>
            ) : (
              <button
                type="button"
                disabled={busyId === activeCase.id}
                onClick={async () => {
                  setBusyId(activeCase.id);
                  try {
                    await onRunReview(activeCase.id);
                  } finally {
                    setBusyId(null);
                  }
                }}
                className="mt-3 flex h-10 w-full items-center justify-center rounded-xl border border-white/12 bg-white/8 text-xs font-semibold text-[#F4F5F7] hover:bg-white/15"
              >
                {busyId === activeCase.id ? 'Checking Evidence...' : 'Run AI Evidence Check'}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between px-1 font-mono-tabular text-xs text-[#F4F5F7]/70">
            <span>
              Uphold {activeCase.votesUphold} · Clear {activeCase.votesAcquit}
            </span>
            <span>
              Quorum {activeCase.votesUphold + activeCase.votesAcquit}/{activeCase.quorumTarget}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={activeCase.status !== 'open_deliberation'}
              onClick={() => onVote(activeCase.id, 'uphold')}
              className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-white/10 text-xs font-bold text-[#F4F5F7] hover:bg-rose-500/25 disabled:opacity-45"
            >
              <Gavel className="h-4 w-4" />
              Uphold Penalty
            </button>
            <button
              type="button"
              disabled={activeCase.status !== 'open_deliberation'}
              onClick={() => onVote(activeCase.id, 'acquit')}
              className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-[#CCFF00] text-xs font-bold text-[#0A0B0E] disabled:opacity-45"
            >
              <CheckCircle2 className="h-4 w-4" />
              Clear Player
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
