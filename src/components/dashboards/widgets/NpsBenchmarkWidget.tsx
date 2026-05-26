'use client';

import { BiAmChart } from '@/components/charts/amcharts/BiAmChart';
import type { AiWidgetChartPayload } from '@/components/charts/amcharts/types';
import styles from './NpsBenchmarkWidget.module.css';

interface NpsBenchmarkWidgetProps {
  widgetId: string;
  chartPayload: AiWidgetChartPayload;
}

export function NpsBenchmarkWidget({ widgetId, chartPayload }: NpsBenchmarkWidgetProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.chart}>
        <BiAmChart widgetId={widgetId} chartType="benchmark" data={chartPayload} />
      </div>
      <p className={styles.footer}>
        Response count{' '}
        <strong>{chartPayload.npsBenchmarkResponseCount.toLocaleString()}</strong>
      </p>
    </div>
  );
}
