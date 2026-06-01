import type { Survey } from '@/data/mock-surveys';
import { getSurveyEditorTitle } from '@/data/get-survey-by-id';
import { NEW_AI_SURVEY_ID, readAiSurveyDraft } from '@/data/ai-survey-draft';
import { NEW_BLANK_SURVEY_ID } from '@/data/mock-survey-creation-flow';

export type SurveyQuestionInputKind = 'radio' | 'checkbox';

export type SurveyQuestionKind = 'standard' | 'multi-point-scales';

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
}

export function createDefaultMultiPointMatrix(): SurveyMatrix {
  const ts = Date.now();
  return {
    leftAnchor: 'Left Anchor',
    rightAnchor: 'Right Anchor',
    columns: [
      { id: `col-${ts}-1`, label: 'Column 1' },
      { id: `col-${ts}-2`, label: 'Column 2' },
    ],
    rows: [
      { id: `row-${ts}-1`, label: 'Row 1' },
      { id: `row-${ts}-2`, label: 'Row 2' },
    ],
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
