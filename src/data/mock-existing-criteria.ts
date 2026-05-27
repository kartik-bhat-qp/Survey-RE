/** Reusable criteria templates for criteria-based quota (prototype library). */

export type ExistingCriteriaConditionSource =
  | 'Question'
  | 'System Variable'
  | 'Geo Location'
  | 'Email List Code'
  | 'Device Type';

export type ExistingCriteriaConnector = 'AND' | 'OR';

export interface ExistingCriteriaCondition {
  source: ExistingCriteriaConditionSource;
  questionCode: string;
  questionText: string;
  subject: string;
  operator: string;
  value: string;
  valueEnd?: string;
  connector: ExistingCriteriaConnector;
}

export interface ExistingCriteriaTemplate {
  id: string;
  name: string;
  /** Short label shown in the existing-criteria dropdown. */
  summary: string;
  conditions: ExistingCriteriaCondition[];
}

export const MOCK_EXISTING_CRITERIA: ExistingCriteriaTemplate[] = [
  {
    id: 'crit-male-25-34',
    name: 'Male 25–34',
    summary: 'Male AND age 25–34',
    conditions: [
      {
        source: 'Question',
        questionCode: 'Q1',
        questionText: 'What is your gender?',
        subject: 'What is your gender?',
        operator: 'is',
        value: 'Male',
        connector: 'AND',
      },
      {
        source: 'Question',
        questionCode: 'Q2',
        questionText: 'What is your age?',
        subject: 'What is your age?',
        operator: 'is',
        value: '25-34',
        connector: 'AND',
      },
    ],
  },
  {
    id: 'crit-female-non-drinker',
    name: 'Female non-drinkers',
    summary: 'Female AND does not follow sports regularly',
    conditions: [
      {
        source: 'Question',
        questionCode: 'Q1',
        questionText: 'What is your gender?',
        subject: 'What is your gender?',
        operator: 'is',
        value: 'Female',
        connector: 'AND',
      },
      {
        source: 'Question',
        questionCode: 'Q3',
        questionText: 'Which sports do you follow regularly?',
        subject: 'Which sports do you follow regularly?',
        operator: 'is not',
        value: 'Cricket, Football',
        connector: 'AND',
      },
    ],
  },
  {
    id: 'crit-promoter-nps',
    name: 'NPS promoters',
    summary: 'NPS score is promoter (9–10)',
    conditions: [
      {
        source: 'Question',
        questionCode: 'Q4',
        questionText:
          'How likely are you to recommend this service to a friend or colleague?',
        subject:
          'How likely are you to recommend this service to a friend or colleague?',
        operator: 'is',
        value: '9-10 (Promoters)',
        connector: 'AND',
      },
    ],
  },
  {
    id: 'crit-west-bengal-kolkata',
    name: 'Kolkata metro',
    summary: 'West Bengal district is Kolkata',
    conditions: [
      {
        source: 'Question',
        questionCode: 'Q2a',
        questionText: 'Which district of West Bengal do you reside in?',
        subject: 'Which district of West Bengal do you reside in?',
        operator: 'is',
        value: 'Kolkata',
        connector: 'AND',
      },
    ],
  },
  {
    id: 'crit-custom-var-loyalty',
    name: 'High loyalty score',
    summary: 'Custom 12 is greater than or equal to 80',
    conditions: [
      {
        source: 'System Variable',
        questionCode: '',
        questionText: '',
        subject: 'Custom 12',
        operator: 'is greater than or equal to',
        value: '80',
        connector: 'AND',
      },
    ],
  },
  {
    id: 'crit-mobile-users',
    name: 'Mobile respondents',
    summary: 'Device type is Mobile',
    conditions: [
      {
        source: 'Device Type',
        questionCode: '',
        questionText: '',
        subject: 'Device Type',
        operator: 'is',
        value: 'Mobile',
        connector: 'AND',
      },
    ],
  },
  {
    id: 'crit-geo-maharashtra',
    name: 'Maharashtra geo',
    summary: 'Geo location contains Maharashtra',
    conditions: [
      {
        source: 'Geo Location',
        questionCode: '',
        questionText: '',
        subject: 'Geo Location',
        operator: 'contains',
        value: 'Maharashtra',
        connector: 'AND',
      },
    ],
  },
  {
    id: 'crit-satisfied-weekly-streaming',
    name: 'Satisfied weekly streamers',
    summary: 'Very satisfied AND streams weekly',
    conditions: [
      {
        source: 'Question',
        questionCode: 'Q6',
        questionText: 'What is your overall satisfaction with the product?',
        subject: 'What is your overall satisfaction with the product?',
        operator: 'is',
        value: 'Very satisfied',
        connector: 'AND',
      },
      {
        source: 'Question',
        questionCode: 'Q9',
        questionText: 'How often do you use online streaming services?',
        subject: 'How often do you use online streaming services?',
        operator: 'is',
        value: 'Weekly',
        connector: 'AND',
      },
    ],
  },
  {
    id: 'crit-panel-invite-a',
    name: 'Panel invite list A',
    summary: 'Email list code equals PANEL-A-2025',
    conditions: [
      {
        source: 'Email List Code',
        questionCode: '',
        questionText: '',
        subject: 'Email List Code',
        operator: 'equals',
        value: 'PANEL-A-2025',
        connector: 'AND',
      },
    ],
  },
  {
    id: 'crit-age-range-custom',
    name: 'Custom age band (system variable)',
    summary: 'Custom 3 is between 18 and 35',
    conditions: [
      {
        source: 'System Variable',
        questionCode: '',
        questionText: '',
        subject: 'Custom 3',
        operator: 'is between',
        value: '18',
        valueEnd: '35',
        connector: 'AND',
      },
    ],
  },
  {
    id: 'crit-long-name-urban-millennial-female-household-decision-maker',
    name: 'Urban millennial female household decision-maker with high purchase intent and multi-channel media consumption profile',
    summary: 'Female, 25–34, satisfied, uses social media weekly',
    conditions: [
      {
        source: 'Question',
        questionCode: 'Q1',
        questionText: 'What is your gender?',
        subject: 'What is your gender?',
        operator: 'is',
        value: 'Female',
        connector: 'AND',
      },
      {
        source: 'Question',
        questionCode: 'Q2',
        questionText: 'What is your age?',
        subject: 'What is your age?',
        operator: 'is',
        value: '25-34',
        connector: 'AND',
      },
      {
        source: 'Question',
        questionCode: 'Q10',
        questionText: 'Select all media channels you use weekly.',
        subject: 'Select all media channels you use weekly.',
        operator: 'contains',
        value: 'Social Media',
        connector: 'AND',
      },
    ],
  },
];

export function getExistingCriteriaById(
  id: string
): ExistingCriteriaTemplate | undefined {
  return MOCK_EXISTING_CRITERIA.find((template) => template.id === id);
}
