import type { SurveySection } from '@/data/mock-survey-detail';
import {
  DEFAULT_FLEX_MATRIX_DROPDOWN_OPTIONS,
  DEFAULT_FLEX_MATRIX_RATING_SCALE_OPTIONS,
} from '@/data/mock-survey-detail';

export const FLEX_LOGIC_SURVEY_ID = 20;

export const FLEX_LOGIC_SURVEY_NAME = 'Flex logic';

export function createFlexLogicSections(): SurveySection[] {
  return [
    {
      id: 'section-flex-logic-1',
      title: 'Block 1',
      questions: [
        {
          id: 'q-flex-logic-1',
          code: 'Q1',
          number: 1,
          text: 'How would you rate the following product attributes?',
          required: true,
          kind: 'flex-matrix',
          addQuestionTypeId: 'flex-matrix',
          options: [],
          matrix: {
            leftAnchor: '',
            rightAnchor: '',
            columns: [
              { id: 'fx-col-1', label: 'Text Input', cellType: 'text' },
              { id: 'fx-col-2', label: 'Single Select', cellType: 'radio' },
              { id: 'fx-col-3', label: 'Multi-Select', cellType: 'checkbox' },
              { id: 'fx-col-4', label: 'Numeric Text Input', cellType: 'numeric' },
              { id: 'fx-col-5', label: 'Rank Order', cellType: 'rank-order' },
              {
                id: 'fx-col-6',
                label: 'Drop-down Menu',
                cellType: 'dropdown',
                options: [...DEFAULT_FLEX_MATRIX_DROPDOWN_OPTIONS],
              },
              {
                id: 'fx-col-7',
                label: 'Rating Scale',
                cellType: 'rating-scale',
                options: [...DEFAULT_FLEX_MATRIX_RATING_SCALE_OPTIONS],
              },
              { id: 'fx-col-8', label: 'Numeric Slider', cellType: 'numeric-slider' },
            ],
            rows: [
              { id: 'fx-row-1', label: 'Product Packaging' },
              { id: 'fx-row-2', label: 'On-Time Arrival' },
              { id: 'fx-row-3', label: 'Price' },
              { id: 'fx-row-4', label: 'Row 4' },
              { id: 'fx-row-5', label: 'Row 5' },
            ],
          },
        },
      ],
    },
  ];
}
