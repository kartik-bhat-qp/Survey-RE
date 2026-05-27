export type SurveyWorkspaceTool =
  | 'workspace'
  | 'design'
  | 'media-library'
  | 'languages'
  | 'finish-options'
  | 'advanced-quota'
  | 'advance-quotas'
  | 'variables'
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
  { id: 'languages', label: 'Languages', icon: 'wm-language' },
  { id: 'finish-options', label: 'Finish Options', icon: 'wm-flag' },
  { id: 'advanced-quota', label: 'Advanced Quota', icon: 'wm-link' },
  { id: 'advance-quotas', label: 'Quota Management', icon: 'wm-pie-chart' },
  { id: 'variables', label: 'Variables', icon: 'wm-code' },
  { id: 'settings', label: 'Settings', icon: 'wm-settings' },
];
