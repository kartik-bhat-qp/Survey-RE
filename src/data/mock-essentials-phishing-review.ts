/**
 * Compatibility shim — phishing hold moved to mock-phishing-publish-hold.ts.
 * Account-level create/add-question locks are retired (PRD: building is never blocked).
 */
export {
  collectLiveWorkspaceQuestionText,
  collectSurveyPublishText,
  findPhishingPhrases as findEssentialsPhishingPhrases,
  PHISHING_REVIEW_PHRASES as ESSENTIALS_PHISHING_REVIEW_PHRASES,
  PHISHING_SCAN_TOOLTIP as ESSENTIALS_SURVEY_REVIEWING_TOOLTIP,
  PHISHING_HOLD_CHANGED as ESSENTIALS_ACCOUNT_REVIEW_CHANGED,
  PHISHING_SCAN_REVIEWING_CHANGED as ESSENTIALS_SURVEY_REVIEWING_CHANGED,
  readPersistedSurveySectionsForReview,
  readPhishingScanReviewing as readEssentialsSurveyReviewing,
  surveyHasPhishingLanguage as surveyHasEssentialsPhishingLanguage,
} from '@/data/mock-phishing-publish-hold';

import {
  isPublishSendPaused,
  isPhishingHoldFeatureEnabled,
  surveyHasPhishingLanguage,
  readPersistedSurveySectionsForReview,
} from '@/data/mock-phishing-publish-hold';
import type { SurveySection } from '@/data/mock-survey-detail';

/** @deprecated Account lock removed — always false. */
export const ESSENTIALS_ACCOUNT_REVIEW_STORAGE_KEY =
  'survey-re:essentials-account-under-review';

/** @deprecated Prefer PHISHING_ACCOUNT_REVIEW_COPY */
export const ESSENTIALS_ACCOUNT_REVIEW_COPY =
  'Your account is under review. You can keep editing, but publishing and sending are paused.';

/** @deprecated Prefer PHISHING_ACCOUNT_REVIEW_SUPPORT_LABEL */
export const ESSENTIALS_ACCOUNT_REVIEW_SUPPORT_LABEL = 'Contact support';

/** @deprecated Building is never blocked. */
export const ESSENTIALS_ACCOUNT_LOCKED_TOAST =
  'Your account is under review. You cannot create surveys or add questions right now.';

export function getEssentialsAccountReviewDelayMs(): number {
  return 2000 + Math.floor(Math.random() * 3001);
}

/** @deprecated No longer locks the account. */
export function runEssentialsPhishingReview(): boolean {
  return false;
}

/** Media uploads never lock the account (PRD). */
export function essentialsMediaUploadShouldBeBlocked(): boolean {
  return false;
}

/** Distribute is covered by AI Router — no scan trigger here (PRD). */
export function essentialsMessageShouldBeBlocked(_messageParts: string[]): boolean {
  return isPublishSendPaused();
}

export function essentialsPublishShouldBeBlocked(
  sections: SurveySection[],
  surveyId?: number
): boolean {
  if (!isPhishingHoldFeatureEnabled()) return false;
  if (isPublishSendPaused()) return true;
  const persisted = surveyId == null ? [] : readPersistedSurveySectionsForReview(surveyId);
  return surveyHasPhishingLanguage([...sections, ...persisted]);
}

/** @deprecated Use isPublishSendPaused from mock-phishing-publish-hold. */
export function readEssentialsAccountUnderReview(): boolean {
  return isPublishSendPaused();
}

/** @deprecated */
export function writeEssentialsAccountUnderReview(_underReview: boolean): void {
  /* no-op — use releaseHeldSurvey / clearHighPause / resetPhishingHoldState */
}

/** Building is never blocked. */
export function essentialsAccountActionsLocked(): boolean {
  return false;
}
