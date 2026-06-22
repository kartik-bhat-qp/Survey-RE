'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { AiDashboardCanvas } from '@/components/dashboards/AiDashboardCanvas';
import { DashboardDetailToolbar } from '@/components/dashboards/DashboardDetailToolbar';
import { DashboardSettingsModal } from '@/components/dashboards/DashboardSettingsModal';
import { AdvancedWidgetModal } from '@/components/dashboards/AdvancedWidgetModal';
import { QuestionBasedWidgetModal } from '@/components/dashboards/QuestionBasedWidgetModal';
import { SelectWidgetModal } from '@/components/dashboards/SelectWidgetModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { getDashboardById } from '@/data/get-dashboard-by-id';
import { useBiProductBasePath, withBiProductBasePath } from '@/hooks/useBiProductBasePath';
import {
  resolveDashboardSurvey,
  type SurveyListItem,
} from '@/data/mock-survey-folders';
import tabStyles from './DashboardDetailTabs.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

function DashboardDetailContent({ numericId }: { numericId: number }) {
  const router = useRouter();
  const basePath = useBiProductBasePath();
  const dashboardsPath = withBiProductBasePath(basePath, '/dashboards');
  const { showToast } = useWuShowToast();
  const dashboard = getDashboardById(numericId);
  const [name, setName] = useState(dashboard?.name ?? 'Untitled');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [questionBasedWidgetOpen, setQuestionBasedWidgetOpen] = useState(false);
  const [questionBasedPresetSurvey, setQuestionBasedPresetSurvey] =
    useState<SurveyListItem | null>(null);
  const [advancedWidgetOpen, setAdvancedWidgetOpen] = useState(false);
  const [hasAddedWidget, setHasAddedWidget] = useState(false);
  if (!dashboard) {
    return (
      <PageContainer>
        <EmptyState
          icon="wm-dashboard"
          title="Dashboard cannot be loaded."
          description="This dashboard may have been deleted or you do not have access."
          action={
            <Link href={dashboardsPath}>
              <WuButton>Back to dashboards</WuButton>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  const isAiDashboard = dashboard.type === 'ai';
  const questionBasedDisabled = isAiDashboard || hasAddedWidget;

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashboardDetailToolbar
        key={numericId}
        name={name}
        onNameChange={setName}
        showPresentation={isAiDashboard}
        onAddWidget={() => setAddWidgetOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <DashboardSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        dashboardName={name}
        onNameChange={setName}
        onDelete={() => {
          showToast({
            message: `Dashboard '${name}' deleted successfully`,
            variant: 'success',
          });
          router.push(dashboardsPath);
        }}
      />

      <SelectWidgetModal
        open={addWidgetOpen}
        onOpenChange={setAddWidgetOpen}
        surveyName={dashboard.surveyName ?? 'QuestionPro - RE'}
        questionBasedDisabled={questionBasedDisabled}
        onSelectQuestionBased={() => {
          setQuestionBasedPresetSurvey(null);
          setQuestionBasedWidgetOpen(true);
        }}
        onContinueWithSurvey={() => {
          setQuestionBasedPresetSurvey(
            resolveDashboardSurvey(dashboard.surveyId, dashboard.surveyName ?? 'QuestionPro - RE')
          );
          setQuestionBasedWidgetOpen(true);
        }}
        onSelectAdvanced={() => setAdvancedWidgetOpen(true)}
      />

      <AdvancedWidgetModal
        open={advancedWidgetOpen}
        onOpenChange={setAdvancedWidgetOpen}
        onWidgetAdded={() => setHasAddedWidget(true)}
      />

      <QuestionBasedWidgetModal
        open={questionBasedWidgetOpen}
        onOpenChange={(open) => {
          setQuestionBasedWidgetOpen(open);
          if (!open) setQuestionBasedPresetSurvey(null);
        }}
        presetSurvey={questionBasedPresetSurvey}
        onAddWidget={() => setHasAddedWidget(true)}
      />

      {isAiDashboard ? (
        <AiDashboardCanvas />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8 text-center min-h-0">
          <span className="wm-dashboard text-5xl text-gray-300 mb-4" />
          <h2 className="text-lg font-medium text-gray-900">Add your first widget</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-md">
            Fill your dashboard with customizable widgets based on your survey data
          </p>
          <WuButton
            className="mt-6"
            onClick={() => setAddWidgetOpen(true)}
            Icon={<span className="wm-add-2" />}
          >
            Add widget
          </WuButton>
        </div>
      )}

      <div className={tabStyles.tabBar}>
        <button
          type="button"
          className="shrink-0 rounded border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm"
        >
          Tab-1
        </button>
        <WuButton
          size="sm"
          variant="secondary"
          className="shrink-0"
          Icon={<span className="wm-add" />}
          onClick={() => setAddWidgetOpen(true)}
          aria-label="Add tab"
        />
      </div>
    </div>
  );
}

export default function DashboardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numericId = Number(id);

  return <DashboardDetailContent key={numericId} numericId={numericId} />;
}
