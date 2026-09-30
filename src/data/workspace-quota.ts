import type { Workspace } from './mock-workspaces';

export const CSM_WORKSPACE_MESSAGE = 'Please reach out to your CSM for purchasing additional workspaces.';
export type OwnedWorkspace = Workspace & { ownerId: string | null; kind: 'individual' | 'organization' };
export interface WorkspaceQuotaState {
  workspaces: OwnedWorkspace[];
  purchasedSlots: number;
  quotaStatus: 'ready' | 'loading' | 'error';
}
export function workspaceCapacity(state: WorkspaceQuotaState) {
  const counts = new Map<string, number>();
  for (const workspace of state.workspaces) {
    if (workspace.kind === 'individual' && workspace.ownerId) counts.set(workspace.ownerId, (counts.get(workspace.ownerId) ?? 0) + 1);
  }
  const used = [...counts.values()].reduce((total, count) => total + Math.max(0, count - 1), 0);
  return { used, available: Math.max(0, state.purchasedSlots - used), total: state.purchasedSlots };
}
export function workspaceDeleteError(state: WorkspaceQuotaState, id: number, userId: string): string | null {
  const workspace = state.workspaces.find((item) => item.id === id);
  if (!workspace) return 'This workspace is no longer available.';
  if (workspace.kind === 'organization') return 'Your organization must retain its one organization workspace.';
  if (workspace.ownerId !== userId) return 'Only workspaces you own can be deleted here.';
  if (state.workspaces.filter((item) => item.kind === 'individual' && item.ownerId === userId).length <= 1) return 'You must keep at least one individual workspace.';
  return null;
}
export type WorkspaceMutation = { state: WorkspaceQuotaState; error: string | null };
export function createIndividualWorkspace(state: WorkspaceQuotaState, userId: string, name: string, date: string): WorkspaceMutation {
  if (state.quotaStatus !== 'ready') return { state, error: 'Workspace availability could not be verified. Please try again.' };
  if (!state.workspaces.some((item) => item.ownerId === userId && item.kind === 'individual')) return { state, error: 'Your included workspace must be provisioned before creating additional workspaces.' };
  if (workspaceCapacity(state).available === 0) return { state, error: CSM_WORKSPACE_MESSAGE };
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 100) return { state, error: 'Enter a workspace name between 1 and 100 characters.' };
  const workspace: OwnedWorkspace = {
    id: Math.max(0, ...state.workspaces.map((item) => item.id)) + 1,
    name: trimmedName, updatedAt: date, scope: 'mine', kind: 'individual', ownerId: userId,
    stats: { dashboards: 0, surveyStacks: 0, biVariables: 0, reports: 0 },
  };
  return { state: { ...state, workspaces: [...state.workspaces, workspace] }, error: null };
}
export function deleteIndividualWorkspace(state: WorkspaceQuotaState, userId: string, id: number): WorkspaceMutation {
  const error = workspaceDeleteError(state, id, userId);
  if (error) return { state, error };
  return { state: { ...state, workspaces: state.workspaces.filter((item) => item.id !== id) }, error: null };
}
