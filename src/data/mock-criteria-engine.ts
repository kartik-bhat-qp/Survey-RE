import type { ExistingCriteriaTemplate } from '@/data/mock-existing-criteria';
import type { SurveyQuestion } from '@/data/mock-survey-questions';

export const QUESTION_OPERATORS = ['is', 'is not', 'contains', 'does not contain'] as const;

export const SYSTEM_VARIABLE_TEXT_OPERATORS = [
  'equals',
  'contains',
  'does not contain',
  'starts with',
  'ends with',
  'is blank',
  'is not blank',
] as const;

export const SYSTEM_VARIABLE_NUMERIC_OPERATORS = [
  'Is equal to',
  'is greater than or equal to',
  'is less than or equal to',
  'is greater than',
  'is less than',
  'is not equal to',
  'is between',
] as const;

export const DEFAULT_SYSTEM_VARIABLE_OPERATOR = SYSTEM_VARIABLE_TEXT_OPERATORS[0];

export const CONDITION_SOURCES = [
  'Question',
  'System Variable',
  'Geo Location',
  'Email List Code',
  'Device Type',
] as const;

export type ConditionSource = (typeof CONDITION_SOURCES)[number];

export const CONNECTORS = ['AND', 'OR'] as const;
export type ConditionConnector = (typeof CONNECTORS)[number];

export const CRITERIA_MODES = ['new', 'existing'] as const;
export type CriteriaMode = (typeof CRITERIA_MODES)[number];

export const SYSTEM_VARIABLES: string[] = Array.from(
  { length: 255 },
  (_, i) => `Custom ${i + 1}`
);

export interface CriterionCondition {
  id: string;
  source: ConditionSource;
  questionId: number | null;
  systemVariable: string | null;
  operator: string;
  value: string;
  valueEnd: string;
  connector: ConditionConnector;
}

export interface Criterion {
  id: string;
  name: string;
  mode: CriteriaMode;
  existingCriteriaId: string | null;
  existingConditionsSnapshot: string | null;
  requiresRename: boolean;
  conditions: CriterionCondition[];
}

export function isSystemVariableOperator(op: string): boolean {
  return (
    (SYSTEM_VARIABLE_TEXT_OPERATORS as readonly string[]).includes(op) ||
    (SYSTEM_VARIABLE_NUMERIC_OPERATORS as readonly string[]).includes(op)
  );
}

export function systemVariableOperatorNeedsValue(operator: string): boolean {
  return operator !== 'is blank' && operator !== 'is not blank';
}

export function isBetweenOperator(operator: string): boolean {
  return operator === 'is between';
}

export function isSystemVariableNumericOperator(operator: string): boolean {
  return (SYSTEM_VARIABLE_NUMERIC_OPERATORS as readonly string[]).includes(operator);
}

export function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const VALUE_SEPARATOR = ', ';

export function parseSelectedValues(raw: string): string[] {
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

export function toggleValueSelection(raw: string, option: string): string {
  const selected = parseSelectedValues(raw);
  const without = selected.filter((v) => v !== option);
  if (without.length === selected.length) {
    return [...selected, option].join(VALUE_SEPARATOR);
  }
  return without.join(VALUE_SEPARATOR);
}

export function newCondition(): CriterionCondition {
  return {
    id: uniqueId('cond'),
    source: 'Question',
    questionId: null,
    systemVariable: null,
    operator: 'is',
    value: '',
    valueEnd: '',
    connector: 'AND',
  };
}

export function resolveOperatorForSource(source: ConditionSource, current: string): string {
  if (source === 'System Variable') {
    return isSystemVariableOperator(current) ? current : DEFAULT_SYSTEM_VARIABLE_OPERATOR;
  }
  if (source === 'Question') {
    return (QUESTION_OPERATORS as readonly string[]).includes(current) ? current : 'is';
  }
  return current;
}

export function newCriterion(): Criterion {
  return {
    id: uniqueId('crit'),
    name: '',
    mode: 'new',
    existingCriteriaId: null,
    existingConditionsSnapshot: null,
    requiresRename: false,
    conditions: [newCondition()],
  };
}

export function serializeConditions(conditions: CriterionCondition[]): string {
  return JSON.stringify(
    conditions.map((cond) => ({
      source: cond.source,
      questionId: cond.questionId,
      systemVariable: cond.systemVariable,
      operator: cond.operator,
      value: cond.value,
      valueEnd: cond.valueEnd,
      connector: cond.connector,
    }))
  );
}

export function templateToCriterionConditions(
  template: ExistingCriteriaTemplate,
  questions: SurveyQuestion[]
): CriterionCondition[] {
  return template.conditions.map((cond) => {
    const question =
      cond.source === 'Question' && cond.questionCode
        ? questions.find((q) => q.code === cond.questionCode)
        : undefined;
    return {
      id: uniqueId('cond'),
      source: cond.source as ConditionSource,
      questionId: question?.id ?? null,
      systemVariable: cond.source === 'System Variable' ? cond.subject : null,
      operator: cond.operator,
      value: cond.value,
      valueEnd: cond.valueEnd ?? '',
      connector: cond.connector,
    };
  });
}

export function promoteExistingToNewIfModified(prev: Criterion, next: Criterion): Criterion {
  if (prev.mode !== 'existing' || prev.existingConditionsSnapshot === null) {
    return next;
  }
  if (serializeConditions(next.conditions) === prev.existingConditionsSnapshot) {
    return next;
  }
  return {
    ...next,
    mode: 'new',
    existingCriteriaId: null,
    existingConditionsSnapshot: null,
    name: '',
    requiresRename: true,
  };
}

export function isConditionComplete(cond: CriterionCondition): boolean {
  if (cond.source === 'Question') {
    return cond.questionId !== null && cond.value.trim() !== '';
  }
  if (cond.source === 'System Variable') {
    if (cond.systemVariable === null) return false;
    if (!systemVariableOperatorNeedsValue(cond.operator)) return true;
    if (isBetweenOperator(cond.operator)) {
      return cond.value.trim() !== '' && cond.valueEnd.trim() !== '';
    }
    return cond.value.trim() !== '';
  }
  return cond.value.trim() !== '';
}

export function hasCompleteConditions(criterion: Criterion): boolean {
  const complete = criterion.conditions.filter(isConditionComplete);
  return complete.length > 0;
}
