'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SurveyAnalyticsDashboard } from '@/components/surveys/SurveyAnalyticsDashboard';
import { SurveyDistributeDashboard } from '@/components/surveys/SurveyDistributeDashboard';
import { useSurveyEditorPhase } from '@/components/surveys/SurveyEditorPhaseContext';
import { SurveyEditorCanvas } from '@/components/surveys/SurveyEditorCanvas';
import { readVideoAiReturnState } from '@/components/video-ai/videoAiNavigation';
import { getSurveyDetail } from '@/data/mock-survey-detail';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveyEditorPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);
  const { activePhase, setActivePhase } = useSurveyEditorPhase();

  useEffect(() => {
    const restored = readVideoAiReturnState();
    if (restored?.surveyId === surveyId) {
      setActivePhase('analytics');
    }
  }, [surveyId, setActivePhase]);

  if (!ready || !survey) {
    return null;
  }

  const detail = getSurveyDetail(survey);

  if (activePhase === 'analytics') {
    return <SurveyAnalyticsDashboard detail={detail} />;
  }

  if (activePhase === 'distribute') {
    return <SurveyDistributeDashboard detail={detail} />;
  }

  return <SurveyEditorCanvas detail={detail} />;
}
