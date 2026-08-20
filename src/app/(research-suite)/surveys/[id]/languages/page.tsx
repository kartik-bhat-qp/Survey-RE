'use client';

import { useParams } from 'next/navigation';
import { SurveyLanguagesDashboard } from '@/components/surveys/SurveyLanguagesDashboard';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveyLanguagesPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);

  if (!ready || !survey) {
    return null;
  }

  return <SurveyLanguagesDashboard surveyId={survey.id} />;
}
