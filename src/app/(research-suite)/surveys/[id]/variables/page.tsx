'use client';

import { useParams } from 'next/navigation';
import { SurveyVariablesDashboard } from '@/components/surveys/SurveyVariablesDashboard';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveyVariablesPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);

  if (!ready || !survey) {
    return null;
  }

  return <SurveyVariablesDashboard surveyId={survey.id} />;
}
