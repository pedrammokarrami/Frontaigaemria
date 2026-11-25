import test from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

/**
 * STRICT language test (user mandate 2026-11-23):
 * in English UI mode there must be ZERO Persian — not in menus, buttons,
 * chips, suggestions or game-choice labels. Enforced via the i18n fallback
 * maps: if an id is missing from an EN map, real users get Persian text.
 */

const FA_RE = /[\u0600-\u06FF]/;
const EN = 'en-US';

import { LOBBY_SKILLS_BY_GAME, LOBBY_GAME_TABS } from './lobbySkillCatalog';
import {
  getSkillTitle,
  getSkillCategoryLabel,
  getCategoryLabel,
  getMenuDescriptor,
} from './i18nEngine';
import {
  getGamePs5MenuItems,
  getAudioSpotifyMenuItems,
  getCinemaNetflixMenuItems,
} from './hubQuickMenu';
import { GAME_STYLES, defaultGameForStyle } from './gameStyles';
import { suggestCoachQuestions } from './coachQuestionBank';
import { detectGameAmbiguity } from '../agents/gameAmbiguity';

test('strict: every skill card has an English title & category (no Persian fallback)', () => {
  for (const [gameId, skills] of Object.entries(LOBBY_SKILLS_BY_GAME)) {
    for (const skill of skills) {
      const title = getSkillTitle(skill.id, skill.titleFa, EN);
      const cat = getSkillCategoryLabel(skill.id, skill.categoryLabelFa, EN);
      assert.ok(!FA_RE.test(title), `${gameId}/${skill.id} title falls back to Persian: ${title}`);
      assert.ok(!FA_RE.test(cat), `${gameId}/${skill.id} category falls back to Persian: ${cat}`);
    }
  }
});

test('strict: quick-menu (PS5 game) items carry English menus', () => {
  const items = getGamePs5MenuItems({ hasVideoBackdrop: false, useVideoBackdrop: false });
  for (const item of items) {
    const d = getMenuDescriptor('game', item.id, item.titleFa, item.subtitleFa, item.badgeText, EN);
    assert.ok(!FA_RE.test(d.title), `quick-menu ${item.id} title still Persian: ${d.title}`);
    assert.ok(!FA_RE.test(d.subtitle), `quick-menu ${item.id} subtitle still Persian: ${d.subtitle}`);
    if (d.badge) assert.ok(!FA_RE.test(d.badge), `quick-menu ${item.id} badge still Persian: ${d.badge}`);
  }
});

test('strict: audio & cinema hub menus carry English entries', () => {
  for (const item of getAudioSpotifyMenuItems()) {
    const d = getMenuDescriptor('audio', item.id, item.titleFa, item.subtitleFa, item.badgeText, EN);
    assert.ok(!FA_RE.test(d.title), `audio-menu ${item.id} title still Persian`);
  }
  for (const item of getCinemaNetflixMenuItems(false)) {
    const d = getMenuDescriptor('cinema', item.id, item.titleFa, item.subtitleFa, item.badgeText, EN);
    assert.ok(!FA_RE.test(d.title), `cinema-menu ${item.id} title still Persian`);
  }
});

test('strict: game style pills have English labels and valid defaults', () => {
  for (const style of GAME_STYLES) {
    assert.ok(style.labelEn && !FA_RE.test(style.labelEn), `style ${style.id} missing English label`);
    const def = defaultGameForStyle(style.id);
    assert.ok(def, `style ${style.id} has no default game`);
  }
});

test('strict: suggested questions in English mode contain zero Persian', () => {
  for (const tab of LOBBY_GAME_TABS) {
    const qs = suggestCoachQuestions('formation smoke heist aim', tab.id, 8, EN);
    for (const q of qs) {
      assert.ok(!FA_RE.test(q), `suggestion leaked Persian in ${tab.id}: ${q}`);
    }
  }
});

test('strict: game ambiguity choice chips have English labels', () => {
  const r = detectGameAmbiguity('بهترین ترکیب بارسا');
  for (const c of r.candidates as Array<{ gameId: string; labelFa: string; labelEn?: string }>) {
    assert.ok(c.labelFa !== undefined, `${c.gameId} shape broken`);
    if (c.labelEn) assert.ok(!FA_RE.test(c.labelEn), `${c.gameId} labelEn is Persian`);
  }
});

test('strict: lobby game tabs are Latin labels', () => {
  for (const tab of LOBBY_GAME_TABS) {
    assert.ok(!FA_RE.test(tab.label), `game tab ${tab.id} label must be Latin`);
  }
});

test('strict: skill category chips resolve via getCategoryLabel in English', () => {
  const chipIds = ['all', 'shoot', 'defense', 'attack', 'pass', 'aim', 'smoke', 'peek', 'clutch', 'heist', 'flank', 'cover', 'escape', 'utility'];
  for (const id of chipIds) {
    const label = getCategoryLabel(id, 'دسته فارسی', EN);
    assert.ok(!FA_RE.test(label), `chip ${id} falls back to Persian`);
  }
});

test('strict: coach session panel module titles/stats and clip fallback are language-gated', () => {
  const src = readFileSync('src/components/spatial/CoachSessionPanel.tsx', 'utf8');
  // module tab + title + stats must branch on the language flag
  assert.ok(/isFa \? m\.titleFa : m\.titleEn/.test(src), 'module tab label not language-gated');
  assert.ok(/isFa \? activeModule\.titleFa : activeModule\.titleEn/.test(src), 'module title not language-gated');
  assert.ok(/isFa \? st\.labelFa : st\.labelEn/.test(src), 'stat label not language-gated');
  const clip = readFileSync('src/components/spatial/RealClipCoachRoom.tsx', 'utf8');
  assert.ok(clip.includes('In-page playback failed'), 'English fallback card missing');
  assert.ok(clip.includes('Open clip on YouTube'), 'English fallback button missing');
});
