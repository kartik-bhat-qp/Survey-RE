'use client';

import { Suspense, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { SurveyReviewSignupView } from '@/components/surveys/SurveyReviewSignupView';
import { EmptyState } from '@/components/ui/EmptyState';
import { getSurveyReviewerPagePath, surveyHasApprovalTab } from '@/data/mock-survey-approval';

export default function SurveyReviewSignupPage() {
  return (
    <Suspense fallback={null}>
      <SurveyReviewSignupPageContent />
    </Suspense>
  );
}

function SurveyReviewSignupPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const surveyId = Number(params.id);
  const email = searchParams.get('email')?.trim().toLowerCase() ?? '';

  useEffect(() => {
    if (surveyHasApprovalTab(surveyId)) return;
    router.replace(getSurveyReviewerPagePath(surveyId));
  }, [router, surveyId]);

  if (!surveyHasApprovalTab(surveyId)) {
    return (
      <EmptyState
        icon="wm-assignment-turned-in"
        title="Review signup is not available"
        description="Account creation for review is only used for Survey Review Mode."
      />
    );
  }

  return <SurveyReviewSignupView surveyId={surveyId} email={email} />;
}
