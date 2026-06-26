import type {
  SurveyMatrix,
  SurveyQuestionInputKind,
  SurveyQuestionKind,
} from '@/data/mock-survey-detail';
import {
  DEFAULT_MULTI_POINT_SETTINGS,
  type MultiPointScalesSettings,
} from '@/data/mock-multi-point-settings';
import {
  normalizeAnswerDisplayOrder,
  normalizeRandomizeAnswerCount,
  type AnswerDisplayOrder,
  type QuestionSettings,
  type RandomizeAnswerCount,
} from '@/data/mock-question-settings';
import type { CaptchaSettings } from '@/data/mock-captcha-settings';
import { DEFAULT_CAPTCHA_SETTINGS } from '@/data/mock-captcha-settings';
import type { ShowHideOptionsPreviewConfig } from '@/data/show-hide-options-preview';

export interface SurveyQuestionPreviewFollowUp {
  code: string;
  text: string;
  required?: boolean;
  kind: SurveyQuestionKind;
  inputKind: SurveyQuestionInputKind;
  options: { id: string; label: string }[];
  matrix?: SurveyMatrix;
  answerDisplayOrder?: AnswerDisplayOrder;
  randomizeAnswerCount?: RandomizeAnswerCount;
  /** When answer display order is alternate-flip, whether this preview uses reversed order. */
  alternateFlipReversed?: boolean;
  showHideOptions?: ShowHideOptionsPreviewConfig | null;
}

export interface SurveyQuestionPreviewPagination {
  samePageFollowUps?: SurveyQuestionPreviewFollowUp[];
  nextPages?: SurveyQuestionPreviewFollowUp[][];
}

export interface MultiPointQuestionPreviewSession {
  surveyId: number;
  surveyTitle: string;
  questionText: string;
  required?: boolean;
  matrix: SurveyMatrix;
  settings: MultiPointScalesSettings;
  samePageFollowUps?: SurveyQuestionPreviewFollowUp[];
  nextPages?: SurveyQuestionPreviewFollowUp[][];
}

export interface SelectManyQuestionPreviewSession {
  surveyId: number;
  surveyTitle: string;
  questionCode?: string;
  questionText: string;
  required?: boolean;
  options: { id: string; label: string }[];
  answerDisplayOrder?: AnswerDisplayOrder;
  randomizeAnswerCount?: RandomizeAnswerCount;
  alternateFlipReversed?: boolean;
  showHideOptions?: ShowHideOptionsPreviewConfig | null;
  priorPages?: SurveyQuestionPreviewFollowUp[][];
  samePageFollowUps?: SurveyQuestionPreviewFollowUp[];
  nextPages?: SurveyQuestionPreviewFollowUp[][];
}

export interface SelectOneQuestionPreviewSession {
  surveyId: number;
  surveyTitle: string;
  questionCode?: string;
  questionText: string;
  required?: boolean;
  options: { id: string; label: string }[];
  answerDisplayOrder?: AnswerDisplayOrder;
  randomizeAnswerCount?: RandomizeAnswerCount;
  alternateFlipReversed?: boolean;
  showHideOptions?: ShowHideOptionsPreviewConfig | null;
  isFirstQuestion?: boolean;
  priorPages?: SurveyQuestionPreviewFollowUp[][];
  samePageFollowUps?: SurveyQuestionPreviewFollowUp[];
  nextPages?: SurveyQuestionPreviewFollowUp[][];
}

export interface CaptchaQuestionPreviewSession {
  surveyId: number;
  surveyTitle: string;
  questionCode?: string;
  questionText: string;
  required?: boolean;
  captchaSettings: CaptchaSettings;
  isFirstQuestion?: boolean;
  samePageFollowUps?: SurveyQuestionPreviewFollowUp[];
  nextPages?: SurveyQuestionPreviewFollowUp[][];
}

export type SurveyQuestionPreviewKind =
  | 'multi-point'
  | 'select-many'
  | 'select-one'
  | 'captcha';

export function multiPointPreviewStorageKey(surveyId: number): string {
  return `survey-multipoint-preview-${surveyId}`;
}

export function selectManyPreviewStorageKey(surveyId: number): string {
  return `survey-select-many-preview-${surveyId}`;
}

export function selectOnePreviewStorageKey(surveyId: number): string {
  return `survey-select-one-preview-${surveyId}`;
}

export function captchaPreviewStorageKey(surveyId: number): string {
  return `survey-captcha-preview-${surveyId}`;
}

/** localStorage so data is available when preview opens in a new browser tab. */
export function writeMultiPointQuestionPreviewSession(
  payload: MultiPointQuestionPreviewSession
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    multiPointPreviewStorageKey(payload.surveyId),
    JSON.stringify({
      ...payload,
      settings: mergePreviewSettings(payload.settings),
    })
  );
}

function mergePreviewSettings(
  settings?: Partial<MultiPointScalesSettings>
): MultiPointScalesSettings {
  const merged: MultiPointScalesSettings = {
    ...DEFAULT_MULTI_POINT_SETTINGS,
    ...settings,
  };
  const responseLayout = merged.cardsCarouselResponseLayout;
  if (responseLayout !== 'horizontal' && responseLayout !== 'vertical') {
    merged.cardsCarouselResponseLayout = DEFAULT_MULTI_POINT_SETTINGS.cardsCarouselResponseLayout;
  }
  return merged;
}

export function readMultiPointQuestionPreviewSession(
  surveyId: number
): MultiPointQuestionPreviewSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(multiPointPreviewStorageKey(surveyId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as MultiPointQuestionPreviewSession;
    return {
      ...parsed,
      settings: mergePreviewSettings(parsed.settings),
    };
  } catch {
    return null;
  }
}

function mergeOptionQuestionPreviewSettings(
  settings?: Partial<Pick<QuestionSettings, 'answerDisplayOrder' | 'randomizeAnswerCount'>>,
  optionCount = 0
): {
  answerDisplayOrder: AnswerDisplayOrder;
  randomizeAnswerCount: RandomizeAnswerCount;
} {
  return {
    answerDisplayOrder: normalizeAnswerDisplayOrder(settings?.answerDisplayOrder),
    randomizeAnswerCount: normalizeRandomizeAnswerCount(
      settings?.randomizeAnswerCount,
      optionCount
    ),
  };
}

export function writeSelectManyQuestionPreviewSession(
  payload: SelectManyQuestionPreviewSession
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    selectManyPreviewStorageKey(payload.surveyId),
    JSON.stringify({
      ...payload,
      ...mergeOptionQuestionPreviewSettings(
        {
          answerDisplayOrder: payload.answerDisplayOrder,
          randomizeAnswerCount: payload.randomizeAnswerCount,
        },
        payload.options.length
      ),
    })
  );
}

export function readSelectManyQuestionPreviewSession(
  surveyId: number
): SelectManyQuestionPreviewSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(selectManyPreviewStorageKey(surveyId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SelectManyQuestionPreviewSession;
    return {
      ...parsed,
      ...mergeOptionQuestionPreviewSettings(
        {
          answerDisplayOrder: parsed.answerDisplayOrder,
          randomizeAnswerCount: parsed.randomizeAnswerCount,
        },
        parsed.options.length
      ),
    };
  } catch {
    return null;
  }
}

export function writeSelectOneQuestionPreviewSession(
  payload: SelectOneQuestionPreviewSession
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    selectOnePreviewStorageKey(payload.surveyId),
    JSON.stringify({
      ...payload,
      ...mergeOptionQuestionPreviewSettings(
        {
          answerDisplayOrder: payload.answerDisplayOrder,
          randomizeAnswerCount: payload.randomizeAnswerCount,
        },
        payload.options.length
      ),
    })
  );
}

export function readSelectOneQuestionPreviewSession(
  surveyId: number
): SelectOneQuestionPreviewSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(selectOnePreviewStorageKey(surveyId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SelectOneQuestionPreviewSession;
    return {
      ...parsed,
      ...mergeOptionQuestionPreviewSettings(
        {
          answerDisplayOrder: parsed.answerDisplayOrder,
          randomizeAnswerCount: parsed.randomizeAnswerCount,
        },
        parsed.options.length
      ),
    };
  } catch {
    return null;
  }
}

function mergeCaptchaPreviewSettings(
  settings?: Partial<CaptchaSettings>
): CaptchaSettings {
  return {
    ...DEFAULT_CAPTCHA_SETTINGS,
    ...settings,
  };
}

export function writeCaptchaQuestionPreviewSession(
  payload: CaptchaQuestionPreviewSession
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    captchaPreviewStorageKey(payload.surveyId),
    JSON.stringify({
      ...payload,
      captchaSettings: mergeCaptchaPreviewSettings(payload.captchaSettings),
    })
  );
}

export function readCaptchaQuestionPreviewSession(
  surveyId: number
): CaptchaQuestionPreviewSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(captchaPreviewStorageKey(surveyId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CaptchaQuestionPreviewSession;
    return {
      ...parsed,
      captchaSettings: mergeCaptchaPreviewSettings(parsed.captchaSettings),
    };
  } catch {
    return null;
  }
}
