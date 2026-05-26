export type DashboardType = 'blank' | 'ai';

export interface Dashboard {
  id: number;
  name: string;
  creationDate: string;
  enableSharing?: boolean;
  type?: DashboardType;
  surveyId?: number;
  surveyName?: string;
}

const PREFIXES = [
  'Executive',
  'Quarterly',
  'Regional',
  'Product',
  'Customer',
  'Employee',
  'Support',
  'Marketing',
  'Sales',
  'Onboarding',
  'Churn',
  'NPS',
  'CSAT',
  'Brand',
  'Launch',
  'Pulse',
  'Annual',
  'Weekly',
  'Monthly',
  'Ad-hoc',
];

const TOPICS = [
  'CX Overview',
  'Satisfaction Tracker',
  'Feedback Deep Dive',
  'Engagement Summary',
  'Risk Indicators',
  'Survey Results',
  'Performance Dashboard',
  'Insights Hub',
  'Response Trends',
  'Segment Analysis',
  'Driver Analysis',
  'Loyalty Metrics',
  'Retention Study',
  'Voice of Customer',
  'Team Scorecard',
  'Campaign Results',
  'Market Pulse',
  'Usability Study',
  'Benchmark Report',
  'KPI Monitor',
];

const REGIONS = ['Americas', 'EMEA', 'APAC', 'Global', 'North America', 'LATAM'];

/** Deterministic pick so mock data is stable across reloads */
function pick<T>(items: T[], seed: number): T {
  return items[seed % items.length];
}

function generateDashboardName(index: number): string {
  const variant = index % 12;
  const prefix = pick(PREFIXES, index * 7);
  const topic = pick(TOPICS, index * 13);
  const region = pick(REGIONS, index * 3);

  switch (variant) {
    case 0:
      return `${prefix} ${topic}`;
    case 1:
      return `${topic} — ${region}`;
    case 2:
      return `${prefix} ${topic} (${region})`;
    case 3:
      return `Q${(index % 4) + 1} ${topic}`;
    case 4:
      return `${region} ${topic}`;
    case 5:
      return `${prefix} ${topic} ${2023 + (index % 3)}`;
    case 6:
      return `${topic} Wave ${(index % 5) + 1}`;
    case 7:
      return `${prefix} — ${topic}`;
    case 8:
      return index % 47 === 0
        ? `${prefix} ${topic} with an intentionally long dashboard name for UI layout testing purposes`
        : `${prefix} ${topic} #${index + 1}`;
    case 9:
      return index % 113 === 0 ? 'Untitled' : `${topic} Dashboard`;
    case 10:
      return `${prefix} ${pick(TOPICS, index + 5)} / ${pick(TOPICS, index + 9)}`;
    default:
      return `${pick(PREFIXES, index + 2)} ${pick(TOPICS, index + 4)}`;
  }
}

function generateCreationDate(index: number): string {
  const daysAgo = index % 400;
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(9 + (index % 8), (index * 11) % 60, 0, 0);
  return date.toISOString();
}

const HAND_CRAFTED: Dashboard[] = [
  {
    id: 1,
    name: 'Executive CX Overview',
    creationDate: '2025-05-15T10:30:00Z',
    enableSharing: true,
  },
  {
    id: 2,
    name: 'NPS Tracker — Quarterly',
    creationDate: '2025-05-10T14:00:00Z',
    enableSharing: true,
  },
];

const GENERATED_COUNT = 248;

const GENERATED: Dashboard[] = Array.from({ length: GENERATED_COUNT }, (_, i) => {
  const id = i + 3;
  return {
    id,
    name: generateDashboardName(id),
    creationDate: generateCreationDate(id),
    enableSharing: id % 7 === 0,
  };
});

export const MOCK_DASHBOARDS: Dashboard[] = [...HAND_CRAFTED, ...GENERATED];

export const DASHBOARDS_PER_PAGE = 100;

export function getDashboardById(id: number): Dashboard | undefined {
  return MOCK_DASHBOARDS.find((d) => d.id === id);
}
