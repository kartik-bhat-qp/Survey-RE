'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SurveyApprovalDashboard } from '@/components/surveys/SurveyApprovalDashboard';
import { EmptyState } from '@/components/ui/EmptyState';
import { surveyHasApprovalTab } from '@/data/mock-survey-approval';
import { getSurveyEditorTitle } from '@/data/get-survey-by-id';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveyApprovalPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);

  useEffect(() => {
    if (!ready || !survey) return;
    if (!surveyHasApprovalTab(survey.id)) {
      router.replace(`/surveys/${survey.id}`);
    }
  }, [ready, router, survey]);

  if (!ready || !survey) {
    return null;
  }

  if (!surveyHasApprovalTab(survey.id)) {
    return (
      <EmptyState
        icon="wm-assignment-turned-in"
        title="Approval is not available"
        description="Review before publish is not enabled for this survey in the prototype."
      />
    );
  }

  return <SurveyApprovalDashboard surveyId={survey.id} surveyName={getSurveyEditorTitle(survey)} />;
}
