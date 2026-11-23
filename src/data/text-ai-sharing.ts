import type { Layout } from 'react-grid-layout/legacy';
import type { TextAiAddedWidget } from '@/components/text-ai/TextAiDashboardCanvas';
import type { DashboardDesign } from './dashboard-design';
import type { TextAiDashboardQuestion, TextAiSyncedCensoredResponse } from './mock-text-ai-dashboards';
import type { TextAiKpiWidgetInstance } from './mock-text-ai-kpi-by-theme';
import type { TextAiSubthemeTrendWidgetInstance } from './mock-text-ai-subtheme-trend';
import type { TextAiThemePreferences } from './text-ai-theme-preferences';
import type { TagAssignments } from './text-ai-tag-drafts';
import type { TextAiResponseFilter } from './text-ai-widget-settings';

export interface TextAiSharedCanvasState {
  removedWidgetIds: string[];
  layout: Layout;
  assignments: TagAssignments;
  widgetSettings: Record<string, unknown>;
}

export interface TextAiSharedDashboard {
  dashboardId: number;
  name: string;
  selectedQuestion: TextAiDashboardQuestion;
  questionIndex: number;
  design: DashboardDesign;
  themePreferences: TextAiThemePreferences;
  responseFilter: TextAiResponseFilter;
  widgets: TextAiAddedWidget[];
  comparisons: { id: string; question: string }[];
  kpis: TextAiKpiWidgetInstance[];
  trends: TextAiSubthemeTrendWidgetInstance[];
  censoredSubthemesEnabled: boolean;
  syncedCensoredResponses?: TextAiSyncedCensoredResponse[];
  canvas: TextAiSharedCanvasState;
}

export interface TextAiShareView {
  dashboard: TextAiSharedDashboard;
  showOriginalResponses: boolean;
}

export interface TextAiShareFilters {
  theme: string;
  subtheme: string;
  sentiment: string;
}

export const EMPTY_TEXT_AI_SHARE_FILTERS: TextAiShareFilters = { theme: '', subtheme: '', sentiment: '' };

export const TEXT_AI_SHARE_TOKEN = /^[a-f0-9]{32}$/;
export function textAiSharePath(token: string): string {
  return `/share/text-ai/${token}`;
}

export function isTextAiSharedDashboard(value: unknown): value is TextAiSharedDashboard {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<TextAiSharedDashboard>;
  return Number.isSafeInteger(snapshot.dashboardId) && typeof snapshot.name === 'string' &&
    Number.isInteger(snapshot.questionIndex) &&
    typeof snapshot.selectedQuestion?.id === 'string' && typeof snapshot.selectedQuestion.text === 'string' &&
    !!snapshot.design?.typography && !!snapshot.themePreferences?.emergingApprovedAtByName &&
    Array.isArray(snapshot.themePreferences.approvedEmergingNames) && typeof snapshot.responseFilter?.query === 'string' &&
    [snapshot.widgets, snapshot.comparisons, snapshot.kpis, snapshot.trends, snapshot.canvas?.layout,
      snapshot.canvas?.removedWidgetIds].every(Array.isArray) &&
    !!snapshot.canvas?.assignments && !!snapshot.canvas.widgetSettings;
}
