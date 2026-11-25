import React, { useEffect, useState } from 'react';

interface FuiTypewriterProps {
  text: string;
  speedMs?: number;
  startDelayMs?: number;
  showCursor?: boolean;
  className?: string;
  onComplete?: () => void;
}

export const FuiTypewriter: React.FC<FuiTypewriterProps> = ({
  text,
  speedMs = 18,
  startDelayMs = 0,
  showCursor = true,
  className = '',
  onComplete,
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return text.length;
    }
    return 0;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setVisibleCount(text.length);
      onComplete?.();
      return;
    }

    setVisibleCount(0);
    if (!text) {
      onComplete?.();
      return;
    }

    let intervalId: number | null = null;
    const stepSize = text.length > 140 ? 2 : 1;

    const delayTimer = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        setVisibleCount((prev) => {
          const next = Math.min(text.length, prev + stepSize);
          if (next >= text.length && intervalId !== null) {
            window.clearInterval(intervalId);
            intervalId = null;
            onComplete?.();
          }
          return next;
        });
      }, speedMs);
    }, startDelayMs);

    return () => {
      window.clearTimeout(delayTimer);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [text, speedMs, startDelayMs]);

  const isDone = visibleCount >= text.length;
  const shownText = isDone ? text : text.slice(0, visibleCount);

  return (
    <span aria-label={text} className={className}>
      {shownText}
      {showCursor && !isDone && (
        <span
          aria-hidden="true"
          className="inline-block w-1.5 h-[0.95em] align-middle mr-0.5 bg-[#38BDF8] animate-pulse"
        />
      )}
    </span>
  );
};
