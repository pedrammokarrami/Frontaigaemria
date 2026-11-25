#!/usr/bin/env node
/**
 * Curated Top-10 per genre × section for the AIGAMERIA homepage.
 *
 * Reads the local knowledge store (.data/aipetros.sqlite — filled by
 * scripts/knowledge-ingest.mjs, 100% local, no external AI) and ranks the
 * BEST 10 items per section for every game genre:
 *
 *   sections:
 *     trends    — live-harvested cards (they carry a real source URL), newest first
 *     tricks    — trick + glitch cards (cheat cards are AWARENESS-only, flagged)
 *     tutorials — question/qa coaching cards, best-known first
 *
 * Output: public/data/curated-top.json  → served statically, the homepage
 * fetches it (no server change, no external API).
 *
 * Usage: node scripts/curate-top.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const DB_FILE = path.join(ROOT, '..', '.data', 'aipetros.sqlite');
const db = new DatabaseSync(DB_FILE);

/** genre → game ids (knowledge store ids) */
const GENRES = {
  sports: ['fc27', 'ea-sports-fc-27-and-ea-sports-fc-26', 'efootball', 'nba2k', 'mlb', 'rocket-league'],
  shooter: ['cod', 'call-of-duty-modern-warfare-4-warzone-hq', 'cs2', 'valorant', 'overwatch-2', 'the-finals', 'delta-force', 'battlefield-6', 'arena-breakout-infinite', 'escape-from-tarkov', 'hunt-showdown-1896', 'war-thunder', 'world-of-tanks'],
  'battle-royale': ['fortnite', 'pubg-battlegrounds', 'apex-legends', 'marvel-rivals', 'the-finals'],
  'open-world-story': ['gta', 'red-dead-redemption-2', 'cyberpunk-2077', 'the-witcher-3-wild-hunt', 'elden-ring', 'elden-ring-nightreign', 'the-elder-scrolls-v-skyrim-special-edition', 'kingdom-come-deliverance-ii', 'fallout-4', 'monster-hunter-wilds', 'monster-hunter-world', 'baldur-s-gate-3', 'crimson-desert', 'phantom-blade-zero'],
  racing: ['forza-horizon', 'forza-horizon-6', 'f1-25'],
  'survival-sandbox': ['minecraft', 'rust', 'valheim', 'terraria', '7-days-to-die', 'dayz', 'project-zomboid', 'once-human', 'enshrouded', 'palworld', 'the-isle', 'don-t-starve-together'],
  'mmo-moba': ['dota2', 'league-of-legends', 'world-of-warcraft', 'final-fantasy-xiv-online', 'path-of-exile', 'path-of-exile-2', 'genshin-impact', 'honkai-star-rail', 'warframe', 'old-school-runescape', 'deadlock', 'eternal-return'],
  horror: ['dead-by-daylight', 'r-e-p-o', 'it-takes-two', 'peak'],
};

/**
 * Persian card labels — the agent renders every curated card in plain,
 * simple Farsi so a normal player instantly understands it.
 */
const KIND_FA = { trick: 'ترفند', glitch: 'گلیچ و باگ', cheat: 'هشدار ضدکیت', qa: 'آموزش', question: 'آموزش' };
const cleanTitle = (t) => {
  let s = t.replace(/^[^/]+\//, '') // strip repo owner/
    .replace(/\.(github|md|txt|exe)$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length > 64) s = `${s.slice(0, 61)}…`;
  return s || t;
};
const faLabel = (kind, title) => {
  const k = KIND_FA[kind];
  const c = cleanTitle(title);
  return k ? `${k}: ${c}` : c;
};

/**
 * Humanize raw titles for the EN core: no owner/repo slugs, no mixed
 * Persian leftovers, no 0-1-word junk. Repo names become readable phrases.
 */
/**
 * SPAM FILTER — glitch/exploit/cheat repos and raw `owner/repo` slugs are
 * never user-facing content. Exploit awareness lives only in cheatAwareness.
 */
const SPAM_RX = /glitch|exploit|cheat|hack|trainer|menu|bypass|unlocker|free[- ]?coins|generator/i;
const isRepoSlug = (t) => {
  const s = t.trim();
  return /^[^/]+\/[^/]+$/.test(s) || !s.includes(' '); // user/repo or single token
};

const humanizeTitle = (t) => {
  if (/\p{Script=Arabic}/u.test(t)) return '';
  let s = t.replace(/^[^/]+\//, '')
    .replace(/\.(github|md|txt|exe)$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // drop pure repo-slug fragments like "byte" / "myqtech" that add no meaning
  if (s.length < 10 || !s.includes(' ')) return '';
  // drop disambiguation junk already rejected elsewhere
  if (s.length > 64) s = `${s.slice(0, 61)}…`;
  return s;
};

const SECTION_KINDS = {
  trends: null, // handled below (cards with a live source URL)
  tricks: ['trick', 'glitch'],
  tutorials: ['question', 'qa'],
};

const cards = db.prepare(`
  SELECT game_id, kind, dedupe_key, title, body, source, url, updated_at
  FROM knowledge_cards
  ORDER BY updated_at DESC
`).all();

/**
 * Stale-generation filter — the homepage must show CURRENT-gen trends only
 * (FC 27, not FIFA 19; NBA 2K27, not 2K20; no PES-era repos).
 */
const STALE_RE = /fifa[-_ ]?(1[0-9]|2[0-5])|nba[-_ ]?2k[-_ ]?(1[0-9]|2[0-6])|\bpes\b|fifa-19|2k20|2k21|2k22|2k23|2k24|2k25|2k26/i;
const isStale = (c) => STALE_RE.test(`${c.title} ${c.url ?? ''}`);

/**
 * Quality gate for trend picks: keep only cards whose source looks on-topic
 * (official pages, Steam, GitHub, Reddit, EA/2K) or whose Wikipedia title
 * matches the game — disambiguation pages like "Formation (song)" are dropped.
 */
const TRUSTED_HOST = /(github\.com|steampowered\.com|reddit\.com|ea\.com|2k\.com|rockstargames\.com|riotgames\.com|counter-strike\.net|fortnite\.com|fifa\.com)/i;
const isRelevant = (c) => {
  if (!c.url) return false;
  const u = c.url.toLowerCase();
  if (TRUSTED_HOST.test(u)) return true;
  if (/wikipedia\.org/.test(u)) {
    const tokens = c.game_id.replace(/-/g, ' ').split(' ').filter((t) => t.length > 3);
    return tokens.some((t) => u.includes(t));
  }
  return true;
};

const out = {
  generatedAt: new Date().toISOString(),
  note: 'Curated locally by the AIGAMERIA daily agent. Zero external AI. Cheat cards are awareness-only.',
  genres: {},
};

for (const [genre, ids] of Object.entries(GENRES)) {
  const mine = cards.filter((c) => ids.includes(c.game_id) && !isStale(c));
  if (mine.length === 0) continue;

  const trim = (c, kind) => ({
    game: c.game_id,
    kind,
    title: c.title,
    titleFa: faLabel(kind, c.title),
    summary: (c.body || '').slice(0, 220),
    source: c.source || 'aigameria-knowledge',
    url: c.url || null,
    awarenessOnly: kind === 'cheat',
    updatedAt: c.updated_at,
  });

  const live = mine.filter((c) => isRelevant(c) && !isStale(c));
  const trends = [
    ...live.filter((c) => c.kind !== 'cheat' && !SPAM_RX.test(c.title) && !isRepoSlug(c.title)),
  ]
    .slice(0, 10)
    .map((c) => trim(c, c.kind));

  const tricks = SECTION_KINDS.tricks
    .flatMap((kind) => mine.filter((c) => c.kind === kind && (!c.url || isRelevant(c))))
    .filter((c) => !SPAM_RX.test(c.title) && !isRepoSlug(c.title))
    .slice(0, 10)
    .map((c) => trim(c, c.kind));

  const cheats = mine.filter((c) => c.kind === 'cheat').slice(0, 10).map((c) => trim(c, 'cheat'))
    .filter((c) => !/\p{Script=Arabic}/u.test(c.title));

  const tutorials = SECTION_KINDS.tutorials
    .flatMap((kind) => mine.filter((c) => c.kind === kind))
    .map((c) => trim(c, c.kind))
    // EN core must be English-only: legacy Persian question-card titles are
    // excluded, repo slugs are humanized, junk titles dropped. Glitch/exploit
    // listing pages stay out of user-facing tutorials too.
    .filter((c) => !/\p{Script=Arabic}/u.test(c.title))
    .filter((c) => !SPAM_RX.test(c.title) && !isRepoSlug(c.title))
    .map((c) => ({ ...c, title: humanizeTitle(c.title) }))
    .filter((c) => c.title)
    .slice(0, 10);

  out.genres[genre] = {
    games: ids.filter((id) => mine.some((c) => c.game_id === id)),
    counts: { cards: mine.length, trends: trends.length, tricks: tricks.length, cheatAwareness: cheats.length, tutorials: tutorials.length },
    trends,
    tricks,
    cheatAwareness: cheats,
    tutorials,
  };
}

const OUT_DIR = path.join(ROOT, '..', 'public', 'data');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'curated-top.json'), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(ROOT, '..', 'logs', 'curated-top-summary.json'), JSON.stringify(
  Object.fromEntries(Object.entries(out.genres).map(([g, v]) => [g, v.counts])), null, 2));

for (const [g, v] of Object.entries(out.genres)) {
  console.log(`[curate] ${g}: cards=${v.counts.cards} trends=${v.counts.trends} tricks=${v.counts.tricks} cheatA=${v.counts.cheatAwareness} tutorials=${v.counts.tutorials}`);
}
console.log('[curate] wrote public/data/curated-top.json');
