import type {
  SurveyQuestion,
  SurveyQuestionInputKind,
  SurveyQuestionKind,
  SurveySection,
} from '@/data/mock-survey-detail';
import type { SurveyQuestionPreviewFollowUp } from '@/data/survey-question-preview-session';

export function findNextSurveyQuestion(
  sections: SurveySection[],
  sectionId: string,
  questionId: string
): SurveyQuestion | null {
  const ordered: SurveyQuestion[] = [];
  for (const section of sections) {
    ordered.push(...section.questions);
  }
  const index = ordered.findIndex((question) => question.id === questionId);
  if (index < 0 || index >= ordered.length - 1) {
    return null;
  }
  return ordered[index + 1] ?? null;
}

export function toQuestionPreviewFollowUp(
  question: SurveyQuestion
): SurveyQuestionPreviewFollowUp {
  return {
    code: question.code,
    text: question.text,
    required: question.required,
    kind: question.kind ?? 'standard',
    inputKind: question.inputKind ?? 'radio',
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
