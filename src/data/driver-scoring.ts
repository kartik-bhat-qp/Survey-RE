import { adaptHeatmapQuestions, createHeatmapResponses, type HeatmapQuestion } from './advanced-heatmap';
import { getQuestionsBySurvey, type SurveyQuestion } from './mock-survey-questions';
import { defaultKpiScoring, type KpiScoring, type TextAiKpiMetric } from './mock-text-ai-kpi-by-theme';
import { AIRLINE_DRIVER_NAMES } from './mock-driver-analysis';
import type { DriverAnalysisWidgetConfig } from './mock-ai-widgets';

export interface DriverOutcome {
  surveyId: number;
  rowId: string;
  label: string;
  answers: Array<{ score: number; label: string }>;
}

export interface DriverQuestionChoice {
  code: string;
  outcome: DriverOutcome;
  metric: TextAiKpiMetric;
}

const experienceQuestions: Omit<SurveyQuestion, 'id' | 'surveyId'>[] = [
  { code: 'CSAT1', text: 'Overall service satisfaction', type: 'CSAT',
    options: ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied'] },
  { code: 'CES1', text: 'Ease of resolving your request', type: 'CES',
    options: ['Very difficult', 'Difficult', 'Somewhat difficult', 'Neutral', 'Somewhat easy', 'Easy', 'Very easy'] },
  { code: 'R1', text: 'Likelihood of referring a colleague', type: 'Single Select', customScoreType: 'nps',
    options: Array.from({ length: 11 }, (_, i) => String(i)), answerScores: Array.from({ length: 11 }, (_, i) => i) },
  { code: 'R2', text: 'Rating of the most recent interaction', type: 'Single Select', customScoreType: 'csat',
    options: ['Very low', 'Low', 'Neutral', 'High', 'Very high'] },
];

function driverExamples(surveyId: number): SurveyQuestion[] {
  return experienceQuestions.map((question, i) => ({ ...question, surveyId, id: surveyId * 100 + 90 + i }));
}

export function driverSurveyQuestions(surveyId: number) {
  return [...getQuestionsBySurvey(surveyId), ...driverExamples(surveyId)];
}

function driverSources(surveyId: number, airline: boolean) {
  const survey = getQuestionsBySurvey(surveyId);
  const extra = driverExamples(surveyId);
  return {
    base: airline ? airlineQuestions(AIRLINE_DRIVER_NAMES) : adaptHeatmapQuestions(survey),
    extra: adaptHeatmapQuestions(extra),
    metadata: [...survey, ...extra],
  };
}

const nativeMetrics: Readonly<Partial<Record<string, TextAiKpiMetric>>> = {
  NPS: 'nps', CES: 'ces', CSAT: 'csat',
};

export function driverCatalog(surveyId: number, airline = false): DriverQuestionChoice[] {
  const { base, extra, metadata } = driverSources(surveyId, airline);
  return [...base, ...extra].flatMap(source => {
    const question = metadata.find(q => String(q.id) === source.id);
    const metric = question?.customScoreType ?? nativeMetrics[source.type] ?? 'mean';
    if (source.multiple || source.text || source.type === 'Rank order') return [];
    const answers = source.options.flatMap(option => option.score !== undefined && Number.isFinite(option.score)
      ? [{ score: option.score, label: option.label }] : []);
    if (answers.length !== source.options.length || new Set(answers.map(a => a.score)).size < 2) return [];
    return source.rows.map(row => ({
      code: source.code, metric,
      outcome: { surveyId, rowId: row.id, answers, label: row.label === source.label ? row.label : `${source.label} — ${row.label}` },
    }));
  });
}

export function selectedDrivers(choices: DriverQuestionChoice[], ids: string[]) {
  return choices.filter(({ outcome }) => ids.includes(outcome.rowId))
    .map(({ code, outcome }) => ({ id: outcome.rowId, code, name: outcome.label }));
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

export function formatRating(value: number | null, scoring: KpiScoring) {
  if (value === null) return '—';
  const percent = scoring.metric === 'csat' || (scoring.metric === 'ces' && scoring.cesCalculation === 'percent-easy');
  return value.toFixed(scoring.precision) + (percent ? '%' : '');
}

export function ratingRange(question: DriverOutcome, scoring: KpiScoring) {
  if (scoring.metric === 'nps' || (scoring.metric === 'ces' && scoring.cesCalculation === 'net-easy')) return [-100, 100];
  if (scoring.metric === 'csat' || (scoring.metric === 'ces' && scoring.cesCalculation === 'percent-easy')) return [0, 100];
  const scores = question.answers.flatMap(answer => outcomeValue(scoring, answer.score) ?? []);
  return [Math.min(...scores), Math.max(...scores)];
}

export function preparedDriverData(config: DriverAnalysisWidgetConfig, scoring: KpiScoring) {
  const outcome = config.outcome;
  if (!outcome) return null;
  const { base, extra } = driverSources(outcome.surveyId, outcome.rowId.startsWith('airline-') || config.airlineSample === true);
  const sources = [...base, ...extra];
  const catalog = driverCatalog(outcome.surveyId, outcome.rowId.startsWith('airline-') || config.airlineSample === true);
  const questions = config.drivers.map(driver => catalog.find(choice => choice.outcome.rowId === driver.id)?.outcome);
  if (questions.some(question => !question)) return null;
  const driverQuestions = questions.filter((question): question is DriverOutcome => question !== undefined);
  const driverRules = driverQuestions.map(question => config.driverScoring?.[question.rowId] ?? driverDefaultScoring(question, 'mean'));
  const scoreByOption = new Map(sources.flatMap(q => q.options.map(o => [o.id, o.score] as const)));
  // Keep the original paired responses stable when adding new example questions.
  const additionalResponses = createHeatmapResponses(extra);
  const responses = createHeatmapResponses(base).map((response, i) => ({
    ...response, answers: { ...response.answers, ...additionalResponses[i].answers },
  }));
  const rows: number[][] = [];
  for (const response of responses) {
    const scoreAt = (rowId: string) => scoreByOption.get(response.answers[rowId]?.[0]);
    const raw = scoreAt(outcome.rowId);
    const y = raw === undefined ? undefined : outcomeValue(scoring, raw);
    const xs = driverQuestions.map((question, index) => {
      const raw = scoreAt(question.rowId);
      return raw === undefined ? undefined : outcomeValue(driverRules[index], raw);
    });
    if (y !== undefined && xs.every((v): v is number => v !== undefined)) rows.push([y, ...xs]);
  }
  const ranges = driverQuestions.map((question, index) => ratingRange(question, driverRules[index]));
  const means = [scoring, ...driverRules].map((_, index) =>
    rows.length ? rows.reduce((sum, row) => sum + row[index], 0) / rows.length : null
  );
  return { rows, means, ranges, driverRules, total: responses.length };
}

/** Resolve pre-configuration widgets against their original survey codes and row labels. */
export function resolveDriverConfig(previous: DriverAnalysisWidgetConfig | undefined, surveyId: number, sampleNames: string[]): DriverAnalysisWidgetConfig | null {
  if (previous?.outcome) return previous;
  const eligible = driverCatalog(surveyId);
  const primary = eligible.find(item => previous
    ? item.code === previous.primaryQuestionCode && (item.outcome.label === previous.primaryQuestionText || item.outcome.label.endsWith(' — ' + previous.primaryQuestionText))
    : item.metric === 'nps');
  if (!primary) return null;
  if (!previous) {
    const questions = airlineQuestions(sampleNames);
    const target = questions[0];
    return {
      airlineSample: true, metric: 'nps', primaryQuestionCode: 'Q4', primaryQuestionText: target.label,
      outcome: { surveyId, rowId: target.rows[0].id, label: target.label, answers: target.options.map(o => ({ score: o.score!, label: o.label })) },
      drivers: questions.slice(1).map(q => ({ id: q.rows[0].id, code: q.code, name: q.label })),
    };
  }
  const drivers = previous.drivers.flatMap(d => {
    const item = eligible.find(item => item.code === d.code && (item.outcome.label === d.name || item.outcome.label.endsWith(' — ' + d.name)));
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
