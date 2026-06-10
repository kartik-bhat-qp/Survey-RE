import { plainTextFromRichValue } from '@/components/surveys/rich-text-utils';
import {
  parseSelectedValues,
  type Criterion,
  type CriterionCondition,
} from '@/data/mock-criteria-engine';
import { getQuestionsBySurvey } from '@/data/mock-survey-questions';
import type { ShowHideOptionsPreviewConfig } from '@/data/show-hide-options-preview';

export interface SurveyPreviewAnswer {
  selectedOptionIds: string[];
  selectedLabels: string[];
}

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function getAnswerLabels(answer: SurveyPreviewAnswer | undefined): string[] {
  if (!answer) return [];
  return answer.selectedLabels.map((label) => normalizeValue(label));
}

function getConditionValues(cond: CriterionCondition): string[] {
  return parseSelectedValues(cond.value).map((value) => normalizeValue(value));
}

function evaluateQuestionCondition(
  cond: CriterionCondition,
  surveyId: number,
  answersByCode: Record<string, SurveyPreviewAnswer>
): boolean {
  if (cond.source !== 'Question' || cond.questionId === null) {
    return false;
  }

  const catalogQuestion = getQuestionsBySurvey(surveyId).find(
    (question) => question.id === cond.questionId
  );
  if (!catalogQuestion) return false;

  const answerLabels = getAnswerLabels(answersByCode[catalogQuestion.code]);
  if (answerLabels.length === 0) return false;

  const conditionValues = getConditionValues(cond);
  if (conditionValues.length === 0) return false;

  const matches = conditionValues.some((value) => answerLabels.includes(value));

  switch (cond.operator) {
    case 'is':
      return matches;
    case 'is not':
      return !matches;
    case 'contains':
      return conditionValues.some((value) =>
        answerLabels.some((label) => label.includes(value))
      );
    case 'does not contain':
      return !conditionValues.some((value) =>
        answerLabels.some((label) => label.includes(value))
      );
    default:
      return matches;
  }
}

function evaluateCondition(
  cond: CriterionCondition,
  surveyId: number,
  answersByCode: Record<string, SurveyPreviewAnswer>
): boolean {
  if (cond.source === 'Question') {
    return evaluateQuestionCondition(cond, surveyId, answersByCode);
  }
  return false;
}

export function evaluateCriterionMet(
  criterion: Criterion,
  surveyId: number,
  answersByCode: Record<string, SurveyPreviewAnswer>
): boolean {
  const completeConditions = criterion.conditions.filter(
    (cond) => cond.source === 'Question' && cond.questionId !== null && cond.value.trim() !== ''
  );
  if (completeConditions.length === 0) return false;

  const results = completeConditions.map((cond) =>
    evaluateCondition(cond, surveyId, answersByCode)
  );

  return results.slice(1).reduce((accumulator, result, index) => {
    const connector = completeConditions[index + 1]?.connector ?? 'AND';
    return connector === 'OR' ? accumulator || result : accumulator && result;
  }, results[0]);
}

export function evaluateCriteriaMetFromAnswers(
  config: ShowHideOptionsPreviewConfig,
  surveyId: number,
  answersByCode: Record<string, SurveyPreviewAnswer>
): Record<string, boolean> {
  const criteriaMet: Record<string, boolean> = {};
  for (const criterion of config.criteria) {
    criteriaMet[criterion.id] = evaluateCriterionMet(criterion, surveyId, answersByCode);
  }
  return criteriaMet;
}

export function labelsForOptionIds(
  options: { id: string; label: string }[],
  selectedOptionIds: string[]
): string[] {
  const selected = new Set(selectedOptionIds);
  return options
    .filter((option) => selected.has(option.id))
    .map((option) => plainTextFromRichValue(option.label));
}
