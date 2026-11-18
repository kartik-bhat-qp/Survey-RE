'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { DriverAnalysisMode } from '@/data/mock-driver-analysis';
import type { DriverAnalysisWidgetConfig } from '@/data/mock-ai-widgets';
import { DashboardWidgetCard } from '@/components/dashboards/widgets/DashboardWidgetCard';
import { DriverAnalysisWidget } from '@/components/dashboards/widgets/DriverAnalysisWidget';
import styles from './DriverAnalysisWidget.module.css';
import panelStyles from './TimeSeriesDashboardCard.module.css';
import * as Dialog from '@radix-ui/react-dialog';
import { TEXT_AI_KPI_METRICS, type TextAiKpiMetric } from '@/data/mock-text-ai-kpi-by-theme';

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
    try { return JSON.parse(sessionStorage.getItem(`driver-settings:${widgetId}`) ?? '{}') as { metric?: TextAiKpiMetric; name?: string; showName?: boolean; filter?: string }; }
    catch { return {}; }
  });
  const [metric, setMetric] = useState<TextAiKpiMetric>(TEXT_AI_KPI_METRICS.some(item => item.value === saved.metric) ? saved.metric! : driverAnalysis?.metric ?? 'nps');
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'General' | 'Analytics' | 'Design'>('General');
  const [name, setName] = useState(saved.name ?? title);
  const [showName, setShowName] = useState(saved.showName ?? true);
  const [filter, setFilter] = useState(saved.filter ?? 'Dashboard');
  useEffect(() => { try { sessionStorage.setItem(`driver-settings:${widgetId}`, JSON.stringify({ metric, name, showName, filter })); } catch { /* Continue in memory. */ } }, [widgetId, metric, name, showName, filter]);

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
        disabled={metric !== 'nps'}
        title={metric !== 'nps' ? 'Prediction is available only for the sample NPS model.' : undefined}
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
      onOpenSettings={() => { setTab('General'); setOpen(true); }}
      subtitle={`${driverAnalysis?.primaryQuestionText ?? 'NPS (sample)'} · ${TEXT_AI_KPI_METRICS.find(item => item.value === metric)?.label}`}
      subtitleTitle={driverAnalysis?.primaryQuestionText}
      dragHandleClassName={dragHandleClassName}
      shared={shared}
      insightCount={insightCount}
      onOpenInsights={onOpenInsights}
      showDiamond={showDiamond}
      headerExtra={modeToggle}
      actions={actions}
    >
      <DriverAnalysisWidget
        mode={mode}
        onModeChange={setMode}
        showModeToggle={false}
        selectedDrivers={driverAnalysis?.drivers}
      />
    </DashboardWidgetCard>
    <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal><Dialog.Overlay className={panelStyles.overlay}/><Dialog.Content className={panelStyles.dialog} aria-describedby={undefined}>
      <section className={panelStyles.preview}><header><h3>{showName ? name : ''}</h3></header><DriverAnalysisWidget mode="diagnose" showModeToggle={false} selectedDrivers={driverAnalysis?.drivers} /></section>
      <aside className={panelStyles.panel}><header className={panelStyles.panelHeader}><Dialog.Title>Settings</Dialog.Title><Dialog.Close aria-label="Close widget settings">×</Dialog.Close></header>
        <div className={panelStyles.tabs} role="tablist" aria-label="Widget settings">{(['General', 'Analytics', 'Design'] as const).map(value => <button type="button" key={value} role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>{value}</button>)}</div>
        <div className={panelStyles.panelBody} role="tabpanel">
          {tab === 'General' && <><label className={panelStyles.row}>Show widget name<input type="checkbox" checked={showName} onChange={event => setShowName(event.target.checked)} /></label><input className={panelStyles.name} aria-label="Widget name" value={name} onChange={event => setName(event.target.value)} /><h4>Filter options</h4><label className={panelStyles.field}>Filter type<select value={filter} onChange={event => setFilter(event.target.value)}>{['Dashboard', 'Widget', 'Combined', 'None'].map(option => <option key={option}>{option}</option>)}</select></label><p>Filter configuration is illustrative in this prototype.</p></>}
          {tab === 'Analytics' && <><label className={panelStyles.field}>Impact question<input readOnly value={driverAnalysis?.primaryQuestionText ?? 'NPS (sample)'} /></label><label className={panelStyles.field}>Metric type<select value={metric} onChange={event => { setMetric(event.target.value as TextAiKpiMetric); setMode('diagnose'); }}>{TEXT_AI_KPI_METRICS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><p>Metric selection is illustrative. Driver values are sample data and are not recalculated.</p></>}
          {tab === 'Design' && <p>This widget uses the dashboard design.</p>}
        </div>
      </aside>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </>);
}
