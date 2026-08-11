export type BaseCriteriaType =
  | 'question'
  | 'system-variable'
  | 'geo-location'
  | 'data-quality'
  | 'data-set';

export interface BaseFilterCondition {
  id: string;
  criteriaType: BaseCriteriaType;
  questionId: number | null;
  attribute: string;
  operator: string;
  value: string;
}

export interface BaseFilterGroup {
  id: string;
  conditions: BaseFilterCondition[];
}

export interface BaseFilterState {
  responseStatuses: string[];
  dateRangeLabel: string | null;
  dateRangeStart: string;
  dateRangeEnd: string;
  criteriaGroups: BaseFilterGroup[];
}

export const BASE_RESPONSE_STATUS_OPTIONS = [
  { value: 'all', label: 'All responses' },
  { value: 'completed', label: 'Completed' },
  { value: 'started', label: 'Started but not completed' },
  { value: 'terminates', label: 'Terminates' },
] as const;

export const BASE_DATE_RANGE_PRESETS = [
  { value: 'last-30', label: 'Last 30 days' },
  { value: 'last-90', label: 'Last 90 days' },
  { value: 'last-year', label: 'Last year' },
] as const;

export const BASE_CRITERIA_TYPE_OPTIONS: { value: BaseCriteriaType; label: string }[] = [
  { value: 'question', label: 'Question' },
  { value: 'system-variable', label: 'System variable' },
  { value: 'geo-location', label: 'Geo location' },
  { value: 'data-quality', label: 'Data quality' },
  { value: 'data-set', label: 'Data set' },
];

export const BASE_FILTER_QUESTIONS = [
  { id: 201, code: 'S2', text: 'Which age group do you belong to?' },
  { id: 202, code: 'S1', text: 'Please specify your gender' },
  { id: 203, code: 'S4', text: 'What is your annual household income?' },
  { id: 204, code: 'S3', text: 'Which region do you live in?' },
  { id: 205, code: 'Q2', text: 'Which laptop brand do you currently own?' },
  { id: 206, code: 'Q4', text: 'How soon do you plan to buy a new laptop?' },
] as const;

export const BASE_QUESTION_OPERATORS = ['Is', 'Is not'] as const;

export const BASE_QUESTION_VALUES_BY_QUESTION_ID: Record<number, string[]> = {
  201: ['18–24', '25–34', '35–44', '45–54', '55+'],
  202: ['Male', 'Female', 'Prefer not to say'],
  203: ['Under $50k', '$50k–$99k', '$100k–$149k', '$150k+'],
  204: ['Northeast', 'Midwest', 'South', 'West'],
  205: ['Apple', 'Dell', 'Lenovo', 'Samsung', 'Sony', 'LG'],
  206: ['Within 3 months', '3–6 months', '6–12 months', 'No plans'],
};

export const BASE_SYSTEM_VARIABLE_OPTIONS = [
  'Response ID',
  'Email address',
  'Language',
  'Panel source',
  'Custom 1',
];

export const BASE_GEO_LOCATION_OPTIONS = [
  'Country',
  'State / Province',
  'City',
  'Postal code',
];

export const BASE_DATA_QUALITY_OPTIONS = [
  'Speeder',
  'Straight-liner',
  'Duplicate IP',
  'Gibberish text',
];

export const BASE_DATA_SET_OPTIONS = ['Primary data set', 'Follow-up wave', 'Merged export'];

const STATUS_WEIGHTS: Record<string, number> = {
  completed: 1,
  started: 0.23,
  terminates: 0.1,
};

const DATE_RANGE_FACTORS: Record<string, number> = {
  'Last 30 days': 0.42,
  'Last 90 days': 0.71,
  'Last year': 0.94,
};

const CRITERIA_TYPE_FACTORS: Record<BaseCriteriaType, number> = {
  question: 0.58,
  'system-variable': 0.74,
  'geo-location': 0.49,
  'data-quality': 0.82,
  'data-set': 0.67,
};

function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getBaseCriteriaTypeLabel(type: BaseCriteriaType): string {
  return BASE_CRITERIA_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function getBaseQuestion(questionId: number | null) {
  if (questionId === null) return null;
  return BASE_FILTER_QUESTIONS.find((question) => question.id === questionId) ?? null;
}

export function getBaseResponseStatusLabel(selectedValues: string[]): string {
  if (selectedValues.length === 0) return 'Select response status';
  if (selectedValues.length === BASE_RESPONSE_STATUS_OPTIONS.length) return 'All responses';
  if (selectedValues.length === 1) {
    const match = BASE_RESPONSE_STATUS_OPTIONS.find(
      (option) => option.value === selectedValues[0]
    );
    return match?.label ?? selectedValues[0];
  }
  return `${selectedValues.length} selected`;
}

export function newBaseCondition(
  criteriaType: BaseCriteriaType = 'question'
): BaseFilterCondition {
  return {
    id: uniqueId('base-cond'),
    criteriaType,
    questionId: null,
    attribute: '',
    operator: 'Is',
    value: '',
  };
}

export function newBaseGroup(criteriaType: BaseCriteriaType = 'question'): BaseFilterGroup {
  return {
    id: uniqueId('base-group'),
    conditions: [newBaseCondition(criteriaType)],
  };
}

export function createDefaultBaseFilterState(): BaseFilterState {
  return {
    responseStatuses: ['completed'],
    dateRangeLabel: null,
    dateRangeStart: '',
    dateRangeEnd: '',
    criteriaGroups: [],
  };
}

function getConcreteStatuses(selectedStatuses: string[]): string[] {
  if (
    selectedStatuses.includes('all') ||
    selectedStatuses.length === BASE_RESPONSE_STATUS_OPTIONS.length
  ) {
    return BASE_RESPONSE_STATUS_OPTIONS.filter((option) => option.value !== 'all').map(
      (option) => option.value
    );
  }
  return selectedStatuses.filter((status) => status !== 'all');
}

function getConditionFactor(condition: BaseFilterCondition): number {
  if (condition.criteriaType === 'question') {
    if (condition.questionId === null) return 1;
    const values = BASE_QUESTION_VALUES_BY_QUESTION_ID[condition.questionId] ?? [];
    if (!condition.value || values.length === 0) return 0.9;
    const share = 1 / values.length;
    const factor = condition.operator === 'Is not' ? 1 - share : share;
    return Math.min(1, Math.max(0.05, factor));
  }

  const hasField = condition.attribute.trim().length > 0;
  const hasValue = condition.value.trim().length > 0;
  if (!hasField && !hasValue) return 1;

  const baseFactor = CRITERIA_TYPE_FACTORS[condition.criteriaType];
  const valueFactor = hasValue ? 0.72 : 0.9;
  const operatorFactor = condition.operator === 'Is not' ? 1.08 : 1;
  return Math.min(1, baseFactor * valueFactor * operatorFactor);
}

function getCriteriaFactor(groups: BaseFilterGroup[]): number {
  if (groups.length === 0) return 1;

  const groupFactors = groups.map((group) =>
    group.conditions.reduce((factor, condition) => factor * getConditionFactor(condition), 1)
  );
  const combinedOrCoverage = groupFactors.reduce(
    (coverage, factor) => coverage + factor * (1 - coverage),
    0
  );
  return Math.min(1, Math.max(0.03, combinedOrCoverage));
}

/** Mock respondent count for a base built from BI-style filters. */
export function calculateBaseRespondentCount(
  filters: BaseFilterState,
  totalRespondents: number
): number {
  const statuses = getConcreteStatuses(filters.responseStatuses);
  if (statuses.length === 0) return 0;

  const statusFactor = Math.min(
    1,
    statuses.reduce((sum, status) => sum + (STATUS_WEIGHTS[status] ?? 0), 0)
  );
  const dateFactor =
    filters.dateRangeLabel && DATE_RANGE_FACTORS[filters.dateRangeLabel]
      ? DATE_RANGE_FACTORS[filters.dateRangeLabel]
      : filters.dateRangeStart || filters.dateRangeEnd
        ? 0.56
        : 1;
  const criteriaFactor = getCriteriaFactor(filters.criteriaGroups);

  const count = Math.round(totalRespondents * statusFactor * dateFactor * criteriaFactor);
  return Math.max(0, Math.min(totalRespondents, count));
}

function describeCondition(condition: BaseFilterCondition): string | null {
  if (condition.criteriaType === 'question') {
    const question = getBaseQuestion(condition.questionId);
    if (!question || !condition.value) return null;
    const prefix = condition.operator === 'Is not' ? 'not ' : '';
    return `${question.code}: ${prefix}${condition.value}`;
  }

  if (!condition.attribute) return null;
  const suffix = condition.value ? `: ${condition.value}` : '';
  return `${condition.attribute}${suffix}`;
}

/** Short human-readable summary shown on the base card. */
export function summarizeBaseFilters(filters: BaseFilterState): string {
  const parts: string[] = [];

  const statuses = getConcreteStatuses(filters.responseStatuses);
  if (statuses.length === 1 && statuses[0] === 'completed') {
    parts.push('Completes');
  } else if (statuses.length > 0 && statuses.length < 3) {
    parts.push(
      statuses
        .map(
          (status) =>
            BASE_RESPONSE_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
            status
        )
        .join(' + ')
    );
  }

  if (filters.dateRangeLabel) parts.push(filters.dateRangeLabel);

  for (const group of filters.criteriaGroups) {
    for (const condition of group.conditions) {
      const described = describeCondition(condition);
      if (described) parts.push(described);
    }
  }

  if (parts.length === 0) return 'Custom base';
  return parts.slice(0, 3).join(' · ');
}

/** Selected question values, keyed by question id — used to bias mock models. */
export function getSelectedQuestionValues(
  filters: BaseFilterState
): Record<number, string[]> {
  const selected: Record<number, string[]> = {};
  for (const group of filters.criteriaGroups) {
    for (const condition of group.conditions) {
      if (condition.criteriaType !== 'question') continue;
      if (condition.questionId === null || !condition.value) continue;
      if (condition.operator === 'Is not') continue;
      const current = selected[condition.questionId] ?? [];
      if (!current.includes(condition.value)) current.push(condition.value);
      selected[condition.questionId] = current;
    }
  }
  return selected;
}
