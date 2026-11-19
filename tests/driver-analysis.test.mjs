import test from 'node:test';
import assert from 'node:assert/strict';
import { fitDriverModel } from '../src/data/driver-model.ts';
import { defaultKpiScoring, validateKpiScoring } from '../src/data/mock-text-ai-kpi-by-theme.ts';

const rows = [-1, 0, 1].flatMap(x => [-1, 0, 1].map(z => [4 + 2*x - z, x, z]));
const near = (a, b) => assert.ok(Math.abs(a-b) < 1e-9);
test('a fitted outcome has stable relative importance and signed single-driver effects', () => {
  const fit = fitDriverModel(rows, 2);
  near(fit.baseline, 4); near(fit.explained, 1);
  near(fit.drivers[0].importance, 80); near(fit.drivers[1].importance, 20);
  near(fit.drivers[1].slope, -1); assert.ok(fit.drivers[1].correlation < 0);
  const reversed = fitDriverModel(rows.map(([y,x,z]) => [y,z,x]), 2);
  near(reversed.drivers[0].importance, fit.drivers[1].importance);
});
test('insufficient data, constant outcomes and overlapping predictors have distinct errors', () => {
  assert.match(fitDriverModel([], 1).error, /Too few/);
  assert.match(fitDriverModel(rows.map(([,x,z])=>[1,x,z]),2).error,/constant/);
  assert.match(fitDriverModel(rows.map(([y,x])=>[y,x,x]),2).error,/overlap/);
});
test('configuration uses only the selected scale, supports explicit exclusions and rejects a missing score', () => {
  const scale = [1,2,3,4];
  const config = defaultKpiScoring(scale, 'mean', 'Quality');
  assert.deepEqual(Object.keys(config.mappings), ['1','2','3','4']);
  config.mappings[1] = 0; config.mappings[4] = 'exclude';
  assert.equal(validateKpiScoring(config,scale),null);
  assert.match(validateKpiScoring(config,[...scale,5]), /every/);
});

test('native and custom KPI questions use their defined scales independently of question wording', async () => {
  const { adaptHeatmapQuestions } = await import('../src/data/advanced-heatmap.ts');
  const base = { id: 1, surveyId: 9, code: 'Q1', text: 'Rate your experience' };
  const sources = adaptHeatmapQuestions([
    { ...base, type: 'NPS' },
    { ...base, type: 'CES', options: ['Easy', 'Neutral', 'Difficult'], answerScores: [3, 2, 1] },
    { ...base, type: 'CSAT', options: ['Low', 'High'] },
    { ...base, type: 'Single Select', customScoreType: 'nps', options: ['Low', 'High'], answerScores: [0, 10] },
    { ...base, type: 'Matrix Uni choice', customScoreType: 'csat', matrixRows: ['Delivery'], options: ['Low', 'High'] },
    { ...base, type: 'Single Select', text: 'Would you recommend a color?', options: ['Red', 'Blue'] },
  ]);
  const scores = sources.map(source => source.options.map(option => option.score));
  assert.deepEqual(scores, [Array.from({ length: 11 }, (_, i) => i), [3, 2, 1], [1, 2], [0, 10], [1, 2], [undefined, undefined]]);
});


test('the analytical boundary accepts ten drivers and rejects eleven or zero', () => {
  assert.match(fitDriverModel([], 11).error, /one and ten/);
  assert.match(fitDriverModel([], 0).error, /one and ten/);
  assert.match(fitDriverModel([], 10).error, /Too few/);
});

test('single-answer choices remain selectable and driver scores stay numeric', async () => {
  const { readFileSync } = await import('node:fs');
  const { stripTypeScriptTypes } = await import('node:module');
  const questionsSource = readFileSync(new URL('../src/data/mock-survey-questions.ts', import.meta.url), 'utf8')
    .replace("'./question-stacks'", JSON.stringify(new URL('../src/data/question-stacks.ts', import.meta.url).href));
  const questionModule = `data:text/javascript,${encodeURIComponent(stripTypeScriptTypes(questionsSource))}`;
  let source = stripTypeScriptTypes(readFileSync(new URL('../src/data/driver-scoring.ts', import.meta.url), 'utf8'));
  source = source.replaceAll("'./mock-survey-questions'", JSON.stringify(questionModule));
  for (const name of ['advanced-heatmap', 'mock-text-ai-kpi-by-theme', 'mock-driver-analysis'])
    source = source.replaceAll(`'./${name}'`, JSON.stringify(new URL(`../src/data/${name}.ts`, import.meta.url).href));
  const { driverCatalog, driverSurveyQuestions, driverDefaultScoring, preparedDriverData } = await import(`data:text/javascript,${encodeURIComponent(source)}`);
  const choices = driverCatalog(1);
  const questions = driverSurveyQuestions(1);
  for (const q of questions.filter(q => q.type === 'Single Select')) {
    const choice = choices.find(c => c.outcome.rowId === `${q.id}:r0`);
    assert.ok(choice, `${q.code} must be selectable`);
    assert.ok(choice.outcome.answers.every(a => Number.isFinite(a.score)));
  }
  assert.equal(choices.some(c => questions.some(q => ['Text','Multiple Select'].includes(q.type) && c.outcome.rowId === `${q.id}:r0`)),false);
  const primary = choices.find(c=>c.metric==='nps');
  const predictor = choices.find(c=>c.metric==='csat');
  const config = { outcome:primary.outcome, primaryQuestionCode:primary.code, primaryQuestionText:primary.outcome.label,
    drivers:[{id:predictor.outcome.rowId,code:predictor.code,name:predictor.outcome.label}] };
  const scoring = driverDefaultScoring(primary.outcome,primary.metric);
  const prepared = preparedDriverData(config,scoring);
  assert.equal(prepared.driverRules[0].metric,'mean');
  assert.ok(prepared.rows.every(row=>row[1]>=1 && row[1]<=5));
  const legacy = preparedDriverData({...config,driverScoring:{[predictor.outcome.rowId]:driverDefaultScoring(predictor.outcome,'csat')}},scoring);
  assert.deepEqual(legacy.rows,prepared.rows);
});
