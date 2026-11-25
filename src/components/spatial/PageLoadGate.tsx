import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface PageLoadGateProps {
  /** True while the page's data (APIs / GLB / video) is still loading. */
  active: boolean;
  labelFa?: string;
  labelEn?: string;
  testId?: string;
  /**
   * Hard backstop so a hung resource can never dead-lock the page:
   * the gate force-releases after this many milliseconds (default 20s).
   */
  backstopMs?: number;
}

/**
 * Full-cover page loading gate — the same contract as the trainer asset gate:
 * the overlay stays up from page entry until every tracked resource finished
 * loading, then disappears entirely. Pages opt in by rendering it with the
 * union of their pending flags.
 */
export function PageLoadGate({
  active,
  labelFa,
  labelEn,
  testId = 'page-load-gate',
  backstopMs = 20_000,
}: PageLoadGateProps) {
  const { languageCode } = useLanguage();
  const isFa = languageCode.toLowerCase().startsWith('fa');
  const [backstopElapsed, setBackstopElapsed] = useState(false);

  useEffect(() => {
    if (!active) {
      setBackstopElapsed(false);
      return;
    }
    const timer = window.setTimeout(() => setBackstopElapsed(true), backstopMs);
    return () => window.clearTimeout(timer);
  }, [active, backstopMs]);

  if (!active || backstopElapsed) return null;
  return (
    <div
      data-testid={testId}
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-3 bg-[#05070d]/90 backdrop-blur-sm"
    >
      <Loader2 className="w-9 h-9 text-emerald-400 animate-spin" aria-hidden="true" />
      <p className="text-xs font-semibold text-white/75 tracking-wide px-6 text-center">
        {isFa ? (labelFa ?? 'در حال لود کامل صفحه...') : (labelEn ?? 'Loading page…')}
      </p>
    </div>
  );
}
