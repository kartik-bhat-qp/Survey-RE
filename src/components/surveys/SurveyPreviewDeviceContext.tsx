'use client';

import { createContext, useContext } from 'react';

export type SurveyPreviewDevice = 'desktop' | 'tablet' | 'mobile';

const DEFAULT_SURVEY_PREVIEW_DEVICE: SurveyPreviewDevice = 'desktop';

export const SurveyPreviewDeviceContext = createContext<SurveyPreviewDevice>(
  DEFAULT_SURVEY_PREVIEW_DEVICE
);

export function useSurveyPreviewDevice(): SurveyPreviewDevice {
  return useContext(SurveyPreviewDeviceContext);
}
