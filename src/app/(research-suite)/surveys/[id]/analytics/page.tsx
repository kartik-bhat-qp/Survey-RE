'use client';

import { useParams } from 'next/navigation';
import { SurveyAnalyticsDashboard } from '@/components/surveys/SurveyAnalyticsDashboard';
import { getSurveyDetail } from '@/data/mock-survey-detail';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveyAnalyticsPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);

  if (!ready || !survey) {
    return null;
  }

  return <SurveyAnalyticsDashboard detail={getSurveyDetail(survey)} />;
}
