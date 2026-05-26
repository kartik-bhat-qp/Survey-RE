export type AddQuotaType = 'question-based' | 'criteria-based' | 'advanced';

export interface AddQuotaOption {
  id: AddQuotaType;
  title: string;
  description: string;
  icon: string;
}

export const ADD_QUOTA_OPTIONS: AddQuotaOption[] = [
  {
    id: 'question-based',
    title: 'Question based quota',
    description: 'Quotas will be based on the options of any question.',
    icon: 'wm-ballot',
  },
  {
    id: 'criteria-based',
    title: 'Criteria based quota',
    description:
      'Quotas will be based a criteria which can comprise of one or more conditions',
    icon: 'wm-call-split',
  },
  {
    id: 'advanced',
    title: 'Advanced quota',
    description:
      'Create a group and add multiple criteria quotas to that group. You can then specify quota handling rules like least filled, quota priority, etc',
    icon: 'wm-tune',
  },
];
