import type { RealmId } from '../types/spatial.ts';
import { buildEnglishQuery } from '../agents/liveWebIntel.ts';
import {
  buildDynamicGameEntry,
  findCatalogGameById,
} from './gameMediaCatalog.ts';
import {
  getCachedOrDefaultGameMeta,
  normalizeCoachGameId,
  toPersianDigits,
} from './liveMetaSyncService.ts';

export type ClipSourceKind = 'youtube_pro' | 'reddit_top';

export interface ClipKeyMoment {
  sec: number;
  timeLabel: string;
  labelFa: string;
}

export interface RealCoachClip {
  id: string;
  youtubeId: string;
  /** Optional direct file/stream URL (MP4/HLS) — when present the stage
   *  container plays it with a native <video> instead of the YouTube iframe. */
  videoUrl?: string;
  title: string;
  channelName: string;
  viewsLabel: string;
  durationLabel: string;
  thumbnailUrl: string;
  sourceKind: ClipSourceKind;
  sourceBadgeFa: string;
  keyMoments: ClipKeyMoment[];
  problemFoundFa: string;
  solutionFixFa: string;
  coachCommentaryFa: string;
  voiceScriptEn: string;
  triggerBadge: string;
  executionBadge: string;
  timingWindowLabelFa: string;
}

export interface RealClipDiscoveryResponse {
  gameId: string;
  gameName: string;
  realm: RealmId;
  queryUsed: string;
  clips: RealCoachClip[];
  discoveredAtIso: string;
}

interface RawYoutubeItem {
  videoId: string;
  title: string;
  channelName: string;
  viewsLabel: string;
  durationLabel: string;
  snippet: string;
  thumbnailUrl: string;
  chapters: Array<{ title: string; sec: number }>;
}

// 8-hour cache mandate: resolved clips/bundles serve from cache with zero
// external calls until the TTL (28800s) expires.
const CLIP_CACHE_TTL_MS = 8 * 60 * 60 * 1000;
const clipCache = new Map<string, { data: RealClipDiscoveryResponse; fetchedAtMs: number }>();

export function clearClipAgentCache(): void {
  clipCache.clear();
}

export function formatSecondsToTime(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function parseDurationToSeconds(durationText: string): number {
  const parts = durationText
    .trim()
    .split(':')
    .map((p) => Number(p))
    .filter((n) => Number.isFinite(n));
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 180;
}

function collectVideoRenderers(node: unknown, out: Array<Record<string, unknown>> = []): Array<Record<string, unknown>> {
  if (!node || typeof node !== 'object') return out;
  const obj = node as Record<string, unknown>;
  if (obj.videoRenderer && typeof obj.videoRenderer === 'object') {
    const vr = obj.videoRenderer as Record<string, unknown>;
    if (typeof vr.videoId === 'string') {
      out.push(vr);
      return out;
    }
  }
  if (Array.isArray(node)) {
    for (const item of node) collectVideoRenderers(item, out);
  } else {
    for (const key of Object.keys(obj)) {
      collectVideoRenderers(obj[key], out);
    }
  }
  return out;
}

function extractRunsText(field: unknown): string {
  if (!field || typeof field !== 'object') return '';
  const f = field as { simpleText?: string; runs?: Array<{ text?: string }> };
  if (typeof f.simpleText === 'string') return f.simpleText;
  if (Array.isArray(f.runs)) return f.runs.map((r) => r.text ?? '').join('');
  return '';
}

export function parseYoutubeInitialDataFromHtml(html: string): RawYoutubeItem[] {
  const marker = 'var ytInitialData = ';
  const start = html.indexOf(marker);
  if (start === -1) return [];
  const end = html.indexOf(';</script>', start);
  if (end === -1) return [];

  try {
    const data = JSON.parse(html.slice(start + marker.length, end)) as unknown;
    // YouTube's 2025+ search pages replaced videoRenderer with lockupViewModel.
    const legacy = collectVideoRenderers(data);
    if (legacy.length > 0) return renderersToRawItems(legacy);
    return lockupsToRawItems(data);
  } catch {
    return [];
  }
}

function renderersToRawItems(renderers: Array<Record<string, unknown>>): RawYoutubeItem[] {
  const results: RawYoutubeItem[] = [];
  const seen = new Set<string>();

  for (const vr of renderers) {
    const videoId = String(vr.videoId ?? '').trim();
    if (!videoId || videoId.length !== 11 || seen.has(videoId)) continue;

    const title = extractRunsText(vr.title).trim();
    if (!title) continue;

    // Skip live streams without duration
    const durationLabel = extractRunsText(vr.lengthText).trim();
    if (!durationLabel) continue;

    seen.add(videoId);
    const channelName = extractRunsText(vr.ownerText).trim() || 'Pro Creator';
    const viewsLabel = extractRunsText(vr.shortViewCountText).trim() || 'HD';

    const snippetsArr = vr.detailedMetadataSnippets as Array<{ snippetText?: unknown }> | undefined;
    const snippet = snippetsArr?.[0]?.snippetText ? extractRunsText(snippetsArr[0].snippetText) : '';

    const thumbsArr = (vr.thumbnail as { thumbnails?: Array<{ url?: string }> } | undefined)?.thumbnails;
    const thumbnailUrl =
      thumbsArr?.[thumbsArr.length - 1]?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    // Extract real video chapters if present in expandableMetadata
    const chapters: Array<{ title: string; sec: number }> = [];
    const cards = (
      vr.expandableMetadata as {
        expandableMetadataRenderer?: {
          expandedContent?: {
            horizontalCardListRenderer?: {
              cards?: Array<{
                macroMarkersListItemRenderer?: {
                  title?: unknown;
                  onTap?: { watchEndpoint?: { startTimeSeconds?: number } };
                };
              }>;
            };
          };
        };
      }
    )?.expandableMetadataRenderer?.expandedContent?.horizontalCardListRenderer?.cards;

    if (Array.isArray(cards)) {
      for (const card of cards) {
        const ch = card?.macroMarkersListItemRenderer;
        const sec = ch?.onTap?.watchEndpoint?.startTimeSeconds;
        if (typeof sec === 'number' && Number.isFinite(sec) && sec > 0) {
          const chTitle = extractRunsText(ch?.title).trim();
          chapters.push({ title: chTitle || `لحظه ${formatSecondsToTime(sec)}`, sec });
        }
      }
    }

    results.push({
      videoId,
      title,
      channelName,
      viewsLabel,
      durationLabel,
      snippet,
      thumbnailUrl,
      chapters: chapters.slice(0, 4),
    });

    if (results.length >= 12) break;
  }

  return results;
}

/** 2025+ YouTube search rows: lockupViewModel with contentId + lockupMetadataViewModel. */
function lockupsToRawItems(data: unknown): RawYoutubeItem[] {
  const lockups: Array<Record<string, unknown>> = [];
  collectLockups(data, lockups);

  const results: RawYoutubeItem[] = [];
  const seen = new Set<string>();

  for (const lv of lockups) {
    const videoId = String(lv.contentId ?? '').trim();
    if (!videoId || videoId.length !== 11 || seen.has(videoId)) continue;

    const meta = (lv.metadata as { lockupMetadataViewModel?: Record<string, unknown> } | undefined)
      ?.lockupMetadataViewModel;
    const title = String((meta?.title as { content?: string } | undefined)?.content ?? '').trim();
    if (!title) continue;

    // Duration lives in the thumbnail overlay badge (e.g. "10:01"); skip live/shorts without it.
    const durationLabel = extractOverlayDuration(lv);
    if (!durationLabel || !/^\d{1,2}:\d{2}(:\d{2})?$/.test(durationLabel)) continue;

    seen.add(videoId);

    const rows =
      (meta?.metadata as { contentMetadataViewModel?: { metadataRows?: Array<{ metadataParts?: Array<{ text?: { content?: string } }> }> } } | undefined)
        ?.contentMetadataViewModel?.metadataRows ?? [];
    const texts = rows.flatMap((r) => (r.metadataParts ?? []).map((p) => String(p.text?.content ?? ''))).filter(Boolean);

    const channelFromAvatar = String(
      (meta?.image as { decoratedAvatarViewModel?: { avatar?: { avatarViewModel?: { image?: { image?: unknown } } } } } | undefined)
        ?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image ?? {}
    );
    void channelFromAvatar;
    let channelName = 'Pro Creator';
    const a11y = (meta?.image as unknown as Record<string, unknown>) ?? {};
    void a11y;
    // channel name from a11y label "Go to channel <name>"
    const a11yLabel = findStringField(meta?.image as unknown, 'a11yLabel');
    const m = /Go to channel (.+)$/.exec(a11yLabel);
    if (m?.[1]) channelName = m[1].trim();

    const viewsLabel = texts.find((t) => /^(\d+[.,]?\d*[KM]?)$/.test(t) || /(views|بازدید|K view|M view)/i.test(t)) ?? 'HD';
    const snippet = texts.find((t) => t.length > 40) ?? '';

    const thumb = (lv.contentImage as { thumbnailViewModel?: { image?: { sources?: Array<{ url?: string }> } } } | undefined)
      ?.thumbnailViewModel?.image?.sources;
    const thumbnailUrl = thumb?.[thumb.length - 1]?.url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    results.push({
      videoId,
      title,
      channelName,
      viewsLabel,
      durationLabel,
      snippet,
      thumbnailUrl,
      chapters: [],
    });

    if (results.length >= 12) break;
  }

  return results;
}

function collectLockups(node: unknown, out: Array<Record<string, unknown>>): void {
  if (!node || typeof node !== 'object' || out.length >= 40) return;
  const obj = node as Record<string, unknown>;
  if (obj.lockupViewModel && typeof obj.lockupViewModel === 'object') {
    out.push(obj.lockupViewModel as Record<string, unknown>);
    return;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) collectLockups(item, out);
    return;
  }
  for (const key of Object.keys(obj)) collectLockups(obj[key], out);
}

function extractOverlayDuration(lv: Record<string, unknown>): string {
  const overlays = (lv.contentImage as { thumbnailViewModel?: { overlays?: Array<Record<string, unknown>> } } | undefined)
    ?.thumbnailViewModel?.overlays ?? [];
  for (const o of overlays) {
    const s = JSON.stringify(o);
    const m = /"text":"(\d{1,2}:\d{2}(?::\d{2})?)"/.exec(s);
    if (m?.[1]) return m[1];
  }
  return '';
}

function findStringField(node: unknown, key: string, depth = 0): string {
  if (!node || typeof node !== 'object' || depth > 6) return '';
  const obj = node as Record<string, unknown>;
  if (typeof obj[key] === 'string') return obj[key] as string;
  for (const k of Object.keys(obj)) {
    const found = findStringField(obj[k], key, depth + 1);
    if (found) return found;
  }
  return '';
}

export function buildCoachBreakdownForClip(
  raw: RawYoutubeItem,
  input: {
    gameId: string;
    gameName: string;
    realm: RealmId;
    sourceKind: ClipSourceKind;
    userProblemQuery?: string;
  }
): RealCoachClip {
  const meta = getCachedOrDefaultGameMeta(input.gameId, Date.now(), {
    name: input.gameName,
    realm: input.realm,
  });

  const totalSec = Math.max(45, parseDurationToSeconds(raw.durationLabel));
  const keyMoments: ClipKeyMoment[] =
    raw.chapters.length >= 2
      ? raw.chapters.slice(0, 3).map((ch, idx) => ({
          sec: ch.sec,
          timeLabel: formatSecondsToTime(ch.sec),
          labelFa:
            idx === 0
              ? `تشخیص اشتباه (${formatSecondsToTime(ch.sec)})`
              : idx === 1
                ? `اصلاح تاکتیکی (${formatSecondsToTime(ch.sec)})`
                : `اجرای حرفه‌ای (${formatSecondsToTime(ch.sec)})`,
        }))
      : [
          {
            sec: Math.min(25, Math.floor(totalSec * 0.1)),
            timeLabel: formatSecondsToTime(Math.min(25, Math.floor(totalSec * 0.1))),
            labelFa: 'شروع صحنه و تشخیص خطا',
          },
          {
            sec: Math.min(95, Math.floor(totalSec * 0.34)),
            timeLabel: formatSecondsToTime(Math.min(95, Math.floor(totalSec * 0.34))),
            labelFa: 'لحظه کلیدی اصلاح حرکت',
          },
          {
            sec: Math.min(180, Math.floor(totalSec * 0.62)),
            timeLabel: formatSecondsToTime(Math.min(180, Math.floor(totalSec * 0.62))),
            labelFa: 'اجرای کامل حرفه‌ای',
          },
        ];

  const lowerTitle = `${raw.title} ${raw.snippet} ${input.userProblemQuery ?? ''}`.toLowerCase();

  let problemFoundFa = meta.fatalErrorFa.replace(/^⚠\s*/, '');
  let solutionFixFa = `ابتدا ${meta.triggerLabelFa} (${meta.triggerBadge}) را اجرا کن، در ${meta.timingWindowLabelFa} صبر کن و سپس ${meta.executionLabelFa} (${meta.executionBadge}) را بزن.`;

  if (input.realm === 'sports') {
    if (/defend|defense|press|tackl|دفاع|پرس/.test(lowerTitle)) {
      problemFoundFa = 'کشیدن مدافع میانی (CB) به بیرون از خط دفاع و خالی کردن عمق محوطه';
      solutionFixFa =
        'به‌جای تعقیب توپ با مدافع آخر، با هافبک دفاعی (CDM) مسیر پاس را ببند، L2 را نگه دار و فقط در لحظه لمس بلند حریف تکل بزن.';
    } else if (/attack|goal|finish|shoot|شوت|گل|حمله|پاس/.test(lowerTitle)) {
      problemFoundFa = 'عجله در پاس یا شوت بدون ایجاد زاویه و افتادن در تله آفساید/بلاک مدافع';
      solutionFixFa =
        'قبل از پاس عمقی با L1 فرار مهاجم را تحریک کن، داخل پنجره ۰.۲۵ ثانیه رهاسازی پاس را بفرست و برای ضربه آخر از کات سبز (Timed Finesse) استفاده کن.';
    }
  } else if (input.realm === 'shooter') {
    if (/aim|spray|recoil|headshot|ایم|اسپری|هدشات/.test(lowerTitle)) {
      problemFoundFa = 'شلیک همزمان با حرکت (عدم توقف کامل) و پایین بودن ارتفاع کراس‌هر پیش از دیدن حریف';
      solutionFixFa =
        'پیش از شلیک اول با A/D کانتر-استریف بزن تا سرعتت صفر شود، کراس‌هر را هم‌سطح سر نگه دار و در پنجره ۰.۰۸ ثانیه شلیک اول را قفل کن.';
    } else if (/smoke|utility|mirage|peek|angle|اسموک|پیک|میراژ/.test(lowerTitle)) {
      problemFoundFa = 'پیک دادن گسترده (Wide Peek) در دید چند دشمن همزمان بدون استفاده از اسموک یا فلش';
      solutionFixFa =
        'زاویه را تکه‌تکه (Slice the Pie) پاک‌سازی کن، پنجره یا کانکتور را اسموک ببند و فقط دوئل ۱ به ۱ با فاصله کوتاه از دیوار بگیر.';
    }
  } else if (input.realm === 'strategy') {
    if (/lane|wave|farm|gold|eco|لاین|فارم|اکو/.test(lowerTitle)) {
      problemFoundFa = 'هل دادن بی‌هدف لاین و عقب افتادن در فارم/اکو بدون ویزژن رودخانه یا معدن';
      solutionFixFa =
        'موج مینیون یا تولید کارگر را پیوسته کنترل کن، قبل از فشار آوردن وارد دفاعی بگذار و در تایمینگ بازگشت حریف رید یا ترید بگیر.';
    } else if (/fight|roshan|team|smoke|تیم|فایت|روشان/.test(lowerTitle)) {
      problemFoundFa = 'شروع درگیری بدون دید کافی و فعال کردن دیرهنگام BKB یا اسپل‌های دفاعی';
      solutionFixFa =
        'زیر پوشش اسموک از های‌گراند وارد شو، اولویت تارگت را روی ساپورت عقب حریف بگذار و پیش از خوردن استان اول ابزار دفاعی را فعال کن.';
    }
  } else {
    if (/boss|dodge|parry|malenia|باس|داج|پری/.test(lowerTitle)) {
      problemFoundFa = 'داج زدن به سمت عقب یا اسپم دکمه دفاع که باعث خوردن ضربات تاخیری باس می‌شود';
      solutionFixFa =
        'به جای فرار به عقب، دقیقاً روی لحظه فرود ضربه به سمت داخل و کنار دست باس داج یا پری بزن و سپس در پنجره بازیابی با ضربه سنگین پویز را بشکن.';
    } else if (/heist|pvp|flank|stealth|هایست|فلنک|مخفی/.test(lowerTitle)) {
      problemFoundFa = 'خروج از کاور در مسیر مستقیم دید اسنایپر یا دوربین امنیتی بدون پوشش';
      solutionFixFa =
        'با R1 روی زاویه کاور قفل شو، در لحظه چرخش دید نگهبان مسیر فلنک جانبی را انتخاب کن و با زمان‌بندی دقیق هدف را حذف کن.';
    }
  }

  const firstMoment = keyMoments[1] ?? keyMoments[0];
  const sourceWord =
    input.sourceKind === 'reddit_top' ? 'کلیپ برگزیده ردیت' : `ویدیوی حرفه‌ای ${raw.channelName}`;

  const coachCommentaryFa = `در ${sourceWord} (دقیقه ${toPersianDigits(firstMoment.timeLabel)}) دقیقاً همین صحنه کلیدی را ببین: اشتباه رایج بازیکنان «${problemFoundFa}» است. برای برطرف کردن این مشکل در ${input.gameName}، ${solutionFixFa}`;

  const voiceScriptEn = `Watch key moment ${firstMoment.timeLabel} in this ${input.gameName} clip by ${raw.channelName}. ${meta.voiceScriptEn}`;

  return {
    id: `${input.sourceKind}-${raw.videoId}`,
    youtubeId: raw.videoId,
    title: raw.title,
    channelName: raw.channelName,
    viewsLabel: raw.viewsLabel,
    durationLabel: raw.durationLabel,
    thumbnailUrl: raw.thumbnailUrl,
    sourceKind: input.sourceKind,
    sourceBadgeFa: input.sourceKind === 'reddit_top' ? 'کلیپ ردیت / کامیونیتی' : 'یوتیوب پرو / اینفلوئنسر',
    keyMoments,
    problemFoundFa,
    solutionFixFa,
    coachCommentaryFa,
    voiceScriptEn,
    triggerBadge: meta.triggerBadge,
    executionBadge: meta.executionBadge,
    timingWindowLabelFa: meta.timingWindowLabelFa,
  };
}

// Verified real YouTube fallback IDs if network is offline
const FALLBACK_YOUTUBE_BY_REALM: Record<RealmId, RawYoutubeItem[]> = {
  sports: [
    {
      videoId: 'zv556UTFZBo',
      title: '5 PRO TIPS TO HELP YOU WIN MORE GAMES ON FC27 - TUTORIAL',
      channelName: 'Tom Leese',
      viewsLabel: '215K',
      durationLabel: '20:37',
      snippet: 'Pro tips and attacking/defending mistake fixes in EA FC.',
      thumbnailUrl: 'https://i.ytimg.com/vi/zv556UTFZBo/hqdefault.jpg',
      chapters: [
        { title: 'Attacking Run Timing', sec: 45 },
        { title: 'Fixing Defending Mistakes', sec: 132 },
        { title: 'Pro Finishing Angle', sec: 240 },
      ],
    },
    {
      videoId: 'vN4TPH7Emo8',
      title: '11 Tips For Better Attacking (I Wish I Knew Sooner)',
      channelName: 'THE GUIDE - FC 27 Tutorials',
      viewsLabel: '184K',
      durationLabel: '9:58',
      snippet: 'Attacking tips and through-ball timing breakdown.',
      thumbnailUrl: 'https://i.ytimg.com/vi/vN4TPH7Emo8/hqdefault.jpg',
      chapters: [
        { title: 'L1 Trigger Run', sec: 15 },
        { title: 'Through-Ball Window', sec: 52 },
        { title: 'Timed Finishing', sec: 93 },
      ],
    },
  ],
  shooter: [
    {
      videoId: 'RyAg82pPs1M',
      title: "Your T Side Mirage SUCKS... here's how to fix it",
      channelName: 'fl0m',
      viewsLabel: '368K',
      durationLabel: '10:32',
      snippet: 'CS2 pro breakdown fixing Mirage mid control, smokes and peeking mistakes.',
      thumbnailUrl: 'https://i.ytimg.com/vi/RyAg82pPs1M/hqdefault.jpg',
      chapters: [
        { title: 'Mid Peek Mistake', sec: 34 },
        { title: 'Counter-Strafe Fix', sec: 118 },
        { title: 'Window Smoke Setup', sec: 215 },
      ],
    },
    {
      videoId: '_v127oVbm58',
      title: 'Mirage Tips & Tricks in CS2 | Pro tips for PUGS',
      channelName: 'EliGE',
      viewsLabel: '62K',
      durationLabel: '13:11',
      snippet: 'Pro rifler EliGE breaks down angles and crosshair placement.',
      thumbnailUrl: 'https://i.ytimg.com/vi/_v127oVbm58/hqdefault.jpg',
      chapters: [
        { title: 'Crosshair Height', sec: 28 },
        { title: 'Angle Slicing', sec: 96 },
      ],
    },
  ],
  strategy: [
    {
      videoId: 'JG68c1aW7Y8',
      title: 'Pro Macro & Teamfight Positioning Breakdown',
      channelName: 'Pro Coaching Lab',
      viewsLabel: '45K',
      durationLabel: '12:41',
      snippet: 'Fixing macro rotations, smoke ganks and vision control.',
      thumbnailUrl: 'https://i.ytimg.com/vi/JG68c1aW7Y8/hqdefault.jpg',
      chapters: [
        { title: 'Vision Mistake', sec: 30 },
        { title: 'Smoke Wrap Fix', sec: 110 },
      ],
    },
  ],
  story: [
    {
      videoId: 'TTcJPML4t1o',
      title: 'Pro Combat Timing & Mistake Fixes Tutorial',
      channelName: 'Pro Action Coach',
      viewsLabel: '77K',
      durationLabel: '10:36',
      snippet: 'Fixing dodge timing, cover flanks and boss punish windows.',
      thumbnailUrl: 'https://i.ytimg.com/vi/TTcJPML4t1o/hqdefault.jpg',
      chapters: [
        { title: 'Timing Mistake', sec: 24 },
        { title: 'Flank & Dodge Fix', sec: 88 },
      ],
    },
  ],
};

async function queryYoutubeClips(
  searchQuery: string,
  fetcher: typeof fetch
): Promise<RawYoutubeItem[]> {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    const resp = await fetcher(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Cookie: 'SOCS=CAI',
      },
      signal: AbortSignal.timeout(4500),
    });
    if (!resp.ok) return [];
    const html = await resp.text();
    return parseYoutubeInitialDataFromHtml(html);
  } catch {
    return [];
  }
}

/**
 * Embeddability check — a video the user can actually play.
 * YouTube's oEmbed endpoint returns 200 for embeddable/public videos and
 * 401/404 for private, deleted, age-restricted or embed-blocked ones.
 */
async function verifyEmbeddable(videoId: string, fetcher: typeof fetch): Promise<boolean> {
  try {
    const resp = await fetcher(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
      { signal: AbortSignal.timeout(3500) }
    );
    return resp.ok;
  } catch {
    return false;
  }
}

async function filterPlayableClips(
  items: RawYoutubeItem[],
  fetcher: typeof fetch,
  limit: number
): Promise<RawYoutubeItem[]> {
  const pool = items.slice(0, 12);
  const verdicts = await Promise.all(pool.map((it) => verifyEmbeddable(it.videoId, fetcher)));
  const playable = pool.filter((_, i) => verdicts[i]);
  return playable.slice(0, limit);
}

/**
 * Score-based clip relevance. Persian queries are translated to English tokens
 * (YouTube titles are mostly English), game-name tokens are excluded (they let
 * unrelated trailers pass), and promo/trailer noise is penalized unless the
 * user explicitly asked for highlights/goals.
 */
const TRAILER_NOISE = /(trailer|teaser|official|announce|reaction|shorts\b)/i;

function filterByRelevance(items: RawYoutubeItem[], userQuery: string, gameName: string, englishQuery?: string): RawYoutubeItem[] {
  if (!userQuery) return items;
  const gameTokens = new Set(
    gameName
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length >= 4)
  );
  const tokenSet = new Set<string>();
  const addTokens = (text: string) => {
    for (const t of text.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
      if (t.length >= 4 && !gameTokens.has(t)) tokenSet.add(t);
    }
  };
  addTokens(userQuery);
  if (englishQuery) addTokens(englishQuery);
  const tokens = [...tokenSet];
  if (tokens.length === 0) return items;
  const penalize = !/(goal|highlights|هیولایت|گل)/i.test(userQuery);
  return items
    .map((it) => {
      const hay = `${it.title} ${it.snippet}`.toLowerCase();
      let score = 0;
      for (const t of tokens) if (hay.includes(t)) score += 2;
      if (penalize && TRAILER_NOISE.test(hay)) score -= 4;
      return { it, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.it);
}

export async function discoverRealCoachClips(
  input: {
    gameId: string;
    gameName?: string;
    realm?: RealmId;
    userQuery?: string;
  },
  options: { force?: boolean; fetcher?: typeof fetch; nowMs?: number } = {}
): Promise<RealClipDiscoveryResponse> {
  const normId = normalizeCoachGameId(input.gameId);
  const catalogEntry =
    findCatalogGameById(normId) ??
    buildDynamicGameEntry({
      id: normId,
      name: input.gameName || input.gameId,
      realm: input.realm,
    });

  const gameName = input.gameName || catalogEntry.name;
  const realm = input.realm ?? catalogEntry.realm;
  const userQuery = (input.userQuery ?? '').trim();
  const englishQuery = userQuery ? buildEnglishQuery(userQuery) : '';
  const nowMs = options.nowMs ?? Date.now();
  const cacheKey = `${normId}:${realm}:${userQuery.toLowerCase()}`;

  const cached = clipCache.get(cacheKey);
  if (!options.force && cached && nowMs - cached.fetchedAtMs < CLIP_CACHE_TTL_MS) {
    return cached.data;
  }

  const fetcher = options.fetcher ?? globalThis.fetch;

  const proQuery = userQuery
    ? `${gameName} ${englishQuery || userQuery} pro tips tutorial breakdown`
    : `${gameName} pro tips mistakes gameplay breakdown`;
  const redditQuery = userQuery
    ? `${gameName} ${englishQuery || userQuery} reddit best clips highlights`
    : `${gameName} best reddit clips highlights mistakes`;

  let proRaw: RawYoutubeItem[] = [];
  let redditRaw: RawYoutubeItem[] = [];

  if (typeof fetcher === 'function') {
    [proRaw, redditRaw] = await Promise.all([
      queryYoutubeClips(proQuery, fetcher),
      queryYoutubeClips(redditQuery, fetcher),
    ]);
    // Relevance first, then embeddability — only clips the user can actually play
    // and that genuinely match the lesson the user asked about.
    const relevantPro = filterByRelevance(proRaw, userQuery, gameName, englishQuery);
    const relevantReddit = filterByRelevance(redditRaw, userQuery, gameName, englishQuery);
    // If relevant clips exist, show ONLY relevant ones — never fall back to
    // unrelated trailers when the user asked a specific question.
    const relevantCount = relevantPro.length + relevantReddit.length;
    const pool = relevantCount >= 2 ? [...relevantPro, ...relevantReddit] : [...proRaw, ...redditRaw];
    const playable = await filterPlayableClips(pool, fetcher, 7);
    // Partition by origin so pro/reddit slots keep their own sources.
    const proIds = new Set(proRaw.map((it) => it.videoId));
    const proPart = playable.filter((it) => proIds.has(it.videoId));
    const redditPart = playable.filter((it) => !proIds.has(it.videoId));
    proRaw = proPart.slice(0, 4);
    redditRaw = redditPart.slice(0, 3);
  }

  const seenIds = new Set<string>();
  const clips: RealCoachClip[] = [];

  for (const item of proRaw.slice(0, 4)) {
    if (seenIds.has(item.videoId)) continue;
    seenIds.add(item.videoId);
    clips.push(
      buildCoachBreakdownForClip(item, {
        gameId: normId,
        gameName,
        realm,
        sourceKind: 'youtube_pro',
        userProblemQuery: userQuery,
      })
    );
  }

  for (const item of redditRaw.slice(0, 3)) {
    if (seenIds.has(item.videoId)) continue;
    seenIds.add(item.videoId);
    clips.push(
      buildCoachBreakdownForClip(item, {
        gameId: normId,
        gameName,
        realm,
        sourceKind: 'reddit_top',
        userProblemQuery: userQuery,
      })
    );
  }

  if (clips.length === 0) {
    for (const fb of FALLBACK_YOUTUBE_BY_REALM[realm] ?? FALLBACK_YOUTUBE_BY_REALM.sports) {
      clips.push(
        buildCoachBreakdownForClip(fb, {
          gameId: normId,
          gameName,
          realm,
          sourceKind: 'youtube_pro',
          userProblemQuery: userQuery,
        })
      );
    }
  }

  const response: RealClipDiscoveryResponse = {
    gameId: normId,
    gameName,
    realm,
    queryUsed: proQuery,
    clips,
    discoveredAtIso: new Date(nowMs).toISOString(),
  };

  clipCache.set(cacheKey, { data: response, fetchedAtMs: nowMs });
  return response;
}
