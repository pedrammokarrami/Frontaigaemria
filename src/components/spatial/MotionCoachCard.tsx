import React, { useCallback, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { AlertTriangle, Volume2 } from 'lucide-react';
import type { MotionCoachPayload } from '../../agents/motionCoachAgent';
import type { ChapterPhaseId } from '../../agents/proClipAnalyzerAgent';
import { formatCompactComboStrip } from '../../utils/controllerCoachTiming';
import { ControllerCoach3D } from './ControllerCoach3D';

interface MotionCoachCardProps {
  payload: MotionCoachPayload;
  activePhase: ChapterPhaseId;
  isSpeaking: boolean;
  onToggleSpeak: () => void;
}

export const MotionCoachCard: React.FC<MotionCoachCardProps> = ({
  payload,
  activePhase,
  isSpeaking,
  onToggleSpeak,
}) => {
  const { languageCode: mccLang } = useLanguage();
  const mccFa = (mccLang || 'fa').startsWith('fa');
  const [syncHud, setSyncHud] = useState<{
    progressPct: number;
    inSweetSpot: boolean;
    isLateZone: boolean;
    activeButtonLabels: string[];
  }>({
    progressPct: 52,
    inSweetSpot: true,
    isLateZone: false,
    activeButtonLabels: ['L1', 'R1', '△'],
  });

  const handleSyncTick = useCallback(
    (next: {
      progressPct: number;
      inSweetSpot: boolean;
      isLateZone: boolean;
      activeButtonLabels: string[];
    }) => {
      setSyncHud(next);
    },
    []
  );

  const accent = payload.accentHex || '#10B981';
  const combo = formatCompactComboStrip(payload);
  const cleanWarning = payload.fatalWarningFa.replace(/^⚠\s*/, '');

  return (
    <section
      data-testid="motion-coach-card"
      data-archetype={payload.archetype}
      className="rounded-3xl bg-slate-950/35 backdrop-blur-md border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.55)] p-2.5 flex flex-col gap-1.5 overflow-hidden"
    >
      {/* Subtle Top Line: Game Coach Title + Active 3D Key Callout */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <h2 className="text-xs font-black text-white truncate tracking-tight">
            {payload.cardTitleFa}
          </h2>
          <p className="text-[10px] text-white/65 truncate mt-0.5">
            {payload.phaseCuesFa[activePhase]}
          </p>
        </div>

        <span
          dir="ltr"
          data-testid="controller-active-keys"
          className="shrink-0 px-2 py-0.5 rounded-lg bg-slate-950/65 border text-[10px] font-mono font-black tracking-wide transition-colors"
          style={{
            borderColor: syncHud.isLateZone
              ? 'rgba(244,63,94,0.65)'
              : syncHud.inSweetSpot
                ? `${accent}aa`
                : 'rgba(255,255,255,0.18)',
            color: syncHud.isLateZone
              ? '#FDA4AF'
              : syncHud.inSweetSpot
                ? '#A7F3D0'
                : '#E2E8F0',
          }}
        >
          {syncHud.activeButtonLabels.join(' + ')}
        </span>
      </div>

      {/* ================= LAYER 3 HERO: SEAMLESS 3D FROSTED-GLASS CONTROLLER + 3D MINI-ARENA ================= */}
      <div
        data-testid="motion-graphic-stage"
        className="relative w-full -my-1"
      >
        <ControllerCoach3D
          archetype={payload.archetype}
          sweetSpotStartPct={payload.sweetSpotStartPct}
          sweetSpotEndPct={payload.sweetSpotEndPct}
          cycleDurationMs={payload.cycleDurationMs}
          accentHex={accent}
          onSyncTick={handleSyncTick}
        />
      </div>

      {/* ================= ROW 1: VOICE GLASS PILL + CRIMSON WARNING BADGE ================= */}
      <div className="flex items-center gap-1.5 min-w-0">
        <button
          type="button"
          data-testid="coach-speak-btn"
          onClick={onToggleSpeak}
          className={`shrink-0 h-8 px-2.5 rounded-full border text-[11px] font-black flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
            isSpeaking
              ? 'bg-emerald-500/25 border-emerald-400/75 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.3)]'
              : 'bg-slate-950/55 border-white/20 text-white hover:bg-slate-900/75'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5 shrink-0" />
          <span>{mccFa ? (isSpeaking ? 'در حال پخش' : 'توضیح صوتی') : (isSpeaking ? 'Playing voice' : 'Voice explain')}</span>
        </button>

        <div
          data-testid="motion-fatal-warning"
          className="flex-1 min-w-0 h-8 rounded-full bg-rose-950/55 border border-rose-500/45 px-2.5 flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-rose-200 shadow-[0_0_14px_rgba(244,63,94,0.18)]"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="truncate">{cleanWarning}</span>
        </div>
      </div>

      {/* ================= ROW 2: SLEEK GLOWING TIMING COMBO STRIP ([L1] ➔ ۰.۲۵s ➔ [L1 + R1 + △]) ================= */}
      <div
        dir="ltr"
        data-testid="timing-combo-strip"
        className="relative rounded-2xl bg-slate-950/60 border border-white/15 px-2.5 py-1.5 flex flex-col gap-1 overflow-hidden"
      >
        <div className="flex items-center justify-between gap-1.5">
          <span
            data-testid="motion-trigger-badge"
            className="shrink-0 px-2 py-0.5 rounded-lg bg-white/[0.08] border border-white/25 font-mono text-[11px] font-black text-white whitespace-nowrap"
          >
            {combo.triggerToken}
          </span>

          <span className="text-emerald-400/75 text-xs font-black shrink-0" aria-hidden="true">
            ➔
          </span>

          <span
            data-testid="motion-timing-window"
            className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/45 font-mono text-[11px] font-black text-emerald-200 tabular-nums whitespace-nowrap"
          >
            {combo.windowToken}
          </span>

          <span className="text-emerald-400/75 text-xs font-black shrink-0" aria-hidden="true">
            ➔
          </span>

          <span
            data-testid="motion-exec-badge"
            className="px-2 py-0.5 rounded-lg border font-mono text-[11px] font-black truncate max-w-[145px] transition-all"
            style={{
              backgroundColor: syncHud.inSweetSpot ? `${accent}30` : 'rgba(255,255,255,0.06)',
              borderColor: syncHud.inSweetSpot ? accent : 'rgba(255,255,255,0.22)',
              color: syncHud.inSweetSpot ? '#FFFFFF' : '#E2E8F0',
              boxShadow: syncHud.inSweetSpot ? `0 0 14px ${accent}55` : 'none',
            }}
          >
            {combo.executionToken}
          </span>
        </div>

        {/* Sleek 4px Glowing Sweet-Spot Sweep Line Synchronized with 3D Controller */}
        <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="absolute top-0 bottom-0 rounded-full"
            style={{
              left: `${payload.sweetSpotStartPct}%`,
              width: `${payload.sweetSpotEndPct - payload.sweetSpotStartPct}%`,
              background: `linear-gradient(90deg, ${accent} 0%, #34D399 100%)`,
              opacity: syncHud.inSweetSpot ? 1 : 0.65,
            }}
          />
          <div
            className="absolute top-0 bottom-0 right-0 bg-rose-500/60"
            style={{ width: `${Math.max(10, 100 - payload.sweetSpotEndPct - 6)}%` }}
          />
          <div
            className="absolute top-0 bottom-0 w-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]"
            style={{ left: `calc(${syncHud.progressPct}% - 3px)` }}
          />
        </div>
      </div>
    </section>
  );
};
