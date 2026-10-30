import type { CommunityId } from '@/data/mock-question-communities';

export const SURVEY_PROTECTIONS = [
  {
    id: 'start',
    label: 'Survey start',
    detail: 'Check the visit before the survey opens.',
    help:
      'Someone opens your survey and goes straight to the first question. If the visit looks ' +
      'automated, they confirm they are present, or they wait and try again.',
  },
  {
    id: 'participation',
    label: 'During participation',
    detail: 'Check again if the visit looks scripted while the survey is in progress.',
    help:
      'People answer as usual. If a visit starts to look scripted partway through, they confirm ' +
      'before they continue. A normal respondent is not stopped.',
  },
  {
    id: 'submission',
    label: 'Before submission',
    detail: 'Check once more before the response is accepted.',
    help:
      'The response is saved as usual. If the visit still looks automated at the end, they ' +
      'confirm once before it is accepted, or they are asked to try again.',
  },
  {
    id: 'repeat',
    label: 'Repeated participation',
    detail: 'Slow down the same person starting this survey again and again.',
    help:
      'The first time someone takes the survey, nothing changes. If they keep starting it ' +
      'again, later attempts slow down and they may be asked to wait.',
  },
  {
    id: 'link',
    label: 'Access links',
    detail: 'Check reused or invalid invitation and collector links.',
    help:
      'A valid collector or invitation link opens the survey. A link that was already used, or ' +
      'that is not valid, is stopped, and the person can ask for a new one.',
  },
] as const;

export type SurveyProtectionId = (typeof SURVEY_PROTECTIONS)[number]['id'];

export const SURVEY_CHECKS = [
  {
    id: 'fingerprint',
    label: 'Device fingerprinting',
    group: 'Same person',
    groupNote: 'Device and IP. Checked once, when the survey opens.',
    detail:
      'Recognize the same browser or device across visits, even when the IP address changes.',
    moment: 'open',
    whenLabel: 'Checked once, when the survey opens.',
    tolerance: {
      label: 'Devices allowed',
      singular: 'device',
      plural: 'devices',
      min: 1,
      defaultValue: 1,
    },
  },
  {
    id: 'ip-duplicates',
    label: 'IP duplicates',
    group: 'Same person',
    groupNote: 'Device and IP. Checked once, when the survey opens.',
    detail: 'Flag more than one response from the same IP address.',
    moment: 'open',
    whenLabel: 'Checked once, when the survey opens.',
    tolerance: {
      label: 'IPs allowed',
      singular: 'IP',
      plural: 'IPs',
      min: 1,
      defaultValue: 1,
    },
  },
  {
    id: 'vpn',
    label: 'VPN',
    group: 'Connection',
    groupNote: 'VPN, proxy, location, and bots. Checked when the survey opens.',
    detail: 'Flag a response that reaches the survey through a VPN.',
    moment: 'open',
    whenLabel: 'Checked once, when the survey opens.',
  },
  {
    id: 'proxy',
    label: 'Proxy',
    group: 'Connection',
    groupNote: 'VPN, proxy, location, and bots. Checked when the survey opens.',
    detail: 'Flag a response that reaches the survey through a proxy.',
    moment: 'open',
    whenLabel: 'Checked once, when the survey opens.',
  },
  {
    id: 'location',
    label: 'Location',
    group: 'Connection',
    groupNote: 'VPN, proxy, location, and bots. Checked when the survey opens.',
    detail:
      'Flag a response whose location does not match its IP address, or moves faster than a ' +
      'person could travel.',
    moment: 'open',
    whenLabel: 'Checked once, when the survey opens.',
  },
  {
    id: 'bot',
    label: 'Bot and automation detection',
    group: 'Connection',
    groupNote: 'VPN, proxy, location, and bots. Checked when the survey opens.',
    detail: 'Flag a visit that looks like a script, a headless browser, or another automated tool.',
    moment: 'session',
    whenLabel: 'Checked when the survey opens, and again while answers are being entered.',
  },
  {
    id: 'ai-detection',
    label: 'AI detection',
    group: 'Answers',
    groupNote: 'AI-written answers and pasting. Checked while answers are entered.',
    detail: 'Flag open-ended answers that read like they were written by an AI tool.',
    moment: 'throughout',
    whenLabel: 'Checked throughout the survey, whenever an answer is written.',
    tolerance: {
      label: 'AI-like answers allowed',
      singular: 'AI-like answer',
      plural: 'AI-like answers',
      min: 0,
      defaultValue: 0,
    },
  },
  {
    id: 'copy-paste',
    label: 'Copy and paste detection',
    group: 'Answers',
    groupNote: 'AI-written answers and pasting. Checked while answers are entered.',
    detail: 'Flag answers that were pasted in instead of typed.',
    moment: 'throughout',
    whenLabel: 'Checked throughout the survey, whenever an answer is entered.',
    tolerance: {
      label: 'Pasted answers allowed',
      singular: 'pasted answer',
      plural: 'pasted answers',
      min: 0,
      defaultValue: 0,
    },
  },
  {
    id: 'campaign',
    label: 'Campaign-level anomalies',
    group: 'Across responses',
    groupNote: 'Campaign and cohort. Checked as responses come in.',
    detail: 'Flag a campaign when its responses do not look like the rest of that campaign.',
    moment: 'aggregate',
    whenLabel: 'Checked across the campaign, as responses come in.',
  },
  {
    id: 'cohort',
    label: 'Cohort-level anomalies',
    group: 'Across responses',
    groupNote: 'Campaign and cohort. Checked as responses come in.',
    detail: 'Flag a cohort when its responses do not look like the other cohorts in this survey.',
    moment: 'aggregate',
    whenLabel: 'Checked across each cohort, as responses come in.',
  },
] as const;

export type SurveyCheckId = (typeof SURVEY_CHECKS)[number]['id'];

export const COMMUNITY_CHECKS = [
  {
    id: 'fingerprint',
    label: 'Device fingerprinting',
    group: 'Same person',
    groupNote: 'Device and IP. Checked on signup or sign-in.',
    detail: 'Recognize the same browser or device across signups and sign-ins.',
    whenLabel: 'Checked once, on the first signup or sign-in from that device.',
    tolerance: {
      label: 'Devices allowed',
      singular: 'device',
      plural: 'devices',
      min: 1,
      defaultValue: 1,
    },
  },
  {
    id: 'ip-duplicates',
    label: 'IP duplicates',
    group: 'Same person',
    groupNote: 'Device and IP. Checked on signup or sign-in.',
    detail: 'Flag more than one account from the same IP address.',
    whenLabel: 'Checked once, when the account is created.',
    tolerance: {
      label: 'IPs allowed',
      singular: 'IP',
      plural: 'IPs',
      min: 1,
      defaultValue: 1,
    },
  },
  {
    id: 'vpn',
    label: 'VPN',
    group: 'Connection',
    groupNote: 'VPN, proxy, location, and bots. Checked on signup or sign-in.',
    detail: 'Flag a signup or sign-in that comes through a VPN.',
    whenLabel: 'Checked once, on signup or sign-in.',
  },
  {
    id: 'proxy',
    label: 'Proxy',
    group: 'Connection',
    groupNote: 'VPN, proxy, location, and bots. Checked on signup or sign-in.',
    detail: 'Flag a signup or sign-in that comes through a proxy.',
    whenLabel: 'Checked once, on signup or sign-in.',
  },
  {
    id: 'location',
    label: 'Location',
    group: 'Connection',
    groupNote: 'VPN, proxy, location, and bots. Checked on signup or sign-in.',
    detail: 'Flag a signup or sign-in whose location does not match its IP address.',
    whenLabel: 'Checked once, on signup or sign-in.',
  },
  {
    id: 'bot',
    label: 'Bot and automation detection',
    group: 'Connection',
    groupNote: 'VPN, proxy, location, and bots. Checked on signup or sign-in.',
    detail: 'Flag a signup or sign-in that looks like a script or another automated tool.',
    whenLabel: 'Checked on signup or sign-in, and again if the session looks scripted.',
  },
  {
    id: 'ai-detection',
    label: 'AI detection',
    group: 'What they write',
    groupNote: 'AI-written text, pasting, and disposable email.',
    detail: 'Flag signup or profile text that reads like it was written by an AI tool.',
    whenLabel: 'Checked throughout, whenever signup or profile text is written.',
    tolerance: {
      label: 'AI-like entries allowed',
      singular: 'AI-like entry',
      plural: 'AI-like entries',
      min: 0,
      defaultValue: 0,
    },
  },
  {
    id: 'copy-paste',
    label: 'Copy and paste detection',
    group: 'What they write',
    groupNote: 'AI-written text, pasting, and disposable email.',
    detail: 'Flag text pasted into a signup or profile instead of typed.',
    whenLabel: 'Checked throughout, whenever text is entered.',
    tolerance: {
      label: 'Pasted entries allowed',
      singular: 'pasted entry',
      plural: 'pasted entries',
      min: 0,
      defaultValue: 0,
    },
  },
  {
    id: 'disposable-email',
    label: 'Disposable email',
    group: 'What they write',
    groupNote: 'AI-written text, pasting, and disposable email.',
    detail: 'Flag signups that use a throwaway email address.',
    whenLabel: 'Checked once, when the account is created.',
  },
] as const;

export type CommunityCheckId = (typeof COMMUNITY_CHECKS)[number]['id'];

export type LoginCheck = 'off' | 'sporadic' | 'every';

export const COMMUNITY_HELP = {
  signups:
    'A person joining the community creates an account as usual. Repeated or automated signups ' +
    'are asked to confirm, or to try again later. Sharing a home or workplace is not a reason ' +
    'to stop them.',
  logins:
    'Choose how often a sign-in is reviewed. Members who pass still get in. A wrong password ' +
    'never reveals whether that email has an account.',
  sample:
    '10 means about one sign-in in every ten is reviewed. The rest go straight through, with ' +
    'no extra step.',
  recovery:
    'Someone can still ask for a reset. The reply looks the same whether or not that email has ' +
    'an account. Too many requests in a short time are asked to wait.',
  invitations:
    'A new invitation is accepted as usual. An invitation that was already used is stopped, and ' +
    'the person can ask the sender for a fresh one.',
} as const;

export const LOGIN_CHECK_HELP: Record<LoginCheck, string> = {
  off: 'Sign-ins work exactly as they do today. Integrity does not review them.',
  sporadic:
    'Most members sign in with no extra step. Every so often, one sign-in is reviewed. A ' +
    'normal one continues. One that looks automated may be asked to confirm.',
  every:
    'Every sign-in is reviewed. A normal member still gets in. Repeated wrong passwords, or a ' +
    'sign-in that looks automated, can be asked to wait or confirm.',
};

export type CheckTolerance<T extends string> = Partial<Record<T, number>>;

export interface SurveyProtectionRecord {
  surveyId: number;
  protections: SurveyProtectionId[];
  checks: SurveyCheckId[];
  tolerance?: CheckTolerance<SurveyCheckId>;
}

export interface CommunityProtectionRecord {
  communityId: CommunityId;
  signups: boolean;
  loginCheck: LoginCheck;
  loginEvery: number;
  recovery: boolean;
  invitations: boolean;
  checks: CommunityCheckId[];
  tolerance?: CheckTolerance<CommunityCheckId>;
}

export interface IntegrityCoverage {
  surveys: SurveyProtectionRecord[];
  communities: CommunityProtectionRecord[];
}

export const EMPTY_INTEGRITY_COVERAGE: IntegrityCoverage = {
  surveys: [],
  communities: [],
};

export const INTEGRITY_COVERAGE_KEY = 'integrity-coverage';

const PROTECTION_IDS = new Set<string>(SURVEY_PROTECTIONS.map((item) => item.id));

export function surveyProtectionLabel(id: SurveyProtectionId): string {
  return SURVEY_PROTECTIONS.find((item) => item.id === id)?.label ?? id;
}

export function surveyProtectionSummary(ids: SurveyProtectionId[]): string {
  if (ids.length === 0) return 'Not protected';
  return SURVEY_PROTECTIONS.filter((item) => ids.includes(item.id))
    .map((item) => item.label)
    .join(', ');
}

export function normalizeProtections(ids: SurveyProtectionId[]): SurveyProtectionId[] {
  return SURVEY_PROTECTIONS.map((item) => item.id).filter((id) => ids.includes(id));
}

export function normalizeSurveyChecks(ids: readonly string[]): SurveyCheckId[] {
  return SURVEY_CHECKS.map((item) => item.id).filter((id) => ids.includes(id));
}

export function normalizeCommunityChecks(ids: readonly string[]): CommunityCheckId[] {
  return COMMUNITY_CHECKS.map((item) => item.id).filter((id) => ids.includes(id));
}

export function enabledSurveyChecks(ids: readonly string[] | undefined) {
  const checks = normalizeSurveyChecks(ids ?? []);
  return SURVEY_CHECKS.filter((item) => checks.includes(item.id));
}

export function protectionsForSurveyChecks(ids: readonly string[]): SurveyProtectionId[] {
  const moments = new Set(enabledSurveyChecks(ids).map((item) => item.moment));
  const protections: SurveyProtectionId[] = [];
  if (moments.has('open') || moments.has('session')) protections.push('start');
  if (moments.has('throughout') || moments.has('session')) {
    protections.push('participation');
    protections.push('submission');
  }
  return protections;
}

type ToleranceSpec = {
  id: string;
  tolerance?: { min: number; defaultValue: number; singular: string; plural: string };
};

export function normalizeTolerance<T extends string>(
  checks: readonly T[],
  stored: Partial<Record<string, number>> | undefined,
  catalog: readonly ToleranceSpec[],
): Partial<Record<T, number>> {
  const next: Partial<Record<T, number>> = {};
  for (const id of checks) {
    const spec = catalog.find((item) => item.id === id)?.tolerance;
    if (!spec) continue;
    const raw = stored?.[id];
    const value =
      typeof raw === 'number' && Number.isFinite(raw) ? Math.floor(raw) : spec.defaultValue;
    next[id] = Math.max(spec.min, value);
  }
  return next;
}

export function toleranceSummary(
  checks: readonly string[] | undefined,
  stored: Partial<Record<string, number>> | undefined,
  catalog: readonly ToleranceSpec[],
): string {
  const enabled = new Set(checks ?? []);
  return catalog
    .filter((item) => item.tolerance && enabled.has(item.id))
    .map((item) => {
      const spec = item.tolerance;
      if (!spec) return '';
      const raw = stored?.[item.id];
      const value =
        typeof raw === 'number' && Number.isFinite(raw) ? Math.floor(raw) : spec.defaultValue;
      const count = Math.max(spec.min, value);
      return `${count} ${count === 1 ? spec.singular : spec.plural}`;
    })
    .filter(Boolean)
    .join(', ');
}

export function surveyCheckSummary(ids: readonly string[] | undefined): string {
  const checks = enabledSurveyChecks(ids);
  if (checks.length === 0) return 'No checks on';
  return checks.map((item) => item.label).join(', ');
}

export function surveyWhenSummary(ids: readonly string[] | undefined): string {
  const labels = enabledSurveyChecks(ids).map((item) => item.whenLabel);
  return [...new Set(labels)].join(' ');
}

export function enabledCommunityChecks(ids: readonly string[] | undefined) {
  const checks = normalizeCommunityChecks(ids ?? []);
  return COMMUNITY_CHECKS.filter((item) => checks.includes(item.id));
}

export function communityCheckSummary(ids: readonly string[] | undefined): string {
  const checks = enabledCommunityChecks(ids);
  if (checks.length === 0) return '';
  return checks.map((item) => item.label).join(', ');
}

export function findSurveyProtection(
  coverage: IntegrityCoverage,
  surveyId: number,
): SurveyProtectionRecord | null {
  return coverage.surveys.find((item) => item.surveyId === surveyId) ?? null;
}

export function findCommunityProtection(
  coverage: IntegrityCoverage,
  communityId: CommunityId,
): CommunityProtectionRecord | null {
  return coverage.communities.find((item) => item.communityId === communityId) ?? null;
}

export function communityIsProtected(record: CommunityProtectionRecord | null): boolean {
  if (!record) return false;
  const checks = record.checks ?? [];
  return (
    record.signups ||
    record.loginCheck !== 'off' ||
    record.recovery ||
    record.invitations ||
    checks.length > 0
  );
}

export function communityProtectionSummary(record: CommunityProtectionRecord | null): string {
  if (!record || !communityIsProtected(record)) return 'Not protected';
  const parts: string[] = [];
  if (record.signups) parts.push('Signups');
  if (record.loginCheck === 'every') parts.push('Every login');
  if (record.loginCheck === 'sporadic') {
    parts.push(`1 in ${Math.max(2, record.loginEvery)} logins`);
  }
  if (record.recovery) parts.push('Account recovery');
  if (record.invitations) parts.push('Invitations');
  const when = parts.join(', ');
  const what = communityCheckSummary(record.checks);
  const counts = toleranceSummary(record.checks, record.tolerance, COMMUNITY_CHECKS);
  const detail = [what, counts].filter(Boolean).join('. ');
  if (when && detail) return `${when} · ${detail}`;
  return when || detail || 'Not protected';
}

export function loginIsSampled(visitNumber: number, every: number): boolean {
  const step = Math.max(2, Math.floor(every));
  return visitNumber > 0 && visitNumber % step === 0;
}

export function isSurveyProtectionId(value: string): value is SurveyProtectionId {
  return PROTECTION_IDS.has(value);
}
