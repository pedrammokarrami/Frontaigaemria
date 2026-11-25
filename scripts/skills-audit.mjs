#!/usr/bin/env node
/**
 * Skills-audit agent — for EVERY catalog game, counts what the AIPETROS
 * knowledge base currently knows (skills/lessons, problems, cheats, glitches)
 * and what the open internet documents (GitHub keyless code search + Wikipedia),
 * then writes logs/skills-audit-report.json.
 *
 * Usage: node scripts/skills-audit.mjs
 */

const UA = { 'User-Agent': 'AIPETROS-skills-audit/1.0' };
const GAMES = [
  { id: 'fc27', name: 'EA Sports FC 27', wiki: 'EA Sports FC', terms: { skills: 'fifa skills tricks tutorial', glitch: 'fifa glitch', cheat: 'fifa ultimate team bot' } },
  { id: 'efootball', name: 'eFootball', wiki: 'EFootball', terms: { skills: 'efootball pes skills', glitch: 'efootball glitch', cheat: 'efootball hack' } },
  { id: 'nba2k', name: 'NBA 2K', wiki: 'NBA 2K', terms: { skills: 'nba2k patch build', glitch: 'nba 2k glitch', cheat: 'nba 2k cheat' } },
  { id: 'mlb', name: 'MLB The Show', wiki: 'MLB: The Show', terms: { skills: 'mlb the show tips', glitch: 'mlb the show glitch', cheat: 'mlb the show cheat' } },
  { id: 'cs2', name: 'Counter-Strike 2', wiki: 'Counter-Strike 2', terms: { skills: 'cs2 aim training tutorial', glitch: 'cs2 glitch', cheat: 'cs2 cheat' } },
  { id: 'valorant', name: 'Valorant', wiki: 'Valorant (video game)', terms: { skills: 'valorant aim tutorial', glitch: 'valorant bug', cheat: 'valorant cheat' } },
  { id: 'cod', name: 'Call of Duty', wiki: 'Call of Duty', terms: { skills: 'call of duty aim tutorial', glitch: 'call of duty glitch', cheat: 'call of duty cheat' } },
  { id: 'f1-25', name: 'F1 25', wiki: 'F1 25', terms: { skills: 'f1 game setup tutorial', glitch: 'f1 game glitch', cheat: 'f1 game trainer' } },
  { id: 'dota2', name: 'Dota 2', wiki: 'Dota 2', terms: { skills: 'dota 2 mechanics tutorial', glitch: 'dota 2 bug', cheat: 'dota 2 hack' } },
  { id: 'elden-ring', name: 'Elden Ring', wiki: 'Elden Ring', terms: { skills: 'elden ring build guide', glitch: 'elden ring glitch', cheat: 'elden ring trainer' } },
  { id: 'gta', name: 'GTA V Online', wiki: 'Grand Theft Auto V', terms: { skills: 'gta 5 online mission guide', glitch: 'gta online glitch', cheat: 'gta 5 cheat trainer' } },
];

// Local KB snapshot (from coachKnowledge.ts + lobbySkillCatalog.ts at audit time)
const LOCAL_KB = {
  fc27: { lessons: 6, kbTopics: 7, categories: ['formation', 'SBC', 'shooting', 'meta players', 'defense', 'passing'] },
  efootball: { lessons: 0, kbTopics: 7, categories: [] },
  nba2k: { lessons: 0, kbTopics: 7, categories: [] },
  mlb: { lessons: 0, kbTopics: 7, categories: [] },
  cs2: { lessons: 4, kbTopics: 6, categories: ['aim', 'smokes', 'peeking', 'clutch', 'economy'] },
  valorant: { lessons: 4, kbTopics: 6, categories: ['aim', 'utility', 'site executes', 'economy'] },
  cod: { lessons: 0, kbTopics: 6, categories: [] },
  'f1-25': { lessons: 0, kbTopics: 4, categories: [] },
  dota2: { lessons: 0, kbTopics: 4, categories: [] },
  'elden-ring': { lessons: 0, kbTopics: 4, categories: [] },
  gta: { lessons: 4, kbTopics: 4, categories: ['heists', 'money', 'driving', 'survival'] },
};

async function githubCount(query) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=1`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 10000);
      const res = await fetch(url, { headers: UA, signal: ctl.signal });
      clearTimeout(timer);
      if (res.status === 403 || res.status === 429) {
        await sleep(8000);
        continue;
      }
      if (!res.ok) return null;
      const body = await res.json();
      return body?.total_count ?? null;
    } catch {
      await sleep(2000);
    }
  }
  return null;
}

async function wikiSummary(game) {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(game.wiki ?? game.name)}`, { headers: UA, signal: ctl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const body = await res.json();
    return { title: body.title, extract: (body.extract ?? '').slice(0, 200) };
  } catch {
    return null;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function auditGame(game, idx) {
  // GitHub search rate: 10/min keyless — run the three searches serially with delays
  await sleep(4000);
  const skillsRepos = await githubCount(game.terms.skills);
  await sleep(4000);
  const glitchRepos = await githubCount(game.terms.glitch);
  await sleep(4000);
  const cheatRepos = await githubCount(game.terms.cheat);
  const wiki = await wikiSummary(game);
  return {
    gameId: game.id,
    game: game.name,
    realm: game.wiki ? undefined : game.id,
    local: {
      interactiveLessons: LOCAL_KB[game.id]?.lessons ?? 0,
      kbTopicsShared: LOCAL_KB[game.id]?.kbTopics ?? 0,
      skillCategories: LOCAL_KB[game.id]?.categories ?? [],
      canAnswerFreeQuestions: (LOCAL_KB[game.id]?.lessons ?? 0) > 0,
    },
    internet: {
      skillGuideRepos: skillsRepos,
      glitchExploitRepos: glitchRepos,
      cheatTrainerRepos: cheatRepos,
      wikipedia: wiki,
    },
    verdict:
      (LOCAL_KB[game.id]?.lessons ?? 0) > 0
        ? 'FULL COACH — real lessons + free-question engine'
        : 'SHARED REALM KB ONLY — general tips, no game-specific lessons yet',
  };
}

async function main() {
  const games = [];
  for (let i = 0; i < GAMES.length; i += 1) {
    games.push(await auditGame(GAMES[i], i));
  }
  const report = {
    auditedAt: new Date().toISOString(),
    method: 'local KB introspection + keyless GitHub repo search (skills/glitch/cheat) + Wikipedia',
    games,
    summaryLine: games
      .map((g) => `${g.game}: ${g.local.interactiveLessons} lessons, ${g.internet.skillGuideRepos ?? '?'} skill repos, ${g.internet.glitchExploitRepos ?? '?'} glitch repos`)
      .join(' | '),
  };
  (await import('node:fs')).writeFileSync('logs/skills-audit-report.json', JSON.stringify(report, null, 1));
  console.log(report.summaryLine);
}

main().catch((e) => {
  console.error('audit failed:', e.message);
  process.exit(1);
});
