'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DriverAnalysisMode } from '@/data/mock-driver-analysis';
import type { DriverAnalysisWidgetConfig } from '@/data/mock-ai-widgets';
import { DashboardWidgetCard } from '@/components/dashboards/widgets/DashboardWidgetCard';
import { DriverAnalysisWidget, SAMPLE_DRIVER_CONFIG } from '@/components/dashboards/widgets/DriverAnalysisWidget';
import styles from './DriverAnalysisWidget.module.css';
import panelStyles from './TimeSeriesDashboardCard.module.css';
import * as Dialog from '@radix-ui/react-dialog';
import { DriverScoringFields } from './DriverScoringFields';
import { driverDefaultScoring, resolveDriverConfig } from '@/data/driver-scoring';
import { DEFAULT_DASHBOARD_SURVEY } from '@/data/mock-survey-folders';
import { TEXT_AI_KPI_METRICS, type TextAiKpiMetric, validateKpiScoring, type KpiScoring } from '@/data/mock-text-ai-kpi-by-theme';

interface DriverAnalysisDashboardCardProps {
  title: string;
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
  dragHandleClassName,
  shared = false,
  insightCount = 0,
  onOpenInsights,
  actions,
  showDiamond = false,
  driverAnalysis,
  widgetId,
}: DriverAnalysisDashboardCardProps) {
  const [mode, setMode] = useState<DriverAnalysisMode>('diagnose');
  const [saved] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(`driver-settings:${widgetId}`) ?? '{}') as { metric?: TextAiKpiMetric; scoring?: KpiScoring; name?: string; showName?: boolean; filter?: string }; }
    catch { return {}; }
  });
  const config = useMemo(() => driverAnalysis
    ? resolveDriverConfig(driverAnalysis, driverAnalysis.outcome?.surveyId ?? DEFAULT_DASHBOARD_SURVEY.id, [])
    : SAMPLE_DRIVER_CONFIG, [driverAnalysis]);
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
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'General' | 'Analytics' | 'Design'>('General');
  const [name, setName] = useState(saved.name ?? title);
  const [showName, setShowName] = useState(saved.showName ?? true);
  const [filter, setFilter] = useState(saved.filter ?? 'Dashboard');
  useEffect(() => { try { sessionStorage.setItem(`driver-settings:${widgetId}`, JSON.stringify({ metric: scoring?.metric, scoring, name, showName, filter })); } catch { /* Continue in memory. */ } }, [widgetId, scoring, name, showName, filter]);

  const modeToggle = (
    <div className={styles.modeToggle} role="tablist" aria-label="Driver analysis mode">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'diagnose'}
        className={`${styles.modeBtn} ${mode === 'diagnose' ? styles.modeBtnActive : ''}`}
        onClick={() => setMode('diagnose')}
      >
        Diagnose
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'predict'}
        disabled={!config || !scoring}
        className={`${styles.modeBtn} ${mode === 'predict' ? styles.modeBtnActive : ''}`}
        onClick={() => setMode('predict')}
      >
        Predict
      </button>
    </div>
  );

  return (<>
    <DashboardWidgetCard
      title={showName ? name : ''}
      onOpenSettings={shared ? undefined : () => { setDraft(scoring); setTab('General'); setOpen(true); }}
      subtitle={`${outcome?.label ?? driverAnalysis?.primaryQuestionText ?? ''} · ${scoring?.name ?? 'Configuration required'}`}
      subtitleTitle={driverAnalysis?.primaryQuestionText}
      dragHandleClassName={dragHandleClassName}
      shared={shared}
      insightCount={insightCount}
      onOpenInsights={onOpenInsights}
      showDiamond={showDiamond}
      headerExtra={modeToggle}
      actions={actions}
    >
      {config && scoring ? <DriverAnalysisWidget key={JSON.stringify(scoring)} config={config} scoring={scoring} mode={mode} /> :
        <p>This saved selection has no supported score scale. Recreate the widget with scored questions.</p>}
    </DashboardWidgetCard>
    <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal><Dialog.Overlay className={panelStyles.overlay}/><Dialog.Content className={panelStyles.dialog} aria-describedby={undefined}>
      <section className={panelStyles.preview}><header><h3>{showName ? name : ''}</h3></header>{config && scoring && <DriverAnalysisWidget config={config} scoring={scoring} mode="diagnose" />}</section>
      <aside className={panelStyles.panel}><header className={panelStyles.panelHeader}><Dialog.Title>Settings</Dialog.Title><Dialog.Close aria-label="Close widget settings">×</Dialog.Close></header>
        <div className={panelStyles.tabs} role="tablist" aria-label="Widget settings">{(['General', 'Analytics', 'Design'] as const).map(value => <button type="button" key={value} role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>{value}</button>)}</div>
        <div className={panelStyles.panelBody} role="tabpanel">
          {tab === 'General' && <><label className={panelStyles.row}>Show widget name<input type="checkbox" checked={showName} onChange={event => setShowName(event.target.checked)} /></label><input className={panelStyles.name} aria-label="Widget name" value={name} onChange={event => setName(event.target.value)} /><h4>Filter options</h4><label className={panelStyles.field}>Filter type<select value={filter} onChange={event => setFilter(event.target.value)}>{['Dashboard', 'Widget', 'Combined', 'None'].map(option => <option key={option}>{option}</option>)}</select></label><p>Filter configuration is illustrative in this prototype.</p></>}
          {tab === 'Analytics' && outcome && draft && <DriverScoringFields outcome={outcome} value={draft}
            onChange={next => {
              setDraft(next);
              if (!validateKpiScoring(next, outcome.answers.map(a => a.score))) {
                setScoring(next);
                setMode('diagnose');
              }
            }} />}
          {tab === 'Design' && <p>This widget uses the dashboard design.</p>}
        </div>
      </aside>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </>);
}
