'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SurveyLanguagesRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = Number(params.id);

  useEffect(() => {
    router.replace(`/surveys/${surveyId}/settings?tab=languages`);
  }, [router, surveyId]);

  return null;
}
