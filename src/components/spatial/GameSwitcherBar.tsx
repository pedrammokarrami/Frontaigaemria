import React from 'react';
import { ShieldCheck, Trophy, Users } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { GAME_STYLES, gameStyleForGame, defaultGameForStyle, type GameStyle } from '../../utils/gameStyles';
import { LOBBY_GAME_TABS, type LobbyGameId } from '../../utils/lobbySkillCatalog';

interface GameSwitcherBarProps {
  activeGameId: LobbyGameId;
  activeStyleId: string;
  onSelectGame: (gameId: LobbyGameId) => void;
  onSelectStyle: (styleId: string) => void;
  onOpenTournamentHub: () => void;
  onOpenSocialClub: () => void;
  onOpenIdentityProfile?: () => void;
}

/**
 * Top bar shows game STYLES (سبک بازی: ورزشی / شوتر / داستانی / استراتژی),
 * NOT raw game names. Clicking a style jumps to the last-used game in it.
 * When the active style holds more than one game, small game pills appear below.
 */
export const GameSwitcherBar: React.FC<GameSwitcherBarProps> = ({
  activeGameId,
  activeStyleId,
  onSelectGame,
  onSelectStyle,
  onOpenTournamentHub,
  onOpenSocialClub,
  onOpenIdentityProfile,
}) => {
  const { copy, isRtl, languageCode } = useLanguage();
  const isFaLang = languageCode?.startsWith('fa') ?? true;
  const isRtlLang = isRtl;
  const activeStyle: GameStyle = GAME_STYLES.find((s) => s.id === activeStyleId) ?? gameStyleForGame(activeGameId);

  return (
    <header className="w-full shrink-0">
      <nav
        aria-label={`${copy.hubGame}, ${copy.tournament}, ${copy.socialClub}`}
        data-testid="game-switcher-bar"
        dir="ltr"
        className="flex items-center justify-start gap-1.5 overflow-x-auto no-scrollbar py-1 px-0.5"
      >
        {GAME_STYLES.map((style) => {
          const isActive = style.id === activeStyle.id;
          return (
            <button
              key={style.id}
              type="button"
              data-testid={`game-style-pill-${style.id}`}
              aria-pressed={isActive}
              onClick={() => {
                if (isActive && style.games.length === 1) return; // already here
                const target = defaultGameForStyle(style.id);
                onSelectStyle(style.id);
                onSelectGame(target);
              }}
              className={`shrink-0 whitespace-nowrap min-h-[38px] px-3 sm:px-4 rounded-full text-[12.5px] font-black tracking-wide backdrop-blur-xl transition-all duration-200 cursor-pointer border inline-flex items-center gap-1.5 ${
                isActive
                  ? 'border-emerald-400/70 bg-emerald-500/20 text-white shadow-[0_0_16px_rgba(16,185,129,0.3)]'
                  : 'border-white/15 bg-slate-950/45 text-white/80 hover:bg-slate-900/65 hover:text-white'
              }`}
            >
              <span aria-hidden="true">{style.icon}</span>
              {isFaLang ? (
                <>
                  <span dir="rtl">{style.labelFa}</span>
                  <span dir="ltr" className="text-[10.5px] font-bold opacity-55">{style.labelEn}</span>
                </>
              ) : (
                <span dir="ltr">{style.labelEn}</span>
              )}
            </button>
          );
        })}

        {onOpenIdentityProfile && (
          <button
            key="spatial-identity"
            type="button"
            data-testid="open-spatial-identity-top-btn"
            onClick={onOpenIdentityProfile}
            className="shrink-0 whitespace-nowrap min-h-[38px] px-2.5 sm:px-3.5 rounded-full text-[11.5px] font-bold backdrop-blur-xl transition-all duration-200 cursor-pointer border border-sky-300/45 bg-slate-950/55 text-sky-100 hover:border-sky-300/80 hover:bg-sky-500/20 hover:text-white inline-flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            <span>{copy.spatialId}</span>
          </button>
        )}

        <button
          key="tournament-hub"
          type="button"
          data-testid="open-tournament-hub-top-btn"
          onClick={onOpenTournamentHub}
          dir={isRtl ? 'rtl' : 'ltr'}
          className="shrink-0 whitespace-nowrap min-h-[38px] px-2.5 sm:px-3.5 rounded-full text-[11.5px] font-bold backdrop-blur-xl transition-all duration-200 cursor-pointer border border-amber-400/40 bg-slate-950/55 text-amber-200 hover:border-amber-300/70 hover:bg-amber-500/15 hover:text-white inline-flex items-center gap-1"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>{copy.tournament}</span>
        </button>

        <button
          key="social-club"
          type="button"
          data-testid="open-gta-social-top-btn"
          onClick={onOpenSocialClub}
          dir={isRtl ? 'rtl' : 'ltr'}
          className="shrink-0 whitespace-nowrap min-h-[38px] px-2.5 sm:px-3.5 rounded-full text-[11.5px] font-bold backdrop-blur-xl transition-all duration-200 cursor-pointer border border-white/15 bg-slate-950/45 text-cyan-200 hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-white inline-flex items-center gap-1"
        >
          <Users className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
          <span>{copy.socialClub}</span>
        </button>
      </nav>

    </header>
  );
};
