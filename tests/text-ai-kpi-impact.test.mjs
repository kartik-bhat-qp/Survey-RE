import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeTextAiKpiResponses, getTextAiKpiAnalysis, sortTextAiKpiRows } from '../src/data/mock-text-ai-kpi-by-theme.ts';

const tag = (subtheme = 'Late delivery') => ({ theme: 'Delivery', subtheme });
const response = (id, nps, tags = [], extra = {}) => ({ id, text: 'Synthetic feedback', sentiment: 'neutral', tags, answers: { nps }, ...extra });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test('agreed example: NPS 40, theme -20, remainder 55, impact -15, share 20%', () => {
  const rows = [];
  for (const [count, score, tags] of [[60, 10, [tag()]], [40, 8, [tag()]], [100, 5, [tag()]], [540, 10, []], [160, 8, []], [100, 5, []]]) {
    for (let i = 0; i < count; i++) rows.push(response(String(rows.length), score, tags));
  }
  const result = analyzeTextAiKpiResponses('nps', rows);
  assert.equal(result.overallScore, 40);
  assert.equal(result.rows[0].score, -20);
  assert.equal(result.rows[0].excludingScore, 55);
  assert.equal(result.rows[0].impact, -15);
  assert.equal(result.rows[0].responseCount, 200);
  assert.equal(result.rows[0].responseShare, 20);
});

test('parent union deduplicates IDs/tags and children retain the whole analysis base', () => {
  const a = response('a', 0, [tag(), tag(), tag('Packaging')]);
  const data = [a, a, response('b', 10, [tag('Packaging')]), response('c', 10)];
  const result = analyzeTextAiKpiResponses('nps', data);
  const parent = result.rows[0];
  assert.equal(result.pairedResponseCount, 3);
  assert.equal(parent.responseCount, 2);
  assert.equal(parent.score, 0);
  near(parent.impact, -200 / 3);
  const child = parent.subthemes.find(row => row.label === 'Late delivery');
  assert.equal(child.responseCount, 1);
  assert.equal(child.comparisonCount, 2);
  near(child.impact, -200 / 3);
  assert.equal(parent.subthemes.reduce((n, row) => n + row.responseCount, 0), 3);
});

test('invalid KPI, blank text and unfinished analysis do not silently enter the base', () => {
  const rows = [response('valid', 9), response('missing', undefined), response('out-of-range', 11), response('nan', NaN), response('fraction', 9.5), response('blank', 10, [], { text: ' ' }), response('pending', 10, [], { analysisStatus: 'pending' }), response('failed', 10, [], { analysisStatus: 'failed' })];
  const result = analyzeTextAiKpiResponses('nps', rows);
  assert.equal(result.pairedResponseCount, 1);
  assert.equal(result.scoredResponseCount, 4);
  assert.equal(result.coverage, 25);
  assert.equal(result.overallScore, 100);
});

test('empty base and absent comparison return unavailable; constant KPI returns actual zero', () => {
  const all = analyzeTextAiKpiResponses('nps', [response('a', 10, [tag()])]);
  assert.equal(all.rows[0].impact, null);
  assert.equal(all.rows[0].unavailableReason, 'No comparison group');
  const none = analyzeTextAiKpiResponses('nps', [response('a', undefined, [tag()])]);
  assert.equal(none.overallScore, null);
  assert.equal(none.rows[0].score, null);
  assert.equal(none.rows[0].unavailableReason, 'No matching responses');
  const constant = analyzeTextAiKpiResponses('nps', [response('a', 10, [tag()]), response('b', 10)]);
  assert.equal(constant.rows[0].impact, 0);
});

test('CSAT uses top two boxes and impacts are percentage points; means use scale points', () => {
  const data = [1, 4, 5, 5].map((value, i) => response(String(i), 8, i < 2 ? [tag()] : [], { answers: { csat: value, 'visit-rating': value } }));
  const csat = analyzeTextAiKpiResponses('csat', data);
  assert.equal(csat.overallScore, 75);
  assert.equal(csat.rows[0].score, 50);
  assert.equal(csat.rows[0].impact, -25);
  const mean = analyzeTextAiKpiResponses('visit-rating', data);
  assert.equal(mean.overallScore, 3.75);
  assert.equal(mean.rows[0].score, 2.5);
  assert.equal(mean.rows[0].impact, -1.25);
});

test('dashboard filters recompute both groups and count only matching source responses', () => {
  const data = [response('a', 0, [tag()], { text: 'slow service', collectedOn: '2026-09-10' }), response('b', 10, [], { text: 'great service', collectedOn: '2026-09-12' }), response('c', 0, [], { text: 'great food', collectedOn: '2026-09-12' }), response('d', 0, [], { text: 'slow service', collectedOn: '2026-08-01' })];
  const result = analyzeTextAiKpiResponses('nps', data, { query: 'service', start: '2026-09-01', end: '2026-09-30' });
  assert.equal(result.sourceResponseCount, 2);
  assert.equal(result.overallScore, 0);
  assert.equal(result.rows[0].impact, -100);
  assert.equal(analyzeTextAiKpiResponses('nps', data, { query: 'nonexistent' }).overallScore, null);
});

test('the prototype fixture reconciles impact with prevalence and group difference', () => {
  for (const kpi of ['nps', 'csat', 'visit-rating', 'return-likelihood']) {
    const result = getTextAiKpiAnalysis(kpi);
    for (const row of result.rows.flatMap(row => [row, ...row.subthemes])) {
      assert.equal(row.responseCount + row.comparisonCount, result.pairedResponseCount);
      assert.equal(row.responses.length, row.responseCount);
      if (row.impact !== null) near(row.impact, row.responseShare / 100 * (row.score - row.excludingScore));
    }
  }
});

test('column sorting handles signed impact, names, scores, counts, shares and unavailable values', () => {
  const base = getTextAiKpiAnalysis('nps').rows[0];
  const rows = [
    { ...base, label: 'Zulu', impact: -12, score: -30, responseCount: 8, responseShare: 20 },
    { ...base, label: 'Alpha', impact: 6, score: 50, responseCount: 2, responseShare: 5 },
    { ...base, label: 'Missing', impact: null, score: null, responseCount: 0, responseShare: 0 },
  ];
  const sorted = (column, direction) => sortTextAiKpiRows(rows, { column, direction }).map(row => row.label);
  assert.deepEqual(sorted('impact', 'ascending'), ['Zulu', 'Alpha', 'Missing']);
  assert.deepEqual(sorted('impact', 'descending'), ['Alpha', 'Zulu', 'Missing']);
  assert.deepEqual(sorted('theme', 'ascending'), ['Alpha', 'Missing', 'Zulu']);
  assert.deepEqual(sorted('theme', 'descending'), ['Zulu', 'Missing', 'Alpha']);
  assert.deepEqual(sorted('score', 'descending'), ['Alpha', 'Zulu', 'Missing']);
  assert.deepEqual(sorted('responses', 'descending'), ['Zulu', 'Alpha', 'Missing']);
  assert.deepEqual(sorted('share', 'ascending'), ['Missing', 'Alpha', 'Zulu']);
  assert.deepEqual(rows.map(row => row.label), ['Zulu', 'Alpha', 'Missing']);
});


test('combined widget and dashboard filters intersect before computing KPI bases', () => {
  const data = [
    response('a', 0, [tag()], { text: 'slow delivery', collectedOn: '2026-09-10' }),
    response('b', 10, [], { text: 'fast delivery', collectedOn: '2026-09-12' }),
    response('c', 10, [tag()], { text: 'slow pickup', collectedOn: '2026-09-12' }),
    response('d', 10, [tag()], { text: 'slow delivery', collectedOn: '2026-08-10' }),
  ];
  const actual = analyzeTextAiKpiResponses('nps', data, [{ query: 'delivery', start: '2026-09-01' }, { query: 'slow' }]);
  assert.equal(actual.pairedResponseCount, 1);
  assert.equal(actual.overallScore, -100);
  assert.equal(actual.rows[0].responseCount, 1);
  assert.equal(actual.rows[0].impact, null);
  assert.equal(analyzeTextAiKpiResponses('nps', data, []).pairedResponseCount, 4);
});
