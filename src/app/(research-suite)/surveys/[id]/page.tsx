'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { SurveyAdvanceQuotasDashboard } from '@/components/surveys/SurveyAdvanceQuotasDashboard';
import { SurveyEditorCanvas } from '@/components/surveys/SurveyEditorCanvas';
import { SurveyEditorPhaseTabs } from '@/components/surveys/SurveyEditorPhaseTabs';
import { SurveyEditorWorkspaceToolbar } from '@/components/surveys/SurveyEditorWorkspaceToolbar';
import type { SurveyWorkspaceTool } from '@/components/surveys/survey-workspace-tools';
import { EmptyState } from '@/components/ui/EmptyState';
import { getSurveyById } from '@/data/get-survey-by-id';
import { getSurveyDetail } from '@/data/mock-survey-detail';
import styles from './SurveyEditorPage.module.css';

export default function SurveyEditorPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const survey = getSurveyById(surveyId);
  const [activeTool, setActiveTool] = useState<SurveyWorkspaceTool>('workspace');

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

  const detail = getSurveyDetail(survey);

  return (
    <div className={styles.page}>
      <SurveyEditorPhaseTabs />
      <SurveyEditorWorkspaceToolbar activeTool={activeTool} onToolChange={setActiveTool} />
      {activeTool === 'advance-quotas' ? (
        <SurveyAdvanceQuotasDashboard />
      ) : (
        <SurveyEditorCanvas detail={detail} />
      )}
    </div>
  );
}
