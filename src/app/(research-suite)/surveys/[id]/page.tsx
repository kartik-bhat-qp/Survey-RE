'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SurveyAnalyticsDashboard } from '@/components/surveys/SurveyAnalyticsDashboard';
import { useSurveyAnalyticsView } from '@/components/surveys/SurveyAnalyticsViewContext';
import { useSurveyEditorPhase } from '@/components/surveys/SurveyEditorPhaseContext';
import { consumeVideoAiRestoreState } from '@/components/video-ai/videoAiNavigation';
import { SurveyEditorCanvas } from '@/components/surveys/SurveyEditorCanvas';
import { getSurveyDetail } from '@/data/mock-survey-detail';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveyEditorPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);
  const { activePhase, setActivePhase } = useSurveyEditorPhase();
  const { setAnalyticsSelection } = useSurveyAnalyticsView();

  useEffect(() => {
    if (!ready || !survey) return;
    const restore = consumeVideoAiRestoreState(surveyId);
    if (!restore) return;
    setActivePhase('analytics');
    setAnalyticsSelection(restore.tab, restore.subView);
  }, [ready, survey, surveyId, setActivePhase, setAnalyticsSelection]);

  if (!ready || !survey) {
    return null;
  }

  const detail = getSurveyDetail(survey);

  if (activePhase === 'analytics') {
    return <SurveyAnalyticsDashboard detail={detail} />;
  }

  return <SurveyEditorCanvas detail={detail} />;
}
