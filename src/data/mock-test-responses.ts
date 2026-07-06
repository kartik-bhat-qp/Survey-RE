export interface TestResponseCountOption {
  value: string;
  label: string;
}

export const TEST_RESPONSE_COUNT_OPTIONS: TestResponseCountOption[] = [
  { value: '1', label: '1' },
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
];

export const DEFAULT_TEST_RESPONSE_COUNT = '10';
