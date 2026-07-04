import type { SurveyEditorPhase } from '@/components/surveys/SurveyEditorPhaseContext';

export function getSurveyEditorPhaseFromPathname(
  pathname: string,
  surveyId: number
): SurveyEditorPhase {
  const base = `/surveys/${surveyId}`;
  if (pathname === `${base}/distribute` || pathname.startsWith(`${base}/distribute/`)) {
    return 'distribute';
  }
  if (pathname === `${base}/analytics` || pathname.startsWith(`${base}/analytics/`)) {
    return 'analytics';
  }
  return 'edit';
}

export function getSurveyEditorPhasePath(
  surveyId: number,
  phase: SurveyEditorPhase
): string {
  const base = `/surveys/${surveyId}`;
  if (phase === 'distribute') {
    return `${base}/distribute`;
  }
  if (phase === 'analytics') {
    return `${base}/analytics`;
  }
  return base;
}
