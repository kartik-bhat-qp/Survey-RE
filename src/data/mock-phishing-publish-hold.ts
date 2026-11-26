import type { SurveyQuestion, SurveySection } from '@/data/mock-survey-detail';
import {
  getSurveyFooterBrand,
  setSurveyFooterBrand,
} from '@/lib/survey-suite-footer-brand';
import {
  getLegacySurveyEditorSectionsStorageKey,
  getSurveyEditorSectionsStorageKey,
} from '@/data/survey-editor-persistence';

/** Publish-time phishing hold — Essentials / trial licences (footer brand gate for prototype). */

export const PHISHING_HOLD_STORAGE_KEY = 'survey-re:phishing-publish-hold-v2';
export const PHISHING_HOLD_CHANGED = 'phishing-publish-hold-changed';
export const PHISHING_SCAN_REVIEWING_CHANGED = 'phishing-scan-reviewing-changed';
export const PHISHING_FOCUS_QUESTION_EVENT = 'phishing-focus-question';

export const PHISHING_MAX_MEDIUM_ATTEMPTS = 2;

export const PHISHING_ACCOUNT_REVIEW_COPY =
  'Your account is under review. You can keep editing, but publishing and sending are paused.';
export const PHISHING_ACCOUNT_REVIEW_SUPPORT_LABEL = 'Contact support';
export const PHISHING_SEE_WHY_LABEL = 'See Why';
/** Solution 2 — approved customer communication script (Proposed Solution v4). */
export const PHISHING_SEE_WHY_TITLE = 'Why verification is needed';
export const PHISHING_SEE_WHY_BODY =
  'As part of our commitment to keeping QuestionPro a safe and trusted platform, we verify new accounts before enabling distribution features. This protects you and your respondents from spam and phishing.';
/** Solution 1 — approved agent phrasing for build vs share. */
export const PHISHING_SEE_WHY_CONTINUE =
  'You can continue building your survey without any issue. However, to share or send it to respondents, we will need to complete a quick phone verification first.';
export const PHISHING_SEE_WHY_NEXT_STEPS =
  'Schedule a call with support, or chat now — no separate ticket needed.';
export const PHISHING_SEE_WHY_BOOK_LABEL = 'Schedule a call';
export const PHISHING_SEE_WHY_CHAT_LABEL = 'Chat';
/** @deprecated Empty-state copy retired; See Why always uses the approved script. */
export const PHISHING_SEE_WHY_EMPTY = PHISHING_SEE_WHY_BODY;

/** @deprecated Prefer PHISHING_ACCOUNT_REVIEW_COPY */
export const PHISHING_HIGH_BANNER_COPY = PHISHING_ACCOUNT_REVIEW_COPY;
/** @deprecated Prefer PHISHING_ACCOUNT_REVIEW_SUPPORT_LABEL */
export const PHISHING_HIGH_BANNER_CTA = PHISHING_ACCOUNT_REVIEW_SUPPORT_LABEL;

export const PHISHING_VERIFICATION_TURNAROUND =
  "We'll email you when it's cleared. Most checks finish within 2 hours.";

/** Account-level outreach window shown on the Schedule step (no reschedule UI). */
export const PHISHING_AGENT_OUTREACH_WINDOW =
  'Today, 2:00 PM – 4:00 PM IST';
export const PHISHING_AGENT_OUTREACH_COPY =
  'A support agent will reach out to you in this window to complete verification. You can keep editing in the meantime.';

export const PHISHING_SUSPENDED_TITLE = 'Your account has been suspended';
export const PHISHING_SUSPENDED_BODY =
  'It was found to break our Acceptable Use Policy. Your surveys are offline.';

export const PHISHING_UNAVAILABLE_TITLE = "This survey isn't available";
export const PHISHING_UNAVAILABLE_BODY =
  'Contact the person who sent you this link.';

export const PHISHING_SCAN_TOOLTIP = 'Checking your survey…';

export type PhishingRiskTier = 'low' | 'medium' | 'high';
export type PhishingHoldStatus =
  | 'none'
  | 'held'
  | 'verifying'
  | 'released'
  | 'suspended';

export type VerificationChannelStatus = 'Verified' | 'Unverified' | 'Blocked';

export type VerificationTrackerStep =
  | 'flagged'
  | 'call-booked'
  | 'agent-review'
  | 'live';

export interface HeldSurveyCase {
  surveyId: number;
  surveyName: string;
  riskTier: PhishingRiskTier;
  holdStatus: PhishingHoldStatus;
  heldAttempts: number;
  flaggedQuestionId: string | null;
  flaggedQuestionLabel: string;
  caseId: string;
  createdAt: string;
  callBookedAt: string | null;
  callSlotLabel: string | null;
  trackerStep: VerificationTrackerStep;
}

export type PhishingFlagCategory =
  | 'Government ID'
  | 'Payment card'
  | 'Bank details'
  | 'Password or OTP'
  | 'Identity security question'
  | 'Crypto or wire transfer'
  | 'Uploaded media';

/** Calm, SecOps-safe reason copy — never includes matched phrases. */
export const PHISHING_FLAG_REASON_BY_CATEGORY: Record<PhishingFlagCategory, string> = {
  'Government ID':
    'Asks for a government ID number (for example SSN, passport, or driver’s license).',
  'Payment card':
    'Asks for payment card details (card number, CVV, or similar).',
  'Bank details':
    'Asks for bank account, routing, IBAN, or similar banking details.',
  'Password or OTP':
    'Asks for a password, PIN, OTP, or other login credentials.',
  'Identity security question':
    'Asks for identity security answers that can be used to impersonate someone.',
  'Crypto or wire transfer':
    'Asks for crypto wallet or wire-transfer payment details.',
  'Uploaded media':
    'Uploaded media needs a security check before it can be shared with respondents.',
};

export function phishingFlagReason(category: PhishingFlagCategory): string {
  return PHISHING_FLAG_REASON_BY_CATEGORY[category];
}

export interface PhishingFlagMatch {
  location: string;
  questionId: string | null;
  optionIndex: number | null;
  category: PhishingFlagCategory;
}

export interface PhishingAccountState {
  publishSendPaused: boolean;
  suspended: boolean;
  reviewRequestCaseId: string | null;
  flaggedMatches: PhishingFlagMatch[];
  flaggedSurveyId: number | null;
}

export interface CxpertsVerificationState {
  emailStatus: VerificationChannelStatus;
  phoneStatus: VerificationChannelStatus;
  abuseCount: number;
  lastNote: string;
}

export interface PhishingPublishHoldState {
  account: PhishingAccountState;
  cases: HeldSurveyCase[];
  verification: CxpertsVerificationState;
}

const DEFAULT_STATE: PhishingPublishHoldState = {
  account: {
    publishSendPaused: false,
    suspended: false,
    reviewRequestCaseId: null,
    flaggedMatches: [],
    flaggedSurveyId: null,
  },
  cases: [],
  verification: {
    emailStatus: 'Verified',
    phoneStatus: 'Verified',
    abuseCount: 0,
    lastNote: '',
  },
};

let scanReviewing = false;
let scanReviewTimer: ReturnType<typeof setTimeout> | null = null;

export function getPhishingScanDelayMs(): number {
  return 2000 + Math.floor(Math.random() * 3001);
}

export function readPhishingScanReviewing(): boolean {
  return scanReviewing;
}

function setPhishingScanReviewing(reviewing: boolean): void {
  scanReviewing = reviewing;
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(PHISHING_SCAN_REVIEWING_CHANGED));
}

export function isPhishingHoldFeatureEnabled(): boolean {
  return getSurveyFooterBrand() === 'essentials';
}

export function readPhishingHoldState(): PhishingPublishHoldState {
  if (typeof window === 'undefined') return structuredClone(DEFAULT_STATE);
  try {
    const raw = window.localStorage.getItem(PHISHING_HOLD_STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw) as Partial<PhishingPublishHoldState>;
    return {
      account: {
        ...DEFAULT_STATE.account,
        ...parsed.account,
        flaggedMatches: Array.isArray(parsed.account?.flaggedMatches)
          ? parsed.account.flaggedMatches
          : [],
        flaggedSurveyId:
          typeof parsed.account?.flaggedSurveyId === 'number'
            ? parsed.account.flaggedSurveyId
            : null,
      },
      cases: Array.isArray(parsed.cases) ? parsed.cases : [],
      verification: { ...DEFAULT_STATE.verification, ...parsed.verification },
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

export function getFlaggedMatches(): PhishingFlagMatch[] {
  return readPhishingHoldState().account.flaggedMatches;
}

export function getFlaggedSurveyId(): number | null {
  return readPhishingHoldState().account.flaggedSurveyId;
}

export function writePhishingHoldState(next: PhishingPublishHoldState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PHISHING_HOLD_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(PHISHING_HOLD_CHANGED));
  } catch {
    /* ignore */
  }
}

export function resetPhishingHoldState(): void {
  writePhishingHoldState(structuredClone(DEFAULT_STATE));
  // Clear legacy account-lock key from earlier prototype
  try {
    window.localStorage.removeItem('survey-re:essentials-account-under-review');
  } catch {
    /* ignore */
  }
}

export function patchPhishingHoldState(
  patch: (prev: PhishingPublishHoldState) => PhishingPublishHoldState
): PhishingPublishHoldState {
  const next = patch(readPhishingHoldState());
  writePhishingHoldState(next);
  return next;
}

export function getHeldCase(surveyId: number): HeldSurveyCase | undefined {
  return readPhishingHoldState().cases.find(
    (c) => c.surveyId === surveyId && (c.holdStatus === 'held' || c.holdStatus === 'verifying')
  );
}

export function isSurveyOnHold(surveyId: number): boolean {
  const c = getHeldCase(surveyId);
  return Boolean(c);
}

export function isPublishSendPaused(): boolean {
  if (!isPhishingHoldFeatureEnabled()) return false;
  return readPhishingHoldState().account.publishSendPaused;
}

export function isAccountSuspended(): boolean {
  return readPhishingHoldState().account.suspended;
}

export function listActiveHoldCases(): HeldSurveyCase[] {
  return readPhishingHoldState().cases.filter(
    (c) => c.holdStatus === 'held' || c.holdStatus === 'verifying'
  );
}

export function listAllHoldCases(): HeldSurveyCase[] {
  return readPhishingHoldState().cases;
}

function nextCaseId(): string {
  return `PH-${Date.now().toString(36).toUpperCase()}`;
}

/** Human-readable reason without exposing matched keywords. */
export function describeFlaggedQuestion(
  sections: SurveySection[],
  surveyId?: number
): { questionId: string | null; label: string } {
  const matches = collectStructuredPhishingMatches(sections, surveyId);
  const first = matches[0];
  if (!first) {
    return {
      questionId: null,
      label: 'A question asks for sensitive personal information',
    };
  }
  return {
    questionId: first.questionId,
    label: `${first.location} · ${first.category}`,
  };
}

export type PublishScanResult =
  | { tier: 'low' }
  | {
      tier: 'medium' | 'high';
      caseRecord: HeldSurveyCase;
    };

/**
 * Score publish content. Does not write state — caller applies via applyPublishScanResult
 * after the scan delay, or immediately when already paused.
 */
export function scorePublishRisk(
  sections: SurveySection[],
  surveyId: number,
  surveyName: string
): PublishScanResult {
  if (!isPhishingHoldFeatureEnabled()) return { tier: 'low' };

  const state = readPhishingHoldState();
  if (state.account.publishSendPaused || state.account.suspended) {
    const existing = state.cases.find((c) => c.surveyId === surveyId);
    if (existing) {
      return { tier: 'high', caseRecord: { ...existing, riskTier: 'high' } };
    }
    const flagged = describeFlaggedQuestion(sections, surveyId);
    const caseRecord: HeldSurveyCase = {
      surveyId,
      surveyName,
      riskTier: 'high',
      holdStatus: 'held',
      heldAttempts: PHISHING_MAX_MEDIUM_ATTEMPTS,
      flaggedQuestionId: flagged.questionId,
      flaggedQuestionLabel: flagged.label,
      caseId: nextCaseId(),
      createdAt: new Date().toISOString(),
      callBookedAt: null,
      callSlotLabel: null,
      trackerStep: 'flagged',
    };
    return { tier: 'high', caseRecord };
  }

  const persisted = readPersistedSurveySectionsForReview(surveyId);
  const hasRisk = surveyHasPhishingLanguage([...sections, ...persisted]);
  if (!hasRisk) return { tier: 'low' };

  const existing = state.cases.find((c) => c.surveyId === surveyId);
  const priorAttempts = existing?.heldAttempts ?? 0;
  const nextAttempts = priorAttempts + 1;
  const escalate = nextAttempts > PHISHING_MAX_MEDIUM_ATTEMPTS;
  const flagged = describeFlaggedQuestion(sections, surveyId);
  const tier: PhishingRiskTier = escalate ? 'high' : 'medium';

  const caseRecord: HeldSurveyCase = {
    surveyId,
    surveyName,
    riskTier: tier,
    holdStatus: 'held',
    heldAttempts: escalate ? nextAttempts : Math.min(nextAttempts, PHISHING_MAX_MEDIUM_ATTEMPTS),
    flaggedQuestionId: flagged.questionId,
    flaggedQuestionLabel: flagged.label,
    caseId: existing?.caseId ?? nextCaseId(),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    callBookedAt: existing?.callBookedAt ?? null,
    callSlotLabel: existing?.callSlotLabel ?? null,
    trackerStep: existing?.trackerStep ?? 'flagged',
  };

  return { tier, caseRecord };
}

export function applyPublishScanResult(
  result: PublishScanResult,
  matches: PhishingFlagMatch[] = []
): void {
  if (result.tier === 'low') return;

  patchPhishingHoldState((prev) => {
    const others = prev.cases.filter((c) => c.surveyId !== result.caseRecord.surveyId);
    const cases = [...others, result.caseRecord];
    const nextMatches =
      matches.length > 0 ? matches : prev.account.flaggedMatches;
    const verification: CxpertsVerificationState =
      result.tier === 'high'
        ? {
            ...prev.verification,
            phoneStatus: 'Blocked',
            lastNote: `Phishing hold case ${result.caseRecord.caseId} (High)`,
          }
        : prev.verification;

    return {
      ...prev,
      cases,
      account: {
        ...prev.account,
        publishSendPaused: true,
        flaggedMatches: nextMatches,
        flaggedSurveyId: result.caseRecord.surveyId,
      },
      verification,
    };
  });
}

/**
 * Runs the publish-time scan with delay. Calls onComplete with the result.
 * Returns true when the caller should abort the normal publish path.
 */
export function runPublishRiskScan(args: {
  sections: SurveySection[];
  surveyId: number;
  surveyName: string;
  onComplete: (result: PublishScanResult) => void;
}): boolean {
  if (!isPhishingHoldFeatureEnabled()) return false;

  const scored = scorePublishRisk(args.sections, args.surveyId, args.surveyName);
  if (scored.tier === 'low') return false;

  if (scanReviewing) return true;

  const matches = collectStructuredPhishingMatches(args.sections, args.surveyId);

  setPhishingScanReviewing(true);
  if (scanReviewTimer) clearTimeout(scanReviewTimer);
  scanReviewTimer = setTimeout(() => {
    scanReviewTimer = null;
    applyPublishScanResult(scored, matches);
    setPhishingScanReviewing(false);
    args.onComplete(scored);
  }, getPhishingScanDelayMs());

  return true;
}

/**
 * One account-level verification call covers every held survey — do not book per case.
 */
export function bookVerificationCall(
  _surveyId?: number,
  slotLabel = 'Wed 18 Nov, 3:30 PM IST · 10 min call'
): void {
  const bookedAt = new Date().toISOString();
  patchPhishingHoldState((prev) => ({
    ...prev,
    cases: prev.cases.map((c) =>
      c.holdStatus === 'held' || c.holdStatus === 'verifying'
        ? {
            ...c,
            holdStatus: 'verifying' as const,
            callBookedAt: bookedAt,
            callSlotLabel: slotLabel,
            trackerStep: 'agent-review' as const,
          }
        : c
    ),
  }));
}

export function getAccountVerificationCallSlot(): string | null {
  const active = listActiveHoldCases();
  return active.find((c) => c.callSlotLabel)?.callSlotLabel ?? null;
}

export function markCaseVerifying(surveyId: number): void {
  patchPhishingHoldState((prev) => ({
    ...prev,
    cases: prev.cases.map((c) =>
      c.surveyId === surveyId && c.holdStatus === 'held'
        ? { ...c, holdStatus: 'verifying', trackerStep: 'call-booked' }
        : c
    ),
  }));
}

/** SecOps: release survey as genuine — auto-publish path for author. */
export function releaseHeldSurvey(surveyId: number): void {
  patchPhishingHoldState((prev) => {
    const cases = prev.cases.map((c) =>
      c.surveyId === surveyId
        ? { ...c, holdStatus: 'released' as const, riskTier: 'low' as const, trackerStep: 'live' as const }
        : c
    );
    const stillHigh = cases.some(
      (c) =>
        (c.holdStatus === 'held' || c.holdStatus === 'verifying') && c.riskTier === 'high'
    );
    return {
      ...prev,
      cases,
      account: {
        ...prev.account,
        publishSendPaused: stillHigh ? prev.account.publishSendPaused : false,
        flaggedMatches: stillHigh ? prev.account.flaggedMatches : [],
        flaggedSurveyId: stillHigh ? prev.account.flaggedSurveyId : null,
      },
      verification: {
        ...prev.verification,
        phoneStatus: stillHigh ? prev.verification.phoneStatus : 'Verified',
        emailStatus: prev.verification.emailStatus === 'Blocked' && !prev.account.suspended
          ? 'Verified'
          : prev.verification.emailStatus,
        lastNote: `Released survey ${surveyId}`,
      },
    };
  });
}

export function escalateCaseToHigh(surveyId: number): void {
  patchPhishingHoldState((prev) => ({
    ...prev,
    account: { ...prev.account, publishSendPaused: true },
    verification: {
      ...prev.verification,
      phoneStatus: 'Blocked',
      lastNote: `Escalated survey ${surveyId} to High`,
    },
    cases: prev.cases.map((c) =>
      c.surveyId === surveyId
        ? {
            ...c,
            riskTier: 'high',
            holdStatus: c.holdStatus === 'released' ? 'held' : c.holdStatus,
            heldAttempts: Math.max(c.heldAttempts, PHISHING_MAX_MEDIUM_ATTEMPTS + 1),
          }
        : c
    ),
  }));
}

export function suspendAccount(): void {
  patchPhishingHoldState((prev) => ({
    ...prev,
    account: {
      ...prev.account,
      publishSendPaused: true,
      suspended: true,
    },
    verification: {
      emailStatus: 'Blocked',
      phoneStatus: 'Blocked',
      abuseCount: prev.verification.abuseCount + 1,
      lastNote: 'Account suspended — Acceptable Use Policy',
    },
    cases: prev.cases.map((c) =>
      c.holdStatus === 'held' || c.holdStatus === 'verifying'
        ? { ...c, holdStatus: 'suspended', riskTier: 'high' }
        : c
    ),
  }));
}

export function requestSuspensionReview(): string {
  const caseId = nextCaseId();
  patchPhishingHoldState((prev) => ({
    ...prev,
    account: { ...prev.account, reviewRequestCaseId: caseId },
  }));
  return caseId;
}

export function setVerificationChannelStatus(
  channel: 'email' | 'phone',
  status: VerificationChannelStatus,
  note = ''
): void {
  patchPhishingHoldState((prev) => {
    const wasBlocked =
      channel === 'email'
        ? prev.verification.emailStatus === 'Blocked'
        : prev.verification.phoneStatus === 'Blocked';
    const verification: CxpertsVerificationState = {
      ...prev.verification,
      emailStatus: channel === 'email' ? status : prev.verification.emailStatus,
      phoneStatus: channel === 'phone' ? status : prev.verification.phoneStatus,
      lastNote: note || prev.verification.lastNote,
      abuseCount:
        status === 'Blocked' && !wasBlocked
          ? prev.verification.abuseCount + 1
          : prev.verification.abuseCount,
    };

    let account = { ...prev.account };
    if (status === 'Blocked') {
      account = { ...account, publishSendPaused: true };
      if (channel === 'email' && note.toLowerCase().includes('suspend')) {
        account.suspended = true;
      }
    }

    let cases = prev.cases;
    if (
      status === 'Verified' &&
      verification.emailStatus === 'Verified' &&
      verification.phoneStatus === 'Verified'
    ) {
      account = {
        ...account,
        publishSendPaused: false,
        suspended: false,
        flaggedMatches: [],
        flaggedSurveyId: null,
      };
      cases = prev.cases.map((c) =>
        c.holdStatus === 'held' || c.holdStatus === 'verifying' || c.holdStatus === 'suspended'
          ? { ...c, holdStatus: 'released' as const, riskTier: 'low' as const, trackerStep: 'live' as const }
          : c
      );
    }

    return { ...prev, verification, account, cases };
  });
}

/**
 * Prototype-only helper: force Essentials brand, run the reviewing delay, then
 * apply a High pause + held case so the banner / See Why / verification path
 * can be walked without publishing a survey.
 */
export function simulateAiPhishingCheck(args?: {
  surveyId?: number;
  surveyName?: string;
}): void {
  const surveyId = args?.surveyId ?? 20;
  const surveyName = args?.surveyName ?? 'Flex logic';

  setSurveyFooterBrand('essentials');
  setPhishingScanReviewing(true);

  if (scanReviewTimer) clearTimeout(scanReviewTimer);
  scanReviewTimer = setTimeout(() => {
    scanReviewTimer = null;

    /** Edit-section questions only — distribute/media are out of scope for this scan. */
    const matches: PhishingFlagMatch[] = [
      {
        location: 'Q1',
        questionId: 'q-sim-gov-id',
        optionIndex: null,
        category: 'Government ID',
      },
      {
        location: 'Q2, option 1',
        questionId: 'q-sim-payment',
        optionIndex: 0,
        category: 'Payment card',
      },
    ];

    const caseRecord: HeldSurveyCase = {
      surveyId,
      surveyName,
      riskTier: 'high',
      holdStatus: 'held',
      heldAttempts: PHISHING_MAX_MEDIUM_ATTEMPTS + 1,
      flaggedQuestionId: matches[0]?.questionId ?? null,
      flaggedQuestionLabel: matches[0]
        ? `${matches[0].location} · ${matches[0].category}`
        : 'A question asks for sensitive personal information',
      caseId: nextCaseId(),
      createdAt: new Date().toISOString(),
      callBookedAt: null,
      callSlotLabel: null,
      trackerStep: 'flagged',
    };

    applyPublishScanResult({ tier: 'high', caseRecord }, matches);
    setPhishingScanReviewing(false);
  }, getPhishingScanDelayMs());
}

export function clearHighPause(): void {
  patchPhishingHoldState((prev) => ({
    ...prev,
    account: {
      ...prev.account,
      publishSendPaused: false,
      flaggedMatches: [],
      flaggedSurveyId: null,
    },
    verification: {
      ...prev.verification,
      phoneStatus:
        prev.verification.phoneStatus === 'Blocked'
          ? 'Verified'
          : prev.verification.phoneStatus,
    },
  }));
}

/* ─── Phrase scanner (keyword + fuzzy matcher) ─────────────────────────── */

type PhraseCategoryRule = {
  category: PhishingFlagCategory;
  phrases: string[];
  patterns?: RegExp[];
};

const PHISHING_CATEGORY_RULES: PhraseCategoryRule[] = [
  {
    category: 'Government ID',
    phrases: [
      'enter your social security number',
      'social security number',
      'social security',
      'social secuirty',
      'social secuiorty',
      'ssn',
      'enter your ssn',
      'driver s license',
      'drivers license',
      'passport number',
      'government id',
      'government id number',
    ],
    patterns: [/social\s+sec\w*/, /\bssn\b/, /passport\s+number/, /government\s+id/],
  },
  {
    category: 'Payment card',
    phrases: [
      'credit card number',
      'debit card number',
      'enter your credit card',
      'card verification',
      'cvv',
      'cvv2',
    ],
    patterns: [/credit\s+card\s+number/, /debit\s+card\s+number/],
  },
  {
    category: 'Bank details',
    phrases: ['bank account number', 'routing number', 'iban', 'swift code'],
    patterns: [/routing\s+number/, /bank\s+account/],
  },
  {
    category: 'Password or OTP',
    phrases: [
      'enter your password',
      'account password',
      'login credentials',
      'one time password',
      'otp',
      'atm pin',
      'pin number',
    ],
    patterns: [/enter\s+your\s+password/],
  },
  {
    category: 'Identity security question',
    phrases: ['mother s maiden name', 'maiden name', 'verify your identity'],
  },
  {
    category: 'Crypto or wire transfer',
    phrases: ['wire transfer', 'bitcoin wallet', 'crypto wallet'],
  },
];

export const PHISHING_REVIEW_PHRASES: string[] = PHISHING_CATEGORY_RULES.flatMap(
  (rule) => rule.phrases
);

const PHISHING_REVIEW_PATTERNS: RegExp[] = PHISHING_CATEGORY_RULES.flatMap(
  (rule) => rule.patterns ?? []
);

function categoryForHaystack(haystack: string): PhishingFlagCategory | null {
  for (const rule of PHISHING_CATEGORY_RULES) {
    if (rule.phrases.some((phrase) => containsPhishingPhrase(haystack, phrase))) {
      return rule.category;
    }
    if (rule.patterns?.some((pattern) => pattern.test(haystack))) {
      return rule.category;
    }
  }
  return null;
}

function questionDisplayNumber(question: SurveyQuestion, ordinal: number): string {
  const code = (question.code || '').trim();
  if (/^q\d+/i.test(code)) return code.toUpperCase().replace(/\s+/g, '');
  const digits = code.match(/\d+/);
  if (digits) return `Q${digits[0]}`;
  return `Q${ordinal}`;
}

/**
 * Structured matches for the Why modal. Never includes matched phrases or raw text.
 */
export function collectStructuredPhishingMatches(
  sections: SurveySection[],
  surveyId?: number
): PhishingFlagMatch[] {
  const persisted = surveyId == null ? [] : readPersistedSurveySectionsForReview(surveyId);
  const all = [...sections, ...persisted];
  const matches: PhishingFlagMatch[] = [];
  const seen = new Set<string>();
  let ordinal = 0;

  for (const section of all) {
    for (const question of section.questions) {
      ordinal += 1;
      const qLabel = questionDisplayNumber(question, ordinal);

      const questionHaystack = normalizeScanText(
        [question.text, question.code].filter(Boolean).join(' ')
      );
      const questionCategory = categoryForHaystack(questionHaystack);
      if (questionCategory) {
        const key = `${question.id}:q:${questionCategory}`;
        if (!seen.has(key)) {
          seen.add(key);
          matches.push({
            location: qLabel,
            questionId: question.id,
            optionIndex: null,
            category: questionCategory,
          });
        }
      }

      question.options.forEach((option, optionIndex) => {
        const optionCategory = categoryForHaystack(normalizeScanText(option.label));
        if (!optionCategory) return;
        const key = `${question.id}:opt:${optionIndex}:${optionCategory}`;
        if (seen.has(key)) return;
        seen.add(key);
        matches.push({
          location: `${qLabel}, option ${optionIndex + 1}`,
          questionId: question.id,
          optionIndex,
          category: optionCategory,
        });
      });

      // Other rich fields (matrix/nps/etc.) count as the question location, not options.
      const restHaystack = normalizeScanText(
        collectQuestionText(question)
          .filter((part) => part !== question.text && part !== question.code)
          .filter((part) => !question.options.some((option) => option.label === part))
          .join(' ')
      );
      const restCategory = categoryForHaystack(restHaystack);
      if (restCategory) {
        const key = `${question.id}:rest:${restCategory}`;
        if (!seen.has(key)) {
          seen.add(key);
          matches.push({
            location: qLabel,
            questionId: question.id,
            optionIndex: null,
            category: restCategory,
          });
        }
      }
    }
  }

  return matches;
}

/** Build matches for distribute message parts (subject / body / SMS). */
export function collectStructuredMessageMatches(parts: {
  subject?: string;
  body?: string;
  sms?: string;
}): PhishingFlagMatch[] {
  const matches: PhishingFlagMatch[] = [];
  const entries: Array<{ location: string; text: string }> = [
    { location: 'Email subject', text: parts.subject ?? '' },
    { location: 'Email invite', text: parts.body ?? '' },
    { location: 'SMS message', text: parts.sms ?? '' },
  ];
  for (const entry of entries) {
    const category = categoryForHaystack(normalizeScanText(entry.text));
    if (!category) continue;
    matches.push({
      location: entry.location,
      questionId: null,
      optionIndex: null,
      category,
    });
  }
  return matches;
}

export function mediaUploadFlagMatch(): PhishingFlagMatch {
  return {
    location: 'Media upload',
    questionId: null,
    optionIndex: null,
    category: 'Uploaded media',
  };
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ');
}

function normalizeScanText(value: string): string {
  return stripHtml(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsPhishingPhrase(haystack: string, phrase: string): boolean {
  if (!phrase) return false;
  if (phrase.includes(' ')) return haystack.includes(phrase);
  return new RegExp(`(?:^| )${phrase}(?: |$)`).test(haystack);
}

function collectQuestionText(question: SurveyQuestion): string[] {
  const parts: string[] = [question.text, question.code];

  for (const option of question.options) {
    parts.push(option.label);
  }

  if (question.matrix) {
    parts.push(question.matrix.leftAnchor, question.matrix.rightAnchor);
    for (const column of question.matrix.columns) {
      parts.push(column.label, ...(column.options ?? []));
    }
    for (const row of question.matrix.rows) {
      parts.push(row.label);
    }
  }

  if (question.nps) {
    parts.push(question.nps.minLabel, question.nps.maxLabel);
  }

  if (question.vanWestendorp) {
    parts.push(question.vanWestendorp.priceLabel);
    for (const row of question.vanWestendorp.rows) {
      parts.push(row.prompt);
    }
  }

  if (question.conjoint) {
    for (const feature of question.conjoint.features) {
      parts.push(feature.name);
      for (const level of feature.levels) {
        parts.push(level.label);
      }
    }
  }

  if (question.thumbsUpDown) {
    for (const choice of question.thumbsUpDown.choices) {
      parts.push(choice.label);
    }
  }

  const study = question.listenAiConfig?.study;
  if (study) {
    parts.push(
      study.title,
      study.description,
      study.introduction,
      study.audienceNotes,
      study.thankYouNote,
      ...(study.objectives ?? []),
      ...(study.moderatorInstructions ?? [])
    );
    for (const guideQuestion of study.discussionGuide) {
      parts.push(guideQuestion.text, guideQuestion.followUpInstructions);
    }
  }

  return parts;
}

export function collectSurveyPublishText(sections: SurveySection[]): string {
  const parts: string[] = [];
  for (const section of sections) {
    parts.push(section.title);
    for (const question of section.questions) {
      parts.push(...collectQuestionText(question));
    }
  }
  return normalizeScanText(parts.filter(Boolean).join(' '));
}

export function collectLiveWorkspaceQuestionText(): string {
  if (typeof document === 'undefined') return '';
  const nodes = document.querySelectorAll(
    '[aria-label="Question text"], [aria-label="Answer option"], [role="textbox"]'
  );
  return Array.from(nodes)
    .map((node) => node.textContent ?? '')
    .join(' ');
}

export function readPersistedSurveySectionsForReview(surveyId: number): SurveySection[] {
  if (typeof window === 'undefined') return [];
  const prefixes = [
    `survey-re:${getSurveyEditorSectionsStorageKey(surveyId)}`,
    `survey-re:${getLegacySurveyEditorSectionsStorageKey(surveyId)}`,
  ];
  const sections: SurveySection[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !prefixes.some((prefix) => key === prefix || key.startsWith(`${prefix}:`))) {
      continue;
    }
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? '') as SurveySection[];
      if (!Array.isArray(parsed)) continue;
      for (const section of parsed) {
        if (!section?.id || seen.has(section.id)) continue;
        seen.add(section.id);
        sections.push(section);
      }
    } catch {
      /* ignore */
    }
  }

  return sections;
}

function findPhishingPhrasesInText(text: string): string[] {
  const haystack = normalizeScanText(text);
  const phrases = PHISHING_REVIEW_PHRASES.filter((phrase) =>
    containsPhishingPhrase(haystack, phrase)
  );
  const patterns = PHISHING_REVIEW_PATTERNS.filter((pattern) => pattern.test(haystack)).map(
    (pattern) => pattern.source
  );
  return Array.from(new Set([...phrases, ...patterns]));
}

export function findPhishingPhrases(sections: SurveySection[], extraText = ''): string[] {
  return findPhishingPhrasesInText(
    `${collectSurveyPublishText(sections)} ${extraText} ${collectLiveWorkspaceQuestionText()}`
  );
}

export function surveyHasPhishingLanguage(
  sections: SurveySection[],
  extraText = ''
): boolean {
  return findPhishingPhrases(sections, extraText).length > 0;
}

/** True when shareable / respondent link should show unavailable. */
export function surveyLinkUnavailable(surveyId: number): boolean {
  const state = readPhishingHoldState();
  if (state.account.suspended) return true;
  const c = state.cases.find((item) => item.surveyId === surveyId);
  if (!c) return false;
  return (
    c.holdStatus === 'held' ||
    c.holdStatus === 'verifying' ||
    c.holdStatus === 'suspended'
  );
}
