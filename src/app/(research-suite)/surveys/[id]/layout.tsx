'use client';

import { useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { SurveyAnalyticsSubNav } from '@/components/surveys/SurveyAnalyticsSubNav';
import { SurveyAnalyticsViewProvider } from '@/components/surveys/SurveyAnalyticsViewContext';
import { SurveyEditorPhaseProvider, useSurveyEditorPhase } from '@/components/surveys/SurveyEditorPhaseContext';
import { SurveyWorkspaceSectionsProvider } from '@/components/surveys/SurveyWorkspaceSectionsContext';
import { SurveyEditorBulkEditProvider, useSurveyEditorBulkEdit } from '@/components/surveys/SurveyEditorBulkEditContext';
import { SurveyEditorBulkEditToolbar } from '@/components/surveys/SurveyEditorBulkEditToolbar';
import { SurveyEditorPhaseTabs } from '@/components/surveys/SurveyEditorPhaseTabs';
import { SurveyDistributeSubNav } from '@/components/surveys/SurveyDistributeSubNav';
import { SurveyDistributeViewProvider } from '@/components/surveys/SurveyDistributeViewContext';
import { SurveyEditorWorkspaceToolbar } from '@/components/surveys/SurveyEditorWorkspaceToolbar';
import { getCanonicalDistributePath, getDefaultDistributeRouteState } from '@/components/surveys/survey-distribute-navigation';
import { getSurveyEditorPhasePath } from '@/components/surveys/survey-editor-navigation';
import { readVideoAiReturnState } from '@/components/video-ai/videoAiNavigation';
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
  const { bulkEditModeEnabled, disableBulkEditMode } = useSurveyEditorBulkEdit();

  useEffect(() => {
    if (!ready || !survey) return;

    const restored = readVideoAiReturnState();
    if (restored?.surveyId === survey.id) {
      router.replace(getSurveyEditorPhasePath(survey.id, 'analytics'));
      return;
    }

    if (
      pathname.includes('/advance-quotas') ||
      pathname.includes('/settings') ||
      pathname.includes('/languages')
    ) {
      if (activePhase === 'analytics') {
        router.replace(getSurveyEditorPhasePath(survey.id, 'analytics'));
        return;
      }
      if (activePhase === 'distribute') {
        router.replace(getCanonicalDistributePath(survey.id, getDefaultDistributeRouteState()));
      }
    }
  }, [activePhase, pathname, ready, router, survey]);

  useEffect(() => {
    if (activePhase !== 'edit' && bulkEditModeEnabled) {
      disableBulkEditMode();
    }
  }, [activePhase, bulkEditModeEnabled, disableBulkEditMode]);

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
        <>
          <SurveyEditorWorkspaceToolbar surveyId={survey.id} />
          {bulkEditModeEnabled ? <SurveyEditorBulkEditToolbar /> : null}
        </>
      )}
      {children}
    </div>
  );
}

export default function SurveyEditorLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const surveyId = Number(params.id);

  return (
    <SurveyEditorPhaseProvider surveyId={surveyId}>
      <SurveyEditorBulkEditProvider>
        <SurveyWorkspaceSectionsProvider>
          <SurveyAnalyticsViewProvider
            initialTab="dashboard"
            initialSubView="responses"
          >
            <SurveyDistributeViewProvider surveyId={surveyId}>
              <SurveyEditorLayoutBody>{children}</SurveyEditorLayoutBody>
            </SurveyDistributeViewProvider>
          </SurveyAnalyticsViewProvider>
        </SurveyWorkspaceSectionsProvider>
      </SurveyEditorBulkEditProvider>
    </SurveyEditorPhaseProvider>
  );
}
