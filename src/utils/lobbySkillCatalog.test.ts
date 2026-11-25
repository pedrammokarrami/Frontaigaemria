import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOBBY_CATEGORIES_BY_GAME,
  LOBBY_GAME_TABS,
  LOBBY_SKILLS_BY_GAME,
  filterLobbySkills,
  getLobbyGameTab,
  normalizeLobbySearchText,
  resolveLobbyGameFromAppState,
} from './lobbySkillCatalog';

test('all 4 lobby game tabs have categories and 4 unclipped Persian skills', () => {
  assert.deepEqual(
    LOBBY_GAME_TABS.map((t) => t.id),
    ['fc27', 'cs2', 'gta', 'valorant']
  );

  for (const tab of LOBBY_GAME_TABS) {
    const categories = LOBBY_CATEGORIES_BY_GAME[tab.id];
    const skills = LOBBY_SKILLS_BY_GAME[tab.id];
    assert.ok(categories.length >= 5, `${tab.id} should have at least 5 filter chips`);
    assert.equal(categories[0].id, 'all');
    assert.ok(skills.length >= 4, `${tab.id} should have at least 4 skill cards`);
    for (const skill of skills) {
      assert.ok(skill.titleFa.length > 6);
      assert.ok(!skill.titleFa.includes('...'), `Title must not be truncated: ${skill.titleFa}`);
    }
  }
});

test('FC 27 categories match exact Persian chips and filter accurately', () => {
  assert.deepEqual(
    LOBBY_CATEGORIES_BY_GAME.fc27.map((c) => c.labelFa),
    ['همه', 'شوت', 'دفاع', 'حمله', 'پاس']
  );

  const defenseOnly = filterLobbySkills('fc27', 'defense', '');
  assert.equal(defenseOnly.length, 1);
  assert.equal(defenseOnly[0].titleFa, 'تنظیمات دفاعی و عمق ۷۱');

  const passOnly = filterLobbySkills('fc27', 'pass', '');
  assert.equal(passOnly.length, 1);
  assert.equal(passOnly[0].titleFa, 'پاس عمقی دقیق (L1+R1+△)');
});

test('search filters in real time by button combo, Persian digits, and Arabic letters', () => {
  const byL1 = filterLobbySkills('fc27', 'all', 'L1');
  assert.ok(byL1.some((s) => s.id === 'fc27-02'));

  const byTriangle = filterLobbySkills('fc27', 'all', '△');
  assert.equal(byTriangle.length, 1);
  assert.equal(byTriangle[0].id, 'fc27-02');

  const byLatinDigits = filterLobbySkills('fc27', 'all', '71');
  assert.equal(byLatinDigits.length, 1);
  assert.equal(byLatinDigits[0].id, 'fc27-04');

  const byArabicLetters = filterLobbySkills('fc27', 'all', 'كاتدار');
  assert.equal(byArabicLetters.length, 1);
  assert.equal(byArabicLetters[0].id, 'fc27-03');

  assert.equal(normalizeLobbySearchText('۷۱ كاتدار ي'), '71 کاتدار ی');
});

test('switching games updates skills and resolves app state cleanly', () => {
  const cs2Aim = filterLobbySkills('cs2', 'aim', '');
  assert.equal(cs2Aim.length, 1);
  assert.ok(cs2Aim[0].titleFa.includes('کانتر-استریف'));

  const gtaFlank = filterLobbySkills('gta', 'all', 'R2');
  assert.equal(gtaFlank.length, 1);
  assert.ok(gtaFlank[0].titleFa.includes('پنت‌هاوس'));

  const valVandal = filterLobbySkills('valorant', 'all', 'وندال');
  assert.equal(valVandal.length, 1);

  assert.equal(resolveLobbyGameFromAppState('valorant', 'shooter'), 'valorant');
  assert.equal(resolveLobbyGameFromAppState('unknown', 'story'), 'gta');
  assert.equal(getLobbyGameTab('gta').realm, 'story');
});
