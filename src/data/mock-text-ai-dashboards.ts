import type { TextAiSegmentFilterState } from '@/data/mock-text-ai-segment-filters';
import { TEXT_AI_LANGUAGE_DEMOS } from '@/data/mock-text-ai-language-demos';

export type TextAiDashboardStatus = 'Completed' | 'In progress' | 'Draft';

export interface TextAiDashboardQuestion {
  id: string;
  text: string;
  /** Credits attributed to this question; the parent dashboard's total is the sum. */
  creditsUsed: number;
}

export interface TextAiDashboardCreationQuestion {
  code: string;
  context: string;
  text: string;
}

export interface TextAiDashboardCreationPreferences {
  censoredSubthemesEnabled?: boolean;
  alsoTranslateVerbatim?: boolean;
  codebookPreference: string;
  codebookFileDataUrl?: string;
  codebookFileName?: string;
  dashboardLayout: 'Combined dashboard' | 'Separate dashboard for each question';
  dataSourceName: string;
  dataSourceType: string;
  outputLanguage: string;
  questions: TextAiDashboardCreationQuestion[];
  themeModelingPrompt: string;
}

export interface TextAiSyncedCensoredResponse { id: number; sourceId: string; questionId: string; text: string; }

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
  /** Records already handled by the local Process Now simulation. */
  processedResponseIds?: string[];
  syncedCensoredResponses?: TextAiSyncedCensoredResponse[];
  /** Preferences captured when the dashboard was created. */
  creationPreferences?: TextAiDashboardCreationPreferences;
}

export const MOCK_TEXT_AI_DASHBOARDS: TextAiDashboard[] = [
  ...TEXT_AI_LANGUAGE_DEMOS.map((demo): TextAiDashboard => ({
    id: demo.id,
    name: `${demo.title} (${demo.language.name})`,
    creationDate: '2026-11-23T09:00:00.000Z',
    commentCount: demo.comments.length,
    status: 'Completed',
    questions: [{ id: `language-demo-${demo.id}-q1`, text: demo.question, creditsUsed: demo.comments.length }],
    creationPreferences: {
      alsoTranslateVerbatim: true,
      codebookPreference: 'Generate with QuestionPro AI',
      dashboardLayout: 'Combined dashboard',
      dataSourceName: demo.title,
      dataSourceType: 'Survey',
      outputLanguage: 'English (en)',
      questions: [{ code: 'Q1', text: demo.question, context: '' }],
      themeModelingPrompt: '',
    },
  })),
  {
    id: 23, name: "McDonald's Guest Experience Survey", creationDate: '2026-10-05T09:00:00.000Z', commentCount: 12, status: 'Completed',
    questions: [{ id: 'restaurant-feedback-q1', text: "How was your recent experience at McDonald's?", creditsUsed: 0 }],
    creationPreferences: { codebookPreference: 'Generate with QuestionPro AI', dashboardLayout: 'Combined dashboard', dataSourceName: 'Restaurant feedback', dataSourceType: 'Dataset', outputLanguage: 'English', themeModelingPrompt: 'Understand food, service and restaurant experience. Group off-topic, abusive, malicious and spam content under Outlier / Censored.', questions: [{ code: 'Q1', text: "How was your recent experience at McDonald's?", context: 'Feedback about food, service, cleanliness and value at the restaurant.' }] },
  },
  {
    id: 1,
    name: 'Sartorius Employee Pulse Survey — Round 2',
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
    name: 'Fight Night Attendee Feedback',
    creationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    commentCount: 1247,
    status: 'Completed',
  },
  {
    id: 3,
    name: 'Customer Interview Themes — UK & Europe',
    creationDate: '2026-05-15T12:00:00.000Z',
    commentCount: 3156,
    status: 'Completed',
  },
  {
    id: 4,
    name: 'Home Battery Use — U.S. Household Study',
    creationDate: '2026-01-28T12:00:00.000Z',
    commentCount: 892,
    status: 'Completed',
  },
  {
    id: 5,
    name: 'Brand Perception Survey — Q1 2026',
    creationDate: '2026-02-14T12:00:00.000Z',
    commentCount: 2043,
    status: 'Completed',
  },
  {
    id: 6,
    name: 'In-Store Shopping Feedback — Pilot Stores',
    creationDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    commentCount: 567,
    status: 'Completed',
  },
  {
    id: 7,
    name: 'Annual Employee Engagement Survey — 2025',
    creationDate: '2025-11-03T12:00:00.000Z',
    commentCount: 6734,
    status: 'Completed',
  },
  {
    id: 8,
    name: 'Mobile App Feedback — November Release',
    creationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    commentCount: 240,
    status: 'In progress',
  },
  {
    id: 9,
    name: 'Customer NPS Follow-Up — Wave 4',
    creationDate: '2026-04-02T12:00:00.000Z',
    commentCount: 1589,
    status: 'Completed',
  },
  {
    id: 10,
    name: 'Customer Support Ticket Themes — EMEA',
    creationDate: '2026-03-18T12:00:00.000Z',
    commentCount: 4210,
    status: 'Completed',
  },
  {
    id: 11,
    name: 'Reasons Customers Abandon Checkout — Holiday Shopping Study',
    creationDate: '2025-09-22T12:00:00.000Z',
    commentCount: 98,
    status: 'Completed',
  },
  {
    id: 12,
    name: 'New Customer Onboarding Feedback',
    creationDate: '2026-05-01T12:00:00.000Z',
    commentCount: 0,
    status: 'Draft',
  },
  {
    id: 13,
    name: 'Subscription Cancellation Interviews — APAC',
    creationDate: '2026-03-05T12:00:00.000Z',
    commentCount: 876,
    status: 'Completed',
  },
  {
    id: 14,
    name: 'Website Redesign Feedback — Wave 7',
    creationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    commentCount: 2341,
    status: 'Completed',
  },
  {
    id: 15,
    name: 'Clinical Study Participant Experience',
    creationDate: '2025-12-10T12:00:00.000Z',
    commentCount: 1124,
    status: 'Completed',
  },
  {
    id: 16,
    name: 'Customer Summit 2026 — Attendee Feedback',
    creationDate: '2026-04-22T12:00:00.000Z',
    commentCount: 645,
    status: 'Completed',
  },
  {
    id: 17,
    name: 'Insurance Claims Experience Survey',
    creationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    commentCount: 512,
    status: 'In progress',
  },
  {
    id: 18,
    name: 'Student Course Evaluations — Fall 2025',
    creationDate: '2026-01-15T12:00:00.000Z',
    commentCount: 3892,
    status: 'Completed',
  },
  {
    id: 19,
    name: 'Brand Mentions and Customer Sentiment — October 2025',
    creationDate: '2025-10-28T12:00:00.000Z',
    commentCount: 9104,
    status: 'Completed',
  },
  {
    id: 20,
    name: 'Product Concept Focus Groups — Round 1',
    creationDate: '2026-02-28T12:00:00.000Z',
    commentCount: 278,
    status: 'Completed',
  },
  {
    id: 21,
    name: 'Channel Partner Feedback — Latin America',
    creationDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    commentCount: 1433,
    status: 'Completed',
  },
  {
    id: 22,
    name: 'Manufacturing Site Employee Feedback',
    creationDate: '2026-05-10T12:00:00.000Z',
    commentCount: 0,
    status: 'Draft',
  },
];
