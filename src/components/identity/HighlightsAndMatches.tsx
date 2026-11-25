import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Film, Play, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import type {
  CrossGameKey,
  HighlightClipItem,
  VerifiedMatchRecord,
} from '../../data/offlineAgentsData';

interface HighlightsAndMatchesProps {
  clips: HighlightClipItem[];
  matches: VerifiedMatchRecord[];
  activeGameKey: CrossGameKey;
  previewClip: HighlightClipItem | null;
  onOpenPreview: (clip: HighlightClipItem) => void;
  onClosePreview: () => void;
  onVerifyMatch: (matchId: string) => void;
}

export const HighlightsAndMatches: React.FC<HighlightsAndMatchesProps> = ({
  clips,
  matches,
  activeGameKey,
  previewClip,
  onOpenPreview,
  onClosePreview,
  onVerifyMatch,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'Verified' | 'Local Queue' | 'Disputed'>('all');
  const [activeKeyframeIdx, setActiveKeyframeIdx] = useState(0);

  const visibleClips = useMemo(
    () =>
      activeGameKey === 'unified'
        ? clips
        : clips.filter((c) => c.gameKey === activeGameKey),
    [clips, activeGameKey]
  );

  const visibleMatches = useMemo(() => {
    return matches.filter((m) => {
      if (activeGameKey !== 'unified' && m.gameKey !== activeGameKey) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      return true;
    });
  }, [matches, activeGameKey, statusFilter]);

  return (
    <section
      aria-label="Curated Match and Highlight Stream"
      data-testid="highlights-and-matches-section"
      className="flex flex-col gap-6"
    >
      {/* Curated Highlights Grid */}
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Auto-Clipped Key Sequences
            </p>
            <h2 className="text-[22px] font-bold tracking-tight text-slate-900 mt-0.5">
              Curated Highlights
            </h2>
          </div>
          <span className="text-[12px] text-slate-500 font-mono-tabular">
            {visibleClips.length} {visibleClips.length === 1 ? 'clip' : 'clips'} indexed locally
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {visibleClips.map((clip) => (
            <article
              key={clip.id}
              data-testid={`highlight-card-${clip.id}`}
              className="rounded-[24px] border border-slate-200/90 bg-white/85 backdrop-blur-xl shadow-[0_12px_32px_rgba(15,23,42,0.05)] p-5 flex flex-col justify-between gap-4"
            >
              <div>
                {/* Crisp architectural storyboard preview header */}
                <div className="relative h-28 rounded-2xl bg-[#EEF2F7] border border-slate-200/80 overflow-hidden p-3 flex flex-col justify-between mb-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold text-white"
                      style={{ backgroundColor: clip.accentHex }}
                    >
                      {clip.gameTitle}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/90 border border-slate-200 text-[10.5px] font-bold text-slate-800 font-mono-tabular">
                      {clip.durationLabel}
                    </span>
                  </div>

                  {/* Minimalist intensity waveform bars */}
                  <div className="flex items-end gap-1.5 h-8 px-1" aria-hidden="true">
                    {clip.keyframeNotes.map((kf, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm transition-all"
                        style={{
                          height: `${Math.max(24, kf.intensityPct)}%`,
                          backgroundColor: clip.accentHex,
                          opacity: 0.28 + i * 0.26,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <h3 className="text-[15px] font-bold text-slate-900 leading-snug">
                  {clip.title}
                </h3>
                <p className="text-[12px] text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                  {clip.summary}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-mono-tabular">
                  {clip.timestampLabel}
                </span>
                <button
                  type="button"
                  data-testid={`preview-highlight-${clip.id}`}
                  onClick={() => {
                    setActiveKeyframeIdx(0);
                    onOpenPreview(clip);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11.5px] font-semibold hover:bg-slate-800 transition cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>Quick Preview</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Verified Match History List */}
      <div className="rounded-[24px] border border-slate-200/90 bg-white/85 backdrop-blur-xl shadow-[0_12px_32px_rgba(15,23,42,0.05)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200/80">
          <div>
            <h3 className="text-[16px] font-bold text-slate-900">
              Verified Match History
            </h3>
            <p className="text-[12px] text-slate-500">
              Compact deterministic ledger of cross-game verified scoreboards
            </p>
          </div>

          <div
            role="group"
            aria-label="Filter matches by verification status"
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/80"
          >
            {(['all', 'Verified', 'Local Queue', 'Disputed'] as const).map((f) => (
              <button
                key={f}
                type="button"
                data-testid={`match-filter-${f.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                  statusFilter === f
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-5">Game</th>
                <th className="py-2.5 px-3">Opponent / Mode</th>
                <th className="py-2.5 px-3 text-right">Final Score</th>
                <th className="py-2.5 px-3">Played</th>
                <th className="py-2.5 px-5 text-right">Integrity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 text-[12.5px]">
              {visibleMatches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 px-5 text-center text-slate-500">
                    No match records match the current filter.
                  </td>
                </tr>
              ) : (
                visibleMatches.map((m) => (
                  <tr
                    key={m.id}
                    data-testid={`match-row-${m.id}`}
                    className="hover:bg-slate-50/80 transition"
                  >
                    <td className="py-3 px-5 font-semibold text-slate-900 whitespace-nowrap">
                      {m.gameTitle}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{m.opponentOrMode}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono-tabular whitespace-nowrap">
                      {m.finalScore}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono-tabular whitespace-nowrap">
                      {m.playedAt}
                    </td>
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      {m.status === 'Verified' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : m.status === 'Local Queue' ? (
                        <button
                          type="button"
                          onClick={() => onVerifyMatch(m.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-[11px] font-semibold cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Verify Now
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Disputed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Highlight Preview Modal */}
      {previewClip && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="highlight-preview-title"
          data-testid="highlight-preview-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-[28px] bg-white border border-slate-200 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                  <Film className="w-3.5 h-3.5" />
                  <span>
                    {previewClip.gameTitle} · {previewClip.durationLabel}
                  </span>
                </div>
                <h3
                  id="highlight-preview-title"
                  className="text-[18px] font-bold text-slate-900 mt-0.5"
                >
                  {previewClip.title}
                </h3>
              </div>

              <button
                type="button"
                aria-label="Close highlight preview"
                data-testid="close-highlight-modal-btn"
                onClick={onClosePreview}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Interactive Keyframe Timeline Stage */}
            <div className="rounded-2xl bg-[#EEF2F7] border border-slate-200 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {previewClip.momentTag}
                </span>
                <span className="font-mono-tabular font-bold text-slate-800">
                  Frame {previewClip.keyframeNotes[activeKeyframeIdx]?.timeLabel ?? '0:00'}
                </span>
              </div>

              <p className="text-[13.5px] font-semibold text-slate-900 min-h-[42px]">
                {previewClip.keyframeNotes[activeKeyframeIdx]?.note ?? previewClip.summary}
              </p>

              <div className="grid grid-cols-3 gap-2">
                {previewClip.keyframeNotes.map((kf, idx) => {
                  const selected = idx === activeKeyframeIdx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveKeyframeIdx(idx)}
                      className={`px-3 py-2 rounded-xl border text-left transition cursor-pointer ${
                        selected
                          ? 'bg-white border-slate-900 shadow-xs'
                          : 'bg-white/60 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <p className="text-[11px] font-bold font-mono-tabular text-slate-900">
                        {kf.timeLabel}
                      </p>
                      <p className="text-[10.5px] text-slate-500 truncate">
                        Peak {kf.intensityPct}%
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[12.5px] text-slate-600 leading-relaxed">
              {previewClip.summary}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
