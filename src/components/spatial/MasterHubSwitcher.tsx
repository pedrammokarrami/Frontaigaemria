import React from 'react';
import { motion } from 'motion/react';
import { Film, Gamepad2, Headphones } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export type MasterHubId = 'game' | 'cinema' | 'audio';

interface MasterHubSwitcherProps {
  activeHub: MasterHubId;
  onSelectHub: (hub: MasterHubId) => void;
  accentHex?: string;
}

export const MasterHubSwitcher: React.FC<MasterHubSwitcherProps> = ({
  activeHub,
  onSelectHub,
  accentHex,
}) => {
  const { copy, isRtl } = useLanguage();

  const hubItems: Array<{
    id: MasterHubId;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    defaultGlow: string;
  }> = [
    { id: 'game', label: copy.hubGame, Icon: Gamepad2, defaultGlow: '#10B981' },
    { id: 'cinema', label: copy.hubCinema, Icon: Film, defaultGlow: '#F59E0B' },
    { id: 'audio', label: copy.hubAudio, Icon: Headphones, defaultGlow: '#38BDF8' },
  ];

  return (
    <div
      data-testid="master-hub-switcher"
      dir={isRtl ? 'rtl' : 'ltr'}
      className="inline-flex items-center gap-0.5 sm:gap-1 p-1 rounded-full bg-slate-950/75 backdrop-blur-2xl border border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.55)] max-w-full overflow-x-auto no-scrollbar"
    >
      {hubItems.map(({ id, label, Icon, defaultGlow }) => {
        const isActive = activeHub === id;
        const glow = isActive && accentHex ? accentHex : defaultGlow;
        return (
          <button
            key={id}
            type="button"
            data-testid={`hub-switch-${id}`}
            aria-pressed={isActive}
            onClick={() => onSelectHub(id)}
            className={`relative shrink-0 whitespace-nowrap min-h-[36px] px-2.5 sm:px-3.5 rounded-full text-[11px] sm:text-[12px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              isActive ? 'text-white' : 'text-white/65 hover:text-white'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="master-hub-active-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-full border"
                style={{
                  backgroundColor: `${glow}24`,
                  borderColor: `${glow}80`,
                  boxShadow: `0 0 18px ${glow}35`,
                }}
              />
            )}
            <Icon className="relative z-10 w-3.5 h-3.5 shrink-0" />
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
};
