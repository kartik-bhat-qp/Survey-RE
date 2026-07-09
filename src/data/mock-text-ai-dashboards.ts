import type { TextAiSegmentFilterState } from '@/data/mock-text-ai-segment-filters';

export type TextAiDashboardStatus = 'Completed' | 'In progress' | 'Draft';

export interface TextAiDashboardQuestion {
  id: string;
  text: string;
  /** Credits attributed to this question; the parent dashboard's total is the sum. */
  creditsUsed: number;
}

export interface TextAiDashboard {
  id: number;
  name: string;
  creationDate: string;
  commentCount: number;
  status: TextAiDashboardStatus;
  /** Optional list of source questions this TextAI dashboard analyses. */
  questions?: TextAiDashboardQuestion[];
  /** Current response filters used for TextAI processing. */
  segmentFilters?: TextAiSegmentFilterState;
}

export const MOCK_TEXT_AI_DASHBOARDS: TextAiDashboard[] = [
  {
    id: 1,
    name: 'Sartoris round 2',
    creationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    commentCount: 4820,
    status: 'Completed',
    questions: [
      {
        id: 'sartoris-r2-q1',
        text: 'What can we do to improve your opinion about Sartorius as a workplace?',
        creditsUsed: 1420,
      },
      {
        id: 'sartoris-r2-q2',
        text: 'What do you appreciate most about working for Sartorius?',
        creditsUsed: 1210,
      },
      {
        id: 'sartoris-r2-q3',
        text: 'In your opinion, what drives the success of Sartorius?',
        creditsUsed: 1180,
      },
      {
        id: 'sartoris-r2-q4',
        text: 'In your opinion, what may hinder the further success of Sartorius?',
        creditsUsed: 1010,
      },
    ],
  },
  {
    id: 2,
    name: 'Fun fight',
    creationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    commentCount: 1247,
    status: 'Completed',
  },
  {
    id: 3,
    name: 'Against fathom round 2 (EU-UK)',
    creationDate: '2026-05-15T12:00:00.000Z',
    commentCount: 3156,
    status: 'Completed',
  },
  {
    id: 4,
    name: 'Battery Usage During COVID-19: US Wave 22-45',
    creationDate: '2026-01-28T12:00:00.000Z',
    commentCount: 892,
    status: 'Completed',
  },
  {
    id: 5,
    name: 'Brand sentiment — open ends Q1',
    creationDate: '2026-02-14T12:00:00.000Z',
    commentCount: 2043,
    status: 'Completed',
  },
  {
    id: 6,
    name: 'Customer verbatims — retail pilot',
    creationDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    commentCount: 567,
    status: 'Completed',
  },
  {
    id: 7,
    name: 'Employee pulse comments 2025',
    creationDate: '2025-11-03T12:00:00.000Z',
    commentCount: 6734,
    status: 'Completed',
  },
  {
    id: 8,
    name: 'Product feedback themes — mobile app',
    creationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    commentCount: 240,
    status: 'In progress',
  },
  {
    id: 9,
    name: 'NPS follow-up text analysis wave 4',
    creationDate: '2026-04-02T12:00:00.000Z',
    commentCount: 1589,
    status: 'Completed',
  },
  {
    id: 10,
    name: 'Support ticket summaries — EMEA',
    creationDate: '2026-03-18T12:00:00.000Z',
    commentCount: 4210,
    status: 'Completed',
  },
  {
    id: 11,
    name: 'This is an extremely long TextAI dashboard name used to verify truncation and layout in the table without breaking the row alignment',
    creationDate: '2025-09-22T12:00:00.000Z',
    commentCount: 98,
    status: 'Completed',
  },
  {
    id: 12,
    name: 'Onboarding survey open responses',
    creationDate: '2026-05-01T12:00:00.000Z',
    commentCount: 0,
    status: 'Draft',
  },
  {
    id: 13,
    name: 'Churn exit interview themes — APAC',
    creationDate: '2026-03-05T12:00:00.000Z',
    commentCount: 876,
    status: 'Completed',
  },
  {
    id: 14,
    name: 'Website feedback verbatims wave 7',
    creationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    commentCount: 2341,
    status: 'Completed',
  },
  {
    id: 15,
    name: 'Clinical trial participant comments',
    creationDate: '2025-12-10T12:00:00.000Z',
    commentCount: 1124,
    status: 'Completed',
  },
  {
    id: 16,
    name: 'Post-event survey open text — summit 2026',
    creationDate: '2026-04-22T12:00:00.000Z',
    commentCount: 645,
    status: 'Completed',
  },
  {
    id: 17,
    name: 'Insurance claims narrative analysis',
    creationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    commentCount: 512,
    status: 'In progress',
  },
  {
    id: 18,
    name: 'University course evaluation comments',
    creationDate: '2026-01-15T12:00:00.000Z',
    commentCount: 3892,
    status: 'Completed',
  },
  {
    id: 19,
    name: 'Social listening text corpus — brand X',
    creationDate: '2025-10-28T12:00:00.000Z',
    commentCount: 9104,
    status: 'Completed',
  },
  {
    id: 20,
    name: 'Focus group transcript synthesis round 1',
    creationDate: '2026-02-28T12:00:00.000Z',
    commentCount: 278,
    status: 'Completed',
  },
  {
    id: 21,
    name: 'Partner channel feedback — LATAM',
    creationDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    commentCount: 1433,
    status: 'Completed',
  },
  {
    id: 22,
    name: 'Voice of employee — manufacturing sites',
    creationDate: '2026-05-10T12:00:00.000Z',
    commentCount: 0,
    status: 'Draft',
  },
];
