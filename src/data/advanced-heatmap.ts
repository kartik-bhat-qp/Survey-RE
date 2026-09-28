import type { DashboardActiveFilter } from './mock-dashboard-filters';
import type { SurveyQuestion } from './mock-survey-questions';

export type AnalysisMode = 'segments' | 'distribution';
export const METRIC_FILTER_OPERATORS = [
  { id: 'lt', label: 'Below', symbol: '<' },
  { id: 'lte', label: 'At or below', symbol: '≤' },
  { id: 'gt', label: 'Above', symbol: '>' },
  { id: 'gte', label: 'At or above', symbol: '≥' },
  { id: 'between', label: 'Between (inclusive)', symbol: 'between' },
] as const;
export interface MetricFilter {
  enabled: boolean;
  operator: typeof METRIC_FILTER_OPERATORS[number]['id'];
  value: number | null;
  upper: number | null;
}
export const EMPTY_METRIC_FILTER: MetricFilter = { enabled: false, operator: 'lt', value: null, upper: null };
export function metricFilterError(filter: MetricFilter): string | null {
  if (filter.value === null || !Number.isFinite(filter.value)) return 'Enter a finite threshold value.';
  if (filter.operator === 'between') {
    if (filter.upper === null || !Number.isFinite(filter.upper)) return 'Enter both range values.';
    if (filter.upper < filter.value) return 'The upper value must be at least the lower value.';
  }
  return null;
}
export function isMetricFilterActive(config: AdvancedHeatmapConfig): boolean {
  return config.mode === 'distribution' && config.customMetric && Boolean(config.metricFilter?.enabled);
}
/** Filter calculated rows, not their source respondents. Never compare rounded display values. */
export function matchesMetricFilter(value: number | null, config: AdvancedHeatmapConfig): boolean {
  if (!isMetricFilterActive(config)) return true;
  const filter = config.metricFilter!;
  if (metricFilterError(filter) || value === null || !Number.isFinite(value)) return false;
  const threshold = filter.value!;
  switch (filter.operator) {
    case 'lt': return value < threshold;
    case 'lte': return value <= threshold;
    case 'gt': return value > threshold;
    case 'gte': return value >= threshold;
    case 'between': return value >= threshold && value <= filter.upper!;
    default: return false;
  }
}
export interface HeatmapOption { id: string; label: string; score?: number }
export interface HeatmapRow { id: string; label: string }
export interface HeatmapQuestion { id: string; code: string; label: string; type: string; rows: HeatmapRow[]; options: HeatmapOption[]; multiple: boolean; text: boolean }
export interface HeatmapResponse { id: string; answers: Record<string, string[]> }
export interface HeatmapLabelGroup { id: string; label: string; kind: 'question' | 'answer'; members: string[] }
export interface HeatmapRespondentFilter {
  name: string;
  criteria: { rowId: string; operator: 'Is' | 'Is not'; optionIds: string[] }[];
  match: 'all' | 'any';
}
export interface AdvancedHeatmapConfig {
  themeColor?: string;
  designType?: 'Dashboard' | 'Widget'; fontFamily?: string; fontSize?: number; sentimentColors?: string[];
  weighting?: 'Dashboard' | 'Widget' | 'None';
  overallAverage?: boolean; scoreRange?: 'Default' | '0–5' | '0–10';
  bands?: number; thresholds?: number[]; widgetStats?: boolean; statsResponseCount?: boolean; statsLabel?: string;
  hiddenSegments?: string[]; segmentAliases?: Record<string,string>;
  customSegments?: (HeatmapRespondentFilter & {id:string})[];
  showName?: boolean;
  filterType?: 'Dashboard' | 'Widget' | 'Combined' | 'None';
  widgetFilter?: HeatmapRespondentFilter;
  id: string; name: string; surveyId: number; selected: string[]; mode: AnalysisMode;
  segmentRow: string; showOverall: boolean; precision: number; display: 'percent' | 'count';
  base: 'respondents' | 'selections'; customMetric: boolean; metricLabel: string;
  weights: Record<string, number>; aliases: Record<string, string>; excluded: string[];
  reverse: string[]; palette: 'blue' | 'green' | 'sentiment'; showBases: boolean;
  matrixSummary: boolean;
  metricFilter?: MetricFilter;
  labelGroups?: HeatmapLabelGroup[];
  columnAliases?: Record<string, string>;
  excludedColumns?: string[];
  columnOrder?: string[];
  rowOrder?: string[];
}
export const ANALYSIS_MODES = [
  { id: 'segments' as const, title: 'Segment comparison', description: 'Compare each question’s mean score across groups of respondents. Columns are segments.' },
  { id: 'distribution' as const, title: 'Answer distribution', description: 'See how respondents answered each question. Columns are answer options; cells show percentages or counts.' },
];
export function adaptHeatmapQuestions(questions: SurveyQuestion[]): HeatmapQuestion[] {
  return questions.map(q => {
    const rank = q.type === 'Rank order';
    const labels = q.type === 'NPS' ? Array.from({ length: 11 }, (_, i) => String(i)) : rank ? (q.options ?? []).map((_, i) => `Rank ${i + 1}`) : q.type === 'Text' ? ['Helpful service', 'Slow delivery', 'Good value', 'Needs improvement'] : q.options ?? [];
    // Only explicitly ordered rating scales receive default scores. Category IDs are never scores.
    const rating = q.type === 'NPS' || rank || labels.join('|') === 'Poor|Average|Good|Excellent' || labels.join('|') === 'Very dissatisfied|Dissatisfied|Neutral|Satisfied|Very satisfied';
    return { id: String(q.id), code: q.code, label: q.text, type: q.type, multiple: q.type === 'Multiple Select', text: q.type === 'Text',
      rows: (q.matrixRows ?? (rank ? q.options : undefined) ?? [q.text]).map((label, i) => ({ id: `${q.id}:r${i}`, label })),
      options: labels.map((label, i) => ({ id: `${q.id}:o${i}`, label, score: rating ? (q.type === 'NPS' ? i : i + 1) : undefined })),
    };
  });
}
/** Deliberately synthetic, paired records shared by both analysis modes, including unanswered items. */
export function createHeatmapResponses(questions: HeatmapQuestion[], count = 120): HeatmapResponse[] {
  let seed = 41027;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  return Array.from({ length: count }, (_, n) => {
    const answers: Record<string, string[]> = {};
    for (const q of questions) {
      const ranking = q.options.map(o => o.id);
      for (let i = ranking.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [ranking[i], ranking[j]] = [ranking[j], ranking[i]]; }
      q.rows.forEach((row, index) => {
        if (!q.options.length || random() < 0.06) return;
        const pick = q.options[Math.floor(random() * q.options.length)].id;
        answers[row.id] = q.type === 'Rank order' ? [ranking[index]] : q.multiple ? [...new Set([pick, q.options[Math.floor(random() * q.options.length)].id])] : [pick];
      });
    }
    return { id: `demo-${n + 1}`, answers };
  });
}
export function createAdvancedHeatmapConfig(surveyId: number, name: string, selected: string[], mode: AnalysisMode, questions: HeatmapQuestion[], id: string): AdvancedHeatmapConfig {
  return { id, surveyId, name: name.trim() || 'Advanced Heatmap', selected, mode, segmentRow: questions.find(q => q.rows.some(r => selected.includes(r.id)) && q.options.some(o => o.score !== undefined))?.rows[0].id ?? questions[0]?.rows[0].id ?? '', showOverall: false, precision: 1, display: 'percent', base: 'respondents', customMetric: false, metricLabel: 'Custom metric', weights: {}, aliases: {}, excluded: [], reverse: [], palette: 'blue', showBases: false, matrixSummary: false };
}
export function toggleQuestionRows(selected: string[], question: HeatmapQuestion, checked: boolean): string[] {
  const ids = new Set(question.rows.map(r => r.id));
  return checked ? [...new Set([...selected, ...ids])] : selected.filter(id => !ids.has(id));
}
export function isHeatmapOptionExcluded(id: string, config: AdvancedHeatmapConfig): boolean {
  const index = id.match(/:o(\d+)$/)?.[1];
  return config.excluded.includes(id) || (index !== undefined && Boolean(config.excludedColumns?.includes(`option-${index}`)));
}
export function rowAnswers(response: HeatmapResponse, rowId: string, config: AdvancedHeatmapConfig): string[] {
  return (response.answers[rowId] ?? []).filter(id => !isHeatmapOptionExcluded(id, config));
}
export interface HeatmapCell { value: number | null; base: number; numerator: number; selections: number; reason?: 'weights-required' | 'no-data' }
export function scoreCell(responses: HeatmapResponse[], rowId: string, question: HeatmapQuestion, config: AdvancedHeatmapConfig, custom: boolean): HeatmapCell {
  const weights = question.options.filter(o => !isHeatmapOptionExcluded(o.id, config)).map(o => custom ? config.weights[o.id] : o.score);
  if (weights.some(w => w === undefined || !Number.isFinite(w))) {
    const base = responses.filter(r => rowAnswers(r, rowId, config).some(id => question.options.some(o => o.id === id))).length;
    return { value: null, base, numerator: 0, selections: base, reason: base ? 'weights-required' : 'no-data' };
  }
  const score = new Map(question.options.filter(o => !isHeatmapOptionExcluded(o.id, config)).map((o, i) => [o.id, weights[i]!]));
  const reversalWeights = custom ? weights : question.options.map(o=>o.score).filter((v): v is number=>v!==undefined && Number.isFinite(v));
  const low = Math.min(...reversalWeights as number[]), high = Math.max(...reversalWeights as number[]);
  const values = responses.flatMap(response => {
    const answers = rowAnswers(response, rowId, config).filter(id => score.has(id));
    if (!answers.length) return [];
    // Multi-select: one respondent contributes the mean of their selected answer weights.
    let value = answers.reduce((sum, id) => sum + score.get(id)!, 0) / answers.length;
    if (config.reverse.includes(question.id)) value = low + high - value;
    return [value];
  });
  const numerator = values.reduce((sum, value) => sum + value, 0);
  return { value: values.length ? numerator / values.length : null, base: values.length, numerator, selections: values.length };
}
export function distributionCell(responses: HeatmapResponse[], rowId: string, optionIds: string[], config: AdvancedHeatmapConfig): HeatmapCell {
  const answered = responses.map(r => rowAnswers(r, rowId, config)).filter(a => a.length);
  const selections = answered.reduce((sum, a) => sum + a.length, 0);
  const count = answered.filter(a => a.some(id => optionIds.includes(id))).length;
  const base = answered.length;
  const numerator = count;
  return { value: base ? config.display === 'count' ? numerator : 100 * numerator / base : null, base, numerator, selections };
}
export function segmentResponses(responses: HeatmapResponse[], rowId: string, optionId: string): HeatmapResponse[] {
  return responses.filter(response => response.answers[rowId]?.includes(optionId));
}
export function summaryCell(cells: HeatmapCell[]): HeatmapCell {
  if (cells.some(c => c.reason === 'weights-required')) {
    const base = cells.reduce((sum, c) => sum + c.base, 0);
    return { value: null, base, numerator: 0, selections: base, reason: 'weights-required' };
  }
  const valid = cells.filter(c => c.value !== null);
  const base = valid.reduce((sum, c) => sum + c.base, 0);
  const numerator = valid.reduce((sum, c) => sum + c.numerator, 0);
  return { value: base ? numerator / base : null, base, numerator, selections: base };
}

/** Shared columns align original option positions; exclusion never shifts later answers left. */
export function heatmapAnswerSlots(questions: HeatmapQuestion[], config: AdvancedHeatmapConfig) {
  const count = Math.max(0, ...questions.map(q => q.options.length));
  const sharedLabels = Array.from({length: count}, (_,i) => new Set(questions.flatMap(q=>q.options[i] ? [q.options[i].label] : [])).size).every(size=>size <= 1);
  return Array.from({ length: count }, (_, index) => {
    const key = `option-${index}`;
    const labels = [...new Set(questions.flatMap(q => q.options[index] ? [q.options[index].label] : []))];
    return { key, label: config.columnAliases?.[key] || (sharedLabels && labels.length === 1 ? labels[0] : `Option ${index + 1}`), index };
  });
}
function bySavedOrder<T extends { id: string }>(items: T[], order: string[] = []): T[] {
  return [...items].sort((a,b) => {
    const ai = order.indexOf(a.id), bi = order.indexOf(b.id);
    return (ai < 0 ? order.length : ai) - (bi < 0 ? order.length : bi);
  });
}
export function distributionColumns(questions: HeatmapQuestion[], config: AdvancedHeatmapConfig) {
  const slots = heatmapAnswerSlots(questions, config);
  const groups: HeatmapLabelGroup[] = []; // Merging is outside the current scope, including legacy settings.
  const emitted = new Set<string>();
  const columns = slots.flatMap(slot => {
    if (config.excludedColumns?.includes(slot.key)) return [];
    const group = groups.find(g => g.members.includes(slot.key));
    const id = group?.id ?? slot.key;
    if (emitted.has(id)) return [];
    emitted.add(id);
    const members = group ? slots.filter(s => group.members.includes(s.key) && !config.excludedColumns?.includes(s.key)) : [slot];
    const questionOptions: Record<string, string[]> = {};
    for (const q of questions) {
      const ids = members.flatMap(s => q.options[s.index] && !isHeatmapOptionExcluded(q.options[s.index].id, config) ? [q.options[s.index].id] : []);
      if (ids.length) questionOptions[q.id] = ids;
    }
    return [{ id, key: id, label: group?.label || slot.label, questionOptions }];
  });
  return bySavedOrder(columns, config.columnOrder);
}
export function poolDistributionCells(cells: HeatmapCell[], config: AdvancedHeatmapConfig): HeatmapCell {
  const base = cells.reduce((sum, cell) => sum + cell.base, 0);
  const numerator = cells.reduce((sum, cell) => sum + cell.numerator, 0);
  return { value: base ? config.display === 'percent' ? 100 * numerator / base : numerator : null, base, numerator, selections: cells.reduce((sum, cell) => sum + cell.selections, 0) };
}

/** Group and summary scores pool source answers before result filtering. */
export function heatmapResultRows(questions: HeatmapQuestion[], responses: HeatmapResponse[], config: AdvancedHeatmapConfig) {
  const entries = questions.flatMap(question => {
    const rows = question.rows.filter(row => config.selected.includes(row.id) && !config.excluded.includes(row.id));
    if (!rows.length) return [];
    const singles = rows.map(row => ({ id: row.id, label: config.aliases[row.id] || row.label, rows: [row], question, sources: [{ question, row }], summary: false, grouped: false }));
    if (config.matrixSummary && question.rows.length > 1) singles.push({ id: `${question.id}-summary`, label: 'Total', rows, question, sources: rows.map(row => ({ question, row })), summary: true, grouped: false });
    return singles;
  });
  const groups: HeatmapLabelGroup[] = [];
  const emitted = new Set<string>();
  const grouped = entries.flatMap(entry => {
    const group = !entry.summary && groups.find(g => g.members.includes(entry.id));
    if (!group) return [entry];
    if (emitted.has(group.id)) return [];
    emitted.add(group.id);
    const sources = entries.filter(e => !e.summary && group.members.includes(e.id)).flatMap(e => e.sources);
    return [{ ...entry, id: group.id, label: group.label, sources, rows: sources.map(s => s.row), grouped: true }];
  });
  return bySavedOrder(grouped, config.rowOrder).map(entry => ({ ...entry, metric: summaryCell(entry.sources.map(({question,row}) => scoreCell(responses, row.id, question, config, config.customMetric))) }));
}

export function createDefaultAdvancedHeatmap(questions: HeatmapQuestion[], surveyId = 1): AdvancedHeatmapConfig {
  const selected = questions.filter(q => ['Q6','Q11','Q13'].includes(q.code)).flatMap(q => q.rows.map(r => r.id));
  return createAdvancedHeatmapConfig(surveyId, 'Advanced Heatmap', selected, 'distribution', questions, 'advanced-heatmap-default');
}

/** Matrix parents pool the original included statements; collapsing and filtering never recalculate them. */
export function heatmapRowGroups(questions: HeatmapQuestion[], responses: HeatmapResponse[], config: AdvancedHeatmapConfig) {
  const rows = heatmapResultRows(questions, responses, { ...config, matrixSummary: false });
  const emitted = new Set<string>();
  return rows.flatMap(entry => {
    const question = entry.question;
    const isMatrix = question.type === 'Matrix Uni choice' || question.type === 'Flex Matrix';
    const belongs = (row: typeof entry) => row.sources.every(source => source.question.id === question.id);
    if (!isMatrix || !belongs(entry)) return matchesMetricFilter(entry.metric.value, config) ? [{ entry, children: [] as typeof rows, contextOnly: false }] : [];
    if (emitted.has(question.id)) return [];
    emitted.add(question.id);
    const children = rows.filter(belongs);
    const sources = children.flatMap(child => child.sources);
    const parent = { ...entry, id: `${question.id}-parent`, label: config.aliases[question.id] || question.label, rows: sources.map(s => s.row), sources, grouped: false, summary: true, metric: summaryCell(sources.map(s => scoreCell(responses, s.row.id, s.question, config, config.customMetric))) };
    const matchingChildren = children.filter(child => matchesMetricFilter(child.metric.value, config));
    const parentMatches = matchesMetricFilter(parent.metric.value, config);
    return parentMatches || matchingChildren.length ? [{ entry: parent, children: matchingChildren, contextOnly: !parentMatches }] : [];
  });
}


export function heatmapRespondentFilterError(filter: HeatmapRespondentFilter, questions: HeatmapQuestion[]): string | null {
  if (!filter.name.trim()) return 'Enter a filter name.';
  if (!filter.criteria.length) return 'Add at least one condition.';
  if (filter.criteria.some(c => {
    const q = questions.find(q => q.rows.some(r => r.id === c.rowId));
    return !q || !['Is', 'Is not'].includes(c.operator) || !c.optionIds.length || c.optionIds.some(id => !q.options.some(o => o.id === id));
  })) return 'Select a question and valid answers for every condition.';
  return null;
}
/** Respondent filters run before segment construction, distributions, and custom metrics. */
export function filterHeatmapResponses(responses: HeatmapResponse[], questions: HeatmapQuestion[], config: AdvancedHeatmapConfig, dashboardFilter?: DashboardActiveFilter): { responses: HeatmapResponse[]; error: string | null } {
  const scope = config.filterType ?? 'Dashboard';
  if ((scope === 'Dashboard' || scope === 'Combined') && dashboardFilter?.hasCriteria) return { responses: [], error: 'Data unavailable for the active dashboard filter.' };
  if ((scope !== 'Widget' && scope !== 'Combined') || !config.widgetFilter) return { responses, error: null };
  const error = heatmapRespondentFilterError(config.widgetFilter, questions);
  if (error) return { responses: [], error };
  const filter = config.widgetFilter;
  return { error: null, responses: responses.filter(response => {
    const checks = filter.criteria.map(condition => {
      const answers = response.answers[condition.rowId] ?? [];
      if (!answers.length) return false;
      const matches = answers.some(id => condition.optionIds.includes(id));
      return condition.operator === 'Is' ? matches : !matches;
    });
    return filter.match === 'any' ? checks.some(Boolean) : checks.every(Boolean);
  }) };
}

/** Regular Heat Map scaling: native mean / native maximum × target maximum. */
export function segmentScoreCell(responses: HeatmapResponse[], rowId: string, question: HeatmapQuestion, config: AdvancedHeatmapConfig): HeatmapCell {
  const cell = scoreCell(responses, rowId, question, config, config.customMetric);
  if (cell.value === null || config.customMetric || !config.scoreRange || config.scoreRange === 'Default') return cell;
  const maximum = Math.max(...question.options.map(o => o.score ?? 0));
  if (maximum <= 0) return { ...cell, value: null, reason: 'no-data' };
  const factor = (config.scoreRange === '0–10' ? 10 : 5) / maximum;
  return {...cell, value:cell.value * factor, numerator:cell.numerator * factor};
}
/** Overall average gives each selected question one contribution; matrix children are pooled first. */
export function segmentOverallAverage(responses: HeatmapResponse[], questions: HeatmapQuestion[], config: AdvancedHeatmapConfig): HeatmapCell {
  const cells = questions.map(q => summaryCell(q.rows.filter(r => config.selected.includes(r.id) && !config.excluded.includes(r.id)).map(r => segmentScoreCell(responses,r.id,q,config)))).filter(c => c.value !== null);
  const numerator = cells.reduce((sum,c) => sum + c.value!,0);
  return {value:cells.length ? numerator/cells.length : null,base:cells.length,numerator,selections:cells.length};
}
export function segmentBandIndex(value: number, maximum: number, thresholds: number[] = [20,40,60,80]): number {
  const percent = maximum > 0 ? value / maximum * 100 : 0;
  const index = thresholds.findIndex(boundary => percent <= boundary);
  return index < 0 ? thresholds.length : index;
}
export function advancedHeatmapSegments(responses: HeatmapResponse[], questions: HeatmapQuestion[], config: AdvancedHeatmapConfig) {
  const q = questions.find(q => q.rows.some(r => r.id === config.segmentRow));
  const segments = (q?.options ?? []).map(o => ({id:o.id,label:config.segmentAliases?.[o.id] || o.label,responses:segmentResponses(responses,config.segmentRow,o.id)}));
  for (const segment of config.customSegments ?? []) {
    const result = filterHeatmapResponses(responses,questions,{...config,filterType:'Widget',widgetFilter:segment});
    segments.push({id:segment.id,label:segment.name,responses:result.responses});
  }
  const visible = segments.filter(s => !config.hiddenSegments?.includes(s.id));
  if (config.showOverall) visible.unshift({id:'overall',label:'Overall',responses});
  return visible;
}
