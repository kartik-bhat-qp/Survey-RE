export type IntegrityRiskLevel = 'high' | 'medium' | 'low';

export type IntegrityResponseStatus = 'included' | 'excluded';

export type IntegrityOutcomeId =
  | 'responses'
  | 'completes'
  | 'terminates'
  | 'quality-terminates';

export type IntegrityOutcomeKind = 'complete' | 'terminate' | 'quality-terminate' | 'incomplete';

export type IntegrityFlagId =
  | 'speeding'
  | 'straight-lining'
  | 'duplicate-device'
  | 'gibberish'
  | 'proxy-vpn'
  | 'bot-suspected'
  | 'ai-generated-text'
  | 'geo-mismatch';

export interface IntegrityFlagDef {
  id: IntegrityFlagId;
  label: string;
  description: string;
}

export interface RespondentIntegrityRecord {
  responseId: string;
  /** Missing for anonymous collectors. */
  respondent?: string;
  score: number;
  risk: IntegrityRiskLevel;
  flags: IntegrityFlagId[];
  completionSeconds: number;
  /** Missing when location could not be resolved. */
  country?: string;
  collector: string;
  submittedAt: string;
  status: IntegrityResponseStatus;
  outcome: IntegrityOutcomeKind;
}

export const INTEGRITY_FLAGS: IntegrityFlagDef[] = [
  {
    id: 'speeding',
    label: 'Speeding',
    description: 'Finished in less than a third of the median completion time.',
  },
  {
    id: 'straight-lining',
    label: 'Straight-lining',
    description: 'Picked the same column across every row of a matrix question.',
  },
  {
    id: 'duplicate-device',
    label: 'Duplicate device / IP',
    description: 'Same device fingerprint or IP address as an earlier response.',
  },
  {
    id: 'gibberish',
    label: 'Gibberish text',
    description: 'Open-ended answers contain random characters or keyboard mashing.',
  },
  {
    id: 'proxy-vpn',
    label: 'Proxy / VPN',
    description: 'Connection routed through a known proxy, VPN, or data center.',
  },
  {
    id: 'bot-suspected',
    label: 'Bot suspected',
    description: 'Failed the invisible CAPTCHA or showed automated input patterns.',
  },
  {
    id: 'ai-generated-text',
    label: 'AI-generated text',
    description: 'Open-ended answers match patterns of pasted or AI-written text.',
  },
  {
    id: 'geo-mismatch',
    label: 'Location mismatch',
    description: 'IP location does not match the country the respondent reported.',
  },
];

export const INTEGRITY_RISK_LABELS: Record<IntegrityRiskLevel, string> = {
  high: 'High risk',
  medium: 'Medium risk',
  low: 'Low risk',
};

export const INTEGRITY_SUMMARY = {
  analyzed: 1823,
  averageScore: 82,
  high: 64,
  medium: 211,
  low: 1548,
  autoTerminated: 37,
  excluded: 18,
  totalResponses: 2684,
  totalCompletes: 1823,
  terminates: 186,
  qualityTerminates: 94,
};

export const INTEGRITY_OUTCOME_BARS: {
  id: IntegrityOutcomeId;
  label: string;
  count: number;
  color: string;
}[] = [
  { id: 'responses', label: 'Total responses', count: 2684, color: '#94c7f1' },
  { id: 'completes', label: 'Total completes', count: 1823, color: '#1b87e6' },
  { id: 'terminates', label: 'Terminates', count: 186, color: '#f6c177' },
  {
    id: 'quality-terminates',
    label: 'Quality terminates',
    count: 94,
    color: '#ef9a9a',
  },
];

export const INTEGRITY_OUTCOME_LABELS: Record<IntegrityOutcomeKind, string> = {
  complete: 'Complete',
  terminate: 'Terminated',
  'quality-terminate': 'Quality terminate',
  incomplete: 'Incomplete',
};

export const INTEGRITY_SCORE_DISTRIBUTION: {
  range: string;
  min: number;
  max: number;
  count: number;
  risk: IntegrityRiskLevel;
}[] = [
  { range: '0–20', min: 0, max: 20, count: 22, risk: 'high' },
  { range: '21–40', min: 21, max: 40, count: 42, risk: 'high' },
  { range: '41–60', min: 41, max: 60, count: 211, risk: 'medium' },
  { range: '61–80', min: 61, max: 80, count: 486, risk: 'low' },
  { range: '81–100', min: 81, max: 100, count: 1062, risk: 'low' },
];

export const INTEGRITY_FLAG_COUNTS: { id: IntegrityFlagId; count: number }[] = [
  { id: 'speeding', count: 142 },
  { id: 'straight-lining', count: 118 },
  { id: 'duplicate-device', count: 64 },
  { id: 'gibberish', count: 51 },
  { id: 'proxy-vpn', count: 39 },
  { id: 'ai-generated-text', count: 31 },
  { id: 'bot-suspected', count: 22 },
  { id: 'geo-mismatch', count: 17 },
];

export const RESPONDENT_INTEGRITY_RECORDS: RespondentIntegrityRecord[] = [
  {
    responseId: 'R-104382',
    respondent: 'priya.raman@northwind.co',
    score: 14,
    risk: 'high',
    flags: ['speeding', 'straight-lining', 'bot-suspected'],
    completionSeconds: 41,
    country: 'India',
    collector: 'Public web link — HHSC site',
    submittedAt: '2026-11-23T09:14:00+05:30',
    status: 'included',
    outcome: 'quality-terminate',
  },
  {
    responseId: 'R-104377',
    score: 22,
    risk: 'high',
    flags: ['duplicate-device', 'proxy-vpn', 'geo-mismatch'],
    completionSeconds: 118,
    country: 'Netherlands',
    collector: 'Panel — Cint US Gen Pop',
    submittedAt: '2026-11-23T08:52:00+05:30',
    status: 'excluded',
    outcome: 'quality-terminate',
  },
  {
    responseId: 'R-104361',
    respondent: 'marcus.oyelaran@brightpathconsulting-international.com',
    score: 31,
    risk: 'high',
    flags: ['gibberish', 'ai-generated-text'],
    completionSeconds: 204,
    country: 'Nigeria',
    collector: 'Email invitation — Wave 2',
    submittedAt: '2026-11-22T21:30:00+05:30',
    status: 'included',
    outcome: 'quality-terminate',
  },
  {
    responseId: 'R-104355',
    respondent: 'h.tanaka@kumo-labs.jp',
    score: 38,
    risk: 'high',
    flags: ['speeding', 'straight-lining'],
    completionSeconds: 63,
    country: 'Japan',
    collector: 'Public web link — HHSC site',
    submittedAt: '2026-11-22T18:05:00+05:30',
    status: 'included',
    outcome: 'quality-terminate',
  },
  {
    responseId: 'R-104348',
    respondent: 'diego.fernandez@meridian-logistics.es',
    score: 29,
    risk: 'high',
    flags: ['speeding', 'bot-suspected'],
    completionSeconds: 38,
    country: 'Spain',
    collector: 'Panel — Cint US Gen Pop',
    submittedAt: '2026-11-22T17:22:00+05:30',
    status: 'included',
    outcome: 'quality-terminate',
  },
  {
    responseId: 'R-104340',
    respondent: 'elena.vasquez@gmail.com',
    score: 47,
    risk: 'medium',
    flags: ['straight-lining'],
    completionSeconds: 172,
    country: 'Mexico',
    collector: 'SMS invitation',
    submittedAt: '2026-11-22T14:47:00+05:30',
    status: 'included',
    outcome: 'complete',
  },
  {
    responseId: 'R-104333',
    score: 52,
    risk: 'medium',
    flags: ['proxy-vpn'],
    completionSeconds: 260,
    collector: 'Panel — Cint US Gen Pop',
    submittedAt: '2026-11-22T11:20:00+05:30',
    status: 'included',
    outcome: 'complete',
  },
  {
    responseId: 'R-104319',
    respondent: 'oliver.bennett@harbourbank.co.uk',
    score: 58,
    risk: 'medium',
    flags: ['ai-generated-text'],
    completionSeconds: 311,
    country: 'United Kingdom',
    collector: 'Email invitation — Wave 2',
    submittedAt: '2026-11-21T19:02:00+05:30',
    status: 'included',
    outcome: 'complete',
  },
  {
    responseId: 'R-104302',
    respondent: 'amira.haddad@outlook.com',
    score: 66,
    risk: 'low',
    flags: ['speeding'],
    completionSeconds: 142,
    country: 'United Arab Emirates',
    collector: 'WhatsApp invitation',
    submittedAt: '2026-11-21T16:38:00+05:30',
    status: 'included',
    outcome: 'complete',
  },
  {
    responseId: 'R-104288',
    respondent: 'jordan.miller@acmeretail.com',
    score: 79,
    risk: 'low',
    flags: [],
    completionSeconds: 284,
    country: 'United States',
    collector: 'Public web link — HHSC site',
    submittedAt: '2026-11-21T10:11:00+05:30',
    status: 'included',
    outcome: 'complete',
  },
  {
    responseId: 'R-104271',
    respondent: 'sofia.lindqvist@nordicair.se',
    score: 88,
    risk: 'low',
    flags: [],
    completionSeconds: 336,
    country: 'Sweden',
    collector: 'Email invitation — Wave 2',
    submittedAt: '2026-11-20T22:45:00+05:30',
    status: 'included',
    outcome: 'complete',
  },
  {
    responseId: 'R-104265',
    respondent: 'rahul.mehta@questionpro.com',
    score: 94,
    risk: 'low',
    flags: [],
    completionSeconds: 402,
    country: 'India',
    collector: 'Manual data entry',
    submittedAt: '2026-11-20T15:09:00+05:30',
    status: 'included',
    outcome: 'complete',
  },
  {
    responseId: 'R-104250',
    respondent: 'claire.dubois@lumiere.fr',
    score: 97,
    risk: 'low',
    flags: [],
    completionSeconds: 365,
    country: 'France',
    collector: 'Public web link — HHSC site',
    submittedAt: '2026-11-20T09:56:00+05:30',
    status: 'included',
    outcome: 'complete',
  },
  {
    responseId: 'R-104241',
    respondent: 'liam.otoole@greenfield.ie',
    score: 71,
    risk: 'low',
    flags: [],
    completionSeconds: 98,
    country: 'Ireland',
    collector: 'Email invitation — Wave 2',
    submittedAt: '2026-11-20T08:14:00+05:30',
    status: 'included',
    outcome: 'terminate',
  },
  {
    responseId: 'R-104236',
    respondent: 'noura.alrashid@gulfinsights.sa',
    score: 64,
    risk: 'low',
    flags: [],
    completionSeconds: 74,
    country: 'Saudi Arabia',
    collector: 'SMS invitation',
    submittedAt: '2026-11-19T21:40:00+05:30',
    status: 'included',
    outcome: 'terminate',
  },
  {
    responseId: 'R-104228',
    score: 55,
    risk: 'medium',
    flags: [],
    completionSeconds: 51,
    country: 'Brazil',
    collector: 'Public web link — HHSC site',
    submittedAt: '2026-11-19T18:05:00+05:30',
    status: 'included',
    outcome: 'terminate',
  },
  {
    responseId: 'R-104219',
    respondent: 'mei.chen@pacific-ops.sg',
    score: 68,
    risk: 'low',
    flags: [],
    completionSeconds: 112,
    country: 'Singapore',
    collector: 'Panel — Cint US Gen Pop',
    submittedAt: '2026-11-19T14:28:00+05:30',
    status: 'included',
    outcome: 'terminate',
  },
  {
    responseId: 'R-104210',
    respondent: 'andreas.mueller@rheinwerk.de',
    score: 73,
    risk: 'low',
    flags: [],
    completionSeconds: 89,
    country: 'Germany',
    collector: 'WhatsApp invitation',
    submittedAt: '2026-11-19T11:02:00+05:30',
    status: 'included',
    outcome: 'terminate',
  },
  {
    responseId: 'R-104201',
    respondent: 'fatima.benali@atlaspanel.ma',
    score: 44,
    risk: 'medium',
    flags: ['proxy-vpn'],
    completionSeconds: 67,
    country: 'Morocco',
    collector: 'Email invitation — Wave 2',
    submittedAt: '2026-11-18T23:17:00+05:30',
    status: 'included',
    outcome: 'incomplete',
  },
  {
    responseId: 'R-104192',
    respondent: 'kyle.thompson@harborcity.edu',
    score: 81,
    risk: 'low',
    flags: [],
    completionSeconds: 145,
    country: 'United States',
    collector: 'Public web link — HHSC site',
    submittedAt: '2026-11-18T16:44:00+05:30',
    status: 'included',
    outcome: 'incomplete',
  },
];

export function getIntegrityFlagLabel(id: IntegrityFlagId): string {
  return INTEGRITY_FLAGS.find((flag) => flag.id === id)?.label ?? id;
}

export function formatCompletionTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes} min ${rest} s` : `${rest} s`;
}

export function getIntegrityOutcomeBar(id: IntegrityOutcomeId) {
  return INTEGRITY_OUTCOME_BARS.find((bar) => bar.id === id) ?? INTEGRITY_OUTCOME_BARS[0];
}

/** Sample rows shown when drilling into an outcome bar. */
export function getResponsesForOutcome(
  outcomeId: IntegrityOutcomeId
): RespondentIntegrityRecord[] {
  if (outcomeId === 'responses') return RESPONDENT_INTEGRITY_RECORDS;
  if (outcomeId === 'completes') {
    return RESPONDENT_INTEGRITY_RECORDS.filter((row) => row.outcome === 'complete');
  }
  if (outcomeId === 'terminates') {
    return RESPONDENT_INTEGRITY_RECORDS.filter((row) => row.outcome === 'terminate');
  }
  return RESPONDENT_INTEGRITY_RECORDS.filter((row) => row.outcome === 'quality-terminate');
}

export function getResponsesForScoreRange(
  min: number,
  max: number
): RespondentIntegrityRecord[] {
  return RESPONDENT_INTEGRITY_RECORDS.filter(
    (row) => row.score >= min && row.score <= max
  );
}

export function getResponsesForFlag(
  flagId: IntegrityFlagId
): RespondentIntegrityRecord[] {
  return RESPONDENT_INTEGRITY_RECORDS.filter((row) => row.flags.includes(flagId));
}

export interface IntegrityResponsesDrilldown {
  title: string;
  total: number;
  rows: RespondentIntegrityRecord[];
}

export function getOutcomeDrilldown(outcomeId: IntegrityOutcomeId): IntegrityResponsesDrilldown {
  const bar = getIntegrityOutcomeBar(outcomeId);
  return {
    title: bar.label,
    total: bar.count,
    rows: getResponsesForOutcome(outcomeId),
  };
}

export function getScoreRangeDrilldown(
  range: string
): IntegrityResponsesDrilldown | null {
  const bucket = INTEGRITY_SCORE_DISTRIBUTION.find((item) => item.range === range);
  if (!bucket) return null;
  return {
    title: `Integrity score ${bucket.range}`,
    total: bucket.count,
    rows: getResponsesForScoreRange(bucket.min, bucket.max),
  };
}

export function getFlagDrilldown(flagId: IntegrityFlagId): IntegrityResponsesDrilldown | null {
  const flag = INTEGRITY_FLAGS.find((item) => item.id === flagId);
  const count = INTEGRITY_FLAG_COUNTS.find((item) => item.id === flagId)?.count ?? 0;
  if (!flag) return null;
  return {
    title: flag.label,
    total: count,
    rows: getResponsesForFlag(flagId),
  };
}
