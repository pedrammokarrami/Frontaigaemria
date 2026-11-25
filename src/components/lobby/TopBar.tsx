import { useState } from 'react';
import { MEDIA_ASSETS } from '../../config/mediaAssets';
import type { GamerProfile } from '../../types/aipetros';

interface TopBarProps {
  profile: GamerProfile;
  onOpenVault: () => void;
}

export function TopBar({ profile, onOpenVault }: TopBarProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const claimableCount = profile.missions.filter((m) => m.completed && !m.claimed).length;

  return (
    <header className="relative z-20 flex items-center justify-between px-4 pb-2 pt-3.5">
      {/* Left: Player Avatar + Gamer Tag */}
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/15 bg-[#161920]">
          {!avatarFailed ? (
            <img
              src={MEDIA_ASSETS.playerAvatar}
              alt={profile.handle}
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-sm font-bold text-[#F4F5F7]">
              {profile.handle.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <span className="truncate font-display text-lg font-bold tracking-wide text-[#F4F5F7]">
          {profile.handle}
        </span>
      </div>

      {/* Right: Interactive XP / PTS Badge -> Opens Tactical Vault & Missions */}
      <button
        type="button"
        onClick={onOpenVault}
        aria-label="Open Tactical Vault and Missions"
        className="aaa-glass-subtle flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors hover:border-[#CCFF00]/55 active:scale-[0.98]"
      >
        <span className="font-mono-tabular font-bold text-[#F4F5F7]">
          {profile.wallet.xp.toLocaleString()} XP
        </span>
        <span aria-hidden="true" className="text-white/30">
          /
        </span>
        <span className="font-mono-tabular font-bold text-[#CCFF00]">
          {profile.wallet.platformPoints.toLocaleString()} PTS
        </span>
        {claimableCount > 0 && (
          <span className="ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#CCFF00] px-1 font-mono-tabular text-[10px] font-extrabold text-[#0A0B0E]">
            {claimableCount}
          </span>
        )}
      </button>
    </header>
  );
}
