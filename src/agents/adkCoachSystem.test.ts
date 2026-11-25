import assert from 'node:assert/strict';
import test from 'node:test';
import { runAdkMultiAgentConsultation } from './adkCoachSystem';

test('runAdkMultiAgentConsultation orchestrates all 4 ADK sub-agents and populates patch micro-details', async () => {
  const result = await runAdkMultiAgentConsultation({
    realm: 'shooter',
    query: 'sh-smoke-exec',
  });

  assert.ok(result.adkIntel);
  assert.equal(result.adkIntel.framework, 'AIPETROS Internal Agent Mesh · Deterministic Rule Pipeline');
  assert.equal(result.adkIntel.agentsTrace.length, 4);
  assert.equal(result.adkIntel.agentsTrace[0].agentName, 'VisionTelestratorAgent');
  assert.equal(result.adkIntel.agentsTrace[1].agentName, 'MetaPatchNotesAgent');
  assert.equal(result.adkIntel.agentsTrace[2].agentName, 'MicroMechanicsAgent');
  assert.equal(result.adkIntel.agentsTrace[3].agentName, 'CounterPlayMistakeAgent');
  assert.ok(Array.isArray(result.adkIntel.liveSources));
  assert.ok(result.adkIntel.liveSources.length >= 1);
  assert.ok(result.adkIntel.patchVersion.includes('CS2'));
  assert.ok(result.adkIntel.inputComboFa.length > 20);
  assert.ok(result.adkIntel.frameTimingFa.length > 20);
  assert.ok(result.adkIntel.proSettingsFa.length > 15);
  assert.ok(result.adkIntel.fatalMistakeFa.length > 20);
  assert.equal(result.adkIntel.microChecklistFa.length, 3);
});

test('runAdkMultiAgentConsultation updates telestrator vectors when tapX and tapY are provided', async () => {
  const result = await runAdkMultiAgentConsultation({
    realm: 'sports',
    query: 'sp-break-press',
    tapX: 28,
    tapY: 66,
  });

  assert.equal(result.motionArrows[0].fromX, 28);
  assert.equal(result.motionArrows[0].fromY, 66);
  assert.equal(result.motionCallouts.length, 3);
  assert.ok(result.adkIntel?.patchVersion.includes('FC 25'));
});
