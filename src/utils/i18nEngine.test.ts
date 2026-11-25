import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LANGUAGE_CODE,
  LANGUAGE_REGIONS,
  WORLD_LANGUAGES,
  filterWorldLanguages,
  findWorldLanguage,
  getCardTitle,
  getCategoryLabel,
  getRoomTitle,
  getSkillTitle,
  getUiCopy,
  isRtlLanguage,
} from './i18nEngine';

test('default language is English (en)', () => {
  assert.equal(DEFAULT_LANGUAGE_CODE, 'en');
  const en = findWorldLanguage(DEFAULT_LANGUAGE_CODE);
  assert.equal(en.code, 'en');
  assert.equal(en.dir, 'ltr');
  assert.equal(isRtlLanguage('en'), false);
});

test('WORLD_LANGUAGES covers at least 80 world languages with unique ISO codes across all regions', () => {
  assert.ok(WORLD_LANGUAGES.length >= 80, `Expected >=80 world languages, got ${WORLD_LANGUAGES.length}`);
  const codes = new Set<string>();
  const regions = new Set<string>();
  for (const lang of WORLD_LANGUAGES) {
    assert.ok(!codes.has(lang.code), `Duplicate code: ${lang.code}`);
    codes.add(lang.code);
    regions.add(lang.region);
    assert.ok(lang.englishName.length > 0);
    assert.ok(lang.nativeName.length > 0);
    assert.ok(lang.voiceBcp47.length > 0);
  }
  for (const region of LANGUAGE_REGIONS) {
    if (region !== 'All') {
      assert.ok(regions.has(region), `Missing region: ${region}`);
    }
  }
});

test('filterWorldLanguages matches English names, native scripts, ISO codes, aliases, and regions', () => {
  const byPersianAlias = filterWorldLanguages(WORLD_LANGUAGES, 'farsi', 'All');
  assert.ok(byPersianAlias.some((l) => l.code === 'fa'));

  const byNativePersian = filterWorldLanguages(WORLD_LANGUAGES, 'فارسی', 'Middle East');
  assert.equal(byNativePersian.length, 1);
  assert.equal(byNativePersian[0].code, 'fa');

  const byJapaneseNative = filterWorldLanguages(WORLD_LANGUAGES, '日本語', 'Asia-Pacific');
  assert.ok(byJapaneseNative.some((l) => l.code === 'ja'));

  const byIsoCode = filterWorldLanguages(WORLD_LANGUAGES, 'es-mx', 'Americas');
  assert.ok(byIsoCode.some((l) => l.code === 'es-MX'));
});

test('getUiCopy returns English copy by default, Persian copy for fa, and English fallback for lesser-known codes', () => {
  const en = getUiCopy('en');
  assert.equal(en.hubGame, 'Game');
  assert.equal(en.hubCinema, 'Cinema & TV');
  assert.equal(en.hubAudio, 'Music & Audio');

  const fa = getUiCopy('fa');
  assert.equal(fa.hubGame, 'گیم');
  assert.equal(isRtlLanguage('fa'), true);

  const sw = getUiCopy('sw');
  assert.equal(sw.hubGame, 'Game');
});

test('room, category, skill, and card localization translators provide clean English strings', () => {
  assert.equal(getRoomTitle('westworld-cafe', 'کافه وست‌ورلد', 'en'), 'Westworld Cafe');
  assert.equal(getRoomTitle('westworld-cafe', 'کافه وست‌ورلد', 'fa'), 'کافه وست‌ورلد');
  assert.equal(getCategoryLabel('all', 'همه', 'en'), 'All');
  assert.equal(getSkillTitle('fc27-01', 'شکستن پرس سنگین ۴-۲-۳-۱', 'en'), 'Break Heavy 4-2-3-1 Press');
  assert.equal(getCardTitle('cin-mov-01', 'بازبینی کارگردان', 'en'), "Director's Cut: Blade Runner 2049 (4K HDR)");
});
