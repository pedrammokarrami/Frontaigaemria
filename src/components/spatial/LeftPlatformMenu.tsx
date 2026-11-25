import React, { useEffect, useState } from 'react';
import { Compass, Menu, ShoppingBag, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { MasterHubId } from './MasterHubSwitcher';

interface LeftPlatformMenuProps {
  activeHub: MasterHubId;
  activeOverlay: 'map' | 'store' | null;
  onOpenMap: () => void;
  onOpenStore: () => void;
}

const HUB_RAIL_STYLE: Record<
  MasterHubId,
  { accent: string; secondary: string; badgeBg: string }
> = {
  game: {
    accent: '#00F0FF',
    secondary: '#FCEE0A',
    badgeBg: 'rgba(6, 12, 24, 0.84)',
  },
  cinema: {
    accent: '#E5A93C',
    secondary: '#E11D48',
    badgeBg: 'rgba(18, 12, 8, 0.86)',
  },
  audio: {
    accent: '#1ED760',
    secondary: '#D4AF37',
    badgeBg: 'rgba(12, 16, 14, 0.86)',
  },
};

export const LeftPlatformMenu: React.FC<LeftPlatformMenuProps> = ({
  activeHub,
  activeOverlay,
  onOpenMap,
  onOpenStore,
}) => {
  const { copy, isRtl } = useLanguage();
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(true);
  const style = HUB_RAIL_STYLE[activeHub];

  useEffect(() => {
    // Collapse mobile drawer cleanly whenever active overlay changes or hub switches
    setMobileExpanded(false);
  }, [activeHub, activeOverlay]);

  return (
    <aside
      data-testid="global-left-menu"
      aria-label={copy.leftMenuLabel}
      className="fixed top-[60px] left-2.5 z-[84] flex flex-col items-start gap-2 select-none"
    >
      {/* Desktop (>= 768px): Left Menu Trigger + Direct 2-Button Rail (1. Map, 2. Store) */}
      <div className="hidden md:flex flex-col items-start gap-2">
        <button
          type="button"
          data-testid="left-menu-toggle-btn"
          onClick={() => setDesktopExpanded((prev) => !prev)}
          aria-expanded={desktopExpanded}
          aria-label={copy.leftMenuLabel}
          className="h-10 px-3 rounded-full backdrop-blur-xl border border-white/18 text-white/90 hover:text-white hover:border-white/35 transition-all flex items-center gap-2 cursor-pointer shadow-[0_8px_24px_rgba(0,0,0,0.5)] whitespace-nowrap"
          style={{ backgroundColor: style.badgeBg }}
        >
          {desktopExpanded ? (
            <X className="w-4 h-4 shrink-0" style={{ color: style.accent }} />
          ) : (
            <Menu className="w-4 h-4 shrink-0" style={{ color: style.accent }} />
          )}
          <span className="text-[12px] font-bold">{copy.leftMenuLabel}</span>
        </button>

        {desktopExpanded && (
          <nav
            aria-label={`${copy.navMap} & ${copy.navStore}`}
            dir={isRtl ? 'rtl' : 'ltr'}
            className="flex flex-col gap-2 p-1.5 rounded-2xl backdrop-blur-2xl border border-white/15 shadow-[0_14px_34px_rgba(0,0,0,0.55)]"
            style={{ backgroundColor: style.badgeBg }}
          >
            <button
              type="button"
              data-testid="left-menu-map-btn"
              onClick={onOpenMap}
              aria-pressed={activeOverlay === 'map'}
              className="min-h-[42px] px-3.5 rounded-xl border text-[12.5px] font-extrabold transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0"
              style={{
                borderColor:
                  activeOverlay === 'map' ? style.accent : 'rgba(255,255,255,0.14)',
                backgroundColor:
                  activeOverlay === 'map' ? `${style.accent}24` : 'rgba(255,255,255,0.05)',
                color: '#FFFFFF',
                boxShadow:
                  activeOverlay === 'map' ? `0 0 16px ${style.accent}40` : undefined,
              }}
            >
              <Compass className="w-4 h-4 shrink-0" style={{ color: style.accent }} />
              <span>{copy.navMap}</span>
            </button>

            <button
              type="button"
              data-testid="left-menu-store-btn"
              onClick={onOpenStore}
              aria-pressed={activeOverlay === 'store'}
              className="min-h-[42px] px-3.5 rounded-xl border text-[12.5px] font-extrabold transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0"
              style={{
                borderColor:
                  activeOverlay === 'store' ? style.secondary : 'rgba(255,255,255,0.14)',
                backgroundColor:
                  activeOverlay === 'store'
                    ? `${style.secondary}24`
                    : 'rgba(255,255,255,0.05)',
                color: '#FFFFFF',
                boxShadow:
                  activeOverlay === 'store' ? `0 0 16px ${style.secondary}40` : undefined,
              }}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" style={{ color: style.secondary }} />
              <span>{copy.navStore}</span>
            </button>
          </nav>
        )}
      </div>

      {/* Mobile (< 768px): Compact Left-Side Menu Button opening 1. Map + 2. Store */}
      <div className="md:hidden flex flex-col items-start gap-1.5">
        <button
          type="button"
          data-testid="left-menu-toggle-mobile-btn"
          onClick={() => setMobileExpanded((prev) => !prev)}
          aria-expanded={mobileExpanded}
          aria-label={copy.leftMenuLabel}
          className="w-10 h-10 rounded-full backdrop-blur-xl border border-white/20 flex items-center justify-center text-white shadow-[0_8px_24px_rgba(0,0,0,0.55)] cursor-pointer transition active:scale-95"
          style={{
            backgroundColor: style.badgeBg,
            borderColor: mobileExpanded ? style.accent : 'rgba(255,255,255,0.2)',
          }}
        >
          {mobileExpanded ? (
            <X className="w-4 h-4" style={{ color: style.accent }} />
          ) : (
            <Menu className="w-4 h-4" style={{ color: style.accent }} />
          )}
        </button>

        {mobileExpanded && (
          <nav
            aria-label={copy.leftMenuLabel}
            dir={isRtl ? 'rtl' : 'ltr'}
            className="flex flex-col gap-1.5 p-2 rounded-2xl backdrop-blur-2xl border border-white/20 shadow-[0_18px_42px_rgba(0,0,0,0.75)] min-w-[144px]"
            style={{ backgroundColor: 'rgba(8, 11, 20, 0.94)' }}
          >
            <button
              type="button"
              data-testid="left-menu-map-mobile-btn"
              onClick={() => {
                setMobileExpanded(false);
                onOpenMap();
              }}
              className="min-h-[42px] px-3 rounded-xl border border-white/15 bg-white/6 hover:bg-white/12 text-white text-[12.5px] font-extrabold flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Compass className="w-4 h-4 shrink-0" style={{ color: style.accent }} />
              <span>{copy.navMap}</span>
            </button>

            <button
              type="button"
              data-testid="left-menu-store-mobile-btn"
              onClick={() => {
                setMobileExpanded(false);
                onOpenStore();
              }}
              className="min-h-[42px] px-3 rounded-xl border border-white/15 bg-white/6 hover:bg-white/12 text-white text-[12.5px] font-extrabold flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" style={{ color: style.secondary }} />
              <span>{copy.navStore}</span>
            </button>
          </nav>
        )}
      </div>
    </aside>
  );
};
