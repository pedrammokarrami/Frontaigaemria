import { motion } from 'motion/react';
import { Crosshair, Play, Shield, Trophy } from 'lucide-react';

export type LobbyTab = 'play' | 'ai-coach' | 'competitions' | 'my-club';

interface TileCarouselProps {
  activeTab: LobbyTab;
  onSelectTab: (tab: LobbyTab) => void;
}

const TILES: {
  id: LobbyTab;
  title: string;
  subtitle: string;
  Icon: typeof Play;
}[] = [
  { id: 'play', title: 'PLAY', subtitle: 'Match Lobby', Icon: Play },
  { id: 'ai-coach', title: 'AI COACH', subtitle: 'Analysis & Drills', Icon: Crosshair },
  { id: 'competitions', title: 'COMPETITIONS', subtitle: 'Cups & Sectors', Icon: Trophy },
  { id: 'my-club', title: 'MY CLUB', subtitle: 'Career ID', Icon: Shield },
];

export function TileCarousel({ activeTab, onSelectTab }: TileCarouselProps) {
  return (
    <nav aria-label="Primary Navigation" className="relative z-30 pb-4 pt-2">
      <div className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4">
        {TILES.map((tile) => {
          const active = activeTab === tile.id;
          return (
            <motion.button
              key={tile.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.14 }}
              onClick={() => onSelectTab(tile.id)}
              aria-current={active ? 'page' : undefined}
              className={`aaa-glass flex min-h-[76px] min-w-[138px] shrink-0 snap-start flex-col justify-between rounded-2xl p-3.5 text-left transition-colors ${
                active
                  ? 'border-[#CCFF00]/75 bg-[#161920]/90'
                  : 'border-white/10 hover:border-white/25'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <tile.Icon
                  className={`h-4 w-4 ${active ? 'text-[#CCFF00]' : 'text-[#F4F5F7]/65'}`}
                />
                <span
                  className={`h-1 w-6 rounded-full transition-colors ${
                    active ? 'bg-[#CCFF00]' : 'bg-white/15'
                  }`}
                />
              </div>
              <div className="mt-2">
                <div
                  className={`font-display text-base font-extrabold tracking-wide whitespace-nowrap ${
                    active ? 'text-[#CCFF00]' : 'text-[#F4F5F7]'
                  }`}
                >
                  {tile.title}
                </div>
                <div className="text-[11px] font-medium text-[#F4F5F7]/60 whitespace-nowrap">
                  {tile.subtitle}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
