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
  DEFAULT_QUESTION_SETTINGS,
  type AnswerDisplayOrder,
  type QuestionSettings,
} from '@/data/mock-question-settings';
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
  showHideOptions?: ShowHideOptionsPreviewConfig | null;
  isFirstQuestion?: boolean;
  priorPages?: SurveyQuestionPreviewFollowUp[][];
  samePageFollowUps?: SurveyQuestionPreviewFollowUp[];
  nextPages?: SurveyQuestionPreviewFollowUp[][];
}

export type SurveyQuestionPreviewKind = 'multi-point' | 'select-many' | 'select-one';

export function multiPointPreviewStorageKey(surveyId: number): string {
  return `survey-multipoint-preview-${surveyId}`;
}

export function selectManyPreviewStorageKey(surveyId: number): string {
  return `survey-select-many-preview-${surveyId}`;
}

export function selectOnePreviewStorageKey(surveyId: number): string {
  return `survey-select-one-preview-${surveyId}`;
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
  settings?: Partial<Pick<QuestionSettings, 'answerDisplayOrder'>>
): AnswerDisplayOrder {
  return settings?.answerDisplayOrder ?? DEFAULT_QUESTION_SETTINGS.answerDisplayOrder;
}

export function writeSelectManyQuestionPreviewSession(
  payload: SelectManyQuestionPreviewSession
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    selectManyPreviewStorageKey(payload.surveyId),
    JSON.stringify({
      ...payload,
      answerDisplayOrder: mergeOptionQuestionPreviewSettings({
        answerDisplayOrder: payload.answerDisplayOrder,
      }),
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
      answerDisplayOrder: mergeOptionQuestionPreviewSettings({
        answerDisplayOrder: parsed.answerDisplayOrder,
      }),
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
      answerDisplayOrder: mergeOptionQuestionPreviewSettings({
        answerDisplayOrder: payload.answerDisplayOrder,
      }),
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
      answerDisplayOrder: mergeOptionQuestionPreviewSettings({
        answerDisplayOrder: parsed.answerDisplayOrder,
      }),
    };
  } catch {
    return null;
  }
}
