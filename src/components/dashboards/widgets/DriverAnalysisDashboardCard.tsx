'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DriverAnalysisWidgetConfig } from '@/data/mock-ai-widgets';
import { DashboardWidgetCard } from '@/components/dashboards/widgets/DashboardWidgetCard';
import { DriverAnalysisWidget, SAMPLE_DRIVER_CONFIG } from '@/components/dashboards/widgets/DriverAnalysisWidget';
import styles from './DriverAnalysisWidget.module.css';
import panelStyles from './TimeSeriesDashboardCard.module.css';
import * as Dialog from '@radix-ui/react-dialog';
import { DriverScoringFields } from './DriverScoringFields';
import { DriverQuestionPicker } from './DriverQuestionPicker';
import { HeatMapSelect } from '../heat-map/HeatMapSelect';
import { driverCatalog, driverDefaultScoring, resolveDriverConfig, selectedDrivers } from '@/data/driver-scoring';
import { DEFAULT_DASHBOARD_SURVEY } from '@/data/mock-survey-folders';
import { TEXT_AI_KPI_METRICS, type TextAiKpiMetric, validateKpiScoring, type KpiScoring } from '@/data/mock-text-ai-kpi-by-theme';

import type { DashboardDesign } from '@/data/dashboard-design';
import type { AmChartTypography } from '@/components/charts/amcharts/theme';

interface DriverAnalysisDashboardCardProps {
  title: string;
  dashboardDesign?: DashboardDesign;
  typography?: AmChartTypography;
  dragHandleClassName?: string;
  shared?: boolean;
  insightCount?: number;
  onOpenInsights?: () => void;
  actions?: ReactNode;
  showDiamond?: boolean;
  driverAnalysis?: DriverAnalysisWidgetConfig;
  widgetId: string;
}

export function DriverAnalysisDashboardCard({
  title,
  dashboardDesign,
  typography,
  dragHandleClassName,
  shared = false,
  insightCount = 0,
  onOpenInsights,
  actions,
  showDiamond = false,
  driverAnalysis,
  widgetId,
}: DriverAnalysisDashboardCardProps) {
  const [saved] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(`driver-settings:${widgetId}`) ?? '{}') as { config?: DriverAnalysisWidgetConfig; metric?: TextAiKpiMetric; scoring?: KpiScoring; name?: string; showName?: boolean; filter?: string }; }
    catch { return {}; }
  });
  const [config, setConfig] = useState(() => saved.config?.outcome ? saved.config : driverAnalysis
    ? resolveDriverConfig(driverAnalysis, driverAnalysis.outcome?.surveyId ?? DEFAULT_DASHBOARD_SURVEY.id, [])
    : SAMPLE_DRIVER_CONFIG);
  const outcome = config?.outcome;
  const [scoring, setScoring] = useState<KpiScoring | null>(() => {
    if (!outcome) return null;
    const scores = outcome.answers.map(a => a.score);
    if (saved.scoring && !validateKpiScoring(saved.scoring, scores)) return saved.scoring;
    if (!saved.metric && config?.scoring && !validateKpiScoring(config.scoring, scores)) return config.scoring;
    const metric = TEXT_AI_KPI_METRICS.find(m => m.value === saved.metric)?.value ?? config?.metric ?? 'mean';
    return driverDefaultScoring(outcome, metric);
  });
  const [draft, setDraft] = useState(scoring);
  const [draftConfig, setDraftConfig] = useState(config);
  const surveyId = outcome?.surveyId ?? DEFAULT_DASHBOARD_SURVEY.id;
  const airline = Boolean(config?.airlineSample || outcome?.rowId.startsWith('airline-'));
  const choices = useMemo(() => driverCatalog(surveyId, airline), [surveyId, airline]);

  function updateAnalytics(nextConfig: DriverAnalysisWidgetConfig, nextScoring: KpiScoring) {
    setDraftConfig(nextConfig);
    setDraft(nextScoring);
    if (!nextConfig.outcome || !nextConfig.drivers.length || nextConfig.drivers.length > 10 || validateKpiScoring(nextScoring, nextConfig.outcome.answers.map(a => a.score))) return;
    setConfig({ ...nextConfig, scoring: nextScoring, metric: nextScoring.metric });
    setScoring(nextScoring);
  }

  function changePrimary(id: string) {
    const choice = choices.find(item => item.outcome.rowId === id);
    if (!choice || id === draftConfig?.outcome?.rowId) return;
    updateAnalytics({
      ...draftConfig, airlineSample: airline, outcome: choice.outcome,
      primaryQuestionCode: choice.code, primaryQuestionText: choice.outcome.label,
      drivers: (draftConfig?.drivers ?? []).filter(driver => driver.id !== id),
    }, driverDefaultScoring(choice.outcome, choice.metric));
  }
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'General' | 'Analytics' | 'Design'>('General');
  const [name, setName] = useState(saved.name ?? title);
  const [showName, setShowName] = useState(saved.showName ?? true);
  const [filter, setFilter] = useState(saved.filter ?? 'Dashboard');
  useEffect(() => { try { sessionStorage.setItem(`driver-settings:${widgetId}`, JSON.stringify({ config, metric: scoring?.metric, scoring, name, showName, filter })); } catch { /* Continue in memory. */ } }, [widgetId, config, scoring, name, showName, filter]);

  function openSettings(section: 'General' | 'Analytics') {
    setDraft(scoring);
    setDraftConfig(config);
    setTab(section);
    setOpen(true);
  }

  return (<>
    <DashboardWidgetCard
      title={showName ? name : ''}
      onEdit={shared ? undefined : () => openSettings('Analytics')}
      onOpenSettings={shared ? undefined : () => openSettings('General')}
      subtitle={`${outcome?.label ?? driverAnalysis?.primaryQuestionText ?? ''} · ${scoring?.name ?? 'Configuration required'}`}
      subtitleTitle={outcome?.label}
      dragHandleClassName={dragHandleClassName}
      shared={shared}
      insightCount={insightCount}
      onOpenInsights={onOpenInsights}
      showDiamond={showDiamond}
      actions={actions}
    >
      {config && scoring ? <DriverAnalysisWidget config={config} scoring={scoring} dashboardDesign={dashboardDesign} typography={typography} /> :
        <p>This widget needs a scored primary question and at least one driver.</p>}
    </DashboardWidgetCard>
    <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal><Dialog.Overlay className={panelStyles.overlay}/><Dialog.Content className={`${panelStyles.dialog} ${styles.settingsDialog}`} aria-describedby={undefined}>
      <section className={panelStyles.preview}><header><h3>{showName ? name : ''}</h3></header>{config && scoring && <DriverAnalysisWidget config={config} scoring={scoring} dashboardDesign={dashboardDesign} typography={typography} />}</section>
      <aside className={panelStyles.panel}><header className={panelStyles.panelHeader}><Dialog.Title>Settings</Dialog.Title><Dialog.Close aria-label="Close widget settings">×</Dialog.Close></header>
        <div className={panelStyles.tabs} role="tablist" aria-label="Widget settings">{(['General', 'Analytics', 'Design'] as const).map(value => <button type="button" key={value} role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>{value}</button>)}</div>
        <div className={panelStyles.panelBody} role="tabpanel">
          {tab === 'General' && <><label className={panelStyles.row}>Show widget name<input type="checkbox" checked={showName} onChange={event => setShowName(event.target.checked)} /></label><input className={panelStyles.name} aria-label="Widget name" value={name} onChange={event => setName(event.target.value)} /><h4>Filter options</h4><div className={panelStyles.field}>Filter type<HeatMapSelect label="Filter type" value={filter} options={['Dashboard', 'Widget', 'Combined', 'None']} onChange={setFilter} /></div><p>Filter configuration is illustrative in this prototype.</p></>}
          {tab === 'Analytics' && <DriverQuestionPicker choices={choices}
            selected={draftConfig?.outcome ? [draftConfig.outcome.rowId] : []}
            onChange={ids => changePrimary(ids[0])} />}
          {tab === 'Analytics' && draftConfig?.outcome && draft && <>
            <DriverQuestionPicker multiple choices={choices.filter(item => item.outcome.rowId !== draftConfig.outcome?.rowId)}
              selected={draftConfig.drivers.map(driver => driver.id)}
              onChange={ids => updateAnalytics({ ...draftConfig, drivers: selectedDrivers(choices, ids) }, draft)} />
            {!draftConfig.drivers.length && <p role="alert">Select at least one driver to apply your changes.</p>}
            <DriverScoringFields outcome={draftConfig.outcome} primaryScoring={draft}
              onPrimaryChange={next => updateAnalytics(draftConfig, next)} />
          </>}
          {tab === 'Design' && <p>This widget uses the dashboard design.</p>}
        </div>
      </aside>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </>);
}
