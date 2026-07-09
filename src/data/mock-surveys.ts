export type SurveyStatus = 'Active - Published' | 'Active - Draft' | 'Closed' | 'Scheduled';

export interface SurveyFolder {
  id: string;
  name: string;
  shortLabel: string;
  count: number;
}

export interface Survey {
  id: number;
  name: string;
  folderId: string;
  createdAt: string;
  modifiedAt: string;
  status: SurveyStatus;
  responses: number;
}

export const SURVEY_TOTAL_COUNT = 1349;

export const MOCK_SURVEY_FOLDERS: SurveyFolder[] = [
  { id: 'all', name: 'My Surveys', shortLabel: 'MS', count: 1349 },
  { id: 'text-ai', name: 'Text AI', shortLabel: 'TA', count: 6 },
  { id: 'participant-id', name: 'Participant ID', shortLabel: 'PI', count: 3 },
  { id: 'rmb', name: 'RMB', shortLabel: 'RMB', count: 9 },
  { id: 'nba-templates', name: 'NBA templates', shortLabel: 'NT', count: 19 },
  { id: 'offline-2024', name: 'Offline 2024', shortLabel: 'O24', count: 3 },
  { id: 'demo-2026', name: 'Demo 2026', shortLabel: 'D26', count: 28 },
  { id: 'research-bootcamp', name: 'Research Bootcamp', shortLabel: 'RB', count: 14 },
  {
    id: 'long-folder',
    name: 'Enterprise customer feedback templates — EMEA region',
    shortLabel: 'EC',
    count: 2,
  },
];

export const MOCK_SURVEYS: Survey[] = [
  {
    id: 1,
    name: 'custom variable data',
    folderId: 'all',
    createdAt: '2026-05-26T10:00:00Z',
    modifiedAt: '2026-05-25T14:30:00Z',
    status: 'Active - Published',
    responses: 6,
  },
  {
    id: 2,
    name: 'Bengal Elections: Voter Sentiment & Turnout Analysis Q2 2026',
    folderId: 'demo-2026',
    createdAt: '2026-05-24T09:00:00Z',
    modifiedAt: '2026-05-24T16:45:00Z',
    status: 'Active - Published',
    responses: 142,
  },
  {
    id: 3,
    name: 'Employee Engagement Survey',
    folderId: 'research-bootcamp',
    createdAt: '2026-05-22T11:00:00Z',
    modifiedAt: '2026-05-23T08:15:00Z',
    status: 'Active - Published',
    responses: 89,
  },
  {
    id: 4,
    name: 'smiley',
    folderId: 'text-ai',
    createdAt: '2026-05-20T13:00:00Z',
    modifiedAt: '2026-05-21T10:00:00Z',
    status: 'Active - Draft',
    responses: 0,
  },
  {
    id: 5,
    name: 'tab 2 survey',
    folderId: 'all',
    createdAt: '2026-05-18T08:00:00Z',
    modifiedAt: '2026-05-19T12:30:00Z',
    status: 'Active - Published',
    responses: 24,
  },
  {
    id: 6,
    name: 'NPS — Product Launch Feedback',
    folderId: 'nba-templates',
    createdAt: '2026-05-15T10:00:00Z',
    modifiedAt: '2026-05-17T09:00:00Z',
    status: 'Active - Published',
    responses: 312,
  },
  {
    id: 7,
    name: 'Offline intercept — Retail store 2024',
    folderId: 'offline-2024',
    createdAt: '2026-05-12T14:00:00Z',
    modifiedAt: '2026-05-14T11:00:00Z',
    status: 'Closed',
    responses: 58,
  },
  {
    id: 8,
    name: 'Participant ID validation study',
    folderId: 'participant-id',
    createdAt: '2026-05-10T09:30:00Z',
    modifiedAt: '2026-05-11T15:00:00Z',
    status: 'Active - Published',
    responses: 17,
  },
  {
    id: 9,
    name: 'RMB brand tracker — Wave 3',
    folderId: 'rmb',
    createdAt: '2026-05-08T11:00:00Z',
    modifiedAt: '2026-05-09T10:00:00Z',
    status: 'Active - Published',
    responses: 445,
  },
  {
    id: 10,
    name: 'Text AI — open-ended comment analysis pilot',
    folderId: 'text-ai',
    createdAt: '2026-05-05T08:00:00Z',
    modifiedAt: '2026-05-07T13:00:00Z',
    status: 'Active - Published',
    responses: 73,
  },
  {
    id: 11,
    name: 'Demo 2026 — conjoint pricing study',
    folderId: 'demo-2026',
    createdAt: '2026-05-03T12:00:00Z',
    modifiedAt: '2026-05-04T09:30:00Z',
    status: 'Scheduled',
    responses: 0,
  },
  {
    id: 12,
    name: 'Bootcamp Week 2 — questionnaire design exercise',
    folderId: 'research-bootcamp',
    createdAt: '2026-05-01T10:00:00Z',
    modifiedAt: '2026-05-02T14:00:00Z',
    status: 'Active - Draft',
    responses: 0,
  },
  {
    id: 13,
    name: 'Video AI',
    folderId: 'all',
    createdAt: '2026-06-03T09:00:00Z',
    modifiedAt: '2026-06-10T11:30:00Z',
    status: 'Active - Published',
    responses: 46,
  },
  {
    id: 14,
    name: 'reCAPTCHA v3',
    folderId: 'all',
    createdAt: '2026-06-23T10:00:00Z',
    modifiedAt: '2026-06-23T10:00:00Z',
    status: 'Active - Draft',
    responses: 0,
  },
  {
    id: 15,
    name: 'Survey Menu',
    folderId: 'all',
    createdAt: '2026-06-23T12:00:00Z',
    modifiedAt: '2026-06-23T12:00:00Z',
    status: 'Active - Draft',
    responses: 0,
  },
  {
    id: 16,
    name: 'DeepDive V2',
    folderId: 'all',
    createdAt: '2026-07-01T09:00:00Z',
    modifiedAt: '2026-07-08T14:20:00Z',
    status: 'Active - Draft',
    responses: 0,
  },
];

export const SURVEYS_PAGE_SIZE = 100;
