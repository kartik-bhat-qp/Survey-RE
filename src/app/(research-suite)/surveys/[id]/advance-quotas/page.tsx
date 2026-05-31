'use client';

import { useParams } from 'next/navigation';
import { SurveyAdvanceQuotasDashboard } from '@/components/surveys/SurveyAdvanceQuotasDashboard';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveyAdvanceQuotasPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);

  if (!ready || !survey) {
    return null;
  }

  return <SurveyAdvanceQuotasDashboard surveyId={survey.id} />;
}
