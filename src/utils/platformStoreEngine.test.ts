import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_STORE_PRODUCTS,
  STORE_COLLECTIONS,
  filterStoreProducts,
  validateAndCreateUserListing,
} from './platformStoreEngine';

test('store engine supplies curated collections and partner/community products for game, cinema, and audio', () => {
  const hubs = ['game', 'cinema', 'audio'] as const;
  for (const hub of hubs) {
    const cols = STORE_COLLECTIONS.filter((c) => c.hub === hub);
    assert.ok(cols.length >= 2, `Expected >= 2 collections for ${hub}`);
    const products = filterStoreProducts(INITIAL_STORE_PRODUCTS, {
      hub,
      query: '',
      source: 'all',
      category: 'all',
      collectionId: null,
      maxPriceUsd: null,
      sortBy: 'featured',
    });
    assert.ok(products.length >= 4, `Expected >= 4 products for ${hub}`);
  }
});

test('filterStoreProducts supports advanced query, source, category, max price, and sorting', () => {
  const cheapAudio = filterStoreProducts(INITIAL_STORE_PRODUCTS, {
    hub: 'audio',
    query: 'vinyl',
    source: 'all',
    category: 'all',
    collectionId: null,
    maxPriceUsd: 100,
    sortBy: 'price-asc',
  });
  assert.equal(cheapAudio.length, 1);
  assert.equal(cheapAudio[0].id, 'prod-aud-2');

  const cinemaCommunity = filterStoreProducts(INITIAL_STORE_PRODUCTS, {
    hub: 'cinema',
    query: '',
    source: 'community',
    category: 'Books & Scripts',
    collectionId: null,
    maxPriceUsd: null,
    sortBy: 'price-desc',
  });
  assert.equal(cinemaCommunity.length, 1);
  assert.equal(cinemaCommunity[0].isUserListing, true);
});

test('validateAndCreateUserListing validates inputs and strictly disallows image uploads', () => {
  const badTitle = validateAndCreateUserListing({
    hub: 'game',
    title: 'ab',
    priceRaw: '50',
    category: 'Peripherals',
    condition: 'New',
    description: 'Detailed tactical mouse description',
    sellerName: 'Ali',
  });
  assert.equal(badTitle.ok, false);

  const badPrice = validateAndCreateUserListing({
    hub: 'cinema',
    title: 'Collector Film Book',
    priceRaw: '0',
    category: 'Books & Scripts',
    condition: 'Collector',
    description: 'Full hardcover edition description with notes',
    sellerName: 'Sara',
  });
  assert.equal(badPrice.ok, false);

  const badDesc = validateAndCreateUserListing({
    hub: 'audio',
    title: 'Studio Cable',
    priceRaw: '25',
    category: 'Headphones & Amps',
    condition: 'New',
    description: 'Too short',
    sellerName: 'Reza',
  });
  assert.equal(badDesc.ok, false);

  const valid = validateAndCreateUserListing({
    hub: 'audio',
    title: 'Custom Analog Delay Pedal',
    priceRaw: '149.50',
    category: 'Synthesizers',
    condition: 'Mint Used',
    description: 'Warm bucket-brigade analog delay pedal tested in Berlin studio with original box.',
    sellerName: 'Kian_Audio',
  });
  assert.equal(valid.ok, true);
  assert.ok(valid.item);
  assert.equal(valid.item.priceUsd, 149.5);
  assert.equal(valid.item.isUserListing, true);
  assert.equal(valid.item.hasImageUpload, false);
  assert.equal(valid.item.imageUrl, null);
});
