'use client';

import { usePathname } from 'next/navigation';
import { getSurveyById } from '@/data/get-survey-by-id';
import { getSurveyDetail } from '@/data/mock-survey-detail';
import { SurveyEditorBreadcrumb } from '@/components/surveys/SurveyEditorBreadcrumb';
import { SurveysHeaderActions } from '@/components/surveys/SurveysHeaderActions';
import styles from './SurveysAppHeaderContent.module.css';

export function SurveysAppHeaderContent() {
  const pathname = usePathname();
  const detailMatch = pathname.match(/^\/surveys\/(\d+)$/);

  if (detailMatch) {
    const survey = getSurveyById(Number(detailMatch[1]));
    if (survey) {
      const detail = getSurveyDetail(survey);
      return (
        <div className={styles.editorBar}>
          <SurveyEditorBreadcrumb survey={survey} editorTitle={detail.editorTitle} />
          <SurveysHeaderActions compact />
        </div>
      );
    }
  }

  return (
    <div className={styles.listBar}>
      <SurveysHeaderActions />
    </div>
  );
}
