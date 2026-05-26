import type { Survey } from '@/data/mock-surveys';
import { getSurveyEditorTitle } from '@/data/get-survey-by-id';

export interface SurveyQuestionOption {
  id: string;
  label: string;
  logicLabel?: string;
}

export interface SurveyQuestion {
  id: string;
  number: number;
  text: string;
  required?: boolean;
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
    title: 'Demo',
    questions: [
      {
        id: 'q1',
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
