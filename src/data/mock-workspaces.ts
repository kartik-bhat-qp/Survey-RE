export interface WorkspaceStats {
  dashboards: number;
  surveyStacks: number;
  biVariables: number;
  reports: number;
}

export type WorkspaceScope = 'mine' | 'shared';

export interface Workspace {
  id: number;
  name: string;
  updatedAt: string;
  scope: WorkspaceScope;
  stats: WorkspaceStats;
}

export const MOCK_MY_WORKSPACES: Workspace[] = [
  {
    id: 1,
    name: 'Jayaprakash Pattanaik',
    updatedAt: '2026-01-27',
    scope: 'mine',
    stats: { dashboards: 213, surveyStacks: 13, biVariables: 16, reports: 26 },
  },
  {
    id: 2,
    name: '2026 projects',
    updatedAt: '2026-04-06',
    scope: 'mine',
    stats: { dashboards: 0, surveyStacks: 0, biVariables: 0, reports: 0 },
  },
  {
    id: 4,
    name: 'Enterprise Customer Experience Research Workspace for longitudinal brand tracking',
    updatedAt: '2025-11-03',
    scope: 'mine',
    stats: { dashboards: 4, surveyStacks: 2, biVariables: 8, reports: 1 },
  },
];

export const MOCK_SHARED_WORKSPACES: Workspace[] = [
  {
    id: 3,
    name: 'Jayaprakash Pattanaik',
    updatedAt: '2026-01-27',
    scope: 'shared',
    stats: { dashboards: 213, surveyStacks: 13, biVariables: 16, reports: 26 },
  },
];

export function getWorkspaceById(id: number): Workspace | undefined {
  return [...MOCK_MY_WORKSPACES, ...MOCK_SHARED_WORKSPACES].find((w) => w.id === id);
}
