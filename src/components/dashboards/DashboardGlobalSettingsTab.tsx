'use client';

import { useState, type ReactNode } from 'react';
import { DataOrderingDefaultIcon, DataOrderingAscendingIcon, DataOrderingDescendingIcon } from './DashboardDataOrderingIcons';
import dynamic from 'next/dynamic';
import {
  DECIMAL_PRECISION_OPTIONS,
  DEFAULT_DASHBOARD_GLOBAL_SETTINGS,
  type ChartMetric,
  type DataOrdering,
  type DecimalPrecisionOption,
} from '@/data/mock-dashboard-global-settings';
import styles from './DashboardGlobalSettingsTab.module.css';
import { ReportingYearSettings, type ReportingYearSettingsProps } from './ReportingYearSettings';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

const CHART_METRIC_OPTIONS: { value: ChartMetric; label: string; icon: ReactNode }[] = [
  { value: 'count', label: 'Count', icon: <span className={styles.optionIcon} aria-hidden>#</span> },
  { value: 'percent', label: 'Percentage', icon: <span className={styles.optionIcon} aria-hidden>%</span> },
];
const DATA_ORDERING_OPTIONS: { value: DataOrdering; label: string; icon: ReactNode }[] = [
  { value: 'none', label: 'Default', icon: <DataOrderingDefaultIcon size={16} /> },
  { value: 'ascending', label: 'Ascending', icon: <DataOrderingAscendingIcon size={16} /> },
  { value: 'descending', label: 'Descending', icon: <DataOrderingDescendingIcon size={16} /> },
];

export function DashboardGlobalSettingsTab(props: ReportingYearSettingsProps) {
  const [chartMetric, setChartMetric] = useState<ChartMetric>(
    DEFAULT_DASHBOARD_GLOBAL_SETTINGS.chartMetric
  );
  const [decimalPrecision, setDecimalPrecision] = useState<DecimalPrecisionOption>(
    DEFAULT_DASHBOARD_GLOBAL_SETTINGS.decimalPrecision
  );
  const [dataOrdering, setDataOrdering] = useState<DataOrdering>(
    DEFAULT_DASHBOARD_GLOBAL_SETTINGS.dataOrdering
  );
  const [widgetStats, setWidgetStats] = useState(
    DEFAULT_DASHBOARD_GLOBAL_SETTINGS.widgetStats
  );

  const selectedMetric = CHART_METRIC_OPTIONS.find(option => option.value === chartMetric)!;
  const selectedOrdering = DATA_ORDERING_OPTIONS.find(option => option.value === dataOrdering)!;

  return (
    <div className={styles.panel}>
      <ReportingYearSettings {...props} />
      <div className={styles.columns}>
        <div className={styles.column}>
          <div className={styles.fieldRow}>
            <p className={styles.fieldLabel}>Chart metric</p>
            <div className={styles.compactSelect}><WuSelect
              aria-label="Chart metric"
              data={CHART_METRIC_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={selectedMetric}
              CustomTrigger={<span className={styles.selectedOption}>{selectedMetric.icon}{selectedMetric.label}</span>}
              onSelect={option => setChartMetric((option as { value: ChartMetric }).value)}
              variant="outlined"
            /></div>
          </div>

          <div className={styles.fieldRow}>
            <p className={styles.fieldLabel}>Decimal precision</p>
            <div className={styles.precisionSelect}><WuSelect
              aria-label="Decimal precision"
              data={DECIMAL_PRECISION_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={decimalPrecision}
              onSelect={(v) => setDecimalPrecision(v as DecimalPrecisionOption)}
              variant="outlined"
            /></div>
          </div>

          <div className={styles.fieldRow}>
            <p className={styles.fieldLabel}>Data ordering</p>
            <div className={styles.compactSelect}><WuSelect
              aria-label="Data ordering"
              data={DATA_ORDERING_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={selectedOrdering}
              CustomTrigger={<span className={styles.selectedOption}>{selectedOrdering.icon}{selectedOrdering.label}</span>}
              onSelect={option => setDataOrdering((option as { value: DataOrdering }).value)}
              variant="outlined"
            /></div>
          </div>
        </div>

        <div className={`${styles.column} ${styles.columnRight}`}>
          <div className={styles.fieldRow}>
            <p className={styles.fieldLabel}>Widget stats</p>
            <WuToggle
              aria-label="Widget stats"
              checked={widgetStats}
              onChange={setWidgetStats}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
