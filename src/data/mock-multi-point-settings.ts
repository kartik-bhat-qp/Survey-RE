export type MultiPointLayout = 'matrix' | 'cards-carousel';

/** Cards carousel only: how each card is oriented in the respondent view. */
export type CardsCarouselResponseLayout = 'vertical' | 'horizontal';

export type MultiPointAnswerType =
  | 'radio'
  | 'checkbox'
  | 'dropdown'
  | 'select-list'
  | 'slider'
  | 'text-input';

export type MatrixDisplayOrder = 'default' | 'random' | 'alphabetical';

export type MultiPointQuestionDisplay = 'show-question' | 'hide-question';

export type MultiPointVideoOption = 'none' | 'before-question' | 'after-question';

export type MultiPointScaleType =
  | 'nominal-categorical'
  | 'nominal-numeric'
  | 'interval'
  | 'undefined';

export interface MultiPointScalesSettings {
  layout: MultiPointLayout;
  /** Shown when layout is Cards carousel. */
  cardsCarouselResponseLayout: CardsCarouselResponseLayout;
  answerType: MultiPointAnswerType;
  bipolar: boolean;
  autoFocus: boolean;
  questionWidthPercent: number;
  mobileRendering: boolean;
  repeatColumnHeadersEvery: number;
  rowDisplayOrder: MatrixDisplayOrder;
  columnDisplayOrder: MatrixDisplayOrder;
  alternateColors: boolean;
  questionDisplay: MultiPointQuestionDisplay;
  questionTips: boolean;
  video: MultiPointVideoOption;
  reportLabel: string;
  scaleType: MultiPointScaleType;
}

export const DEFAULT_MULTI_POINT_SETTINGS: MultiPointScalesSettings = {
  layout: 'matrix',
  cardsCarouselResponseLayout: 'vertical',
  answerType: 'radio',
  bipolar: false,
  autoFocus: false,
  questionWidthPercent: 30,
  mobileRendering: true,
  repeatColumnHeadersEvery: 10,
  rowDisplayOrder: 'default',
  columnDisplayOrder: 'default',
  alternateColors: false,
  questionDisplay: 'show-question',
  questionTips: false,
  video: 'none',
  reportLabel: '',
  scaleType: 'undefined',
};

export const MULTI_POINT_ANSWER_TYPE_OPTIONS: {
  value: MultiPointAnswerType;
  label: string;
  icon: string;
}[] = [
  { value: 'radio', label: 'Radio', icon: 'wm-radio-button-checked' },
  { value: 'checkbox', label: 'Checkbox', icon: 'wm-check-box' },
  { value: 'dropdown', label: 'Dropdown', icon: 'wm-arrow-drop-down-circle' },
  { value: 'select-list', label: 'Select List', icon: 'wm-list' },
  { value: 'slider', label: 'Slider', icon: 'wm-tune' },
  { value: 'text-input', label: 'Text Input', icon: 'wm-text-fields' },
];

export const CARDS_CAROUSEL_RESPONSE_LAYOUT_OPTIONS = [
  { value: 'vertical' as const, label: 'Vertical' },
  { value: 'horizontal' as const, label: 'Horizontal' },
];

export const MATRIX_DISPLAY_ORDER_OPTIONS = [
  { value: 'default' as const, label: 'Default' },
  { value: 'random' as const, label: 'Random' },
  { value: 'alphabetical' as const, label: 'Alphabetical' },
];

export const MULTI_POINT_QUESTION_DISPLAY_OPTIONS = [
  { value: 'show-question' as const, label: 'Show Question' },
  { value: 'hide-question' as const, label: 'Hide Question' },
];

export const MULTI_POINT_VIDEO_OPTIONS = [
  { value: 'none' as const, label: 'None' },
  { value: 'before-question' as const, label: 'Before Question' },
  { value: 'after-question' as const, label: 'After Question' },
];

export const MULTI_POINT_SCALE_TYPE_OPTIONS: {
  value: MultiPointScaleType;
  label: string;
  description: string;
}[] = [
  {
    value: 'nominal-categorical',
    label: 'Nominal - Categorical',
    description: 'e.g. Male - 1; Female - 2',
  },
  {
    value: 'nominal-numeric',
    label: 'Nominal - Numeric',
    description: 'e.g. Number of cars (1; 2; 10)',
  },
  {
    value: 'interval',
    label: 'Interval',
    description: 'e.g. Satisfied; Neutral; Dissatisfied (Matrix Question)',
  },
  {
    value: 'undefined',
    label: 'Undefined',
    description: '',
  },
];

export const QUESTION_WIDTH_PERCENT_OPTIONS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100];

export function isCardsCarouselVerticalPreview(settings: MultiPointScalesSettings): boolean {
  return (
    settings.layout === 'cards-carousel' &&
    settings.cardsCarouselResponseLayout === 'vertical'
  );
}

export function isCardsCarouselPreview(settings: MultiPointScalesSettings): boolean {
  return settings.layout === 'cards-carousel';
}
