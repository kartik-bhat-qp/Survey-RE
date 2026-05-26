export interface ComparativeBarSeriesConfig {
  field: string;
  name: string;
  color: string;
}

export interface ComparativeBarDataRow {
  category: string;
  [seriesField: string]: string | number;
}

export const COMPARATIVE_BAR_SERIES: ComparativeBarSeriesConfig[] = [
  { field: 'mma', name: 'Mixed Martial Arts (MMA)', color: '#1b4f9c' },
  { field: 'boxing', name: 'Boxing', color: '#b5d99c' },
  { field: 'wwe', name: 'WWE', color: '#9a9b59' },
  { field: 'age', name: 'What is your age group?', color: '#1b4f9c' },
];

/** Demo values aligned with the Comparative Bar reference widget. */
export const COMPARATIVE_BAR_DEMO_DATA: ComparativeBarDataRow[] = [
  { category: '1', mma: 25, boxing: 25, wwe: 33, age: 11 },
  { category: '2', boxing: 9, wwe: 12, mma: 20 },
  { category: '3', boxing: 19, wwe: 19, mma: 20 },
  { category: '4', boxing: 22, wwe: 17 },
  { category: '5', mma: 24, boxing: 25, wwe: 20 },
];
