import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAP_ENTITIES,
  filterMapEntities,
  formatDistanceLabel,
} from './platformMapEngine';

test('platformMapEngine provides entities across all 3 hubs covering users, clubs, stores, and drops', () => {
  const hubs = ['game', 'cinema', 'audio'] as const;
  for (const hub of hubs) {
    const items = filterMapEntities({ hub, query: '', kind: 'all', maxDistanceMeters: null });
    assert.ok(items.length >= 6, `Expected >= 6 entities for hub ${hub}`);
    const kinds = new Set(items.map((i) => i.kind));
    assert.ok(kinds.has('user'), `Missing user entity on map for ${hub}`);
    assert.ok(kinds.has('club'), `Missing club entity on map for ${hub}`);
    assert.ok(kinds.has('store'), `Missing store entity on map for ${hub}`);
    assert.ok(kinds.has('drop'), `Missing drop entity on map for ${hub}`);
  }
  assert.ok(MAP_ENTITIES.length >= 18);
});

test('filterMapEntities searches multilingual text, filters by kind and distance radius, and sorts closest first', () => {
  const nearbyStores = filterMapEntities({
    hub: 'game',
    query: 'Cyberware',
    kind: 'store',
    maxDistanceMeters: 1000,
  });
  assert.equal(nearbyStores.length, 1);
  assert.equal(nearbyStores[0].id, 'map-game-s1');

  const cinemaTreasure = filterMapEntities({
    hub: 'cinema',
    query: 'گنج',
    kind: 'all',
    maxDistanceMeters: null,
  });
  assert.ok(cinemaTreasure.length >= 1);

  const audioSorted = filterMapEntities({
    hub: 'audio',
    query: '',
    kind: 'all',
    maxDistanceMeters: 600,
  });
  assert.ok(audioSorted.every((x) => x.distanceMeters <= 600));
  for (let i = 1; i < audioSorted.length; i++) {
    assert.ok(audioSorted[i].distanceMeters >= audioSorted[i - 1].distanceMeters);
  }
});

test('formatDistanceLabel renders metric meters and kilometers cleanly', () => {
  assert.equal(formatDistanceLabel(420, false), '420m');
  assert.equal(formatDistanceLabel(1450, false), '1.5km');
  assert.equal(formatDistanceLabel(420, true), '420 متر');
});
