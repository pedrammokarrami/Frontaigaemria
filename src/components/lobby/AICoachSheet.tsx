import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Chess } from 'chess.js';
import { Camera, Mic, MicOff, Play, RotateCcw, Send, Timer, X } from 'lucide-react';
import type {
  ChessDrillScenario,
  EcosystemState,
  PitchDrillScenario,
} from '../../types/aipetros';
import { validateChessDrillMove } from '../../utils/aipetrosRules';
import { playTacticalSound } from '../../utils/tacticalAudio';
import { SkillDNAChart } from '../SkillDNAChart';
import { TacticalChessBoard } from './TacticalChessBoard';
import { TacticalPitchDrill } from './TacticalPitchDrill';

interface AICoachSheetProps {
  state: EcosystemState;
  onClose: () => void;
  onOpenMatchUpload: () => void;
  onAskCoach: (message: string) => Promise<string>;
  onCompleteDrill: (mode: '2d-chess' | '3d-pitch', won: boolean) => Promise<void>;
  onGenerateDrill: (
    mode: '2d-chess' | '3d-pitch',
    currentDrillId?: string
  ) => Promise<ChessDrillScenario | PitchDrillScenario>;
}

export function AICoachSheet({
  state,
  onClose,
  onOpenMatchUpload,
  onAskCoach,
  onCompleteDrill,
  onGenerateDrill,
}: AICoachSheetProps) {
  const initialChess = state.activeDrills.find((d) => d.mode === '2d-chess') as ChessDrillScenario;
  const initialPitch = state.activeDrills.find((d) => d.mode === '3d-pitch') as PitchDrillScenario;

  const [drillOpen, setDrillOpen] = useState(false);
  const [drillMode, setDrillMode] = useState<'2d-chess' | '3d-pitch'>('2d-chess');
  const [chessDrill, setChessDrill] = useState<ChessDrillScenario>(initialChess);
  const [pitchDrill, setPitchDrill] = useState<PitchDrillScenario>(initialPitch);
  const [boardFen, setBoardFen] = useState(initialChess.fen);
  const [selectedSq, setSelectedSq] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10.0);
  const [outcome, setOutcome] = useState<{ won: boolean; message: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  // Coach Q&A state
  const [coachInput, setCoachInput] = useState('');
  const [coachReply, setCoachReply] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [listening, setListening] = useState(false);

  // Tactical Pitch defender phase
  const [defenderPhase, setDefenderPhase] = useState(0.4);

  useEffect(() => {
    if (!running) return;
    const started = performance.now();
    const duration =
      (drillMode === '2d-chess' ? chessDrill.durationSec : pitchDrill.durationSec) * 1000;
    const id = window.setInterval(() => {
      const elapsed = performance.now() - started;
      const rem = Math.max(0, (duration - elapsed) / 1000);
      setTimeLeft(rem);
      setDefenderPhase(elapsed / 1000);
      if (rem <= 0) {
        window.clearInterval(id);
        setRunning(false);
        setOutcome({ won: false, message: 'Time expired. Reset and execute within 10s.' });
        void onCompleteDrill(drillMode, false);
      }
    }, 60);
    return () => window.clearInterval(id);
  }, [running, drillMode, chessDrill.durationSec, pitchDrill.durationSec, onCompleteDrill]);

  const startDrill = (targetMode: '2d-chess' | '3d-pitch' = drillMode) => {
    setOutcome(null);
    setSelectedSq(null);
    setLastMove(null);
    setDefenderPhase(0.4);
    setBoardFen(chessDrill.fen);
    setTimeLeft(targetMode === '2d-chess' ? chessDrill.durationSec : pitchDrill.durationSec);
    setRunning(true);
  };

  const handleChessTap = (sq: string) => {
    if (!running || drillMode !== '2d-chess') return;
    if (!selectedSq) {
      const chess = new Chess(boardFen);
      const piece = chess.get(sq as Parameters<Chess['get']>[0]);
      if (piece && piece.color === chessDrill.playerColor) {
        setSelectedSq(sq);
        playTacticalSound('select');
      }
      return;
    }
    if (selectedSq === sq) {
      setSelectedSq(null);
      return;
    }
    const res = validateChessDrillMove(boardFen, selectedSq, sq, chessDrill.expectedMovesUci);
    const fromSq = selectedSq;
    setSelectedSq(null);
    if (!res.legal) {
      // Allow immediate re-selection if player taps another own piece
      const chess = new Chess(boardFen);
      const piece = chess.get(sq as Parameters<Chess['get']>[0]);
      if (piece && piece.color === chessDrill.playerColor) {
        setSelectedSq(sq);
        playTacticalSound('select');
      }
      return;
    }
    setLastMove({ from: fromSq, to: sq });
    setBoardFen(res.nextFen);
    setRunning(false);
    if (res.isWinningMove) {
      playTacticalSound('win');
      setOutcome({ won: true, message: `Checkmate ${res.san} in ${(10 - timeLeft).toFixed(1)}s · +180 XP` });
      void onCompleteDrill('2d-chess', true);
    } else {
      playTacticalSound('miss');
      setOutcome({ won: false, message: `${res.san} missed ${chessDrill.expectedSan}. Run Drill to retry.` });
      void onCompleteDrill('2d-chess', false);
    }
  };

  const handlePitchPassComplete = (evalRes: {
    intercepted: boolean;
    inTargetZone: boolean;
    distanceToTarget: number;
  }) => {
    setRunning(false);
    playTacticalSound('pass');
    window.setTimeout(() => {
      if (evalRes.intercepted) {
        playTacticalSound('miss');
        setOutcome({ won: false, message: 'Pass intercepted by defender. Time the corridor opening.' });
        void onCompleteDrill('3d-pitch', false);
      } else if (evalRes.inTargetZone) {
        playTacticalSound('win');
        setOutcome({ won: true, message: 'Clean half-space through-ball! +180 XP & +90 PTS' });
        void onCompleteDrill('3d-pitch', true);
      } else {
        playTacticalSound('miss');
        setOutcome({ won: false, message: `Missed target pocket by ${evalRes.distanceToTarget}m.` });
        void onCompleteDrill('3d-pitch', false);
      }
    }, 220);
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachInput.trim()) return;
    setAsking(true);
    try {
      const reply = await onAskCoach(coachInput.trim());
      setCoachReply(reply);
      setCoachInput('');
    } finally {
      setAsking(false);
    }
  };

  const handleVoice = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        start: () => void;
        onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        start: () => void;
        onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
      };
    };
    const Rec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Rec) {
      setCoachReply('Voice input is unavailable in this browser. Type your question below.');
      return;
    }
    const rec = new Rec();
    rec.lang = 'en-GB';
    setListening(true);
    rec.onresult = async (ev) => {
      const text = ev.results?.[0]?.[0]?.transcript;
      setListening(false);
      if (text) {
        setAsking(true);
        try {
          setCoachReply(await onAskCoach(text));
        } finally {
          setAsking(false);
        }
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="aaa-sheet aaa-scroll absolute inset-x-0 bottom-[104px] top-[64px] z-20 flex flex-col overflow-y-auto rounded-t-3xl px-4 pb-4 pt-3"
      role="region"
      aria-label="AI Coach"
    >
      <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-white/20" />

      <div className="flex items-center justify-between pb-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-wide text-[#F4F5F7]">
            {drillOpen ? '10-Second Match Drill' : 'AI Coach'}
          </h2>
          <p className="text-xs text-[#F4F5F7]/60">
            {drillOpen ? 'Sharpen your match decision speed' : state.profile.cloneArchetype}
          </p>
        </div>
        <button
          type="button"
          onClick={() => (drillOpen ? setDrillOpen(false) : onClose())}
          aria-label={drillOpen ? 'Back to AI Coach' : 'Close AI Coach'}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-[#F4F5F7]/75 hover:bg-white/15"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!drillOpen ? (
        <div className="flex flex-1 flex-col justify-between gap-4">
          <div className="space-y-4">
            {/* 1 Visual Performance Radar */}
            <div className="rounded-2xl border border-white/10 bg-[#0A0B0E]/75 p-4">
              <SkillDNAChart dna={state.profile.skillDNA} />
            </div>

            {/* 1 Clear AI Advice Card */}
            <div className="rounded-2xl border border-white/10 bg-[#161920]/90 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-[#CCFF00]">
                Tactical Briefing
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-[#F4F5F7]/90">
                {coachReply ?? state.profile.cloneSummary}
              </p>

              <form onSubmit={handleAsk} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                  placeholder="Ask your coach anything..."
                  aria-label="Ask AI Coach"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0A0B0E] px-3 text-xs text-[#F4F5F7] placeholder-[#F4F5F7]/40 focus:border-[#CCFF00] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleVoice}
                  aria-label="Voice prompt"
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 ${
                    listening ? 'bg-[#CCFF00] text-[#0A0B0E]' : 'bg-white/5 text-[#F4F5F7]'
                  }`}
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button
                  type="submit"
                  disabled={asking || !coachInput.trim()}
                  aria-label="Send to Coach"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#F4F5F7] hover:bg-white/20 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* 1 Big Primary Action Button + secondary upload link */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setDrillOpen(true);
                startDrill();
              }}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#CCFF00] text-sm font-bold text-[#0A0B0E] transition-transform active:scale-[0.98]"
            >
              <Play className="h-4 w-4 fill-current" />
              Start 10s Match Drill
            </button>
            <button
              type="button"
              onClick={onOpenMatchUpload}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-[#F4F5F7]/85 hover:bg-white/10"
            >
              <Camera className="h-4 w-4 text-[#CCFF00]" />
              Upload Match Screenshot
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Drill Header Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex rounded-xl bg-[#0A0B0E] p-1">
              <button
                type="button"
                onClick={() => {
                  setDrillMode('2d-chess');
                  startDrill('2d-chess');
                }}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  drillMode === '2d-chess' ? 'bg-[#CCFF00] text-[#0A0B0E]' : 'text-[#F4F5F7]/70'
                }`}
              >
                Chess Tactics
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrillMode('3d-pitch');
                  startDrill('3d-pitch');
                }}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  drillMode === '3d-pitch' ? 'bg-[#CCFF00] text-[#0A0B0E]' : 'text-[#F4F5F7]/70'
                }`}
              >
                Through-Ball Lane
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono-tabular text-sm font-bold text-[#CCFF00]">
              <Timer className="h-4 w-4" />
              <span>{timeLeft.toFixed(1)}s</span>
            </div>
          </div>

          {drillMode === '2d-chess' ? (
            <div className="space-y-3">
              <TacticalChessBoard
                fen={boardFen}
                selectedSq={selectedSq}
                playerColor={chessDrill.playerColor}
                interactive={running}
                lastMove={lastMove}
                onSquareTap={handleChessTap}
              />
              <p className="text-center text-xs text-[#F4F5F7]/75">{chessDrill.hint}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <TacticalPitchDrill
                drill={pitchDrill}
                running={running}
                defenderPhase={defenderPhase}
                onPassComplete={handlePitchPassComplete}
              />
              <p className="text-center text-xs text-[#F4F5F7]/75">{pitchDrill.briefing}</p>
            </div>
          )}

          {outcome && (
            <div
              className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
                outcome.won
                  ? 'border-[#CCFF00]/50 bg-[#CCFF00]/15 text-[#CCFF00]'
                  : 'border-rose-400/40 bg-rose-500/15 text-rose-200'
              }`}
            >
              {outcome.message}
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => startDrill(drillMode)}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#CCFF00] text-sm font-bold text-[#0A0B0E]"
            >
              <RotateCcw className="h-4 w-4" />
              {running ? 'Restart Drill' : 'Run Drill'}
            </button>
            <button
              type="button"
              disabled={generating}
              onClick={async () => {
                setGenerating(true);
                setRunning(false);
                setOutcome(null);
                setSelectedSq(null);
                setLastMove(null);
                try {
                  const activeId = drillMode === '2d-chess' ? chessDrill.id.replace(/-\d+$/, '') : pitchDrill.id;
                  const created = await onGenerateDrill(drillMode, activeId);
                  if (created.mode === '2d-chess') {
                    setChessDrill(created);
                    setBoardFen(created.fen);
                  } else {
                    setPitchDrill(created);
                  }
                  setTimeLeft(created.durationSec);
                  setDefenderPhase(0.4);
                  setRunning(true);
                } finally {
                  setGenerating(false);
                }
              }}
              className="flex h-12 items-center justify-center rounded-xl border border-white/12 bg-white/8 px-4 text-xs font-semibold text-[#F4F5F7] hover:bg-white/15 disabled:opacity-50"
            >
              {generating ? 'Creating...' : 'New AI Drill'}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
