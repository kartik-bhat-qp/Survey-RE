import type { AiWidgetType } from '@/data/mock-ai-widgets';
import type {
  ComparativeBarDataRow,
  ComparativeBarSeriesConfig,
} from '@/data/mock-comparative-bar';
import type {
  SegmentTrendDataRow,
  SegmentTrendSeriesConfig,
} from '@/data/mock-segment-trend';

export interface ChartDataPoint {
  category: string;
  value: number;
}

export interface ColoredChartDataPoint extends ChartDataPoint {
  color: string;
}

export interface NpsBenchmarkDataPoint {
  category: string;
  npsScore: number;
}

export interface MapChartPoint {
  id: string;
  name: string;
  value: number;
  longitude?: number;
  latitude?: number;
}

export interface MatrixStackBarSeriesConfig {
  field: string;
  name: string;
  color: string;
}

export interface MatrixStackBarDataRow {
  category: string;
  [seriesField: string]: string | number;
}

export interface ResponseInfoData {
  totalResponses: number;
  completed: number;
  avgMinutes: number;
  avgSeconds: number;
  questionCount: number;
  firstResponseDate: string;
  lastResponseDate: string;
  minResponseSeconds: number;
  maxResponseSeconds: number;
}

export interface TimeSeriesChartOptions {
  kind: 'segment-trend' | 'scoring-trend' | 'response-timeline';
  metric?: 'Count' | 'Percent';
  scoring?: 'Mean' | 'Net promoter score' | 'Customer effort score' | 'Customer satisfaction score';
  axisFontSize?: number;
  dataLabels: string; axisTitles: boolean; xTitle: string; yTitle: string;
  highlightHighest: boolean; minimum?: number; maximum?: number; tooltip: 'Default' | 'Custom' | 'None'; tooltipTitle?:boolean; tooltipCount?:boolean; tooltipPercentage?:boolean;
}
export interface AiWidgetChartPayload {
  timeSeriesOptions?: TimeSeriesChartOptions;
  onTrendPointClick?: (category: string) => void;
  barDrilldown?: { onSelect: (category: string) => void; counts: Record<string, number> };
  ageBarItems: ColoredChartDataPoint[];
  npsBenchmarkItems: NpsBenchmarkDataPoint[];
  npsBenchmarkResponseCount: number;
  barItems: ChartDataPoint[];
  pieSegments: ChartDataPoint[];
  linePoints: ChartDataPoint[];
  mapPoints: MapChartPoint[];
  responseInfo: ResponseInfoData;
  totalResponses: number;
  completed: number;
  avgMinutes: number;
  avgSeconds: number;
  gaugeScore: number;
  statValue: number;
  leaderboard: { region: string; score: number }[];
  tableRows: { question: string; responses: number; avg: number }[];
  stackSegments: ChartDataPoint[];
  pictorial: ChartDataPoint[];
  imageBars: ChartDataPoint[];
  benchmarkItems: ChartDataPoint[];
  comparativeBarSeries: ComparativeBarSeriesConfig[];
  comparativeBarRows: ComparativeBarDataRow[];
  segmentTrendSeries: SegmentTrendSeriesConfig[];
  segmentTrendRows: SegmentTrendDataRow[];
  matrixStackBarRows: MatrixStackBarDataRow[];
  matrixStackBarSeries: MatrixStackBarSeriesConfig[];
}

export type MatrixAmChartWidgetType =
  | 'matrix-stackbar'
  | 'matrix-bar'
  | 'matrix-spider'
  | 'matrix-heatmap';

export type AmChartWidgetType =
  | Exclude<
      AiWidgetType,
      'response-info' | 'tabular' | 'stat-highlight' | 'leaderboard' | 'stat-metric' | 'heat-map'
    >
  | MatrixAmChartWidgetType;
