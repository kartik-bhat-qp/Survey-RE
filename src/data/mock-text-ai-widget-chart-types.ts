import { PUBLIC_IMAGES } from '@/lib/public-images';

export type TextAiWidgetChartTypeId =
  | 'gauge'
  | 'theme-stacked-bar'
  | 'subtheme-stacked-bar'
  | 'bubble-chart'
  | 'text-viewer'
  | 'trend-line'
  | 'comparative-chart'
  | 'text-summary';

export interface TextAiWidgetChartType {
  id: TextAiWidgetChartTypeId;
  label: string;
  imageSrc: string;
}

const SINGLE = PUBLIC_IMAGES.singleSelectWidgets;
const MATRIX = PUBLIC_IMAGES.matrixWidgets;
const ADVANCED = PUBLIC_IMAGES.advancedWidgets;

export const TEXT_AI_WIDGET_CHART_TYPES: TextAiWidgetChartType[] = [
  { id: 'gauge', label: 'Gauge', imageSrc: SINGLE.gauge },
  { id: 'theme-stacked-bar', label: 'Theme stacked bar', imageSrc: SINGLE.stackbar },
  {
    id: 'subtheme-stacked-bar',
    label: 'Sub-theme stacked bar',
    imageSrc: MATRIX.stackbar,
  },
  { id: 'bubble-chart', label: 'Bubble chart', imageSrc: ADVANCED.bubbleChart },
  { id: 'text-viewer', label: 'Text viewer', imageSrc: ADVANCED.responseViewer },
  { id: 'trend-line', label: 'Trend line', imageSrc: ADVANCED.segmentTrendLine },
  {
    id: 'comparative-chart',
    label: 'Comparative chart',
    imageSrc: ADVANCED.comparativeChart,
  },
  { id: 'text-summary', label: 'Text Summary', imageSrc: ADVANCED.textSummary },
];

export const DEFAULT_TEXT_AI_WIDGET_CHART_TYPE_ID: TextAiWidgetChartTypeId = 'gauge';
