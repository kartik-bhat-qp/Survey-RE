import assert from 'node:assert/strict';
import test from 'node:test';
import {
  actionAfterChallenge,
  evaluateIntegrity,
  isDisposableEmail,
} from '../src/lib/integrity/policy.ts';
import { loginIsSampled, surveyProtectionSummary } from '../src/lib/integrity/coverage.ts';

const quiet = {
  recentAttempts: 1,
  elapsedMs: 4000,
  token: 'valid',
  failedAttempts: 0,
  disposableEmail: false,
  repeatedIdentity: false,
};

test('a normal survey visit is allowed', () => {
  const decision = evaluateIntegrity({
    entry: 'survey',
    mode: 'protect',
    signals: quiet,
  });
  assert.equal(decision.risk, 'low');
  assert.equal(decision.action, 'allow');
  assert.equal(decision.reasons.length, 0);
});

test('speed alone does not raise risk', () => {
  const decision = evaluateIntegrity({
    entry: 'survey',
    mode: 'protect',
    signals: { ...quiet, elapsedMs: 80 },
  });
  assert.equal(decision.risk, 'low');
  assert.equal(decision.action, 'allow');
});

test('a reused link alone asks for confirmation and does not hold the visit', () => {
  const decision = evaluateIntegrity({
    entry: 'survey',
    mode: 'protect',
    signals: { ...quiet, token: 'reused' },
  });
  assert.equal(decision.risk, 'medium');
  assert.equal(decision.action, 'challenge');
  assert.deepEqual(decision.reasons, ['token-reused']);
});

test('a reused link plus a burst of attempts holds the visit', () => {
  const decision = evaluateIntegrity({
    entry: 'invitation',
    mode: 'protect',
    signals: { ...quiet, token: 'reused', recentAttempts: 8, elapsedMs: 100 },
  });
  assert.equal(decision.risk, 'high');
  assert.equal(decision.action, 'restrict');
  assert.ok(decision.reasons.includes('token-reused'));
  assert.ok(decision.reasons.includes('repeated-visits'));
});

test('observe mode records the hold and still allows the visit', () => {
  const decision = evaluateIntegrity({
    entry: 'survey',
    mode: 'observe',
    signals: { ...quiet, token: 'reused', recentAttempts: 8 },
  });
  assert.equal(decision.risk, 'high');
  assert.equal(decision.action, 'allow');
  assert.equal(decision.would, 'restrict');
});

test('repeated sign-in failures wait instead of revealing whether the account exists', () => {
  const decision = evaluateIntegrity({
    entry: 'login',
    mode: 'protect',
    signals: { ...quiet, failedAttempts: 5 },
  });
  assert.equal(decision.action, 'delay');
  assert.equal(decision.reasons.includes('email-pattern'), false);
});

test('a disposable email by itself does not block registration', () => {
  assert.equal(isDisposableEmail('person@mailinator.com'), true);
  const decision = evaluateIntegrity({
    entry: 'registration',
    mode: 'protect',
    signals: { ...quiet, disposableEmail: true },
  });
  assert.equal(decision.risk, 'low');
  assert.equal(decision.action, 'allow');
});

test('a disposable email used again asks for confirmation', () => {
  const decision = evaluateIntegrity({
    entry: 'registration',
    mode: 'protect',
    signals: { ...quiet, disposableEmail: true, repeatedIdentity: true, recentAttempts: 3 },
  });
  assert.equal(decision.risk, 'medium');
  assert.equal(decision.action, 'challenge');
});

test('a passed confirmation continues, and two misses become a wait', () => {
  const decision = evaluateIntegrity({
    entry: 'survey',
    mode: 'protect',
    signals: { ...quiet, token: 'reused' },
  });
  assert.equal(actionAfterChallenge(decision, true, 0), 'allow');
  assert.equal(actionAfterChallenge(decision, false, 1), 'challenge');
  assert.equal(actionAfterChallenge(decision, false, 2), 'delay');
});

test('sporadic login checks sample every nth sign-in', () => {
  assert.equal(loginIsSampled(9, 10), false);
  assert.equal(loginIsSampled(10, 10), true);
  assert.equal(loginIsSampled(20, 10), true);
});

test('survey protection summary uses the survey check names', () => {
  assert.equal(surveyProtectionSummary([]), 'Not protected');
  assert.equal(surveyProtectionSummary(['link', 'start']), 'Survey start, Access links');
});

test('a missing recovery token is not treated as a bad link', () => {
  const decision = evaluateIntegrity({
    entry: 'recovery',
    mode: 'protect',
    signals: { ...quiet, token: 'missing' },
  });
  assert.equal(decision.risk, 'low');
  assert.equal(decision.action, 'allow');
});
