'use client';

import { useParams } from 'next/navigation';
import { SurveyDistributeDashboard } from '@/components/surveys/SurveyDistributeDashboard';
import { getSurveyDetail } from '@/data/mock-survey-detail';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveyDistributePage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);

  if (!ready || !survey) {
    return null;
  }

  return <SurveyDistributeDashboard detail={getSurveyDetail(survey)} />;
}
