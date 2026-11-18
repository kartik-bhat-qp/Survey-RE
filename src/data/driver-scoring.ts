import { adaptHeatmapQuestions, createHeatmapResponses, type HeatmapQuestion } from './advanced-heatmap';
import { flattenQuestionsForPicker, getQuestionsBySurvey } from './mock-survey-questions';
import { defaultKpiScoring, type KpiScoring, type TextAiKpiMetric } from './mock-text-ai-kpi-by-theme';
import type { DriverAnalysisWidgetConfig } from './mock-ai-widgets';

export interface DriverOutcome {
  surveyId: number;
  rowId: string;
  label: string;
  answers: Array<{ score: number; label: string }>;
}

export function driverCatalog(surveyId: number) {
  const questions = getQuestionsBySurvey(surveyId);
  const sources = adaptHeatmapQuestions(questions);
  const expanded = flattenQuestionsForPicker(questions, new Set(questions.map(q => q.id)));
  return expanded.map(pick => {
    const source = sources.find(q => q.id === String(pick.parentQuestionId ?? pick.id))!;
    const index = pick.parentQuestionId === undefined ? 0 : questions.find(q => String(q.id) === source.id)!.matrixRows!.indexOf(pick.text);
    const row = source.rows[index];
    const answers = source.options.flatMap(option => option.score === undefined ? [] : [{ score: option.score, label: option.label }]);
    const reason = !['NPS', 'Single Select', 'Matrix Uni choice'].includes(source.type) || answers.length !== source.options.length || answers.length < 2
      ? 'Choose an ordered rating with defined scores.' : undefined;
    const outcome: DriverOutcome = { surveyId, rowId: row.id, answers, label: pick.parentQuestionId === undefined ? pick.text : `${source.label} — ${pick.text}` };
    return { pick, source, outcome, reason };
  });
}

export function driverDefaultScoring(outcome: DriverOutcome, metric: TextAiKpiMetric) {
  return defaultKpiScoring(outcome.answers.map(a => a.score), metric, metric === 'mean' ? 'Mean' : metric.toUpperCase());
}

export function outcomeValue(scoring: KpiScoring, score: number): number | undefined {
  const mapped = scoring.mappings[score];
  if (mapped === 'exclude' || mapped === undefined) return undefined;
  if (typeof mapped === 'number') return mapped;
  if (mapped === 'promoter' || mapped === 'satisfied' || mapped === 'easy') return 100;
  if (mapped === 'detractor' || (mapped === 'difficult' && scoring.cesCalculation === 'net-easy')) return -100;
  return 0;
}

export function preparedDriverData(config: DriverAnalysisWidgetConfig, scoring: KpiScoring) {
  const outcome = config.outcome;
  if (!outcome) return null;
  const sources = outcome.rowId === 'airline-0:r0'
    ? airlineQuestions(config.drivers.map(d => d.name))
    : adaptHeatmapQuestions(getQuestionsBySurvey(outcome.surveyId));
  const sourceByRow = new Map<string, HeatmapQuestion>();
  for (const source of sources) for (const row of source.rows) sourceByRow.set(row.id, source);
  const scoreByOption = new Map(sources.flatMap(q => q.options.map(o => [o.id, o.score] as const)));
  const responses = createHeatmapResponses(sources);
  const rows: number[][] = [];
  for (const response of responses) {
    const scoreAt = (rowId: string) => scoreByOption.get(response.answers[rowId]?.[0]);
    const raw = scoreAt(outcome.rowId);
    const y = raw === undefined ? undefined : outcomeValue(scoring, raw);
    const xs = config.drivers.map(d => scoreAt(d.id));
    if (y !== undefined && xs.every((v): v is number => v !== undefined)) rows.push([y, ...xs]);
  }
  const ranges = config.drivers.map(d => {
    const options = sourceByRow.get(d.id)?.options.flatMap(o => o.score === undefined ? [] : [o.score]) ?? [];
    return { min: Math.min(...options), max: Math.max(...options) };
  });
  return { rows, ranges, total: responses.length };
}

/** Resolve pre-configuration widgets against their original survey codes and row labels. */
export function resolveDriverConfig(previous: DriverAnalysisWidgetConfig | undefined, surveyId: number, sampleNames: string[]): DriverAnalysisWidgetConfig | null {
  if (previous?.outcome) return previous;
  const catalogue = driverCatalog(surveyId);
  const eligible = catalogue.filter(item => !item.reason && !item.pick.matrixRows?.length);
  const primary = eligible.find(item => previous
    ? item.pick.code === previous.primaryQuestionCode && item.pick.text === previous.primaryQuestionText
    : item.pick.type === 'NPS');
  if (!primary) return null;
  if (!previous) {
    const questions = airlineQuestions(sampleNames);
    const target = questions[0];
    return {
      metric: 'nps', primaryQuestionCode: 'Q4', primaryQuestionText: target.label,
      outcome: { surveyId, rowId: target.rows[0].id, label: target.label, answers: target.options.map(o => ({ score: o.score!, label: o.label })) },
      drivers: questions.slice(1).map(q => ({ id: q.rows[0].id, code: q.code, name: q.label })),
    };
  }
  const drivers = previous.drivers.flatMap(d => {
    const item = eligible.find(item => item.pick.code === d.code && item.pick.text === d.name);
    return item && item.outcome.rowId !== primary.outcome.rowId ? [{ ...d, id: item.outcome.rowId }] : [];
  });
  return drivers.length === previous.drivers.length ? { ...previous, outcome: primary.outcome, drivers } : null;
}

function airlineQuestions(names: string[]): HeatmapQuestion[] {
  return ['Likelihood to recommend the airline', ...names].map((label, index) => {
    const id = `airline-${index}`;
    const count = index === 0 ? 11 : 5;
    return {
      id, label, code: index === 0 ? 'Q4' : `D${index}`, type: index === 0 ? 'NPS' : 'Single Select',
      multiple: false, text: false, rows: [{ id: `${id}:r0`, label }],
      options: Array.from({ length: count }, (_, i) => {
        const score = index === 0 ? i : i + 1;
        return { id: `${id}:o${i}`, label: String(score), score };
      }),
    };
  });
}
