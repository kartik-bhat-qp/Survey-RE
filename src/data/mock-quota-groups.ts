export const QUOTA_GROUP_HANDLING_TYPES = [
  'Criteria order',
  'Least filled',
  'Least filled %',
  'Most filled',
  'Most filled %',
] as const;

export type QuotaGroupHandlingType = (typeof QUOTA_GROUP_HANDLING_TYPES)[number];

export interface QuotaGroupCheckPoint {
  questionId: number;
  questionCode: string;
  questionText: string;
}

export interface QuotaGroup {
  id: string;
  name: string;
  description: string;
  handlingType: QuotaGroupHandlingType;
  firstCheck?: QuotaGroupCheckPoint;
  secondCheck?: QuotaGroupCheckPoint;
}

export interface QuotaGroupSelection {
  name: string;
  handlingType: QuotaGroupHandlingType;
  firstCheck?: QuotaGroupCheckPoint;
  secondCheck?: QuotaGroupCheckPoint;
}

/** Prototype check definitions; question ids are resolved when a survey is known. */
function groupCheck(
  questionCode: string,
  questionText: string
): QuotaGroupCheckPoint {
  return { questionId: 0, questionCode, questionText };
}

export const MOCK_QUOTA_GROUPS: QuotaGroup[] = [
  {
    id: 'alcohol-consumer',
    name: 'Alcohol consumer',
    description: 'Quotas for beverage and alcohol consumption segments',
    handlingType: 'Least filled',
    firstCheck: groupCheck('Q3', 'Which sports do you follow regularly?'),
    secondCheck: groupCheck('Q3', 'Which sports do you follow regularly?'),
  },
  {
    id: 'regional-panel',
    name: 'Regional panel',
    description: 'Geo and regional targeting quotas',
    handlingType: 'Criteria order',
    firstCheck: groupCheck('Q1', 'What is your gender?'),
    secondCheck: groupCheck('Q9', 'How often do you use online streaming services?'),
  },
  {
    id: 'brand-tracker',
    name: 'Brand tracker',
    description: 'Brand awareness and preference quotas',
    handlingType: 'Least filled',
    firstCheck: groupCheck('Q8', 'Any additional comments or feedback?'),
  },
  {
    id: 'household-segment',
    name: 'Household segment',
    description: 'Household composition and income quotas',
    handlingType: 'Least filled %',
    firstCheck: groupCheck('Q6', 'What is your overall satisfaction with the product?'),
  },
  {
    id: 'gen-pop-baseline',
    name: 'Gen pop baseline',
    description: 'General population quotas without a named segment',
    handlingType: 'Most filled %',
    firstCheck: groupCheck('Q2', 'What is your age?'),
  },
];

export function formatQuotaGroupCheckLabel(check: QuotaGroupCheckPoint): string {
  return `[${check.questionCode}] ${check.questionText}`;
}

export const DEFAULT_QUOTA_GROUP_HANDLING_TYPE: QuotaGroupHandlingType = 'Least filled';

export function advanceQuotaActiveGroupKey(surveyId: number): string {
  return `advance-quotas:${surveyId}:active-group`;
}

export function advanceQuotaCustomGroupsKey(surveyId: number): string {
  return `advance-quotas:${surveyId}:custom-groups`;
}

export function advanceQuotaGroupCheckOverridesKey(surveyId: number): string {
  return `advance-quotas:${surveyId}:group-check-overrides`;
}

export type QuotaGroupCheckOverrides = Record<
  string,
  {
    firstCheck?: QuotaGroupCheckPoint | null;
    secondCheck?: QuotaGroupCheckPoint | null;
  }
>;

export function applyQuotaGroupCheckOverrides(
  groups: QuotaGroup[],
  overrides: QuotaGroupCheckOverrides
): QuotaGroup[] {
  return groups.map((group) => {
    const override = overrides[group.id];
    if (!override) return group;
    return {
      ...group,
      firstCheck:
        override.firstCheck !== undefined
          ? override.firstCheck ?? undefined
          : group.firstCheck,
      secondCheck:
        override.secondCheck !== undefined
          ? override.secondCheck ?? undefined
          : group.secondCheck,
    };
  });
}

/** Counts advance/criteria quotas assigned to each named quota group. */
export function getCriteriaCountByQuotaGroup(
  quotas: ReadonlyArray<{ quotaGroup: string }>
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const quota of quotas) {
    const group = quota.quotaGroup?.trim();
    if (!group || group === 'NA') continue;
    counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  return counts;
}

export function getQuotaGroupCheckPoints(
  group: Pick<QuotaGroup, 'firstCheck' | 'secondCheck'>
): QuotaGroupCheckPoint[] {
  const checks: QuotaGroupCheckPoint[] = [];
  if (group.firstCheck) checks.push(group.firstCheck);
  if (group.secondCheck) checks.push(group.secondCheck);
  return checks;
}

export function resolveQuotaGroupMeta(
  groupName: string,
  customGroups: QuotaGroup[]
): QuotaGroup {
  const merged = mergeQuotaGroups(customGroups);
  const found = merged.find(
    (group) => group.name.toLowerCase() === groupName.toLowerCase()
  );
  if (found) return found;
  return {
    id: `inferred-${groupName.toLowerCase().replace(/\s+/g, '-')}`,
    name: groupName,
    description: '',
    handlingType: DEFAULT_QUOTA_GROUP_HANDLING_TYPE,
  };
}

export function isNamedQuotaGroup(groupName: string | undefined): boolean {
  const trimmed = groupName?.trim();
  return Boolean(trimmed && trimmed !== 'NA');
}

export function mergeQuotaGroups(customGroups: QuotaGroup[]): QuotaGroup[] {
  const byName = new Map<string, QuotaGroup>();
  for (const group of MOCK_QUOTA_GROUPS) {
    byName.set(group.name.toLowerCase(), group);
  }
  for (const group of customGroups) {
    byName.set(group.name.toLowerCase(), group);
  }
  return Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
}
