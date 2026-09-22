'use client';

import { useState, type ReactNode } from 'react';
import type { DriverAnalysisMode } from '@/data/mock-driver-analysis';
import type { DriverAnalysisWidgetConfig } from '@/data/mock-ai-widgets';
import { DashboardWidgetCard } from '@/components/dashboards/widgets/DashboardWidgetCard';
import { DriverAnalysisWidget } from '@/components/dashboards/widgets/DriverAnalysisWidget';
import styles from './DriverAnalysisWidget.module.css';

interface DriverAnalysisDashboardCardProps {
  title: string;
  dragHandleClassName?: string;
  shared?: boolean;
  insightCount?: number;
  onOpenInsights?: () => void;
  actions?: ReactNode;
  showDiamond?: boolean;
  driverAnalysis?: DriverAnalysisWidgetConfig;
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
}: DriverAnalysisDashboardCardProps) {
  const [mode, setMode] = useState<DriverAnalysisMode>('diagnose');

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
        className={`${styles.modeBtn} ${mode === 'predict' ? styles.modeBtnActive : ''}`}
        onClick={() => setMode('predict')}
      >
        Predict
      </button>
    </div>
  );

  return (
    <DashboardWidgetCard
      title={title}
      subtitle={driverAnalysis?.primaryQuestionText}
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
  );
}
