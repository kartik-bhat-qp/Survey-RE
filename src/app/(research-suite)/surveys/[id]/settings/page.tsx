'use client';

import { useParams } from 'next/navigation';
import { SurveySettingsDashboard } from '@/components/surveys/SurveySettingsDashboard';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveySettingsPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);

  if (!ready || !survey) {
    return null;
  }

  return <SurveySettingsDashboard surveyId={survey.id} />;
}
