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

export interface AiWidgetChartPayload {
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
      'response-info' | 'tabular' | 'stat-highlight' | 'leaderboard' | 'stat-metric'
    >
  | MatrixAmChartWidgetType;
