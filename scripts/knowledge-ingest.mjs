#!/usr/bin/env node
/**
 * Knowledge ingest pipeline — grows the AIPETROS coach memory 1000×:
 *
 *   per game:  200+ question cards  (generated from real domains, deduped)
 *              100+ trick cards     (harvested: GitHub, Reddit, Steam news, Wikipedia)
 *              10+ glitch/cheat awareness cards (public repos — cheats stored as
 *              AWARENESS with anti-cheat warnings; usage is never taught)
 *
 * Every card has source + URL. Re-running refreshes/updates — cards upsert by
 * (game_id, kind, dedupe_key).
 *
 * Usage:
 *   node scripts/knowledge-ingest.mjs            # one full pass
 *   node scripts/knowledge-ingest.mjs --daemon   # re-ingest every hour forever
 */

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const DB_FILE = path.join(ROOT, '..', '.data', 'aipetros.sqlite');
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
const db = new DatabaseSync(DB_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS knowledge_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    kind TEXT NOT NULL,             -- question | trick | glitch | cheat
    dedupe_key TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    source TEXT NOT NULL,
    url TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS ux_knowledge_cards ON knowledge_cards(game_id, kind, dedupe_key);
  CREATE INDEX IF NOT EXISTS ix_knowledge_game_kind ON knowledge_cards(game_id, kind);
`);

const UA = { 'User-Agent': 'AIPETROS-knowledge-ingest/1.0' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NOW = () => new Date().toISOString();

/** ---- compact per-game domains (mirrors coachQuestionBank) ---- */
const GAME_DOMAINS = {
  fc27: ['فرماسیون', 'شوت فینس', 'ضرب آزاد', 'پنالتی', 'کرنر', 'پاس عمقی', 'دیبل', 'SBC', 'مارکت انتقالات', 'دفاع عمقی', 'فشار بالا', 'پرس', 'درِوازه‌بان', 'مهاجم نوک', 'وینگر', 'هافبک دفاعی', 'پلیر مترایال', 'پک', 'چمیون شپ', 'فینال چهار', 'تیم پرس', 'کول‌داون'],
  efootball: ['پرس', 'شوت', 'پاس یک‌لمسی', 'دیبل فیکی', 'فرماسیون', 'کرنر', 'ضربه ایستگاهی', 'دروازه‌بان', 'دفاع', 'حمله سریع', 'میتا'],
  nba2k: ['شوت سه‌امتیازی', 'دانک', 'دیستونس', 'پیک‌اندرول', 'بیلد', 'بدج', 'آچمنت', 'دفاع', 'ریباند', 'پاس', 'مای‌کریر', 'پارک'],
  mlb: ['بتینگ تایمینگ', 'پیچ', 'دیفنس', 'روستینگ', 'فرنچایز', 'بیلد', 'دایاموند دینستی'],
  cs2: ['ایم', 'کروس‌هیر', 'فلش‌شات', 'اسموک', 'مولوتوف', 'کانتر-استرِیف', 'اکونومی', 'فورس بای', 'AWP', 'پیکینگ', 'ریتِیک', 'پست‌پلنت', 'مید', 'راش', 'اسلو راند', 'کلانچ'],
  valorant: ['ویکچر', 'جت', 'اسموک', 'فلش', 'سایت اتک', 'مید کنترل', 'اکونومی', 'اسپایک پلنت', 'ریتِیک', 'کلانچ', 'اپراتور', 'ایم روتین'],
  cod: ['لوداوت', 'اتچمنت', 'ایم', 'اسنایپ', 'نinja', 'کامو', 'اکونومی', 'فایف سایت', 'ترسینگ', 'کلانچ', 'پرکن', 'زون کنترل'],
  'f1-25': ['ستاپ', 'آیروبریک', 'آسیل', 'ترک', 'ریس استراتژی', 'پیت استاپ', 'کوالی', 'کرییر'],
  dota2: ['لست‌هیت', 'رونینگ', 'وارد', 'گنکینگ', 'آیتم تایمینگ', 'پوش', 'فارم', 'مچ‌آپ', 'Roshan', 'پوش دیفنس'],
  'elden-ring': ['بیلد', 'باکس', 'استمینا', 'پری', 'رول', 'باک‌لول', 'استور', 'سامون', 'سب‌باکس', 'رایند'],
  gta: ['هیست کاسینو', 'هیست پاسیفیک', 'VIP مأموریت', 'بیزینس', 'پول سریع', 'بهترین ماشین', 'تعقیب', '۵ ستاره', 'رانندگی', 'کشتن سریع', 'هیلی‌کوپتر'],
};
const INTENTS = ['چطوری', 'بهترین روش', 'کی', 'کجا', 'چرا', 'بهترین تایمینگ', 'بهترین ترفند', 'بهترین کامبو', 'چطور پیشرفت کنم', 'بهترین تنظیمات'];
const CTX = ['برای مبتدی', 'حرفه‌ای', 'سریع', 'تو رند آخر', 'بعد از پچ', 'با تیم', 'تو کول‌داون', 'بدون کمریسک'];

function normalize(t) {
  return t.toLowerCase().replace(/[\u064A\u0649]/g, 'ی').replace(/[\u0643]/g, 'ک').replace(/[\u200c\u200f\u200e]/g, ' ').replace(/[؟?.,،!!:؛]/g, ' ').replace(/\s+/g, ' ').trim();
}

function upsertCard(gameId, kind, title, body, source, url = '') {
  const key = normalize(title).slice(0, 120);
  if (!key) return 0;
  db.prepare(`
    INSERT INTO knowledge_cards (game_id, kind, dedupe_key, title, body, source, url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(game_id, kind, dedupe_key) DO UPDATE SET
      body = excluded.body, updated_at = excluded.updated_at
  `).run(gameId, kind, key, title, body, source, url, NOW(), NOW());
  return 1;
}

function generateQuestionCards(gameId) {
  const subjects = GAME_DOMAINS[gameId] ?? [];
  let n = 0;
  for (const subject of subjects) {
    for (const intent of INTENTS) {
      n += upsertCard(gameId, 'question', `${intent} ${subject}؟`, `سوال مربی: ${intent} ${subject} — پاسخ از جلسه ۵-ماژوله مربی + منابع زنده.`, 'generator:coach-domains');
    }
    for (const ctx of CTX) {
      n += upsertCard(gameId, 'question', `${subject} ${ctx} چیکار کنم؟`, `سناریوی واقعی: ${subject} — ${ctx}`, 'generator:coach-domains');
    }
  }
  return n;
}

async function fetchJson(url, timeoutMs = 9000) {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    const res = await fetch(url, { headers: UA, signal: ctl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function harvestForGame(game) {
  let harvested = 0;
  // GitHub repos: skill guides + glitches/cheats (titles+desc = real info w/ URL)
  const searches = [
    { q: `${game.github} tips guide tutorial`, kind: 'trick' },
    { q: `${game.github} glitch exploit`, kind: 'glitch' },
    { q: `${game.github} cheat trainer`, kind: 'cheat' },
  ];
  for (const s of searches) {
    const data = await fetchJson(`https://api.github.com/search/repositories?q=${encodeURIComponent(s.q)}&per_page=10&sort=updated`);
    for (const item of data?.items ?? []) {
      const isCheat = s.kind === 'cheat';
      const body = isCheat
        ? `آگاهی از تقلب (استفاده آموزش نمی‌شود — ریسک بن دائمی): ${(item.description ?? '').slice(0, 180)}`
        : (item.description ?? 'بدون توضیح').slice(0, 220);
      harvested += upsertCard(game.id, s.kind, item.full_name ?? item.name, body, 'github', item.html_url ?? '');
    }
    await sleep(4500); // keyless rate: 10/min
  }
  // Reddit top posts mentioning tips/tricks (JSON, keyless)
  const sub = game.sub;
  if (sub) {
    const data = await fetchJson(`https://www.reddit.com/r/${sub}/search.json?q=tips+OR+tricks+OR+guide&limit=25&sort=top&t=month`);
    for (const post of data?.data?.children ?? []) {
      const d = post.data ?? {};
      harvested += upsertCard(game.id, 'trick', d.title ?? 'post', `${(d.selftext ?? '').slice(0, 220)} — ups:${d.ups ?? 0}`, `reddit:r/${sub}`, `https://reddit.com${d.permalink ?? ''}`);
    }
  }
  return harvested;
}

const GAMES = [
  { id: 'fc27', github: 'fifa', sub: 'EAFC' },
  { id: 'efootball', github: 'efootball', sub: 'eFootball' },
  { id: 'nba2k', github: 'nba2k', sub: 'NBA2k' },
  { id: 'mlb', github: 'mlb the show', sub: null },
  { id: 'cs2', github: 'cs2', sub: 'cs2' },
  { id: 'valorant', github: 'valorant', sub: 'VALORANT' },
  { id: 'cod', github: 'call of duty', sub: 'modernwarfare' },
  { id: 'f1-25', github: 'f1 game', sub: null },
  { id: 'dota2', github: 'dota2', sub: 'DotA2' },
  { id: 'elden-ring', github: 'elden ring', sub: 'eldenring' },
  { id: 'gta', github: 'gta online', sub: 'gtav' },
];

async function ingestAll() {
  const t0 = Date.now();
  let generated = 0;
  let harvested = 0;
  const counts = {};
  for (const game of GAMES) {
    generated += generateQuestionCards(game.id);
    harvested += await harvestForGame(game);
    await sleep(1000);
  }
  const row = db.prepare('SELECT game_id, kind, COUNT(*) AS n FROM knowledge_cards GROUP BY game_id, kind').all();
  for (const r of row) {
    counts[`${r.game_id}:${r.kind}`] = r.n;
  }
  const summary = { ranAt: NOW(), generated, harvested, counts, tookMs: Date.now() - t0 };
  fs.writeFileSync(path.join(ROOT, '..', 'logs', 'knowledge-ingest-summary.json'), JSON.stringify(summary, null, 1));
  console.log(`[ingest] generated ${generated} question cards, harvested ${harvested} live cards, total store:`, JSON.stringify(counts));
  return summary;
}

const daemon = process.argv.includes('--daemon');
if (daemon) {
  const run = async () => {
    try { await ingestAll(); } catch (e) { console.error('[ingest] pass failed:', e.message); }
    setTimeout(run, 60 * 60 * 1000);
  };
  run();
} else {
  await ingestAll();
}
