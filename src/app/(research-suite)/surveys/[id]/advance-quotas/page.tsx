'use client';

import { useParams } from 'next/navigation';
import { SurveyAdvanceQuotasDashboard } from '@/components/surveys/SurveyAdvanceQuotasDashboard';
import { getSurveyById } from '@/data/get-survey-by-id';

export default function SurveyAdvanceQuotasPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const survey = getSurveyById(surveyId);

  if (!survey) {
    return null;
  }

  return <SurveyAdvanceQuotasDashboard surveyId={survey.id} />;
}
