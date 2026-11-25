export type StageMode = "pitch" | "court" | "gun" | "map" | "moba";

export interface StagePayload {
  gameId: string;
  mode?: StageMode;
  topic?: string;
  title?: string;
  subtitle?: string;
  videoUrl?: string;
  data?: Record<string, unknown>;
}

const FOOTBALL_GAMES = new Set(["fc27", "fc26", "fc25", "fifa", "efootball"]);
const BASKETBALL_GAMES = new Set(["nba2k", "nba2k26", "nba2k27"]);
const SHOOTER_GAMES = new Set(["cs2", "warzone", "valorant", "apex", "battlefield"]);
const STRATEGY_GAMES = new Set(["dota2", "lol", "starcraft", "clashroyale"]);

export function resolveSafeStagePayload(raw: StagePayload): StagePayload {
  const gameId = (raw.gameId || "cs2").toLowerCase().trim();
  const topicLower = (raw.topic || raw.title || "").toLowerCase();
  let safeMode: StageMode = raw.mode || "map";

  // اگر بازی فوتبالی نیست، تحت هیچ شرایطی اجازه نده حالت pitch یا ترکیب فوتبالی بیاید
  if (!FOOTBALL_GAMES.has(gameId) && safeMode === "pitch") {
    if (SHOOTER_GAMES.has(gameId)) {
      safeMode = topicLower.includes("gun") || topicLower.includes("weapon") || topicLower.includes("aim")
        ? "gun"
        : "map";
    } else if (BASKETBALL_GAMES.has(gameId)) {
      safeMode = "court";
    } else if (STRATEGY_GAMES.has(gameId)) {
      safeMode = "moba";
    } else {
      safeMode = "map";
    }
  }

  const cleanTitle =
    !FOOTBALL_GAMES.has(gameId) && /real madrid|4-3-3|mbappé|vinicius/i.test(raw.title || "")
      ? `${gameId.toUpperCase()} — ${raw.topic || "Tactical Briefing"}`
      : raw.title;

  return {
    ...raw,
    gameId,
    mode: safeMode,
    title: cleanTitle,
  };
}
