import type { Survey } from '@/data/mock-surveys';
import { getSurveyEditorTitle } from '@/data/get-survey-by-id';
import { NEW_AI_SURVEY_ID, readAiSurveyDraft } from '@/data/ai-survey-draft';
import { NEW_BLANK_SURVEY_ID } from '@/data/mock-survey-creation-flow';

export type SurveyQuestionInputKind = 'radio' | 'checkbox';

export type SurveyQuestionKind =
  | 'standard'
  | 'multi-point-scales'
  | 'nps'
  | 'van-westendorp'
  | 'lookup-table'
  | 'star-rating'
  | 'smiley-rating'
  | 'thumbs-up-down'
  | 'text-slider';

export type SurveySmileyRatingTone =
  | 'very-unsatisfied'
  | 'unsatisfied'
  | 'neutral'
  | 'satisfied'
  | 'very-satisfied';

export interface SurveySmileyRatingOption {
  id: string;
  label: string;
  tone: SurveySmileyRatingTone;
}

export interface SurveyQuestionSmileyRating {
  options: SurveySmileyRatingOption[];
}

export type SurveyThumbsDirection = 'up' | 'down';

export interface SurveyThumbsChoice {
  id: string;
  label: string;
  direction: SurveyThumbsDirection;
}

export interface SurveyQuestionThumbsUpDown {
  choices: SurveyThumbsChoice[];
}

export interface SurveyQuestionVanWestendorpRow {
  id: string;
  prompt: string;
}

export interface SurveyQuestionVanWestendorp {
  priceLabel: string;
  rows: SurveyQuestionVanWestendorpRow[];
}

export const DEFAULT_VAN_WESTENDORP_QUESTION_TEXT = 'At what price do you —';

export function createDefaultVanWestendorpData(): SurveyQuestionVanWestendorp {
  return {
    priceLabel: 'Price',
    rows: [
      {
        id: 'too-expensive',
        prompt:
          'At what price would you consider the product to be so expensive that you would not consider buying it? (Too Expensive)',
      },
      {
        id: 'expensive',
        prompt:
          'At what price would you consider the product starting to get expensive, so that it is not out of the question, but you would have to give some thought to buying it? (Expensive/High Side)',
      },
      {
        id: 'cheap',
        prompt:
          'At what price would you consider the product to be a bargain - a great buy for the money? (Cheap/Good Value)',
      },
      {
        id: 'too-cheap',
        prompt:
          "At what price would you consider the product to be priced so low that you would feel the quality couldn't be very good? (Too Cheap)",
      },
    ],
  };
}

export interface SurveyQuestionNps {
  minLabel: string;
  maxLabel: string;
}

export const DEFAULT_NPS_MIN_LABEL = 'Very Unlikely';
export const DEFAULT_NPS_MAX_LABEL = 'Very Likely';

export interface SurveyQuestionLookupTable {
  /** Sample value shown in the workspace dropdown preview. */
  selectedValue: string;
}

export interface SurveyQuestionExtractionSource {
  sourceQuestionId: string;
  sourceQuestionCode: string;
}

export const DEFAULT_LOOKUP_TABLE_QUESTION_TEXT = 'Which state do you live in?';

export const DEFAULT_DROPDOWN_QUESTION_TEXT = 'Which beverage did you consume last time?';

export const DEFAULT_DROPDOWN_OPTION_LABELS = ['Coke', 'Pepsi', 'Sprite', 'Water'] as const;

export const DEFAULT_COMMENT_BOX_QUESTION_TEXT = 'Comments / suggestions:';

export const DEFAULT_COMMENT_BOX_ANSWER_PLACEHOLDER = 'Multiple Row Answer Text';

export const DEFAULT_SINGLE_ROW_QUESTION_TEXT = 'Name';

export const DEFAULT_SINGLE_ROW_ANSWER_PLACEHOLDER = 'Single Row Answer Text';

export const DEFAULT_EMAIL_ADDRESS_FIELD_LABEL = 'Email Address';

export const DEFAULT_CONTACT_INFORMATION_QUESTION_TEXT = 'Please enter the following details';

export const DEFAULT_CONTACT_INFORMATION_FIELD_LABELS = [
  'First Name',
  'Last Name',
  'Phone Number',
  'Email Address',
] as const;

/** Select One questions with more than this many options must use Lookup Table. */
export const SELECT_ONE_MAX_BULK_OPTIONS = 300;

export const DEFAULT_LOOKUP_TABLE_SAMPLE_VALUES = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
] as const;

export function createDefaultLookupTableData(): SurveyQuestionLookupTable {
  return { selectedValue: DEFAULT_LOOKUP_TABLE_SAMPLE_VALUES[0] };
}

export function createDefaultLookupTableOptions(): SurveyQuestionOption[] {
  return DEFAULT_LOOKUP_TABLE_SAMPLE_VALUES.map((label, index) => ({
    id: `lookup-opt-${index + 1}`,
    label,
  }));
}

export function createDefaultDropdownOptions(): SurveyQuestionOption[] {
  return DEFAULT_DROPDOWN_OPTION_LABELS.map((label, index) => ({
    id: `dropdown-opt-${index + 1}`,
    label,
  }));
}

export function createDefaultContactInformationOptions(): SurveyQuestionOption[] {
  return DEFAULT_CONTACT_INFORMATION_FIELD_LABELS.map((label, index) => ({
    id: `contact-field-${index + 1}`,
    label,
  }));
}

export interface SurveyQuestionOption {
  id: string;
  label: string;
  logicLabel?: string;
}

export interface SurveyMatrixColumn {
  id: string;
  label: string;
}

export interface SurveyMatrixRow {
  id: string;
  label: string;
}

export interface SurveyMatrix {
  leftAnchor: string;
  rightAnchor: string;
  columns: SurveyMatrixColumn[];
  rows: SurveyMatrixRow[];
}

export interface SurveyQuestion {
  id: string;
  /** Question code shown in the workspace gutter (e.g. Q5). */
  code: string;
  number: number;
  text: string;
  required?: boolean;
  /** Workspace question type; default `standard`. */
  kind?: SurveyQuestionKind;
  /** How options render; default `radio` when omitted (existing mock questions). */
  inputKind?: SurveyQuestionInputKind;
  options: SurveyQuestionOption[];
  /** Matrix grid for Basic Matrix multi-point scales. */
  matrix?: SurveyMatrix;
  /** 0–10 scale labels for Net Promoter Score questions. */
  nps?: SurveyQuestionNps;
  /** Price sensitivity rows for Van Westendorp questions. */
  vanWestendorp?: SurveyQuestionVanWestendorp;
  /** Lookup table dropdown preview for Data Reference questions. */
  lookupTable?: SurveyQuestionLookupTable;
  /** Five-point smiley scale for Smiley Rating questions. */
  smileyRating?: SurveyQuestionSmileyRating;
  /** Thumbs up / down choices for Thumbs Up/Down questions. */
  thumbsUpDown?: SurveyQuestionThumbsUpDown;
  /** Set when this question was auto-added by extraction from another question. */
  extractionSource?: SurveyQuestionExtractionSource;
  /** Add Question menu type id (e.g. `nps`, `select-many`) for license diamond display. */
  addQuestionTypeId?: string;
}

/** Resolves the Add Question type id used for license diamond and tier checks. */
export function resolveAddQuestionTypeId(question: SurveyQuestion): string | undefined {
  if (question.addQuestionTypeId) return question.addQuestionTypeId;
  if (question.kind === 'nps') return 'nps';
  if (question.kind === 'van-westendorp') return 'van-westendorp';
  if (question.kind === 'lookup-table') return 'lookup-table';
  if (question.kind === 'multi-point-scales') return 'multi-point';
  if (question.kind === 'star-rating') return 'star-rating';
  if (question.kind === 'smiley-rating') return 'smiley-rating';
  if (question.kind === 'thumbs-up-down') return 'thumbs';
  if (question.kind === 'text-slider') return 'text-slider';
  if (question.inputKind === 'checkbox') return 'select-many';
  if (question.inputKind === 'radio') return 'select-one';
  return undefined;
}

const DEFAULT_MULTI_POINT_ROW_LABELS = [
  'Service',
  'price',
  'overall',
  'Quality',
  'Brand',
] as const;

const DEFAULT_MULTI_POINT_COLUMN_LABELS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
] as const;

export const DEFAULT_MULTI_POINT_QUESTION_TEXT =
  'Rate QuestionPro on the following';

export const DEFAULT_STAR_RATING_QUESTION_TEXT = 'Rate the following';

export const DEFAULT_SMILEY_RATING_QUESTION_TEXT = 'How would you rate us?';

export const DEFAULT_SMILEY_RATING_OPTIONS: ReadonlyArray<{
  label: string;
  tone: SurveySmileyRatingTone;
}> = [
  { label: 'Very Unsatisfied', tone: 'very-unsatisfied' },
  { label: 'Unsatisfied', tone: 'unsatisfied' },
  { label: 'Neutral', tone: 'neutral' },
  { label: 'Satisfied', tone: 'satisfied' },
  { label: 'Very Satisfied', tone: 'very-satisfied' },
] as const;

export function createDefaultSmileyRatingData(): SurveyQuestionSmileyRating {
  const ts = Date.now();
  return {
    options: DEFAULT_SMILEY_RATING_OPTIONS.map((option, index) => ({
      id: `smiley-opt-${ts}-${index + 1}`,
      label: option.label,
      tone: option.tone,
    })),
  };
}

export const DEFAULT_THUMBS_QUESTION_TEXT = 'Like it?';

export const DEFAULT_THUMBS_CHOICES: ReadonlyArray<{
  label: string;
  direction: SurveyThumbsDirection;
}> = [
  { label: 'Love it', direction: 'up' },
  { label: 'Hate it', direction: 'down' },
] as const;

export function createDefaultThumbsUpDownData(): SurveyQuestionThumbsUpDown {
  const ts = Date.now();
  return {
    choices: DEFAULT_THUMBS_CHOICES.map((choice, index) => ({
      id: `thumbs-choice-${ts}-${index + 1}`,
      label: choice.label,
      direction: choice.direction,
    })),
  };
}

export const DEFAULT_TEXT_SLIDER_QUESTION_TEXT = 'How would you rate us on the following?';

export const TEXT_SLIDER_VALUE_PLACEHOLDER = '--';

const DEFAULT_TEXT_SLIDER_ROW_LABELS = ['Product', 'Price', 'Overall'] as const;

const DEFAULT_TEXT_SLIDER_COLUMN_LABELS = [
  'Very dissatisfied',
  'Not satisfied',
  'Neutral',
  'Satisfied',
  'Very satisfied',
] as const;

export function createDefaultTextSliderMatrix(): SurveyMatrix {
  const ts = Date.now();
  return {
    leftAnchor: '',
    rightAnchor: '',
    columns: DEFAULT_TEXT_SLIDER_COLUMN_LABELS.map((label, index) => ({
      id: `text-slider-col-${ts}-${index + 1}`,
      label,
    })),
    rows: DEFAULT_TEXT_SLIDER_ROW_LABELS.map((label, index) => ({
      id: `text-slider-row-${ts}-${index + 1}`,
      label,
    })),
  };
}

export const STAR_RATING_STAR_COUNT = 5;

export function createDefaultStarRatingMatrix(): SurveyMatrix {
  const ts = Date.now();
  return {
    leftAnchor: '',
    rightAnchor: '',
    columns: Array.from({ length: STAR_RATING_STAR_COUNT }, (_, index) => ({
      id: `star-col-${ts}-${index + 1}`,
      label: '',
    })),
    rows: [
      { id: `star-row-${ts}-1`, label: 'Row 1' },
      { id: `star-row-${ts}-2`, label: 'Row 2' },
    ],
  };
}

export function createDefaultMultiPointMatrix(): SurveyMatrix {
  const ts = Date.now();
  return {
    leftAnchor: 'Bad',
    rightAnchor: 'good',
    columns: DEFAULT_MULTI_POINT_COLUMN_LABELS.map((label, index) => ({
      id: `col-${ts}-${index + 1}`,
      label,
    })),
    rows: DEFAULT_MULTI_POINT_ROW_LABELS.map((label, index) => ({
      id: `row-${ts}-${index + 1}`,
      label,
    })),
  };
}

export interface SurveySection {
  id: string;
  title: string;
  questions: SurveyQuestion[];
  showPageBreak?: boolean;
}

export interface SurveyDetail {
  survey: Survey;
  editorTitle: string;
  sections: SurveySection[];
}

const DEFAULT_SECTIONS: SurveySection[] = [
  {
    id: 'section-demo',
    title: 'Block 1',
    questions: [
      {
        id: 'q1',
        code: 'Q1',
        number: 1,
        text: 'What is your gender?',
        required: true,
        options: [
          { id: 'male', label: 'Male' },
          { id: 'female', label: 'Female' },
          { id: 'other', label: 'Other' },
          { id: 'na', label: 'NA' },
        ],
      },
      {
        id: 'q5',
        code: 'Q5',
        number: 5,
        text: 'Age',
        required: true,
        options: [
          { id: 'under-18', label: 'Under 18', logicLabel: 'Terminate Survey' },
          { id: '18-24', label: '18-24' },
          { id: '25-34', label: '25-34' },
          { id: '35-44', label: '35-44' },
          { id: '45-54', label: '45-54' },
          { id: '55-64', label: '55-64' },
          { id: 'above-64', label: 'Above 64' },
        ],
      },
      {
        id: 'q6',
        code: 'Q6',
        number: 6,
        text: 'Household income (optional)',
        required: false,
        options: [
          { id: 'inc-1', label: 'Under $25,000' },
          { id: 'inc-2', label: '$25,000–$49,999' },
          { id: 'inc-3', label: '$50,000–$99,999' },
          { id: 'inc-4', label: '$100,000 or more' },
          { id: 'inc-pref', label: 'Prefer not to say' },
        ],
      },
    ],
    showPageBreak: true,
  },
];

const BLANK_SURVEY_SECTIONS: SurveySection[] = [
  {
    id: 'section-blank-1',
    title: 'Block 1',
    questions: [],
  },
];

export function getSurveyDetail(survey: Survey): SurveyDetail {
  if (survey.id === NEW_AI_SURVEY_ID) {
    const draft = readAiSurveyDraft();
    const sections = draft?.sections.length ? draft.sections : BLANK_SURVEY_SECTIONS;
    return {
      survey,
      editorTitle: draft?.name ?? getSurveyEditorTitle(survey),
      sections,
    };
  }

  const sections = survey.id === NEW_BLANK_SURVEY_ID ? BLANK_SURVEY_SECTIONS : DEFAULT_SECTIONS;
  return {
    survey,
    editorTitle: getSurveyEditorTitle(survey),
    sections,
  };
}
