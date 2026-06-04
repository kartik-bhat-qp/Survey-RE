'use client';

import { useParams } from 'next/navigation';
import { SurveyAnalyticsDashboard } from '@/components/surveys/SurveyAnalyticsDashboard';
import { useSurveyEditorPhase } from '@/components/surveys/SurveyEditorPhaseContext';
import { SurveyEditorCanvas } from '@/components/surveys/SurveyEditorCanvas';
import { getSurveyDetail } from '@/data/mock-survey-detail';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveyEditorPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);
  const { activePhase } = useSurveyEditorPhase();

  if (!ready || !survey) {
    return null;
  }

  const detail = getSurveyDetail(survey);

  if (activePhase === 'analytics') {
    return <SurveyAnalyticsDashboard detail={detail} />;
  }

  return <SurveyEditorCanvas detail={detail} />;
}
