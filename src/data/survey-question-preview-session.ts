import type {
  SurveyMatrix,
  SurveyQuestionInputKind,
  SurveyQuestionKind,
} from '@/data/mock-survey-detail';
import {
  DEFAULT_MULTI_POINT_SETTINGS,
  type MultiPointScalesSettings,
} from '@/data/mock-multi-point-settings';

export interface SurveyQuestionPreviewFollowUp {
  code: string;
  text: string;
  required?: boolean;
  kind: SurveyQuestionKind;
  inputKind: SurveyQuestionInputKind;
  options: { id: string; label: string }[];
  matrix?: SurveyMatrix;
}

export interface MultiPointQuestionPreviewSession {
  surveyId: number;
  surveyTitle: string;
  questionText: string;
  required?: boolean;
  matrix: SurveyMatrix;
  settings: MultiPointScalesSettings;
  /** Next question in the survey, shown below the previewed question. */
  questionBelow?: SurveyQuestionPreviewFollowUp | null;
}

export function multiPointPreviewStorageKey(surveyId: number): string {
  return `survey-multipoint-preview-${surveyId}`;
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
