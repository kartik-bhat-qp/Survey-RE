export const INTEGRITY_POLICY_VERSION = 'integrity-2026.1';

export const INTEGRITY_ENTRIES = [
  'survey',
  'registration',
  'login',
  'recovery',
  'invitation',
] as const;

export type IntegrityEntry = (typeof INTEGRITY_ENTRIES)[number];

export type IntegrityMode = 'protect' | 'observe';

export type RiskLevel = 'low' | 'medium' | 'high';

export type IntegrityAction = 'allow' | 'challenge' | 'delay' | 'restrict';

export type LinkToken = 'valid' | 'reused' | 'missing';

export interface IntegrityThresholds {
  medium: number;
  high: number;
}

export interface IntegritySignals {
  recentAttempts: number;
  elapsedMs: number;
  token: LinkToken;
  failedAttempts: number;
  disposableEmail: boolean;
  repeatedIdentity: boolean;
}

export interface IntegrityDecision {
  policyVersion: string;
  entry: IntegrityEntry;
  mode: IntegrityMode;
  risk: RiskLevel;
  action: IntegrityAction;
  would: IntegrityAction;
  reasons: string[];
  retryAfterSeconds: number;
}

export const DEFAULT_THRESHOLDS: IntegrityThresholds = {
  medium: 2,
  high: 4,
};

const TOKEN_ENTRIES: IntegrityEntry[] = ['survey', 'invitation'];
const AUTH_ENTRIES: IntegrityEntry[] = ['login', 'recovery'];
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  '10minutemail.com',
]);

type SignalGroup = 'velocity' | 'behavior' | 'token' | 'auth' | 'identity';

interface Contribution {
  group: SignalGroup;
  points: number;
  reason: string;
}

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1] ?? '';
  return DISPOSABLE_DOMAINS.has(domain);
}

export function evaluateIntegrity(input: {
  entry: IntegrityEntry;
  mode: IntegrityMode;
  signals: IntegritySignals;
  thresholds?: IntegrityThresholds;
}): IntegrityDecision {
  const thresholds = input.thresholds ?? DEFAULT_THRESHOLDS;
  const contributions = collectContributions(input.entry, input.signals);
  const reasons = contributions.map((item) => item.reason);
  const groups = new Set(contributions.map((item) => item.group));
  let score = contributions.reduce((sum, item) => sum + item.points, 0);
  if (groups.size < 2) {
    score = Math.min(score, Math.max(0, thresholds.medium));
  }
  const risk = riskForScore(score, thresholds);
  const would = actionForRisk(input.entry, risk, input.signals);
  return {
    policyVersion: INTEGRITY_POLICY_VERSION,
    entry: input.entry,
    mode: input.mode,
    risk,
    action: input.mode === 'observe' ? 'allow' : would,
    would,
    reasons,
    retryAfterSeconds: would === 'allow' || would === 'challenge' ? 0 : 15,
  };
}

export function actionAfterChallenge(
  decision: IntegrityDecision,
  passed: boolean,
  misses: number,
): IntegrityAction {
  if (decision.action !== 'challenge') return decision.action;
  if (passed) return 'allow';
  if (misses >= 2) return 'delay';
  return 'challenge';
}

function collectContributions(
  entry: IntegrityEntry,
  signals: IntegritySignals,
): Contribution[] {
  const items: Contribution[] = [];
  if (signals.recentAttempts >= 8) {
    items.push({ group: 'velocity', points: 2, reason: 'repeated-visits' });
  } else if (signals.recentAttempts >= 3) {
    items.push({ group: 'velocity', points: 1, reason: 'repeated-visits' });
  }
  if (signals.elapsedMs < 800 && signals.recentAttempts >= 2) {
    items.push({ group: 'behavior', points: 1, reason: 'rapid-repeat' });
  }
  if (signals.token === 'reused') {
    items.push({ group: 'token', points: 2, reason: 'token-reused' });
  } else if (signals.token === 'missing' && TOKEN_ENTRIES.includes(entry)) {
    items.push({ group: 'token', points: 1, reason: 'token-missing' });
  }
  if (AUTH_ENTRIES.includes(entry) && signals.failedAttempts >= 5) {
    items.push({ group: 'auth', points: 2, reason: 'auth-failures' });
  } else if (AUTH_ENTRIES.includes(entry) && signals.failedAttempts >= 2) {
    items.push({ group: 'auth', points: 1, reason: 'auth-failures' });
  }
  let identityPoints = 0;
  if (signals.disposableEmail) identityPoints += 1;
  if (signals.repeatedIdentity) identityPoints += 1;
  if (identityPoints > 0) {
    items.push({
      group: 'identity',
      points: identityPoints,
      reason: signals.disposableEmail ? 'email-pattern' : 'repeated-identity',
    });
  }
  return items;
}

function riskForScore(score: number, thresholds: IntegrityThresholds): RiskLevel {
  if (score >= thresholds.high) return 'high';
  if (score >= thresholds.medium) return 'medium';
  return 'low';
}

function actionForRisk(
  entry: IntegrityEntry,
  risk: RiskLevel,
  signals: IntegritySignals,
): IntegrityAction {
  if (risk === 'low') return 'allow';
  if (risk === 'high') return 'restrict';
  if (AUTH_ENTRIES.includes(entry) && signals.failedAttempts >= 5) return 'delay';
  return 'challenge';
}
