'use client';

import { useParams } from 'next/navigation';
import { SurveyEditorPhaseTabs } from '@/components/surveys/SurveyEditorPhaseTabs';
import { SurveyEditorWorkspaceToolbar } from '@/components/surveys/SurveyEditorWorkspaceToolbar';
import { EmptyState } from '@/components/ui/EmptyState';
import { getSurveyById } from '@/data/get-survey-by-id';
import styles from './SurveyEditorPage.module.css';

export default function SurveyEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const surveyId = Number(params.id);
  const survey = getSurveyById(surveyId);

  if (!survey) {
    return (
      <div className={styles.notFound}>
        <EmptyState
          icon="wm-folder-open"
          title="Survey not found"
          description="This survey does not exist or may have been removed."
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <SurveyEditorPhaseTabs />
      <SurveyEditorWorkspaceToolbar surveyId={survey.id} />
      {children}
    </div>
  );
}
