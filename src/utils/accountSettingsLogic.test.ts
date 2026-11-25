import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ACCOUNT_SETTINGS,
  MAX_PAYNE_NOIR_CELLO_THEME,
  evaluatePasswordStrength,
  revokeAccountSession,
  revokeAllOtherSessions,
  validateEmailAddress,
  validatePasswordChange,
} from './accountSettingsLogic';

test('validateEmailAddress accepts valid emails and rejects malformed inputs', () => {
  assert.equal(validateEmailAddress('elikhademi68@gmail.com').valid, true);
  assert.equal(validateEmailAddress('player.pro@aipetros.gg').valid, true);
  assert.equal(validateEmailAddress('').valid, false);
  assert.equal(validateEmailAddress('invalid-email').valid, false);
  assert.equal(validateEmailAddress('missing@tld').valid, false);
});

test('evaluatePasswordStrength accurately scores weak through strong passwords', () => {
  assert.equal(evaluatePasswordStrength('').score, 0);
  assert.equal(evaluatePasswordStrength('abc').score, 1);
  const strong = evaluatePasswordStrength('NoirRain#2026!');
  assert.equal(strong.score, 4);
  assert.equal(strong.checks.minLength, true);
  assert.equal(strong.checks.hasUpper, true);
  assert.equal(strong.checks.hasLower, true);
  assert.equal(strong.checks.hasNumber, true);
  assert.equal(strong.checks.hasSymbol, true);
});

test('validatePasswordChange enforces current password, policy, difference, and confirmation match', () => {
  assert.equal(validatePasswordChange('', 'NoirRain#2026', 'NoirRain#2026').valid, false);
  assert.equal(validatePasswordChange('OldPass1!', 'short1', 'short1').valid, false);
  assert.equal(validatePasswordChange('SamePass1!', 'SamePass1!', 'SamePass1!').valid, false);
  assert.equal(validatePasswordChange('OldPass1!', 'NoirRain#2026', 'Mismatch#2026').valid, false);
  assert.equal(validatePasswordChange('OldPass1!', 'NoirRain#2026', 'NoirRain#2026').valid, true);
});

test('session revocation removes non-current devices while protecting active current session', () => {
  const initial = DEFAULT_ACCOUNT_SETTINGS.sessions;
  assert.equal(initial.length, 3);

  const afterOne = revokeAccountSession(initial, 'sess-ios');
  assert.equal(afterOne.length, 2);
  assert.equal(afterOne.some((s) => s.id === 'sess-ios'), false);

  // Attempting to revoke current session keeps it protected
  const protectCurrent = revokeAccountSession(afterOne, 'sess-current');
  assert.equal(protectCurrent.some((s) => s.id === 'sess-current'), true);

  const onlyCurrent = revokeAllOtherSessions(initial);
  assert.equal(onlyCurrent.length, 1);
  assert.equal(onlyCurrent[0].isCurrent, true);
});

test('MAX_PAYNE_NOIR_CELLO_THEME defines playable melancholic C-minor cello and snowy piano ostinato frequencies', () => {
  assert.ok(MAX_PAYNE_NOIR_CELLO_THEME.length >= 12);
  let notesWithPianoArp = 0;
  for (const note of MAX_PAYNE_NOIR_CELLO_THEME) {
    assert.ok(note.freq >= 60 && note.freq <= 440);
    assert.ok(note.durationSec >= 1.0 && note.durationSec <= 4.0);
    if (note.pianoArpFreqs && note.pianoArpFreqs.length > 0) {
      notesWithPianoArp += 1;
      for (const f of note.pianoArpFreqs) {
        assert.ok(f >= 180 && f <= 880);
      }
    }
  }
  assert.ok(notesWithPianoArp >= 10);
});
