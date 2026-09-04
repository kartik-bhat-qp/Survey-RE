/**
 * Mock data for the Question type usage admin analytics page.
 * Counts are survey-level: a survey counts once per type when it uses that type at least once.
 */

export type QuestionTypeUsageTier = 'Basic' | 'Advanced';

export type QuestionTypeUsageFilterTab =
  | 'all'
  | 'declining'
  | 'unused'
  | 'most-used'
  | 'biggest-change';

export interface QuestionTypeUsageRow {
  id: string;
  name: string;
  icon: string;
  tier: QuestionTypeUsageTier;
  surveys: number;
  /** Share of surveys in scope (0–1). */
  share: number;
  /** Period-over-period change (e.g. -0.765 = -76.5%). */
  change: number;
  children?: QuestionTypeUsageChild[];
}

export interface QuestionTypeUsageChild {
  id: string;
  name: string;
  surveys: number;
}

export interface QuestionTypeUsageTrendPoint {
  month: string;
  matrix: number;
  multipleChoice: number;
  rankOrder: number;
  staticContent: number;
  text: number;
}

export interface QuestionTypeUsageSummary {
  surveysInScope: number;
  surveysChange: number;
  typesInUse: number;
  typesTotal: number;
  typesUnderThreshold: number;
  mostUsedName: string;
  mostUsedShare: number;
  mostUsedSurveys: number;
  databaseCount: number;
  typesLoaded: number;
  decliningHardCount: number;
  remainingTypesCount: number;
  remainingShare: number;
  fetchedAtLabel: string;
  dataCenterCode: string;
  defaultDateRangeLabel: string;
  defaultMinCompletes: number;
  rangeDays: number;
}

export const QUESTION_TYPE_USAGE_FILTER_TABS: {
  id: QuestionTypeUsageFilterTab;
  label: string;
}[] = [
  { id: 'all', label: 'All' },
  { id: 'declining', label: 'Declining' },
  { id: 'unused', label: 'Unused' },
  { id: 'most-used', label: 'Most used' },
  { id: 'biggest-change', label: 'Biggest change' },
];

export const QUESTION_TYPE_USAGE_CATEGORY_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'basic', label: 'Basic' },
  { value: 'advanced', label: 'Advanced' },
];

export const QUESTION_TYPE_USAGE_SUMMARY: QuestionTypeUsageSummary = {
  surveysInScope: 1260,
  surveysChange: -0.425,
  typesInUse: 10,
  typesTotal: 45,
  typesUnderThreshold: 3,
  mostUsedName: 'Text',
  mostUsedShare: 0.67,
  mostUsedSurveys: 840,
  databaseCount: 22,
  typesLoaded: 13,
  decliningHardCount: 10,
  remainingTypesCount: 1,
  remainingShare: 0.016,
  fetchedAtLabel: 'Fetched 15:28',
  dataCenterCode: 'CA',
  defaultDateRangeLabel: 'Jun 05, 2026 – Sep 03, 2026',
  defaultMinCompletes: 100,
  rangeDays: 90,
};

export const QUESTION_TYPE_USAGE_ROWS: QuestionTypeUsageRow[] = [
  {
    id: 'text',
    name: 'Text',
    icon: 'wm-notes',
    tier: 'Basic',
    surveys: 840,
    share: 0.667,
    change: -0.765,
    children: [
      { id: 'text-comment', name: 'Comment Box', surveys: 620 },
      { id: 'text-single', name: 'Single Row Text', surveys: 410 },
      { id: 'text-email', name: 'Email Address', surveys: 180 },
    ],
  },
  {
    id: 'multiple-choice',
    name: 'Multiple Choice',
    icon: 'wm-radio-button-checked',
    tier: 'Basic',
    surveys: 820,
    share: 0.651,
    change: -0.892,
    children: [
      { id: 'mc-one', name: 'Select One', surveys: 710 },
      { id: 'mc-many', name: 'Select Many', surveys: 340 },
    ],
  },
  {
    id: 'matrix',
    name: 'Matrix',
    icon: 'wm-grid-on',
    tier: 'Basic',
    surveys: 510,
    share: 0.405,
    change: -0.612,
    children: [
      { id: 'matrix-basic', name: 'Basic Matrix', surveys: 390 },
      { id: 'matrix-flex', name: 'Flex Matrix', surveys: 180 },
    ],
  },
  {
    id: 'static-content',
    name: 'Static Content',
    icon: 'wm-article',
    tier: 'Basic',
    surveys: 390,
    share: 0.31,
    change: -0.448,
  },
  {
    id: 'rank-order',
    name: 'Rank Order',
    icon: 'wm-format-list-numbered',
    tier: 'Basic',
    surveys: 280,
    share: 0.222,
    change: -0.331,
  },
  {
    id: 'nps',
    name: 'NPS',
    icon: 'wm-speed',
    tier: 'Advanced',
    surveys: 140,
    share: 0.111,
    change: 1.5,
  },
  {
    id: 'graphical-rating',
    name: 'Graphical Rating',
    icon: 'wm-star',
    tier: 'Basic',
    surveys: 120,
    share: 0.095,
    change: -0.214,
  },
  {
    id: 'heatmap',
    name: 'Heatmap',
    icon: 'wm-whatshot',
    tier: 'Advanced',
    surveys: 48,
    share: 0.038,
    change: 0.42,
  },
  {
    id: 'van-westendorp',
    name: 'Van Westendorp',
    icon: 'wm-attach-money',
    tier: 'Advanced',
    surveys: 36,
    share: 0.029,
    change: -0.18,
  },
  {
    id: 'conjoint',
    name: 'Conjoint',
    icon: 'wm-insights',
    tier: 'Advanced',
    surveys: 28,
    share: 0.022,
    change: 0.65,
  },
  {
    id: 'maxdiff',
    name: 'MaxDiff',
    icon: 'wm-compare-arrows',
    tier: 'Advanced',
    surveys: 20,
    share: 0.016,
    change: -0.05,
  },
];

/** Default pinned series for the trend chart (matches screenshot). */
export const QUESTION_TYPE_USAGE_DEFAULT_PINNED = [
  'text',
  'multiple-choice',
  'matrix',
  'static-content',
  'rank-order',
] as const;

export const QUESTION_TYPE_USAGE_TREND_COLORS: Record<string, string> = {
  matrix: '#22c55e',
  'multiple-choice': '#f59e0b',
  'rank-order': '#ef4444',
  'static-content': '#a855f7',
  text: '#3b82f6',
  nps: '#06b6d4',
  'graphical-rating': '#84cc16',
  heatmap: '#f97316',
  'van-westendorp': '#64748b',
  conjoint: '#ec4899',
  maxdiff: '#14b8a6',
};

export const QUESTION_TYPE_USAGE_TREND: QuestionTypeUsageTrendPoint[] = [
  {
    month: '2026-06',
    matrix: 210,
    multipleChoice: 320,
    rankOrder: 95,
    staticContent: 140,
    text: 380,
  },
  {
    month: '2026-07',
    matrix: 185,
    multipleChoice: 280,
    rankOrder: 88,
    staticContent: 125,
    text: 340,
  },
  {
    month: '2026-08',
    matrix: 160,
    multipleChoice: 220,
    rankOrder: 72,
    staticContent: 110,
    text: 290,
  },
];

export function formatUsagePercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatUsageChange(value: number): string {
  const pct = value * 100;
  const abs = Math.abs(pct).toFixed(1);
  if (pct > 0) return `+${abs}%`;
  if (pct < 0) return `−${abs}%`;
  return '0.0%';
}

export function formatUsageCount(value: number): string {
  return value.toLocaleString('en-US');
}

export function filterQuestionTypeUsageRows(
  rows: QuestionTypeUsageRow[],
  tab: QuestionTypeUsageFilterTab,
  category: string
): QuestionTypeUsageRow[] {
  let next = rows;

  if (category === 'basic') {
    next = next.filter((row) => row.tier === 'Basic');
  } else if (category === 'advanced') {
    next = next.filter((row) => row.tier === 'Advanced');
  }

  switch (tab) {
    case 'declining':
      return [...next].filter((row) => row.change < 0).sort((a, b) => a.change - b.change);
    case 'unused':
      return [...next].filter((row) => row.surveys === 0);
    case 'most-used':
      return [...next].sort((a, b) => b.surveys - a.surveys);
    case 'biggest-change':
      return [...next].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    default:
      return next;
  }
}
