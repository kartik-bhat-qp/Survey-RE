import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_SHARED_LINK_SETTINGS, SHARED_DASHBOARD_RESPONSES,
  availableSharedFilters, initialSharedViewerFilters, filterSharedResponses, shareSettingsError,
} from '../src/data/mock-shared-urls.ts';
import { buildSharedChartPayload, sharedResponseMean } from '../src/data/shared-dashboard-chart-data.ts';

const interactive = (overrides = {}) => ({
  ...DEFAULT_SHARED_LINK_SETTINGS, savedFiltersEnabled: true,
  selectedSavedFilterIds: ['gender', 'country'], allowInteractivity: true, ...overrides,
});

test('all selected filters apply together; multiple values use OR within a filter', () => {
  const settings = interactive();
  const viewer = initialSharedViewerFilters(settings);
  assert.equal(filterSharedResponses(settings, viewer).length, 10);
  viewer.valuesByFilter.gender = ['Female', 'Male'];
  viewer.valuesByFilter.country = ['India', 'Germany'];
  const matches = filterSharedResponses(settings, viewer);
  assert.equal(matches.length, 40);
  assert.ok(matches.every((response) => ['Female', 'Male'].includes(response.gender) && ['India', 'Germany'].includes(response.country)));
});

test('saved-only mode switches presets without accepting changed values', () => {
  const settings = interactive({ allowInteractivity: false });
  const viewer = initialSharedViewerFilters(settings);
  assert.equal(filterSharedResponses(settings, viewer).length, 120);
  viewer.activeSavedFilterId = 'gender';
  viewer.valuesByFilter.gender = ['Other'];
  assert.ok(filterSharedResponses(settings, viewer).every((response) => response.gender === 'Female'));
  viewer.activeSavedFilterId = 'country';
  assert.equal(filterSharedResponses(settings, viewer).length, 30);
  assert.ok(filterSharedResponses(settings, viewer).every((response) => response.country === 'India'));
  viewer.activeSavedFilterId = 'unshared-filter';
  assert.equal(filterSharedResponses(settings, viewer).length, 0);
});

test('empty values produce an empty result, reset restores saved values', () => {
  const settings = interactive();
  const viewer = initialSharedViewerFilters(settings);
  viewer.valuesByFilter.gender = [];
  assert.equal(filterSharedResponses(settings, viewer).length, 0);
  assert.equal(filterSharedResponses(settings, initialSharedViewerFilters(settings)).length, 10);
});

test('base filter remains fixed and cannot be exposed as an editable filter', () => {
  const settings = interactive({ baseFilter: true, baseFilterId: 'country' });
  const viewer = initialSharedViewerFilters(settings);
  assert.deepEqual(availableSharedFilters(settings).map((filter) => filter.id), ['gender']);
  viewer.valuesByFilter.country = ['Germany'];
  viewer.valuesByFilter.gender = ['Other'];
  const matches = filterSharedResponses(settings, viewer);
  assert.equal(matches.length, 10);
  assert.ok(matches.every((response) => response.country === 'India' && response.gender === 'Other'));
});

test('disabling shared filters ignores all viewer controls but retains the base', () => {
  const settings = interactive({ savedFiltersEnabled: false, baseFilter: true, baseFilterId: 'country' });
  const viewer = { ...initialSharedViewerFilters(settings), startDate: '2099-01-01', responseStatuses: ['Partial'], valuesByFilter: { gender: [] } };
  assert.equal(filterSharedResponses(settings, viewer).length, 30);
});

test('date and status permissions apply independently of value interactivity', () => {
  const settings = interactive({ allowInteractivity: false, dateFilter: true, responseStatus: true });
  const viewer = { ...initialSharedViewerFilters(settings), activeSavedFilterId: 'gender', startDate: '2026-01-01', endDate: '2026-12-31', responseStatuses: ['Completed'] };
  const matches = filterSharedResponses(settings, viewer);
  assert.equal(matches.length, 16);
  assert.ok(matches.every((response) => response.status === 'Completed' && response.respondedAt.startsWith('2026')));
  assert.equal(filterSharedResponses({ ...settings, dateFilter: false, responseStatus: false }, viewer).length, 40);
});

test('response status supports multiple production options and an empty selection', () => {
  const settings = interactive({ responseStatus: true, selectedSavedFilterIds: ['gender'] });
  const viewer = initialSharedViewerFilters(settings);
  viewer.responseStatuses = ['Partial', 'Terminates'];
  const responses = filterSharedResponses(settings, viewer);
  assert.equal(responses.length, 8);
  assert.deepEqual([...new Set(responses.map((response) => response.status))].sort(), ['Partial', 'Terminates']);
  viewer.responseStatuses = [];
  assert.equal(filterSharedResponses(settings, viewer).length, 0);
});

test('every shared chart uses the same filtered response set', () => {
  const settings = interactive();
  const viewer = initialSharedViewerFilters(settings);
  const responses = filterSharedResponses(settings, viewer);
  const data = buildSharedChartPayload(responses);
  assert.equal(data.responseInfo.totalResponses, 10);
  assert.equal(data.responseInfo.completed, 8);
  assert.equal(data.npsBenchmarkResponseCount, 10);
  assert.deepEqual(data.mapPoints.map(({ value }) => value), [10, 0, 0, 0]);
  assert.equal(data.comparativeBarRows[0].gender0, 10);
  assert.equal(data.comparativeBarRows[0].gender1, 0);
  assert.equal(data.segmentTrendRows.reduce((sum, row) => sum + row.gender0, 0), 10);
  assert.ok(Math.abs(data.ageBarItems.reduce((sum, item) => sum + item.value, 0) - 100) < 0.5);
  viewer.valuesByFilter.country = ['Germany'];
  assert.deepEqual(buildSharedChartPayload(filterSharedResponses(settings, viewer)).mapPoints.map(({ value }) => value), [0, 0, 0, 10]);
});

test('empty chart data and means do not contain NaN or infinite values', () => {
  const data = buildSharedChartPayload([]);
  assert.equal(data.totalResponses, 0);
  assert.equal(data.responseInfo.minResponseSeconds, 0);
  assert.equal(data.responseInfo.maxResponseSeconds, 0);
  assert.equal(data.ageBarItems.every((item) => item.value === 0), true);
  assert.equal(sharedResponseMean([]), '—');
  assert.equal(sharedResponseMean(SHARED_DASHBOARD_RESPONSES), '3.00');
});

test('unsupported or incomplete selections fail closed', () => {
  for (const settings of [
    interactive({ selectedSavedFilterIds: [] }),
    interactive({ selectedSavedFilterIds: ['missing'] }),
    interactive({ baseFilter: true, baseFilterId: null }),
    interactive({ baseFilter: true, baseFilterId: 'missing' }),
    interactive({ enablePassword: true, password: '' }),
  ]) assert.equal(filterSharedResponses(settings, initialSharedViewerFilters(settings)).length, 0);
  assert.equal(shareSettingsError(interactive({ selectedSavedFilterIds: [] })), 'Select at least one saved filter.');
});

test('date selections include boundaries and an inverted range has no matches', () => {
  const settings = interactive({ dateFilter: true });
  const viewer = { ...initialSharedViewerFilters(settings), startDate: '2026-04-15', endDate: '2026-04-15' };
  assert.equal(filterSharedResponses(settings, viewer).length, 1);
  viewer.endDate = '2025-01-01';
  assert.equal(filterSharedResponses(settings, viewer).length, 0);
});

test('unshared dimensions cannot filter responses and defaults are not mutated', () => {
  const settings = interactive({ selectedSavedFilterIds: ['gender'] });
  const viewer = initialSharedViewerFilters(settings);
  viewer.valuesByFilter.country = ['Germany'];
  assert.equal(filterSharedResponses(settings, viewer).length, 40);
  viewer.valuesByFilter.gender.push('Other');
  assert.deepEqual(initialSharedViewerFilters(settings).valuesByFilter.gender, ['Female']);
  assert.equal(SHARED_DASHBOARD_RESPONSES.length, 120);
});
