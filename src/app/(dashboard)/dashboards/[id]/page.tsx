'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { DashboardDetailTabBar } from '@/components/dashboards/DashboardDetailTabBar';
import { DashboardDetailToolbar } from '@/components/dashboards/DashboardDetailToolbar';
import { DashboardFiltersPanel } from '@/components/dashboards/DashboardFiltersPanel';
import { DashboardFocusedPreview } from '@/components/dashboards/DashboardFocusedPreview';
import { DashboardPowerPointExportModal } from '@/components/dashboards/DashboardPowerPointExportModal';
import { DashboardSettingsModal } from '@/components/dashboards/DashboardSettingsModal';
import { DashboardShareModal } from '@/components/dashboards/DashboardShareModal';
import { AdvancedWidgetModal } from '@/components/dashboards/AdvancedWidgetModal';
import { QuestionBasedWidgetModal } from '@/components/dashboards/QuestionBasedWidgetModal';
import { SelectWidgetModal } from '@/components/dashboards/SelectWidgetModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import {
  DEFAULT_DESIGN_TYPOGRAPHY,
  type DesignTypographyOptions,
} from '@/components/dashboards/DashboardDesignSettingsTab';
import { getDashboardById } from '@/data/get-dashboard-by-id';
import { useDashboardSharing } from '@/hooks/useDashboardSharing';
import { useBiProductBasePath, withBiProductBasePath } from '@/hooks/useBiProductBasePath';
import {
  resolveDashboardSurvey,
  type SurveyListItem,
} from '@/data/mock-survey-folders';
import {
  DEFAULT_AI_INSIGHT_REFRESH_FREQUENCY,
  type AiInsightRefreshFrequency,
} from '@/data/mock-dashboard-ai-insights';
import {
  INITIAL_DASHBOARD_SAVED_FILTERS,
  type DashboardSavedFilter,
} from '@/data/mock-dashboard-filters';

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
  const [settingsTab, setSettingsTab] = useState('general');
  const [shareOpen, setShareOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedFilters, setSavedFilters] = useState<DashboardSavedFilter[]>(
    INITIAL_DASHBOARD_SAVED_FILTERS
  );
  const [sharing, setSharing] = useDashboardSharing(numericId);
  const [powerPointExportOpen, setPowerPointExportOpen] = useState(false);
  const [focusedPreviewOpen, setFocusedPreviewOpen] = useState(false);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [questionBasedWidgetOpen, setQuestionBasedWidgetOpen] = useState(false);
  const [questionBasedPresetSurvey, setQuestionBasedPresetSurvey] =
    useState<SurveyListItem | null>(null);
  const [advancedWidgetOpen, setAdvancedWidgetOpen] = useState(false);
  const [hasAddedWidget, setHasAddedWidget] = useState(false);
  const [designTypography, setDesignTypography] = useState<DesignTypographyOptions>(
    DEFAULT_DESIGN_TYPOGRAPHY
  );
  const [insightRefreshFrequency, setInsightRefreshFrequency] =
    useState<AiInsightRefreshFrequency>(DEFAULT_AI_INSIGHT_REFRESH_FREQUENCY);
  const [lastAiInsightsRefreshAt, setLastAiInsightsRefreshAt] = useState(
    '2026-08-27T06:30:00.000Z'
  );
  const [globalInsightRefreshVersion, setGlobalInsightRefreshVersion] = useState(0);
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

  const questionBasedDisabled = hasAddedWidget;

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashboardDetailToolbar
        key={`${numericId}-${name}`}
        name={name}
        onNameChange={setName}
        showPresentation
        onAddWidget={() => setAddWidgetOpen(true)}
        onOpenSettings={() => { setSettingsTab('general'); setSettingsOpen(true); }}
        onOpenShare={() => setShareOpen(true)}
        onExportPowerPoint={() => setPowerPointExportOpen(true)}
        onOpenPresentation={() => setFocusedPreviewOpen(true)}
        onToggleFilters={() => setFiltersOpen((current) => !current)}
        filtersOpen={filtersOpen}
      />

      <div id="dashboard-filter-panel">
        <DashboardFiltersPanel
          open={filtersOpen}
          onManageFilters={() => {
            setFiltersOpen(false);
            setSettingsTab('filters');
            setSettingsOpen(true);
          }}
          onSaveFilter={(filter) => {
            setSavedFilters((current) => [
              ...current.map((item) => filter.isDefault ? { ...item, isDefault: false } : item),
              filter,
            ]);
          }}
        />
      </div>

      {focusedPreviewOpen ? (
        <DashboardFocusedPreview
          open
          onOpenChange={setFocusedPreviewOpen}
          designTypography={designTypography}
        />
      ) : null}

      <DashboardPowerPointExportModal
        open={powerPointExportOpen}
        onOpenChange={setPowerPointExportOpen}
        dashboardName={name}
        designTypography={designTypography}
      />

      <DashboardShareModal open={shareOpen} onOpenChange={setShareOpen} dashboardId={numericId}
        dashboardName={name} settings={sharing.settings}
        enabled={sharing.enabled} onEnabledChange={(enabled) => setSharing((previous) => ({ ...previous, enabled }))}
        onSettingsChange={(settings) => setSharing((previous) => ({ ...previous, settings }))}
        onOpenSharedLinks={() => { setShareOpen(false); setSettingsTab('shared-url'); setSettingsOpen(true); }} />

      <DashboardSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        dashboardName={name}
        activeTab={settingsTab}
        onTabChange={setSettingsTab}
        dashboardId={numericId}
        sharedLinks={sharing.links}
        onSharedLinksChange={(links) => setSharing((previous) => ({ ...previous, links }))}
        onNameChange={setName}
        appliedDesignTypography={designTypography}
        onDesignTypographyChange={setDesignTypography}
        insightRefreshFrequency={insightRefreshFrequency}
        onInsightRefreshFrequencyChange={setInsightRefreshFrequency}
        lastAiInsightsRefreshAt={lastAiInsightsRefreshAt}
        onRegenerateInsights={() => {
          const refreshedAt = new Date().toISOString();
          setLastAiInsightsRefreshAt(refreshedAt);
          setGlobalInsightRefreshVersion((current) => current + 1);
        }}
        savedFilters={savedFilters}
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
        surveyId={
          resolveDashboardSurvey(dashboard.surveyId, dashboard.surveyName ?? 'QuestionPro - RE')
            .id
        }
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

      <DashboardDetailTabBar
        designTypography={designTypography}
        insightRefreshFrequency={insightRefreshFrequency}
        globalInsightRefreshVersion={globalInsightRefreshVersion}
        lastAiInsightsRefreshAt={lastAiInsightsRefreshAt}
        onInsightsRefreshed={setLastAiInsightsRefreshAt}
      />
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
