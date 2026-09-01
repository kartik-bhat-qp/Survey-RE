export interface TextAiSubthemeTrendWidgetInstance {
  id: string;
  question: string;
}

export interface TextAiSubthemeTrendSeries {
  id: string;
  label: string;
  parentTheme: string;
  color: string;
  total: number;
  values: number[];
  /** First-to-last period percent change. */
  variancePercent: number;
}

interface ThemeDefinition {
  name: string;
  subthemes: readonly string[];
}

const THEME_DEFINITIONS: readonly ThemeDefinition[] = [
  {
    name: 'Overall Experience',
    subthemes: ['Satisfaction with visit', 'Value for money', 'Likelihood to return'],
  },
  {
    name: 'Customer Experience Feedback Analysis',
    subthemes: ['Friendly atmosphere', 'Family experience', 'Consistent experience'],
  },
  {
    name: 'Staff Service Interaction Analysis',
    subthemes: ['Friendly staff', 'Helpful service', 'Order taking'],
  },
  {
    name: 'Food Freshness and Temperature Concerns',
    subthemes: ['Freshly prepared food', 'Food temperature', 'Ingredient quality'],
  },
  {
    name: 'Service Speed and Efficiency Analysis',
    subthemes: ['Quick service', 'Wait time', 'Peak-hour efficiency'],
  },
  {
    name: 'Order Fulfillment Accuracy Challenges',
    subthemes: ['Missing items', 'Incorrect order', 'Customization accuracy'],
  },
  {
    name: 'Drive-Thru Customer Experience Challenges',
    subthemes: ['Drive-thru wait', 'Speaker communication', 'Pickup accuracy'],
  },
  {
    name: 'Restaurant Cleanliness and Safety Concerns',
    subthemes: ['Dining area cleanliness', 'Restroom cleanliness', 'Food safety'],
  },
] as const;

const SERIES_COLORS = [
  '#1b87e6',
  '#3d9a63',
  '#c45b5b',
  '#d97706',
  '#7c6bc4',
  '#0ea5a4',
  '#1b3380',
  '#db2777',
  '#65a30d',
  '#6366f1',
  '#b45309',
  '#0f766e',
  '#e08a8a',
  '#7cb892',
  '#475569',
  '#2563eb',
  '#be123c',
  '#4338ca',
  '#8b95a1',
  '#e9b949',
] as const;

export const TEXT_AI_SUBTHEME_TREND_PERIODS = [
  'Jan 2026',
  'Feb 2026',
  'Mar 2026',
  'Apr 2026',
  'May 2026',
  'Jun 2026',
  'Jul 2026',
  'Aug 2026',
] as const;

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

function percentChange(values: number[]): number {
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  if (first === 0) return last === 0 ? 0 : 100;
  return Math.round(((last - first) / first) * 1000) / 10;
}

function buildSeries(): TextAiSubthemeTrendSeries[] {
  const series: TextAiSubthemeTrendSeries[] = [];
  let colorIndex = 0;

  for (const theme of THEME_DEFINITIONS) {
    for (const subtheme of theme.subthemes) {
      const seed = hashSeed(`${theme.name}-${subtheme}`);
      const baseline = 28 + (seed % 72);
      const slope = ((seed % 11) - 5) * 3;
      const values = TEXT_AI_SUBTHEME_TREND_PERIODS.map((_, monthIndex) => {
        const seasonal = monthIndex === 5 || monthIndex === 6 ? 14 : 0;
        const wobble = ((seed >> (monthIndex + 2)) % 17) - 8;
        return Math.max(6, baseline + slope * monthIndex + seasonal + wobble);
      });
      series.push({
        id: `subtheme-${colorIndex}`,
        label: subtheme,
        parentTheme: theme.name,
        color: SERIES_COLORS[colorIndex % SERIES_COLORS.length],
        total: values.reduce((sum, value) => sum + value, 0),
        values,
        variancePercent: percentChange(values),
      });
      colorIndex += 1;
    }
  }

  return series.sort((left, right) => right.total - left.total);
}

export const TEXT_AI_SUBTHEME_TREND_SERIES: readonly TextAiSubthemeTrendSeries[] =
  buildSeries();
