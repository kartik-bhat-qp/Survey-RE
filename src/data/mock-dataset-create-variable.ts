export const DATASET_VARIABLE_RESPONSE_STATUS_OPTIONS = [
  { value: 'all', label: 'All responses' },
  { value: 'completed', label: 'Completed' },
  { value: 'started', label: 'Started but not completed' },
  { value: 'terminates', label: 'Terminates' },
] as const;

export const DATASET_VARIABLE_DATE_RANGE_PRESETS = [
  { value: 'last-30', label: 'Last 30 days' },
  { value: 'last-90', label: 'Last 90 days' },
  { value: 'last-year', label: 'Last year' },
] as const;

export type DatasetVariableResponseStatus =
  (typeof DATASET_VARIABLE_RESPONSE_STATUS_OPTIONS)[number]['value'];
