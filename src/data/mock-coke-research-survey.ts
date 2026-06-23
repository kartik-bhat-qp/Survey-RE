import type { SurveyQuestion, SurveyQuestionOption, SurveySection } from '@/data/mock-survey-detail';

export const COKE_RESEARCH_SURVEY_TITLE = 'Research surveys for Coke';

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

export function createCokeResearchSurveySections(): SurveySection[] {
  return [
    {
      id: 'section-coke-research',
      title: 'Block 1',
      questions: [
        {
          id: 'q-coke-1',
          code: 'Q1',
          number: 1,
          text: 'What is your age?',
          required: true,
          addQuestionTypeId: 'single-row',
          options: [],
        },
        selectOneQuestion('q-coke-2', 2, 'What is your gender?', [
          'Male',
          'Female',
          'Other',
          'Prefer not to say',
        ]),
        selectOneQuestion('q-coke-3', 3, 'Which area of Pune do you live in?', [
          'North Pune',
          'South Pune',
          'East Pune',
          'West Pune',
          'Central Pune',
          'Other',
        ]),
        selectOneQuestion(
          'q-coke-4',
          4,
          'How often do you drink carbonated soft drinks (like Pepsi)?',
          [
            'Daily',
            'Several times a week',
            'Once a week',
            'A few times a month',
            'Rarely',
            'Never',
          ]
        ),
        selectOneQuestion('q-coke-5', 5, 'Which brand of cola do you prefer? (single answer)', [
          'Pepsi',
          'Coca-Cola',
          'Thums Up',
          'RC Cola',
          'No preference/Other',
        ]),
        {
          id: 'q-coke-6',
          code: 'Q6',
          number: 6,
          text: 'What factors influence your choice of cola? (select all that apply)',
          required: true,
          inputKind: 'checkbox',
          addQuestionTypeId: 'select-many',
          options: makeOptions('q-coke-6', [
            'Taste',
            'Price',
            'Availability',
            'Brand image',
            'Advertisements/celebrity endorsements',
            'Packaging',
            'Promotions/discounts',
            'Friend/family recommendation',
          ]),
        },
        selectOneQuestion("q-coke-7", 7, "How satisfied are you with Pepsi's taste?", [
          'Very satisfied',
          'Somewhat satisfied',
          'Neutral',
          'Somewhat dissatisfied',
          'Very dissatisfied',
        ]),
        selectOneQuestion('q-coke-8', 8, 'Where do you normally buy Pepsi?', [
          'Supermarket/Hypermarket',
          'Local grocery/shop',
          'Street vendor/food stall',
          'Restaurant/Cafe',
          'Online delivery/App',
          'Other',
        ]),
        selectOneQuestion('q-coke-9', 9, 'What pack size do you usually purchase?', [
          '250 ml/Can',
          '600 ml bottle',
          '1 L bottle',
          '1.5 L bottle',
          '2 L bottle',
          'Family pack/Other',
        ]),
        selectOneQuestion(
          'q-coke-10',
          10,
          'Do you notice Pepsi advertisements in Pune?',
          ['Yes, often', 'Sometimes', 'Rarely', 'Never'],
          false
        ),
        selectOneQuestion(
          'q-coke-11',
          11,
          'Which channels influence you most for soft drink information?',
          [
            'TV',
            'Social media',
            'Billboards',
            'In-store displays',
            'Newspapers/Magazines',
            'Friends/Family',
            'Radio',
          ]
        ),
        selectOneQuestion(
          'q-coke-12',
          12,
          'How likely are you to switch from your preferred cola to Pepsi if price is lower?',
          [
            'Very likely',
            'Somewhat likely',
            'Not sure',
            'Somewhat unlikely',
            'Very unlikely',
          ]
        ),
        {
          id: 'q-coke-13',
          code: 'Q13',
          number: 13,
          text: 'What do you like most about Pepsi? (open-ended)',
          required: true,
          addQuestionTypeId: 'comment-box',
          options: [],
        },
        {
          id: 'q-coke-14',
          code: 'Q14',
          number: 14,
          text: 'What improvements would you like to see from Pepsi? (open-ended)',
          required: true,
          addQuestionTypeId: 'comment-box',
          options: [],
        },
        selectOneQuestion(
          'q-coke-15',
          15,
          'Would you recommend Pepsi to friends/family in Pune?',
          ['Definitely yes', 'Probably yes', 'Not sure', 'Probably no', 'Definitely no']
        ),
      ],
    },
  ];
}
