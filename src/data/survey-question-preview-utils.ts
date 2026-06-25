import type { AnswerDisplayOrder, QuestionSettings } from '@/data/mock-question-settings';
import type {
  SurveyQuestion,
  SurveyQuestionInputKind,
  SurveyQuestionKind,
  SurveySection,
} from '@/data/mock-survey-detail';
import type { SurveyQuestionPreviewFollowUp } from '@/data/survey-question-preview-session';

export function getOrderedSurveyQuestions(sections: SurveySection[]): SurveyQuestion[] {
  const ordered: SurveyQuestion[] = [];
  for (const section of sections) {
    ordered.push(...section.questions);
  }
  return ordered;
}

export function isFirstSurveyQuestion(
  sections: SurveySection[],
  sectionId: string,
  questionId: string
): boolean {
  const ordered = getOrderedSurveyQuestions(sections);
  return ordered[0]?.id === questionId;
}

export function findNextSurveyQuestion(
  sections: SurveySection[],
  sectionId: string,
  questionId: string
): SurveyQuestion | null {
  const ordered = getOrderedSurveyQuestions(sections);
  const index = ordered.findIndex((question) => question.id === questionId);
  if (index < 0 || index >= ordered.length - 1) {
    return null;
  }
  return ordered[index + 1] ?? null;
}

function resolvePreviewInputKind(
  question: SurveyQuestion,
  settings?: Pick<QuestionSettings, 'answerType'>
): SurveyQuestionInputKind {
  if (question.inputKind === 'checkbox' || question.addQuestionTypeId === 'select-many') {
    return 'checkbox';
  }
  if (settings?.answerType === 'checkbox') {
    return 'checkbox';
  }
  return 'radio';
}

export function resolveQuestionPreviewInputKind(
  question: SurveyQuestion,
  settings?: Pick<QuestionSettings, 'answerType'>
): SurveyQuestionInputKind {
  return resolvePreviewInputKind(question, settings);
}

function isMatrixKindQuestion(question: SurveyQuestion): boolean {
  return (
    question.kind === 'multi-point-scales' ||
    question.kind === 'matrix-multi-select' ||
    question.kind === 'matrix-spreadsheet'
  );
}

export function isSelectManyPreviewQuestion(
  question: SurveyQuestion,
  settings?: Pick<QuestionSettings, 'answerType'>
): boolean {
  if (isMatrixKindQuestion(question)) {
    return false;
  }
  return resolveQuestionPreviewInputKind(question, settings) === 'checkbox';
}

export function toQuestionPreviewFollowUp(
  question: SurveyQuestion,
  settings?: Pick<QuestionSettings, 'answerType'>
): SurveyQuestionPreviewFollowUp {
  return {
    code: question.code,
    text: question.text,
    required: question.required,
    kind: question.kind ?? 'standard',
    inputKind: resolvePreviewInputKind(question, settings),
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label,
    })),
    matrix: question.matrix
      ? {
          leftAnchor: question.matrix.leftAnchor,
          rightAnchor: question.matrix.rightAnchor,
          columns: question.matrix.columns.map((column) => ({ ...column })),
          rows: question.matrix.rows.map((row) => ({ ...row })),
        }
      : undefined,
  };
}

export function resolveQuestionKind(kind?: SurveyQuestionKind): SurveyQuestionKind {
  if (kind === 'multi-point-scales') return 'multi-point-scales';
  if (kind === 'nps') return 'nps';
  if (kind === 'van-westendorp') return 'van-westendorp';
  return 'standard';
}

export function resolveInputKind(inputKind?: SurveyQuestionInputKind): SurveyQuestionInputKind {
  return inputKind === 'checkbox' ? 'checkbox' : 'radio';
}
