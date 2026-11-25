import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDigitsToAscii, parseUserSelfIntro } from './userSelfIntroParser';

test('normalizeDigitsToAscii converts Persian and Arabic numerals cleanly', () => {
  assert.equal(normalizeDigitsToAscii('۲۴ ساله و ٩٠'), '24 ساله و 90');
});

test('parseUserSelfIntro detects Persian female age, name, game affinity and traits', () => {
  const result = parseUserSelfIntro('من سارا هستم، ۲۲ سالمه و عاشق ماجراجویی و شطرنج سریع‌ام');
  assert.equal(result.detectedGender, 'female');
  assert.equal(result.detectedAge, 22);
  assert.equal(result.detectedName, 'سارا');
  assert.equal(result.detectedGameKey, 'chess');
  assert.ok(result.extractedTraitsFa.includes('روحیه ماجراجو و خلاق'));
});

test('parseUserSelfIntro detects male age and CS2 tactical playstyle from chat', () => {
  const result = parseUserSelfIntro('پسرم ۳۶ سالمه، عاشق کانتر و کلچ کردن تاکتیکی‌ام');
  assert.equal(result.detectedGender, 'male');
  assert.equal(result.detectedAge, 36);
  assert.equal(result.detectedGameKey, 'cs2');
  assert.ok(result.extractedTraitsFa.includes('سبک تهاجمی و کلچ'));
});

test('parseUserSelfIntro ignores out-of-range ages outside 8..99', () => {
  const result = parseUserSelfIntro('5 سال دارم');
  assert.equal(result.detectedAge, null);
});

test('parseUserSelfIntro recognizes all newly added registered game spaces', () => {
  assert.equal(parseUserSelfIntro('عاشق جی تی ای و سرقت کازینوام').detectedGameKey, 'gta');
  assert.equal(parseUserSelfIntro('بازی رد دد و آرتور بهترینه').detectedGameKey, 'rdr2');
  assert.equal(parseUserSelfIntro('اهل وارزون و بتل رویال هستم').detectedGameKey, 'warzone');
  assert.equal(parseUserSelfIntro('پلیر اپکس هستم').detectedGameKey, 'apex');
  assert.equal(parseUserSelfIntro('توی فورتنایت بیلد میزنم').detectedGameKey, 'fortnite');
  assert.equal(parseUserSelfIntro('میدلاین دوتا بازی میکنم').detectedGameKey, 'dota2');
  assert.equal(parseUserSelfIntro('عاشق بسکتبال و NBA 2K هستم').detectedGameKey, 'nba2k');
  assert.equal(parseUserSelfIntro('توی پیست فرمول ۱ ریسینگ میرم').detectedGameKey, 'f1');
});

