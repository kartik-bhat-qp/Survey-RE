import type { DatasetVariable } from '@/data/mock-dataset-detail';

export const TEXT_AI_THEME_COUNT = 10;
export const TEXT_AI_SUBTHEME_COUNT = 50;
export const TEXT_AI_SENTIMENT_COUNT = 4;
export const TEXT_AI_PROCESS_MS = 30_000;

export const TEXT_AI_THEME_ID = 'textai-themes';
export const TEXT_AI_SUBTHEME_ID = 'textai-sub-themes';
export const TEXT_AI_SENTIMENT_ID = 'textai-sentiment';

/** @deprecated Use TEXT_AI_THEME_ID */
export const TEXT_AI_PROCESSING_THEME_ID = TEXT_AI_THEME_ID;
/** @deprecated Use TEXT_AI_SUBTHEME_ID */
export const TEXT_AI_PROCESSING_SUBTHEME_ID = TEXT_AI_SUBTHEME_ID;

export interface TextAiExpandedColumn {
  id: string;
  name: string;
}

const THEME_LABELS = [
  'Pricing & value',
  'Product quality',
  'Customer support',
  'Ease of use',
  'Delivery experience',
  'Brand trust',
  'Feature gaps',
  'Onboarding friction',
  'Competitive comparison',
  'Loyalty & retention',
];

const SUBTHEME_SEEDS = [
  'Too expensive',
  'Good value',
  'Confusing pricing',
  'Hidden fees',
  'Durable build',
  'Poor materials',
  'Reliable performance',
  'Slow support',
  'Helpful agents',
  'Long wait times',
  'Simple setup',
  'Steep learning curve',
  'Clear docs',
  'Late delivery',
  'Damaged package',
  'Fast shipping',
  'Trusted brand',
  'Unclear messaging',
  'Missing feature',
  'Wishlist item',
  'Hard to start',
  'Account friction',
  'Better than competitor',
  'Worse than competitor',
  'Would recommend',
  'May churn',
  'Repeat purchase',
  'One-time buyer',
  'Mobile issues',
  'Desktop preferred',
  'Notification noise',
  'Useful alerts',
  'Privacy concerns',
  'Secure feeling',
  'Billing surprise',
  'Transparent invoice',
  'Integration pain',
  'Works with tools',
  'Training needed',
  'Self-serve enough',
  'Regional delay',
  'Local stock',
  'Packaging waste',
  'Eco packaging',
  'Gift ready',
  'Not gift friendly',
  'Kids friendly',
  'Not for kids',
  'Accessibility gap',
  'Accessible UI',
];

const SENTIMENT_LABELS = ['Positive', 'Neutral', 'Negative', 'Mixed'];

export function isTextAiVariableId(variableId: string): boolean {
  return (
    variableId === TEXT_AI_THEME_ID ||
    variableId === TEXT_AI_SUBTHEME_ID ||
    variableId === TEXT_AI_SENTIMENT_ID
  );
}

export function getTextAiThemeColumns(): TextAiExpandedColumn[] {
  return Array.from({ length: TEXT_AI_THEME_COUNT }, (_, index) => ({
    id: `${TEXT_AI_THEME_ID}__${index + 1}`,
    name: THEME_LABELS[index] ?? `Theme ${index + 1}`,
  }));
}

export function getTextAiSubthemeColumns(): TextAiExpandedColumn[] {
  return Array.from({ length: TEXT_AI_SUBTHEME_COUNT }, (_, index) => {
    const seed = SUBTHEME_SEEDS[index % SUBTHEME_SEEDS.length];
    const cycle = Math.floor(index / SUBTHEME_SEEDS.length) + 1;
    return {
      id: `${TEXT_AI_SUBTHEME_ID}__${index + 1}`,
      name: cycle > 1 ? `${seed} (${cycle})` : seed,
    };
  });
}

export function getTextAiSentimentColumns(): TextAiExpandedColumn[] {
  return Array.from({ length: TEXT_AI_SENTIMENT_COUNT }, (_, index) => ({
    id: `${TEXT_AI_SENTIMENT_ID}__${index + 1}`,
    name: SENTIMENT_LABELS[index] ?? `Sentiment ${index + 1}`,
  }));
}

export function createTextAiProcessingVariables(): DatasetVariable[] {
  return [
    {
      id: TEXT_AI_THEME_ID,
      name: 'Themes',
      kind: 'category',
      responses: 0,
      status: 'processing',
    },
    {
      id: TEXT_AI_SUBTHEME_ID,
      name: 'Sub-themes',
      kind: 'category',
      responses: 0,
      status: 'processing',
    },
    {
      id: TEXT_AI_SENTIMENT_ID,
      name: 'Sentiment',
      kind: 'category',
      responses: 0,
      status: 'processing',
    },
  ];
}

export function createTextAiReadyVariables(responseCount: number): DatasetVariable[] {
  return [
    {
      id: TEXT_AI_THEME_ID,
      name: 'Themes',
      kind: 'category',
      responses: responseCount,
      status: 'ready',
    },
    {
      id: TEXT_AI_SUBTHEME_ID,
      name: 'Sub-themes',
      kind: 'category',
      responses: responseCount,
      status: 'ready',
    },
    {
      id: TEXT_AI_SENTIMENT_ID,
      name: 'Sentiment',
      kind: 'category',
      responses: responseCount,
      status: 'ready',
    },
  ];
}

export function buildTextAiColumnValues(responseId: number): Record<string, string> {
  const values: Record<string, string> = {};
  for (const column of getTextAiThemeColumns()) {
    const index = Number(column.id.split('__')[1] ?? '1');
    const intensity = ((responseId + index) % 5) + 1;
    values[column.id] = intensity >= 3 ? 'Yes' : '';
  }
  for (const column of getTextAiSubthemeColumns()) {
    const index = Number(column.id.split('__')[1] ?? '1');
    const score = (responseId * 17 + index * 13) % 100;
    values[column.id] = score > 55 ? 'Yes' : '';
  }
  for (const column of getTextAiSentimentColumns()) {
    const index = Number(column.id.split('__')[1] ?? '1');
    const dominant = ((responseId + index * 3) % TEXT_AI_SENTIMENT_COUNT) + 1;
    values[column.id] = dominant === index ? 'Yes' : '';
  }
  return values;
}

export function isTextAiProcessingVariable(variable: DatasetVariable): boolean {
  return variable.status === 'processing';
}

export function isTextAiExpandableVariable(variable: DatasetVariable): boolean {
  return isTextAiVariableId(variable.id) && variable.status !== 'processing';
}

export function expandVariablesForPreview(
  selectedVariables: DatasetVariable[]
): TextAiExpandedColumn[] {
  const columns: TextAiExpandedColumn[] = [];
  for (const variable of selectedVariables) {
    if (variable.id === TEXT_AI_THEME_ID && variable.status !== 'processing') {
      columns.push(...getTextAiThemeColumns());
      continue;
    }
    if (variable.id === TEXT_AI_SUBTHEME_ID && variable.status !== 'processing') {
      columns.push(...getTextAiSubthemeColumns());
      continue;
    }
    if (variable.id === TEXT_AI_SENTIMENT_ID && variable.status !== 'processing') {
      columns.push(...getTextAiSentimentColumns());
      continue;
    }
    if (variable.status === 'processing') continue;
    columns.push({ id: variable.id, name: variable.name });
  }
  return columns;
}

export function getTextAiOptionCount(variableId: string): number | null {
  if (variableId === TEXT_AI_THEME_ID) return TEXT_AI_THEME_COUNT;
  if (variableId === TEXT_AI_SUBTHEME_ID) return TEXT_AI_SUBTHEME_COUNT;
  if (variableId === TEXT_AI_SENTIMENT_ID) return TEXT_AI_SENTIMENT_COUNT;
  return null;
}
