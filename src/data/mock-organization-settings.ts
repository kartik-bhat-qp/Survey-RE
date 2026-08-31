/** Remaining TextAI / organization credits for the current account. */
export const MOCK_ORGANIZATION_CREDIT_BALANCE = 15000;

export const MOCK_QUESTIONPRO_AI_ENABLED = true;

/** Personal coding-preference state for the signed-in prototype user. */
export const MOCK_PERSONAL_CODING_PREFERENCES = {
  acceptedCodingChanges: 37,
  enabled: true,
  lastUpdated: '2026-08-22T09:30:00.000Z',
};

export interface TextAiCreditLogEntry {
  createdOn: string;
  creditsUsed: number;
  dashboard: string;
  id: string;
  type: 'Initial processing' | 'Process now' | 'Recode';
}

/** Production-shaped Text AI credit activity for the Settings logs tab. */
export const MOCK_TEXT_AI_CREDIT_LOGS: TextAiCreditLogEntry[] = [
  {
    id: 'text-ai-log-1',
    dashboard: 'Sartoris round 2',
    type: 'Recode',
    creditsUsed: 184,
    createdOn: '2026-08-26T10:42:00.000Z',
  },
  {
    id: 'text-ai-log-2',
    dashboard: 'Sartoris round 2',
    type: 'Process now',
    creditsUsed: 1420,
    createdOn: '2026-08-24T08:15:00.000Z',
  },
  {
    id: 'text-ai-log-3',
    dashboard: 'Against fathom round 2 (EU-UK)',
    type: 'Initial processing',
    creditsUsed: 3156,
    createdOn: '2026-05-15T12:00:00.000Z',
  },
  {
    id: 'text-ai-log-4',
    dashboard: 'Brand sentiment — open ends Q1',
    type: 'Initial processing',
    creditsUsed: 2043,
    createdOn: '2026-02-14T12:00:00.000Z',
  },
];
