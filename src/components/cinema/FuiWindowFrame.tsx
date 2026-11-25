import React from 'react';
import { Maximize2, Minimize2, Minus, X } from 'lucide-react';
import { FuiTypewriter } from './FuiTypewriter';

interface FuiWindowFrameProps {
  windowCode: string;
  titleFa: string;
  subtitleFa?: string;
  isActive?: boolean;
  isMaximized?: boolean;
  onFocus?: () => void;
  onToggleMaximize?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  testId?: string;
  accentColor?: 'cyan' | 'amber';
}

export const FuiWindowFrame: React.FC<FuiWindowFrameProps> = ({
  windowCode,
  titleFa,
  subtitleFa,
  isActive = true,
  isMaximized = false,
  onFocus,
  onToggleMaximize,
  onMinimize,
  onClose,
  headerRight,
  children,
  className = '',
  testId,
  accentColor = 'cyan',
}) => {
  const bracketColor = accentColor === 'amber' ? 'border-[#F59E0B]' : 'border-[#38BDF8]';
  const ringBorder = isActive
    ? accentColor === 'amber'
      ? 'border-[#F59E0B]/45 shadow-[0_18px_50px_rgba(2,8,18,0.82)]'
      : 'border-[#38BDF8]/40 shadow-[0_18px_50px_rgba(2,8,18,0.82)]'
    : 'border-[#1B2D44] shadow-[0_10px_28px_rgba(2,8,18,0.55)]';

  return (
    <section
      data-testid={testId}
      onClick={onFocus}
      className={`relative flex flex-col bg-[#060C15]/92 backdrop-blur-xl border ${ringBorder} transition-all duration-200 animate-[fuiWinReveal_240ms_cubic-bezier(0.16,1,0.3,1)] ${className}`}
    >
      {/* Signature Hollywood FUI Corner Brackets */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -top-px -right-px w-3.5 h-3.5 border-t-2 border-r-2 ${bracketColor}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -top-px -left-px w-3.5 h-3.5 border-t-2 border-l-2 ${bracketColor}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-px -right-px w-3.5 h-3.5 border-b-2 border-r-2 ${bracketColor}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-px -left-px w-3.5 h-3.5 border-b-2 border-l-2 ${bracketColor}`}
      />

      {/* OS Window Title Bar */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-[#16273B] bg-[#0A1320]/95 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            dir="ltr"
            className={`font-mono-tabular text-[11px] font-bold tracking-wider px-2 py-0.5 border ${
              accentColor === 'amber'
                ? 'border-[#F59E0B]/45 text-[#F59E0B] bg-[#F59E0B]/10'
                : 'border-[#38BDF8]/40 text-[#38BDF8] bg-[#38BDF8]/10'
            } shrink-0`}
          >
            {windowCode}
          </span>
          <div className="min-w-0">
            <h2 className="text-[13.5px] sm:text-[14px] font-extrabold text-white truncate">
              <FuiTypewriter text={titleFa} speedMs={22} showCursor={false} />
            </h2>
            {subtitleFa && (
              <p className="text-[11px] text-[#8FA8C8] truncate">{subtitleFa}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {headerRight}
          {onMinimize && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMinimize();
              }}
              aria-label={`کوچک کردن پنجره ${titleFa}`}
              className="w-7 h-7 flex items-center justify-center border border-[#1E334D] bg-[#0D1829] hover:border-[#38BDF8]/50 text-[#9CB2CE] hover:text-white transition cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          )}
          {onToggleMaximize && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMaximize();
              }}
              aria-label={isMaximized ? `کوچک‌نمایی پنجره ${titleFa}` : `بزرگ‌نمایی پنجره ${titleFa}`}
              className="w-7 h-7 flex items-center justify-center border border-[#1E334D] bg-[#0D1829] hover:border-[#38BDF8]/50 text-[#9CB2CE] hover:text-white transition cursor-pointer"
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label={`بستن پنجره ${titleFa}`}
              className="w-7 h-7 flex items-center justify-center border border-[#1E334D] bg-[#0D1829] hover:border-rose-500/60 hover:bg-rose-500/15 text-[#9CB2CE] hover:text-rose-200 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Window Content */}
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
    </section>
  );
};
