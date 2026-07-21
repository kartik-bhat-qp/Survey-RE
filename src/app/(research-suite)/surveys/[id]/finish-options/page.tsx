'use client';

import { useParams } from 'next/navigation';
import { SurveyFinishOptionsDashboard } from '@/components/surveys/SurveyFinishOptionsDashboard';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveyFinishOptionsPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);

  if (!ready || !survey) {
    return null;
  }

  return <SurveyFinishOptionsDashboard surveyId={survey.id} />;
}
