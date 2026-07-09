export type TextAiCriteriaType =
  | 'question'
  | 'system-variable'
  | 'geo-location'
  | 'data-quality'
  | 'data-set';

export type TextAiSegmentCondition = {
  id: string;
  criteriaType: TextAiCriteriaType;
  surveyQuestionId: number | null;
  attribute: string;
  operator: string;
  value: string;
};

export type TextAiSegmentCriteriaGroup = {
  id: string;
  conditions: TextAiSegmentCondition[];
};

export type TextAiSegmentFilterState = {
  responseStatuses: string[];
  dateRangeLabel: string | null;
  dateRangeStart: string;
  dateRangeEnd: string;
  criteriaGroups: TextAiSegmentCriteriaGroup[];
};

export const TEXT_AI_RESPONSE_STATUS_OPTIONS = [
  { value: 'all', label: 'All responses' },
  { value: 'completed', label: 'Completed' },
  { value: 'started', label: 'Started but not completed' },
  { value: 'terminates', label: 'Terminates' },
] as const;

export const TEXT_AI_DATE_RANGE_PRESETS = [
  { value: 'last-30', label: 'Last 30 days' },
  { value: 'last-90', label: 'Last 90 days' },
  { value: 'last-year', label: 'Last year' },
] as const;

export const TEXT_AI_CRITERIA_TYPE_OPTIONS: { value: TextAiCriteriaType; label: string }[] = [
  { value: 'question', label: 'Question' },
  { value: 'system-variable', label: 'System variable' },
  { value: 'geo-location', label: 'Geo location' },
  { value: 'data-quality', label: 'Data quality' },
  { value: 'data-set', label: 'Data set' },
];

export const TEXT_AI_SEGMENT_FILTER_QUESTIONS = [
  {
    id: 101,
    text: 'Please specify your gender',
  },
  {
    id: 102,
    text: 'Please specify your region',
  },
  {
    id: 103,
    text: 'On a scale of 0 to 10, how likely are you to recommend us to a friend or colleague?',
  },
] as const;

export const TEXT_AI_QUESTION_OPERATORS = ['Is', 'Is not'] as const;

export const TEXT_AI_QUESTION_VALUES_BY_QUESTION_ID: Record<number, string[]> = {
  101: ['Male', 'Female', 'Prefer not to say'],
  102: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa'],
  103: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
};

export const TEXT_AI_SYSTEM_VARIABLE_OPTIONS = [
  'Response ID',
  'Email address',
  'Language',
  'Custom 1',
  'Custom 2',
];

export const TEXT_AI_GEO_LOCATION_OPTIONS = ['Country', 'State / Province', 'City', 'Postal code'];

export const TEXT_AI_DATA_QUALITY_OPTIONS = [
  'Speeder',
  'Straight-liner',
  'Duplicate IP',
  'Gibberish text',
];

export const TEXT_AI_DATA_SET_OPTIONS = [
  'Primary data set',
  'Follow-up wave',
  'Merged export',
];

const TEXT_AI_SEGMENT_BASE_RESPONSE_COUNT = 12483;

const TEXT_AI_STATUS_RESPONSE_COUNTS: Record<string, number> = {
  completed: 9348,
  started: 2140,
  terminates: 995,
};

const TEXT_AI_DATE_RANGE_FACTORS: Record<string, number> = {
  'Last 30 days': 0.42,
  'Last 90 days': 0.71,
  'Last year': 0.94,
};

const TEXT_AI_CRITERIA_TYPE_FACTORS: Record<TextAiCriteriaType, number> = {
  question: 0.58,
  'system-variable': 0.74,
  'geo-location': 0.49,
  'data-quality': 0.82,
  'data-set': 0.67,
};

function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getCriteriaTypeLabel(type: TextAiCriteriaType): string {
  return TEXT_AI_CRITERIA_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function getResponseStatusLabel(selectedValues: string[]): string {
  if (selectedValues.length === 0) {
    return 'Select response status';
  }

  if (selectedValues.length === TEXT_AI_RESPONSE_STATUS_OPTIONS.length) {
    return 'All responses';
  }

  if (selectedValues.length === 1) {
    const match = TEXT_AI_RESPONSE_STATUS_OPTIONS.find((option) => option.value === selectedValues[0]);
    return match?.label ?? selectedValues[0];
  }

  return `${selectedValues.length} selected`;
}

export function newSegmentCondition(criteriaType: TextAiCriteriaType = 'question'): TextAiSegmentCondition {
  return {
    id: uniqueId('seg-cond'),
    criteriaType,
    surveyQuestionId: null,
    attribute: '',
    operator: 'Is',
    value: '',
  };
}

export function newSegmentCriteriaGroup(
  criteriaType: TextAiCriteriaType = 'question'
): TextAiSegmentCriteriaGroup {
  return {
    id: uniqueId('seg-group'),
    conditions: [newSegmentCondition(criteriaType)],
  };
}

export function createDefaultSegmentFilterState(): TextAiSegmentFilterState {
  return {
    responseStatuses: TEXT_AI_RESPONSE_STATUS_OPTIONS.map((option) => option.value),
    dateRangeLabel: null,
    dateRangeStart: '',
    dateRangeEnd: '',
    criteriaGroups: [],
  };
}

function getConcreteResponseStatuses(selectedStatuses: string[]): string[] {
  if (
    selectedStatuses.includes('all') ||
    selectedStatuses.length === TEXT_AI_RESPONSE_STATUS_OPTIONS.length
  ) {
    return TEXT_AI_RESPONSE_STATUS_OPTIONS.filter((option) => option.value !== 'all').map(
      (option) => option.value
    );
  }

  return selectedStatuses.filter((status) => status !== 'all');
}

function getConditionFactor(condition: TextAiSegmentCondition): number {
  const hasSelectedField =
    condition.criteriaType === 'question'
      ? condition.surveyQuestionId !== null
      : condition.attribute.trim().length > 0;
  const hasSelectedValue = condition.value.trim().length > 0;

  if (!hasSelectedField && !hasSelectedValue) {
    return 1;
  }

  const baseFactor = TEXT_AI_CRITERIA_TYPE_FACTORS[condition.criteriaType];
  const valueFactor = hasSelectedValue ? 0.72 : 0.9;
  const operatorFactor = condition.operator === 'Is not' ? 1.08 : 1;

  return Math.min(1, baseFactor * valueFactor * operatorFactor);
}

function getCriteriaFactor(criteriaGroups: TextAiSegmentCriteriaGroup[]): number {
  if (criteriaGroups.length === 0) {
    return 1;
  }

  const groupFactors = criteriaGroups.map((group) =>
    group.conditions.reduce((factor, condition) => factor * getConditionFactor(condition), 1)
  );
  const combinedOrCoverage = groupFactors.reduce(
    (coverage, factor) => coverage + factor * (1 - coverage),
    0
  );

  return Math.min(1, Math.max(0.04, combinedOrCoverage));
}

export function calculateTextAiSegmentResponseCount(
  filters: TextAiSegmentFilterState
): number {
  const selectedStatuses = getConcreteResponseStatuses(filters.responseStatuses);
  if (selectedStatuses.length === 0) {
    return 0;
  }

  const statusCount = selectedStatuses.reduce(
    (count, status) => count + (TEXT_AI_STATUS_RESPONSE_COUNTS[status] ?? 0),
    0
  );
  const statusBase = statusCount || TEXT_AI_SEGMENT_BASE_RESPONSE_COUNT;
  const dateFactor =
    filters.dateRangeLabel && TEXT_AI_DATE_RANGE_FACTORS[filters.dateRangeLabel]
      ? TEXT_AI_DATE_RANGE_FACTORS[filters.dateRangeLabel]
      : filters.dateRangeStart || filters.dateRangeEnd
        ? 0.56
        : 1;
  const criteriaFactor = getCriteriaFactor(filters.criteriaGroups);

  return Math.max(0, Math.round(statusBase * dateFactor * criteriaFactor));
}
