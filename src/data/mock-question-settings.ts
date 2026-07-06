import { plainTextFromRichValue } from '@/components/surveys/rich-text-utils';
import {
  DEFAULT_QUESTION_COMMUNITY_SETTINGS,
  type QuestionCommunitySettings,
} from '@/data/mock-question-communities';

export type AnswerType = 'radio' | 'checkbox' | 'dropdown' | 'select-list';

export type QuestionLayout = 'horizontal' | 'vertical';

export type AnswerDisplayOrder =
  | 'default'
  | 'ascending'
  | 'descending'
  | 'random'
  | 'advanced-randomization'
  | 'alternate-flip';

/** How many answer options to include when display order is Random. */
export type RandomizeAnswerCount = 'all' | number;

export type QuestionDisplayMode = 'show-question' | 'hide-question' | 'hide-after-answering';

export type VideoOption = 'none' | 'before-question' | 'after-question';

export type ScaleType =
  | 'nominal-categorical'
  | 'nominal-numeric'
  | 'ordinal'
  | 'undefined';

export interface QuestionSettings {
  answerType: AnswerType;
  questionLayout: QuestionLayout;
  columns: number;
  answerDisplayOrder: AnswerDisplayOrder;
  /** Shown when answer display order is Random. */
  randomizeAnswerCount: RandomizeAnswerCount;
  alternateColors: boolean;
  questionDisplay: QuestionDisplayMode;
  /** When question is hidden, auto-select options shown to the respondent. */
  autoSelectShownOptions: boolean;
  questionTips: boolean;
  video: VideoOption;
  reportLabel: string;
  scaleType: ScaleType;
  communityId: QuestionCommunitySettings['communityId'];
  customProfileFieldId: QuestionCommunitySettings['customProfileFieldId'];
}

export const DEFAULT_QUESTION_SETTINGS: QuestionSettings = {
  answerType: 'checkbox',
  questionLayout: 'vertical',
  columns: 1,
  answerDisplayOrder: 'default',
  randomizeAnswerCount: 'all',
  alternateColors: false,
  questionDisplay: 'show-question',
  autoSelectShownOptions: false,
  questionTips: false,
  video: 'none',
  reportLabel: '',
  scaleType: 'undefined',
  ...DEFAULT_QUESTION_COMMUNITY_SETTINGS,
};

export const ANSWER_DISPLAY_ORDER_OPTIONS = [
  { value: 'default' as const, label: 'Default' },
  { value: 'ascending' as const, label: 'Ascending' },
  { value: 'descending' as const, label: 'Descending' },
  { value: 'random' as const, label: 'Random' },
  { value: 'advanced-randomization' as const, label: 'Advanced Randomization' },
  { value: 'alternate-flip' as const, label: 'Alternate Flip' },
];

export function normalizeAnswerDisplayOrder(value: unknown): AnswerDisplayOrder {
  if (value === 'alphabetical') return 'ascending';
  if (ANSWER_DISPLAY_ORDER_OPTIONS.some((option) => option.value === value)) {
    return value as AnswerDisplayOrder;
  }
  return DEFAULT_QUESTION_SETTINGS.answerDisplayOrder;
}

export function buildRandomizeAnswerCountOptions(
  optionCount: number
): { value: RandomizeAnswerCount; label: string }[] {
  const options: { value: RandomizeAnswerCount; label: string }[] = [
    { value: 'all', label: 'All' },
  ];

  const maxCount = Math.min(3, Math.max(optionCount, 1) - 1);
  for (let count = 1; count <= maxCount; count += 1) {
    options.push({ value: count, label: String(count) });
  }

  return options;
}

export function normalizeRandomizeAnswerCount(
  value: unknown,
  optionCount: number
): RandomizeAnswerCount {
  if (value === 'all' || value === undefined || value === null) {
    return 'all';
  }

  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  const maxCount = Math.min(3, Math.max(optionCount, 1) - 1);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > maxCount) {
    return 'all';
  }

  return parsed;
}

export const QUESTION_DISPLAY_OPTIONS = [
  { value: 'show-question' as const, label: 'Show Question' },
  { value: 'hide-question' as const, label: 'Hide Question' },
  { value: 'hide-after-answering' as const, label: 'Hide after answering' },
];

export function getQuestionDisplayOptions(
  answerType: AnswerType
): typeof QUESTION_DISPLAY_OPTIONS {
  if (answerType === 'radio') {
    return QUESTION_DISPLAY_OPTIONS;
  }
  return QUESTION_DISPLAY_OPTIONS.filter((option) => option.value !== 'hide-after-answering');
}

export const VIDEO_OPTIONS = [
  { value: 'none' as const, label: 'None' },
  { value: 'before-question' as const, label: 'Before Question' },
  { value: 'after-question' as const, label: 'After Question' },
];

export const SCALE_TYPE_OPTIONS: { value: ScaleType; label: string }[] = [
  { value: 'nominal-categorical', label: 'Nominal - Categorical' },
  { value: 'nominal-numeric', label: 'Nominal - Numeric' },
  { value: 'ordinal', label: 'Ordinal' },
  { value: 'undefined', label: 'Undefined' },
];

export function getDefaultSettingsForQuestion(
  inputKind?: 'radio' | 'checkbox',
  addQuestionTypeId?: string
): QuestionSettings {
  if (addQuestionTypeId === 'dropdown') {
    return {
      ...DEFAULT_QUESTION_SETTINGS,
      answerType: 'dropdown',
    };
  }
  return {
    ...DEFAULT_QUESTION_SETTINGS,
    answerType: inputKind === 'checkbox' ? 'checkbox' : 'radio',
  };
}

export function getQuestionTypeLabel(inputKind?: 'radio' | 'checkbox'): string {
  return inputKind === 'checkbox' ? 'Select Many' : 'Multiple Choice';
}

function compareOptionLabels(a: string, b: string): number {
  return plainTextFromRichValue(a).localeCompare(plainTextFromRichValue(b), undefined, {
    sensitivity: 'base',
  });
}

function shuffleOptions<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

const ALTERNATE_FLIP_STORAGE_PREFIX = 'survey-preview-alternate-flip';

/** Alternates workspace order vs reversed order on each preview open. */
export function getAndAdvanceAlternateFlipState(
  surveyId: number,
  questionCode: string
): boolean {
  if (typeof window === 'undefined') return false;

  const key = `${ALTERNATE_FLIP_STORAGE_PREFIX}-${surveyId}-${questionCode}`;
  const count = Number.parseInt(localStorage.getItem(key) ?? '0', 10);
  const reversed = count % 2 === 1;
  localStorage.setItem(key, String(count + 1));
  return reversed;
}

function orderWithRandomCount<T>(options: T[], randomizeAnswerCount: RandomizeAnswerCount): T[] {
  const shuffled = shuffleOptions(options);
  if (randomizeAnswerCount === 'all') {
    return shuffled;
  }

  if (randomizeAnswerCount >= options.length) {
    return shuffled;
  }

  return shuffled.slice(0, randomizeAnswerCount);
}

function orderWithAdvancedRandomization<T extends { id: string; label: string }>(
  options: T[]
): T[] {
  if (options.length <= 2) {
    return shuffleOptions(options);
  }

  const first = options[0];
  const last = options[options.length - 1];
  const middle = shuffleOptions(options.slice(1, -1));
  return [first, ...middle, last];
}

export function orderAnswerOptions<T extends { id: string; label: string }>(
  options: T[],
  displayOrder: AnswerDisplayOrder,
  alternateFlipReversed = false,
  randomizeAnswerCount: RandomizeAnswerCount = 'all'
): T[] {
  if (options.length < 2) {
    return options;
  }

  if (displayOrder === 'default') {
    return options;
  }

  if (displayOrder === 'ascending') {
    return [...options].sort((a, b) => compareOptionLabels(a.label, b.label));
  }

  if (displayOrder === 'descending') {
    return [...options].sort((a, b) => compareOptionLabels(b.label, a.label));
  }

  if (displayOrder === 'alternate-flip') {
    return alternateFlipReversed ? [...options].reverse() : [...options];
  }

  if (displayOrder === 'advanced-randomization') {
    return orderWithAdvancedRandomization(options);
  }

  if (displayOrder === 'random') {
    return orderWithRandomCount(options, randomizeAnswerCount);
  }

  return shuffleOptions(options);
}
