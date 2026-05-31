'use client';

import { usePathname } from 'next/navigation';
import { getSurveyDetail } from '@/data/mock-survey-detail';
import { useSurveyById } from '@/hooks/useSurveyById';
import { parseSurveyEditorIdFromPathname } from '@/lib/survey-editor-path';
import { SurveyEditorBreadcrumb } from '@/components/surveys/SurveyEditorBreadcrumb';
import { SurveysHeaderActions } from '@/components/surveys/SurveysHeaderActions';
import styles from './SurveysAppHeaderContent.module.css';

export function SurveysAppHeaderContent() {
  const pathname = usePathname();
  const surveyId = parseSurveyEditorIdFromPathname(pathname);
  const { survey, ready } = useSurveyById(surveyId ?? -999);

  if (surveyId !== null && ready && survey) {
    const detail = getSurveyDetail(survey);
    return (
      <div className={styles.editorBar}>
        <SurveyEditorBreadcrumb survey={survey} editorTitle={detail.editorTitle} />
        <SurveysHeaderActions compact />
      </div>
    );
  }

  return (
    <div className={styles.listBar}>
      <SurveysHeaderActions />
    </div>
  );
}
