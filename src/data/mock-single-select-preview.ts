import type { AiWidgetChartPayload, AmChartWidgetType } from '@/components/charts/amcharts/types';
import type { SingleSelectChartTypeId } from '@/data/mock-single-select-chart-types';

/** Default horizontal bar preview — matches Single Select widget reference. */
export const SINGLE_SELECT_BAR_PREVIEW_ITEMS = [
  { category: 'Science', value: 34 },
  { category: 'Mathematics', value: 42 },
  { category: 'English', value: 23 },
];

export function buildSingleSelectPreviewPayload(
  chartTypeId: SingleSelectChartTypeId
): AiWidgetChartPayload {
  const barItems = SINGLE_SELECT_BAR_PREVIEW_ITEMS;
  const pieSegments =
    chartTypeId === 'semi-circle'
      ? [
          { category: 'Mathematics', value: 34 },
          { category: 'English Language', value: 46 },
          { category: 'Computer Applications', value: 20 },
        ]
      : [
          { category: 'Science', value: 34 },
          { category: 'Mathematics', value: 42 },
          { category: 'English', value: 23 },
        ];
  const linePoints = [
    { category: 'Jan', value: 28 },
    { category: 'Feb', value: 35 },
    { category: 'Mar', value: 42 },
  ];

  return {
    ageBarItems: [],
    npsBenchmarkItems: [],
    npsBenchmarkResponseCount: 0,
    barItems,
    pieSegments,
    linePoints,
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
    gaugeScore: chartTypeId === 'gauge' ? 72 : 68,
    statValue: chartTypeId === 'stat-highlight' ? 42 : 38,
    leaderboard: [
      { region: 'Science', score: 34 },
      { region: 'Mathematics', score: 42 },
      { region: 'English', score: 23 },
    ],
    tableRows: barItems.map((row) => ({
      question: row.category,
      responses: row.value * 10,
      avg: row.value,
    })),
    stackSegments: pieSegments,
    pictorial: pieSegments,
    imageBars: barItems,
    benchmarkItems: barItems,
    comparativeBarRows: [],
    comparativeBarSeries: [],
    segmentTrendRows: [],
    segmentTrendSeries: [],
    matrixStackBarRows: [],
    matrixStackBarSeries: [],
  };
}

export function singleSelectChartToAmChartType(
  chartTypeId: SingleSelectChartTypeId
): AmChartWidgetType {
  switch (chartTypeId) {
    case 'pie':
    case 'scoring-donut':
      return 'pie';
    case 'semi-circle':
      return 'semi-circle';
    case 'line':
    case 'scoring-trend':
      return 'line';
    case 'donut':
      return 'donut';
    case 'gauge':
      return 'gauge';
    case 'stackbar':
      return 'stackbar';
    case 'tabular':
    case 'stat-highlight':
    case 'leaderboard':
    case 'benchmark':
    case 'image-bar':
    case 'pictorial':
    default:
      return 'bar';
  }
}
