import type { CoachAnswerBlock } from './coachSearchRules';

/**
 * Bridges the coach-session JSON (answerBlock) to the vendored
 * Ai-petros-game-analyz tactical stage (public/analyz — pedrammokarrami/
 * Ai-petros-game-analyz, verbatim engine). The stage is written to take a
 * flat JSON command, so we map our API payload into its schema and hand it
 * over via postMessage once it signals TACTICAL_STAGE_READY.
 */

export interface AnalyzFootballPlayer {
  id: string;
  number: number;
  role: string;
  name?: string;
  displayName?: string;
  team: 'home' | 'away';
  x: number;
  y: number;
  hasBall?: boolean;
}

export interface AnalyzVector {
  id: string;
  type: 'pass' | 'run' | 'press';
  from: [number, number];
  to: [number, number];
  curve?: number;
  label?: string;
}

/** Formation slot layouts (normalized x/y on the analyz pitch). */
const SLOT_LAYOUT: Record<string, [number, number]> = {
  GK: [8, 50],
  LB: [34, 15], CB: [25, 37], RB: [36, 85],
  LCB: [25, 37], RCB: [25, 63],
  CDM: [45, 50], LCM: [58, 31], RCM: [62, 68], CM: [55, 50], CAM: [62, 68],
  LM: [40, 25], RM: [40, 75],
  LW: [75, 17], RW: [76, 82], ST: [80, 49], CF: [80, 50],
  LWB: [36, 12], RWB: [36, 88],
};

const OPPOSITION_BLOCK: AnalyzFootballPlayer[] = [
  { id: 'a-gk', number: 1, role: 'GK', team: 'away', x: 93, y: 50 },
  { id: 'a-rb', number: 2, role: 'RB', team: 'away', x: 84, y: 24 },
  { id: 'a-cb1', number: 4, role: 'CB', team: 'away', x: 85, y: 42 },
  { id: 'a-cb2', number: 5, role: 'CB', team: 'away', x: 85, y: 58 },
  { id: 'a-lb', number: 3, role: 'LB', team: 'away', x: 84, y: 76 },
  { id: 'a-m1', number: 6, role: 'CM', team: 'away', x: 69, y: 38 },
  { id: 'a-m2', number: 8, role: 'CM', team: 'away', x: 69, y: 62 },
  { id: 'a-f1', number: 9, role: 'ST', team: 'away', x: 52, y: 48 },
];

/** Map the coach answerBlock into an analyz football StageCommand (flat schema). */
export function buildAnalyzFootballCommand(
  answerBlock: CoachAnswerBlock | null | undefined,
  accentHex: string,
): Record<string, unknown> | null {
  const assignments = answerBlock?.playerAssignments;
  const slots = assignments
    ? Object.keys(assignments).flatMap((k) => assignments[k] ?? [])
    : [];
  if (slots.length === 0) return null;

  const formation =
    answerBlock?.options?.find((o) => /^\d(-\d)+(-\d)?$/.test(o.trim())) ??
    (answerBlock?.options?.[0] ?? '4-3-3').trim();

  const players: AnalyzFootballPlayer[] = slots.map((a, i) => {
    const [x, y] = SLOT_LAYOUT[a.slot.toUpperCase()] ?? [40 + (i % 3) * 12, 30 + Math.floor(i / 3) * 18];
    return {
      id: `h-${i}`,
      number: i + 1,
      role: a.slot.toUpperCase(),
      name: a.playerName || undefined,
      displayName: a.playerName || a.slot,
      team: 'home' as const,
      x,
      y,
      hasBall: i === 0,
    };
  });

  const vectors: AnalyzVector[] = [];
  const withBall = players.find((p) => p.hasBall) ?? players[0];
  const forward = players
    .filter((p) => p !== withBall && p.x > withBall.x)
    .sort((a, b) => b.x - a.x)
    .slice(0, 3);
  forward.forEach((p, i) => {
    vectors.push({
      id: `v${i + 1}`,
      type: i === 0 ? 'pass' : 'run',
      from: [withBall.x, withBall.y],
      to: [p.x, p.y],
      curve: i % 2 === 0 ? 8 : -6,
      label: i === 0 ? 'Line Break' : undefined,
    });
  });

  return {
    mode: 'football',
    title: `AIGAMERIA ${formation}`,
    subtitle: answerBlock?.titleEn ?? answerBlock?.titleFa ?? '',
    payload: {
      formation,
      tacticalStyle: answerBlock?.titleEn ?? 'Coach tactic',
      teamColor: accentHex,
      awayColor: '#F43F5E',
      players: [...players, ...OPPOSITION_BLOCK],
      vectors,
      zones: [
        { id: 'z-att', x: 64, y: 30, w: 22, h: 40, tone: 'attack', label: 'Attack Zone' },
        { id: 'z-press', x: 40, y: 30, w: 20, h: 40, tone: 'press', label: 'Press Zone' },
      ],
    },
  };
}

/**
 * Build the analyz stage command for any game: sports realms map to the
 * football schema; everything else falls back to a natural-language prompt
 * object ({ prompt }) — the vendored engine auto-detects the game/mode and
 * renders the matching section (weapon / map / strategy / basketball).
 */
export function buildAnalyzCommand(
  args: {
    gameId: string;
    gameName: string;
    realm: string;
    query: string;
    answerBlock?: CoachAnswerBlock | null;
    accentHex: string;
  },
): Record<string, unknown> | null {
  // Game-strict source gate: the football schema is built ONLY for sports
  // realms. A stale/foreign answerBlock can never leak a football pitch into
  // CS2/other games (user mandate).
  const football = args.realm === 'sports' ? buildAnalyzFootballCommand(args.answerBlock, args.accentHex) : null;
  if (football) return football;
  const lines = [
    args.answerBlock?.titleEn,
    ...(args.answerBlock?.linesEn ?? []).slice(0, 4),
  ].filter(Boolean);
  const prompt = [args.gameName, args.query, ...lines].filter(Boolean).join('. ').slice(0, 800);
  if (!prompt.trim()) return null;
  return { prompt };
}
/** postMessage the command to an embedded analyz stage once it's ready. */
export function sendAnalyzCommand(
  frame: HTMLIFrameElement | null,
  command: Record<string, unknown> | null,
): void {
  if (!frame?.contentWindow || !command) return;
  try {
    frame.contentWindow.postMessage(
      { type: 'RENDER_STAGE', payload: command },
      '*',
    );
  } catch {
    // cross-origin or not mounted yet — ignore
  }
}
