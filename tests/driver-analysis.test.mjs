import test from 'node:test';
import assert from 'node:assert/strict';
import { fitDriverModel, predictDriverScenario, averageRanks, spearmanCorrelation, analyzeSpearmanDrivers } from '../src/data/driver-model.ts';
import { defaultKpiScoring, validateKpiScoring } from '../src/data/mock-text-ai-kpi-by-theme.ts';

const rows = [-1, 0, 1].flatMap(x => [-1, 0, 1].map(z => [4 + 2*x - z, x, z]));
const near = (a, b) => assert.ok(Math.abs(a-b) < 1e-9);
test('the separate prediction model has a stable baseline and signed single-driver effects', () => {
  const fit = fitDriverModel(rows, 2);
  near(fit.baseline, 4); near(fit.explained, 1);
  near(fit.drivers[0].slope, 2);
  near(fit.drivers[1].slope, -1);
  const reversed = fitDriverModel(rows.map(([y,x,z]) => [y,z,x]), 2);
  near(reversed.drivers[0].slope, fit.drivers[1].slope);
});
test('insufficient data, constant outcomes and overlapping predictors have distinct errors', () => {
  assert.match(fitDriverModel([], 1).error, /Too few/);
  assert.match(fitDriverModel(rows.map(([,x,z])=>[1,x,z]),2).error,/constant/);
  assert.match(fitDriverModel(rows.map(([y,x])=>[y,x,x]),2).error,/overlap/);
});
test('multiple driver shifts combine signed effects, respect source bounds and reset to baseline', () => {
  const fit = fitDriverModel(rows, 2);
  const ranges = [[-1, 1], [-1, 1]];
  const scenario = predictDriverScenario(fit, {0:.5,1:-.5}, ranges);
  near(scenario.change,1.5); near(scenario.estimate,5.5);
  assert.deepEqual(scenario.drivers.map(d=>d.contribution),[1,.5]);
  const bounded = predictDriverScenario(fit,{0:10,1:-10},ranges);
  assert.deepEqual(bounded.drivers.map(d=>d.target),[1,-1]);
  near(predictDriverScenario(fit,{},ranges).estimate,fit.baseline);
  near(fit.baseline,4);
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


test('Spearman uses average ranks for ties and recognizes nonlinear monotonic association', () => {
  assert.deepEqual(averageRanks([4, 2, 2, 1]), [4, 2.5, 2.5, 1]);
  near(spearmanCorrelation([1,2,2,3],[1,2,3,4]), Math.sqrt(0.9));
  near(spearmanCorrelation([1,2,3,4],[1,4,9,16]), 1);
  near(spearmanCorrelation([1,2,3,4],[16,9,4,1]), -1);
  near(spearmanCorrelation([1,2,3,4],[2,4,1,3]), 0);
  assert.equal(spearmanCorrelation([1,1,1],[1,2,3]),null);
  assert.equal(spearmanCorrelation([1],[2]),null);
  assert.equal(spearmanCorrelation([1,2],[2,NaN]),null);
});

test('Spearman diagnosis remains valid for overlapping drivers that cannot support Predict', () => {
  const duplicateRows = [[1,1,1],[2,2,2],[3,3,3],[4,4,4]];
  const diagnosis = analyzeSpearmanDrivers(duplicateRows,2);
  near(diagnosis.drivers[0].correlation,1); near(diagnosis.drivers[1].importance,1);
  assert.match(fitDriverModel(duplicateRows,2).error,/overlap/);
  const mixed = analyzeSpearmanDrivers([[1,1,7],[2,2,7],[3,3,7]],2);
  near(mixed.drivers[0].correlation,1); assert.equal(mixed.drivers[1].correlation,null);
  assert.equal(mixed.drivers[1].importance,null);
});

test('Spearman strengths retain direction separately and do not normalize to 100 percent', () => {
  const result = analyzeSpearmanDrivers([[1,1,4],[2,2,3],[3,3,2],[4,4,1]],2);
  near(result.drivers[0].importance,1);near(result.drivers[1].importance,1);
  near(result.drivers[1].correlation,-1);
  assert.match(analyzeSpearmanDrivers([],11).error,/one and ten/);
  assert.match(analyzeSpearmanDrivers([[1,1],[1,2]],1).error,/constant/);
});
