import {
  MOCK_ADVANCE_QUOTAS,
  type QuotaType,
} from '@/data/mock-advance-quotas';

export interface ParticipantOverallStats {
  viewed: number;
  total: number;
  completed: number;
  dropouts: number;
  timedOut: number;
  qualityTerminates: number;
  validationErrors: number;
  completionRate: number;
  lastRefreshedLabel: string;
}

export interface EmailInvitationStat {
  id: string;
  emailList: string;
  sent: number | null;
  bounced: number | null;
  opened: number | null;
  clicked: number | null;
  started: number;
  completed: number;
  terminated: number;
  overQuota: number;
  lastActivity: string;
}

export interface ParticipantQuotaStat {
  id: string;
  name: string;
  quotaType: QuotaType | 'All';
  isOption: boolean;
  isTotal?: boolean;
  limit: number;
  started: number;
  completed: number;
  terminated: number;
  overQuota: number;
}

export type QuotaCountColumn = 'started' | 'completed' | 'terminated' | 'overQuota';

export const PARTICIPANT_RANGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All responses' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

export const QUOTA_TYPE_FILTERS: { value: QuotaType; label: string }[] = [
  { value: 'Question Based', label: 'Question Based' },
  { value: 'Criteria based', label: 'Criteria' },
  { value: 'Advanced', label: 'Advanced' },
];

export const QUOTA_COUNT_COLUMNS: { value: QuotaCountColumn; label: string }[] = [
  { value: 'started', label: 'Started' },
  { value: 'completed', label: 'Completed' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'overQuota', label: 'OverQuota' },
];

export const PARTICIPANT_OVERALL_STATS: ParticipantOverallStats = {
  viewed: 4044,
  total: 2684,
  completed: 1823,
  dropouts: 861,
  timedOut: 0,
  qualityTerminates: 0,
  validationErrors: 16227,
  completionRate: 67.92,
  lastRefreshedLabel: 'Aug 20, 2026 02:01 GMT+05:30',
};

export const EMAIL_INVITATION_STATS: EmailInvitationStat[] = [
  {
    id: 'direct',
    emailList: 'Direct Link / Anonymous',
    sent: null,
    bounced: null,
    opened: null,
    clicked: null,
    started: 112,
    completed: 96,
    terminated: 9,
    overQuota: 5,
    lastActivity: '08/19/2026',
  },
  {
    id: 'cx-panel',
    emailList: 'Customer Experience Panel',
    sent: 80,
    bounced: 2,
    opened: 61,
    clicked: 48,
    started: 48,
    completed: 41,
    terminated: 4,
    overQuota: 3,
    lastActivity: '08/18/2026',
  },
  {
    id: 'newsletter',
    emailList: 'Monthly Newsletter Subscribers',
    sent: 90,
    bounced: 5,
    opened: 54,
    clicked: 36,
    started: 70,
    completed: 55,
    terminated: 12,
    overQuota: 2,
    lastActivity: '08/15/2026',
  },
  {
    id: 'beta-west',
    emailList: 'Product Beta Testers — West Region',
    sent: 120,
    bounced: 4,
    opened: 98,
    clicked: 72,
    started: 88,
    completed: 56,
    terminated: 16,
    overQuota: 8,
    lastActivity: '08/19/2026',
  },
];

function deriveCounts(
  current: number | undefined,
  target: number
): Pick<ParticipantQuotaStat, 'limit' | 'started' | 'completed' | 'terminated' | 'overQuota'> {
  const completed = current ?? 0;
  const inProgress =
    completed === 0 ? 0 : Math.min(6, Math.max(1, Math.round(completed * 0.04)));
  const terminated = completed === 0 ? 0 : Math.round(completed * 0.05);
  const overQuota =
    completed > target ? completed - target : completed === target && target > 0 ? 2 : 0;
  return {
    limit: target,
    started: completed + inProgress + terminated + overQuota,
    completed,
    terminated,
    overQuota,
  };
}

export function getParticipantQuotaStats(): ParticipantQuotaStat[] {
  const rows: ParticipantQuotaStat[] = [
    {
      id: 'all-respondents',
      name: 'All respondents',
      quotaType: 'All',
      isOption: false,
      limit: 0,
      started: PARTICIPANT_OVERALL_STATS.total,
      completed: PARTICIPANT_OVERALL_STATS.completed,
      terminated: 0,
      overQuota: 0,
    },
  ];

  for (const quota of MOCK_ADVANCE_QUOTAS) {
    rows.push({
      id: quota.id,
      name: quota.name,
      quotaType: quota.quotaType,
      isOption: false,
      ...deriveCounts(quota.current, quota.target),
    });
    if (!quota.options) continue;
    for (const option of quota.options) {
      rows.push({
        id: `${quota.id}__${option.id}`,
        name: option.label,
        quotaType: quota.quotaType,
        isOption: true,
        ...deriveCounts(option.current, option.target),
      });
    }
  }

  return rows;
}

export function sumEmailInvitationStats(
  rows: EmailInvitationStat[]
): EmailInvitationStat {
  return rows.reduce(
    (total, row) => ({
      id: 'total',
      emailList: 'Total',
      sent: (total.sent ?? 0) + (row.sent ?? 0),
      bounced: (total.bounced ?? 0) + (row.bounced ?? 0),
      opened: (total.opened ?? 0) + (row.opened ?? 0),
      clicked: (total.clicked ?? 0) + (row.clicked ?? 0),
      started: total.started + row.started,
      completed: total.completed + row.completed,
      terminated: total.terminated + row.terminated,
      overQuota: total.overQuota + row.overQuota,
      lastActivity: row.lastActivity,
    }),
    {
      id: 'total',
      emailList: 'Total',
      sent: 0,
      bounced: 0,
      opened: 0,
      clicked: 0,
      started: 0,
      completed: 0,
      terminated: 0,
      overQuota: 0,
      lastActivity: '',
    }
  );
}

export interface DropoutAnalysisRow {
  id: string;
  /** Display label, e.g. `1. [Q1] What is your gender?` */
  label: string;
  count: number;
  basePercent: number;
  cumulativePercent: number;
  isTotal?: boolean;
}

export const PARTICIPANT_DROPOUT_QUESTION_ROWS: DropoutAnalysisRow[] = [
  {
    id: 'q1',
    label: '1. [Q1] What is your gender?',
    count: 148,
    basePercent: 17.19,
    cumulativePercent: 17.19,
  },
  {
    id: 'q2',
    label: '2. [Q2] Which region do you live in?',
    count: 92,
    basePercent: 10.69,
    cumulativePercent: 27.88,
  },
  {
    id: 'q5',
    label: '3. [Q5] Age',
    count: 71,
    basePercent: 8.25,
    cumulativePercent: 36.12,
  },
  {
    id: 'q7',
    label: '4. [Q7] Rate the following on how entertaining it is',
    count: 118,
    basePercent: 13.7,
    cumulativePercent: 49.83,
  },
  {
    id: 'q9',
    label: '5. [Q9] How likely are you to recommend this event?',
    count: 64,
    basePercent: 7.43,
    cumulativePercent: 57.26,
  },
  {
    id: 'q11',
    label: '6. [Q11] Which fighter attributes matter most to you?',
    count: 55,
    basePercent: 6.39,
    cumulativePercent: 63.65,
  },
  {
    id: 'q12',
    label: '7. [Q12] Select all platforms where you follow fight news',
    count: 49,
    basePercent: 5.69,
    cumulativePercent: 69.34,
  },
  {
    id: 'q14',
    label:
      '8. [Q14] Please rate the following statements about fight night production quality and commentary — include piping for ${piping_text_1} when evaluating live broadcast clarity',
    count: 43,
    basePercent: 4.99,
    cumulativePercent: 74.33,
  },
  {
    id: 'q18',
    label: '9. [Q18] Would you purchase pay-per-view again?',
    count: 38,
    basePercent: 4.41,
    cumulativePercent: 78.75,
  },
  {
    id: 'q21',
    label: '10. [Q21] Rank these sponsorship messages',
    count: 34,
    basePercent: 3.95,
    cumulativePercent: 82.69,
  },
  {
    id: 'q24',
    label: '11. [Q24] Upload a screenshot of your favorite highlight',
    count: 29,
    basePercent: 3.37,
    cumulativePercent: 86.06,
  },
  {
    id: 'q27',
    label: '12. [Q27] Open comments about ticket pricing',
    count: 27,
    basePercent: 3.14,
    cumulativePercent: 89.2,
  },
  {
    id: 'q29',
    label: '13. [Q29] How satisfied were you with venue logistics?',
    count: 24,
    basePercent: 2.79,
    cumulativePercent: 91.99,
  },
  {
    id: 'q31',
    label: '14. [Q31] Select the attributes — Muhammad Ali',
    count: 38,
    basePercent: 4.41,
    cumulativePercent: 96.4,
  },
  {
    id: 'q33',
    label: '15. [Q33] Final feedback before finish',
    count: 31,
    basePercent: 3.6,
    cumulativePercent: 100,
  },
  {
    id: 'total',
    label: 'Total',
    count: 861,
    basePercent: 100,
    cumulativePercent: 100,
    isTotal: true,
  },
];

export const PARTICIPANT_DROPOUT_BLOCKWISE_ROWS: DropoutAnalysisRow[] = [
  {
    id: 'block-1',
    label: 'Block 1 — Demographics',
    count: 311,
    basePercent: 36.12,
    cumulativePercent: 36.12,
  },
  {
    id: 'block-2',
    label: 'Block 2 — Entertainment ratings',
    count: 286,
    basePercent: 33.22,
    cumulativePercent: 69.34,
  },
  {
    id: 'block-3',
    label: 'Block 3 — Fighter attributes & feedback',
    count: 264,
    basePercent: 30.66,
    cumulativePercent: 100,
  },
  {
    id: 'block-total',
    label: 'Total',
    count: 861,
    basePercent: 100,
    cumulativePercent: 100,
    isTotal: true,
  },
];

export function formatDropoutPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export interface DropoutCompletionUrlRow {
  responseId: string;
  responseStatus: string;
  ipAddress: string;
  timestamp: string;
  duplicate: string;
  timeTakenToComplete: string;
  seqNumber: string;
  externalReference: string;
  customVariable1: string;
  customVariable2: string;
  customVariable3: string;
  customVariable4: string;
  customVariable5: string;
  customVariable6: string;
  respondentEmail: string;
  emailList: string;
  countryCode: string;
  region: string;
  completionUrl: string;
}

const DROPOUT_EMAIL_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'questionpro.com',
  'companymail.com',
  'researchpanel.io',
] as const;

const DROPOUT_EMAIL_LISTS = [
  'Customer Experience Panel',
  'Monthly Newsletter Subscribers',
  'Product Beta Testers – West Region',
  'Direct Link / Anonymous',
] as const;

const DROPOUT_REGIONS: { countryCode: string; region: string }[] = [
  { countryCode: 'US', region: 'California' },
  { countryCode: 'US', region: 'New York' },
  { countryCode: 'IN', region: 'Maharashtra' },
  { countryCode: 'IN', region: 'Karnataka' },
  { countryCode: 'GB', region: 'England' },
  { countryCode: 'CA', region: 'Ontario' },
  { countryCode: 'DE', region: 'Bavaria' },
  { countryCode: 'AU', region: 'New South Wales' },
];

const COMPLETION_URL_CSV_HEADERS = [
  'Response ID',
  'Response Status',
  'IP Address',
  'Timestamp (dd/mm/yyyy)',
  'Duplicate',
  'Time Taken to Complete',
  'Seq. Number',
  'External Reference',
  'Custom Variable 1',
  'Custom Variable 2',
  'Custom Variable 3',
  'Custom Variable 4',
  'Custom Variable 5',
  'Custom Variable 6',
  'Respondent Email',
  'Email List',
  'Country Code',
  'Region',
  'Completion URL',
] as const;

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

function formatDropoutTimestamp(seed: number): string {
  const day = String((seed % 28) + 1).padStart(2, '0');
  const month = String((seed % 12) + 1).padStart(2, '0');
  const year = 2026;
  const hour = String(seed % 24).padStart(2, '0');
  const minute = String((seed * 7) % 60).padStart(2, '0');
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

function formatDropoutIp(seed: number): string {
  return `${10 + (seed % 200)}.${(seed * 3) % 256}.${(seed * 5) % 256}.${(seed * 11) % 256}`;
}

export function getDropoutQuestionOptions(): DropoutAnalysisRow[] {
  return PARTICIPANT_DROPOUT_QUESTION_ROWS.filter((row) => !row.isTotal);
}

export function buildDropoutCompletionUrls(
  questionId: string | 'all' = 'all'
): DropoutCompletionUrlRow[] {
  const questions = getDropoutQuestionOptions().filter(
    (row) => questionId === 'all' || row.id === questionId
  );
  const rows: DropoutCompletionUrlRow[] = [];
  let seq = 1;

  for (const question of questions) {
    for (let index = 0; index < question.count; index += 1) {
      const seed = hashSeed(`${question.id}-${index}`);
      const responseId = String(36_150_000 + (seed % 90_000));
      const token = `dr${seed.toString(16).padStart(8, '0')}`;
      const local =
        index % 7 === 0
          ? `panelist.${question.id}.${index + 1}`
          : `respondent${(seed % 9000) + 1000}`;
      const domain = DROPOUT_EMAIL_DOMAINS[seed % DROPOUT_EMAIL_DOMAINS.length];
      const location = DROPOUT_REGIONS[seed % DROPOUT_REGIONS.length];
      const emailList = DROPOUT_EMAIL_LISTS[seed % DROPOUT_EMAIL_LISTS.length];
      rows.push({
        responseId,
        responseStatus: 'Incomplete',
        ipAddress: formatDropoutIp(seed),
        timestamp: formatDropoutTimestamp(seed),
        duplicate: seed % 17 === 0 ? 'Yes' : 'No',
        timeTakenToComplete: String(45 + (seed % 1800)),
        seqNumber: String(seq),
        externalReference: seed % 5 === 0 ? `EXT-${(seed % 9000) + 1000}` : '',
        customVariable1: seed % 3 === 0 ? `CV1-${seed % 100}` : '',
        customVariable2: seed % 6 === 0 ? `CV2-${seed % 50}` : '',
        customVariable3: '',
        customVariable4: '',
        customVariable5: '',
        customVariable6: '',
        respondentEmail: `${local}@${domain}`,
        emailList: emailList === 'Direct Link / Anonymous' ? '' : emailList,
        countryCode: location.countryCode,
        region: location.region,
        completionUrl: `https://www.questionpro.com/a/TakeSurvey?id=8614451&rid=${responseId}&mode=continue&token=${token}`,
      });
      seq += 1;
    }
  }

  return rows;
}

export function buildDropoutCompletionUrlsCsv(rows: DropoutCompletionUrlRow[]): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = rows.map((row) =>
    [
      row.responseId,
      row.responseStatus,
      row.ipAddress,
      row.timestamp,
      row.duplicate,
      row.timeTakenToComplete,
      row.seqNumber,
      row.externalReference,
      row.customVariable1,
      row.customVariable2,
      row.customVariable3,
      row.customVariable4,
      row.customVariable5,
      row.customVariable6,
      row.respondentEmail,
      row.emailList,
      row.countryCode,
      row.region,
      row.completionUrl,
    ]
      .map(escape)
      .join(',')
  );
  return [COMPLETION_URL_CSV_HEADERS.join(','), ...lines].join('\n');
}

export function downloadDropoutCompletionUrlsCsv(
  rows: DropoutCompletionUrlRow[],
  filename: string
): void {
  const csv = buildDropoutCompletionUrlsCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
