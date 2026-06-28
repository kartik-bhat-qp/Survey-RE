'use client';

import { useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { SurveyAnalyticsSubNav } from '@/components/surveys/SurveyAnalyticsSubNav';
import { SurveyAnalyticsViewProvider } from '@/components/surveys/SurveyAnalyticsViewContext';
import { SurveyEditorPhaseProvider, useSurveyEditorPhase } from '@/components/surveys/SurveyEditorPhaseContext';
import { SurveyWorkspaceSectionsProvider } from '@/components/surveys/SurveyWorkspaceSectionsContext';
import { SurveyEditorPhaseTabs } from '@/components/surveys/SurveyEditorPhaseTabs';
import { SurveyDistributeSubNav } from '@/components/surveys/SurveyDistributeSubNav';
import { SurveyDistributeViewProvider } from '@/components/surveys/SurveyDistributeViewContext';
import { SurveyEditorWorkspaceToolbar } from '@/components/surveys/SurveyEditorWorkspaceToolbar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSurveyById } from '@/hooks/useSurveyById';
import styles from './SurveyEditorPage.module.css';

function SurveyEditorLayoutBody({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const surveyId = Number(params.id);
  const { survey, ready } = useSurveyById(surveyId);
  const { activePhase } = useSurveyEditorPhase();

  useEffect(() => {
    if (!ready || !survey) return;
    if (activePhase === 'analytics' && pathname.includes('/advance-quotas')) {
      router.replace(`/surveys/${survey.id}`);
      return;
    }
    if (activePhase === 'distribute' && pathname.includes('/advance-quotas')) {
      router.replace(`/surveys/${survey.id}`);
    }
  }, [activePhase, pathname, ready, router, survey]);

  if (!ready) {
    return (
      <div className={styles.page}>
        <SurveyEditorPhaseTabs />
        <SurveyEditorWorkspaceToolbar surveyId={surveyId} />
        <div className={styles.loadingShell} aria-busy="true" aria-hidden />
      </div>
    );
  }

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

  const showAnalytics = activePhase === 'analytics';
  const showDistribute = activePhase === 'distribute';

  return (
    <div className={styles.page}>
      <SurveyEditorPhaseTabs />
      {showAnalytics ? (
        <SurveyAnalyticsSubNav />
      ) : showDistribute ? (
        <SurveyDistributeSubNav surveyId={survey.id} />
      ) : (
        <SurveyEditorWorkspaceToolbar surveyId={survey.id} />
      )}
      {children}
    </div>
  );
}

export default function SurveyEditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <SurveyEditorPhaseProvider>
      <SurveyWorkspaceSectionsProvider>
        <SurveyAnalyticsViewProvider>
          <SurveyDistributeViewProvider>
            <SurveyEditorLayoutBody>{children}</SurveyEditorLayoutBody>
          </SurveyDistributeViewProvider>
        </SurveyAnalyticsViewProvider>
      </SurveyWorkspaceSectionsProvider>
    </SurveyEditorPhaseProvider>
  );
}
