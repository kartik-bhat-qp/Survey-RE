'use client';

import { useParams } from 'next/navigation';
import { SurveyAdvanceQuotasDashboard } from '@/components/surveys/SurveyAdvanceQuotasDashboard';
import { EmptyState } from '@/components/ui/EmptyState';
import { getSurveyEditorTitle } from '@/data/get-survey-by-id';
import { useSurveyById } from '@/hooks/useSurveyById';
import styles from './ClientAdvanceQuotasSharePage.module.css';

export default function ClientAdvanceQuotasSharePage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);

  if (!ready) {
    return <div className={styles.loadingShell} aria-busy="true" aria-hidden />;
  }

  if (!survey) {
    return (
      <div className={styles.notFound}>
        <EmptyState
          icon="wm-link-off"
          title="Link not available"
          description="This shared quota dashboard link is invalid or the survey no longer exists."
        />
      </div>
    );
  }

  const surveyTitle = getSurveyEditorTitle(survey);

  const pageTitle = `${surveyTitle} - Dashboard`;

  return (
    <>
      <div className={styles.topAccent} aria-hidden />
      <div className={styles.page}>
        <header className={styles.topBar}>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
        </header>
        <main className={styles.dashboardWrap}>
          <SurveyAdvanceQuotasDashboard surveyId={survey.id} clientView />
        </main>
        <footer className={styles.footer}>
          <span className={styles.poweredBy}>Powered by </span>
          <span className={styles.brand}>QuestionPro</span>
        </footer>
      </div>
    </>
  );
}
