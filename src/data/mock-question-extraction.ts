import { parseSelectedValues } from '@/data/mock-criteria-engine';
import type {
  SurveyQuestion,
  SurveyQuestionInputKind,
  SurveyQuestionOption,
} from '@/data/mock-survey-detail';
import type { ExtractionLogicState, ExtractionQuestionType, QuestionLogicState } from '@/data/mock-question-logic';

export function buildExtractedQuestionId(sourceQuestionId: string): string {
  return `q-xtr-${sourceQuestionId}`;
}

export function buildExtractedQuestionCode(sourceQuestionCode: string): string {
  return `XTR-${sourceQuestionCode}`;
}

export function isExtractionLogicApplied(state: QuestionLogicState): boolean {
  return state.logicType === 'extraction';
}

export function getExtractionOptionLabels(
  state: QuestionLogicState,
  sourceQuestionCode: string,
  optionIds: string[]
): Record<string, string> {
  if (!isExtractionLogicApplied(state)) return {};

  const label = buildExtractedQuestionCode(sourceQuestionCode);
  const labels: Record<string, string> = {};
  for (const optionId of optionIds) {
    labels[optionId] = label;
  }
  return labels;
}

export function isExtractedSurveyQuestion(question: SurveyQuestion): boolean {
  return question.extractionSource != null;
}

export function resolveExtractionInputKind(
  questionType: ExtractionQuestionType
): SurveyQuestionInputKind {
  if (questionType === 'multi-select' || questionType === 'matrix-multi-select') {
    return 'checkbox';
  }
  return 'radio';
}

export function resolveExtractedOptions(
  source: SurveyQuestion,
  extraction: ExtractionLogicState
): SurveyQuestionOption[] {
  const alwaysIds = parseSelectedValues(extraction.alwaysExtractOptionId);
  const neverIds = new Set(parseSelectedValues(extraction.neverExtractOptionId));

  let options = source.options;
  if (alwaysIds.length > 0) {
    const allowed = new Set(alwaysIds);
    options = options.filter((option) => allowed.has(option.id));
  }
  if (neverIds.size > 0) {
    options = options.filter((option) => !neverIds.has(option.id));
  }
  if (options.length === 0) {
    options = source.options;
  }

  const ts = Date.now();
  return options.map((option, index) => ({
    id: `xtr-opt-${ts}-${index + 1}`,
    label: option.label,
  }));
}

export function buildExtractedQuestion(
  source: SurveyQuestion,
  extraction: ExtractionLogicState,
  sectionQuestions: SurveyQuestion[],
  existing?: SurveyQuestion
): SurveyQuestion {
  const extractedId = buildExtractedQuestionId(source.id);
  const inputKind = resolveExtractionInputKind(extraction.questionType);
  const nextNumber =
    existing?.number ??
    sectionQuestions.reduce((max, question) => Math.max(max, question.number), 0) + 1;

  return {
    id: extractedId,
    code: buildExtractedQuestionCode(source.code),
    number: nextNumber,
    text: existing?.text ?? `Question ${nextNumber}`,
    required: source.required,
    kind: 'standard',
    inputKind,
    addQuestionTypeId: inputKind === 'checkbox' ? 'select-many' : 'select-one',
    options: resolveExtractedOptions(source, extraction),
    extractionSource: {
      sourceQuestionId: source.id,
      sourceQuestionCode: source.code,
    },
  };
}

export function upsertExtractedQuestionInSection(
  questions: SurveyQuestion[],
  sourceIndex: number,
  source: SurveyQuestion,
  extraction: ExtractionLogicState
): { questions: SurveyQuestion[]; extractedQuestionId: string } {
  const extractedId = buildExtractedQuestionId(source.id);
  const existingIndex = questions.findIndex((question) => question.id === extractedId);
  const existing = existingIndex >= 0 ? questions[existingIndex] : undefined;
  const extractedQuestion = buildExtractedQuestion(source, extraction, questions, existing);

  if (existingIndex >= 0) {
    const next = [...questions];
    next[existingIndex] = extractedQuestion;
    return { questions: next, extractedQuestionId: extractedId };
  }

  const next = [...questions];
  next.splice(sourceIndex + 1, 0, extractedQuestion);
  return { questions: next, extractedQuestionId: extractedId };
}

export function removeExtractedQuestionFromSection(
  questions: SurveyQuestion[],
  sourceQuestionId: string
): SurveyQuestion[] {
  const extractedId = buildExtractedQuestionId(sourceQuestionId);
  return questions.filter((question) => question.id !== extractedId);
}
