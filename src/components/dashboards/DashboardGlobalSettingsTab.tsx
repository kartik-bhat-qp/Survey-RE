'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardDataOrderingSwitcher } from '@/components/dashboards/DashboardDataOrderingSwitcher';
import {
  DECIMAL_PRECISION_OPTIONS,
  DEFAULT_DASHBOARD_GLOBAL_SETTINGS,
  type ChartMetric,
  type DataOrdering,
  type DecimalPrecisionOption,
} from '@/data/mock-dashboard-global-settings';
import styles from './DashboardGlobalSettingsTab.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuSwitcher = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSwitcher })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

const CHART_METRIC_OPTIONS: [
  { value: ChartMetric; label: string },
  { value: ChartMetric; label: string },
] = [
  { value: 'count', label: '#' },
  { value: 'percent', label: '%' },
];

export function DashboardGlobalSettingsTab() {
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

  return (
    <div className={styles.panel}>
      <div className={styles.columns}>
        <div className={styles.column}>
          <div className={styles.fieldRow}>
            <p className={styles.fieldLabel}>Chart metric</p>
            <WuSwitcher
              type="toggle"
              size="sm"
              value={chartMetric}
              options={CHART_METRIC_OPTIONS}
              onChange={(value) => setChartMetric(value as ChartMetric)}
            />
          </div>

          <div className={styles.fieldRowStacked}>
            <p className={styles.fieldLabel}>Decimal precision</p>
            <WuSelect
              data={DECIMAL_PRECISION_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={decimalPrecision}
              onSelect={(v) => setDecimalPrecision(v as DecimalPrecisionOption)}
              variant="outlined"
            />
          </div>

          <div className={styles.fieldRow}>
            <p className={styles.fieldLabel}>Data ordering</p>
            <DashboardDataOrderingSwitcher
              value={dataOrdering}
              onChange={setDataOrdering}
            />
          </div>
        </div>

        <div className={`${styles.column} ${styles.columnRight}`}>
          <div className={styles.fieldRow}>
            <WuToggle
              Label="Widget stats"
              labelPosition="left"
              checked={widgetStats}
              onChange={setWidgetStats}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
