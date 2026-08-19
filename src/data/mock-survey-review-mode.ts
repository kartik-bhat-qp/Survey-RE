import type { SurveyQuestion, SurveyQuestionOption, SurveySection } from '@/data/mock-survey-detail';

export const SURVEY_REVIEW_MODE_SURVEY_ID = 19;

function makeOptions(questionKey: string, labels: readonly string[]): SurveyQuestionOption[] {
  return labels.map((label, index) => ({
    id: `${questionKey}-opt-${index + 1}`,
    label,
  }));
}

function selectOneQuestion(
  questionKey: string,
  number: number,
  text: string,
  optionLabels: readonly string[],
  required = true
): SurveyQuestion {
  return {
    id: questionKey,
    code: `Q${number}`,
    number,
    text,
    required,
    inputKind: 'radio',
    addQuestionTypeId: 'select-one',
    options: makeOptions(questionKey, optionLabels),
  };
}

function selectManyQuestion(
  questionKey: string,
  number: number,
  text: string,
  optionLabels: readonly string[],
  required = true
): SurveyQuestion {
  return {
    id: questionKey,
    code: `Q${number}`,
    number,
    text,
    required,
    inputKind: 'checkbox',
    addQuestionTypeId: 'select-many',
    options: makeOptions(questionKey, optionLabels),
  };
}

export function createSurveyReviewModeSections(): SurveySection[] {
  return [
    {
      id: 'section-review-mode-1',
      title: 'Block 1',
      questions: [
        selectOneQuestion(
          'q-review-mode-1',
          1,
          'How would you rate your overall experience with this product?',
          ['Excellent', 'Good', 'Fair', 'Poor', 'Very poor']
        ),
        selectManyQuestion(
          'q-review-mode-2',
          2,
          'Which of the following influenced your rating? Select all that apply.',
          [
            'Ease of use',
            'Product quality',
            'Customer support',
            'Price / value',
            'Speed / performance',
            'Other',
          ]
        ),
        {
          id: 'q-review-mode-3',
          code: 'Q3',
          number: 3,
          text: 'Please share any additional comments about your experience.',
          required: false,
          addQuestionTypeId: 'comment-box',
          options: [],
        },
        selectOneQuestion(
          'q-review-mode-4',
          4,
          'How likely are you to recommend this product to a colleague or friend?',
          ['Very likely', 'Somewhat likely', 'Neutral', 'Somewhat unlikely', 'Very unlikely']
        ),
      ],
    },
  ];
}
