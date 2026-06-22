'use client';

import { useMemo } from 'react';
import { BiAmChart } from '@/components/charts/amcharts/BiAmChart';
import {
  buildMatrixPreviewPayload,
  matrixChartToAmChartType,
} from '@/data/mock-matrix-preview';
import type { MatrixChartTypeId } from '@/data/mock-matrix-chart-types';
import styles from './AdvancedWidgetPreview.module.css';

interface MatrixChartPreviewProps {
  widgetName: string;
  chartTypeId: MatrixChartTypeId;
}

export function MatrixChartPreview({ widgetName, chartTypeId }: MatrixChartPreviewProps) {
  const headerLabel = widgetName.trim() || 'Name';
  const amChartType = matrixChartToAmChartType(chartTypeId);
  const data = useMemo(() => buildMatrixPreviewPayload(chartTypeId), [chartTypeId]);

  return (
    <article className={styles.preview}>
      <header className={styles.header}>
        <div className={styles.title}>{headerLabel}</div>
        <div className={styles.headerActions}>
          <span className="wm-diamond" aria-hidden />
        </div>
      </header>
      <div className={styles.divider} />
      <div className={styles.body}>
        <BiAmChart
          widgetId={`matrix-preview-${chartTypeId}`}
          chartType={amChartType}
          data={data}
        />
      </div>
    </article>
  );
}
