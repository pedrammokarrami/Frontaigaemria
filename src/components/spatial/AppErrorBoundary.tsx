import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Aigameria — app root ErrorBoundary: a single heavy-module crash (Three.js
 * scene, video turntable, spatial map) must never blank the whole site.
 * Persian/English fallback UI per active language.
 */
export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Console-only diagnostics — never a user-facing debug dump.
    console.error('[AIGAMERIA] module crash contained:', error.message);
    void info;
  }

  render(): React.ReactNode {
    if (!this.state.error) return this.props.children;
    return <ErrorFallback onRetry={() => this.setState({ error: null })} />;
  }
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { languageCode } = useLanguage();
  const isFa = languageCode.toLowerCase().startsWith('fa');
  return (
    <div className="fixed inset-0 z-[400] flex flex-col items-center justify-center gap-4 bg-[#05070d] text-center px-8">
      <p className="text-xl font-bold bg-gradient-to-r from-[#FF6B35] via-[#FF3E8A] to-[#22D3EE] bg-clip-text text-transparent">
        AIGAMERIA
      </p>
      <p className="max-w-md text-sm text-white/70">
        {isFa
          ? 'یه بخش صفحه موقتاً از کار افتاد — بقیه اپ سالمه. یک بار صفحه رو رفرش کن.'
          : 'A module failed to load, but the rest of the app is safe. Try refreshing once.'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-xl bg-gradient-to-r from-[#FF6B35] via-[#FF3E8A] to-[#22D3EE] px-5 py-2.5 text-sm font-bold text-[#0D091A] cursor-pointer"
      >
        {isFa ? 'تلاش دوباره' : 'Retry'}
      </button>
    </div>
  );
}
