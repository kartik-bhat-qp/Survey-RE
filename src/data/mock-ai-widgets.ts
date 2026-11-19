import type { QuestionStackWidgetConfig } from './question-stacks';
import type { Layout } from 'react-grid-layout';

export type AiWidgetType =
  | 'map'
  | 'response-info'
  | 'response-timeline'
  | 'bar'
  | 'pie'
  | 'line'
  | 'donut'
  | 'scoring-trend'
  | 'gauge'
  | 'scoring-donut'
  | 'benchmark'
  | 'semi-circle'
  | 'leaderboard'
  | 'image-bar'
  | 'pictorial'
  | 'stackbar'
  | 'tabular'
  | 'stat-highlight'
  | 'stat-metric'
  | 'comparative-bar'
  | 'segment-trend'
  | 'wordcloud'
  | 'heat-map'
  | 'driver-analysis';

/** Driver-analysis selections captured when the widget is added. */
export interface DriverAnalysisWidgetConfig {
  airlineSample?: boolean;
  tabId?: string;
  outcome?: import('./driver-scoring').DriverOutcome;
  scoring?: import('./mock-text-ai-kpi-by-theme').KpiScoring;
  metric?: 'nps' | 'csat' | 'ces' | 'mean';
  primaryQuestionCode: string;
  primaryQuestionText: string;
  /** Driver items from the selected driver questions (matrix rows expanded). */
  drivers: Array<{
    id: string;
    code: string;
    name: string;
  }>;
}

export interface AiWidgetConfig {
  id: string;
  type: AiWidgetType;
  title: string;
  driverAnalysis?: DriverAnalysisWidgetConfig;
  questionStack?: QuestionStackWidgetConfig;
}

export const DASHBOARD_DEFAULT_WIDGET_W = 6;
export const DASHBOARD_DEFAULT_WIDGET_H = 8;

export const AI_DASHBOARD_WIDGETS: AiWidgetConfig[] = [
  { id: 'w-map', type: 'map', title: 'Map' },
  { id: 'w-response', type: 'response-info', title: 'Response Info' },
  { id: 'w-bar', type: 'bar', title: 'Age' },
  { id: 'w-nps-benchmark', type: 'benchmark', title: 'NPS benchmark' },
  { id: 'w-mean', type: 'stat-metric', title: 'Mean' },
  { id: 'w-comparative-bar', type: 'comparative-bar', title: 'Comparative Bar' },
  { id: 'w-segment-trend', type: 'segment-trend', title: 'Segment Trend' },
  { id: 'w-scoring-trend', type: 'scoring-trend', title: 'Scoring Trend' },
  { id: 'w-response-timeline', type: 'response-timeline', title: 'Response Timeline' },
  { id: 'w-comments-wordcloud', type: 'wordcloud', title: 'Suggestions / comments' },
  { id: 'w-heat-map', type: 'heat-map', title: 'Heat Map Chart' },
  { id: 'w-driver-analysis', type: 'driver-analysis', title: 'Key Driver Analysis' },
];

/** Desktop column count — mobile uses a single column via AiDashboardCanvas. */
export const AI_DASHBOARD_GRID_COLS = 12;

/** Driver analysis spans the canvas; other widgets share two columns. */
export function createDashboardLayout(widgets: readonly AiWidgetConfig[]): Layout {
  let x = 0;
  let y = 0;
  return widgets.map(widget => {
    const fullWidth = widget.type === 'driver-analysis';
    if (fullWidth && x) { x = 0; y += DASHBOARD_DEFAULT_WIDGET_H; }
    const item = {
      i: widget.id, x, y,
      w: fullWidth ? AI_DASHBOARD_GRID_COLS : DASHBOARD_DEFAULT_WIDGET_W,
      h: fullWidth ? 11 : DASHBOARD_DEFAULT_WIDGET_H,
      minW: fullWidth ? AI_DASHBOARD_GRID_COLS : 2,
      ...(fullWidth ? { maxW: AI_DASHBOARD_GRID_COLS, resizeHandles: ['s'] as ('s')[] } : {}),
      minH: 4,
    };
    x += item.w;
    if (x >= AI_DASHBOARD_GRID_COLS) { x = 0; y += item.h; }
    return item;
  });
}
export const AI_DASHBOARD_LAYOUT: Layout = createDashboardLayout(AI_DASHBOARD_WIDGETS);

export function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

export function randomInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export function randomPercent(rand: () => number): number {
  return Math.round(rand() * 1000) / 10;
}
