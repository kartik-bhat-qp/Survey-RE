export type EngagementGitAction = 'push' | 'pull';

export interface EngagementAgentPrompt {
  text: string;
  createdAt?: string;
}

export interface EngagementGitLogEntry {
  id: string;
  action: EngagementGitAction;
  /** Short headline, e.g. "Pushed 3 commits to origin/main" */
  summary: string;
  /** High-level change bullets (commit subjects / file highlights) */
  changes: string[];
  /** User prompts sent to the agent that produced this work */
  prompts?: EngagementAgentPrompt[];
  branch: string;
  remote: string;
  author: string;
  /** ISO timestamp */
  createdAt: string;
}

export const ENGAGEMENT_LOGS_URL = '/engagement-logs.json';

export const ENGAGEMENT_GIT_ACTION_LABEL: Record<EngagementGitAction, string> = {
  push: 'Push',
  pull: 'Pull',
};

/** Seed entries so the Logs page is demonstrable before the first hook runs. */
export const MOCK_ENGAGEMENT_GIT_LOGS: EngagementGitLogEntry[] = [
  {
    id: 'log-seed-1',
    action: 'push',
    summary: 'Pushed 4 commits to origin/main',
    changes: [
      'Moved Create new base into the Base dropdown',
      'Capped notification To field at 3 chip rows with scroll',
      'Added org-user picker for Quota Notification recipients',
      '12 files changed · +486 −94',
    ],
    prompts: [
      {
        text: 'Move Create new base into the Base dropdown instead of a separate button.',
        createdAt: '2026-08-11T10:48:00.000Z',
      },
      {
        text: 'Cap the notification To field at 3 chip rows and scroll after that.',
        createdAt: '2026-08-11T10:57:00.000Z',
      },
    ],
    branch: 'main',
    remote: 'origin',
    author: 'Kartik Bhat',
    createdAt: '2026-08-11T11:10:00.000Z',
  },
  {
    id: 'log-seed-2',
    action: 'pull',
    summary: 'Pulled 2 commits from origin/main',
    changes: [
      'Synced latest dashboard shell scroll fixes',
      'Updated WickUI table defaults for BI list pages',
      '5 files changed · +62 −28',
    ],
    prompts: [
      {
        text: 'Pull the latest dashboard shell scroll fixes and keep BI list tables on WickUI defaults.',
        createdAt: '2026-08-11T09:30:00.000Z',
      },
    ],
    branch: 'main',
    remote: 'origin',
    author: 'Kartik Bhat',
    createdAt: '2026-08-11T09:42:00.000Z',
  },
];

export function formatEngagementLogTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}
