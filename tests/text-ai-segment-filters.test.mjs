import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateTextAiSegmentResponseCount,
  createDefaultSegmentFilterState,
  createDefaultResponseExclusions,
  createTextAiResponseExclusionMatcher,
  getTextAiExclusionValidationError,
  getTextAiResponseExclusions,
  getTextAiSegmentResponseSummary,
  MOCK_TEXT_AI_FILTER_RESPONSES,
  normalizeExcludedResponses,
  parseExcludedResponsesInput,
  formatExcludedResponsesInput,
  normalizeTextAiSegmentFilters,
  getResponseStatusLabel,
  getSegmentConditionValues,
  getTextAiSegmentDateRange,
  newSegmentCondition,
  toggleTextAiResponseStatus,
} from '../src/data/mock-text-ai-segment-filters.ts';

const genderCondition = (values, operator = 'Is') => ({
  ...newSegmentCondition(), surveyQuestionId: 101, values, value: values[0] ?? '', operator,
});
const withConditions = (conditions) => ({
  ...createDefaultSegmentFilterState(), criteriaGroups: [{ id: 'block-1', conditions }],
});

test('All responses is exclusive, including legacy all-four selections', () => {
  const defaults = createDefaultSegmentFilterState();
  assert.deepEqual(defaults.responseStatuses, ['all']);
  assert.equal(calculateTextAiSegmentResponseCount(defaults), 12483);
  for (const statuses of [['all'], ['all', 'completed', 'started', 'terminates']]) {
    assert.equal(getResponseStatusLabel(statuses), 'All responses');
    assert.deepEqual(toggleTextAiResponseStatus(statuses, 'completed'), ['completed']);
  }
  assert.deepEqual(toggleTextAiResponseStatus(['completed'], 'started'), ['completed', 'started']);
  assert.deepEqual(toggleTextAiResponseStatus(['completed', 'started'], 'all'), ['all']);
  const none = toggleTextAiResponseStatus(['completed'], 'completed');
  assert.equal(calculateTextAiSegmentResponseCount({ ...defaults, responseStatuses: none }), 0);
});

test('legacy single values load, while an explicitly cleared multiselect stays empty', () => {
  const legacy = { ...newSegmentCondition(), value: 'Female' };
  delete legacy.values;
  assert.deepEqual(getSegmentConditionValues(legacy), ['Female']);
  assert.deepEqual(getSegmentConditionValues({ ...legacy, values: [] }), []);
  assert.deepEqual(getSegmentConditionValues({ ...legacy, values: ['Female', 'Male'] }), ['Female', 'Male']);
});

test('question values use OR within one condition; Is not excludes every selected value', () => {
  const one = calculateTextAiSegmentResponseCount(withConditions([genderCondition(['Female'])]));
  const two = calculateTextAiSegmentResponseCount(withConditions([genderCondition(['Female', 'Male'])]));
  assert.ok(two > one);
  assert.equal(calculateTextAiSegmentResponseCount(withConditions([genderCondition(['Female', 'Male'], 'Is not')])), one);
  const all = ['Female', 'Male', 'Prefer not to say'];
  assert.equal(calculateTextAiSegmentResponseCount(withConditions([genderCondition(all)])), 12483);
  assert.equal(calculateTextAiSegmentResponseCount(withConditions([genderCondition(all, 'Is not')])), 0);
});

test('incomplete conditions do not reduce the mock response count', () => {
  assert.equal(calculateTextAiSegmentResponseCount(withConditions([newSegmentCondition()])), 12483);
  assert.equal(calculateTextAiSegmentResponseCount(withConditions([genderCondition([])])), 12483);
  const filters = withConditions([genderCondition(['Female'])]);
  assert.equal(calculateTextAiSegmentResponseCount({ ...filters, criteriaGroups: [...filters.criteriaGroups, { id: 'blank', conditions: [newSegmentCondition()] }] }), calculateTextAiSegmentResponseCount(filters));
});

test('adding an AND narrows coverage, while an OR broadens coverage', () => {
  const condition = genderCondition(['Female']);
  const single = withConditions([condition]);
  const region = { ...newSegmentCondition(), surveyQuestionId: 102, values: ['Europe'] };
  assert.ok(calculateTextAiSegmentResponseCount(withConditions([condition, region])) < calculateTextAiSegmentResponseCount(single));
  assert.ok(calculateTextAiSegmentResponseCount({ ...single, criteriaGroups: [...single.criteriaGroups, { id: 'block-2', conditions: [region] }] }) > calculateTextAiSegmentResponseCount(single));
});

test('legacy date presets become real date ranges without changing explicit dates', () => {
  const defaults = createDefaultSegmentFilterState();
  const today = new Date(2026, 7, 26);
  assert.deepEqual(getTextAiSegmentDateRange(defaults, today), { startDate: '', endDate: '' });
  assert.deepEqual(getTextAiSegmentDateRange({ ...defaults, dateRangeLabel: 'Last 30 days' }, today), { startDate: '2026-07-28', endDate: '2026-08-26' });
  assert.deepEqual(getTextAiSegmentDateRange({ ...defaults, dateRangeLabel: 'Last 90 days' }, today), { startDate: '2026-05-29', endDate: '2026-08-26' });
  assert.deepEqual(getTextAiSegmentDateRange({ ...defaults, dateRangeLabel: 'Last year' }, today), { startDate: '2025-01-01', endDate: '2025-12-31' });
  assert.deepEqual(getTextAiSegmentDateRange({ ...defaults, dateRangeStart: '2026-08-01', dateRangeEnd: '2026-08-10' }, today), { startDate: '2026-08-01', endDate: '2026-08-10' });
});

const excluding = (partial) => ({
  ...createDefaultSegmentFilterState(),
  responseExclusions: { ...createDefaultResponseExclusions(), ...partial },
});

test('minimum length trims surrounding whitespace and keeps the exact boundary', () => {
  const matches = createTextAiResponseExclusionMatcher({ ...createDefaultResponseExclusions(), minimumCharactersEnabled: true, minimumCharacters: 3 });
  assert.equal(matches(' NA '), true);
  assert.equal(matches('ok'), true);
  assert.equal(matches('   '), true);
  assert.equal(matches('N/A'), false);
  assert.equal(matches('  yes  '), false);
  assert.equal(matches('the value was null'), false);
});

test('character length counts visible Unicode characters, including combined emoji', () => {
  const matches = createTextAiResponseExclusionMatcher({ ...createDefaultResponseExclusions(), minimumCharactersEnabled: true, minimumCharacters: 2 });
  assert.equal(matches('👍'), true);
  assert.equal(matches('e\u0301'), true);
  assert.equal(matches('👨‍👩‍👧‍👦'), true);
  assert.equal(matches('你好'), false);
});

test('specific response exclusions match the full response without case or surrounding spaces', () => {
  const matches = createTextAiResponseExclusionMatcher({ ...createDefaultResponseExclusions(), exactResponsesEnabled: true, exactResponses: ['null', 'No comment', 'a.b', 'a,b'] });
  for (const value of ['null', ' NULL ', 'no COMMENT', 'a.b', 'a,b']) assert.equal(matches(value), true, value);
  for (const value of ['the value was null', 'null value', 'no  comment', 'axb', 'a', 'b']) assert.equal(matches(value), false, value);
});

test('disabled rules have no effect and legacy dashboards default to both off', () => {
  const defaults = createDefaultSegmentFilterState();
  delete defaults.responseExclusions;
  assert.deepEqual(getTextAiResponseExclusions(defaults), createDefaultResponseExclusions());
  const matches = createTextAiResponseExclusionMatcher({ ...createDefaultResponseExclusions(), minimumCharacters: 9999, exactResponses: ['null'] });
  assert.equal(matches('null'), false);
  assert.equal(matches('NA'), false);
  assert.equal(calculateTextAiSegmentResponseCount(defaults), 12483);
});

test('normalization removes blank entries and duplicates but preserves complete strings', () => {
  assert.deepEqual(normalizeExcludedResponses([' null ', 'NULL', '', '   ', 'no comment', 'a,b', 'No Comment']), ['null', 'no comment', 'a,b']);
  const filters = excluding({ exactResponsesEnabled: true, exactResponses: [' null ', 'NULL'] });
  const persisted = JSON.parse(JSON.stringify(normalizeTextAiSegmentFilters(filters)));
  assert.deepEqual(persisted.responseExclusions.exactResponses, ['null']);
  assert.deepEqual(filters.responseExclusions.exactResponses, [' null ', 'NULL']);
});

test('compact exclusion input supports commas, line breaks, and escaped separators', () => {
  assert.deepEqual(
    parseExcludedResponsesInput('NA, null\nNo comment, Not sure\\, maybe, path\\\\value'),
    ['NA', 'null', 'No comment', 'Not sure, maybe', 'path\\value']
  );
  const values = ['NA', 'Not sure, maybe', 'path\\value'];
  assert.equal(formatExcludedResponsesInput(values), 'NA, Not sure\\, maybe, path\\\\value');
  assert.deepEqual(parseExcludedResponsesInput(formatExcludedResponsesInput(values)), values);
});

test('enabled rules reject invalid minimum lengths and empty exact-response lists', () => {
  for (const minimumCharacters of [null, 0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.ok(getTextAiExclusionValidationError(excluding({ minimumCharactersEnabled: true, minimumCharacters })));
  }
  assert.equal(getTextAiExclusionValidationError(excluding({ minimumCharactersEnabled: true, minimumCharacters: 1 })), null);
  assert.ok(getTextAiExclusionValidationError(excluding({ exactResponsesEnabled: true, exactResponses: [' ', ''] })));
  assert.equal(getTextAiExclusionValidationError(excluding({ minimumCharacters: null, exactResponses: [] })), null);
});

test('both rules exclude their union, without counting overlap twice', () => {
  const responses = ['NA', 'NULL', ' no comment ', 'yes', 'The value was null', 'N/A'].map((text, index) => ({
    ...MOCK_TEXT_AI_FILTER_RESPONSES[0], id: String(index), text,
  }));
  const filters = excluding({ minimumCharactersEnabled: true, minimumCharacters: 3, exactResponsesEnabled: true, exactResponses: ['NA', 'null', 'no comment'] });
  const summary = getTextAiSegmentResponseSummary(filters, responses);
  assert.equal(summary.segmentCount, 6);
  assert.equal(summary.excludedCount, 3);
  assert.deepEqual(summary.includedResponses.map((response) => response.text), ['yes', 'The value was null', 'N/A']);
  assert.equal(responses.length, 6);
  assert.equal(responses[2].text, ' no comment ');
});

test('exclusions apply after status, date, and segment filters', () => {
  const base = MOCK_TEXT_AI_FILTER_RESPONSES[0];
  const responses = [
    { ...base, id: 'short', text: 'NA', status: 'completed', submittedAt: '2026-08-01' },
    { ...base, id: 'keep', text: 'Good response', status: 'completed', submittedAt: '2026-08-01' },
    { ...base, id: 'started', text: 'NA', status: 'started', submittedAt: '2026-08-01' },
    { ...base, id: 'older', text: 'NA', status: 'completed', submittedAt: '2026-07-31' },
    { ...base, id: 'other-segment', text: 'NA', status: 'completed', submittedAt: '2026-08-01', questionValues: { 101: 'Female' } },
  ];
  const filters = { ...excluding({ minimumCharactersEnabled: true, minimumCharacters: 3 }), responseStatuses: ['completed'], dateRangeStart: '2026-08-01', dateRangeEnd: '2026-08-01', criteriaGroups: [{ id: 'group', conditions: [genderCondition(['Male'])] }] };
  const summary = getTextAiSegmentResponseSummary(filters, responses);
  assert.equal(summary.segmentCount, 2);
  assert.equal(summary.excludedCount, 1);
  assert.deepEqual(summary.includedResponses.map((response) => response.id), ['keep']);
});

test('pending processing uses its supplied cohort and can leave no eligible responses', () => {
  const pending = MOCK_TEXT_AI_FILTER_RESPONSES.slice(0, 240);
  assert.equal(calculateTextAiSegmentResponseCount(createDefaultSegmentFilterState(), pending), 240);
  const filters = excluding({ minimumCharactersEnabled: true, minimumCharacters: 3, exactResponsesEnabled: true, exactResponses: ['null'] });
  const summary = getTextAiSegmentResponseSummary(filters, pending);
  assert.equal(summary.includedResponses.length, 165);
  assert.equal(summary.excludedCount, 75);
  const includedIds = new Set(summary.includedResponses.map((response) => response.id));
  const remaining = pending.filter((response) => !includedIds.has(response.id));
  assert.equal(calculateTextAiSegmentResponseCount(filters, remaining), 0);
  assert.equal(calculateTextAiSegmentResponseCount(createDefaultSegmentFilterState(), remaining), 75);
  assert.equal(calculateTextAiSegmentResponseCount(excluding({ minimumCharactersEnabled: true, minimumCharacters: 1000 }), pending), 0);
});
