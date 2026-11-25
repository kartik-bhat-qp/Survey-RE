import type { Layout } from 'react-grid-layout/legacy';
import type { TextAiAddedWidget } from '@/components/text-ai/TextAiDashboardCanvas';
import type { TextAiDashboardQuestion, TextAiSyncedCensoredResponse } from './mock-text-ai-dashboards';
import type { TextAiKpiWidgetInstance } from './mock-text-ai-kpi-by-theme';
import type { TextAiSubthemeTrendWidgetInstance } from './mock-text-ai-subtheme-trend';
import type { TextAiResponseFilter } from './text-ai-widget-settings';

export interface TextAiSharedCanvasState {
  removedWidgetIds: string[];
  layout: Layout;
}

export interface TextAiSharedDashboard {
  name: string;
  selectedQuestion: TextAiDashboardQuestion;
  questionIndex: number;
  responseFilter: TextAiResponseFilter;
  widgets: TextAiAddedWidget[];
  comparisons: { id: string; question: string }[];
  kpis: TextAiKpiWidgetInstance[];
  trends: TextAiSubthemeTrendWidgetInstance[];
  censoredSubthemesEnabled: boolean;
  syncedCensoredResponses?: TextAiSyncedCensoredResponse[];
  canvas: TextAiSharedCanvasState;
}

export interface TextAiSharingState {
  enabled: boolean;
  password: string;
  dashboard: TextAiSharedDashboard | null;
}

export const DEFAULT_TEXT_AI_SHARING: TextAiSharingState = {
  enabled: false,
  password: '',
  dashboard: null,
};

export interface TextAiShareFilters {
  theme: string;
  subtheme: string;
  sentiment: string;
}

export const EMPTY_TEXT_AI_SHARE_FILTERS: TextAiShareFilters = { theme: '', subtheme: '', sentiment: '' };

export const textAiSharingStorageKey = (dashboardId: number) => `text-ai-sharing-v1-${dashboardId}`;

export function textAiSharePath(dashboardId: number): string {
  return `/text-ai/${dashboardId}/shared`;
}
