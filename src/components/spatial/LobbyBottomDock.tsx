import React, { useRef, useState } from 'react';
import { Camera, Menu, Mic, X } from 'lucide-react';
import { Ps5GameControlCenter } from './HubQuickMenuOverlays';
import { useLanguage } from '../../contexts/LanguageContext';

interface LobbyBottomDockProps {
  isListeningVoice: boolean;
  hasVideoBackdrop: boolean;
  useVideoBackdrop: boolean;
  onUploadFile: (file: File) => void;
  onToggleVoice: () => void;
  onOpenQuickDemo: () => void;
  onOpenTournamentHub: () => void;
  onOpenSocialClub: () => void;
  onOpenIdentityProfile?: () => void;
  onOpenMap: () => void;
  onOpenStore: () => void;
  onToggleBackdropMode: () => void;
}

export const LobbyBottomDock: React.FC<LobbyBottomDockProps> = ({
  isListeningVoice,
  hasVideoBackdrop,
  useVideoBackdrop,
  onUploadFile,
  onToggleVoice,
  onOpenQuickDemo,
  onOpenTournamentHub,
  onOpenSocialClub,
  onOpenIdentityProfile,
  onOpenMap,
  onOpenStore,
  onToggleBackdropMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const { copy, isRtl } = useLanguage();

  return (
    <footer
      aria-label={copy.uploadGameScene}
      data-testid="lobby-bottom-dock"
      className="relative w-full shrink-0 pt-1"
    >
      {/* Hidden native file input for gameplay photo / video clip upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        data-testid="lobby-scene-file-input"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onUploadFile(file);
            e.target.value = '';
          }
        }}
      />

      {/* PlayStation 5 Control Center Quick Menu Overlay */}
      <Ps5GameControlCenter
        open={menuOpen}
        hasVideoBackdrop={hasVideoBackdrop}
        useVideoBackdrop={useVideoBackdrop}
        onClose={() => setMenuOpen(false)}
        onOpenQuickDemo={onOpenQuickDemo}
        onOpenTournamentHub={onOpenTournamentHub}
        onOpenSocialClub={onOpenSocialClub}
        onOpenIdentityProfile={onOpenIdentityProfile}
        onOpenMap={onOpenMap}
        onOpenStore={onOpenStore}
        onToggleBackdropMode={onToggleBackdropMode}
      />

      {/* Sleek Floating Dark-Glass Dock */}
      <div
        dir="ltr"
        className="w-full rounded-full bg-slate-950/60 backdrop-blur-2xl border border-white/15 p-1.5 shadow-[0_12px_36px_rgba(2,6,23,0.65)] flex items-center gap-2"
      >
        {/* Clean Quick-Menu Button */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-label={copy.quickMenuAria}
          data-testid="lobby-quick-menu-btn"
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition cursor-pointer shrink-0 ${
            menuOpen
              ? 'bg-white/15 border-white/30 text-white'
              : 'bg-white/5 border-white/12 text-white/80 hover:bg-white/10 hover:text-white'
          }`}
        >
          {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Emerald-Rimmed Primary CTA Pill */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          data-testid="lobby-upload-scene-btn"
          dir={isRtl ? 'rtl' : 'ltr'}
          className="flex-1 min-h-[44px] px-4 rounded-full bg-slate-950/75 border border-emerald-400/55 shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-emerald-500/15 hover:border-emerald-300/80 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-[13.5px] font-extrabold text-white whitespace-nowrap">
            {copy.uploadGameScene}
          </span>
        </button>

        {/* Dedicated Voice Mic Button */}
        <button
          type="button"
          onClick={onToggleVoice}
          aria-label={copy.searchSkillsPlaceholder}
          data-testid="lobby-voice-btn"
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition cursor-pointer shrink-0 ${
            isListeningVoice
              ? 'bg-emerald-500/25 border-emerald-400/70 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.35)]'
              : 'bg-white/5 border-white/12 text-emerald-300 hover:bg-emerald-500/15 hover:border-emerald-400/45'
          }`}
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
