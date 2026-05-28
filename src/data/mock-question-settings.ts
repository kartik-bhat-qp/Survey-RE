export type AnswerType = 'radio' | 'checkbox' | 'dropdown' | 'select-list';

export type QuestionLayout = 'horizontal' | 'vertical';

export type AnswerDisplayOrder = 'default' | 'random' | 'alphabetical';

export type QuestionDisplayMode = 'show-question' | 'hide-question';

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
  alternateColors: boolean;
  questionDisplay: QuestionDisplayMode;
  /** When question is hidden, auto-select options shown to the respondent. */
  autoSelectShownOptions: boolean;
  questionTips: boolean;
  video: VideoOption;
  reportLabel: string;
  scaleType: ScaleType;
}

export const DEFAULT_QUESTION_SETTINGS: QuestionSettings = {
  answerType: 'checkbox',
  questionLayout: 'vertical',
  columns: 1,
  answerDisplayOrder: 'default',
  alternateColors: false,
  questionDisplay: 'show-question',
  autoSelectShownOptions: false,
  questionTips: false,
  video: 'none',
  reportLabel: '',
  scaleType: 'undefined',
};

export const ANSWER_DISPLAY_ORDER_OPTIONS = [
  { value: 'default' as const, label: 'Default' },
  { value: 'random' as const, label: 'Random' },
  { value: 'alphabetical' as const, label: 'Alphabetical' },
];

export const QUESTION_DISPLAY_OPTIONS = [
  { value: 'show-question' as const, label: 'Show Question' },
  { value: 'hide-question' as const, label: 'Hide Question' },
];

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

export function getDefaultSettingsForQuestion(inputKind?: 'radio' | 'checkbox'): QuestionSettings {
  return {
    ...DEFAULT_QUESTION_SETTINGS,
    answerType: inputKind === 'checkbox' ? 'checkbox' : 'radio',
  };
}

export function getQuestionTypeLabel(inputKind?: 'radio' | 'checkbox'): string {
  return inputKind === 'checkbox' ? 'Select Many' : 'Multiple Choice';
}
