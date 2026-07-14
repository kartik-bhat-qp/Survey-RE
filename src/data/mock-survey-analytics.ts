import type { SurveyDetail } from '@/data/mock-survey-detail';

export type AnalyticsTabId = 'dashboard' | 'analysis' | 'net-insights' | 'manage-data';

export interface AnalyticsNavItem {
  id: string;
  label: string;
  icon?: string;
  isNew?: boolean;
  /** Relative path to open in a new browser tab instead of navigating in-app. */
  openInNewTab?: string;
  requiresAdvancedLicense?: boolean;
}

export const ANALYTICS_TAB_CONFIG: Record<
  AnalyticsTabId,
  { label: string; icon: string; items: AnalyticsNavItem[] }
> = {
  dashboard: {
    label: 'Dashboard',
    icon: 'wm-dashboard',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'wm-dashboard' },
      {
        id: 'bi-dashboard',
        label: 'BI Dashboard',
        icon: 'wm-bar-chart',
        isNew: true,
        openInNewTab: '/bi-lite/dashboards',
      },
      { id: 'participant-statistics', label: 'Participant Statistics', icon: 'wm-people' },
      { id: 'responses', label: 'Responses', icon: 'wm-format-list-bulleted' },
      { id: 'datapad', label: 'Datapad', icon: 'wm-table-chart' },
      { id: 'infographic', label: 'InfoGraphic', icon: 'wm-insert-chart', requiresAdvancedLicense: true },
    ],
  },
  analysis: {
    label: 'Analysis',
    icon: 'wm-bar-chart',
    items: [
      { id: 'crosstab', label: 'Crosstab' },
      { id: 'comparison-report', label: 'Comparison Report' },
      { id: 'segmentation', label: 'Segmentation' },
      { id: 'trend-analysis', label: 'Trend Analysis' },
      {
        id: 'statistical-analysis',
        label: 'Statistical Analysis',
        requiresAdvancedLicense: true,
      },
      { id: 'video-ai-analysis', label: 'VideoAI Analysis' },
    ],
  },
  'net-insights': {
    label: 'Text Analysis',
    icon: 'wm-insights',
    items: [
      { id: 'text-analysis', label: 'Text Analysis' },
      { id: 'topic-segmentation', label: 'Topic Segmentation' },
      { id: 'sentiment-analysis', label: 'Sentiment Analysis' },
      { id: 'word-cloud', label: 'Word Cloud' },
      { id: 'open-ended-responses', label: 'Open-Ended Responses' },
    ],
  },
  'manage-data': {
    label: 'Manage Data',
    icon: 'wm-storage',
    items: [
      { id: 'export-data', label: 'Export Data' },
      { id: 'import-data', label: 'Import Data' },
      { id: 'delete-responses', label: 'Delete Responses' },
      { id: 'response-quality', label: 'Response Quality' },
      { id: 'download-raw-data', label: 'Download Raw Data' },
    ],
  },
};

export const ANALYTICS_TAB_IDS = Object.keys(ANALYTICS_TAB_CONFIG) as AnalyticsTabId[];

/** @deprecated Use ANALYTICS_TAB_CONFIG.dashboard.items */
export const ANALYTICS_DASHBOARD_NAV_ITEMS = ANALYTICS_TAB_CONFIG.dashboard.items;

export function getDefaultAnalyticsSubView(tabId: AnalyticsTabId): string {
  if (tabId === 'dashboard') return 'responses';
  return ANALYTICS_TAB_CONFIG[tabId].items[0]?.id ?? tabId;
}

export function getAnalyticsViewLabel(tabId: AnalyticsTabId, subViewId: string): string {
  const item = ANALYTICS_TAB_CONFIG[tabId].items.find((entry) => entry.id === subViewId);
  return item?.label ?? ANALYTICS_TAB_CONFIG[tabId].label;
}

export interface SurveyAnalyticsSummary {
  viewed: number;
  totalResponses: number;
  completed: number;
  completionRate: number;
  dropouts: number;
  averageTimeLabel: string;
}

export interface SurveyAnalyticsCountryRow {
  country: string;
  responses: number;
  percent: number;
}

export interface SurveyAnalyticsAnswerRow {
  answer: string;
  count: number;
  percent: number;
}

export interface SurveyAnalyticsQuestionCard {
  id: string;
  title: string;
  answers: SurveyAnalyticsAnswerRow[];
  /** Index of the slice highlighted in blue on the pie chart. */
  highlightIndex: number;
}

export interface SurveyAnalyticsDashboardData {
  summary: SurveyAnalyticsSummary;
  countries: SurveyAnalyticsCountryRow[];
  questions: SurveyAnalyticsQuestionCard[];
}

const DEFAULT_SUMMARY: SurveyAnalyticsSummary = {
  viewed: 100,
  totalResponses: 100,
  completed: 100,
  completionRate: 100,
  dropouts: 0,
  averageTimeLabel: '2 min',
};

const DEFAULT_COUNTRIES: SurveyAnalyticsCountryRow[] = [
  { country: 'Unknown', responses: 100, percent: 100 },
];

const AGE_GROUP_QUESTION: SurveyAnalyticsQuestionCard = {
  id: 'age',
  title: 'What is your age group?',
  highlightIndex: 1,
  answers: [
    { answer: '18-25', count: 19, percent: 19 },
    { answer: '26-35', count: 27, percent: 27 },
    { answer: '36-45', count: 23, percent: 23 },
    { answer: '46-60', count: 18, percent: 18 },
    { answer: '60+', count: 13, percent: 13 },
  ],
};

const DISTRICT_QUESTION: SurveyAnalyticsQuestionCard = {
  id: 'district',
  title: 'Which district do you live in?',
  highlightIndex: 1,
  answers: [
    { answer: 'Kolkata', count: 28, percent: 28 },
    { answer: 'Howrah', count: 22, percent: 22 },
    { answer: 'North 24 Parganas', count: 18, percent: 18 },
    { answer: 'South 24 Parganas', count: 14, percent: 14 },
    { answer: 'Hooghly', count: 10, percent: 10 },
    { answer: 'Other', count: 8, percent: 8 },
  ],
};

function distributeCounts(total: number, optionCount: number): number[] {
  if (optionCount <= 0) return [];
  const base = Math.floor(total / optionCount);
  const remainder = total % optionCount;
  return Array.from({ length: optionCount }, (_, index) =>
    index === 0 ? base + remainder : base
  );
}

function buildQuestionCard(
  id: string,
  title: string,
  labels: string[],
  highlightIndex = 0,
  total = 100
): SurveyAnalyticsQuestionCard {
  const counts = distributeCounts(total, labels.length);
  const answers: SurveyAnalyticsAnswerRow[] = labels.map((answer, index) => ({
    answer,
    count: counts[index] ?? 0,
    percent: counts[index] ?? 0,
  }));

  return {
    id,
    title,
    highlightIndex: Math.min(highlightIndex, Math.max(0, labels.length - 1)),
    answers,
  };
}

function questionCardFromSurveyQuestion(
  questionId: string,
  title: string,
  optionLabels: string[]
): SurveyAnalyticsQuestionCard {
  return buildQuestionCard(questionId, title, optionLabels, 1);
}

export function getSurveyAnalyticsDashboardData(detail: SurveyDetail): SurveyAnalyticsDashboardData {
  const questions: SurveyAnalyticsQuestionCard[] = [];
  const seen = new Set<string>();

  for (const section of detail.sections) {
    for (const question of section.questions) {
      if (question.kind === 'multi-point-scales') continue;
      const labels = question.options
        .map((option) => option.label)
        .filter((label) => !/^(na|n\/a|not applicable)$/i.test(label.trim()));
      if (labels.length === 0) continue;

      let title = question.text;
      if (/^age$/i.test(title.trim()) || /age group/i.test(title)) {
        questions.push(AGE_GROUP_QUESTION);
        seen.add(question.id);
        continue;
      }
      if (/gender/i.test(question.text)) {
        title = 'What is your gender?';
      }

      questions.push(questionCardFromSurveyQuestion(question.id, title, labels));
      seen.add(question.id);
    }
  }

  if (!questions.some((q) => /gender/i.test(q.title))) {
    questions.unshift(
      buildQuestionCard('gender', 'What is your gender?', ['Male', 'Female', 'Non-binary'], 0)
    );
  }

  if (!questions.some((q) => /age/i.test(q.title))) {
    questions.unshift(AGE_GROUP_QUESTION);
  }

  questions.push(DISTRICT_QUESTION);

  return {
    summary: DEFAULT_SUMMARY,
    countries: DEFAULT_COUNTRIES,
    questions,
  };
}
