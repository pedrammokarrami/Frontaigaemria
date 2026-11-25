import { useEffect, useState } from 'react';
import { Camera, CheckCircle2, ShieldAlert, Sparkles, Upload, X } from 'lucide-react';
import { MEDIA_ASSETS } from '../config/mediaAssets';
import type { SupportedGame, TerritoryNode } from '../types/aipetros';

interface LogMatchModalProps {
  open: boolean;
  territories: TerritoryNode[];
  onClose: () => void;
  onExtractVision: (
    image: string,
    game: SupportedGame
  ) => Promise<{
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    metricsSummary: string;
    tamperingSuspected: boolean;
    anomalyReason: string;
    confidencePercent: number;
  }>;
  onSubmitMatch: (payload: {
    game: SupportedGame;
    opponent: string;
    result: 'win' | 'loss' | 'draw';
    scoreDisplay: string;
    metricsSummary: string;
    screenshotUrl?: string;
    aiConfidence?: number;
    territoryId?: string;
  }) => Promise<void>;
}

export function LogMatchModal({
  open,
  territories,
  onClose,
  onExtractVision,
  onSubmitMatch,
}: LogMatchModalProps) {
  const [game, setGame] = useState<SupportedGame>('EA SPORTS FC Pro Clubs');
  const [imagePreview, setImagePreview] = useState<string>(MEDIA_ASSETS.sampleMatchCapture);
  const [opponent, setOpponent] = useState('Madrid Titans');
  const [scoreDisplay, setScoreDisplay] = useState('3 - 1');
  const [result, setResult] = useState<'win' | 'loss' | 'draw'>('win');
  const [metricsSummary, setMetricsSummary] = useState('58% Poss · 89% Pass · 2.4 xG');
  const [territoryId, setTerritoryId] = useState<string>('man-uk');
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [visionReport, setVisionReport] = useState<{
    tamperingSuspected: boolean;
    anomalyReason: string;
    confidencePercent: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImagePreview(reader.result);
        setVisionReport(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunVision = async () => {
    if (!imagePreview) return;
    setExtracting(true);
    setErrorMsg(null);
    try {
      const parsed = await onExtractVision(imagePreview, game);
      setOpponent(parsed.awayTeam || opponent);
      setScoreDisplay(`${parsed.homeScore} - ${parsed.awayScore}`);
      setResult(
        parsed.homeScore > parsed.awayScore
          ? 'win'
          : parsed.homeScore < parsed.awayScore
            ? 'loss'
            : 'draw'
      );
      setMetricsSummary(parsed.metricsSummary);
      setVisionReport({
        tamperingSuspected: parsed.tamperingSuspected,
        anomalyReason: parsed.anomalyReason,
        confidencePercent: parsed.confidencePercent,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Match analysis failed.');
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponent.trim() || !scoreDisplay.trim()) {
      setErrorMsg('Opponent club and final score are required.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmitMatch({
        game,
        opponent: opponent.trim(),
        result,
        scoreDisplay: scoreDisplay.trim(),
        metricsSummary: metricsSummary.trim(),
        screenshotUrl: imagePreview,
        aiConfidence: visionReport?.confidencePercent ?? 95,
        territoryId: territoryId || undefined,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to submit match.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-center bg-black/75 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-match-title"
    >
      <div className="aaa-sheet aaa-scroll max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" />

        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h2 id="log-match-title" className="font-display text-2xl font-bold tracking-tight text-[#F4F5F7]">
              Match Analysis
            </h2>
            <p className="mt-0.5 text-xs text-[#F4F5F7]/60">
              Upload your scoreboard screenshot for instant AI verification.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close match analysis"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-[#F4F5F7]/70 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-5 gap-2.5">
            <div className="col-span-2">
              <label htmlFor="match-game" className="block text-[11px] font-medium text-[#F4F5F7]/70">
                Game
              </label>
              <select
                id="match-game"
                value={game}
                onChange={(e) => setGame(e.target.value as SupportedGame)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-2.5 py-2.5 text-xs text-[#F4F5F7] focus:border-[#CCFF00] focus:outline-none"
              >
                <option value="EA SPORTS FC Pro Clubs">EA FC Pro Clubs</option>
                <option value="Call of Duty">Call of Duty</option>
                <option value="Backgammon">Backgammon</option>
              </select>
            </div>
            <div className="col-span-3">
              <label htmlFor="match-territory" className="block text-[11px] font-medium text-[#F4F5F7]/70">
                Competition Sector
              </label>
              <select
                id="match-territory"
                value={territoryId}
                onChange={(e) => setTerritoryId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-2.5 py-2.5 text-xs text-[#F4F5F7] focus:border-[#CCFF00] focus:outline-none"
              >
                <option value="">Friendly Match</option>
                {territories.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Match Screenshot Upload */}
          <div className="rounded-2xl border border-white/10 bg-[#0A0B0E]/80 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#F4F5F7]">
                <Camera className="h-4 w-4 text-[#CCFF00]" />
                Scoreboard Capture
              </span>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/8 px-3 py-1.5 text-[11px] font-medium text-[#F4F5F7] hover:bg-white/15">
                <Upload className="h-3.5 w-3.5" />
                Upload Photo
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            {imagePreview && (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black">
                <img
                  src={imagePreview}
                  alt="Post-match scoreboard capture"
                  referrerPolicy="no-referrer"
                  className="max-h-40 w-full object-contain"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleRunVision}
              disabled={extracting}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/8 text-xs font-semibold text-[#F4F5F7] transition-colors hover:bg-white/15 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 text-[#CCFF00]" />
              {extracting ? 'Scanning Scoreboard...' : 'Scan Scoreboard with AI'}
            </button>

            {visionReport && (
              <div
                className={`mt-2.5 flex items-center gap-1.5 text-xs font-medium ${
                  visionReport.tamperingSuspected ? 'text-amber-300' : 'text-[#CCFF00]'
                }`}
              >
                {visionReport.tamperingSuspected ? (
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                )}
                <span>
                  {visionReport.tamperingSuspected
                    ? `Flagged: ${visionReport.anomalyReason}`
                    : `Verified Match (${visionReport.confidencePercent}% confidence)`}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label htmlFor="match-opponent" className="block text-[11px] font-medium text-[#F4F5F7]/70">
                Opponent Club
              </label>
              <input
                id="match-opponent"
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 py-2 text-xs text-[#F4F5F7] focus:border-[#CCFF00] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="match-score" className="block text-[11px] font-medium text-[#F4F5F7]/70">
                Score
              </label>
              <input
                id="match-score"
                type="text"
                value={scoreDisplay}
                onChange={(e) => setScoreDisplay(e.target.value)}
                className="font-mono-tabular mt-1 w-full rounded-xl border border-white/10 bg-[#0A0B0E] px-3 py-2 text-xs text-[#F4F5F7] focus:border-[#CCFF00] focus:outline-none"
              />
            </div>
          </div>

          {errorMsg && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#CCFF00] text-sm font-bold text-[#0A0B0E] transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? 'Submitting Match...' : 'Submit Match Result'}
          </button>
        </form>
      </div>
    </div>
  );
}
