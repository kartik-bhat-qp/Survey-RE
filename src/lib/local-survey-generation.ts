import type { GeneratedSurveyPayload, GeneratedSurveyQuestion } from '@/lib/ai-survey-generation';

function radioQuestion(
  text: string,
  options: string[],
  required = true
): GeneratedSurveyQuestion {
  return { text, options, required, inputKind: 'radio' };
}

function deriveTitle(prompt: string): string {
  const cleaned = prompt
    .replace(/^(create|build|make|draft)\s+(a|an)?\s*/i, '')
    .replace(/\s+survey$/i, '')
    .trim();

  if (!cleaned) return 'Survey Draft';

  const words = cleaned.split(/\s+/).slice(0, 6);
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .concat(words.length > 0 && !/survey$/i.test(cleaned) ? ' Survey' : '');
}

function researchSurvey(prompt: string): GeneratedSurveyPayload {
  const topic =
    prompt.replace(/^(create|build|make|draft)\s+(a|an)?\s*/i, '').trim() ||
    'this topic';

  return {
    title: deriveTitle(prompt),
    sections: [
      {
        title: 'Block 1',
        questions: [
          radioQuestion('What is your current role or position?', [
            'Student / Academic',
            'Individual contributor',
            'Manager',
            'Executive / Leadership',
            'Prefer not to say',
          ]),
          radioQuestion(
            `How familiar are you with ${topic}?`,
            [
              'Not at all familiar',
              'Slightly familiar',
              'Moderately familiar',
              'Very familiar',
              'Extremely familiar',
            ]
          ),
          radioQuestion(
            'How would you rate your overall experience related to this research topic?',
            [
              'Very poor',
              'Poor',
              'Neutral',
              'Good',
              'Excellent',
            ]
          ),
          {
            text: 'Which areas are most important for us to explore? (Select all that apply)',
            options: [
              'Quality and reliability',
              'Ease of use',
              'Value for money',
              'Support and communication',
              'Innovation and features',
              'Other',
            ],
            required: false,
            inputKind: 'checkbox',
          },
          radioQuestion(
            'How likely are you to recommend participating in similar research in the future?',
            [
              '0 – Not at all likely',
              '1',
              '2',
              '3',
              '4',
              '5 – Extremely likely',
            ]
          ),
          radioQuestion(
            'What is the single biggest improvement we could make?',
            [
              'Lower cost',
              'Better quality',
              'Faster delivery',
              'More transparency',
              'More personalization',
              'Not sure',
            ],
            false
          ),
        ],
      },
    ],
  };
}

function npsSurvey(prompt: string): GeneratedSurveyPayload {
  return {
    title: deriveTitle(prompt) || 'NPS Survey',
    sections: [
      {
        title: 'Block 1',
        questions: [
          radioQuestion(
            'How likely are you to recommend us to a friend or colleague?',
            [
              '0 – Not at all likely',
              '1',
              '2',
              '3',
              '4',
              '5',
              '6',
              '7',
              '8',
              '9',
              '10 – Extremely likely',
            ]
          ),
          radioQuestion('What is the primary reason for your score?', [
            'Product quality',
            'Customer support',
            'Price / value',
            'Ease of use',
            'Brand trust',
            'Other',
          ]),
          radioQuestion(
            'What is one thing we could do to improve your experience?',
            [
              'Better product features',
              'Faster response times',
              'Clearer communication',
              'Lower pricing',
              'Nothing — very satisfied',
              'Other',
          ],
            false
          ),
        ],
      },
    ],
  };
}

function employeeSurvey(prompt: string): GeneratedSurveyPayload {
  return {
    title: deriveTitle(prompt) || 'Employee Feedback Survey',
    sections: [
      {
        title: 'Block 1',
        questions: [
          radioQuestion('Which department do you work in?', [
            'Engineering',
            'Product',
            'Sales',
            'Marketing',
            'Operations',
            'Other',
          ]),
          radioQuestion('I feel valued for the work I contribute.', [
            'Strongly disagree',
            'Disagree',
            'Neutral',
            'Agree',
            'Strongly agree',
          ]),
          radioQuestion('My manager supports my growth and development.', [
            'Strongly disagree',
            'Disagree',
            'Neutral',
            'Agree',
            'Strongly agree',
          ]),
          radioQuestion('I would recommend this organization as a great place to work.', [
            'Strongly disagree',
            'Disagree',
            'Neutral',
            'Agree',
            'Strongly agree',
          ]),
          radioQuestion(
            'What would most improve your day-to-day experience?',
            [
              'Clearer priorities',
              'Better tools',
              'More flexibility',
              'Recognition',
              'Team collaboration',
              'Other',
            ],
            false
          ),
        ],
      },
    ],
  };
}

function customerSatisfactionSurvey(prompt: string): GeneratedSurveyPayload {
  return {
    title: deriveTitle(prompt) || 'Customer Satisfaction Survey',
    sections: [
      {
        title: 'Block 1',
        questions: [
          radioQuestion('How satisfied are you with your overall experience?', [
            'Very dissatisfied',
            'Dissatisfied',
            'Neutral',
            'Satisfied',
            'Very satisfied',
          ]),
          radioQuestion('How easy was it to get the help you needed?', [
            'Very difficult',
            'Difficult',
            'Neutral',
            'Easy',
            'Very easy',
          ]),
          radioQuestion('How likely are you to use our product or service again?', [
            'Very unlikely',
            'Unlikely',
            'Neutral',
            'Likely',
            'Very likely',
          ]),
          radioQuestion(
            'Which aspect mattered most to your satisfaction?',
            [
              'Product quality',
              'Speed',
              'Support',
              'Price',
              'Reliability',
              'Other',
            ],
            false
          ),
        ],
      },
    ],
  };
}

/** Builds a editable survey when OpenAI is unavailable (quota, outage, etc.). */
export function generateLocalSurveyFallback(prompt: string): GeneratedSurveyPayload {
  const normalized = prompt.toLowerCase();

  if (
    normalized.includes('nps') ||
    normalized.includes('net promoter') ||
    normalized.includes('recommend')
  ) {
    return npsSurvey(prompt);
  }

  if (
    normalized.includes('employee') ||
    normalized.includes('pulse') ||
    normalized.includes('engagement') ||
    normalized.includes('onboarding')
  ) {
    return employeeSurvey(prompt);
  }

  if (
    normalized.includes('csat') ||
    normalized.includes('customer satisfaction') ||
    normalized.includes('support satisfaction')
  ) {
    return customerSatisfactionSurvey(prompt);
  }

  if (normalized.includes('research') || normalized.includes('market')) {
    return researchSurvey(prompt);
  }

  return researchSurvey(prompt);
}

export const LOCAL_SURVEY_FALLBACK_NOTICE =
  'OpenAI quota was reached, so we built a starter survey locally. You can edit it now — add billing on your OpenAI account for AI-generated drafts.';
