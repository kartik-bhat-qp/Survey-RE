'use client';

import { MOCK_DATA_SLICERS, type DataSlicer } from '@/data/mock-data-slicers';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { DashboardDetailTabBar } from '@/components/dashboards/DashboardDetailTabBar';
import { DashboardDetailToolbar } from '@/components/dashboards/DashboardDetailToolbar';
import { HEAT_MAP_DASHBOARD_FILTER_QUESTIONS, type DashboardActiveFilter } from '@/data/mock-dashboard-filters';
import { DashboardFiltersPanel } from '@/components/dashboards/DashboardFiltersPanel';
import { DashboardFocusedPreview } from '@/components/dashboards/DashboardFocusedPreview';
import { DashboardPowerPointExportModal } from '@/components/dashboards/DashboardPowerPointExportModal';
import { DashboardSettingsModal } from '@/components/dashboards/DashboardSettingsModal';
import { DashboardShareModal } from '@/components/dashboards/DashboardShareModal';
import type { AdvancedHeatmapConfig } from '@/data/advanced-heatmap';
import { AdvancedWidgetModal } from '@/components/dashboards/AdvancedWidgetModal';
import { QuestionBasedWidgetModal } from '@/components/dashboards/QuestionBasedWidgetModal';
import { BuilderDialog } from '@/components/dashboards/ai-builder/BuilderDialog';
import type { BuiltWidget } from '@/data/ai-widget-builder';
import { SelectWidgetModal } from '@/components/dashboards/SelectWidgetModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import {
  type DesignTypographyOptions,
} from '@/components/dashboards/DashboardDesignSettingsTab';
import { getDashboardById } from '@/data/get-dashboard-by-id';
import { useDashboardReportingYear } from '@/hooks/useDashboardReportingYear';
import { resolveReportingYearSelection } from '@/data/dashboard-reporting-year';
import { useDashboardDesign } from '@/hooks/useDashboardDesign';
import { useDashboardSharing } from '@/hooks/useDashboardSharing';
import { useBiProductBasePath, withBiProductBasePath } from '@/hooks/useBiProductBasePath';
import {
  resolveDashboardSurvey,
  type SurveyListItem,
} from '@/data/mock-survey-folders';
import {
  DEFAULT_AI_INSIGHT_REFRESH_FREQUENCY,
  isAiInsightRefreshFrequency,
  type AiInsightRefreshFrequency,
  type DashboardInsightRegenerationResult,
} from '@/data/mock-dashboard-ai-insights';
import { AI_DASHBOARD_WIDGETS, type AiWidgetConfig } from '@/data/mock-ai-widgets';
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
  const refreshFrequencyStorageKey = `survey-re:dashboard:${numericId}:ai-insight-refresh-frequency`;
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
  const [advancedHeatmaps, setAdvancedHeatmaps] = useState<(AdvancedHeatmapConfig & { tabId: string })[]>([]);
  const [activeWidgetTab, setActiveWidgetTab] = useState('tab-1');
  const [aiBuilderOpen, setAiBuilderOpen] = useState(false);
  const [builtWidgets, setBuiltWidgets] = useState<BuiltWidget[]>([]);
  const [advancedWidgetOpen, setAdvancedWidgetOpen] = useState(false);
  useEffect(() => {
    let session: string | undefined;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function checkSession() {
      try {
        const response = await fetch('/api/ai-widget-session', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) return;
        const result: unknown = await response.json();
        if (cancelled || !result || typeof result !== 'object' || !('session' in result) || typeof result.session !== 'string') return;
        if (session && session !== result.session) {
          setBuiltWidgets([]);
          setAiBuilderOpen(false);
        }
        session = result.session;
      } catch { /* Recheck when the local server is reachable again. */ }
      finally { if (!cancelled) timer = setTimeout(checkSession, 5000); }
    }
    void checkSession();
    return () => { cancelled = true; controller.abort(); clearTimeout(timer); };
  }, []);

  const [hasAddedWidget, setHasAddedWidget] = useState(false);
  const [dataSlicers,setDataSlicers]=useState<DataSlicer[]>(MOCK_DATA_SLICERS);
  const [dashboardFilter, setDashboardFilter] = useState<DashboardActiveFilter>();
  const [reportingYearSetting, setReportingYearSetting] = useDashboardReportingYear(numericId);
  const effectiveDates = resolveReportingYearSelection(dashboardFilter?.dateSelection, reportingYearSetting);
  const effectiveDashboardFilter: DashboardActiveFilter = {
    hasCriteria: false, questionId: '', operator: 'is', value: '', responseStatus: 'all',
    ...dashboardFilter,
    dateSelection: effectiveDates,
    dateRange: effectiveDates.startDate && effectiveDates.endDate ? `${effectiveDates.startDate} – ${effectiveDates.endDate}` : '',
  };
  const [dashboardDesign, setDashboardDesign] = useDashboardDesign(numericId);
  const designTypography = dashboardDesign.typography;
  const setDesignTypography = (typography: DesignTypographyOptions) => setDashboardDesign({ ...dashboardDesign, typography });
  const [addedWidgets, setAddedWidgets] = useState<AiWidgetConfig[]>([]);
  const [insightRefreshFrequency, setInsightRefreshFrequency] =
    useState<AiInsightRefreshFrequency>(() => {
      if (typeof window === 'undefined') return DEFAULT_AI_INSIGHT_REFRESH_FREQUENCY;
      const storedFrequency = window.localStorage.getItem(refreshFrequencyStorageKey);
      return isAiInsightRefreshFrequency(storedFrequency)
        ? storedFrequency
        : DEFAULT_AI_INSIGHT_REFRESH_FREQUENCY;
    });
  const [lastAiInsightsRefreshAt, setLastAiInsightsRefreshAt] = useState(
    '2026-09-01T06:30:00.000Z'
  );
  const [globalInsightRefreshVersion, setGlobalInsightRefreshVersion] = useState(0);
  const [globalInsightRefreshTargetWidgetIds, setGlobalInsightRefreshTargetWidgetIds] =
    useState<string[]>();
  const [globalInsightRefreshFailedWidgetIds, setGlobalInsightRefreshFailedWidgetIds] =
    useState<string[]>([]);
  const [hasSimulatedPartialRefresh, setHasSimulatedPartialRefresh] = useState(false);

  const updateInsightRefreshFrequency = (frequency: AiInsightRefreshFrequency): void => {
    setInsightRefreshFrequency(frequency);
    window.localStorage.setItem(refreshFrequencyStorageKey, frequency);
  };

  const runDashboardInsightRefresh = (
    targetWidgetIds: string[],
    failedWidgetIds: string[]
  ): DashboardInsightRegenerationResult => {
    const completedAt = new Date().toISOString();
    setGlobalInsightRefreshTargetWidgetIds(targetWidgetIds);
    setGlobalInsightRefreshFailedWidgetIds(failedWidgetIds);
    setLastAiInsightsRefreshAt(completedAt);
    setGlobalInsightRefreshVersion((current) => current + 1);
    return {
      attemptedCount: targetWidgetIds.length,
      refreshedCount: targetWidgetIds.length - failedWidgetIds.length,
      failedWidgetIds,
      failedWidgetTitles: failedWidgetIds.map(
        (widgetId) => AI_DASHBOARD_WIDGETS.find((widget) => widget.id === widgetId)?.title ?? widgetId
      ),
      completedAt,
    };
  };
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
        onAddWidget={() => {
          if (activeWidgetTab.startsWith('report-')) { showToast({ message: 'Select a dashboard tab to add a widget. External report tabs cannot contain widgets.', variant: 'info' }); return; }
          setAddWidgetOpen(true);
        }}
        onOpenSettings={() => { setSettingsTab('general'); setSettingsOpen(true); }}
        onOpenShare={() => setShareOpen(true)}
        onExportPowerPoint={() => setPowerPointExportOpen(true)}
        onOpenPresentation={() => setFocusedPreviewOpen(true)}
        onToggleFilters={() => setFiltersOpen((current) => !current)}
        filtersOpen={filtersOpen}
      />

      <div id="dashboard-filter-panel">
        <DashboardFiltersPanel
          reportingYearEnabled={reportingYearSetting.enabled}
          onFilterChange={setDashboardFilter}
          extraQuestions={HEAT_MAP_DASHBOARD_FILTER_QUESTIONS}
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

      <DashboardSettingsModal reportingYearSetting={reportingYearSetting} onReportingYearChange={setReportingYearSetting} dataSlicers={dataSlicers} onDataSlicersChange={setDataSlicers}
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
        appliedDesign={dashboardDesign}
        onDesignChange={setDashboardDesign}
        onDesignTypographyChange={setDesignTypography}
        insightRefreshFrequency={insightRefreshFrequency}
        onInsightRefreshFrequencyChange={updateInsightRefreshFrequency}
        lastAiInsightsRefreshAt={lastAiInsightsRefreshAt}
        failedInsightWidgetIds={globalInsightRefreshFailedWidgetIds}
        onRegenerateInsights={() => {
          const failedWidgetIds = hasSimulatedPartialRefresh ? [] : ['w-segment-trend'];
          setHasSimulatedPartialRefresh(true);
          return runDashboardInsightRefresh(
            AI_DASHBOARD_WIDGETS.map((widget) => widget.id),
            failedWidgetIds
          );
        }}
        onRetryFailedInsights={(widgetIds) => runDashboardInsightRefresh(widgetIds, [])}
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
        onSelectAi={() => setAiBuilderOpen(true)}
      />

      {aiBuilderOpen && <BuilderDialog tabId={activeWidgetTab} onClose={() => setAiBuilderOpen(false)} onSave={widget => { setBuiltWidgets(items => [...items, widget]); setAiBuilderOpen(false); setHasAddedWidget(true); showToast({ message: 'Placeholder widget added. Available in Advanced widgets for this session.', variant: 'success' }); }} />}

      <AdvancedWidgetModal
        builtWidgets={builtWidgets}
        onReuseBuiltWidget={widget => { setBuiltWidgets(items => [...items, { ...widget, id: `ai-${crypto.randomUUID()}`, tabId: activeWidgetTab }]); setAdvancedWidgetOpen(false); }}
        onAdvancedHeatmapCreated={config => setAdvancedHeatmaps(items => [...items, { ...config, tabId: activeWidgetTab }])}
        open={advancedWidgetOpen}
        onOpenChange={setAdvancedWidgetOpen}
        surveyId={
          resolveDashboardSurvey(dashboard.surveyId, dashboard.surveyName ?? 'QuestionPro - RE')
            .id
        }
        onWidgetAdded={(widget) => {
          setHasAddedWidget(true);
          if (widget) setAddedWidgets((current) => [...current, widget.questionStack ? {...widget,questionStack:{...widget.questionStack,tabId:activeWidgetTab}} : widget]);
        }}
      />

      <QuestionBasedWidgetModal
        open={questionBasedWidgetOpen}
        onOpenChange={(open) => {
          setQuestionBasedWidgetOpen(open);
          if (!open) setQuestionBasedPresetSurvey(null);
        }}
        onStackWidgetAdded={widget=>setAddedWidgets(current=>[...current,{...widget,questionStack:widget.questionStack?{...widget.questionStack,tabId:activeWidgetTab}:undefined}])}
        presetSurvey={questionBasedPresetSurvey}
        onAddWidget={() => setHasAddedWidget(true)}
      />

      <DashboardDetailTabBar dataSlicers={dataSlicers}
        builtWidgets={builtWidgets}
        onBuiltWidgetChange={widget => setBuiltWidgets(items => items.map(item => item.id === widget.id ? widget : item))}
        dashboardName={name}
        advancedHeatmaps={advancedHeatmaps}
        onAdvancedHeatmapChange={config => setAdvancedHeatmaps(items => items.map(item => item.id === config.id ? { ...config, tabId: item.tabId } : item))}
        onActiveTabChange={setActiveWidgetTab}
        dashboardDesign={dashboardDesign}
        dashboardFilter={effectiveDashboardFilter}
        dashboardId={numericId}
        designTypography={designTypography}
        insightRefreshFrequency={insightRefreshFrequency}
        globalInsightRefreshVersion={globalInsightRefreshVersion}
        globalInsightRefreshTargetWidgetIds={globalInsightRefreshTargetWidgetIds}
        globalInsightRefreshFailedWidgetIds={globalInsightRefreshFailedWidgetIds}
        lastAiInsightsRefreshAt={lastAiInsightsRefreshAt}
        onInsightsRefreshed={(widgetId) =>
          setGlobalInsightRefreshFailedWidgetIds((current) =>
            current.filter((failedWidgetId) => failedWidgetId !== widgetId)
          )
        }
        addedWidgets={addedWidgets}
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
