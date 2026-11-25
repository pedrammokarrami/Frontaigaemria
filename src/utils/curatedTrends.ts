import type { LobbyGameId, LobbySkillCardItem } from './lobbySkillCatalog';

/**
 * Daily-agent curated "best of the day" data (public/data/curated-top.json),
 * merged INTO the existing lobby skill cards — per the product rule the
 * homepage cards themselves carry the day's trends (no separate strip).
 * 100% local data: knowledge store + free public sources, zero external AI.
 */

interface CuratedItem {
  game: string;
  kind: string;
  title: string;
  titleFa?: string;
  summary: string;
  source: string;
  url: string | null;
  awarenessOnly?: boolean;
}
interface CuratedGenre {
  counts: { cards: number; trends: number; tricks: number; cheatAwareness: number; tutorials: number };
  trends: CuratedItem[];
  tricks: CuratedItem[];
  cheatAwareness: CuratedItem[];
  tutorials: CuratedItem[];
}
export interface CuratedTop {
  generatedAt: string;
  genres: Record<string, CuratedGenre>;
}

const GAME_GENRE: Record<LobbyGameId, string> = {
  fc27: 'sports',
  cs2: 'shooter',
  gta: 'open-world-story',
  valorant: 'shooter',
};

let cache: CuratedTop | null | 'loading' = 'loading';

export async function loadCuratedTop(): Promise<CuratedTop | null> {
  if (cache !== 'loading') return cache;
  try {
    const r = await fetch('/data/curated-top.json', { cache: 'no-store' });
    if (!r.ok) throw new Error(String(r.status));
    cache = (await r.json()) as CuratedTop;
  } catch {
    cache = null;
  }
  return cache;
}

/**
 * Prepend the day's curated items to the filtered skill list, spread across
 * the card slots of the active category so every slot shows fresh content.
 * Hardcoded catalog cards remain as the tail (fallback) of each list.
 */
export function mergeCuratedIntoSkills(
  gameId: LobbyGameId,
  categoryId: string,
  skills: LobbySkillCardItem[],
  curated: CuratedTop | null,
  lang: string,
): LobbySkillCardItem[] {
  const genre = curated?.genres?.[GAME_GENRE[gameId]];
  if (!genre) return skills;
  const fa = lang.slice(0, 2) === 'fa';

  const lists: CuratedItem[][] =
    categoryId === 'all'
      ? [genre.trends, genre.trends.length < 10 ? genre.tutorials : [], genre.tricks]
      : categoryId === 'attack' || categoryId === 'aim' || categoryId === 'heist'
        ? [genre.tricks, genre.cheatAwareness]
        : categoryId === 'shoot' || categoryId === 'smoke' || categoryId === 'peek' || categoryId === 'utility' || categoryId === 'flank' || categoryId === 'pass' || categoryId === 'clutch' || categoryId === 'escape' || categoryId === 'cover'
          ? [genre.tutorials, genre.trends]
          : [genre.tutorials, genre.cheatAwareness];

  const pool = lists.flat().slice(0, 10);
  if (pool.length === 0) return skills;

  // Fresh data replaces the static catalog for this category (hardcoded cards
  // only serve as offline fallback when the daily agent has no curated data).
  return pool.map((it, i) => ({
    id: `cur-${gameId}-${categoryId}-${i}`,
    num: String(91 + i),
    gameId,
    topicId: `curated-${it.kind}`,
    titleFa: fa ? it.titleFa ?? it.title : it.title,
    categoryId,
    categoryLabelFa: fa
      ? it.awarenessOnly ? 'هشدار ضدکیت' : 'ترند روز'
      : it.awarenessOnly ? 'Anti-cheat awareness' : `Trend • ${it.source}`,
    combos: it.url ? [it.url] : [],
    keywords: [it.kind, it.game],
    problemQuery: it.title,
  }));
}
