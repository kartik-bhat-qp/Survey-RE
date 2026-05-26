export interface TextAiAnalysisQuestion {
  id: number;
  code: string;
  text: string;
}

export const MOCK_TEXT_AI_ANALYSIS_QUESTIONS: TextAiAnalysisQuestion[] = [
  {
    id: 1,
    code: 'Q2',
    text: 'What can we do to improve your opinion about our company as a place to work?',
  },
  {
    id: 2,
    code: 'Q3',
    text: 'What do you appreciate most about working at our organization?',
  },
  {
    id: 3,
    code: 'Q4',
    text: 'What challenges or frustrations do you face in your day-to-day role?',
  },
  {
    id: 4,
    code: 'Q5',
    text: 'How would you describe our team culture in your own words?',
  },
  {
    id: 5,
    code: 'Q6',
    text: 'What suggestions do you have for improving collaboration across departments?',
  },
];

export const TEXT_AI_QUESTION_CONTEXT_PLACEHOLDER = 'Context not provided';

/** Account credit balance for TextAI dashboard creation. */
export const TEXT_AI_CREDIT_BALANCE = 15000;

/** Credits consumed per selected question. */
export const TEXT_AI_CREDITS_PER_QUESTION = 1640;

export function getTextAiCreditsNeeded(selectedQuestionCount: number): number {
  return selectedQuestionCount * TEXT_AI_CREDITS_PER_QUESTION;
}

export function getTextAiQuestionById(id: number): TextAiAnalysisQuestion | undefined {
  return MOCK_TEXT_AI_ANALYSIS_QUESTIONS.find((q) => q.id === id);
}

export function getDefaultSelectedTextAiQuestionIds(): number[] {
  return MOCK_TEXT_AI_ANALYSIS_QUESTIONS.map((q) => q.id);
}
