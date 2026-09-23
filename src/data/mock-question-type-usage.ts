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

export type QuestionTypeUsageDatePresetId =
  | 'last-30'
  | 'last-90'
  | 'this-quarter'
  | 'last-full-month'
  | 'custom';

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
  values: Record<string, number>;
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

export interface QuestionTypeUsageDateFilter {
  label: string;
  startIso: string;
  endIso: string;
  rangeDays: number;
  preset?: QuestionTypeUsageDatePresetId;
}

export interface QuestionTypeUsageDataset {
  summary: QuestionTypeUsageSummary;
  rows: QuestionTypeUsageRow[];
  trend: QuestionTypeUsageTrendPoint[];
}

export interface QuestionTypeUsageSurveyExample {
  id: number;
  name: string;
  responses: number;
  status: string;
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

export const QUESTION_TYPE_USAGE_MIN_PRESETS = [0, 50, 100, 500] as const;

export const QUESTION_TYPE_USAGE_DATE_PRESETS: {
  id: Exclude<QuestionTypeUsageDatePresetId, 'custom'>;
  label: string;
}[] = [
  { id: 'last-30', label: 'Last 30 days' },
  { id: 'last-90', label: 'Last 90 days' },
  { id: 'this-quarter', label: 'This quarter' },
  { id: 'last-full-month', label: 'Last full month' },
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

export const QUESTION_TYPE_USAGE_DEFAULT_DATE_FILTER: QuestionTypeUsageDateFilter = {
  label: 'Jun 05, 2026 – Sep 03, 2026',
  startIso: '2026-06-05',
  endIso: '2026-09-03',
  rangeDays: 90,
  preset: 'last-90',
};

export function formatQuestionTypeUsageDateLabel(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export function buildCustomDateFilter(startIso: string, endIso: string): QuestionTypeUsageDateFilter {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  const rangeDays =
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return {
    label: formatQuestionTypeUsageDateLabel(start, end),
    startIso,
    endIso,
    rangeDays,
    preset: 'custom',
  };
}

export function buildDateFilterFromPreset(
  presetId: Exclude<QuestionTypeUsageDatePresetId, 'custom'>,
  now = new Date('2026-09-03T12:00:00')
): QuestionTypeUsageDateFilter {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);

  if (presetId === 'last-30') {
    start.setDate(end.getDate() - 29);
  } else if (presetId === 'last-90') {
    start.setDate(end.getDate() - 89);
  } else if (presetId === 'this-quarter') {
    const quarterStartMonth = Math.floor(end.getMonth() / 3) * 3;
    start.setMonth(quarterStartMonth, 1);
  } else {
    start.setDate(1);
    start.setMonth(start.getMonth() - 1);
    end.setDate(0);
  }

  const rangeDays =
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return {
    label: formatQuestionTypeUsageDateLabel(start, end),
    startIso: start.toISOString().slice(0, 10),
    endIso: end.toISOString().slice(0, 10),
    rangeDays,
    preset: presetId,
  };
}

export function formatFetchedAtLabel(date = new Date()): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `Fetched ${hours}:${minutes}`;
}

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
  {
    id: 'file-upload',
    name: 'File Upload',
    icon: 'wm-upload-file',
    tier: 'Advanced',
    surveys: 0,
    share: 0,
    change: 0,
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
  'file-upload': '#94a3b8',
};

export const QUESTION_TYPE_USAGE_TREND: QuestionTypeUsageTrendPoint[] = [
  {
    month: '2026-06',
    values: {
      text: 380,
      'multiple-choice': 320,
      matrix: 210,
      'static-content': 140,
      'rank-order': 95,
      nps: 40,
      'graphical-rating': 55,
      heatmap: 12,
      'van-westendorp': 14,
      conjoint: 8,
      maxdiff: 6,
      'file-upload': 0,
    },
  },
  {
    month: '2026-07',
    values: {
      text: 340,
      'multiple-choice': 280,
      matrix: 185,
      'static-content': 125,
      'rank-order': 88,
      nps: 55,
      'graphical-rating': 48,
      heatmap: 18,
      'van-westendorp': 12,
      conjoint: 11,
      maxdiff: 7,
      'file-upload': 0,
    },
  },
  {
    month: '2026-08',
    values: {
      text: 290,
      'multiple-choice': 220,
      matrix: 160,
      'static-content': 110,
      'rank-order': 72,
      nps: 70,
      'graphical-rating': 42,
      heatmap: 22,
      'van-westendorp': 10,
      conjoint: 14,
      maxdiff: 8,
      'file-upload': 0,
    },
  },
];

const TYPE_SURVEY_EXAMPLES: Record<string, QuestionTypeUsageSurveyExample[]> = {
  text: [
    { id: 101, name: 'Customer feedback — open comments Q3', responses: 412, status: 'Active - Published' },
    { id: 102, name: 'Support ticket follow-up', responses: 288, status: 'Active - Published' },
    { id: 103, name: 'Product concept write-in', responses: 156, status: 'Active - Draft' },
    { id: 104, name: 'Exit interview narrative', responses: 94, status: 'Closed' },
  ],
  'multiple-choice': [
    { id: 201, name: 'Brand awareness tracker Wave 4', responses: 980, status: 'Active - Published' },
    { id: 202, name: 'Feature preference poll', responses: 540, status: 'Active - Published' },
    { id: 203, name: 'Event registration screener', responses: 210, status: 'Scheduled' },
  ],
  matrix: [
    { id: 301, name: 'Satisfaction grid — retail', responses: 620, status: 'Active - Published' },
    { id: 302, name: 'Attribute importance matrix', responses: 340, status: 'Active - Published' },
  ],
  nps: [
    { id: 401, name: 'NPS — Product Launch Feedback', responses: 312, status: 'Active - Published' },
    { id: 402, name: 'Relationship NPS — Enterprise', responses: 188, status: 'Active - Published' },
  ],
};

export function getQuestionTypeUsageSurveyExamples(
  typeId: string
): QuestionTypeUsageSurveyExample[] {
  if (TYPE_SURVEY_EXAMPLES[typeId]) return TYPE_SURVEY_EXAMPLES[typeId];
  const row = QUESTION_TYPE_USAGE_ROWS.find((item) => item.id === typeId);
  if (!row || row.surveys === 0) return [];
  return [
    {
      id: 900 + typeId.length,
      name: `${row.name} usage sample — Demo 2026`,
      responses: Math.max(12, Math.round(row.surveys * 0.4)),
      status: 'Active - Published',
    },
    {
      id: 910 + typeId.length,
      name: `${row.name} pilot — Research Bootcamp`,
      responses: Math.max(4, Math.round(row.surveys * 0.15)),
      status: 'Active - Draft',
    },
  ];
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Prototype re-scope: scale surveys/share/trend from date window + min completes.
 * Shorter ranges and higher thresholds shrink the visible population.
 */
export function resolveQuestionTypeUsageDataset(
  dateFilter: QuestionTypeUsageDateFilter,
  minCompletes: number
): QuestionTypeUsageDataset {
  const rangeFactor = clamp01(dateFilter.rangeDays / 90);
  const minFactor = clamp01(1 - Math.max(0, minCompletes - 100) / 900);
  const scale = Math.max(0.28, 0.45 + rangeFactor * 0.4) * Math.max(0.35, 0.55 + minFactor * 0.45);

  const rows = QUESTION_TYPE_USAGE_ROWS.map((row) => {
    const surveys =
      row.surveys === 0 ? 0 : Math.max(0, Math.round(row.surveys * scale));
    return {
      ...row,
      surveys,
      share: 0,
      children: row.children?.map((child) => ({
        ...child,
        surveys: Math.max(0, Math.round(child.surveys * scale)),
      })),
    };
  });

  const surveysInScope = Math.max(40, Math.round(QUESTION_TYPE_USAGE_SUMMARY.surveysInScope * scale));
  const withShare = rows.map((row) => ({
    ...row,
    share: surveysInScope ? row.surveys / surveysInScope : 0,
  }));

  const activeRows = withShare.filter((row) => row.surveys > 0);
  const mostUsed = [...activeRows].sort((a, b) => b.surveys - a.surveys)[0];
  const typesUnderThreshold = activeRows.filter((row) => row.surveys < 40).length;
  const decliningHardCount = activeRows.filter((row) => row.change <= -0.2).length;
  const remaining = withShare.filter((row) => row.surveys > 0 && row.surveys < 25);

  const trend = QUESTION_TYPE_USAGE_TREND.map((point) => {
    const values: Record<string, number> = {};
    for (const [key, value] of Object.entries(point.values)) {
      values[key] = Math.max(0, Math.round(value * scale));
    }
    return { month: point.month, values };
  });

  const summary: QuestionTypeUsageSummary = {
    ...QUESTION_TYPE_USAGE_SUMMARY,
    surveysInScope,
    surveysChange: QUESTION_TYPE_USAGE_SUMMARY.surveysChange * (0.7 + rangeFactor * 0.3),
    typesInUse: activeRows.length,
    typesUnderThreshold,
    mostUsedName: mostUsed?.name ?? '—',
    mostUsedShare: mostUsed?.share ?? 0,
    mostUsedSurveys: mostUsed?.surveys ?? 0,
    typesLoaded: withShare.length,
    decliningHardCount,
    remainingTypesCount: remaining.length,
    remainingShare: remaining.reduce((sum, row) => sum + row.share, 0),
    rangeDays: dateFilter.rangeDays,
    defaultDateRangeLabel: dateFilter.label,
    defaultMinCompletes: minCompletes,
    fetchedAtLabel: formatFetchedAtLabel(),
  };

  return { summary, rows: withShare, trend };
}

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
