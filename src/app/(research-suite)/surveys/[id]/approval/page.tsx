'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SurveyApprovalPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = Number(params.id);

  useEffect(() => {
    router.replace(`/surveys/${surveyId}`);
  }, [router, surveyId]);

  return null;
}
