'use client';

import { useParams } from 'next/navigation';
import { PathSimulatorDashboard } from '@/components/surveys/PathSimulatorDashboard';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveyPathSimulatorPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);

  if (!ready || !survey) {
    return null;
  }

  return <PathSimulatorDashboard surveyId={survey.id} />;
}
