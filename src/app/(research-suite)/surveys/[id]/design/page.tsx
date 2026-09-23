'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SurveyDesignDashboard } from '@/components/surveys/SurveyDesignDashboard';
import { EmptyState } from '@/components/ui/EmptyState';
import { surveyHasDesignTab } from '@/data/mock-survey-design';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveyDesignPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);

  useEffect(() => {
    if (!ready || !survey) return;
    if (!surveyHasDesignTab(survey.id)) {
      router.replace(`/surveys/${survey.id}`);
    }
  }, [ready, router, survey]);

  if (!ready || !survey) {
    return null;
  }

  if (!surveyHasDesignTab(survey.id)) {
    return (
      <EmptyState
        icon="wm-brush"
        title="Design is not available"
        description="Design settings are not enabled for this survey in the prototype."
      />
    );
  }

  return <SurveyDesignDashboard surveyId={survey.id} />;
}
