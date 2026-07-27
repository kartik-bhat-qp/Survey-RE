import type {
  TextAiDashboard,
  TextAiDashboardCreationPreferences,
} from '@/data/mock-text-ai-dashboards';
import { MOCK_TEXT_AI_ANALYSIS_QUESTIONS } from '@/data/mock-text-ai-questions';

export type TextAiRecodeAction =
  | 'granularity-changed'
  | 'recode-run'
  | 'response-tagged'
  | 'response-untagged'
  | 'sub-themes-merged'
  | 'sub-theme-created'
  | 'theme-created'
  | 'sub-theme-deleted'
  | 'sub-theme-renamed'
  | 'sub-theme-description-updated'
  | 'sub-theme-updated'
  | 'theme-rejected'
  | 'sub-theme-rejected';

export interface TextAiRecodeLogEntry {
  action: TextAiRecodeAction;
  dashboardId: number;
  details: string;
  id: string;
  occurredAt: string;
  question: string;
  title: string;
}

type NewTextAiRecodeLogEntry = Omit<TextAiRecodeLogEntry, 'id' | 'occurredAt'>;

const STORAGE_KEY = 'bi-stats-text-ai-recode-logs';
const SEEDED_LOG_BASE_TIME = Date.now() - 45 * 60 * 1000;

const SEEDED_RECODE_LOGS: Array<
  Pick<TextAiRecodeLogEntry, 'action' | 'details' | 'question' | 'title'>
> = [
  {
    action: 'response-tagged',
    details:
      'Tagged 184 responses with “Service Speed and Efficiency”.',
    question:
      'What can we do to improve your opinion about our company as a place to work?',
    title: 'Responses tagged',
  },
  {
    action: 'response-untagged',
    details:
      'Removed “Pricing Concerns and Customer Feedback” from 32 responses.',
    question:
      'What can we do to improve your opinion about our company as a place to work?',
    title: 'Responses untagged',
  },
  {
    action: 'sub-themes-merged',
    details:
      'Merged “Staff Courtesy” and “Staff Friendliness” into “Staff Friendliness and Professionalism”.',
    question:
      'What can we do to improve your opinion about our company as a place to work?',
    title: 'Sub-themes merged',
  },
  {
    action: 'sub-theme-created',
    details:
      'Created “Order Accuracy and Completeness” under “Customer Experience Feedback Analysis”.',
    question:
      'What can we do to improve your opinion about our company as a place to work?',
    title: 'New sub-theme created',
  },
  {
    action: 'theme-created',
    details:
      'Created “Digital Ordering Experience” with 3 initial sub-themes.',
    question:
      'What can we do to improve your opinion about our company as a place to work?',
    title: 'New theme created',
  },
  {
    action: 'sub-theme-deleted',
    details:
      'Deleted “Legacy Service Classification”; 18 responses became untagged.',
    question:
      'What can we do to improve your opinion about our company as a place to work?',
    title: 'Sub-theme deleted',
  },
  {
    action: 'sub-theme-renamed',
    details:
      'Renamed “Service Wait Time” to “Service Speed and Efficiency”.',
    question:
      'What can we do to improve your opinion about our company as a place to work?',
    title: 'Sub-theme renamed',
  },
  {
    action: 'sub-theme-description-updated',
    details:
      'Updated the description for “Customer Experience Differentiation”.',
    question:
      'What can we do to improve your opinion about our company as a place to work?',
    title: 'Sub-theme description updated',
  },
];

function getSeededRecodeLogs(dashboardId: number): TextAiRecodeLogEntry[] {
  return SEEDED_RECODE_LOGS.map((entry, index) => ({
    ...entry,
    dashboardId,
    id: `seed-${dashboardId}-${entry.action}-${index}`,
    occurredAt: new Date(SEEDED_LOG_BASE_TIME - index * 8 * 60 * 1000).toISOString(),
  }));
}

function readAllRecodeLogs(): TextAiRecodeLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TextAiRecodeLogEntry[]) : [];
  } catch {
    return [];
  }
}

export function getTextAiRecodeLogs(dashboardId: number): TextAiRecodeLogEntry[] {
  return [
    ...readAllRecodeLogs().filter((entry) => entry.dashboardId === dashboardId),
    ...getSeededRecodeLogs(dashboardId),
  ]
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
    );
}

export function appendTextAiRecodeLog(entry: NewTextAiRecodeLogEntry): void {
  if (typeof window === 'undefined') return;
  const occurredAt = new Date().toISOString();
  const completeEntry: TextAiRecodeLogEntry = {
    ...entry,
    id: `${entry.dashboardId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    occurredAt,
  };
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([completeEntry, ...readAllRecodeLogs()])
  );
}

export function getTextAiDashboardCreationPreferences(
  dashboard: TextAiDashboard
): TextAiDashboardCreationPreferences {
  if (dashboard.creationPreferences) return dashboard.creationPreferences;

  const questions = dashboard.questions?.length
    ? dashboard.questions.map((question, index) => ({
        code: `Q${index + 2}`,
        context: '',
        text: question.text,
      }))
    : MOCK_TEXT_AI_ANALYSIS_QUESTIONS.map((question) => ({
        code: question.code,
        context: '',
        text: question.text,
      }));

  return {
    codebookPreference: 'Generated by QuestionPro AI',
    dataSourceName:
      dashboard.id === 2
        ? 'QuestionPro - RE employee pulse survey'
        : `${dashboard.name} source survey`,
    dataSourceType: 'Surveys',
    outputLanguage: 'English',
    questions,
    themeModelingPrompt:
      'Identify the recurring themes, supporting sub-themes, and actionable insights across open-ended responses.',
  };
}
