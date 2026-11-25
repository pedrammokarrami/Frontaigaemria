import assert from 'node:assert/strict';
import test from 'node:test';
import {
  REALM_CONSULTATION_TOPICS,
  recomputeTelestratorFromTap,
  resolveCoachTopic,
} from './coachSearchRules';

test('REALM_CONSULTATION_TOPICS provides 4 actionable consultation options per realm with motion vectors', () => {
  for (const realm of ['shooter', 'sports', 'strategy', 'story'] as const) {
    const topics = REALM_CONSULTATION_TOPICS[realm];
    assert.equal(topics.length, 4);
    for (const topic of topics) {
      assert.ok(topic.titleFa.length > 3);
      assert.ok(topic.coachAdviceFa.length > 10);
      assert.ok(topic.videos.length >= 1);
      assert.ok(topic.images.length >= 1);
      assert.ok(topic.motionArrows.length >= 1);
      assert.ok(topic.motionCallouts.length >= 1);
    }
  }
});

test('resolveCoachTopic matches preset topic by ID or synthesizes a custom query topic', () => {
  const preset = resolveCoachTopic('sports', 'sp-through-ball');
  assert.equal(preset.id, 'sp-through-ball');
  assert.ok(preset.titleFa.includes('پاس عمقی'));

  const custom = resolveCoachTopic('shooter', 'تنظیم نشانه اسنایپ');
  assert.ok(custom.titleFa.includes('تنظیم نشانه اسنایپ'));
  assert.equal(custom.searchQuery, 'تنظیم نشانه اسنایپ');
});

test('recomputeTelestratorFromTap updates origin circle and generates danger and target circles', () => {
  const base = resolveCoachTopic('shooter', 'sh-smoke-exec');
  const updated = recomputeTelestratorFromTap(base, 24, 72);
  assert.equal(updated.motionArrows[0].fromX, 24);
  assert.equal(updated.motionArrows[0].fromY, 72);
  assert.equal(updated.motionCallouts.length, 3);
  assert.equal(updated.motionCallouts[1].zoneType, 'danger');
  assert.equal(updated.motionCallouts[2].zoneType, 'target');
});

