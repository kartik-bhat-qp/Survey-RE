import type { SurveyDetail } from '@/data/mock-survey-detail';

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

export type SurveyAnalyticsNavTabId = 'dashboard' | 'analysis' | 'text-analysis' | 'manage-data';

export interface SurveyAnalyticsNavMenuItem {
  id: string;
  label: string;
}

export interface SurveyAnalyticsNavTab {
  id: SurveyAnalyticsNavTabId;
  label: string;
  icon: string;
  menuItems: SurveyAnalyticsNavMenuItem[];
}

export const SURVEY_ANALYTICS_NAV_TABS: SurveyAnalyticsNavTab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'wm-show-chart',
    menuItems: [
      { id: 'default', label: 'Default dashboard' },
      { id: 'new', label: 'New dashboard' },
      { id: 'manage', label: 'Manage dashboards' },
    ],
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: 'wm-analytics',
    menuItems: [
      { id: 'crosstab', label: 'Crosstab' },
      { id: 'trend', label: 'Trend analysis' },
      { id: 'comparison', label: 'Comparison' },
    ],
  },
  {
    id: 'text-analysis',
    label: 'Text Analysis',
    icon: 'wm-grid-view',
    menuItems: [
      { id: 'sentiment', label: 'Sentiment' },
      { id: 'word-cloud', label: 'Word cloud' },
      { id: 'topics', label: 'Topics' },
    ],
  },
  {
    id: 'manage-data',
    label: 'Manage Data',
    icon: 'wm-storage',
    menuItems: [
      { id: 'responses', label: 'View responses' },
      { id: 'export', label: 'Export data' },
      { id: 'filters', label: 'Response filters' },
    ],
  },
];

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
