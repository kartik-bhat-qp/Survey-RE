'use client';

import { createContext, useContext } from 'react';

export interface SurveyPreviewToolbarToggles {
  urlVariable: boolean;
  validations: boolean;
  logic: boolean;
  pageBreaks: boolean;
}

const DEFAULT_SURVEY_PREVIEW_TOOLBAR_TOGGLES: SurveyPreviewToolbarToggles = {
  urlVariable: true,
  validations: true,
  logic: true,
  pageBreaks: true,
};

export const SurveyPreviewToolbarContext = createContext<SurveyPreviewToolbarToggles>(
  DEFAULT_SURVEY_PREVIEW_TOOLBAR_TOGGLES
);

export function useSurveyPreviewToolbar(): SurveyPreviewToolbarToggles {
  return useContext(SurveyPreviewToolbarContext);
}
