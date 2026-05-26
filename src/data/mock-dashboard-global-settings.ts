export type ChartMetric = 'count' | 'percent';

export type DataOrdering = 'none' | 'descending' | 'ascending';

export interface DecimalPrecisionOption {
  value: string;
  label: string;
}

export const DECIMAL_PRECISION_OPTIONS: DecimalPrecisionOption[] = [
  { value: '0', label: '0 (0)' },
  { value: '1', label: '1 (0.0)' },
  { value: '2', label: '2 (0.00)' },
  { value: '3', label: '3 (0.000)' },
];

export const DEFAULT_DECIMAL_PRECISION = DECIMAL_PRECISION_OPTIONS[0];

export interface DashboardGlobalSettings {
  chartMetric: ChartMetric;
  decimalPrecision: DecimalPrecisionOption;
  dataOrdering: DataOrdering;
  widgetStats: boolean;
}

export const DEFAULT_DASHBOARD_GLOBAL_SETTINGS: DashboardGlobalSettings = {
  chartMetric: 'percent',
  decimalPrecision: DEFAULT_DECIMAL_PRECISION,
  dataOrdering: 'none',
  widgetStats: false,
};
