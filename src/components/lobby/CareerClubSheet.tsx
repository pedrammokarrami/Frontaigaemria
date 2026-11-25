import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Link2, ShieldCheck, Users, X } from 'lucide-react';
import { MEDIA_ASSETS } from '../../config/mediaAssets';
import type { EcosystemState, SupportedGame } from '../../types/aipetros';
import { computeCompositeDNA } from '../../utils/aipetrosRules';
import { AvatarModelViewer } from './AvatarModelViewer';

interface CareerClubSheetProps {
  state: EcosystemState;
  avatarGlbUrl: string | null;
  onClose: () => void;
  onSyncChess: (username: string, provider: 'chesscom' | 'lichess') => Promise<void>;
  onCaptainDecision: (matchId: string, decision: 'approve' | 'dispute') => Promise<void>;
  onAdvanceEscrow: (id: string) => Promise<void>;
  onCreateContract: (payload: {
    playerHandle: string;
    role: string;
    game: SupportedGame;
    lockedPoints: number;
    winsRequired: number;
  }) => Promise<void>;
}

export function CareerClubSheet({
  state,
  avatarGlbUrl,
  onClose,
  onSyncChess,
  onCaptainDecision,
  onAdvanceEscrow,
  onCreateContract,
}: CareerClubSheetProps) {
  const [manageMode, setManageMode] = useState(false);
  const [chessUser, setChessUser] = useState('Hikaru');
  const [provider, setProvider] = useState<'chesscom' | 'lichess'>('chesscom');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const ovr = computeCompositeDNA(state.profile.skillDNA);
  const pendingMatches = state.matches.filter((m) => m.verificationStatus === 'pending_captain');
  const activeContract = state.escrows.find((e) => e.status === 'active_locked');

  const cardStats = [
    { label: 'VIS', val: state.profile.skillDNA.tacticalVision },
    { label: 'PAS', val: state.profile.skillDNA.spatialPassing },
    { label: 'ANT', val: state.profile.skillDNA.trapAnticipation },
    { label: 'CMP', val: state.profile.skillDNA.endgameComposure },
    { label: 'TMP', val: state.profile.skillDNA.tempoControl },
    { label: 'DSC', val: state.profile.skillDNA.riskDiscipline },
  ];

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="aaa-sheet absolute inset-x-0 bottom-[104px] top-[64px] z-20 flex flex-col overflow-hidden rounded-t-3xl px-4 pb-4 pt-3"
      role="region"
      aria-label="Career ID and Club Hub"
    >
      <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-white/20" />

      <div className="flex shrink-0 items-center justify-between pb-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-wide text-[#F4F5F7]">
            {manageMode ? 'Squad & Stats' : 'Career ID'}
          </h2>
          <p className="text-xs text-[#F4F5F7]/60">{state.profile.clubName}</p>
        </div>
        <button
          type="button"
          onClick={() => (manageMode ? setManageMode(false) : onClose())}
          aria-label={manageMode ? 'Back to Career ID' : 'Close Career ID'}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-[#F4F5F7]/75 hover:bg-white/15"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!manageMode ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="aaa-scroll flex-1 space-y-3 overflow-y-auto pr-0.5">
            {/* EA FC Ultimate Player Card */}
            <div
              className="relative overflow-hidden rounded-3xl border border-[#CCFF00]/35 p-5"
              style={{
                background:
                  'linear-gradient(155deg, rgba(28, 33, 44, 0.96) 0%, rgba(10, 11, 14, 0.98) 72%, rgba(204, 255, 0, 0.08) 100%)',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-display text-5xl font-extrabold leading-none text-[#CCFF00]">
                    {ovr}
                  </div>
                  <div className="font-display text-lg font-bold tracking-wider text-[#F4F5F7]">
                    CAM
                  </div>
                  <img
                    src={MEDIA_ASSETS.clubCrest}
                    alt={state.profile.clubName}
                    referrerPolicy="no-referrer"
                    className="mt-2 h-11 w-11 rounded-xl border border-white/10 object-cover"
                  />
                </div>

                <AvatarModelViewer
                  glbUrl={avatarGlbUrl}
                  fallbackImage={MEDIA_ASSETS.playerAvatar}
                  alt={state.profile.displayName}
                />
              </div>

              <div className="mt-4 border-b border-white/10 pb-3">
                <div className="font-display text-2xl font-extrabold tracking-wide text-[#F4F5F7]">
                  {state.profile.handle.toUpperCase()}
                </div>
                <div className="text-xs text-[#F4F5F7]/65">
                  {state.profile.region} · {state.profile.wallet.reputation} Rep ·{' '}
                  {state.profile.wallet.platformPoints.toLocaleString()} Pts
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-y-2.5">
                {cardStats.map((st) => (
                  <div key={st.label} className="flex items-baseline gap-2">
                    <span className="font-mono-tabular text-base font-bold text-[#F4F5F7]">
                      {st.val}
                    </span>
                    <span className="text-xs font-semibold text-[#F4F5F7]/55">{st.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Games */}
            <div className="space-y-2">
              {state.profile.linkedAccounts.map((acc) => (
                <div
                  key={`${acc.game}-${acc.handle}`}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-[#0A0B0E]/70 px-4 py-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-[#F4F5F7]">{acc.game}</div>
                    <div className="text-[11px] text-[#F4F5F7]/55">{acc.handle}</div>
                  </div>
                  <div className="font-mono-tabular font-bold text-[#CCFF00]">
                    {acc.ratingValue}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setManageMode(true)}
            className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#CCFF00] text-sm font-bold text-[#0A0B0E] transition-transform active:scale-[0.98]"
          >
            <Users className="h-4 w-4" />
            Manage Squad & Sync Stats
          </button>
        </div>
      ) : (
        <div className="aaa-scroll flex-1 space-y-4 overflow-y-auto pr-0.5">
          {/* Sync Live Chess Stats */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!chessUser.trim()) return;
              setSyncing(true);
              setSyncStatus(null);
              try {
                await onSyncChess(chessUser.trim(), provider);
                setSyncStatus('Live rating synced to Career ID.');
              } catch (err) {
                setSyncStatus(err instanceof Error ? err.message : 'Unable to sync right now.');
              } finally {
                setSyncing(false);
              }
            }}
            className="space-y-2.5 rounded-2xl border border-white/10 bg-[#0A0B0E]/80 p-4"
          >
            <div className="text-xs font-semibold text-[#F4F5F7]">Link Chess Rating</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setProvider('chesscom')}
                className={`flex-1 rounded-xl py-2 text-xs font-semibold ${
                  provider === 'chesscom'
                    ? 'bg-[#CCFF00] text-[#0A0B0E]'
                    : 'bg-white/8 text-[#F4F5F7]/75'
                }`}
              >
                Chess.com
              </button>
              <button
                type="button"
                onClick={() => setProvider('lichess')}
                className={`flex-1 rounded-xl py-2 text-xs font-semibold ${
                  provider === 'lichess'
                    ? 'bg-[#CCFF00] text-[#0A0B0E]'
                    : 'bg-white/8 text-[#F4F5F7]/75'
                }`}
              >
                Lichess
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={chessUser}
                onChange={(e) => setChessUser(e.target.value)}
                aria-label="Chess Username"
                placeholder="Username"
                className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#161920] px-3 text-xs text-[#F4F5F7] focus:border-[#CCFF00] focus:outline-none"
              />
              <button
                type="submit"
                disabled={syncing}
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white/12 px-4 text-xs font-semibold text-[#F4F5F7] hover:bg-white/20"
              >
                <Link2 className="h-3.5 w-3.5 text-[#CCFF00]" />
                {syncing ? 'Syncing' : 'Sync'}
              </button>
            </div>
            {syncStatus && <p className="text-xs text-[#CCFF00]">{syncStatus}</p>}
          </form>

          {/* Pending Captain Approvals */}
          {pendingMatches.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-white/10 bg-[#0A0B0E]/80 p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F4F5F7]">
                <ShieldCheck className="h-4 w-4 text-[#CCFF00]" />
                Captain Match Review
              </div>
              {pendingMatches.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 pt-1 text-xs">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[#F4F5F7]">
                      vs {m.opponent} ({m.scoreDisplay})
                    </div>
                    <div className="truncate text-[11px] text-[#F4F5F7]/55">{m.metricsSummary}</div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onCaptainDecision(m.id, 'approve')}
                      className="rounded-lg bg-[#CCFF00] px-3 py-1.5 text-[11px] font-bold text-[#0A0B0E]"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => onCaptainDecision(m.id, 'dispute')}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-[#F4F5F7]"
                    >
                      Dispute
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Squad Trial & Scouting */}
          {activeContract && (
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0A0B0E]/80 p-4 text-xs">
              <div>
                <div className="font-semibold text-[#F4F5F7]">
                  Active Contract · {activeContract.playerHandle}
                </div>
                <div className="mt-0.5 text-[11px] text-[#F4F5F7]/60">
                  {activeContract.winsCompleted}/{activeContract.winsRequired} Wins ·{' '}
                  {activeContract.lockedPoints} Pts Bonus
                </div>
              </div>
              <button
                type="button"
                onClick={() => onAdvanceEscrow(activeContract.id)}
                className="flex items-center gap-1 rounded-xl bg-white/12 px-3 py-2 text-[11px] font-semibold text-[#CCFF00] hover:bg-white/20"
              >
                <Check className="h-3.5 w-3.5" />
                Log Win
              </button>
            </div>
          )}

          {/* Top Scout Pool */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#F4F5F7]/70">Recommended Free Agents</div>
            {state.scoutPool.slice(0, 2).map((sc) => (
              <div
                key={sc.id}
                className="flex items-center justify-between rounded-2xl border border-white/8 bg-[#0A0B0E]/70 px-4 py-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-[#F4F5F7]">
                    {sc.handle} · {sc.role}
                  </div>
                  <div className="text-[11px] text-[#F4F5F7]/55">{sc.dnaMatchPercent}% Playstyle Fit</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onCreateContract({
                      playerHandle: sc.handle,
                      role: sc.role,
                      game: sc.primaryGame,
                      lockedPoints: sc.askingEscrowPoints,
                      winsRequired: 3,
                    })
                  }
                  className="rounded-xl bg-white/10 px-3 py-2 text-[11px] font-semibold text-[#F4F5F7] hover:bg-[#CCFF00] hover:text-[#0A0B0E]"
                >
                  Sign Trial
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
