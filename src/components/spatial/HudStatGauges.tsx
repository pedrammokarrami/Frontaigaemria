import React, { useEffect, useRef, useState } from 'react';

export interface HudStat {
  label: string;
  value: number;
  max: number;
}

/**
 * Animated stat gauges for the HUD Motion Card — faithful port of the user's
 * spec: bar starts at 0% and fills after 550ms, while the number counts up
 * (0 → target) in ~30ms steps. Remounting the component (key change) replays it.
 */
export const HudStatGauges: React.FC<{
  stats: HudStat[];
  /** ms before the fill/count starts (spec: 550ms — after the pills pop in) */
  startDelayMs?: number;
  dataTestId?: string;
}> = ({ stats, startDelayMs = 550, dataTestId }) => {
  const [go, setGo] = useState(false);
  const [shown, setShown] = useState<number[]>(() => stats.map(() => 0));
  const timersRef = useRef<number[]>([]);

  const targets = stats.map((s) => Math.round((s.value / Math.max(1, s.max)) * 100));

  useEffect(() => {
    setGo(false);
    setShown(stats.map(() => 0));
    const start = window.setTimeout(() => setGo(true), startDelayMs);
    timersRef.current.push(start);
    return () => {
      for (const t of timersRef.current) window.clearTimeout(t);
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.map((s) => `${s.label}:${s.value}/${s.max}`).join('|')]);

  useEffect(() => {
    if (!go) return;
    const intervals: number[] = [];
    setShown(stats.map(() => 0));
    stats.forEach((s, i) => {
      const target = targets[i];
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 25));
      const timer = window.setInterval(() => {
        current += step;
        if (current >= target) {
          setShown((prev) => {
            const next = [...prev];
            next[i] = target;
            return next;
          });
          window.clearInterval(timer);
        } else {
          setShown((prev) => {
            const next = [...prev];
            next[i] = current;
            return next;
          });
        }
      }, 30);
      intervals.push(timer);
    });
    return () => {
      for (const t of intervals) window.clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go, stats.length]);

  return (
    <div className="stats-grid" data-testid={dataTestId}>
      {stats.map((s, i) => (
        <div key={`${s.label}-${i}`} className="stat-pill" style={{ animationDelay: `${0.45 + i * 0.1}s` }}>
          <div className="stat-top">
            <span>{s.label}</span>
            <span className="stat-val">{shown[i]}%</span>
          </div>
          <div className="stat-bar-bg">
            <div className="stat-bar-fill" style={{ width: go ? `${targets[i]}%` : '0%', transitionDelay: `${i * 0.1}s` }} />
          </div>
        </div>
      ))}
    </div>
  );
};
