'use client';

import { useLayoutEffect, useRef } from 'react';
import { AmChartContainer } from '@/components/charts/amcharts/AmChartContainer';
import { buildChart, type ChartInstance } from '@/components/charts/amcharts/build-chart';
import type { AmChartTypography } from '@/components/charts/amcharts/theme';
import type { AiWidgetChartPayload, AmChartWidgetType } from '@/components/charts/amcharts/types';

interface BiAmChartProps {
  widgetId: string;
  chartType: AmChartWidgetType;
  data: AiWidgetChartPayload;
  typography?: AmChartTypography;
}

export function BiAmChart({ widgetId, chartType, data, typography }: BiAmChartProps) {
  const chartId = `bi-amchart-${widgetId}`;
  const chartRef = useRef<ChartInstance | null>(null);

  useLayoutEffect(() => {
    chartRef.current = buildChart(chartId, chartType, data, typography);
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [chartId, chartType, data, typography]);

  useLayoutEffect(() => {
    const container = document.getElementById(chartId);
    if (!container) return;

    const observer = new ResizeObserver(() => {
      chartRef.current?.resize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [chartId]);

  return <AmChartContainer chartId={chartId} />;
}
