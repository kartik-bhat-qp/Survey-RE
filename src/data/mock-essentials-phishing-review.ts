import type { SurveyQuestion, SurveySection } from '@/data/mock-survey-detail';
import { getSurveyFooterBrand } from '@/lib/survey-suite-footer-brand';
import {
  getLegacySurveyEditorSectionsStorageKey,
  getSurveyEditorSectionsStorageKey,
} from '@/data/survey-editor-persistence';

export const ESSENTIALS_ACCOUNT_REVIEW_STORAGE_KEY = 'survey-re:essentials-account-under-review';
export const ESSENTIALS_ACCOUNT_REVIEW_CHANGED = 'essentials-account-under-review-changed';
export const ESSENTIALS_SURVEY_REVIEWING_CHANGED = 'essentials-survey-reviewing-changed';

export const ESSENTIALS_ACCOUNT_REVIEW_COPY =
  'Your account is under review. Someone will get back within 24 hours.';

export const ESSENTIALS_ACCOUNT_REVIEW_SUPPORT_LABEL = 'Click here to contact support';

export const ESSENTIALS_ACCOUNT_LOCKED_TOAST =
  'Your account is under review. You cannot create surveys or add questions right now.';

export const ESSENTIALS_SURVEY_REVIEWING_TOOLTIP = 'The survey is being reviewed';

/** Random delay between 2 and 5 seconds before the account-under-review message. */
export function getEssentialsAccountReviewDelayMs(): number {
  return 2000 + Math.floor(Math.random() * 3001);
}

type EssentialsReviewToast = (args: { message: string; variant: 'error' }) => void;

let essentialsSurveyReviewing = false;
let essentialsSurveyReviewTimer: ReturnType<typeof setTimeout> | null = null;

export function readEssentialsSurveyReviewing(): boolean {
  return essentialsSurveyReviewing;
}

function setEssentialsSurveyReviewing(reviewing: boolean): void {
  essentialsSurveyReviewing = reviewing;
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(ESSENTIALS_SURVEY_REVIEWING_CHANGED));
}

/**
 * Preview loader → delay → toast + account lock.
 * Returns true when the caller should stop its original action.
 */
export function runEssentialsPhishingReview(showToast: EssentialsReviewToast): boolean {
  if (getSurveyFooterBrand() !== 'essentials') return false;

  if (readEssentialsAccountUnderReview()) {
    showToast({ message: ESSENTIALS_ACCOUNT_REVIEW_COPY, variant: 'error' });
    return true;
  }

  if (essentialsSurveyReviewing) return true;

  setEssentialsSurveyReviewing(true);
  if (essentialsSurveyReviewTimer) {
    clearTimeout(essentialsSurveyReviewTimer);
  }
  essentialsSurveyReviewTimer = setTimeout(() => {
    essentialsSurveyReviewTimer = null;
    writeEssentialsAccountUnderReview(true);
    setEssentialsSurveyReviewing(false);
    showToast({ message: ESSENTIALS_ACCOUNT_REVIEW_COPY, variant: 'error' });
  }, getEssentialsAccountReviewDelayMs());

  return true;
}

/** Prototype: any Essentials media upload is treated as phishing content. */
export function essentialsMediaUploadShouldBeBlocked(): boolean {
  return getSurveyFooterBrand() === 'essentials';
}

export const ESSENTIALS_PHISHING_REVIEW_PHRASES: string[] = [
  'enter your social security number',
  'social security number',
  'social security',
  'social secuirty',
  'social secuiorty',
  'ssn',
  'enter your ssn',
  'credit card number',
  'debit card number',
  'enter your credit card',
  'card verification',
  'cvv',
  'cvv2',
  'bank account number',
  'routing number',
  'iban',
  'swift code',
  'enter your password',
  'account password',
  'login credentials',
  'one time password',
  'otp',
  'atm pin',
  'pin number',
  'mother s maiden name',
  'maiden name',
  'driver s license',
  'drivers license',
  'passport number',
  'verify your identity',
  'wire transfer',
  'bitcoin wallet',
  'crypto wallet',
];

/** Catches typos such as "social secuirty" / "social secuiorty". */
const ESSENTIALS_PHISHING_REVIEW_PATTERNS: RegExp[] = [
  /social\s+sec\w*/,
  /\bssn\b/,
  /credit\s+card\s+number/,
  /debit\s+card\s+number/,
  /enter\s+your\s+password/,
  /passport\s+number/,
  /routing\s+number/,
  /bank\s+account/,
];

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
      /* ignore unreadable editor state */
    }
  }

  return sections;
}

export function findEssentialsPhishingPhrases(
  sections: SurveySection[],
  extraText = ''
): string[] {
  const haystack = normalizeScanText(
    `${collectSurveyPublishText(sections)} ${extraText} ${collectLiveWorkspaceQuestionText()}`
  );
  const phrases = ESSENTIALS_PHISHING_REVIEW_PHRASES.filter((phrase) =>
    containsPhishingPhrase(haystack, phrase)
  );
  const patterns = ESSENTIALS_PHISHING_REVIEW_PATTERNS
    .filter((pattern) => pattern.test(haystack))
    .map((pattern) => pattern.source);
  return Array.from(new Set([...phrases, ...patterns]));
}

export function surveyHasEssentialsPhishingLanguage(
  sections: SurveySection[],
  extraText = ''
): boolean {
  return findEssentialsPhishingPhrases(sections, extraText).length > 0;
}

export function essentialsPublishShouldBeBlocked(
  sections: SurveySection[],
  surveyId?: number
): boolean {
  if (getSurveyFooterBrand() !== 'essentials') return false;
  if (readEssentialsAccountUnderReview()) return true;
  const persisted = surveyId == null ? [] : readPersistedSurveySectionsForReview(surveyId);
  return surveyHasEssentialsPhishingLanguage([...sections, ...persisted]);
}

export function readEssentialsAccountUnderReview(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(ESSENTIALS_ACCOUNT_REVIEW_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeEssentialsAccountUnderReview(underReview: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (underReview) {
      window.localStorage.setItem(ESSENTIALS_ACCOUNT_REVIEW_STORAGE_KEY, 'true');
    } else {
      window.localStorage.removeItem(ESSENTIALS_ACCOUNT_REVIEW_STORAGE_KEY);
    }
    window.dispatchEvent(new Event(ESSENTIALS_ACCOUNT_REVIEW_CHANGED));
  } catch {
    /* localStorage may be unavailable; ignore. */
  }
}

/** True when Essentials account is locked from creating surveys or adding questions. */
export function essentialsAccountActionsLocked(): boolean {
  return getSurveyFooterBrand() === 'essentials' && readEssentialsAccountUnderReview();
}
