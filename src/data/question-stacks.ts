/** Question Stack domain rules. All response rows in this prototype are synthetic. */
export interface StackQuestion {
  id: number; surveyId: number; code: string; text: string; type: string; options?: string[];
}
export interface MetricGroup {
  id: string; name: string; questionIds: number[];
  labels: string[]; scores: number[];
  /** source option index -> canonical option index, -1 means not mapped */
  mappings: Record<string, number[]>;
}
export interface QuestionStack {
  id: string; name: string; surveyId: number; surveyName: string; createdOn: string;
  groups: MetricGroup[];
}
export type StackChart = 'bar' | 'gauge' | 'semi-circle' | 'stat-metric' | 'tabular' | 'heat-map';
export interface QuestionStackWidgetConfig { tabId?: string; stackId: string; groupIds: string[]; chart: StackChart; }
export const STACK_CHARTS: {id: StackChart; name: string}[] = [
  {id:'bar',name:'Bar'}, {id:'gauge',name:'Gauge'}, {id:'semi-circle',name:'Semi-circle'},
  {id:'stat-metric',name:'Numeric display'}, {id:'tabular',name:'Statistical table'}, {id:'heat-map',name:'Heatmap'},
];
export const STACK_DEMO_SURVEY_ID = 9901;
const scale = ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied'];
export const STACK_DEMO_QUESTIONS: StackQuestion[] = Array.from({length: 24}, (_, i) => ({
  id: 9901000 + i, surveyId: STACK_DEMO_SURVEY_ID, code: `CSAT${i + 1}`, type: 'Single Select',
  text: `How satisfied are you with ${['support speed','staff helpfulness','issue resolution','product quality','ease of use','value for money','delivery speed','order accuracy','onboarding','communication','reliability','availability','billing','returns','documentation','self-service','mobile experience','website navigation','account management','follow-up','accessibility','personalization','security','overall service'][i]}?`,
  options: i === 1 ? [...scale].reverse() : i === 2 ? ['Very poor','Poor','Fair','Good','Excellent'] : [...scale],
}));
export function isStackEligible(q: StackQuestion): boolean {
  return (q.type === 'Single Select' || (q.type === 'NPS' && q.options?.length === 11)) && (q.options?.length ?? 0) >= 2;
}
export function compatibleStackQuestions(questions: StackQuestion[], ids: number[]): StackQuestion[] {
  const first = questions.find(q => ids.includes(q.id));
  return questions.filter(q => isStackEligible(q) && (!first || q.options!.length === first.options!.length));
}
export function autoMapAnswers(source: string[], labels: string[]): number[] {
  const used = new Set<number>();
  return source.map(option => {
    const index = labels.findIndex(label => label.trim().toLowerCase() === option.trim().toLowerCase());
    if (index < 0 || used.has(index)) return -1;
    used.add(index); return index;
  });
}
export function setAnswerMapping(values: number[], sourceIndex: number, targetIndex: number): number[] {
  return values.map((value, index) => index === sourceIndex ? targetIndex : targetIndex >= 0 && value === targetIndex ? -1 : value);
}
export function validateMetricGroup(group: MetricGroup, questions: StackQuestion[], surveyId: number): string | null {
  if (!group.name.trim()) return 'Enter a metric group name.';
  if (group.questionIds.length < 2) return 'Please select at least 2 questions.';
  if (group.questionIds.length > 20) return 'Only 20 questions can be stacked within a metric group.';
  if (new Set(group.questionIds).size !== group.questionIds.length) return 'Each question can appear only once in a metric group.';
  if (group.labels.length < 2 || group.labels.some(label => !label.trim()) || new Set(group.labels.map(label => label.trim().toLowerCase())).size !== group.labels.length) return 'Enter unique, non-empty common answer labels.';
  if (group.scores.length !== group.labels.length || group.scores.some(score => !Number.isFinite(score))) return 'Enter a numeric score for every common answer.';
  for (const id of group.questionIds) {
    const q = questions.find(question => question.id === id);
    if (!q || q.surveyId !== surveyId || !isStackEligible(q) || q.options!.length !== group.labels.length) return 'Select compatible questions from the same survey.';
    const mapping = group.mappings[id];
    if (!mapping || mapping.length !== group.labels.length || mapping.some(index => !Number.isInteger(index) || index < 0 || index >= group.labels.length) || new Set(mapping).size !== group.labels.length) return 'Map every answer once to the common scale before saving.';
  }
  return null;
}
export interface StackResponse { id: string; date: string; status: 'completed' | 'incomplete'; answers: Record<string, number | null>; }
export function syntheticStackResponses(questions: StackQuestion[]): StackResponse[] {
  return Array.from({length: 120}, (_, i) => ({
    id: `demo-${i + 1}`, date: `2026-09-${String(i % 28 + 1).padStart(2,'0')}`, status: i % 11 === 0 ? 'incomplete' : 'completed',
    answers: Object.fromEntries(questions.map(q => [q.id, (i + q.id) % 9 === 0 ? null : ((i * 7 + q.id * 3 + Math.floor(i / 5)) % (q.options?.length || 1))])),
  }));
}
export function poolMetricGroup(group: MetricGroup, rows: StackResponse[]) {
  const counts = group.labels.map(() => 0); const values: number[] = []; const respondents = new Set<string>();
  for (const row of rows) for (const id of group.questionIds) {
    const answer = row.answers[id];
    if (answer === null || answer === undefined) continue;
    const target = group.mappings[id]?.[answer];
    if (target === undefined || target < 0 || target >= counts.length) continue;
    counts[target]++; values.push(group.scores[target]); respondents.add(row.id);
  }
  const n = values.length;
  const mean = n ? values.reduce((a,b) => a+b, 0) / n : null;
  const variance = n > 1 ? values.reduce((sum,v) => sum + (v - mean!) ** 2, 0) / (n - 1) : null;
  const sd = variance === null ? null : Math.sqrt(variance);
  const se = sd === null ? null : sd / Math.sqrt(n);
  return {n, respondents:respondents.size, counts, mean, variance, sd, se,
    ci: mean !== null && se !== null ? [mean - 1.96 * se, mean + 1.96 * se] : null};
}
export function demoQuestionStack(): QuestionStack {
  const questions = STACK_DEMO_QUESTIONS.slice(0, 2);
  return {id:'question-demo',name:'Support satisfaction',surveyId:STACK_DEMO_SURVEY_ID,surveyName:'Customer experience — Question Stack demo',createdOn:'2026-09-30',groups:[{
    id:'support',name:'Support satisfaction',questionIds:questions.map(q=>q.id),labels:[...scale],scores:[1,2,3,4,5],mappings:Object.fromEntries(questions.map(q=>[q.id,autoMapAnswers(q.options!,scale)])),
  }]};
}
