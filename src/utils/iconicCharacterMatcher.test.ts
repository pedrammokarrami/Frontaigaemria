import assert from 'node:assert/strict';
import test from 'node:test';
import { ICONIC_GAME_CHARACTERS } from '../data/iconicGameCharacters.ts';
import { matchIconicCharacters } from './iconicCharacterMatcher.ts';

test('ICONIC_GAME_CHARACTERS contains exactly 50 unique iconic gaming legends including Arthur Morgan and Max Payne', () => {
  assert.equal(ICONIC_GAME_CHARACTERS.length, 50);

  const ids = new Set(ICONIC_GAME_CHARACTERS.map((c) => c.id));
  assert.equal(ids.size, 50, 'All 50 character IDs must be unique');

  const arthur = ICONIC_GAME_CHARACTERS.find((c) => c.id === 'arthur-morgan');
  const maxPayne = ICONIC_GAME_CHARACTERS.find((c) => c.id === 'max-payne');
  assert.ok(arthur, 'Arthur Morgan must be in the 50-character roster');
  assert.ok(maxPayne, 'Max Payne must be in the 50-character roster');
  assert.equal(arthur.plateKey, 'arthur_gunslinger');
  assert.equal(maxPayne.plateKey, 'max_noir');

  const males = ICONIC_GAME_CHARACTERS.filter((c) => c.gender === 'male');
  const females = ICONIC_GAME_CHARACTERS.filter((c) => c.gender === 'female');
  assert.ok(males.length >= 22, 'Should have rich male roster');
  assert.ok(females.length >= 20, 'Should have rich female roster');
});

test('matchIconicCharacters matches Arthur Morgan / Max Payne for rugged adult male profiles and Lara/Jill for young female profiles', () => {
  const arthurMatch = matchIconicCharacters({
    gender: 'male',
    age: 36,
    activeGameKey: 'unified',
    winRatePct: 74,
    tacticalConsistencyPct: 93,
    competitiveRating: 2640,
  });
  assert.equal(arthurMatch.totalRosterCount, 50);
  assert.equal(arthurMatch.topMatch.character.id, 'arthur-morgan');
  assert.ok(arthurMatch.topMatch.similarityPct >= 90);

  const maxMatch = matchIconicCharacters({
    gender: 'male',
    age: 42,
    activeGameKey: 'cs2',
    winRatePct: 73,
    tacticalConsistencyPct: 92,
    competitiveRating: 2610,
  });
  assert.equal(maxMatch.topMatch.character.id, 'max-payne');

  const laraMatch = matchIconicCharacters({
    gender: 'female',
    age: 25,
    activeGameKey: 'unified',
    winRatePct: 72,
    tacticalConsistencyPct: 92,
    competitiveRating: 2540,
  });
  assert.equal(laraMatch.topMatch.character.id, 'lara-croft');
});

test('matchIconicCharacters spans full 8 to 99 age spectrum across both genders', () => {
  const boy8 = matchIconicCharacters({
    gender: 'male',
    age: 8,
    activeGameKey: 'chess',
    winRatePct: 62,
    tacticalConsistencyPct: 80,
    competitiveRating: 1980,
  });
  assert.equal(boy8.topMatch.character.gender, 'male');
  assert.equal(boy8.topMatch.character.plateKey, 'boy_prodigy');

  const girl12 = matchIconicCharacters({
    gender: 'female',
    age: 12,
    activeGameKey: 'chess',
    winRatePct: 68,
    tacticalConsistencyPct: 91,
    competitiveRating: 2320,
  });
  assert.equal(girl12.topMatch.character.gender, 'female');
  assert.equal(girl12.topMatch.character.plateKey, 'girl_prodigy');

  const male92 = matchIconicCharacters({
    gender: 'male',
    age: 92,
    activeGameKey: 'chess',
    winRatePct: 74,
    tacticalConsistencyPct: 96,
    competitiveRating: 2680,
  });
  assert.equal(male92.topMatch.character.id, 'vesemir');
  assert.equal(male92.topMatch.character.plateKey, 'male_elder');

  const female88 = matchIconicCharacters({
    gender: 'female',
    age: 88,
    activeGameKey: 'valorant',
    winRatePct: 75,
    tacticalConsistencyPct: 96,
    competitiveRating: 2690,
  });
  assert.equal(female88.topMatch.character.id, 'ana-amari');
  assert.equal(female88.topMatch.character.plateKey, 'female_elder');
});
