'use client';

import { useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { SurveyDistributeDashboard } from '@/components/surveys/SurveyDistributeDashboard';
import {
  getCanonicalDistributePath,
  getDefaultDistributeRouteState,
  parseDistributeRouteFromPathname,
} from '@/components/surveys/survey-distribute-navigation';
import { getSurveyDetail } from '@/data/mock-survey-detail';
import { useSurveyById } from '@/hooks/useSurveyById';

export function SurveyDistributeRoutePage() {
  const params = useParams();
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);

  useEffect(() => {
    if (!ready || !survey) return;

    const parsed = parseDistributeRouteFromPathname(pathname, survey.id);
    if (!parsed) {
      router.replace(getCanonicalDistributePath(survey.id, getDefaultDistributeRouteState()));
      return;
    }

    const canonicalPath = getCanonicalDistributePath(survey.id, parsed);
    if (pathname !== canonicalPath) {
      router.replace(canonicalPath);
    }
  }, [pathname, ready, router, survey]);

  if (!ready || !survey) {
    return null;
  }

  return <SurveyDistributeDashboard detail={getSurveyDetail(survey)} />;
}
