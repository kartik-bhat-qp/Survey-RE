export type SurveyWorkspaceTool =
  | 'workspace'
  | 'design'
  | 'media-library'
  | 'advanced-quota'
  | 'advance-quotas'
  | 'settings';

export interface SurveyWorkspaceToolItem {
  id: SurveyWorkspaceTool;
  label: string;
  icon: string;
}

export const SURVEY_WORKSPACE_TOOLS: SurveyWorkspaceToolItem[] = [
  { id: 'workspace', label: 'Workspace', icon: 'wm-dashboard' },
  { id: 'design', label: 'Design', icon: 'wm-brush' },
  { id: 'media-library', label: 'Media Library', icon: 'wm-perm-media' },
  { id: 'advanced-quota', label: 'Advanced Quota', icon: 'wm-link' },
  { id: 'advance-quotas', label: 'Quota Management', icon: 'wm-pie-chart' },
  { id: 'settings', label: 'Settings', icon: 'wm-settings' },
];
