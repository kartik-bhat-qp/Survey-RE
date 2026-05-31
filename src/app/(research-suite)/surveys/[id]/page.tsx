'use client';

import { useParams } from 'next/navigation';
import { SurveyEditorCanvas } from '@/components/surveys/SurveyEditorCanvas';
import { getSurveyDetail } from '@/data/mock-survey-detail';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveyEditorPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);

  if (!ready || !survey) {
    return null;
  }

  const detail = getSurveyDetail(survey);

  return <SurveyEditorCanvas detail={detail} />;
}
