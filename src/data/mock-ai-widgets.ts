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

const DEFAULT_W = 1;
const DEFAULT_H = 1;

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
];

/** Desktop column count — mobile uses a single column via AiDashboardCanvas. */
export const AI_DASHBOARD_GRID_COLS = 2;

/** Two equal-width desktop columns. Every widget occupies exactly one column. */
export function createDashboardLayout(widgets: readonly AiWidgetConfig[]): Layout {
  return widgets.map((widget, index) => ({
    i: widget.id, x: index % AI_DASHBOARD_GRID_COLS, y: Math.floor(index / AI_DASHBOARD_GRID_COLS),
    w: DEFAULT_W, h: DEFAULT_H, minW: 1, maxW: 1, minH: 1,
  }));
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
