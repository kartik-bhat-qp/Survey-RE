import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultHeatMapSettings, matrixHeatMapSettings, mixedHeatMapSettings, fixtureQuestions, INITIAL_HEAT_MAP_SEGMENTS, HEAT_MAP_QUESTIONS, selectedSegments, displayScore, heatMapCellColor, normalizeHeatMapSettings, equalThresholds, SENTIMENT_COLORS, heatMapOverallScore, heatMapOverallAverage, heatMapSourceQuestions, heatMapDirectScore, heatMapResponseBase, resolveHeatMapFilter, heatMapCohortCount, heatMapCohortScore, resolveHeatMapDesign, resolveDashboardHeatMapFilter, resolveHeatMapActiveAnswers } from '../src/data/heat-map-baseline.ts';

test('current saved production snapshot keeps the 1,3,2,4,5 defect and 100 response base', () => {
  const current = defaultHeatMapSettings();
  const columns = selectedSegments(current.segments, INITIAL_HEAT_MAP_SEGMENTS);
  assert.deepEqual(columns.map(s => s.answer), [1, 3, 2, 4, 5]);
  assert.deepEqual(columns.map(s => s.count), [22, 16, 23, 18, 21]);
  assert.equal(columns.reduce((sum, s) => sum + s.count, 0), 100);
  assert.equal(current.responseCount, false);
  assert.equal(current.overallAverage, false);
  assert.equal(current.overallColumn, false);
  assert.equal(current.widgetStats, false);
});
test('changing selection click order does not sort displayed production columns', () => {
  assert.deepEqual(selectedSegments(['answer-5', 'answer-2', 'answer-3'], INITIAL_HEAT_MAP_SEGMENTS).map(s => s.answer), [3, 2, 5]);
  assert.deepEqual(selectedSegments([], INITIAL_HEAT_MAP_SEGMENTS), []);
});
test('all five recorded scores resolve to distinct expected colors; counts retain observed red', () => {
  const settings = defaultHeatMapSettings();
  assert.deepEqual([1, 2, 3, 4, 5].map(value => heatMapCellColor(value, 5, settings)), SENTIMENT_COLORS);
  for (const count of [0, 16, 22, 100]) assert.equal(heatMapCellColor(count, 5, settings, true), SENTIMENT_COLORS[0]);
});
test('threshold boundary changes affect only the corresponding score band', () => {
  const settings = { ...defaultHeatMapSettings(), thresholds: [21, 41, 61, 81] };
  assert.equal(heatMapCellColor(2.049, 5, settings), SENTIMENT_COLORS[1]);
  assert.equal(heatMapCellColor(2.051, 5, settings), SENTIMENT_COLORS[2]);
  assert.equal(heatMapCellColor(0, 5, settings), SENTIMENT_COLORS[0]);
  assert.equal(heatMapCellColor(5, 5, settings), SENTIMENT_COLORS[4]);
});
test('historical fixture preserves multiple matrix parents and ten leaf rows', () => {
  const settings = matrixHeatMapSettings();
  const questions = HEAT_MAP_QUESTIONS.filter(q => settings.questions.includes(q.id));
  assert.equal(questions.length, 4);
  assert.equal(questions.flatMap(q => q.children ?? []).length, 10);
  assert.deepEqual(questions.map(q => q.overall), [4, 4, 4, 3]);
  assert.equal(settings.bands, 2);
  assert.equal(heatMapCellColor(4, 5, settings), SENTIMENT_COLORS[4]);
});
test('production-verified five-point normalization and reversal preserve exact means', () => {
  assert.equal(displayScore(2.93, 5, 'Default', false), 2.93);
  assert.ok(Math.abs(displayScore(2.93, 5, '0–10', false) - 5.86) < 1e-12);
  assert.equal(displayScore(1, 5, 'Default', true), 5);
  assert.equal(displayScore(5, 5, '0–10', true), 2);
  assert.deepEqual([1, 3, 2, 4, 5].map(value => displayScore(value, 5, '0–10', true)), [10, 6, 8, 4, 2]);
  assert.equal(displayScore(2.93, 5, '0–10', true).toFixed(2), '6.14');
});
test('malformed persisted state cannot inject names as types or corrupt thresholds', () => {
  for (const invalid of [undefined, null, 3, []]) assert.deepEqual(normalizeHeatMapSettings(invalid), defaultHeatMapSettings());
  const result = normalizeHeatMapSettings({ precision: 100, bands: 4, thresholds: [90, 10, NaN], range: 'percent', colors: ['url(x)'], questions: ['single', 'bad'], fontFamily: 'url(evil)', reversed: ['channel', 'unknown'] });
  assert.equal(result.precision, 0);
  assert.deepEqual(result.thresholds, [25, 50, 75]);
  assert.deepEqual(result.questions, ['single']);
  assert.deepEqual(result.reversed, ['channel']);
  assert.deepEqual(result.colors, SENTIMENT_COLORS);
  assert.equal(result.fontFamily, 'Fira Sans');
});
test('all configurable settings survive JSON save/reopen without changing unrelated defaults', () => {
  const settings = { ...defaultHeatMapSettings(), name: 'Test title', precision: 4, filterType: 'Combined', overallAverage: true, overallColumn: true, responseCount: true, widgetStats: true, statsLabel: 'Base', reversed: ['single'], bands: 3, thresholds: [25, 80], fontSize: 'Large', fontFamily: 'Georgia', themeColor: '#123456', weighting: 'None', sentiment: 'Default' };
  assert.deepEqual(normalizeHeatMapSettings(JSON.parse(JSON.stringify(settings))), settings);
});
test('equal band construction yields complete monotonic intervals for every offered band count', () => {
  for (let bands = 2; bands <= 5; bands++) {
    const points = [0, ...equalThresholds(bands), 100];
    assert.equal(points.length, bands + 1);
    assert.equal(points.slice(1).every((p, i) => p > points[i]), true);
  }
});
test('custom colors do not mutate default palettes or independent fixture instances', () => {
  const one = defaultHeatMapSettings(); const two = defaultHeatMapSettings();
  one.colors[0] = '#000000';
  assert.equal(heatMapCellColor(1, 5, one), '#000000');
  assert.equal(two.colors[0], SENTIMENT_COLORS[0]);
  assert.equal(heatMapCellColor(1, 5, { ...one, sentiment: 'Default' }), SENTIMENT_COLORS[0]);
});

test('current mixed-question snapshot keeps matrix, single, multi and dropdown together', () => {
  const settings = mixedHeatMapSettings();
  const questions = fixtureQuestions(settings.source).filter(question => settings.questions.includes(question.id));
  assert.equal(questions.length, 5);
  assert.deepEqual(questions.map(q => q.overall.toFixed(0)), ['3', '3', '3', '3', '3']);
  assert.equal(questions[0].children.length, 3);
  assert.deepEqual(questions[0].children.map(row => row.overall), [2.93, 2.91, 3.03]);
  assert.equal(settings.overallColumn, true);
  assert.equal(settings.segments.length, 0);
});
test('removing every selected row does not change survey or available questions', () => {
  const empty = normalizeHeatMapSettings({ ...defaultHeatMapSettings(), questions: [] });
  assert.equal(empty.source, 'single');
  assert.equal(fixtureQuestions(empty.source)[0].id, 'single');
});

test('mixed fixture matches precision-four production leaves and aggregate semantics', () => {
  const settings = mixedHeatMapSettings();
  const questions = fixtureQuestions('mixed').filter(question => settings.questions.includes(question.id));
  const matrix = questions[0];
  assert.equal(heatMapOverallScore(matrix, settings).toFixed(4), '2.9567');
  assert.equal(heatMapOverallAverage(questions, settings).toFixed(4), '2.8314');
  settings.range = '0–5';
  assert.equal(heatMapOverallAverage(questions, settings).toFixed(4), '3.0100');
  assert.equal(heatMapOverallScore(questions[2], settings).toFixed(4), '3.1250');
  settings.reversed = ['qa-matrix'];
  assert.deepEqual(matrix.children.map(child => heatMapOverallScore(matrix, settings, child.id).toFixed(4)), ['3.0700', '2.9100', '3.0300']);
  assert.equal(heatMapOverallScore(matrix, settings).toFixed(4), '3.0033');
  assert.equal(heatMapOverallAverage(questions, settings).toFixed(4), '3.0300');
});

test('source picker preserves observed inventory and disclosure-only rows', () => {
  const questions = heatMapSourceQuestions('mixed');
  assert.equal(questions.length, 26);
  assert.equal(questions.filter(question => question.children || question.sourceDisclosure).length, 11);
  assert.equal(questions.filter(question => !question.children && !question.sourceDisclosure).length, 15);
});

test('audited direct questions retain production precision and empty-response conventions', () => {
  const settings = defaultHeatMapSettings();
  const find = code => heatMapSourceQuestions('mixed').find(question => question.code === code);
  assert.equal(heatMapDirectScore(find('Q9'), settings), 6.02);
  assert.equal(find('Q9').max, 11);
  assert.equal(find('Q32').max, 51);
  assert.equal(heatMapDirectScore(find('Q21'), settings, 1), 0);
  assert.equal(heatMapResponseBase(find('Q26'), 22, 1), 0);
  assert.equal(find('Q26').renderedTitle, 'Last Name');
  assert.equal(find('Q40').showBase, false);
  settings.range = '0–10';
  assert.equal(heatMapDirectScore(find('Q40'), settings, 3), 6.5833);
  assert.equal(heatMapDirectScore(find('Q6'), settings, 1), 6.4772);
  assert.equal(heatMapDirectScore(find('Q32'), settings, 5), 4.4351);
});

test('known ordinal cohorts support AND/OR and Is not without invented cross-question responses', () => {
  const definition = { id: 'test', name: 'test', answer: 0, count: 0, responseStatus: 'All responses', from: '', to: '', criteria: [
    { option: 'Question', field: 'single', operator: 'Is', value: '1,2,3', block: 1 },
    { option: 'Question', field: 'single', operator: 'Is not', value: '2', block: 1 },
    { option: 'Question', field: 'single', operator: 'Is', value: '5', block: 2 },
  ] };
  assert.deepEqual(resolveHeatMapFilter(definition).answers, [1, 3, 5]);
  assert.equal(heatMapCohortCount([1, 3, 5]), 59);
  assert.equal(heatMapCohortScore(HEAT_MAP_QUESTIONS[0], defaultHeatMapSettings(), [1, 3, 5]), 175 / 59);
  assert.deepEqual(resolveHeatMapFilter({ ...definition, responseStatus: 'Started but not completed' }).answers, []);
  assert.deepEqual(resolveHeatMapFilter({ ...definition, to: '2026-09-24' }).answers, []);
  assert.ok(resolveHeatMapFilter({ ...definition, criteria: [{ ...definition.criteria[0], field: 'qa-nominal' }] }).error);
});

const dashboardDesign = { theme: 'default', palette: 'categorical', sentiment: 'default', themeColor: '#0d2163', customPalette: [], customSentiment: ['#111111','#222222','#333333','#444444','#555555'], typography: { fontSize: { value: 'medium', label: 'Medium' }, fontFamily: { value: 'Georgia, serif', label: 'Georgia' }, fontStyle: { value: 'regular', label: 'Regular' } } };
test('dashboard inherited design follows verified font sizes and live custom palette without overwriting widget override', () => {
  const settings = mixedHeatMapSettings();
  for (const [label, body, title] of [['Extra small',11,14],['Small',12,16],['Medium',14,18],['Large',16,20],['Extra large',18,22]]) {
    const design = resolveHeatMapDesign(settings, { ...dashboardDesign, typography: { ...dashboardDesign.typography, fontSize: {value: label.toLowerCase(),label} } });
    assert.equal(design.bodySize, body); assert.equal(design.titleSize, title);
    assert.equal(design.fontFamily, 'Georgia, serif'); assert.equal(design.themeColor, '#0d2163');
    assert.equal(heatMapCellColor(3,5,design.colorSettings), '#ffcb47');
  }
  const custom = resolveHeatMapDesign(settings, {...dashboardDesign, sentiment:'custom'});
  assert.equal(heatMapCellColor(1,5,custom.colorSettings), '#111111');
  assert.equal(heatMapCellColor(3,5,custom.colorSettings), '#222222');
  const override = resolveHeatMapDesign(defaultHeatMapSettings(), {...dashboardDesign, sentiment:'custom'});
  assert.equal(override.fontFamily, 'Fira Sans');
  assert.deepEqual(override.colorSettings.colors, SENTIMENT_COLORS);
});
const activeDashboardFilter = {hasCriteria:true,questionId:'single',operator:'is',value:'Poor',responseStatus:'all',dateRange:''};
test('dashboard Q5/status/date filters use verified cohorts and reject unavailable inputs', () => {
  assert.deepEqual(resolveDashboardHeatMapFilter(activeDashboardFilter).answers,[2]);
  assert.equal(heatMapCohortCount(resolveDashboardHeatMapFilter(activeDashboardFilter).answers),23);
  assert.deepEqual(resolveDashboardHeatMapFilter({...activeDashboardFilter,operator:'is-not'}).answers,[1,3,4,5]);
  for (const responseStatus of ['partial','terminated']) assert.deepEqual(resolveDashboardHeatMapFilter({...activeDashboardFilter,responseStatus}).answers,[]);
  for (const dateRange of ['2026-09-25','2026-09-01 to 2026-09-30']) assert.deepEqual(resolveDashboardHeatMapFilter({...activeDashboardFilter,dateRange}).answers,[2]);
  assert.deepEqual(resolveDashboardHeatMapFilter({...activeDashboardFilter,dateRange:'2026-09-24'}).answers,[]);
  for (const dateRange of ['yesterday','2026-02-31','2026-09-30 to 2026-09-01']) assert.ok(resolveDashboardHeatMapFilter({...activeDashboardFilter,dateRange}).error);
  assert.ok(resolveDashboardHeatMapFilter({...activeDashboardFilter,questionId:'country'}).error);
});
test('scope selection isolates dashboard/widget filters and Combined intersects without hiding unavailable filters', () => {
  const widgetFilter={id:'filter',name:'One',answer:1,count:22,responseStatus:'All responses',from:'',to:'',criteria:[{option:'Question',field:'single',operator:'Is',value:'1',block:1}]};
  const settings={...defaultHeatMapSettings(),widgetFilter};
  assert.deepEqual(resolveHeatMapActiveAnswers({...settings,filterType:'Dashboard'},activeDashboardFilter).answers,[2]);
  assert.deepEqual(resolveHeatMapActiveAnswers({...settings,filterType:'Widget'},activeDashboardFilter).answers,[1]);
  assert.deepEqual(resolveHeatMapActiveAnswers({...settings,filterType:'Combined'},activeDashboardFilter).answers,[]);
  assert.deepEqual(resolveHeatMapActiveAnswers({...settings,filterType:'None'},activeDashboardFilter).answers,[1,2,3,4,5]);
  assert.ok(resolveHeatMapActiveAnswers({...settings,filterType:'Combined'},{...activeDashboardFilter,questionId:'country'}).error);
  assert.ok(resolveHeatMapActiveAnswers(matrixHeatMapSettings(),activeDashboardFilter).error);
});
