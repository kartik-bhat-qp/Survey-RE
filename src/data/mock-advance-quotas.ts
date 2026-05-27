export type QuotaType = 'Question Based' | 'Advanced' | 'Criteria based';

export interface AdvanceQuotaRuleCondition {
  source: string;
  questionCode?: string;
  questionText?: string;
  subject: string;
  operator: string;
  value: string;
  valueEnd?: string;
  connector?: 'AND' | 'OR';
}

export interface AdvanceQuotaCriterionBlock {
  name: string;
  conditions: AdvanceQuotaRuleCondition[];
}

export interface AdvanceQuotaCheckPoint {
  questionCode: string;
  questionText: string;
}

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
  /** Computed as `(current / target) * 100` for sorting / display. */
  completionPct?: number;
  /** For Question Based quotas, the question code (e.g. Q1). */
  questionCode?: string;
  /** For Question Based quotas, the full question text. */
  questionText?: string;
  /** For Question Based quotas, per-option targets shown as expandable child rows. */
  options?: QuotaOption[];
  /** Structured criteria rules for view / detail surfaces. */
  criterionBlocks?: AdvanceQuotaCriterionBlock[];
  /** When quota is evaluated in the survey flow. */
  quotaChecks?: AdvanceQuotaCheckPoint[];
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
    criterionBlocks: [
      {
        name: 'Male who drink',
        conditions: [
          {
            source: 'Question',
            questionCode: 'Q1',
            questionText: 'What is your gender?',
            subject: 'What is your gender?',
            operator: 'is',
            value: 'Male',
          },
          {
            source: 'Question',
            questionCode: 'Q10',
            questionText:
              'Which beverage do you prefer most often on weekends?',
            subject:
              'Which beverage do you prefer most often on weekends?',
            operator: 'is',
            value: 'Beer',
            connector: 'AND',
          },
        ],
      },
    ],
    quotaChecks: [
      {
        questionCode: 'Q1',
        questionText: 'What is your gender?',
      },
      {
        questionCode: 'Q10',
        questionText:
          'Which beverage do you prefer most often on weekends?',
      },
    ],
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
    criterionBlocks: [
      {
        name: 'Female non-drinkers in Northeast region',
        conditions: [
          {
            source: 'Question',
            questionCode: 'Q1',
            questionText: 'What is your gender?',
            subject: 'What is your gender?',
            operator: 'is',
            value: 'Female',
          },
          {
            source: 'Question',
            questionCode: 'Q12',
            questionText: 'How often do you consume alcohol?',
            subject: 'How often do you consume alcohol?',
            operator: 'is',
            value: 'Never',
            connector: 'AND',
          },
          {
            source: 'Geo Location',
            subject: 'Geo Location',
            operator: 'contains',
            value: 'Northeast',
            connector: 'AND',
          },
        ],
      },
    ],
    quotaChecks: [
      { questionCode: 'Q12', questionText: 'How often do you consume alcohol?' },
    ],
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
    criterionBlocks: [
      {
        name: 'High-income household with children under 12',
        conditions: [
          {
            source: 'System Variable',
            subject: 'Household income',
            operator: 'is greater than',
            value: '$100,000',
          },
          {
            source: 'Question',
            questionCode: 'Q15',
            questionText: 'Do you have children under 12 at home?',
            subject: 'Do you have children under 12 at home?',
            operator: 'is',
            value: 'Yes',
            connector: 'AND',
          },
        ],
      },
    ],
    quotaChecks: [
      {
        questionCode: 'Q15',
        questionText: 'Do you have children under 12 at home?',
      },
    ],
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

/** User-created quotas removed from the dashboard (cleared from localStorage on load). */
export const REMOVED_DASHBOARD_QUOTA_NAMES: readonly string[] = [
  'testng again',
  'Did it happe',
  'Group together',
  'Beer kartik',
  'Drink beer',
];

const removedDashboardQuotaNameSet = new Set(
  REMOVED_DASHBOARD_QUOTA_NAMES.map((name) => name.trim().toLowerCase())
);

export function isRemovedDashboardQuota(quota: Pick<AdvanceQuota, 'name'>): boolean {
  return removedDashboardQuotaNameSet.has(quota.name.trim().toLowerCase());
}

export const ADVANCE_QUOTA_TYPE_OPTIONS: QuotaType[] = [
  'Question Based',
  'Advanced',
  'Criteria based',
];

export function getAdvanceQuotaGroupOptions(): string[] {
  return Array.from(new Set(MOCK_ADVANCE_QUOTAS.map((quota) => quota.quotaGroup))).sort();
}

export function formatAdvanceQuotaCondition(
  cond: AdvanceQuotaRuleCondition,
  isFirst: boolean
): string {
  const connectorPrefix =
    !isFirst && cond.connector ? `${cond.connector} ` : '';

  if (cond.source === 'Question' && cond.questionCode) {
    const questionRef = `[${cond.questionCode}] ${cond.subject}`;
    if (cond.operator === 'option target') {
      return `${connectorPrefix}${questionRef} — ${cond.value}`;
    }
    return `${connectorPrefix}${questionRef} ${cond.operator} "${cond.value}"`;
  }

  if (cond.source === 'System Variable') {
    const label = cond.subject || 'System Variable';
    if (cond.operator === 'is between' && cond.valueEnd) {
      return `${connectorPrefix}[${label}] is between "${cond.value}" and "${cond.valueEnd}"`;
    }
    return `${connectorPrefix}[${label}] ${cond.operator} "${cond.value}"`;
  }

  const label = cond.subject || cond.source;
  return `${connectorPrefix}${label} ${cond.operator} "${cond.value}"`;
}

/** Rules shown when expanding a criteria row in the quota group view. */
export function getQuotaDisplayRules(quota: AdvanceQuota): {
  blocks: AdvanceQuotaCriterionBlock[];
  checks: AdvanceQuotaCheckPoint[];
} {
  if (quota.criterionBlocks && quota.criterionBlocks.length > 0) {
    return {
      blocks: quota.criterionBlocks,
      checks: quota.quotaChecks ?? [],
    };
  }

  if (quota.options && quota.options.length > 0 && quota.questionCode) {
    return {
      blocks: [
        {
          name: quota.name,
          conditions: quota.options.map((option, index) => ({
            source: 'Question',
            questionCode: quota.questionCode,
            questionText: quota.questionText,
            subject: quota.questionText ?? quota.questionCode ?? '',
            operator: 'option target',
            value: `${option.label}: target ${option.target}`,
            connector: index === 0 ? undefined : 'AND',
          })),
        },
      ],
      checks: [],
    };
  }

  return {
    blocks: [
      {
        name: quota.name,
        conditions: [
          {
            source: 'Summary',
            subject: 'Rule',
            operator: 'is',
            value: quota.description || 'No rules defined',
          },
        ],
      },
    ],
    checks: quota.quotaChecks ?? [],
  };
}
