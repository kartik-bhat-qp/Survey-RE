'use client';

import { Suspense, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { isExistingQuestionProUser } from '@/data/mock-reviewer-accounts';
import {
  getSurveyReviewerPagePath,
  surveyHasApprovalTab,
} from '@/data/mock-survey-approval';

export default function SurveyReviewStartPage() {
  return (
    <Suspense fallback={null}>
      <SurveyReviewStartPageContent />
    </Suspense>
  );
}

function SurveyReviewStartPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const surveyId = Number(params.id);
  const email = searchParams.get('email')?.trim().toLowerCase() ?? '';
  const reviewPath = getSurveyReviewerPagePath(surveyId);

  useEffect(() => {
    if (!surveyHasApprovalTab(surveyId)) {
      router.replace(reviewPath);
      return;
    }

    if (!email || isExistingQuestionProUser(email)) {
      router.replace(reviewPath);
      return;
    }

    const signupUrl = `/review/${surveyId}/signup?email=${encodeURIComponent(email)}`;
    router.replace(signupUrl);
  }, [email, reviewPath, router, surveyId]);

  return null;
}
