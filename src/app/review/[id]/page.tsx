'use client';

import { useParams } from 'next/navigation';
import { SurveyReviewerView } from '@/components/surveys/SurveyReviewerView';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveyReviewerPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);

  if (!ready) return null;

  if (!survey) {
    return (
      <EmptyState
        icon="wm-folder-open"
        title="Survey not found"
        description="This survey does not exist or may have been removed."
      />
    );
  }

  return <SurveyReviewerView survey={survey} />;
}
