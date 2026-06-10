'use client';

import { useMemo } from 'react';
import { useSurveyPreviewToolbar } from '@/components/surveys/SurveyPreviewToolbarContext';
import { useSurveyPreviewAnswers } from '@/components/surveys/SurveyPreviewAnswerContext';
import { evaluateCriteriaMetFromAnswers } from '@/data/evaluate-preview-criteria';
import {
  resolvePreviewVisibleOptionIds,
  simulateRandomCriteriaMet,
  type ShowHideOptionsPreviewConfig,
} from '@/data/show-hide-options-preview';

export function usePreviewVisibleOptions<T extends { id: string }>(
  options: T[],
  config: ShowHideOptionsPreviewConfig | null | undefined,
  surveyId?: number
): T[] {
  const { logic: logicEnabled } = useSurveyPreviewToolbar();
  const { answersByCode } = useSurveyPreviewAnswers();
  const effectiveConfig = logicEnabled ? config : null;

  const criteriaMet = useMemo(() => {
    if (!effectiveConfig) return null;
    if (surveyId != null) {
      return evaluateCriteriaMetFromAnswers(effectiveConfig, surveyId, answersByCode);
    }
    return simulateRandomCriteriaMet(effectiveConfig);
  }, [answersByCode, effectiveConfig, surveyId]);

  return useMemo(() => {
    if (!effectiveConfig || !criteriaMet) return options;

    const visibleIds = new Set(
      resolvePreviewVisibleOptionIds(
        options.map((option) => option.id),
        effectiveConfig,
        criteriaMet
      )
    );

    return options.filter((option) => visibleIds.has(option.id));
  }, [criteriaMet, effectiveConfig, options]);
}
