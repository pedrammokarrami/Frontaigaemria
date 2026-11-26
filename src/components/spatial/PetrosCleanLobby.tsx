import React, { useEffect, useState } from 'react';
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
interface ApiMenuPayload {
  version: string;
  brand: { name: string; tagline: string };
  items: Array<{
    id: string;
    title: string;
    subtitle: string;
    accent_hex: string;
    badge: string;
    action: string;
  }>;
}

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
  const [apiMenu, setApiMenu] = useState<ApiMenuPayload | null>(null);
  const [menuFailed, setMenuFailed] = useState(false);

  // The PS5 Control Center auto-opens as soon as the API menu arrives —
  // the user lands directly on the live menu tiles (no hidden buttons).
  useEffect(() => {
    if (apiMenu && !menuOpen) setMenuOpen(true);
  }, [apiMenu]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const resp = await fetch('/api/v1/menu?lang=en', { headers: { Accept: 'application/json' } });
        if (!resp.ok) throw new Error(`menu HTTP ${resp.status}`);
        const json = await resp.json();
        if (!alive) return;
        const payload = json && typeof json === 'object' && 'data' in json ? (json as { data: ApiMenuPayload }).data : (json as unknown as ApiMenuPayload);
        setApiMenu(payload);
        setMenuFailed(false);
      } catch (err) {
        console.error('[AIGAMERIA] menu API failed — showing retry UI:', err);
        if (alive) setMenuFailed(true);
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  const retryMenu = () => {
    setMenuFailed(false);
    let alive = true;
    (async () => {
      try {
        const resp = await fetch('/api/v1/menu?lang=en', { headers: { Accept: 'application/json' } });
        if (!resp.ok) throw new Error(`menu HTTP ${resp.status}`);
        const json = await resp.json();
        if (!alive) return;
        const payload = json && typeof json === 'object' && 'data' in json ? (json as { data: ApiMenuPayload }).data : (json as unknown as ApiMenuPayload);
        setApiMenu(payload);
      } catch (err) {
        console.error('[AIGAMERIA] menu API retry failed:', err);
        setMenuFailed(true);
      }
    })();
  };

  // Every tile, label and version comes from the API — zero hardcoded data.
  const apiMenuDescriptors: import('../../utils/hubQuickMenu').HubMenuDescriptor[] | null = apiMenu
    ? apiMenu.items.map((item) => ({
        id: item.action || item.id,
        titleFa: item.title,
        subtitleFa: item.subtitle,
        accentHex: item.accent_hex || '#38BDF8',
        badgeText: item.badge,
      }))
    : null;

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
            {apiMenu?.brand.name || ''}
          </h1>
          {apiMenu?.brand.tagline ? (
            <p className="mt-3 text-[11px] sm:text-sm font-bold tracking-[0.4em] text-white/55 uppercase">
              {apiMenu.brand.tagline}
            </p>
          ) : null}
          {apiMenu?.version ? (
            <p className="mt-2 text-[10px] font-bold tracking-[0.3em] text-white/35 uppercase">
              v{apiMenu.version}
            </p>
          ) : null}
          {menuFailed && !apiMenu ? (
            <div className="mt-6 pointer-events-auto">
              <p className="text-[13px] font-bold text-white/85">Menu service unreachable</p>
              <p className="mt-1 text-[11px] text-white/45">The backend did not answer — menus will appear once it responds.</p>
              <button
                type="button"
                onClick={retryMenu}
                data-testid="clean-lobby-retry-btn"
                className="mt-3 px-4 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white text-[12.5px] font-extrabold cursor-pointer transition"
              >
                Retry now
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* PlayStation 5 Control Center quick menu (PS-style) */}
      <Ps5GameControlCenter
        apiMenuItems={apiMenuDescriptors}
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
