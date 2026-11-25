import type { SkillDNAAxes } from '../types/aipetros';
import { computeCompositeDNA } from '../utils/aipetrosRules';

interface SkillDNAChartProps {
  dna: SkillDNAAxes;
}

const AXES: { key: keyof SkillDNAAxes; short: string; label: string }[] = [
  { key: 'trapAnticipation', short: 'ANT', label: 'Anticipation' },
  { key: 'spatialPassing', short: 'PAS', label: 'Passing' },
  { key: 'endgameComposure', short: 'CMP', label: 'Composure' },
  { key: 'tempoControl', short: 'TMP', label: 'Tempo' },
  { key: 'riskDiscipline', short: 'DSC', label: 'Discipline' },
  { key: 'tacticalVision', short: 'VIS', label: 'Vision' },
];

export function SkillDNAChart({ dna }: SkillDNAChartProps) {
  const cx = 140;
  const cy = 118;
  const radius = 74;
  const composite = computeCompositeDNA(dna);

  const getPoint = (index: number, pct: number) => {
    const angle = (Math.PI * 2 * index) / AXES.length - Math.PI / 2;
    const r = (radius * pct) / 100;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  };

  const rings = [33, 66, 100];
  const dataPoints = AXES.map((axis, idx) => getPoint(idx, dna[axis.key]));
  const polygonStr = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="flex items-center gap-4">
      <div className="w-[146px] shrink-0">
        <svg viewBox="0 0 280 236" className="h-auto w-full" role="img" aria-label="Player Skill Radar">
          {rings.map((ring) => {
            const pts = AXES.map((_, idx) => getPoint(idx, ring))
              .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
              .join(' ');
            return (
              <polygon
                key={ring}
                points={pts}
                fill="none"
                stroke="rgba(244, 245, 247, 0.12)"
                strokeWidth="1"
              />
            );
          })}

          {AXES.map((axis, idx) => {
            const edge = getPoint(idx, 100);
            const labelPos = getPoint(idx, 120);
            return (
              <g key={axis.key}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={edge.x}
                  y2={edge.y}
                  stroke="rgba(244, 245, 247, 0.12)"
                  strokeWidth="1"
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor={labelPos.x < cx - 8 ? 'end' : labelPos.x > cx + 8 ? 'start' : 'middle'}
                  dominantBaseline="middle"
                  className="fill-[#F4F5F7]/70 text-[12px] font-semibold tracking-wider"
                >
                  {axis.short}
                </text>
              </g>
            );
          })}

          <polygon
            points={polygonStr}
            fill="rgba(204, 255, 0, 0.16)"
            stroke="#CCFF00"
            strokeWidth="2.2"
          />

          {dataPoints.map((p, idx) => (
            <circle key={AXES[idx].key} cx={p.x} cy={p.y} r="3.5" fill="#CCFF00" />
          ))}

          <text
            x={cx}
            y={cy - 3}
            textAnchor="middle"
            className="fill-[#F4F5F7] font-display text-3xl font-extrabold"
          >
            {composite}
          </text>
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            className="fill-[#F4F5F7]/55 text-[10px] font-semibold tracking-widest"
          >
            OVR
          </text>
        </svg>
      </div>

      <div className="flex-1 space-y-2">
        {AXES.map((axis) => (
          <div key={axis.key} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-[11px]">
              <span className="text-[#F4F5F7]/75">{axis.label}</span>
              <span className="font-mono-tabular font-bold text-[#CCFF00]">{dna[axis.key]}</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#CCFF00]"
                style={{ width: `${dna[axis.key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
