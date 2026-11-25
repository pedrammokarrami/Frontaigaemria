import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUDIO_CARDS_BY_ROOM,
  AUDIO_CATEGORIES_BY_ROOM,
  CINEMA_CARDS_BY_ROOM,
  CINEMA_CATEGORIES_BY_ROOM,
  filterHubCards,
} from './hubLobbyCatalog';

test('CINEMA_CARDS_BY_ROOM & AUDIO_CARDS_BY_ROOM define 4 numbered cards per room matching Game Lobby UX', () => {
  const cinemaRooms = Object.keys(CINEMA_CARDS_BY_ROOM) as Array<keyof typeof CINEMA_CARDS_BY_ROOM>;
  assert.equal(cinemaRooms.length, 5);
  for (const r of cinemaRooms) {
    assert.equal(CINEMA_CARDS_BY_ROOM[r].length, 4);
    assert.ok(CINEMA_CATEGORIES_BY_ROOM[r].some((c) => c.id === 'all'));
  }

  const audioRooms = Object.keys(AUDIO_CARDS_BY_ROOM) as Array<keyof typeof AUDIO_CARDS_BY_ROOM>;
  assert.equal(audioRooms.length, 7);
  for (const r of audioRooms) {
    assert.equal(AUDIO_CARDS_BY_ROOM[r].length, 4);
    assert.ok(AUDIO_CATEGORIES_BY_ROOM[r].some((c) => c.id === 'all'));
  }
});

test('filterHubCards filters cleanly by category chip and Persian/English search query', () => {
  const animeCards = CINEMA_CARDS_BY_ROOM.anime;
  assert.equal(filterHubCards(animeCards, 'all', '').length, 4);
  assert.equal(filterHubCards(animeCards, 'sakuga', '').length, 1);
  assert.equal(filterHubCards(animeCards, 'all', 'زیرنویس').length, 1);

  const acCards = AUDIO_CARDS_BY_ROOM['ac-library'];
  assert.equal(filterHubCards(acCards, 'all', 'داوینچی').length, 1);
});
