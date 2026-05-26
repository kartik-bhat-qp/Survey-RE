import type { TextAiDashboardStatus } from '@/data/mock-text-ai-dashboards';

export interface TextAiDashboardQuestion {
  id: number;
  code: string;
  text: string;
  type: 'Text';
  creationDate: string;
  commentCount: number;
  status: TextAiDashboardStatus;
}

export const SARTORIS_TEXT_AI_DASHBOARD_ID = 1;

const SARTORIS_DASHBOARD_CREATION_DATE = new Date(
  Date.now() - 3 * 24 * 60 * 60 * 1000
).toISOString();

const SARTORIS_DASHBOARD_QUESTIONS: TextAiDashboardQuestion[] = [
  {
    id: 1,
    code: 'Q2',
    text: 'What can we do to improve your opinion about Sartorius as a workplace?',
    type: 'Text',
    creationDate: SARTORIS_DASHBOARD_CREATION_DATE,
    commentCount: 2100,
    status: 'Completed',
  },
  {
    id: 2,
    code: 'Q3',
    text: 'What do you appreciate most about working for Sartorius?',
    type: 'Text',
    creationDate: SARTORIS_DASHBOARD_CREATION_DATE,
    commentCount: 1420,
    status: 'Completed',
  },
  {
    id: 3,
    code: 'Q6',
    text: 'Is there anything else that Sartorius as your employer can do to improve your current working situation?',
    type: 'Text',
    creationDate: SARTORIS_DASHBOARD_CREATION_DATE,
    commentCount: 1300,
    status: 'Completed',
  },
];

/** Questions shown when expanding a TextAI dashboard row on the list page. */
export function getTextAiDashboardQuestions(dashboardId: number): TextAiDashboardQuestion[] {
  if (dashboardId === SARTORIS_TEXT_AI_DASHBOARD_ID) {
    return SARTORIS_DASHBOARD_QUESTIONS;
  }
  return [];
}

export function textAiDashboardHasQuestions(dashboardId: number): boolean {
  return getTextAiDashboardQuestions(dashboardId).length > 0;
}
