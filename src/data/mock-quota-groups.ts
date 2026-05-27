export const QUOTA_GROUP_HANDLING_TYPES = [
  'Criteria order',
  'Least filled',
  'Least filled %',
  'Most filled',
  'Most filled %',
] as const;

export type QuotaGroupHandlingType = (typeof QUOTA_GROUP_HANDLING_TYPES)[number];

export interface QuotaGroup {
  id: string;
  name: string;
  description: string;
  handlingType: QuotaGroupHandlingType;
}

export interface QuotaGroupSelection {
  name: string;
  handlingType: QuotaGroupHandlingType;
}

export const MOCK_QUOTA_GROUPS: QuotaGroup[] = [
  {
    id: 'alcohol-consumer',
    name: 'Alcohol consumer',
    description: 'Quotas for beverage and alcohol consumption segments',
    handlingType: 'Least filled',
  },
  {
    id: 'regional-panel',
    name: 'Regional panel',
    description: 'Geo and regional targeting quotas',
    handlingType: 'Criteria order',
  },
  {
    id: 'brand-tracker',
    name: 'Brand tracker',
    description: 'Brand awareness and preference quotas',
    handlingType: 'Least filled',
  },
  {
    id: 'household-segment',
    name: 'Household segment',
    description: 'Household composition and income quotas',
    handlingType: 'Least filled %',
  },
  {
    id: 'gen-pop-baseline',
    name: 'Gen pop baseline',
    description: 'General population quotas without a named segment',
    handlingType: 'Most filled %',
  },
];

export const DEFAULT_QUOTA_GROUP_HANDLING_TYPE: QuotaGroupHandlingType = 'Least filled';

export function advanceQuotaActiveGroupKey(surveyId: number): string {
  return `advance-quotas:${surveyId}:active-group`;
}

export function advanceQuotaCustomGroupsKey(surveyId: number): string {
  return `advance-quotas:${surveyId}:custom-groups`;
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
