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

export type TestResponseMode = 'random' | 'synthetic';

export const DEFAULT_TEST_RESPONSE_MODE: TestResponseMode = 'synthetic';

export const TEST_RESPONSE_CREDITS_PER_RESPONSE = 5;

export const TEST_RESPONSE_CREDIT_BALANCE = 1240;

export interface TestResponsePanelOption {
  value: string;
  label: string;
}

export const TEST_RESPONSE_PANEL_OPTIONS: TestResponsePanelOption[] = [
  { value: 'usa-general-population', label: 'USA General Population' },
  { value: 'india-general-population', label: 'India General Population' },
  { value: 'south-africa-general-population', label: 'South Africa General Population' },
  {
    value: 'mexico-general-population-que-piensas',
    label: 'Mexico General Population / Qué Piensas México',
  },
  {
    value: 'brazil-general-population-o-que-pensas',
    label: 'Brazil General Population / O que pensas',
  },
];

export const DEFAULT_TEST_RESPONSE_PANEL = TEST_RESPONSE_PANEL_OPTIONS[0].value;

export interface SyntheticGenerationStep {
  until: number;
  message: string;
}

export const SYNTHETIC_GENERATION_STEPS: SyntheticGenerationStep[] = [
  { until: 0.18, message: 'Building simulated respondents from the selected panel' },
  { until: 0.48, message: 'Writing realistic answers for each question' },
  { until: 0.78, message: 'Applying survey logic, quotas, and skip patterns' },
  { until: 0.94, message: 'Checking consistency across responses' },
  { until: 1, message: 'Saving generated responses' },
];

export function parseTestResponseCount(count: string): number {
  const parsed = Number.parseInt(count, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
}

export function getTestResponseCreditCost(count: string): number {
  return parseTestResponseCount(count) * TEST_RESPONSE_CREDITS_PER_RESPONSE;
}

/** Prototype wait: about 20 seconds, regardless of response count. */
export function getSyntheticGenerationDurationMs(_count: string): number {
  void _count;
  return 20_000;
}

export function getSyntheticGenerationStep(progress: number): string {
  const ratio = Math.min(1, Math.max(0, progress / 100));
  const step =
    SYNTHETIC_GENERATION_STEPS.find((item) => ratio <= item.until) ??
    SYNTHETIC_GENERATION_STEPS[SYNTHETIC_GENERATION_STEPS.length - 1];
  return step.message;
}

export function formatGenerationTimeRemaining(remainingMs: number): string {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  if (seconds <= 5) return 'A few seconds remaining';
  if (seconds < 60) return `About ${seconds} seconds remaining`;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? 'About 1 minute remaining' : `About ${minutes} minutes remaining`;
}
