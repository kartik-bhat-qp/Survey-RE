import type { ColoredChartDataPoint } from '@/components/charts/amcharts/types';

/** Age distribution — matches dashboard reference styling */
export const AGE_BAR_DEMO_DATA: ColoredChartDataPoint[] = [
  { category: 'Under 18', value: 1, color: '#234693' },
  { category: '18-24', value: 4, color: '#5a7a9c' },
  { category: '25-34', value: 15, color: '#4a9d9f' },
  { category: '35-44', value: 24, color: '#6db39e' },
  { category: '45-54', value: 20, color: '#9bc89b' },
  { category: '55-64', value: 14, color: '#a8b544' },
  { category: 'Above 64', value: 22, color: '#c9956b' },
];
