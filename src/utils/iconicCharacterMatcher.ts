import {
  ICONIC_GAME_CHARACTERS,
  type IconicGameCharacter,
} from '../data/iconicGameCharacters.ts';
import type { CrossGameKey } from '../data/offlineAgentsData.ts';
import type { HologramGender } from './hologramAvatarEngine.ts';

export interface CharacterMatchInput {
  gender: HologramGender;
  age: number;
  activeGameKey: CrossGameKey;
  winRatePct: number;
  tacticalConsistencyPct: number;
  competitiveRating: number;
}

export interface ScoredIconicCharacter {
  character: IconicGameCharacter;
  similarityPct: number;
  rawScore: number;
  ageDelta: number;
  matchReasonsFa: string[];
}

export interface CharacterMatchReport {
  topMatch: ScoredIconicCharacter;
  runnerUps: ScoredIconicCharacter[];
  allRanked: ScoredIconicCharacter[];
  totalRosterCount: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Deterministically ranks all 50 iconic game industry characters against the player's
 * gender, age (8..99), active title, and competitive telemetry to surface the #1 closest legend.
 */
export function matchIconicCharacters(input: CharacterMatchInput): CharacterMatchReport {
  const age = Math.round(clamp(input.age, 8, 99));
  const winRate = clamp(input.winRatePct, 0, 100);
  const consistency = clamp(input.tacticalConsistencyPct, 0, 100);
  const rating = clamp(input.competitiveRating, 500, 4000);

  const scored: ScoredIconicCharacter[] = ICONIC_GAME_CHARACTERS.map((char) => {
    // 1. Gender Alignment (42 pts max — ensures accurate gender representation while keeping full 50 roster ranked)
    const genderScore = char.gender === input.gender ? 42 : 0;

    // 2. Age Fit & Proximity across 8..99 (34 pts max)
    const ageDelta = Math.abs(age - char.canonicalAge);
    const inBand = age >= char.minAgeFit && age <= char.maxAgeFit;
    const bandBonus = inBand ? 14 : 0;
    const ageGaussian = Math.exp(-Math.pow(ageDelta / 11.5, 2)) * 20;
    const ageScore = bandBonus + ageGaussian;

    // 3. Cross-Game Affinity (12 pts max)
    const gameIdx = char.preferredGames.indexOf(input.activeGameKey);
    const gameScore =
      gameIdx === 0 ? 12 : gameIdx === 1 ? 9.5 : gameIdx >= 2 ? 7.5 : 3.5;

    // 4. Competitive Telemetry Similarity (12 pts max)
    const wrDiff = Math.abs(winRate - char.targetWinRate);
    const consDiff = Math.abs(consistency - char.targetConsistency);
    const mmrDiff = Math.abs(rating - char.targetRating);
    const telemetryScore =
      Math.max(0, 4 - wrDiff * 0.25) +
      Math.max(0, 4 - consDiff * 0.25) +
      Math.max(0, 4 - mmrDiff / 140);

    const rawScore = genderScore + ageScore + gameScore + telemetryScore;
    const similarityPct = Math.round(clamp(54 + rawScore * 0.45, 58, 99));

    const matchReasonsFa: string[] = [];
    if (char.gender === input.gender) {
      matchReasonsFa.push(input.gender === 'female' ? 'تطابق کامل ساختار زنانه' : 'تطابق کامل ساختار مردانه');
    }
    if (inBand || ageDelta <= 5) {
      matchReasonsFa.push(`تناسب سنی دقیق (${age} سال ↔ ${char.canonicalAge} سال)`);
    }
    if (gameIdx >= 0) {
      matchReasonsFa.push(`همخوانی سبک بازی و تاکتیک`);
    }
    if (telemetryScore >= 8) {
      matchReasonsFa.push(`نزدیکی وین‌ریت (${Math.round(winRate)}٪) و ثبات تاکتیکی`);
    }
    if (matchReasonsFa.length < 2) {
      matchReasonsFa.push(`آرکتایپ ${char.archetypeFa}`);
    }

    return {
      character: char,
      similarityPct,
      rawScore,
      ageDelta,
      matchReasonsFa: matchReasonsFa.slice(0, 3),
    };
  });

  scored.sort((a, b) => {
    if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
    if (a.ageDelta !== b.ageDelta) return a.ageDelta - b.ageDelta;
    return a.character.rank - b.character.rank;
  });

  return {
    topMatch: scored[0],
    runnerUps: scored.slice(1, 6),
    allRanked: scored,
    totalRosterCount: ICONIC_GAME_CHARACTERS.length,
  };
}
