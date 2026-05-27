import type { Survey } from '@/data/mock-surveys';
import { getSurveyEditorTitle } from '@/data/get-survey-by-id';

export type SurveyQuestionInputKind = 'radio' | 'checkbox';

export interface SurveyQuestionOption {
  id: string;
  label: string;
  logicLabel?: string;
}

export interface SurveyQuestion {
  id: string;
  /** Question code shown in the workspace gutter (e.g. Q5). */
  code: string;
  number: number;
  text: string;
  required?: boolean;
  /** How options render; default `radio` when omitted (existing mock questions). */
  inputKind?: SurveyQuestionInputKind;
  options: SurveyQuestionOption[];
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

export function getSurveyDetail(survey: Survey): SurveyDetail {
  return {
    survey,
    editorTitle: getSurveyEditorTitle(survey),
    sections: DEFAULT_SECTIONS,
  };
}
