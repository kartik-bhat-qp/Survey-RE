'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { SurveyPreviewAnswer } from '@/data/evaluate-preview-criteria';

export type { SurveyPreviewAnswer };

interface SurveyPreviewAnswerContextValue {
  answersByCode: Record<string, SurveyPreviewAnswer>;
  setAnswer: (questionCode: string, answer: SurveyPreviewAnswer) => void;
}

const SurveyPreviewAnswerContext = createContext<SurveyPreviewAnswerContextValue | null>(null);

export function SurveyPreviewAnswerProvider({ children }: { children: React.ReactNode }) {
  const [answersByCode, setAnswersByCode] = useState<Record<string, SurveyPreviewAnswer>>({});

  const setAnswer = useCallback((questionCode: string, answer: SurveyPreviewAnswer) => {
    setAnswersByCode((prev) => {
      const current = prev[questionCode];
      if (
        current &&
        current.selectedOptionIds.join('|') === answer.selectedOptionIds.join('|') &&
        current.selectedLabels.join('|') === answer.selectedLabels.join('|')
      ) {
        return prev;
      }
      return { ...prev, [questionCode]: answer };
    });
  }, []);

  const value = useMemo(
    () => ({
      answersByCode,
      setAnswer,
    }),
    [answersByCode, setAnswer]
  );

  return (
    <SurveyPreviewAnswerContext.Provider value={value}>
      {children}
    </SurveyPreviewAnswerContext.Provider>
  );
}

export function useSurveyPreviewAnswers(): SurveyPreviewAnswerContextValue {
  const context = useContext(SurveyPreviewAnswerContext);
  if (!context) {
    throw new Error('useSurveyPreviewAnswers must be used within SurveyPreviewAnswerProvider');
  }
  return context;
}
