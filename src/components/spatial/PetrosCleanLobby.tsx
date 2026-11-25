import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Ps5GameControlCenter } from './HubQuickMenuOverlays';
import { CoachStage3D } from './CoachStage3D';
import type { MediaManifest, RealmId } from '../../types/spatial';
import { useLanguage } from '../../contexts/LanguageContext';

interface PetrosCleanLobbyProps {
  realm: RealmId;
  manifest: MediaManifest;
  useVideoBackdrop: boolean;
  onToggleBackdropMode: () => void;
  onOpenQuickDemo: () => void;
  onOpenTournamentHub: () => void;
  onOpenSocialClub: () => void;
  onOpenIdentityProfile: () => void;
  onOpenMap: () => void;
  onOpenStore: () => void;
}

/**
 * Clean raw first page: the AIGAMERIA wordmark over the stadium-tunnel
 * backdrop — zero data, zero lists, zero docks. Only the left-side quick-menu
 * button (PlayStation 5 Control Center style) remains.
 */
export const PetrosCleanLobby: React.FC<PetrosCleanLobbyProps> = ({
  realm,
  manifest,
  useVideoBackdrop,
  onToggleBackdropMode,
  onOpenQuickDemo,
  onOpenTournamentHub,
  onOpenSocialClub,
  onOpenIdentityProfile,
  onOpenMap,
  onOpenStore,
}) => {
  const { copy } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="absolute inset-0" data-testid="clean-lobby-root">
      <CoachStage3D
        realm={realm}
        manifest={manifest}
        isSpeaking={false}
        useVideoBackdrop={useVideoBackdrop}
        customBackdropUrl={null}
        customAccentHex={null}
        customSecondaryHex={null}
      />

      {/* Left-side quick-menu trigger (the only control on the first page) */}
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-expanded={menuOpen}
        aria-label={copy.quickMenuAria}
        data-testid="clean-lobby-menu-btn"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full flex items-center justify-center border backdrop-blur-xl transition cursor-pointer shadow-[0_10px_30px_rgba(2,6,23,0.6)] bg-slate-950/55 border-white/18 text-white/85 hover:bg-white/12 hover:text-white active:scale-95"
      >
        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Center wordmark — raw AIGAMERIA, no data */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="text-center px-6">
          <h1
            data-testid="clean-lobby-wordmark"
            className="text-[13vw] sm:text-6xl md:text-7xl font-black tracking-[0.18em] text-white"
            style={{
              textShadow: '0 0 34px rgba(0,240,255,0.35), 0 6px 26px rgba(0,0,0,0.8)',
              letterSpacing: '0.18em',
            }}
          >
            AIGAMERIA
          </h1>
          <p className="mt-3 text-[11px] sm:text-sm font-bold tracking-[0.4em] text-white/55 uppercase">
            play · learn · win
          </p>
        </div>
      </div>

      {/* PlayStation 5 Control Center quick menu (PS-style) */}
      <Ps5GameControlCenter
        open={menuOpen}
        hasVideoBackdrop={Boolean(manifest.lobbyVideoUrl)}
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
    </div>
  );
};
