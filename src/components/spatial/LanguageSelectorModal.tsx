import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Globe2, Search, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  playNetflixMenuSound,
  playSpotifyTapSound,
  playXboxUiSound,
} from '../../utils/hubQuickMenu';
import {
  LANGUAGE_REGIONS,
  type LanguageRegion,
  WORLD_LANGUAGES,
  type WorldLanguageItem,
  filterWorldLanguages,
} from '../../utils/i18nEngine';
import type { MasterHubId } from './MasterHubSwitcher';

interface LanguageSelectorModalProps {
  activeHub: MasterHubId;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({ activeHub }) => {
  const {
    languageCode,
    language,
    copy,
    isRtl,
    setLanguageCode,
    isLanguageModalOpen,
    closeLanguageModal,
  } = useLanguage();

  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<LanguageRegion>('All');
  const [focusedIdx, setFocusedIdx] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredLanguages = useMemo(
    () => filterWorldLanguages(WORLD_LANGUAGES, query, region),
    [query, region]
  );

  useEffect(() => {
    if (!isLanguageModalOpen) return;
    setQuery('');
    setRegion('All');
    const activeIndex = WORLD_LANGUAGES.findIndex((l) => l.code === languageCode);
    setFocusedIdx(activeIndex >= 0 ? activeIndex : 0);

    if (activeHub === 'game') playXboxUiSound('open');
    else if (activeHub === 'cinema') playNetflixMenuSound('open');
    else playSpotifyTapSound('open');

    const t = window.setTimeout(() => {
      searchRef.current?.focus();
    }, 80);
    return () => window.clearTimeout(t);
  }, [isLanguageModalOpen, activeHub, languageCode]);

  useEffect(() => {
    if (focusedIdx >= filteredLanguages.length) {
      setFocusedIdx(0);
    }
  }, [filteredLanguages.length, focusedIdx]);

  const handleSelectLanguage = (item: WorldLanguageItem) => {
    if (activeHub === 'game') playXboxUiSound('select');
    else if (activeHub === 'cinema') playNetflixMenuSound('select');
    else playSpotifyTapSound('tap');

    setLanguageCode(item.code);
    closeLanguageModal();
  };

  const handleClose = () => {
    if (activeHub === 'game') playXboxUiSound('close');
    closeLanguageModal();
  };

  useEffect(() => {
    if (!isLanguageModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowDown') {
        if (filteredLanguages.length === 0) return;
        e.preventDefault();
        setFocusedIdx((prev) => {
          const next = (prev + 1) % filteredLanguages.length;
          if (activeHub === 'game') playXboxUiSound('tick');
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        if (filteredLanguages.length === 0) return;
        e.preventDefault();
        setFocusedIdx((prev) => {
          const next = (prev - 1 + filteredLanguages.length) % filteredLanguages.length;
          if (activeHub === 'game') playXboxUiSound('tick');
          return next;
        });
      } else if (e.key === 'Enter' && document.activeElement !== searchRef.current) {
        const current = filteredLanguages[focusedIdx];
        if (current) {
          e.preventDefault();
          handleSelectLanguage(current);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (typeof document === 'undefined') return null;

  const listDir = isRtl ? 'rtl' : 'ltr';

  return createPortal(
    <AnimatePresence>
      {isLanguageModalOpen && (
        <>
          {/* ================================================================
           * 1. GAME HUB -> XBOX CONSOLE DASHBOARD / GUIDE LANGUAGE BLADE
           * ============================================================== */}
          {activeHub === 'game' && (
            <motion.div
              key="xbox-lang-backdrop"
              data-testid="xbox-lang-modal"
              dir={listDir}
              role="dialog"
              aria-modal="true"
              aria-label={copy.xboxTitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClose}
              className="fixed inset-0 z-[95] bg-[#060908]/88 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-6 select-none"
            >
              <motion.div
                initial={{ opacity: 0, x: -32, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -24, scale: 0.97 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl max-h-[90dvh] rounded-md bg-[#121518] border border-white/15 shadow-[0_28px_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
                style={{
                  boxShadow:
                    '0 0 0 1px rgba(255,255,255,0.08), 0 28px 80px rgba(0,0,0,0.92)',
                }}
              >
                {/* Xbox Green Top Accent Bar */}
                <div className="h-1 w-full bg-gradient-to-r from-[#107C10] via-[#2ECC40] to-[#107C10]" />

                {/* Xbox Settings Breadcrumb & Header */}
                <header className="px-4 sm:px-6 pt-4 pb-3.5 bg-[#0D1013] border-b border-white/10 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Xbox Nexus Ring Mark */}
                    <div
                      aria-hidden="true"
                      className="w-10 h-10 rounded-full bg-[#107C10] border-2 border-[#2ECC40] shadow-[0_0_20px_rgba(16,124,16,0.6)] flex items-center justify-center shrink-0 mt-0.5"
                    >
                      <Globe2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold tracking-wide text-[#52D053] truncate">
                        {copy.xboxBreadcrumb}
                      </div>
                      <h2 className="text-[19px] sm:text-[22px] font-extrabold text-white tracking-tight mt-0.5 truncate">
                        {copy.xboxTitle}
                      </h2>
                      <p className="text-[12px] text-[#9EA7B3] truncate">{copy.xboxSubtitle}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid="lang-modal-close-btn"
                    onClick={handleClose}
                    aria-label={copy.xboxFooterBack}
                    className="w-9 h-9 rounded bg-[#22272D] hover:bg-[#107C10] border border-white/15 flex items-center justify-center text-white cursor-pointer transition shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </header>

                {/* Xbox Controller [Y] Search + Region Tabs */}
                <div className="px-4 sm:px-6 py-3 bg-[#15191D] border-b border-white/10 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5 min-h-[42px] px-3 rounded bg-[#0B0D10] border border-white/15 focus-within:border-[#2ECC40] focus-within:shadow-[0_0_0_2px_rgba(46,204,64,0.28)] transition">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black shrink-0">
                      Y
                    </span>
                    <Search className="w-4 h-4 text-white/55 shrink-0" aria-hidden="true" />
                    <input
                      ref={searchRef}
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={copy.searchWorldLanguagesPlaceholder}
                      data-testid="lang-search-input"
                      className="w-full bg-transparent text-[13px] font-medium text-white placeholder:text-[#7D8794] focus:outline-none py-1.5"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="text-xs font-bold text-[#9EA7B3] hover:text-white px-1.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {LANGUAGE_REGIONS.map((reg) => {
                        const active = region === reg;
                        return (
                          <button
                            key={reg}
                            type="button"
                            onClick={() => {
                              playXboxUiSound('tick');
                              setRegion(reg);
                            }}
                            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded text-[11.5px] font-bold transition cursor-pointer border ${
                              active
                                ? 'bg-[#107C10] border-[#2ECC40] text-white shadow-[0_0_12px_rgba(16,124,16,0.45)]'
                                : 'bg-[#1D2228] border-white/10 text-[#B8C0CC] hover:border-white/30 hover:text-white'
                            }`}
                          >
                            {copy.regionLabels[reg]}
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[11px] font-mono-tabular text-[#8D97A5]">
                      {filteredLanguages.length} / {WORLD_LANGUAGES.length} {copy.languagesCountSuffix}
                    </span>
                  </div>
                </div>

                {/* Xbox Focusable Console Grid */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#101316]">
                  {filteredLanguages.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center gap-3">
                      <p className="text-[14px] font-bold text-white/85">{copy.noLanguageMatched}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('');
                          setRegion('All');
                        }}
                        className="px-4 py-2 rounded bg-[#107C10] hover:bg-[#149414] text-white text-xs font-bold cursor-pointer"
                      >
                        {copy.resetLanguageSearch}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {filteredLanguages.map((item, idx) => {
                        const isSelected = item.code === language.code;
                        const isFocused = idx === focusedIdx;
                        return (
                          <button
                            key={item.code}
                            type="button"
                            data-testid={`lang-option-${item.code}`}
                            onMouseEnter={() => {
                              if (focusedIdx !== idx) {
                                setFocusedIdx(idx);
                                playXboxUiSound('tick');
                              }
                            }}
                            onClick={() => handleSelectLanguage(item)}
                            className={`text-start px-3.5 py-3 rounded transition-all cursor-pointer flex items-center justify-between gap-3 border-2 ${
                              isSelected
                                ? 'bg-[#107C10]/30 border-[#2ECC40] shadow-[0_0_18px_rgba(46,204,64,0.28)]'
                                : isFocused
                                  ? 'bg-[#222830] border-[#2ECC40] scale-[1.015]'
                                  : 'bg-[#191D22] border-transparent hover:bg-[#222830] hover:border-[#2ECC40]/70'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-[14px] font-extrabold text-white truncate">
                                {item.nativeName}
                              </div>
                              <div className="text-[11.5px] text-[#9EA7B3] truncate mt-0.5">
                                {item.englishName}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-mono-tabular font-bold uppercase px-1.5 py-0.5 rounded bg-black/40 text-[#9EA7B3]">
                                {item.code}
                              </span>
                              {isSelected && (
                                <span className="w-6 h-6 rounded-full bg-[#2ECC40] text-slate-950 flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Xbox Bottom Controller Legend */}
                <footer className="px-4 sm:px-6 py-2.5 bg-[#0C0E11] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11.5px] font-semibold text-[#A5AFBC]">
                  <div className="flex items-center gap-4">
                    <span className="text-[#52D053] font-bold">{copy.xboxFooterSelect}</span>
                    <span>{copy.xboxFooterBack}</span>
                  </div>
                  <span className="text-[11px] text-[#7D8794]">{copy.xboxFooterNav}</span>
                </footer>
              </motion.div>
            </motion.div>
          )}

          {/* ================================================================
           * 2. CINEMA HUB -> APPLE visionOS FLOATING SPATIAL GLASS WINDOW
           * ============================================================== */}
          {activeHub === 'cinema' && (
            <motion.div
              key="visionos-lang-backdrop"
              data-testid="visionos-lang-modal"
              dir={listDir}
              role="dialog"
              aria-modal="true"
              aria-label={copy.visionTitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.26 }}
              onClick={handleClose}
              className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 select-none"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 16 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-3xl max-h-[82dvh] rounded-[34px] overflow-hidden flex flex-col border border-white/30"
                style={{
                  background:
                    'linear-gradient(155deg, rgba(64, 68, 84, 0.56) 0%, rgba(30, 32, 42, 0.68) 55%, rgba(22, 24, 34, 0.74) 100%)',
                  backdropFilter: 'blur(42px) saturate(185%)',
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.42), inset 0 -1px 0 rgba(255,255,255,0.12), 0 32px 96px rgba(0,0,0,0.68)',
                }}
              >
                {/* visionOS Spatial Title Header */}
                <header className="px-6 pt-5 pb-4 border-b border-white/15 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-white/18 border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] flex items-center justify-center shrink-0">
                      <Globe2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[20px] sm:text-[22px] font-semibold tracking-tight text-white truncate">
                        {copy.visionTitle}
                      </h2>
                      <p className="text-[12px] text-white/70 truncate">{copy.visionSubtitle}</p>
                    </div>
                  </div>

                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/14 border border-white/25 text-[11.5px] font-medium text-white shrink-0">
                    {language.nativeName}
                  </span>
                </header>

                {/* visionOS Specular Search Capsule & Floating Region Pills */}
                <div className="px-5 sm:px-6 py-3.5 flex flex-col gap-3 border-b border-white/12 bg-white/[0.04]">
                  <div className="flex items-center gap-2.5 min-h-[44px] px-4 rounded-full bg-white/[0.12] border border-white/25 focus-within:bg-white/[0.18] focus-within:border-white/55 transition shadow-[inset_0_1px_1px_rgba(255,255,255,0.22)]">
                    <Search className="w-4 h-4 text-white/75 shrink-0" aria-hidden="true" />
                    <input
                      ref={searchRef}
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={copy.searchWorldLanguagesPlaceholder}
                      data-testid="lang-search-input"
                      className="w-full bg-transparent text-[13.5px] font-medium text-white placeholder:text-white/60 focus:outline-none py-1.5"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {LANGUAGE_REGIONS.map((reg) => {
                      const active = region === reg;
                      return (
                        <button
                          key={reg}
                          type="button"
                          onClick={() => setRegion(reg)}
                          className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12px] font-medium transition cursor-pointer border ${
                            active
                              ? 'bg-white text-slate-950 border-white shadow-[0_4px_18px_rgba(255,255,255,0.35)]'
                              : 'bg-white/10 border-white/15 text-white/80 hover:bg-white/20 hover:text-white'
                          }`}
                        >
                          {copy.regionLabels[reg]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* visionOS Spatial Glass Gaze List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-1.5">
                  {filteredLanguages.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center gap-3">
                      <p className="text-[14px] font-medium text-white/85">{copy.noLanguageMatched}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('');
                          setRegion('All');
                        }}
                        className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold cursor-pointer"
                      >
                        {copy.resetLanguageSearch}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredLanguages.map((item) => {
                        const isSelected = item.code === language.code;
                        return (
                          <button
                            key={item.code}
                            type="button"
                            data-testid={`lang-option-${item.code}`}
                            onClick={() => handleSelectLanguage(item)}
                            className={`group text-start px-4 py-3 rounded-[20px] transition-all cursor-pointer flex items-center justify-between gap-3 border ${
                              isSelected
                                ? 'bg-white/25 border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_8px_24px_rgba(0,0,0,0.28)]'
                                : 'bg-white/[0.08] border-white/12 hover:bg-white/[0.18] hover:border-white/35'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-[14.5px] font-semibold text-white truncate">
                                {item.nativeName}
                              </div>
                              <div className="text-[11.5px] text-white/70 truncate">
                                {item.englishName} · {item.code.toUpperCase()}
                              </div>
                            </div>
                            {isSelected && (
                              <span className="w-7 h-7 rounded-full bg-white text-slate-950 flex items-center justify-center shrink-0 shadow">
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Signature visionOS Bottom Floating Window Bar + Close Orb */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="mt-4 flex items-center gap-3"
              >
                <button
                  type="button"
                  data-testid="lang-modal-close-btn"
                  onClick={handleClose}
                  aria-label={copy.back}
                  className="w-9 h-9 rounded-full bg-white/25 hover:bg-white/40 backdrop-blur-2xl border border-white/40 flex items-center justify-center text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
                <div
                  aria-hidden="true"
                  className="w-28 h-2.5 rounded-full bg-white/70 shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
                />
              </motion.div>
            </motion.div>
          )}

          {/* ================================================================
           * 3. AUDIO HUB -> APPLE MUSIC EDITORIAL LANGUAGE SHEET
           * ============================================================== */}
          {activeHub === 'audio' && (
            <motion.div
              key="applemusic-lang-backdrop"
              data-testid="applemusic-lang-modal"
              dir={listDir}
              role="dialog"
              aria-modal="true"
              aria-label={copy.appleMusicTitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={handleClose}
              className="fixed inset-0 z-[95] bg-black/78 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 select-none"
            >
              <motion.div
                initial={{ y: '100%', opacity: 0.8 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[88dvh] rounded-t-[28px] sm:rounded-[26px] bg-[#141419] border border-white/12 shadow-[0_32px_90px_rgba(0,0,0,0.92)] flex flex-col overflow-hidden"
                style={{
                  backgroundImage:
                    'radial-gradient(ellipse 80% 42% at 50% 0%, rgba(250, 36, 60, 0.22) 0%, rgba(20, 20, 25, 0) 70%)',
                }}
              >
                {/* iOS Sheet Grabber */}
                <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
                  <span className="w-10 h-1 rounded-full bg-white/25" />
                </div>

                {/* Apple Music Editorial Title Header */}
                <header className="px-5 sm:px-6 pt-3 sm:pt-5 pb-3.5 border-b border-white/10 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-[#FA243C]">
                      Apple Music · Spatial Audio
                    </div>
                    <h2 className="text-[22px] sm:text-[25px] font-extrabold tracking-tight text-white truncate">
                      {copy.appleMusicTitle}
                    </h2>
                    <p className="text-[12px] text-white/60 truncate">{copy.appleMusicSubtitle}</p>
                  </div>

                  <button
                    type="button"
                    data-testid="lang-modal-close-btn"
                    onClick={handleClose}
                    aria-label={copy.back}
                    className="w-9 h-9 rounded-full bg-[#24242B] hover:bg-[#FA243C] flex items-center justify-center text-white cursor-pointer transition shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </header>

                {/* Apple Music Search + Crimson Pills */}
                <div className="px-5 sm:px-6 py-3 flex flex-col gap-2.5 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2 min-h-[40px] px-3.5 rounded-xl bg-[#24242B] border border-white/10 focus-within:border-[#FA243C]/70 transition">
                    <Search className="w-4 h-4 text-[#8E8E93] shrink-0" aria-hidden="true" />
                    <input
                      ref={searchRef}
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={copy.searchWorldLanguagesPlaceholder}
                      data-testid="lang-search-input"
                      className="w-full bg-transparent text-[13.5px] font-medium text-white placeholder:text-[#8E8E93] focus:outline-none py-1.5"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {LANGUAGE_REGIONS.map((reg) => {
                      const active = region === reg;
                      return (
                        <button
                          key={reg}
                          type="button"
                          onClick={() => {
                            playSpotifyTapSound('tap');
                            setRegion(reg);
                          }}
                          className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12px] font-bold transition cursor-pointer ${
                            active
                              ? 'bg-[#FA243C] text-white shadow-[0_6px_18px_rgba(250,36,60,0.38)]'
                              : 'bg-[#24242B] text-white/75 hover:bg-[#303039] hover:text-white'
                          }`}
                        >
                          {copy.regionLabels[reg]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Apple Music Clean Editorial Rows with Crimson Equalizer Active Indicator */}
                <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-2 divide-y divide-white/[0.07]">
                  {filteredLanguages.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center gap-3">
                      <p className="text-[14px] font-semibold text-white/80">
                        {copy.noLanguageMatched}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('');
                          setRegion('All');
                        }}
                        className="px-4 py-2 rounded-full bg-[#FA243C] text-white text-xs font-bold cursor-pointer"
                      >
                        {copy.resetLanguageSearch}
                      </button>
                    </div>
                  ) : (
                    filteredLanguages.map((item) => {
                      const isSelected = item.code === language.code;
                      return (
                        <button
                          key={item.code}
                          type="button"
                          data-testid={`lang-option-${item.code}`}
                          onClick={() => handleSelectLanguage(item)}
                          className={`w-full text-start px-3 py-3 flex items-center justify-between gap-3 rounded-xl transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#FA243C]/12' : 'hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold uppercase shrink-0 ${
                                isSelected
                                  ? 'bg-[#FA243C] text-white'
                                  : 'bg-[#24242B] text-white/75'
                              }`}
                            >
                              {item.code.split('-')[0]}
                            </span>
                            <div className="min-w-0">
                              <div
                                className={`text-[14.5px] font-bold truncate ${
                                  isSelected ? 'text-[#FB5C74]' : 'text-white'
                                }`}
                              >
                                {item.nativeName}
                              </div>
                              <div className="text-[11.5px] text-[#8E8E93] truncate">
                                {item.englishName}
                              </div>
                            </div>
                          </div>

                          {isSelected ? (
                            <div className="flex items-end gap-0.5 h-4 shrink-0" aria-hidden="true">
                              <span className="w-1 h-4 rounded-full bg-[#FA243C]" />
                              <span className="w-1 h-2.5 rounded-full bg-[#FB5C74]" />
                              <span className="w-1 h-3.5 rounded-full bg-[#FA243C]" />
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#8E8E93] shrink-0">
                              {copy.regionLabels[item.region]}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
