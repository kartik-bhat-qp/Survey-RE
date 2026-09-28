'use client';

import { useMemo } from 'react';
import { BiAmChart } from '@/components/charts/amcharts/BiAmChart';
import type { AiWidgetChartPayload } from '@/components/charts/amcharts/types';
import type { AmChartTypography } from '@/components/charts/amcharts/theme';
import type { DashboardDateSelection } from '@/data/reporting-year';
import { defaultTimeSeriesSettings, timeSeriesData, type TimeSeriesKind } from '@/data/time-series';

/** Read-only rendering for previews outside the editable dashboard card. */
export function ReportingYearTrend({ selection, payload, widgetId, typography, kind = 'segment-trend' }: { selection?: DashboardDateSelection; payload: AiWidgetChartPayload; widgetId: string; typography?: AmChartTypography; kind?:TimeSeriesKind }) {
  const data = useMemo(() => {
    const settings=defaultTimeSeriesSettings(kind,'');
    const result=timeSeriesData(kind,settings,selection);
    return {...payload,segmentTrendRows:result.rows,segmentTrendSeries:result.series,timeSeriesOptions:{kind,dataLabels:settings.dataLabels,axisTitles:false,xTitle:'',yTitle:'',highlightHighest:false,tooltip:settings.tooltip}};
  },[payload,selection,kind]);
  return <BiAmChart widgetId={widgetId} chartType="segment-trend" data={data} typography={typography} />;
}
