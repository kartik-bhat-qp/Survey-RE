'use client';

import { useEffect, useState } from 'react';
import { getSurveyById } from '@/data/get-survey-by-id';
import type { Survey } from '@/data/mock-surveys';
import { isClientOnlySurveyId } from '@/lib/client-only-survey-ids';
import { useMounted } from '@/hooks/useMounted';

export interface UseSurveyByIdResult {
  survey: Survey | undefined;
  /** False until client-only ids can safely read sessionStorage. */
  ready: boolean;
}

/**
 * Resolves a survey for render. Mock ids resolve on the server; draft ids (-1, 0)
 * stay undefined until mount so SSR HTML matches the first client paint.
 */
export function useSurveyById(id: number): UseSurveyByIdResult {
  const mounted = useMounted();
  const clientOnly = isClientOnlySurveyId(id);

  const [survey, setSurvey] = useState<Survey | undefined>(() =>
    clientOnly ? undefined : getSurveyById(id)
  );

  useEffect(() => {
    if (clientOnly) {
      if (!mounted) return;
      setSurvey(getSurveyById(id));
      return;
    }
    setSurvey(getSurveyById(id));
  }, [clientOnly, id, mounted]);

  const ready = !clientOnly || mounted;

  return { survey, ready };
}
