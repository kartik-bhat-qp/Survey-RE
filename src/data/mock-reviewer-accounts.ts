import { findSurveyReviewerByEmail } from '@/data/mock-survey-approval';

const STORAGE_KEY = 'reviewer-registered-accounts';

export interface RegisteredReviewerAccount {
  email: string;
  name: string;
  createdAt: string;
}

function readRegisteredAccounts(): RegisteredReviewerAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`survey-re:${STORAGE_KEY}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RegisteredReviewerAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRegisteredAccounts(accounts: RegisteredReviewerAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`survey-re:${STORAGE_KEY}`, JSON.stringify(accounts));
  } catch {
    /* ignore */
  }
}

export function isExistingQuestionProUser(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  if (findSurveyReviewerByEmail(normalized)) return true;
  return readRegisteredAccounts().some((account) => account.email.toLowerCase() === normalized);
}

export function registerReviewerAccount(email: string, name: string): RegisteredReviewerAccount {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim() || normalizedEmail;
  const existing = readRegisteredAccounts();
  const found = existing.find((account) => account.email.toLowerCase() === normalizedEmail);
  if (found) return found;

  const account: RegisteredReviewerAccount = {
    email: normalizedEmail,
    name: trimmedName,
    createdAt: new Date().toISOString(),
  };
  writeRegisteredAccounts([account, ...existing]);
  return account;
}

export function getRegisteredReviewerName(email: string): string | undefined {
  const normalized = email.trim().toLowerCase();
  return readRegisteredAccounts().find((account) => account.email.toLowerCase() === normalized)
    ?.name;
}
