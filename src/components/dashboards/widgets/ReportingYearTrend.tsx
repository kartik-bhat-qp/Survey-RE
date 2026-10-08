'use client';

import { useMemo } from 'react';
import { BiAmChart } from '@/components/charts/amcharts/BiAmChart';
import type { AiWidgetChartPayload } from '@/components/charts/amcharts/types';
import type { AmChartTypography } from '@/components/charts/amcharts/theme';
import type { DashboardDateSelection } from '@/data/reporting-year';
import { defaultTimeSeriesSettings, timeSeriesData, type TimeSeriesKind, type TimeSeriesSettings } from '@/data/time-series';
import { getDashboardDesignColors, type DashboardDesign } from '@/data/dashboard-design';

/** Read-only rendering for previews outside the editable dashboard card. */
export function ReportingYearTrend({ selection, payload, widgetId, typography, kind = 'segment-trend', settings: savedSettings, dashboardDesign }: { selection?: DashboardDateSelection; payload: AiWidgetChartPayload; widgetId: string; typography?: AmChartTypography; kind?:TimeSeriesKind; settings?:TimeSeriesSettings; dashboardDesign?:DashboardDesign }) {
  const data = useMemo(() => {
    const settings=savedSettings ?? defaultTimeSeriesSettings(kind,'');
    const seriesColors=settings.design==='Dashboard' && dashboardDesign ? getDashboardDesignColors(dashboardDesign).palette : settings.seriesColors;
    const result=timeSeriesData(kind,{...settings,seriesColors},selection);
    return {...payload,segmentTrendRows:result.rows,segmentTrendSeries:result.series,timeSeriesOptions:{kind,metric:settings.metric,scoring:settings.scoring,axisFontSize:settings.design==='Widget' ? settings.fontSize : 11,dataLabels:settings.dataLabels,axisTitles:settings.axisTitles,xTitle:settings.xTitle,yTitle:settings.yTitle,highlightHighest:settings.highlightHighest,minimum:settings.customAxis ? settings.minimum : undefined,maximum:settings.customAxis ? Math.max(settings.minimum+1,settings.maximum) : undefined,tooltip:settings.tooltip,tooltipTitle:settings.tooltipTitle,tooltipCount:settings.tooltipCount,tooltipPercentage:settings.tooltipPercentage}};
  },[payload,selection,kind,savedSettings,dashboardDesign]);
  const chartTypography:AmChartTypography|undefined=savedSettings?.design==='Widget' ? {fontWeight:'400',fontStyle:'normal',...typography,fontFamily:savedSettings.fontFamily,fontSize:savedSettings.fontSize} : typography;
  return <BiAmChart widgetId={widgetId} chartType="segment-trend" data={data} typography={chartTypography} />;
}
