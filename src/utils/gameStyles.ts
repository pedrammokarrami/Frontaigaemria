import { LOBBY_GAME_TABS, type LobbyGameId } from './lobbySkillCatalog';

/**
 * Game STYLES (سبک بازی) — the lobby top bar shows style categories, not game names.
 * A style groups one or more games; the last-used game inside a style is remembered.
 * User preference ("default = last selected") is persisted in localStorage.
 */

export interface GameStyle {
  id: string;
  labelFa: string;
  labelEn: string;
  icon: string;
  accentHex: string;
  games: LobbyGameId[];
}

export const GAME_STYLES: GameStyle[] = [
  { id: 'sports', labelFa: 'ورزشی', labelEn: 'Sports', icon: '⚽', accentHex: '#10B981', games: ['fc27'] },
  { id: 'shooter', labelFa: 'شوتر', labelEn: 'Shooter', icon: '🎯', accentHex: '#22D3EE', games: ['cs2', 'valorant'] },
  { id: 'story', labelFa: 'داستانی', labelEn: 'Story', icon: '🌆', accentHex: '#EC4899', games: ['gta'] },
  { id: 'strategy', labelFa: 'استراتژی', labelEn: 'Strategy', icon: '🧠', accentHex: '#F59E0B', games: ['cs2'] },
];

const STYLE_ACCENTS: Record<string, string> = {
  sports: '#10B981',
  shooter: '#22D3EE',
  story: '#EC4899',
  strategy: '#F59E0B',
};

export function gameStyleForGame(gameId: LobbyGameId, preferredStyleId?: string): GameStyle {
  if (preferredStyleId) {
    const preferred = GAME_STYLES.find((s) => s.id === preferredStyleId && s.games.includes(gameId));
    if (preferred) return preferred;
  }
  const hit = GAME_STYLES.find((s) => s.games.includes(gameId));
  if (hit) return hit;
  const realm = LOBBY_GAME_TABS.find((t) => t.id === gameId)?.realm;
  if (realm && STYLE_ACCENTS[realm]) {
    return { id: realm, labelFa: realm, labelEn: realm, icon: '🎮', accentHex: STYLE_ACCENTS[realm], games: [gameId] };
  }
  return GAME_STYLES[0];
}

const LAST_STYLE_KEY = 'aipetros_last_game_style';
const LAST_GAME_KEY = 'aipetros_last_game';

export interface LastStyleSelection {
  styleId: string;
  gameId: LobbyGameId;
}

export function loadLastStyleSelection(): LastStyleSelection | null {
  try {
    const styleId = localStorage.getItem(LAST_STYLE_KEY);
    const gameId = localStorage.getItem(LAST_GAME_KEY) as LobbyGameId | null;
    if (!gameId || !LOBBY_GAME_TABS.some((t) => t.id === gameId)) return null;
    const style = styleId && GAME_STYLES.some((s) => s.id === styleId) ? styleId : gameStyleForGame(gameId).id;
    return { styleId: style, gameId };
  } catch {
    return null;
  }
}

export function saveLastStyleSelection(gameId: LobbyGameId, styleId?: string): void {
  try {
    localStorage.setItem(LAST_GAME_KEY, gameId);
    localStorage.setItem(LAST_STYLE_KEY, styleId ?? gameStyleForGame(gameId).id);
  } catch {
    // storage unavailable — non-fatal
  }
}

export function defaultGameForStyle(styleId: string): LobbyGameId {
  const saved = loadLastStyleSelection();
  const style = GAME_STYLES.find((s) => s.id === styleId) ?? GAME_STYLES[0];
  if (saved && style.games.includes(saved.gameId)) return saved.gameId;
  return style.games[0];
}
