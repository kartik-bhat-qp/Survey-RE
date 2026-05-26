export type QuotaType = 'Question Based' | 'Advanced' | 'Criteria based';

export interface QuotaOption {
  id: string;
  label: string;
  target: number;
  current?: number;
}

export interface AdvanceQuota {
  id: string;
  name: string;
  quotaType: QuotaType;
  description: string;
  quotaGroup: string;
  multipleQuotaHandling: string;
  target: number;
  current?: number;
  /** For Question Based quotas, the question code (e.g. Q1). */
  questionCode?: string;
  /** For Question Based quotas, the full question text. */
  questionText?: string;
  /** For Question Based quotas, per-option targets shown as expandable child rows. */
  options?: QuotaOption[];
}

/** Row representation including expanded option sub-rows. */
export interface AdvanceQuotaRow extends AdvanceQuota {
  isOption?: boolean;
  parentId?: string;
  optionLabel?: string;
}

function buildQuestionBasedQuota(params: {
  id: string;
  questionCode: string;
  questionText: string;
  quotaGroup: string;
  multipleQuotaHandling: string;
  options: QuotaOption[];
}): AdvanceQuota {
  const { id, questionCode, questionText, quotaGroup, multipleQuotaHandling, options } = params;
  const target = options.reduce((sum, opt) => sum + opt.target, 0);
  const sumCurrent = options.reduce(
    (sum, opt) => sum + (opt.current ?? 0),
    0
  );
  const hasAnyCurrent = options.some((opt) => opt.current !== undefined);
  return {
    id,
    name: questionText,
    quotaType: 'Question Based',
    description: `Options in ${questionCode} ${questionText}`,
    quotaGroup,
    multipleQuotaHandling,
    target,
    current: hasAnyCurrent ? sumCurrent : undefined,
    questionCode,
    questionText,
    options,
  };
}

export const MOCK_ADVANCE_QUOTAS: AdvanceQuota[] = [
  buildQuestionBasedQuota({
    id: 'quota-q1-gender',
    questionCode: 'Q1',
    questionText: 'What is your gender?',
    quotaGroup: 'NA',
    multipleQuotaHandling: 'NA',
    options: [
      { id: 'q1-male', label: 'Male', target: 100, current: 64 },
      { id: 'q1-female', label: 'Female', target: 100, current: 35 },
      { id: 'q1-other', label: 'Other', target: 50, current: 12 },
      { id: 'q1-na', label: 'NA', target: 10, current: 0 },
    ],
  }),
  {
    id: 'quota-2',
    name: '[Q1] Gender - Female',
    quotaType: 'Criteria based',
    description: 'Selected "Female" in [Q1] Gender',
    quotaGroup: 'NA',
    multipleQuotaHandling: 'NA',
    target: 100,
    current: 35,
  },
  {
    id: 'quota-3',
    name: 'Male who drink',
    quotaType: 'Advanced',
    description:
      'Selected "Male" in [Q1] Gender and beer is [Q10] "Which beverage do you prefer most often on weekends?"',
    quotaGroup: 'Alcohol consumer',
    multipleQuotaHandling: 'Least filled',
    target: 120,
    current: 80,
  },
  buildQuestionBasedQuota({
    id: 'quota-q5-age',
    questionCode: 'Q5',
    questionText: 'What is your age?',
    quotaGroup: 'NA',
    multipleQuotaHandling: 'NA',
    options: [
      { id: 'q5-under-18', label: 'Under 18', target: 20, current: 4 },
      { id: 'q5-18-24', label: '18-24', target: 75, current: 75 },
      { id: 'q5-25-34', label: '25-34', target: 90, current: 42 },
      { id: 'q5-35-44', label: '35-44', target: 80, current: 21 },
      { id: 'q5-45-54', label: '45-54', target: 60 },
      { id: 'q5-55-64', label: '55-64', target: 40 },
      { id: 'q5-above-64', label: 'Above 64', target: 25 },
    ],
  }),
  {
    id: 'quota-6',
    name: 'Female non-drinkers in Northeast region',
    quotaType: 'Advanced',
    description: 'Selected "Female" in [Q1] Gender and "Never" in [Q12] Alcohol frequency',
    quotaGroup: 'Regional panel',
    multipleQuotaHandling: 'Priority order',
    target: 50,
    current: 12,
  },
  {
    id: 'quota-7',
    name: '[Q3] Employment - Full time',
    quotaType: 'Criteria based',
    description: 'Selected "Full time" in [Q3] Employment status',
    quotaGroup: 'NA',
    multipleQuotaHandling: 'NA',
    target: 200,
    current: 188,
  },
  buildQuestionBasedQuota({
    id: 'quota-q8-brand',
    questionCode: 'Q8',
    questionText: 'Primary brand awareness',
    quotaGroup: 'Brand tracker',
    multipleQuotaHandling: 'Least filled',
    options: [
      { id: 'q8-competitor-a', label: 'Competitor A', target: 60, current: 24 },
      { id: 'q8-competitor-b', label: 'Competitor B', target: 50, current: 18 },
      { id: 'q8-our-brand', label: 'Our brand', target: 80, current: 35 },
      { id: 'q8-none', label: 'None of the above', target: 10 },
    ],
  }),
  {
    id: 'quota-9',
    name: 'High-income household with children under 12',
    quotaType: 'Advanced',
    description: 'Income bracket above $100K and selected "Yes" in [Q15] Children at home',
    quotaGroup: 'Household segment',
    multipleQuotaHandling: 'Least filled',
    target: 40,
    current: 9,
  },
  {
    id: 'quota-10',
    name: '[Q2] Region - West Coast metropolitan areas only',
    quotaType: 'Criteria based',
    description: 'Selected "West" in [Q2] Region with metro DMA filter applied',
    quotaGroup: 'NA',
    multipleQuotaHandling: 'NA',
    target: 110,
    current: 67,
  },
];

/** Flattens quotas with expanded question-based options into table rows. */
export function flattenQuotasForTable(
  quotas: AdvanceQuota[],
  expandedIds: ReadonlySet<string>
): AdvanceQuotaRow[] {
  const rows: AdvanceQuotaRow[] = [];
  for (const quota of quotas) {
    rows.push(quota);
    if (!quota.options || !expandedIds.has(quota.id)) continue;
    for (const option of quota.options) {
      rows.push({
        ...quota,
        id: `${quota.id}__${option.id}`,
        isOption: true,
        parentId: quota.id,
        optionLabel: option.label,
        name: option.label,
        description: '',
        quotaType: quota.quotaType,
        quotaGroup: '',
        multipleQuotaHandling: '',
        target: option.target,
        current: option.current,
        questionCode: quota.questionCode,
        questionText: quota.questionText,
        options: undefined,
      });
    }
  }
  return rows;
}

export const ADVANCE_QUOTA_TYPE_OPTIONS: QuotaType[] = [
  'Question Based',
  'Advanced',
  'Criteria based',
];

export function getAdvanceQuotaGroupOptions(): string[] {
  return Array.from(new Set(MOCK_ADVANCE_QUOTAS.map((quota) => quota.quotaGroup))).sort();
}
