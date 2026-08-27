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
  /** Question selections. Older saved prototypes contain only `value`. */
  values?: string[];
};

export type TextAiSegmentCriteriaGroup = {
  id: string;
  conditions: TextAiSegmentCondition[];
};

export type TextAiResponseExclusions = {
  minimumCharactersEnabled: boolean;
  minimumCharacters: number | null;
  exactResponsesEnabled: boolean;
  exactResponses: string[];
};

export type TextAiSegmentFilterState = {
  responseStatuses: string[];
  dateRangeLabel: string | null;
  dateRangeStart: string;
  dateRangeEnd: string;
  criteriaGroups: TextAiSegmentCriteriaGroup[];
  /** Optional for dashboards saved before response exclusions were introduced. */
  responseExclusions?: TextAiResponseExclusions;
};

export type TextAiFilterResponse = {
  id: string;
  text: string;
  status: 'completed' | 'started' | 'terminates';
  submittedAt: string;
  questionValues: Record<number, string>;
  attributes: Record<string, string>;
};

export function createDefaultResponseExclusions(): TextAiResponseExclusions {
  return { minimumCharactersEnabled: false, minimumCharacters: 3, exactResponsesEnabled: false, exactResponses: [] };
}

export function getTextAiResponseExclusions(filters: TextAiSegmentFilterState): TextAiResponseExclusions {
  return filters.responseExclusions ?? createDefaultResponseExclusions();
}

const normalizeResponse = (value: string) => value.normalize('NFC').trim().toLowerCase();

export function normalizeExcludedResponses(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.map((value) => value.trim()).filter((value) => {
    const key = normalizeResponse(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Parse the compact exclusion field. Commas and line breaks separate responses;
 * a backslash keeps the next character inside the current response.
 */
export function parseExcludedResponsesInput(value: string): string[] {
  const responses: string[] = [];
  let response = '';
  let escaped = false;

  const pushResponse = () => {
    responses.push(response.trim());
    response = '';
  };

  for (const character of value) {
    if (escaped) {
      response += character;
      escaped = false;
    } else if (character === '\\') {
      escaped = true;
    } else if (character === ',' || character === '\n') {
      pushResponse();
    } else if (character !== '\r') {
      response += character;
    }
  }

  if (escaped) response += '\\';
  pushResponse();
  return responses;
}

export function formatExcludedResponsesInput(values: readonly string[]): string {
  return values
    .map((value) => value.replaceAll('\\', '\\\\').replaceAll(',', '\\,'))
    .join(', ');
}

export function getTextAiExclusionValidationError(filters: TextAiSegmentFilterState): string | null {
  const exclusions = getTextAiResponseExclusions(filters);
  if (exclusions.minimumCharactersEnabled &&
      (exclusions.minimumCharacters === null || !Number.isSafeInteger(exclusions.minimumCharacters) || exclusions.minimumCharacters < 1)) {
    return 'Enter a whole number of at least 1 character.';
  }
  if (exclusions.exactResponsesEnabled && !normalizeExcludedResponses(exclusions.exactResponses).length) {
    return 'Enter at least one response to exclude, or turn this option off.';
  }
  return null;
}

export function normalizeTextAiSegmentFilters(filters: TextAiSegmentFilterState): TextAiSegmentFilterState {
  const exclusions = getTextAiResponseExclusions(filters);
  return { ...filters, responseExclusions: { ...exclusions, exactResponses: normalizeExcludedResponses(exclusions.exactResponses) } };
}

const characterSegmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });

/** Both rules exclude from analysis; neither changes the underlying response. */
export function createTextAiResponseExclusionMatcher(exclusions: TextAiResponseExclusions): (text: string) => boolean {
  const exact = new Set(exclusions.exactResponses.map(normalizeResponse).filter(Boolean));
  const cache = new Map<string, boolean>();
  return (text) => {
    const cached = cache.get(text);
    if (cached !== undefined) return cached;
    const trimmed = text.trim();
    const tooShort = exclusions.minimumCharactersEnabled && exclusions.minimumCharacters !== null &&
      Array.from(characterSegmenter.segment(trimmed)).length < exclusions.minimumCharacters;
    const exactMatch = exclusions.exactResponsesEnabled && exact.has(normalizeResponse(trimmed));
    const excluded = tooShort || exactMatch;
    cache.set(text, excluded);
    return excluded;
  };
}

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
  { value: 'system-variable', label: 'System Variable' },
  { value: 'geo-location', label: 'Geo Location' },
  { value: 'data-quality', label: 'Data Quality' },
  { value: 'data-set', label: 'Dataset' },
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

  if (selectedValues.includes('all')) {
    return 'All responses';
  }

  if (selectedValues.length === 1) {
    const match = TEXT_AI_RESPONSE_STATUS_OPTIONS.find((option) => option.value === selectedValues[0]);
    return match?.label ?? selectedValues[0];
  }

  return `${selectedValues.length} selected`;
}

export function toggleTextAiResponseStatus(selectedValues: string[], value: string): string[] {
  if (value === 'all') return ['all'];
  // Treat the legacy all-four-options state as the exclusive "All responses" choice.
  const concrete = selectedValues.includes('all') ? [] : selectedValues;
  return concrete.includes(value)
    ? concrete.filter((status) => status !== value)
    : [...concrete, value];
}

export function getSegmentConditionValues(condition: TextAiSegmentCondition): string[] {
  return condition.values ?? (condition.value ? [condition.value] : []);
}

/** Resolve label-only presets saved by earlier versions of the prototype. */
export function getTextAiSegmentDateRange(
  filters: TextAiSegmentFilterState,
  today: Date = new Date()
): { startDate: string; endDate: string } {
  if (filters.dateRangeStart || filters.dateRangeEnd) {
    return { startDate: filters.dateRangeStart, endDate: filters.dateRangeEnd };
  }
  if (!TEXT_AI_DATE_RANGE_PRESETS.some((preset) => preset.label === filters.dateRangeLabel)) {
    return { startDate: '', endDate: '' };
  }
  let end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let start = new Date(end);
  if (filters.dateRangeLabel === 'Last year') {
    start = new Date(today.getFullYear() - 1, 0, 1);
    end = new Date(today.getFullYear() - 1, 11, 31);
  } else {
    start.setDate(start.getDate() - (filters.dateRangeLabel === 'Last 30 days' ? 29 : 89));
  }
  const format = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { startDate: format(start), endDate: format(end) };
}

export function newSegmentCondition(criteriaType: TextAiCriteriaType = 'question'): TextAiSegmentCondition {
  return {
    id: uniqueId('seg-cond'),
    criteriaType,
    surveyQuestionId: null,
    attribute: '',
    operator: 'Is',
    value: '',
    values: [],
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
    responseStatuses: ['all'],
    dateRangeLabel: null,
    dateRangeStart: '',
    dateRangeEnd: '',
    criteriaGroups: [],
    responseExclusions: createDefaultResponseExclusions(),
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

function isConditionComplete(condition: TextAiSegmentCondition): boolean {
  return condition.criteriaType === 'question'
    ? condition.surveyQuestionId !== null && getSegmentConditionValues(condition).length > 0
    : !!condition.attribute.trim() && !!condition.value.trim();
}

function matchesCondition(response: TextAiFilterResponse, condition: TextAiSegmentCondition): boolean {
  if (!isConditionComplete(condition)) return true;
  const actual = condition.criteriaType === 'question'
    ? response.questionValues[condition.surveyQuestionId!]
    : response.attributes[`${condition.criteriaType}:${condition.attribute}`];
  const expected = condition.criteriaType === 'question' ? getSegmentConditionValues(condition) : [condition.value];
  const matches = actual !== undefined && expected.some((value) => normalizeResponse(value) === normalizeResponse(actual));
  return condition.operator === 'Is not' ? !matches : matches;
}

// Synthetic response records make the prototype's counts and exclusions reproducible.
// They are not imported from a production account and do not represent live analysis.
const SAMPLE_RESPONSE_TEXTS = [
  'The team was helpful and explained the next steps clearly.',
  'I would like faster follow-up after contacting support.',
  'NA', 'null', 'N/A', '  NULL  ', 'ok', '.', 'No comment',
  'The value was null in the report, but support helped me fix it.',
  'Overall, a good experience. The onboarding could be simpler.',
  'Friendly staff and a quick response to my question.',
  'More communication about planned changes would help.',
  'Everything worked as expected. Thank you!',
  'The service improved compared with last time.',
  'I appreciate having a clear point of contact.',
];

export const MOCK_TEXT_AI_FILTER_RESPONSES: TextAiFilterResponse[] = Array.from(
  { length: TEXT_AI_SEGMENT_BASE_RESPONSE_COUNT }, (_, index) => {
    const date = new Date(Date.UTC(2026, 7, 26 - (index % 365)));
    const regionIndex = Math.floor(index / 3) % TEXT_AI_QUESTION_VALUES_BY_QUESTION_ID[102].length;
    return {
      id: `text-response-${index + 1}`,
      text: SAMPLE_RESPONSE_TEXTS[index % SAMPLE_RESPONSE_TEXTS.length],
      status: index < TEXT_AI_STATUS_RESPONSE_COUNTS.completed ? 'completed'
        : index < TEXT_AI_STATUS_RESPONSE_COUNTS.completed + TEXT_AI_STATUS_RESPONSE_COUNTS.started ? 'started' : 'terminates',
      submittedAt: date.toISOString().slice(0, 10),
      questionValues: {
        101: TEXT_AI_QUESTION_VALUES_BY_QUESTION_ID[101][index % 3],
        102: TEXT_AI_QUESTION_VALUES_BY_QUESTION_ID[102][regionIndex],
        103: String(index % 11),
      },
      attributes: {
        'system-variable:Response ID': String(index + 1),
        'system-variable:Email address': `respondent${index + 1}@example.test`,
        'system-variable:Language': 'English',
        'system-variable:Custom 1': index % 2 ? 'Existing customer' : 'New customer',
        'system-variable:Custom 2': 'Web',
        'geo-location:Country': ['United States', 'United Kingdom', 'India', 'Brazil', 'South Africa'][regionIndex],
        'geo-location:State / Province': ['California', 'England', 'Maharashtra', 'São Paulo', 'Gauteng'][regionIndex],
        'geo-location:City': ['San Francisco', 'London', 'Mumbai', 'São Paulo', 'Johannesburg'][regionIndex],
        'geo-location:Postal code': ['94105', 'SW1A', '400001', '01000', '2000'][regionIndex],
        'data-quality:Speeder': index % 19 === 0 ? 'Yes' : 'No',
        'data-quality:Straight-liner': index % 23 === 0 ? 'Yes' : 'No',
        'data-quality:Duplicate IP': index % 29 === 0 ? 'Yes' : 'No',
        'data-quality:Gibberish text': index % 16 === 3 ? 'Yes' : 'No',
        'data-set:Primary data set': 'Yes',
        'data-set:Follow-up wave': index % 2 ? 'Yes' : 'No',
        'data-set:Merged export': 'Yes',
      },
    };
  }
);

export function getTextAiSegmentResponseSummary(
  filters: TextAiSegmentFilterState,
  responses: readonly TextAiFilterResponse[] = MOCK_TEXT_AI_FILTER_RESPONSES
): { segmentCount: number; excludedCount: number; includedResponses: TextAiFilterResponse[] } {
  const statuses = getConcreteResponseStatuses(filters.responseStatuses);
  const { startDate, endDate } = getTextAiSegmentDateRange(filters);
  const groups = filters.criteriaGroups.filter((group) => group.conditions.some(isConditionComplete));
  const segmentResponses = responses.filter((response) => statuses.includes(response.status) &&
    (!startDate || response.submittedAt >= startDate) && (!endDate || response.submittedAt <= endDate) &&
    (!groups.length || groups.some((group) => group.conditions.every((condition) => matchesCondition(response, condition)))));
  const shouldExclude = createTextAiResponseExclusionMatcher(getTextAiResponseExclusions(filters));
  const excludedCount = segmentResponses.filter((response) => shouldExclude(response.text)).length;
  const includedResponses = getTextAiExclusionValidationError(filters)
    ? []
    : segmentResponses.filter((response) => !shouldExclude(response.text));
  return { segmentCount: segmentResponses.length, excludedCount, includedResponses };
}

export function calculateTextAiSegmentResponseCount(
  filters: TextAiSegmentFilterState,
  responses: readonly TextAiFilterResponse[] = MOCK_TEXT_AI_FILTER_RESPONSES
): number {
  return getTextAiSegmentResponseSummary(filters, responses).includedResponses.length;
}
