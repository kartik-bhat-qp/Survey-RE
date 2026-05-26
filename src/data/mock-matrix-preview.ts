import type {
  AiWidgetChartPayload,
  MatrixStackBarDataRow,
  MatrixStackBarSeriesConfig,
} from '@/components/charts/amcharts/types';
import type { MatrixChartTypeId } from '@/data/mock-matrix-chart-types';

export type { MatrixStackBarDataRow, MatrixStackBarSeriesConfig };

export const MATRIX_STACKBAR_SERIES: MatrixStackBarSeriesConfig[] = [
  { field: 'year1', name: 'First Year', color: '#1b4f9c' },
  { field: 'year2', name: 'Second Year', color: '#3d7cc9' },
  { field: 'year3', name: 'Third Year', color: '#5a9ad4' },
  { field: 'year4', name: 'Fourth Year', color: '#90bef2' },
];

/** Demo rows aligned with matrix stackbar reference (Computer Science / Mathematics). */
export const MATRIX_STACKBAR_DEMO_ROWS: MatrixStackBarDataRow[] = [
  {
    category: 'Computer Science',
    year1: 22,
    year2: 28,
    year3: 30,
    year4: 20,
  },
  {
    category: 'Mathematics',
    year1: 18,
    year2: 24,
    year3: 32,
    year4: 26,
  },
];

const EMPTY_PAYLOAD_BASE: AiWidgetChartPayload = {
  ageBarItems: [],
  npsBenchmarkItems: [],
  npsBenchmarkResponseCount: 0,
  barItems: [
    { category: 'Option A', value: 42 },
    { category: 'Option B', value: 35 },
    { category: 'Option C', value: 23 },
  ],
  pieSegments: [
    { category: 'A', value: 40 },
    { category: 'B', value: 35 },
    { category: 'C', value: 25 },
  ],
  linePoints: [
    { category: 'Q1', value: 30 },
    { category: 'Q2', value: 45 },
    { category: 'Q3', value: 25 },
  ],
  mapPoints: [],
  responseInfo: {
    totalResponses: 2680,
    completed: 1822,
    avgMinutes: 11,
    avgSeconds: 42,
    questionCount: 23,
    firstResponseDate: '2026-02-24T10:00:00Z',
    lastResponseDate: '2026-05-09T16:30:00Z',
    minResponseSeconds: 3,
    maxResponseSeconds: 11520,
  },
  totalResponses: 2680,
  completed: 1822,
  avgMinutes: 11,
  avgSeconds: 42,
  gaugeScore: 68,
  statValue: 38,
  leaderboard: [],
  tableRows: [],
  stackSegments: MATRIX_STACKBAR_SERIES.map((s, i) => ({
    category: s.name,
    value: 20 + i * 5,
  })),
  pictorial: [
    { category: 'Low', value: 15 },
    { category: 'Mid', value: 45 },
    { category: 'High', value: 40 },
  ],
  imageBars: [],
  benchmarkItems: [],
  comparativeBarSeries: [],
  comparativeBarRows: [],
  segmentTrendSeries: [],
  segmentTrendRows: [],
  matrixStackBarRows: MATRIX_STACKBAR_DEMO_ROWS,
  matrixStackBarSeries: MATRIX_STACKBAR_SERIES,
};

export function buildMatrixPreviewPayload(
  _chartTypeId: MatrixChartTypeId
): AiWidgetChartPayload {
  return { ...EMPTY_PAYLOAD_BASE };
}

export function matrixChartToAmChartType(
  chartTypeId: MatrixChartTypeId
): import('@/components/charts/amcharts/types').AmChartWidgetType {
  switch (chartTypeId) {
    case 'matrix-stackbar':
      return 'matrix-stackbar';
    case 'matrix-bar':
      return 'matrix-bar';
    case 'matrix-spider':
      return 'matrix-spider';
    case 'matrix-heatmap':
      return 'matrix-heatmap';
    default:
      return 'matrix-stackbar';
  }
}
