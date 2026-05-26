'use client';

import { useMemo } from 'react';
import { BiAmChart } from '@/components/charts/amcharts/BiAmChart';
import {
  buildSingleSelectPreviewPayload,
  singleSelectChartToAmChartType,
} from '@/data/mock-single-select-preview';
import type { SingleSelectChartTypeId } from '@/data/mock-single-select-chart-types';
import styles from './AdvancedWidgetPreview.module.css';

interface SingleSelectChartPreviewProps {
  widgetName: string;
  chartTypeId: SingleSelectChartTypeId;
}

export function SingleSelectChartPreview({
  widgetName,
  chartTypeId,
}: SingleSelectChartPreviewProps) {
  const headerLabel = widgetName.trim() || 'Name';
  const amChartType = singleSelectChartToAmChartType(chartTypeId);
  const data = useMemo(
    () => buildSingleSelectPreviewPayload(chartTypeId),
    [chartTypeId]
  );

  return (
    <article className={styles.preview}>
      <header className={styles.header}>
        <div className={styles.title}>{headerLabel}</div>
        <div className={styles.headerActions}>
          <span className="wm-lightbulb-outline" aria-hidden />
        </div>
      </header>
      <div className={styles.divider} />
      <div className={styles.body}>
        <BiAmChart
          widgetId={`single-select-preview-${chartTypeId}`}
          chartType={amChartType}
          data={data}
        />
      </div>
    </article>
  );
}
