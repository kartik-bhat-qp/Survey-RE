'use client';

import { useParams } from 'next/navigation';
import { SurveyAnalyticsHub } from '@/components/surveys/analytics2/SurveyAnalyticsHub';
import { getSurveyDetail } from '@/data/mock-survey-detail';
import { useSurveyById } from '@/hooks/useSurveyById';

export default function SurveyAnalytics2Page() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);

  if (!ready || !survey) {
    return null;
  }

  return <SurveyAnalyticsHub detail={getSurveyDetail(survey)} />;
}
