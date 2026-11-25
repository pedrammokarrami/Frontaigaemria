import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeLipSyncAmplitude,
  computeMetaHumanProfile,
  parseHologramAgentTags,
} from './hologramAvatarEngine.ts';

test('computeMetaHumanProfile clamps age continuously between 8 and 99 with distinct Persian/English labels', () => {
  const childBoy = computeMetaHumanProfile('male', 4);
  assert.equal(childBoy.age, 8);
  assert.equal(childBoy.ageFactor, 0);
  assert.ok(childBoy.stageLabelFa.includes('8'));

  const youngGirl = computeMetaHumanProfile('female', 20);
  const matureWoman = computeMetaHumanProfile('female', 55);
  const elderWoman = computeMetaHumanProfile('female', 110);

  assert.equal(elderWoman.age, 99);
  assert.equal(elderWoman.ageFactor, 1);
  assert.ok(matureWoman.maturityFactor > youngGirl.maturityFactor);
  assert.ok(elderWoman.hairSilverRatio > matureWoman.hairSilverRatio);
  assert.equal(youngGirl.ttsVoiceName, 'Aoede');
  assert.equal(childBoy.ttsVoiceName, 'Charon');
});

test('parseHologramAgentTags extracts inline emotion & gesture tags cleanly', () => {
  const parsed = parseHologramAgentTags(
    '[Emotion: Thinking] [Gesture: Wave] سلام! تطابق شخصیتت با آرتور مورگان ۹۶ درصد ثبت شد.'
  );
  assert.equal(parsed.emotion, 'Thinking');
  assert.equal(parsed.gesture, 'Wave');
  assert.equal(parsed.cleanText, 'سلام! تطابق شخصیتت با آرتور مورگان ۹۶ درصد ثبت شد.');
});

test('computeLipSyncAmplitude returns 0 when silent and bounded active amplitude when speaking', () => {
  assert.equal(computeLipSyncAmplitude(false, 1.2, 0.5), 0);
  const ampAudio = computeLipSyncAmplitude(true, 1.2, 0.3);
  assert.ok(ampAudio > 0.5 && ampAudio <= 1);
  const ampFallback = computeLipSyncAmplitude(true, 1.2);
  assert.ok(ampFallback > 0 && ampFallback <= 1);
});
