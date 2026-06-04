import type { AdvanceQuota, QuotaOption } from '@/data/mock-advance-quotas';
import {
  buildCombinationRows,
  buildCrossVariableColumns,
  buildCrossVariableQuotas,
  buildInitialCrossVariableMatrix,
  buildPrimaryDimensions,
  type CrossVariableQuotaSaveResult,
} from '@/data/mock-cross-variable-quota';
import { getQuestionsBySurvey, type SurveyQuestion } from '@/data/mock-survey-questions';

export const QUOTA_AI_PROMPT_SUGGESTIONS = [
  'Set gender quotas at 50% male and 50% female',
  'Create cross variable quotas for car type and brand by gender and age',
  'Add age quotas with 100 completes per age band',
  'Create a criteria quota for respondents in Maharashtra who are 25–34',
] as const;

export const QUOTA_AI_EXAMPLE_PROMPTS = [
  {
    id: 'gender-split',
    text: 'Set gender quotas at 50% male and 50% female for a sample of 200',
  },
  {
    id: 'cross-matrix',
    text: 'Create cross variable quotas for car type and brand by gender and age',
  },
  {
    id: 'age-bands',
    text: 'Add age quotas with 100 completes per age band',
  },
] as const;

export const QUOTA_AI_CAPABILITY_PILLS = [
  'Add question based quotas',
  'Build cross variable matrices',
  'Set criteria based screening rules',
  'Balance quota targets across options',
  'Import or adjust fill counts',
] as const;

export const QUOTA_AI_GREETING =
  "Hi! I'm your quota agent. I can help you build and configure quotas for this survey. Try asking me to:";

export const QUOTA_AI_THINKING_STEPS = [
  'Reviewing survey questions…',
  'Matching variables to your request…',
  'Calculating quota targets…',
  'Building quota structure…',
] as const;

export type QuotaAiGenerationResult =
  | { kind: 'question-based'; quotas: AdvanceQuota[]; summary: string }
  | { kind: 'cross-variable'; saveResult: CrossVariableQuotaSaveResult; summary: string }
  | { kind: 'criteria'; quotas: AdvanceQuota[]; summary: string };

function evenCountDistribute(count: number, total: number): number[] {
  if (count === 0) return [];
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, i) => (i < remainder ? base + 1 : base));
}

function findQuestions(prompt: string, questions: SurveyQuestion[]): SurveyQuestion[] {
  const lower = prompt.toLowerCase();
  const matches: SurveyQuestion[] = [];

  const rules: { keywords: string[]; codes: string[] }[] = [
    { keywords: ['gender', 'male', 'female'], codes: ['Q1'] },
    { keywords: ['age', '18-24', '25-34'], codes: ['Q2'] },
    { keywords: ['car', 'sedan', 'suv', 'hatchback', 'vehicle'], codes: ['Q2b'] },
    { keywords: ['brand', 'maruti', 'hyundai', 'tata'], codes: ['Q2c'] },
    { keywords: ['district', 'west bengal', 'kolkata'], codes: ['Q2a'] },
    { keywords: ['state', 'maharashtra', 'karnataka'], codes: ['Q14'] },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => lower.includes(keyword))) {
      for (const code of rule.codes) {
        const question = questions.find((q) => q.code === code);
        if (question && !matches.some((m) => m.id === question.id)) {
          matches.push(question);
        }
      }
    }
  }

  return matches;
}

function buildQuestionBasedQuota(
  question: SurveyQuestion,
  quotaGroup: string,
  now: number,
  index: number,
  prompt: string
): AdvanceQuota | null {
  const options = question.options ?? [];
  if (options.length === 0) return null;

  const lower = prompt.toLowerCase();
  let optionTargets: QuotaOption[];

  if (question.code === 'Q1' && (lower.includes('50') || lower.includes('equal'))) {
    const half = Math.floor(100 / Math.min(2, options.length));
    optionTargets = options.map((label, idx) => ({
      id: `ai-opt-${idx}`,
      label,
      target: idx < 2 ? half : 0,
      current: 0,
    }));
  } else {
    const distributed = evenCountDistribute(options.length, 100);
    optionTargets = options.map((label, idx) => ({
      id: `ai-opt-${idx}`,
      label,
      target: distributed[idx] ?? 0,
      current: 0,
    }));
  }

  const totalTarget = optionTargets.reduce((sum, option) => sum + option.target, 0);

  return {
    id: `ai-q-${now}-${index}`,
    name: question.text,
    quotaType: 'Question Based',
    description: `AI-generated · Options in ${question.code} ${question.text}`,
    quotaGroup,
    multipleQuotaHandling: 'NA',
    target: totalTarget,
    current: 0,
    questionCode: question.code,
    questionText: question.text,
    questionQuotaScope: 'max-count',
    options: optionTargets.filter((option) => option.target > 0),
  };
}

function buildCriteriaQuota(prompt: string, quotaGroup: string, now: number): AdvanceQuota {
  const lower = prompt.toLowerCase();
  const state = lower.includes('maharashtra')
    ? 'Maharashtra'
    : lower.includes('karnataka')
      ? 'Karnataka'
      : 'Maharashtra';
  const ageBand = lower.includes('25') ? '25-34' : '18-24';

  return {
    id: `ai-criteria-${now}`,
    name: 'AI criteria quota',
    quotaType: 'Criteria based',
    description: `[Q14] is "${state}" AND [Q2] is "${ageBand}" · Checked after [Q14]`,
    quotaGroup,
    multipleQuotaHandling: 'NA',
    target: 100,
    current: 0,
    criterionBlocks: [
      {
        name: 'AI criteria quota',
        conditions: [
          {
            source: 'Question',
            questionCode: 'Q14',
            questionText: 'Please select the state you live in.',
            subject: 'Please select the state you live in.',
            operator: 'is',
            value: state,
          },
          {
            source: 'Question',
            questionCode: 'Q2',
            questionText: 'What is your age?',
            subject: 'What is your age?',
            operator: 'is',
            value: ageBand,
            connector: 'AND',
          },
        ],
      },
    ],
    quotaChecks: [{ questionCode: 'Q14', questionText: 'Please select the state you live in.' }],
  };
}

function wantsCrossVariable(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    lower.includes('cross variable') ||
    lower.includes('cross-variable') ||
    lower.includes('matrix') ||
    (lower.includes('car') && (lower.includes('gender') || lower.includes('age'))) ||
    (lower.includes('brand') && lower.includes('gender'))
  );
}

function wantsCriteria(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    lower.includes('criteria') ||
    lower.includes('rule') ||
    lower.includes('screen') ||
    (lower.includes('maharashtra') && lower.includes('age'))
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function generateQuotasFromAiPrompt(
  prompt: string,
  surveyId: number
): Promise<QuotaAiGenerationResult> {
  await delay(1600);

  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new Error('Describe the quotas you want to create.');
  }

  const questions = getQuestionsBySurvey(surveyId);
  const quotaGroup = 'NA';
  const now = Date.now();

  if (wantsCrossVariable(trimmed)) {
    const primaryQuestions = [
      questions.find((q) => q.code === 'Q2b'),
      questions.find((q) => q.code === 'Q2c'),
    ].filter((q): q is SurveyQuestion => Boolean(q));

    const secondaryQuestions = [
      questions.find((q) => q.code === 'Q1'),
      questions.find((q) => q.code === 'Q2'),
    ].filter((q): q is SurveyQuestion => Boolean(q));

    const primaryDimensions = buildPrimaryDimensions(primaryQuestions);
    const combinationRows = buildCombinationRows(primaryDimensions);
    const columns = buildCrossVariableColumns(secondaryQuestions);
    const matrix = buildInitialCrossVariableMatrix(combinationRows, columns);
    const saveResult = buildCrossVariableQuotas(
      combinationRows,
      columns,
      matrix,
      quotaGroup
    );

    return {
      kind: 'cross-variable',
      saveResult,
      summary: `Created a cross variable matrix with ${saveResult.quotas.length} primary combinations across gender and age.`,
    };
  }

  if (wantsCriteria(trimmed)) {
    const quota = buildCriteriaQuota(trimmed, quotaGroup, now);
    return {
      kind: 'criteria',
      quotas: [quota],
      summary: 'Created a criteria based quota from your screening rules.',
    };
  }

  const matched = findQuestions(trimmed, questions);
  const targetQuestions =
    matched.length > 0
      ? matched
      : [questions.find((q) => q.code === 'Q1'), questions.find((q) => q.code === 'Q2')].filter(
          (q): q is SurveyQuestion => Boolean(q)
        );

  const quotas = targetQuestions
    .map((question, index) => buildQuestionBasedQuota(question, quotaGroup, now, index, trimmed))
    .filter((quota): quota is AdvanceQuota => quota !== null);

  if (quotas.length === 0) {
    throw new Error('No matching survey questions found for this request.');
  }

  return {
    kind: 'question-based',
    quotas,
    summary: `Created ${quotas.length} question based ${quotas.length === 1 ? 'quota' : 'quotas'}.`,
  };
}
