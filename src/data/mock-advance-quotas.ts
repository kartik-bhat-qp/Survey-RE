export type QuotaType = 'Question Based' | 'Advanced' | 'Criteria based';

export interface AdvanceQuota {
  id: string;
  name: string;
  quotaType: QuotaType;
  description: string;
  quotaGroup: string;
  multipleQuotaHandling: string;
  target: number;
  current?: number;
}

export const MOCK_ADVANCE_QUOTAS: AdvanceQuota[] = [
  {
    id: 'quota-1',
    name: '[Q1] Gender - Male',
    quotaType: 'Question Based',
    description: 'Selected "Male" in [Q1] Gender',
    quotaGroup: 'NA',
    multipleQuotaHandling: 'NA',
    target: 100,
  },
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
  {
    id: 'quota-4',
    name: '[Q5] Age - 18-24',
    quotaType: 'Question Based',
    description: 'Selected "18-24" in [Q5] Age',
    quotaGroup: 'NA',
    multipleQuotaHandling: 'NA',
    target: 75,
    current: 75,
  },
  {
    id: 'quota-5',
    name: '[Q5] Age - 25-34',
    quotaType: 'Question Based',
    description: 'Selected "25-34" in [Q5] Age',
    quotaGroup: 'NA',
    multipleQuotaHandling: 'NA',
    target: 90,
    current: 42,
  },
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
  {
    id: 'quota-8',
    name: '[Q8] Brand awareness - Competitor A',
    quotaType: 'Question Based',
    description: 'Selected "Competitor A" in [Q8] Primary brand awareness',
    quotaGroup: 'Brand tracker',
    multipleQuotaHandling: 'Least filled',
    target: 60,
  },
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
