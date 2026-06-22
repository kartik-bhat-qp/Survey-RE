import { PUBLIC_IMAGES } from '@/lib/public-images';

export type SingleSelectChartTypeId =
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
  | 'stat-highlight';

export interface SingleSelectChartType {
  id: SingleSelectChartTypeId;
  name: string;
  imageSrc: string;
  showBetaBadge?: boolean;
  showDiamond?: boolean;
}

export const DEFAULT_SINGLE_SELECT_CHART_TYPE_ID: SingleSelectChartTypeId = 'bar';

const IMG = PUBLIC_IMAGES.singleSelectWidgets;

/** Chart types available for Single Select survey questions. */
export const SINGLE_SELECT_CHART_TYPES: SingleSelectChartType[] = [
  { id: 'bar', name: 'Bar', imageSrc: IMG.bar },
  { id: 'pie', name: 'Pie', imageSrc: IMG.pie },
  { id: 'line', name: 'Line', imageSrc: IMG.line },
  { id: 'donut', name: 'Donut', imageSrc: IMG.donut },
  { id: 'scoring-trend', name: 'Scoring trend', imageSrc: IMG.scoringTrend },
  { id: 'gauge', name: 'Gauge', imageSrc: IMG.gauge },
  { id: 'scoring-donut', name: 'Scoring donut', imageSrc: IMG.scoringDonut },
  {
    id: 'benchmark',
    name: 'Benchmark',
    imageSrc: IMG.benchmark,
    showDiamond: true,
  },
  { id: 'semi-circle', name: 'Semi-Circle', imageSrc: IMG.semiCircle },
  { id: 'leaderboard', name: 'Leaderboard', imageSrc: IMG.leaderboard },
  { id: 'image-bar', name: 'Image bar', imageSrc: IMG.imageBar },
  { id: 'pictorial', name: 'Pictorial', imageSrc: IMG.pictorial },
  { id: 'stackbar', name: 'Stackbar', imageSrc: IMG.stackbar },
  { id: 'tabular', name: 'Tabular', imageSrc: IMG.tabular },
  {
    id: 'stat-highlight',
    name: 'Stat Highlight',
    imageSrc: IMG.statHighlight,
    showBetaBadge: true,
  },
];
