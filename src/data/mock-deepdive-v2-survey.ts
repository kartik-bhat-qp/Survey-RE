import type { SurveyQuestion, SurveyQuestionOption, SurveySection } from '@/data/mock-survey-detail';
import {
  DEEPDIVE_FOLLOW_UP_QUESTION_NUMBER,
  DEEPDIVE_V2_SURVEY_ID,
} from '@/data/mock-deepdive-question-settings';
import { createDeepDiveFollowUpConfigQuestion } from '@/data/mock-deepdive-follow-up-question';

export { DEEPDIVE_V2_SURVEY_ID, DEEPDIVE_FOLLOW_UP_QUESTION_NUMBER };

export const DEEPDIVE_V2_SECTION_ID = 'section-deepdive-v2';
export const DEEPDIVE_V2_TARGET_QUESTION_ID = 'q-deepdive-17';

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
  optionLabels: readonly string[]
): SurveyQuestion {
  return {
    id: questionKey,
    code: `Q${number}`,
    number,
    text,
    required: true,
    inputKind: 'radio',
    addQuestionTypeId: 'select-one',
    options: makeOptions(questionKey, optionLabels),
  };
}

const SCREENING_PROMPTS = [
  'Which region do you primarily work in?',
  'What is your current role level?',
  'How many years of experience do you have in this field?',
  'Which industry best describes your organization?',
  'How often do you participate in research studies?',
  'Which tools do you use most often for customer insights?',
  'How large is your team?',
  'What is your preferred interview format?',
  'How comfortable are you sharing detailed feedback?',
  'Which topics are you most interested in exploring today?',
  'Have you used AI-assisted research tools before?',
  'What outcome are you hoping to get from this session?',
  'How much time can you dedicate to this study?',
  'Which language do you prefer for follow-up questions?',
  'Do you consent to dynamic follow-up questions during this study?',
  'Which channel do you prefer for research reminders?',
] as const;

export function createDeepDiveV2Sections(): SurveySection[] {
  const sectionId = DEEPDIVE_V2_SECTION_ID;
  const targetQuestionId = DEEPDIVE_V2_TARGET_QUESTION_ID;

  const screeningQuestions = SCREENING_PROMPTS.map((text, index) => {
    const number = index + 1;
    const questionKey = `q-deepdive-${number}`;
    return selectOneQuestion(questionKey, number, text, [
      'Option 1',
      'Option 2',
      'Option 3',
      'Other',
    ]);
  });

  const targetQuestion: SurveyQuestion = {
    id: targetQuestionId,
    code: 'Q17',
    number: DEEPDIVE_FOLLOW_UP_QUESTION_NUMBER,
    text: 'Which fast-food chain you like the most?',
    required: true,
    inputKind: 'checkbox',
    addQuestionTypeId: 'select-many',
    options: makeOptions(targetQuestionId, ['Taco Bell', 'KFC', 'McD', 'Burger King']),
  };

  const deepDiveConfigQuestion = createDeepDiveFollowUpConfigQuestion(
    'q-deepdive-config',
    '',
    '',
    DEEPDIVE_FOLLOW_UP_QUESTION_NUMBER + 1,
    { enabled: true, maxFollowUp: 3, tone: 'neutral' }
  );

  return [
    {
      id: sectionId,
      title: 'Block 1',
      questions: [deepDiveConfigQuestion, targetQuestion, ...screeningQuestions],
    },
  ];
}
export function isDeepDiveFollowUpSettingsQuestion(
  surveyId: number,
  question: SurveyQuestion,
  surveyName?: string
): boolean {
  const isDeepDiveSurvey =
    surveyId === DEEPDIVE_V2_SURVEY_ID || surveyName?.trim() === 'DeepDive V2';
  const normalizedCode = question.code.trim().toUpperCase();
  const isQuestion17 =
    question.number === DEEPDIVE_FOLLOW_UP_QUESTION_NUMBER || normalizedCode === 'Q17';

  return isDeepDiveSurvey && isQuestion17;
}

