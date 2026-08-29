'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSurveyReviewerPagePath, surveyHasApprovalTab } from '@/data/mock-survey-approval';

/** Legacy review URL — send reviewers to the survey editor with the Review modal. */
export default function SurveyReviewerPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = Number(params.id);

  useEffect(() => {
    if (!Number.isFinite(surveyId) || surveyId <= 0) {
      router.replace('/surveys');
      return;
    }
    if (!surveyHasApprovalTab(surveyId)) {
      router.replace(`/surveys/${surveyId}`);
      return;
    }
    router.replace(getSurveyReviewerPagePath(surveyId));
  }, [router, surveyId]);

  return null;
}
