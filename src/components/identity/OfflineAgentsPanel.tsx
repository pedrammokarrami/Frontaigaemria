import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  Film,
  Hash,
  Scale,
  ShieldCheck,
  Sparkles,
  Timer,
  X,
} from 'lucide-react';
import {
  type AgentSyncStatus,
  type CrossGameKey,
  type DisputeEvidenceCase,
  type HighlightClipItem,
  type OfflineAgentsState,
  RAPID_DRILL_CHALLENGES,
  type RapidDrillChallenge,
} from '../../data/offlineAgentsData';

interface OfflineAgentsPanelProps {
  state: OfflineAgentsState;
  activeGameKey: CrossGameKey;
  onVerifyNextMatch: (matchId?: string) => void;
  onToggleCoachingApplied: (takeawayId: string) => void;
  onRecordDrill: (input: {
    discipline: 'Chess 10s Tactics' | 'FC 27 Passing Lane';
    promptTitle: string;
    reactionSec: number;
    isCorrect: boolean;
  }) => void;
  onResolveDispute: (caseId: string, resolution: 'approve' | 'reopen') => void;
  onGenerateHighlight: () => void;
  onPreviewHighlight: (clip: HighlightClipItem) => void;
}

function StatusBadge({ status }: { status: AgentSyncStatus }) {
  const styles: Record<AgentSyncStatus, string> = {
    Verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Synced: 'bg-sky-50 text-sky-700 border-sky-200',
    'Offline Ready': 'bg-slate-100 text-slate-700 border-slate-200',
    'Local Queue': 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export const OfflineAgentsPanel: React.FC<OfflineAgentsPanelProps> = ({
  state,
  activeGameKey,
  onVerifyNextMatch,
  onToggleCoachingApplied,
  onRecordDrill,
  onResolveDispute,
  onGenerateHighlight,
  onPreviewHighlight,
}) => {
  const [inspectingCaseId, setInspectingCaseId] = useState<string | null>(null);
  const [activeDrill, setActiveDrill] = useState<RapidDrillChallenge | null>(null);
  const [drillStartMs, setDrillStartMs] = useState<number>(0);
  const [drillElapsedSec, setDrillElapsedSec] = useState<number>(0);
  const [drillFeedback, setDrillFeedback] = useState<string | null>(null);

  const inspectingCase: DisputeEvidenceCase | null =
    state.disputeAgent.cases.find((c) => c.id === inspectingCaseId) ?? null;

  useEffect(() => {
    if (!activeDrill) return;
    const interval = window.setInterval(() => {
      const elapsed = Number(((Date.now() - drillStartMs) / 1000).toFixed(1));
      setDrillElapsedSec(Math.min(10.0, elapsed));
    }, 100);
    return () => window.clearInterval(interval);
  }, [activeDrill, drillStartMs]);

  const filteredTakeaways =
    activeGameKey === 'unified'
      ? state.coachingAgent.takeaways
      : state.coachingAgent.takeaways.filter((t) => t.gameKey === activeGameKey);

  const queuedMatches = state.matches.filter((m) => m.status === 'Local Queue');

  const startRapidDrill = (challenge: RapidDrillChallenge) => {
    setActiveDrill(challenge);
    setDrillStartMs(Date.now());
    setDrillElapsedSec(0);
    setDrillFeedback(null);
  };

  const submitDrillOption = (opt: RapidDrillChallenge['options'][number]) => {
    if (!activeDrill) return;
    const elapsed = Math.max(0.8, Math.min(9.9, (Date.now() - drillStartMs) / 1000));
    onRecordDrill({
      discipline: activeDrill.discipline,
      promptTitle: activeDrill.discipline === 'Chess 10s Tactics' ? 'Blitz Fork Spot' : 'Driven Channel Pass',
      reactionSec: Number(elapsed.toFixed(1)),
      isCorrect: opt.isBest,
    });
    setDrillFeedback(`${opt.isBest ? 'Optimal read' : 'Logged'} (${elapsed.toFixed(1)}s): ${opt.explanation}`);
    setActiveDrill(null);
  };

  return (
    <section
      aria-label="Five Offline Server-Side Agents"
      data-testid="offline-agents-panel"
      className="flex flex-col gap-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Local Deterministic Pipeline
          </p>
          <h2 className="text-[22px] font-bold tracking-tight text-slate-900 mt-0.5">
            5 Offline Server-Side Agents
          </h2>
        </div>
        <p className="text-[12.5px] text-slate-500">
          All verification, tactical coaching, 10s drills, dispute inspection & clip generation operate offline-first.
        </p>
      </div>

      {/* Responsive 2-column grid (Agent 3 spans nicely or flows cleanly) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Scoreboard Verification Agent */}
        <article
          data-testid="agent-card-scoreboard"
          className="rounded-[24px] border border-slate-200/90 bg-white/85 backdrop-blur-xl shadow-[0_12px_32px_rgba(15,23,42,0.05)] p-5 flex flex-col justify-between gap-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">
                  1. Scoreboard Verification Agent
                </h3>
                <p className="text-[12px] text-slate-500">
                  Cryptographic local match-state & integrity digest
                </p>
              </div>
            </div>
            <StatusBadge status={state.scoreboardAgent.status} />
          </div>

          <div className="grid grid-cols-3 gap-2.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 p-3.5">
            <div>
              <p className="text-[11px] text-slate-500">Verified</p>
              <p
                data-testid="scoreboard-verified-count"
                className="text-[18px] font-bold text-slate-900 font-mono-tabular mt-0.5"
              >
                {state.scoreboardAgent.verifiedCount}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Local Queue</p>
              <p
                data-testid="scoreboard-queued-count"
                className="text-[18px] font-bold text-amber-700 font-mono-tabular mt-0.5"
              >
                {state.scoreboardAgent.queuedCount}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500">Latest Digest</p>
              <p
                data-testid="scoreboard-latest-hash"
                className="text-[12px] font-semibold text-slate-800 font-mono-tabular truncate mt-1.5"
              >
                {state.scoreboardAgent.latestHash}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] text-slate-500 inline-flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              {queuedMatches.length > 0
                ? `Next in queue: ${queuedMatches[0].gameTitle} (${queuedMatches[0].finalScore})`
                : 'All local match scoreboards verified'}
            </span>
            <button
              type="button"
              data-testid="verify-scoreboard-btn"
              disabled={queuedMatches.length === 0}
              onClick={() => onVerifyNextMatch()}
              className={`px-3.5 py-2 rounded-xl text-[12px] font-semibold transition whitespace-nowrap ${
                queuedMatches.length > 0
                  ? 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {queuedMatches.length > 0 ? 'Verify Queued Match' : 'All Verified'}
            </button>
          </div>
        </article>

        {/* 2. Tactical Coaching Agent */}
        <article
          data-testid="agent-card-coaching"
          className="rounded-[24px] border border-slate-200/90 bg-white/85 backdrop-blur-xl shadow-[0_12px_32px_rgba(15,23,42,0.05)] p-5 flex flex-col gap-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200/80 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-sky-700" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">
                  2. Tactical Coaching Agent
                </h3>
                <p className="text-[12px] text-slate-500">
                  Post-match takeaways & micro-adjustment notes
                </p>
              </div>
            </div>
            <StatusBadge status={state.coachingAgent.status} />
          </div>

          <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
            {filteredTakeaways.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-[#F8FAFC] border border-slate-200/80 p-3 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11.5px] font-bold text-slate-900">
                    {item.gameTitle}
                  </span>
                  <button
                    type="button"
                    data-testid={`toggle-coach-${item.id}`}
                    onClick={() => onToggleCoachingApplied(item.id)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                      item.applied
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {item.applied ? 'Drill Applied' : 'Mark Applied'}
                  </button>
                </div>
                <p className="text-[12px] text-slate-700 leading-snug">
                  {item.postMatchSummary}
                </p>
                <p className="text-[11.5px] text-slate-500">
                  <strong className="font-semibold text-slate-700">Fix:</strong>{' '}
                  {item.microAdjustment}
                </p>
              </div>
            ))}
          </div>
        </article>

        {/* 3. 10-Second Chess & Passing Drills Agent */}
        <article
          data-testid="agent-card-drills"
          className="rounded-[24px] border border-slate-200/90 bg-white/85 backdrop-blur-xl shadow-[0_12px_32px_rgba(15,23,42,0.05)] p-5 flex flex-col gap-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center shrink-0">
                <Timer className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">
                  3. 10-Second Chess & Passing Drills Agent
                </h3>
                <p className="text-[12px] text-slate-500">
                  Rapid decision records & sub-10s execution speed
                </p>
              </div>
            </div>
            <StatusBadge status={state.rapidDrillsAgent.status} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 px-4 py-3">
            <div>
              <p className="text-[11px] text-slate-500">Average Decision Speed</p>
              <p
                data-testid="drills-avg-reaction"
                className="text-[20px] font-bold text-slate-900 font-mono-tabular"
              >
                {state.rapidDrillsAgent.avgReactionSec.toFixed(1)}s{' '}
                <span className="text-[12px] font-medium text-slate-400">
                  / {state.rapidDrillsAgent.targetMaxSec.toFixed(0)}s cap
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {RAPID_DRILL_CHALLENGES.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  data-testid={`start-${ch.id}`}
                  onClick={() => startRapidDrill(ch)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11.5px] font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer whitespace-nowrap"
                >
                  Run {ch.discipline.includes('Chess') ? 'Chess' : 'Passing'} 10s
                </button>
              ))}
            </div>
          </div>

          {activeDrill && (
            <div
              data-testid="active-rapid-drill-box"
              className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-3.5 flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold text-indigo-900">
                  {activeDrill.discipline}
                </span>
                <span className="text-[12px] font-bold font-mono-tabular text-indigo-700 inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {drillElapsedSec.toFixed(1)}s / 10.0s
                </span>
              </div>
              <p className="text-[12.5px] text-slate-800 leading-snug">
                {activeDrill.scenario}
              </p>
              <div className="flex flex-col gap-1.5">
                {activeDrill.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`drill-option-${opt.id}`}
                    onClick={() => submitDrillOption(opt)}
                    className="w-full text-left px-3 py-2 rounded-xl bg-white border border-indigo-200/80 text-[12px] font-medium text-slate-800 hover:border-indigo-400 hover:bg-indigo-50 transition cursor-pointer"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {drillFeedback && (
            <p
              data-testid="drill-feedback-note"
              className="text-[12px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2"
            >
              {drillFeedback}
            </p>
          )}

          <div className="flex flex-col divide-y divide-slate-200/70">
            {state.rapidDrillsAgent.records.slice(0, 4).map((rec) => (
              <div
                key={rec.id}
                className="py-2 flex items-center justify-between gap-2 text-[12px]"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{rec.promptTitle}</p>
                  <p className="text-[11px] text-slate-500">
                    {rec.discipline} · {rec.recordedAt}
                  </p>
                </div>
                <div className="text-right shrink-0 font-mono-tabular">
                  <span className="font-bold text-slate-900">{rec.reactionSec.toFixed(1)}s</span>
                  <span className="ml-2 text-[11px] text-emerald-700 font-semibold">
                    {rec.accuracyPct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* 4. Dispute Evidence Inspection Agent */}
        <article
          data-testid="agent-card-disputes"
          className="rounded-[24px] border border-slate-200/90 bg-white/85 backdrop-blur-xl shadow-[0_12px_32px_rgba(15,23,42,0.05)] p-5 flex flex-col gap-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">
                  4. Dispute Evidence Inspection Agent
                </h3>
                <p className="text-[12px] text-slate-500">
                  Timestamped telemetry checkpoints & resolution drawer
                </p>
              </div>
            </div>
            <StatusBadge status={state.disputeAgent.status} />
          </div>

          <div className="flex flex-col gap-2.5">
            {state.disputeAgent.cases.map((item) => {
              const isOpen = item.status === 'Open Review';
              return (
                <div
                  key={item.id}
                  data-testid={`dispute-case-${item.id}`}
                  className="rounded-2xl bg-[#F8FAFC] border border-slate-200/80 p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          isOpen ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {isOpen ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {item.status}
                      </span>
                      <span className="text-[11px] text-slate-400">· {item.openedAt}</span>
                    </div>
                    <p className="text-[13px] font-bold text-slate-900 truncate mt-1">
                      {item.title}
                    </p>
                    <p className="text-[11.5px] text-slate-500 truncate">
                      {item.gameTitle} · {item.checkpoints.length} checkpoints ·{' '}
                      <span className="font-mono-tabular">{item.evidenceScorePct}% match</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    data-testid={`inspect-dispute-${item.id}`}
                    onClick={() => setInspectingCaseId(item.id)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[12px] font-semibold text-slate-800 hover:bg-slate-100 transition cursor-pointer shrink-0"
                  >
                    Inspect
                  </button>
                </div>
              );
            })}
          </div>
        </article>
      </div>

      {/* 5. Match Highlight Generation Agent (Full Width Feature Strip) */}
      <article
        data-testid="agent-card-highlights"
        className="rounded-[24px] border border-slate-200/90 bg-white/85 backdrop-blur-xl shadow-[0_12px_32px_rgba(15,23,42,0.05)] p-5 flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Film className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">
                5. Match Highlight Generation Agent
              </h3>
              <p className="text-[12px] text-slate-500">
                Auto-clipped key moments linked directly to verified match records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <StatusBadge status={state.highlightAgent.status} />
            <button
              type="button"
              data-testid="generate-highlight-btn"
              onClick={onGenerateHighlight}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Clip from Match</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {state.highlightAgent.clips.slice(0, 3).map((clip) => (
            <div
              key={clip.id}
              className="rounded-2xl bg-[#F8FAFC] border border-slate-200/80 p-3.5 flex flex-col justify-between gap-2.5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">{clip.gameTitle}</span>
                  <span className="font-mono-tabular">{clip.durationLabel}</span>
                </div>
                <p className="text-[13px] font-bold text-slate-900 mt-1 line-clamp-2">
                  {clip.title}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-emerald-700 font-semibold">
                  {clip.momentTag}
                </span>
                <button
                  type="button"
                  onClick={() => onPreviewHighlight(clip)}
                  className="text-[11.5px] font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
                >
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* Dispute Evidence Inspection Modal */}
      {inspectingCase && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dispute-modal-title"
          data-testid="dispute-inspection-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-[28px] bg-white border border-slate-200 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {inspectingCase.gameTitle} · Match {inspectingCase.matchId}
                </p>
                <h3
                  id="dispute-modal-title"
                  className="text-[18px] font-bold text-slate-900 mt-0.5"
                >
                  {inspectingCase.title}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close evidence drawer"
                data-testid="close-dispute-modal-btn"
                onClick={() => setInspectingCaseId(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[13px] text-slate-600 leading-relaxed">
              {inspectingCase.claimSummary}
            </p>

            <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200/80 divide-y divide-slate-200/70">
              {inspectingCase.checkpoints.map((cp, idx) => (
                <div key={idx} className="p-3 flex items-start justify-between gap-3 text-[12px]">
                  <div>
                    <span className="font-mono-tabular font-bold text-slate-900">
                      {cp.timestampLabel}
                    </span>
                    <p className="text-slate-600 mt-0.5">{cp.eventNote}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-mono-tabular text-slate-700 shrink-0">
                    {cp.telemetryDelta}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-[12px] font-semibold text-slate-700">
                Current Status: <span className="text-slate-900">{inspectingCase.status}</span>
              </span>
              <div className="flex items-center gap-2">
                {inspectingCase.status === 'Open Review' ? (
                  <button
                    type="button"
                    data-testid="approve-dispute-btn"
                    onClick={() => {
                      onResolveDispute(inspectingCase.id, 'approve');
                      setInspectingCaseId(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold cursor-pointer"
                  >
                    Approve Integrity
                  </button>
                ) : (
                  <button
                    type="button"
                    data-testid="reopen-dispute-btn"
                    onClick={() => {
                      onResolveDispute(inspectingCase.id, 'reopen');
                      setInspectingCaseId(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-semibold cursor-pointer"
                  >
                    Reopen Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
