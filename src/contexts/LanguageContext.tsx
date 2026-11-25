import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LANGUAGE_CODE,
  type UiCopy,
  type WorldLanguageItem,
  findWorldLanguage,
  getUiCopy,
} from '../utils/i18nEngine';
import { installGlobalLanguageOverride } from '../utils/languageOverride';

const LANGUAGE_STORAGE_KEY = 'aipetros-language-v1';

interface LanguageContextValue {
  languageCode: string;
  language: WorldLanguageItem;
  isRtl: boolean;
  copy: UiCopy;
  setLanguageCode: (code: string) => void;
  isLanguageModalOpen: boolean;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  languageCode: DEFAULT_LANGUAGE_CODE,
  language: findWorldLanguage(DEFAULT_LANGUAGE_CODE),
  isRtl: false,
  copy: getUiCopy(DEFAULT_LANGUAGE_CODE),
  setLanguageCode: () => undefined,
  isLanguageModalOpen: false,
  openLanguageModal: () => undefined,
  closeLanguageModal: () => undefined,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [languageCode, setLanguageCodeState] = useState<string>(() => {
    try {
      const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && saved.trim().length > 0) {
        return findWorldLanguage(saved).code;
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_LANGUAGE_CODE;
  });

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  const language = useMemo(() => findWorldLanguage(languageCode), [languageCode]);
  const isRtl = language.dir === 'rtl';
  const copy = useMemo(() => getUiCopy(language.code), [language.code]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language.code);
    } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language.code;
      document.documentElement.dataset.lang = language.code;
    }
    // Global override: hardcoded Persian UI strings follow the chosen language too.
    const base = language.code.toLowerCase();
    const isNativeFa = base === 'fa' || base === 'prs' || base.startsWith('fa-');
    installGlobalLanguageOverride(language.code, !isNativeFa);
  }, [language.code]);

  const setLanguageCode = useCallback((code: string) => {
    setLanguageCodeState(findWorldLanguage(code).code);
  }, []);

  const openLanguageModal = useCallback(() => setIsLanguageModalOpen(true), []);
  const closeLanguageModal = useCallback(() => setIsLanguageModalOpen(false), []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      languageCode: language.code,
      language,
      isRtl,
      copy,
      setLanguageCode,
      isLanguageModalOpen,
      openLanguageModal,
      closeLanguageModal,
    }),
    [language, isRtl, copy, setLanguageCode, isLanguageModalOpen, openLanguageModal, closeLanguageModal]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
