'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { SurveySettingsDashboard } from '@/components/surveys/SurveySettingsDashboard';
import { useMounted } from '@/hooks/useMounted';
import { useSurveyById } from '@/hooks/useSurveyById';

function SurveySettingsPageBody() {
  const params = useParams();
  const surveyId = Number(params.id);
  const mounted = useMounted();
  const { survey, ready } = useSurveyById(surveyId);

  // Mount after the first client effect so SSR HTML stays empty. The in-IDE
  // browser injects data-cursor-ref before hydration; that would otherwise
  // mismatch the server markup for this client tree.
  if (!mounted || !ready || !survey) {
    return null;
  }

  return <SurveySettingsDashboard surveyId={survey.id} />;
}

export default function SurveySettingsPage() {
  return (
    <Suspense fallback={null}>
      <SurveySettingsPageBody />
    </Suspense>
  );
}
