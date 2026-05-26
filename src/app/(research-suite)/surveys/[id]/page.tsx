'use client';

import { useParams } from 'next/navigation';
import { SurveyEditorCanvas } from '@/components/surveys/SurveyEditorCanvas';
import { getSurveyById } from '@/data/get-survey-by-id';
import { getSurveyDetail } from '@/data/mock-survey-detail';

export default function SurveyEditorPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const survey = getSurveyById(surveyId);

  if (!survey) {
    return null;
  }

  const detail = getSurveyDetail(survey);

  return <SurveyEditorCanvas detail={detail} />;
}
