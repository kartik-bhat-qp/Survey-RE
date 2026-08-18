import { PUBLIC_IMAGES } from '@/lib/public-images';

export type TextAiWidgetChartTypeId =
  | 'gauge'
  | 'theme-stacked-bar'
  | 'subtheme-stacked-bar'
  | 'bubble-chart'
  | 'text-viewer'
  | 'trend-line'
  | 'comparative-chart'
  | 'subtheme-comparative-chart'
  | 'text-summary';

export interface TextAiWidgetChartType {
  id: TextAiWidgetChartTypeId;
  label: string;
  imageSrc: string;
}

const SINGLE = PUBLIC_IMAGES.singleSelectWidgets;
const ADVANCED = PUBLIC_IMAGES.advancedWidgets;
const TEXT_AI = PUBLIC_IMAGES.textAiWidgets;

export const TEXT_AI_WIDGET_CHART_TYPES: TextAiWidgetChartType[] = [
  { id: 'gauge', label: 'Gauge', imageSrc: SINGLE.gauge },
  {
    id: 'theme-stacked-bar',
    label: 'Theme stacked bar',
    imageSrc: TEXT_AI.themeStackedBar,
  },
  {
    id: 'subtheme-stacked-bar',
    label: 'Sub-theme stacked bar',
    imageSrc: TEXT_AI.subthemeStackedBar,
  },
  { id: 'bubble-chart', label: 'Bubble chart', imageSrc: ADVANCED.bubbleChart },
  { id: 'text-viewer', label: 'Text viewer', imageSrc: ADVANCED.responseViewer },
  { id: 'trend-line', label: 'Trend line', imageSrc: ADVANCED.segmentTrendLine },
  {
    id: 'comparative-chart',
    label: 'Comparative chart',
    imageSrc: TEXT_AI.comparativeChart,
  },
  {
    id: 'subtheme-comparative-chart',
    label: 'Sub-theme comparative chart',
    imageSrc: TEXT_AI.subthemeComparativeChart,
  },
  { id: 'text-summary', label: 'Text Summary', imageSrc: TEXT_AI.textSummary },
];

export const DEFAULT_TEXT_AI_WIDGET_CHART_TYPE_ID: TextAiWidgetChartTypeId = 'gauge';
