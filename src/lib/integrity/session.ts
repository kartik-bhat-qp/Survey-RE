import {
  DEFAULT_THRESHOLDS,
  type IntegrityAction,
  type IntegrityEntry,
  type IntegrityMode,
  type IntegrityThresholds,
  type RiskLevel,
} from '@/lib/integrity/policy';

const MODE_KEY = 'survey-re:integrity-mode';
const THRESHOLD_KEY = 'survey-re:integrity-thresholds';
const LOG_KEY = 'survey-re:integrity-log';

export interface IntegrityLogEntry {
  at: string;
  entry: IntegrityEntry;
  risk: RiskLevel;
  action: IntegrityAction;
  policyVersion: string;
}

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

function counterKey(kind: 'visit' | 'fail' | 'identity', entry: IntegrityEntry, id = ''): string {
  return `survey-re:integrity:${kind}:${entry}:${id}`;
}

function digest(value: string): string {
  let hash = 2166136261;
  for (const char of value.trim().toLowerCase()) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function readCount(key: string): number {
  const raw = storage()?.getItem(key);
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function bump(key: string): number {
  const next = readCount(key) + 1;
  storage()?.setItem(key, String(next));
  return next;
}

export function readVisitCount(entry: IntegrityEntry): number {
  return readCount(counterKey('visit', entry));
}

export function recordVisit(entry: IntegrityEntry): number {
  return bump(counterKey('visit', entry));
}

export function readFailureCount(entry: IntegrityEntry): number {
  return readCount(counterKey('fail', entry));
}

export function recordFailure(entry: IntegrityEntry): number {
  return bump(counterKey('fail', entry));
}

export function readIdentityCount(entry: IntegrityEntry, email: string): number {
  if (!email.trim()) return 0;
  return readCount(counterKey('identity', entry, digest(email)));
}

export function recordIdentity(entry: IntegrityEntry, email: string): number {
  if (!email.trim()) return 0;
  return bump(counterKey('identity', entry, digest(email)));
}

export function readMode(): IntegrityMode {
  return storage()?.getItem(MODE_KEY) === 'observe' ? 'observe' : 'protect';
}

export function writeMode(mode: IntegrityMode): void {
  storage()?.setItem(MODE_KEY, mode);
}

export function readThresholds(): IntegrityThresholds {
  const raw = storage()?.getItem(THRESHOLD_KEY);
  if (!raw) return DEFAULT_THRESHOLDS;
  try {
    const parsed = JSON.parse(raw) as Partial<IntegrityThresholds>;
    const medium = Number(parsed.medium);
    const high = Number(parsed.high);
    if (!Number.isFinite(medium) || !Number.isFinite(high) || high <= medium) {
      return DEFAULT_THRESHOLDS;
    }
    return { medium, high };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

export function writeThresholds(thresholds: IntegrityThresholds): void {
  storage()?.setItem(THRESHOLD_KEY, JSON.stringify(thresholds));
}

export function readDecisionLog(): IntegrityLogEntry[] {
  const raw = storage()?.getItem(LOG_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as IntegrityLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendDecision(entry: IntegrityLogEntry): IntegrityLogEntry[] {
  const next = [entry, ...readDecisionLog()].slice(0, 20);
  storage()?.setItem(LOG_KEY, JSON.stringify(next));
  return next;
}
