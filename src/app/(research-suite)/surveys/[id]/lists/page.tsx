'use client';

import { useParams } from 'next/navigation';
import { SurveyDistributeLists } from '@/components/surveys/SurveyDistributeLists';

export default function SurveyListsPage() {
  const params = useParams();
  const surveyId = Number(params.id);

  if (!Number.isFinite(surveyId)) {
    return null;
  }

  return <SurveyDistributeLists surveyId={surveyId} />;
}
