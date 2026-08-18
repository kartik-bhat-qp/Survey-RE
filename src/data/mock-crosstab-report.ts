export interface CrosstabDisplaySettings {
  count: boolean;
  rowPercentage: boolean;
  columnPercentage: boolean;
  rowOverall: boolean;
  columnOverall: boolean;
  rowTotal: boolean;
  columnTotal: boolean;
  totalColumnPercentage: boolean;
  totalRowPercentage: boolean;
  heatmapRows: boolean;
  heatmapColumns: boolean;
  rowMetric: boolean;
  columnMetric: boolean;
}

export interface CrosstabColumnGroup {
  question: string;
  options: string[];
  overallCounts: number[];
}

export interface CrosstabAnswerRow {
  label: string;
  overall: number;
  counts: number[][];
  metrics: number[];
  totals: number[];
}

export interface CrosstabRowGroup {
  question: string;
  answers: CrosstabAnswerRow[];
  columnMetrics: number[][];
  columnTotals: number[][];
  /** Distinct or weighted valid respondent base for each column-question group. */
  bases: number[];
}

export interface CrosstabReportData {
  title: string;
  surveyName: string;
  columnGroups: CrosstabColumnGroup[];
  rowGroups: CrosstabRowGroup[];
}

export const DEFAULT_CROSSTAB_SETTINGS: CrosstabDisplaySettings = {
  count: true,
  rowPercentage: true,
  columnPercentage: true,
  rowOverall: false,
  columnOverall: false,
  rowTotal: true,
  columnTotal: true,
  totalColumnPercentage: false,
  totalRowPercentage: false,
  heatmapRows: false,
  heatmapColumns: false,
  rowMetric: false,
  columnMetric: false,
};

export const MOCK_CROSSTAB_REPORT: CrosstabReportData = {
  title: 'Dining experience cross-tab',
  surveyName: 'Restaurant feedback',
  columnGroups: [
    {
      question: 'What type of cuisine do you prefer while dining with us?',
      options: ['Vegetarian', 'Non-Vegetarian', 'Both', 'Prefer not to answer'],
      overallCounts: [82, 81, 72, 76],
    },
    {
      question: 'How satisfied are you with the variety of dining options available?',
      options: [
        'Very Dissatisfied',
        'Dissatisfied',
        'Neutral',
        'Satisfied',
        'Very Satisfied',
      ],
      overallCounts: [63, 61, 61, 57, 57],
    },
  ],
  rowGroups: [
    {
      question: 'Preferred beverage',
      answers: [
        {
          label: 'Fresh juice',
          overall: 6,
          counts: [[1, 0, 0, 0], [0, 0, 0, 0, 0]],
          metrics: [-100, 0],
          totals: [1, 0],
        },
        {
          label: 'Coffee',
          overall: 1,
          counts: [[0, 1, 0, 0], [0, 0, 0, 0, 0]],
          metrics: [-100, 0],
          totals: [1, 0],
        },
        {
          label: 'Cold drink',
          overall: 8,
          counts: [[1, 0, 1, 6], [1, 3, 4, 0, 0]],
          metrics: [62.5, -100],
          totals: [8, 8],
        },
      ],
      columnMetrics: [[0, 0, 100, 100], [100, 100, 100, 0, 0]],
      columnTotals: [[2, 1, 1, 6], [1, 3, 4, 0, 0]],
      bases: [10, 8],
    },
    {
      question: 'What dining atmosphere do you enjoy the most?',
      answers: [
        {
          label: 'Casual and relaxed',
          overall: 44,
          counts: [[11, 12, 10, 10], [9, 8, 9, 8, 8]],
          metrics: [-30.2, -42.9],
          totals: [43, 42],
        },
        {
          label: 'Fine dining',
          overall: 44,
          counts: [[13, 11, 10, 10], [10, 9, 9, 8, 8]],
          metrics: [-31.8, -45.5],
          totals: [44, 44],
        },
        {
          label: 'Family-friendly',
          overall: 41,
          counts: [[11, 10, 10, 10], [9, 8, 8, 8, 8]],
          metrics: [-26.8, -41.5],
          totals: [41, 41],
        },
        {
          label: 'Outdoor seating',
          overall: 43,
          counts: [[11, 11, 10, 11], [9, 10, 8, 8, 8]],
          metrics: [-25.6, -44.2],
          totals: [43, 43],
        },
        {
          label: 'Quiet and private',
          overall: 43,
          counts: [[10, 10, 12, 11], [10, 8, 9, 8, 8]],
          metrics: [-20.9, -44.2],
          totals: [43, 43],
        },
        {
          label: 'Lively and social',
          overall: 43,
          counts: [[11, 10, 10, 12], [8, 8, 10, 8, 9]],
          metrics: [-20.9, -39.5],
          totals: [43, 43],
        },
        {
          label: 'Prefer not to answer',
          overall: 42,
          counts: [[10, 10, 10, 12], [8, 10, 8, 8, 8]],
          metrics: [-19, -42.9],
          totals: [42, 42],
        },
      ],
      columnMetrics: [
        [-59.7, -59.5, -58.3, -52.6],
        [-61.9, -54.1, -57.4, -57.1, -56.1],
      ],
      columnTotals: [[77, 74, 72, 76], [63, 61, 61, 56, 57]],
      bases: [299, 298],
    },
  ],
};

export function formatMetric(value: number): string {
  return value.toFixed(1);
}

export function formatPercent(value: number, denominator: number): string {
  if (!denominator) return '0.0%';
  return `${((value / denominator) * 100).toFixed(1)}%`;
}
