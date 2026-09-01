'use client';

import { useParams } from 'next/navigation';
import { SurveyDesignDashboard } from '@/components/surveys/SurveyDesignDashboard';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveyDesignPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);

  if (!ready || !survey) {
    return null;
  }

  return <SurveyDesignDashboard surveyId={survey.id} />;
}
