export type QuotaType = 'Question Based' | 'Advanced' | 'Criteria based' | 'Cross variable';

/** Question-based quota distribution type (matches QuotaDimensionStep scope). */
export type QuestionQuotaScope = 'max-count' | 'min-count' | 'min-pct';

export function formatQuestionQuotaScope(
  scope: QuestionQuotaScope | undefined
): string {
  switch (scope) {
    case 'min-count':
      return 'Minimum quota (count)';
    case 'min-pct':
      return 'Minimum quota (percentage)';
    case 'max-count':
      return 'Maximum count';
    default:
      return 'Maximum count';
  }
}

export function isMinQuestionQuotaScope(
  scope: QuestionQuotaScope | undefined
): boolean {
  return scope === 'min-count' || scope === 'min-pct';
}

/** Sum of per-option minimum targets for question-based min quotas. */
export function getQuestionOptionMinSum(quota: AdvanceQuota): number {
  if (!quota.options?.length) return 0;
  return quota.options.reduce((sum, opt) => sum + opt.target, 0);
}

/** Ensures min question quotas use total sample target for progress, not only min sum. */
export function normalizeQuestionBasedMinQuota(quota: AdvanceQuota): AdvanceQuota {
  if (
    quota.quotaType !== 'Question Based' ||
    !isMinQuestionQuotaScope(quota.questionQuotaScope)
  ) {
    return quota;
  }
  const minSum = getQuestionOptionMinSum(quota);
  const inferredTotal =
    quota.questionQuotaTotalTarget ??
    (quota.target > minSum ? quota.target : undefined);
  if (inferredTotal == null) return quota;
  if (
    quota.target === inferredTotal &&
    quota.questionQuotaTotalTarget === inferredTotal
  ) {
    return quota;
  }
  return {
    ...quota,
    target: inferredTotal,
    questionQuotaTotalTarget: inferredTotal,
  };
}

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
  /** For Question Based quotas, max vs minimum count / percentage distribution. */
  questionQuotaScope?: QuestionQuotaScope;
  /**
   * Overall sample target for min-count / min-pct question quotas.
   * `target` uses this for progress; option rows store per-option minimums.
   */
  questionQuotaTotalTarget?: number;
  /** Structured criteria rules for view / detail surfaces. */
  criterionBlocks?: AdvanceQuotaCriterionBlock[];
  /** When quota is evaluated in the survey flow. */
  quotaChecks?: AdvanceQuotaCheckPoint[];
  /** Links rows from the same cross variable matrix save. */
  crossVariableBatchId?: string;
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
  questionQuotaScope?: QuestionQuotaScope;
  questionQuotaTotalTarget?: number;
}): AdvanceQuota {
  const {
    id,
    questionCode,
    questionText,
    quotaGroup,
    multipleQuotaHandling,
    options,
    questionQuotaScope,
    questionQuotaTotalTarget,
  } = params;
  const scope = questionQuotaScope ?? 'max-count';
  const optionSum = options.reduce((sum, opt) => sum + opt.target, 0);
  const target =
    isMinQuestionQuotaScope(scope) && questionQuotaTotalTarget != null
      ? questionQuotaTotalTarget
      : optionSum;
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
    questionQuotaScope: scope,
    questionQuotaTotalTarget: isMinQuestionQuotaScope(scope)
      ? questionQuotaTotalTarget ?? optionSum
      : undefined,
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
    description:
      'Selected "Female" in [Q1] Gender and Checked after [Q3], re-checked after [Q9]',
    quotaGroup: 'NA',
    multipleQuotaHandling: 'NA',
    target: 100,
    current: 35,
    quotaChecks: [
      { questionCode: 'Q3', questionText: 'Employment status' },
      { questionCode: 'Q9', questionText: 'How likely are you to recommend us?' },
    ],
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
    questionQuotaScope: 'min-count',
    questionQuotaTotalTarget: 200,
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
    description:
      'Selected "Full time" in [Q3] Employment status and Checked after [Q3], re-checked after [Q12]',
    quotaGroup: 'NA',
    multipleQuotaHandling: 'NA',
    target: 200,
    current: 188,
    quotaChecks: [
      { questionCode: 'Q3', questionText: 'Employment status' },
      { questionCode: 'Q12', questionText: 'How often do you consume alcohol?' },
    ],
  },
  buildQuestionBasedQuota({
    id: 'quota-q8-brand',
    questionCode: 'Q8',
    questionText: 'Primary brand awareness',
    quotaGroup: 'Brand tracker',
    multipleQuotaHandling: 'Least filled',
    questionQuotaScope: 'min-pct',
    questionQuotaTotalTarget: 250,
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
    description:
      'Selected "West" in [Q2] Region with metro DMA filter applied and Checked after [Q2], re-checked after [Q6]',
    quotaGroup: 'NA',
    multipleQuotaHandling: 'NA',
    target: 110,
    current: 67,
    quotaChecks: [
      { questionCode: 'Q2', questionText: 'What is your age?' },
      { questionCode: 'Q6', questionText: 'What is your overall satisfaction with the product?' },
    ],
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

/** Quota types shown in the advance quotas table view. */
export const TABLE_QUOTA_TYPE_OPTIONS: QuotaType[] = [
  'Question Based',
  'Advanced',
  'Criteria based',
];

export const ADVANCE_QUOTA_TYPE_OPTIONS: QuotaType[] = [
  ...TABLE_QUOTA_TYPE_OPTIONS,
  'Cross variable',
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

/** Parses "Checked after [Qx]" / "re-checked after [Qy]" from a stored description. */
export function parseQuotaChecksFromDescription(
  description: string | undefined
): AdvanceQuotaCheckPoint[] {
  if (!description?.trim()) return [];

  const checks: AdvanceQuotaCheckPoint[] = [];
  const first = description.match(/Checked after\s+\[([^\]]+)\]/i);
  if (first) {
    checks.push({ questionCode: first[1].trim(), questionText: '' });
  }
  const second = description.match(/re-checked after\s+\[([^\]]+)\]/i);
  if (second) {
    checks.push({ questionCode: second[1].trim(), questionText: '' });
  }
  return checks;
}

export function resolveQuotaCheckPoints(quota: AdvanceQuota): AdvanceQuotaCheckPoint[] {
  if (quota.quotaChecks && quota.quotaChecks.length > 0) {
    return quota.quotaChecks;
  }
  return parseQuotaChecksFromDescription(quota.description);
}

export function resolveQuotaCheckPointsForDisplay(
  quota: AdvanceQuota,
  groupCheckCodes: ReadonlyArray<{
    questionCode: string;
    questionText?: string;
  }> = []
): AdvanceQuotaCheckPoint[] {
  if (quota.quotaType === 'Advanced' && groupCheckCodes.length > 0) {
    return groupCheckCodes.map((check) => ({
      questionCode: check.questionCode,
      questionText: check.questionText ?? '',
    }));
  }
  return resolveQuotaCheckPoints(quota);
}

/** Rules shown when expanding a criteria row in the quota group view. */
export function getQuotaDisplayRules(quota: AdvanceQuota): {
  blocks: AdvanceQuotaCriterionBlock[];
  checks: AdvanceQuotaCheckPoint[];
} {
  if (quota.criterionBlocks && quota.criterionBlocks.length > 0) {
    return {
      blocks: quota.criterionBlocks,
      checks: resolveQuotaCheckPoints(quota),
    };
  }

  if (quota.options && quota.options.length > 0 && quota.questionCode) {
    const minScope = isMinQuestionQuotaScope(quota.questionQuotaScope);

    return {
      blocks: [
        {
          name: quota.name,
          conditions: quota.options.map((option, index) => ({
            source: 'Question',
            questionCode: quota.questionCode,
            questionText: quota.questionText,
            subject: option.label,
            operator: minScope ? 'minimum' : 'option target',
            value: minScope ? String(option.target) : `target ${option.target}`,
            connector: index > 0 ? ('AND' as const) : undefined,
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
    checks: resolveQuotaCheckPoints(quota),
  };
}
