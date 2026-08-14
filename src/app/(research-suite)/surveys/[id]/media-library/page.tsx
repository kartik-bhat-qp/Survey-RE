'use client';

import { useParams } from 'next/navigation';
import { MediaLibraryDashboard } from '@/components/surveys/MediaLibraryDashboard';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveyMediaLibraryPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);

  if (!ready || !survey) {
    return null;
  }

  return <MediaLibraryDashboard surveyId={survey.id} />;
}
