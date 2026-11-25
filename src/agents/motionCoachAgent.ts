import type { RealmId } from '../types/spatial.ts';
import {
  type LiveGameMetaSnapshot,
  getCachedOrDefaultGameMeta,
  normalizeCoachGameId,
  syncLatestGameMeta,
  toPersianDigits,
} from '../services/liveMetaSyncService.ts';
import type { ChapterPhaseId } from './proClipAnalyzerAgent.ts';

export type MotionGraphicArchetype =
  | 'sports_pitch_arc'
  | 'shooter_crosshair_peek'
  | 'strategy_flank_vector'
  | 'racing_apex_line';

export type CoachWorldTheme = 'sports' | 'shooter' | 'strategy' | 'action';

export interface MotionTelemetryChip {
  labelFa: string;
  valueFa: string;
  tone: 'emerald' | 'cyan' | 'amber' | 'rose';
}

export interface MotionCoachPayload {
  agentName: 'MotionCoachAgent';
  gameId: string;
  gameName: string;
  gameShortLabel: string;
  realm: RealmId;
  worldTheme: CoachWorldTheme;
  archetype: MotionGraphicArchetype;
  accentHex: string;
  secondaryHex: string;
  patchVersion: string;
  patchSummaryFa: string;
  isFreshMeta: boolean;
  cardTitleFa: string;
  cardSubtitleFa: string;
  triggerBadge: string;
  triggerLabelFa: string;
  timingWindowMs: number;
  timingWindowLabelFa: string;
  sweetSpotStartPct: number;
  sweetSpotEndPct: number;
  executionBadge: string;
  executionLabelFa: string;
  fatalWarningFa: string;
  cycleDurationMs: number;
  telemetryChips: MotionTelemetryChip[];
  phaseCuesFa: Record<ChapterPhaseId, string>;
  voiceExplanationFa: string;
  voiceExplanationEn: string;
  syncedAtIso: string;
}

export function resolveMotionArchetype(
  gameId: string,
  realm: RealmId
): { archetype: MotionGraphicArchetype; worldTheme: CoachWorldTheme } {
  const lower = gameId.toLowerCase();
  if (/f1|forza|gran-turismo|racing|dirt|assetto/.test(lower)) {
    return { archetype: 'racing_apex_line', worldTheme: 'action' };
  }
  if (realm === 'sports') {
    return { archetype: 'sports_pitch_arc', worldTheme: 'sports' };
  }
  if (realm === 'shooter') {
    return { archetype: 'shooter_crosshair_peek', worldTheme: 'shooter' };
  }
  if (realm === 'strategy') {
    return { archetype: 'strategy_flank_vector', worldTheme: 'strategy' };
  }
  return { archetype: 'strategy_flank_vector', worldTheme: 'action' };
}

export function buildMotionPayloadFromMeta(meta: LiveGameMetaSnapshot): MotionCoachPayload {
  const { archetype, worldTheme } = resolveMotionArchetype(meta.gameId, meta.realm);

  if (archetype === 'sports_pitch_arc') {
    const secStr = toPersianDigits((meta.timingMs / 1000).toFixed(2));
    return {
      agentName: 'MotionCoachAgent',
      gameId: meta.gameId,
      gameName: meta.gameName,
      gameShortLabel: meta.gameShortLabel,
      realm: meta.realm,
      worldTheme,
      archetype,
      accentHex: meta.accentHex,
      secondaryHex: meta.secondaryHex,
      patchVersion: meta.patchVersion,
      patchSummaryFa: meta.patchSummaryFa,
      isFreshMeta: meta.isFresh,
      cardTitleFa: `الگوی حرکتی ${meta.gameShortLabel}`,
      cardSubtitleFa: 'قوس پاس عمقی + خط تله آفساید',
      triggerBadge: meta.triggerBadge,
      triggerLabelFa: meta.triggerLabelFa,
      timingWindowMs: meta.timingMs,
      timingWindowLabelFa: `${secStr}s`,
      sweetSpotStartPct: 44,
      sweetSpotEndPct: 68,
      executionBadge: meta.executionBadge,
      executionLabelFa: meta.executionLabelFa,
      fatalWarningFa: meta.fatalErrorFa,
      cycleDurationMs: 3200,
      telemetryChips: [
        { labelFa: 'پنجره رهاسازی', valueFa: `${secStr}s`, tone: 'emerald' },
        { labelFa: 'فضای عمق', valueFa: '۱۴ متر', tone: 'cyan' },
        { labelFa: 'شانس گل', valueFa: '۷۸٪', tone: 'amber' },
      ],
      phaseCuesFa: {
        error: 'تاخیر در ارسال پاس باعث ورود مهاجم به خط قرمز آفساید می‌شود.',
        fix: `قبل از رسیدن مدافع، ${meta.triggerBadge} را بزن و در پنجره سبز ${secStr}s رها کن.`,
        execute: `با ${meta.executionBadge} توپ را به کانال خالی پشت مدافع بفرست.`,
      },
      voiceExplanationFa: meta.voiceScriptFa,
      voiceExplanationEn: meta.voiceScriptEn,
      syncedAtIso: meta.syncedAtIso,
    };
  }

  if (archetype === 'shooter_crosshair_peek') {
    const windowMs = Math.max(80, Math.min(220, meta.timingMs === 80 ? 180 : meta.timingMs));
    const msFa = toPersianDigits(String(windowMs));
    return {
      agentName: 'MotionCoachAgent',
      gameId: meta.gameId,
      gameName: meta.gameName,
      gameShortLabel: meta.gameShortLabel,
      realm: meta.realm,
      worldTheme,
      archetype,
      accentHex: meta.accentHex,
      secondaryHex: meta.secondaryHex,
      patchVersion: meta.patchVersion,
      patchSummaryFa: meta.patchSummaryFa,
      isFreshMeta: meta.isFresh,
      cardTitleFa: `تاکتیک پیک و ایم ${meta.gameShortLabel}`,
      cardSubtitleFa: 'کانتر-استریف + کنترل ریکویل سر',
      triggerBadge: meta.triggerBadge,
      triggerLabelFa: meta.triggerLabelFa,
      timingWindowMs: windowMs,
      timingWindowLabelFa: `${msFa}ms`,
      sweetSpotStartPct: 48,
      sweetSpotEndPct: 66,
      executionBadge: 'Counter-Strafe + Burst',
      executionLabelFa: meta.executionLabelFa,
      fatalWarningFa: meta.fatalErrorFa,
      cycleDurationMs: 2600,
      telemetryChips: [
        { labelFa: 'پنجره پیک', valueFa: `${msFa}ms`, tone: 'cyan' },
        { labelFa: 'دقت هدشات', valueFa: '۸۴٪', tone: 'emerald' },
        { labelFa: 'توقف سرعت', valueFa: '۰ m/s', tone: 'amber' },
      ],
      phaseCuesFa: {
        error: 'شلیک حین حرکت یا پیک باز بدون توقف باعث پخش شدن اسپری و باخت دوئل می‌شود.',
        fix: `با ${meta.triggerBadge} سرعت را صفر کن تا کراس‌هر در پنجره ${msFa}ms قفل شود.`,
        execute: 'بلافاصله شلیک ۲ تیره به ارتفاع سر بزن و به پشت کاور برگرد.',
      },
      voiceExplanationFa: meta.voiceScriptFa,
      voiceExplanationEn: meta.voiceScriptEn,
      syncedAtIso: meta.syncedAtIso,
    };
  }

  if (archetype === 'racing_apex_line') {
    const secStr = toPersianDigits((meta.timingMs / 1000).toFixed(2));
    return {
      agentName: 'MotionCoachAgent',
      gameId: meta.gameId,
      gameName: meta.gameName,
      gameShortLabel: meta.gameShortLabel,
      realm: meta.realm,
      worldTheme,
      archetype,
      accentHex: meta.accentHex,
      secondaryHex: meta.secondaryHex,
      patchVersion: meta.patchVersion,
      patchSummaryFa: meta.patchSummaryFa,
      isFreshMeta: meta.isFresh,
      cardTitleFa: `خط ریسینگ و اپکس ${meta.gameShortLabel}`,
      cardSubtitleFa: 'تریل‌بریکینگ + خروج ERS',
      triggerBadge: meta.triggerBadge,
      triggerLabelFa: meta.triggerLabelFa,
      timingWindowMs: meta.timingMs,
      timingWindowLabelFa: `${secStr}s`,
      sweetSpotStartPct: 42,
      sweetSpotEndPct: 67,
      executionBadge: meta.executionBadge,
      executionLabelFa: meta.executionLabelFa,
      fatalWarningFa: meta.fatalErrorFa,
      cycleDurationMs: 3000,
      telemetryChips: [
        { labelFa: 'رهاسازی ترمز', valueFa: `${secStr}s`, tone: 'emerald' },
        { labelFa: 'سرعت خروج', valueFa: '۳۱۸ km/h', tone: 'cyan' },
        { labelFa: 'بهبود لپ', valueFa: '-۰.۳۴s', tone: 'amber' },
      ],
      phaseCuesFa: {
        error: 'گاز دادن پیش از صاف شدن فرمان باعث از دست رفتن چسبندگی عقب ماشین می‌شود.',
        fix: `در نقطه ${meta.triggerBadge} ترمز را نرم رها کن تا ماشین روی اپکس بنشیند.`,
        execute: `بلافاصله در خروج پیچ ${meta.executionBadge} را فعال کن.`,
      },
      voiceExplanationFa: meta.voiceScriptFa,
      voiceExplanationEn: meta.voiceScriptEn,
      syncedAtIso: meta.syncedAtIso,
    };
  }

  // Strategy / GTA / Action flank-vector + cooldown archetype
  const secStr = toPersianDigits((meta.timingMs / 1000).toFixed(2));
  return {
    agentName: 'MotionCoachAgent',
    gameId: meta.gameId,
    gameName: meta.gameName,
    gameShortLabel: meta.gameShortLabel,
    realm: meta.realm,
    worldTheme,
    archetype,
    accentHex: meta.accentHex,
    secondaryHex: meta.secondaryHex,
    patchVersion: meta.patchVersion,
    patchSummaryFa: meta.patchSummaryFa,
    isFreshMeta: meta.isFresh,
    cardTitleFa: `بردار فلنک و کول‌داون ${meta.gameShortLabel}`,
    cardSubtitleFa: 'زاویه نفوذ + پنجره اجرای مهارت',
    triggerBadge: meta.triggerBadge,
    triggerLabelFa: meta.triggerLabelFa,
    timingWindowMs: meta.timingMs,
    timingWindowLabelFa: `${secStr}s`,
    sweetSpotStartPct: 45,
    sweetSpotEndPct: 70,
    executionBadge: meta.executionBadge,
    executionLabelFa: meta.executionLabelFa,
    fatalWarningFa: meta.fatalErrorFa,
    cycleDurationMs: 3200,
    telemetryChips: [
      { labelFa: 'پنجره اجرا', valueFa: `${secStr}s`, tone: 'cyan' },
      { labelFa: 'پوشش مسیر', valueFa: '۸۶٪', tone: 'emerald' },
      { labelFa: 'کول‌داون', valueFa: '۵.۲s', tone: 'amber' },
    ],
    phaseCuesFa: {
      error: meta.fatalErrorFa.replace(/^⚠\s*/, ''),
      fix: `با ${meta.triggerBadge} در کاور/زاویه امن بمان و روی پنجره ${secStr}s وارد شو.`,
      execute: `کمبوی ${meta.executionBadge} را پشت خط دید حریف کامل کن.`,
    },
    voiceExplanationFa: meta.voiceScriptFa,
    voiceExplanationEn: meta.voiceScriptEn,
    syncedAtIso: meta.syncedAtIso,
  };
}

export function getInstantMotionCoachPayload(input: {
  gameId: string;
  gameName?: string;
  realm?: RealmId;
  steamAppId?: number;
}): MotionCoachPayload {
  const normId = normalizeCoachGameId(input.gameId);
  const meta = getCachedOrDefaultGameMeta(normId, Date.now(), {
    name: input.gameName,
    realm: input.realm,
    steamAppId: input.steamAppId,
  });
  return buildMotionPayloadFromMeta(meta);
}

/**
 * Agent 2: MotionCoachAgent
 * Self-updating specialized agent that syncs the latest patch/meta for any PC game
 * and emits structured animated Motion-Graphic & synchronized voice coaching payloads.
 */
export async function runMotionCoachAgent(
  input: {
    gameId: string;
    gameName?: string;
    realm?: RealmId;
    steamAppId?: number;
  },
  options: { force?: boolean; fetcher?: typeof fetch; nowMs?: number } = {}
): Promise<MotionCoachPayload> {
  const normId = normalizeCoachGameId(input.gameId);
  const meta = await syncLatestGameMeta(normId, {
    force: options.force,
    gameName: input.gameName,
    realm: input.realm,
    steamAppId: input.steamAppId,
    fetcher: options.fetcher,
    nowMs: options.nowMs,
  });
  return buildMotionPayloadFromMeta(meta);
}
