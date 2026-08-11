import {
  CONNECTORS,
  newCondition,
  newCriterion,
  NOTIFICATION_CONDITION_SOURCES,
  parseSelectedValues,
  uniqueId,
  type Criterion,
  type CriterionCondition,
  type ConditionSource,
  type ConditionConnector,
} from '@/data/mock-criteria-engine';
import type {
  AdvanceQuotaCriterionBlock,
  AdvanceQuotaRuleCondition,
} from '@/data/mock-advance-quotas';
import type { SurveyQuestion } from '@/data/mock-survey-questions';
import { MOCK_EMAIL_LISTS } from '@/data/mock-survey-distribute';

function nextNotificationId(): string {
  return uniqueId('notification');
}

export type SurveyNotificationSendTo = 'Respondent' | 'Survey Administrator' | 'Both' | '';

export type SurveyNotificationListView = 'compact' | 'expanded';

export type SurveyNotificationExecutionWhen = 'criteria-met' | 'criteria-not-met';

export interface SurveyNotificationItem {
  id: string;
  name: string;
  enabled: boolean;
  /** Built-in notifications that cannot be deleted or previewed via the eye icon. */
  isSystem: boolean;
  sendTo: SurveyNotificationSendTo;
  /** Short list-column label derived from criteriaBlocks. */
  criteria: string;
  criteriaBlocks: Criterion[];
  executionWhen: SurveyNotificationExecutionWhen;
  emailAdministrator: boolean;
  emailRespondent: boolean;
  attachResponse: boolean;
  includeSystemVariables: boolean;
  customAttachment: boolean;
  customAttachmentName: string;
  toEmails: string[];
  fromSenderId: string;
  replyTo: string;
  subject: string;
  body: string;
}

export const SYSTEM_NOTIFICATION_IDS = [
  'notification-thank-you',
  'notification-admin-confirmation',
  'notification-quota',
] as const;

export function isSystemSurveyNotification(
  item: Pick<SurveyNotificationItem, 'id' | 'isSystem' | 'name'>
): boolean {
  if (item.isSystem) return true;
  if ((SYSTEM_NOTIFICATION_IDS as readonly string[]).includes(item.id)) return true;
  return (
    item.name === 'Respondent acknowledgment' ||
    item.name === 'Thank You Email' ||
    item.name === 'Admin Confirmation' ||
    item.name === 'Quota Notification'
  );
}

/** Built-in notifications with a fixed trigger — no editable criteria. */
export function getFixedNotificationCriteriaLabel(
  item: Pick<SurveyNotificationItem, 'id' | 'name'>
): string | null {
  if (
    item.id === 'notification-thank-you' ||
    item.id === 'notification-admin-confirmation' ||
    item.name === 'Respondent acknowledgment' ||
    item.name === 'Thank You Email' ||
    item.name === 'Admin Confirmation'
  ) {
    return 'Completed response';
  }
  if (item.id === 'notification-quota' || item.name === 'Quota Notification') {
    return 'Quota reached';
  }
  return null;
}

export function notificationUsesEditableCriteria(
  item: Pick<SurveyNotificationItem, 'id' | 'name'>
): boolean {
  return getFixedNotificationCriteriaLabel(item) === null;
}

export function isCompletedResponseNotification(
  item: Pick<SurveyNotificationItem, 'id' | 'name'>
): boolean {
  return getFixedNotificationCriteriaLabel(item) === 'Completed response';
}

export function isQuotaNotification(
  item: Pick<SurveyNotificationItem, 'id' | 'name'>
): boolean {
  return getFixedNotificationCriteriaLabel(item) === 'Quota reached';
}

export function isAdminConfirmationNotification(
  item: Pick<SurveyNotificationItem, 'id' | 'name'>
): boolean {
  return (
    item.id === 'notification-admin-confirmation' ||
    item.name === 'Admin Confirmation'
  );
}

export function notificationSupportsEmailRespondent(
  item: Pick<SurveyNotificationItem, 'id' | 'name'>
): boolean {
  return !isQuotaNotification(item) && !isAdminConfirmationNotification(item);
}

export function notificationSupportsEmailAdministrator(
  item: Pick<SurveyNotificationItem, 'id' | 'name'>
): boolean {
  return !isRespondentAcknowledgmentNotification(item);
}

export const COMPLETED_RESPONSE_NOTIFICATION_HELP =
  'Notification will be sent every time a response is completed';

export const QUOTA_NOTIFICATION_HELP =
  'An email notification will be sent when the survey quota is reached.';

export const RESPONDENT_ACKNOWLEDGMENT_DEFAULT_BODY =
  '<p>Hi,</p><p>Thank you for your response. I really appreciate you taking the time to get back to me.</p><p>Have a great day!</p><p>Best regards,</p>';

export const QUOTA_NOTIFICATION_DEFAULT_SUBJECT = 'A quota has been met on your survey';

export const QUOTA_NOTIFICATION_DEFAULT_BODY = '<p>A quota has been met in your survey.</p>';

export function isRespondentAcknowledgmentNotification(
  item: Pick<SurveyNotificationItem, 'id' | 'name'>
): boolean {
  return (
    item.id === 'notification-thank-you' ||
    item.name === 'Respondent acknowledgment' ||
    item.name === 'Thank You Email'
  );
}

export function getFixedNotificationHelpText(
  item: Pick<SurveyNotificationItem, 'id' | 'name'>
): string | null {
  if (isCompletedResponseNotification(item)) {
    return COMPLETED_RESPONSE_NOTIFICATION_HELP;
  }
  if (isQuotaNotification(item)) {
    return QUOTA_NOTIFICATION_HELP;
  }
  return null;
}

export interface SurveyNotificationSettings {
  items: SurveyNotificationItem[];
  listView: SurveyNotificationListView;
}

export const SURVEY_NOTIFICATION_HELP =
  'Configure emails sent when respondents complete the survey, hit a quota, or leave a partial response.';

export const SURVEY_NOTIFICATION_LIST_VIEW_OPTIONS: {
  value: SurveyNotificationListView;
  label: string;
}[] = [
  { value: 'compact', label: 'Compact View' },
  { value: 'expanded', label: 'Expanded View' },
];

export const SURVEY_NOTIFICATION_EXECUTION_OPTIONS: {
  value: SurveyNotificationExecutionWhen;
  label: string;
}[] = [
  { value: 'criteria-met', label: 'If Criteria is met' },
  { value: 'criteria-not-met', label: 'If Criteria is not met' },
];

export const SURVEY_NOTIFICATION_FROM_OPTIONS: { value: string; label: string }[] = [
  {
    value: 'questionpro-survey',
    label: 'QuestionPro Survey (survey@qp-mail.com)',
  },
  {
    value: 'kartik-bhat',
    label: 'Kartik Bhat (kartik.bhat@questionpro.com)',
  },
  {
    value: 'research-team',
    label: 'Research Team (research@questionpro.com)',
  },
];

export type NotificationOrgUserRole = 'Survey Administrator' | 'Multi-User Account';

export interface NotificationOrgUser {
  id: string;
  email: string;
  role: NotificationOrgUserRole;
}

/** Organization users shown when picking recipients for notification To. */
export const MOCK_NOTIFICATION_ORG_USERS: NotificationOrgUser[] = [
  {
    id: 'org-admin-1',
    email: 'kartik.bhat@questionpro.com',
    role: 'Survey Administrator',
  },
  {
    id: 'org-mu-1',
    email: 'block_kartik.r.bhat@gmail.com',
    role: 'Multi-User Account',
  },
  {
    id: 'org-mu-2',
    email: 'kartik.dashboard@questionpro.com',
    role: 'Multi-User Account',
  },
  {
    id: 'org-mu-3',
    email: 'kartikbhat@haha.com',
    role: 'Multi-User Account',
  },
  {
    id: 'org-mu-4',
    email: 'testing_1@testing.com',
    role: 'Multi-User Account',
  },
  {
    id: 'org-mu-5',
    email: 'invoicing@questionpro.com',
    role: 'Multi-User Account',
  },
  {
    id: 'org-mu-6',
    email: 'zolin.gonwsalves+1@me.com',
    role: 'Multi-User Account',
  },
  {
    id: 'org-mu-7',
    email: 'testinginvoice@questionpro.com',
    role: 'Multi-User Account',
  },
  {
    id: 'org-mu-8',
    email: 'ops-alerts@questionpro.com',
    role: 'Multi-User Account',
  },
  {
    id: 'org-mu-9',
    email: 'research.team@questionpro.com',
    role: 'Multi-User Account',
  },
  {
    id: 'org-mu-10',
    email: 'qa.automation@questionpro.com',
    role: 'Multi-User Account',
  },
];

export const NOTIFICATION_ORG_USER_ROLE_ORDER: NotificationOrgUserRole[] = [
  'Survey Administrator',
  'Multi-User Account',
];

export function groupNotificationOrgUsers(
  users: NotificationOrgUser[],
  query = ''
): { role: NotificationOrgUserRole; users: NotificationOrgUser[] }[] {
  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? users.filter((user) => user.email.toLowerCase().includes(trimmed))
    : users;

  return NOTIFICATION_ORG_USER_ROLE_ORDER.map((role) => ({
    role,
    users: filtered.filter((user) => user.role === role),
  })).filter((group) => group.users.length > 0);
}

export function normalizeNotificationReplyTo(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (SURVEY_NOTIFICATION_FROM_OPTIONS.some((option) => option.value === trimmed)) {
    return trimmed;
  }
  const matched = SURVEY_NOTIFICATION_FROM_OPTIONS.find(
    (option) =>
      option.label.toLowerCase().includes(trimmed.toLowerCase()) ||
      trimmed.toLowerCase().includes(
        (option.label.match(/\(([^)]+)\)/)?.[1] ?? '').toLowerCase()
      )
  );
  return matched?.value ?? '';
}

export function createSurveyNotificationCriterion(
  partial?: Partial<Criterion>
): Criterion {
  const base = newCriterion();
  return {
    ...base,
    ...partial,
    id: partial?.id ?? base.id,
    conditions:
      partial?.conditions && partial.conditions.length > 0
        ? partial.conditions
        : base.conditions,
  };
}

export function deriveNotificationSendTo(
  emailAdministrator: boolean,
  emailRespondent: boolean
): SurveyNotificationSendTo {
  if (emailAdministrator && emailRespondent) return 'Both';
  if (emailAdministrator) return 'Survey Administrator';
  if (emailRespondent) return 'Respondent';
  return '';
}

/** List-column label: role recipients plus any explicit To emails. */
export function formatNotificationSendToLabel(item: {
  sendTo: SurveyNotificationSendTo;
  emailAdministrator?: boolean;
  emailRespondent?: boolean;
  toEmails: string[];
}): string {
  const parts: string[] = [];

  if (item.sendTo === 'Both' || (item.emailAdministrator && item.emailRespondent)) {
    parts.push('Survey Administrator', 'Respondent');
  } else if (item.sendTo === 'Survey Administrator' || item.emailAdministrator) {
    parts.push('Survey Administrator');
  } else if (item.sendTo === 'Respondent' || item.emailRespondent) {
    parts.push('Respondent');
  } else if (item.sendTo) {
    parts.push(item.sendTo);
  }

  for (const email of item.toEmails) {
    const trimmed = email.trim();
    if (trimmed && !parts.includes(trimmed)) {
      parts.push(trimmed);
    }
  }
  return parts.length > 0 ? parts.join(', ') : '—';
}

export function deriveNotificationCriteriaLabel(
  blocks: Criterion[],
  questions: SurveyQuestion[] = []
): string {
  const first = blocks[0];
  if (!first) return '';

  const cond = first.conditions[0];
  if (!cond) return first.name.trim();

  if (cond.source === 'Question') {
    const question = questions.find((item) => item.id === cond.questionId);
    if (question) {
      const firstValue = cond.value
        .split(',')
        .map((part) => part.trim())
        .find((part) => part.length > 0);
      if (firstValue) {
        const hasMore = cond.value.includes(',');
        return `${question.code} ${cond.operator} ${firstValue}${hasMore ? '…' : ''}`;
      }
      return question.code;
    }
  }

  if (cond.source === 'System Variable' && cond.systemVariable) {
    if (cond.value.trim()) {
      return `${cond.systemVariable} ${cond.operator} ${cond.value}`;
    }
    return cond.systemVariable;
  }

  if (cond.source === 'Response Status') {
    const statuses = cond.value
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    if (statuses.length === 1 && statuses[0] === 'Completed') {
      return 'Completed response';
    }
    if (statuses.length === 1 && statuses[0] === 'All') {
      return 'Response Status';
    }
    if (statuses.length > 0) {
      return `Response Status is ${statuses.join(', ')}`;
    }
    return 'Response Status';
  }

  if (cond.source === 'Geo Location') {
    if (cond.systemVariable && cond.value.trim()) {
      return `${cond.systemVariable} ${cond.operator} ${cond.value}`;
    }
    if (cond.systemVariable) return cond.systemVariable;
    return 'Geo Location';
  }

  if (cond.source === 'Email List Code') {
    const selected = parseSelectedValues(cond.value).map((entry) => {
      const list = MOCK_EMAIL_LISTS.find(
        (item) => item.value === entry || item.label === entry
      );
      return list?.label ?? entry;
    });
    if (selected.length === 1) return selected[0];
    if (selected.length > 1) return `${selected[0]}…`;
    return 'Email List Code';
  }

  if (cond.source === 'Device Type') {
    if (cond.value.trim()) return cond.value.trim();
    return 'Device Type';
  }

  if (cond.source === 'Quota') {
    if (cond.systemVariable && cond.value.trim()) {
      return `Quota ${cond.systemVariable} ${cond.operator} ${cond.value}`;
    }
    if (cond.systemVariable) return `Quota ${cond.systemVariable}`;
    return 'Quota';
  }

  if (cond.source === 'Language') {
    const languages = parseSelectedValues(cond.value);
    if (languages.length === 1) return `Language is ${languages[0]}`;
    if (languages.length > 1) return `Language is ${languages[0]}…`;
    return 'Language';
  }

  if (cond.source === 'Data Quality') {
    const qualities = parseSelectedValues(cond.value);
    const operator = cond.operator === 'is not' ? 'is not' : 'is';
    if (qualities.length === 1) return `Data Quality ${operator} ${qualities[0]}`;
    if (qualities.length > 1) return `Data Quality ${operator} ${qualities[0]}…`;
    return 'Data Quality';
  }

  if (first.name.trim()) return first.name.trim();
  return cond.source;
}

function criterionConditionToDisplayRule(
  cond: CriterionCondition,
  questions: SurveyQuestion[]
): AdvanceQuotaRuleCondition {
  const question =
    cond.source === 'Question' && cond.questionId !== null
      ? questions.find((item) => item.id === cond.questionId)
      : undefined;

  let subject: string = cond.source;
  if (cond.source === 'Question') {
    subject = question?.text ?? '';
  } else if (cond.source === 'System Variable' || cond.source === 'Geo Location' || cond.source === 'Quota') {
    subject = cond.systemVariable ?? '';
  } else if (cond.source === 'Email List Code') {
    subject = 'Email List Code';
  } else if (cond.source === 'Device Type') {
    subject = 'Device Type';
  } else if (cond.source === 'Language') {
    subject = 'Language';
  } else if (cond.source === 'Data Quality') {
    subject = 'Data Quality';
  }

  let value = cond.value;
  if (cond.source === 'Email List Code') {
    value = parseSelectedValues(cond.value)
      .map((entry) => {
        const list = MOCK_EMAIL_LISTS.find(
          (item) => item.value === entry || item.label === entry
        );
        return list?.label ?? entry;
      })
      .join(', ');
  }

  return {
    source: cond.source,
    questionCode: question?.code,
    questionText: question?.text,
    subject,
    operator: cond.operator,
    value,
    valueEnd: cond.valueEnd || undefined,
    connector: cond.connector,
  };
}

export function notificationCriteriaToDisplayBlocks(
  criteriaBlocks: Criterion[],
  questions: SurveyQuestion[] = []
): AdvanceQuotaCriterionBlock[] {
  return criteriaBlocks.map((block, index) => ({
    name: block.name.trim() || `Criteria ${index + 1}`,
    conditions: block.conditions.map((cond) =>
      criterionConditionToDisplayRule(cond, questions)
    ),
  }));
}

export function buildDefaultNotificationEmail(
  surveyName: string,
  notificationName: string
): { subject: string; body: string } {
  const isRespondentAcknowledgment =
    notificationName === 'Respondent acknowledgment' ||
    notificationName === 'Thank You Email';
  const isQuota = notificationName === 'Quota Notification';

  if (isRespondentAcknowledgment) {
    return {
      subject: `Response received for survey - ${surveyName}`,
      body: RESPONDENT_ACKNOWLEDGMENT_DEFAULT_BODY,
    };
  }

  if (isQuota) {
    return {
      subject: QUOTA_NOTIFICATION_DEFAULT_SUBJECT,
      body: QUOTA_NOTIFICATION_DEFAULT_BODY,
    };
  }

  return {
    subject: `Response received for survey - ${surveyName}`,
    body: `<p>Respondent has submitted a response for your survey ${surveyName} matching notification ${notificationName}</p>`,
  };
}

export function createSurveyNotificationItem(
  partial?: Partial<SurveyNotificationItem> & { surveyName?: string }
): SurveyNotificationItem {
  const surveyName = partial?.surveyName ?? 'Survey';
  const name = partial?.name ?? 'New Notification';
  const emailDefaults = buildDefaultNotificationEmail(surveyName, name);
  const emailAdministrator = partial?.emailAdministrator ?? true;
  const emailRespondent = partial?.emailRespondent ?? false;
  const criteriaBlocks =
    partial?.criteriaBlocks ?? [createSurveyNotificationCriterion()];

  return {
    id: partial?.id ?? nextNotificationId(),
    name,
    enabled: partial?.enabled ?? false,
    isSystem: partial?.isSystem ?? false,
    emailAdministrator,
    emailRespondent,
    attachResponse: partial?.attachResponse ?? false,
    includeSystemVariables: partial?.includeSystemVariables ?? true,
    customAttachment: partial?.customAttachment ?? false,
    customAttachmentName: partial?.customAttachmentName ?? '',
    sendTo:
      partial?.sendTo ??
      deriveNotificationSendTo(emailAdministrator, emailRespondent),
    criteria: partial?.criteria ?? deriveNotificationCriteriaLabel(criteriaBlocks),
    criteriaBlocks,
    executionWhen: partial?.executionWhen ?? 'criteria-met',
    toEmails: partial?.toEmails ?? [],
    fromSenderId: partial?.fromSenderId ?? 'questionpro-survey',
    replyTo: partial?.replyTo ?? '',
    subject: partial?.subject ?? emailDefaults.subject,
    body: partial?.body ?? emailDefaults.body,
  };
}

export function createDefaultSurveyNotificationItems(): SurveyNotificationItem[] {
  return [
    createSurveyNotificationItem({
      id: 'notification-thank-you',
      name: 'Respondent acknowledgment',
      isSystem: true,
      enabled: false,
      emailAdministrator: false,
      emailRespondent: true,
      criteria: 'Completed response',
      criteriaBlocks: [],
    }),
    createSurveyNotificationItem({
      id: 'notification-admin-confirmation',
      name: 'Admin Confirmation',
      isSystem: true,
      enabled: false,
      emailAdministrator: true,
      emailRespondent: false,
      criteria: 'Completed response',
      criteriaBlocks: [],
    }),
    createSurveyNotificationItem({
      id: 'notification-quota',
      name: 'Quota Notification',
      isSystem: true,
      enabled: false,
      emailAdministrator: true,
      emailRespondent: false,
      criteria: 'Quota reached',
      criteriaBlocks: [],
    }),
  ];
}

export const DEFAULT_SURVEY_NOTIFICATION_SETTINGS: SurveyNotificationSettings = {
  items: createDefaultSurveyNotificationItems(),
  listView: 'compact',
};

function isConditionSource(value: unknown): value is ConditionSource {
  return (
    typeof value === 'string' &&
    (NOTIFICATION_CONDITION_SOURCES as readonly string[]).includes(value)
  );
}

function isConnector(value: unknown): value is ConditionConnector {
  return typeof value === 'string' && (CONNECTORS as readonly string[]).includes(value);
}

function normalizeCondition(value: unknown): CriterionCondition | null {
  if (!value || typeof value !== 'object') return null;
  const parsed = value as Partial<CriterionCondition> & {
    field?: string;
  };

  // Legacy notification condition: field / operator / value
  if (typeof parsed.field === 'string') {
    const base = newCondition();
    return {
      ...base,
      id: typeof parsed.id === 'string' && parsed.id ? parsed.id : uniqueId('cond'),
      source: 'System Variable',
      systemVariable: parsed.field,
      operator:
        typeof parsed.operator === 'string' && parsed.operator
          ? parsed.operator
          : 'equals',
      value: typeof parsed.value === 'string' ? parsed.value : '',
      connector: 'AND',
    };
  }

  const base = newCondition();
  const source = isConditionSource(parsed.source) ? parsed.source : base.source;
  let systemVariable =
    typeof parsed.systemVariable === 'string' ? parsed.systemVariable : null;
  if (systemVariable === 'Country code') {
    systemVariable = 'Country';
  }
  let operator =
    typeof parsed.operator === 'string' && parsed.operator ? parsed.operator : base.operator;
  if (source === 'Geo Location') {
    operator = 'is';
  }

  return {
    ...base,
    id: typeof parsed.id === 'string' && parsed.id ? parsed.id : uniqueId('cond'),
    source,
    questionId: typeof parsed.questionId === 'number' ? parsed.questionId : null,
    systemVariable,
    operator,
    value: typeof parsed.value === 'string' ? parsed.value : '',
    valueEnd: typeof parsed.valueEnd === 'string' ? parsed.valueEnd : '',
    connector: isConnector(parsed.connector) ? parsed.connector : 'AND',
  };
}

function normalizeCriterion(value: unknown): Criterion | null {
  if (!value || typeof value !== 'object') return null;
  const parsed = value as Partial<Criterion>;
  const conditions = Array.isArray(parsed.conditions)
    ? parsed.conditions
        .map(normalizeCondition)
        .filter((item): item is CriterionCondition => item !== null)
    : [newCondition()];

  return createSurveyNotificationCriterion({
    id: typeof parsed.id === 'string' && parsed.id ? parsed.id : undefined,
    name: typeof parsed.name === 'string' ? parsed.name : '',
    mode: parsed.mode === 'existing' ? 'existing' : 'new',
    existingCriteriaId:
      typeof parsed.existingCriteriaId === 'string' ? parsed.existingCriteriaId : null,
    existingConditionsSnapshot:
      typeof parsed.existingConditionsSnapshot === 'string'
        ? parsed.existingConditionsSnapshot
        : null,
    requiresRename: Boolean(parsed.requiresRename),
    conditions: conditions.length > 0 ? conditions : [newCondition()],
  });
}

function normalizeNotificationItem(value: unknown): SurveyNotificationItem | null {
  if (!value || typeof value !== 'object') return null;
  const parsed = value as Partial<SurveyNotificationItem>;
  const criteriaBlocks = Array.isArray(parsed.criteriaBlocks)
    ? parsed.criteriaBlocks
        .map(normalizeCriterion)
        .filter((item): item is Criterion => item !== null)
    : [createSurveyNotificationCriterion()];

  const emailAdministrator =
    typeof parsed.emailAdministrator === 'boolean'
      ? parsed.emailAdministrator
      : parsed.sendTo === 'Survey Administrator' || parsed.sendTo === 'Both';
  const emailRespondent =
    typeof parsed.emailRespondent === 'boolean'
      ? parsed.emailRespondent
      : parsed.sendTo === 'Respondent' || parsed.sendTo === 'Both';

  const blocks =
    criteriaBlocks.length > 0 ? criteriaBlocks : [createSurveyNotificationCriterion()];

  const legacyToEmail =
    typeof (parsed as { toEmail?: unknown }).toEmail === 'string'
      ? ((parsed as { toEmail: string }).toEmail
          .split(/[,;\n]+/)
          .map((part) => part.trim())
          .filter((part) => part.length > 0))
      : [];
  const toEmails = Array.isArray(parsed.toEmails)
    ? parsed.toEmails.filter((email): email is string => typeof email === 'string' && email.trim().length > 0)
    : legacyToEmail;

  const rawId = typeof parsed.id === 'string' && parsed.id ? parsed.id : undefined;
  const rawName = typeof parsed.name === 'string' ? parsed.name : 'New Notification';
  const name =
    rawId === 'notification-thank-you' || rawName === 'Thank You Email'
      ? 'Respondent acknowledgment'
      : rawName;

  const item = createSurveyNotificationItem({
    id: rawId,
    name,
    enabled: Boolean(parsed.enabled),
    isSystem: isSystemSurveyNotification({
      id: rawId ?? '',
      name,
      isSystem: Boolean(parsed.isSystem),
    }),
    emailAdministrator,
    emailRespondent,
    attachResponse: Boolean(parsed.attachResponse),
    includeSystemVariables:
      typeof parsed.includeSystemVariables === 'boolean'
        ? parsed.includeSystemVariables
        : true,
    customAttachment: Boolean(parsed.customAttachment),
    customAttachmentName:
      typeof parsed.customAttachmentName === 'string' ? parsed.customAttachmentName : '',
    criteriaBlocks: blocks,
    executionWhen:
      parsed.executionWhen === 'criteria-not-met' ? 'criteria-not-met' : 'criteria-met',
    toEmails,
    fromSenderId:
      typeof parsed.fromSenderId === 'string' && parsed.fromSenderId
        ? parsed.fromSenderId
        : 'questionpro-survey',
    replyTo:
      typeof parsed.replyTo === 'string'
        ? normalizeNotificationReplyTo(parsed.replyTo)
        : '',
    subject: typeof parsed.subject === 'string' ? parsed.subject : '',
    body: typeof parsed.body === 'string' ? parsed.body : '',
    sendTo: deriveNotificationSendTo(emailAdministrator, emailRespondent),
    criteria:
      typeof parsed.criteria === 'string' && parsed.criteria.trim()
        ? parsed.criteria
        : deriveNotificationCriteriaLabel(blocks),
  });

  return ensureQuotaNotificationDefaults(
    ensureRespondentAcknowledgmentDefaults(
      ensureFixedTriggerNotificationDefaults(item)
    )
  );
}

function isLegacyRespondentAcknowledgmentBody(body: string): boolean {
  const normalized = body.replace(/\s+/g, ' ').trim().toLowerCase();
  return (
    normalized.includes('respondent has submitted a response for your survey') &&
    normalized.includes('matching notification') &&
    normalized.includes('respondent acknowledgment')
  );
}

function isLegacyQuotaNotificationContent(item: SurveyNotificationItem): boolean {
  const body = item.body.replace(/\s+/g, ' ').trim().toLowerCase();
  const subject = item.subject.trim().toLowerCase();
  const legacyBody =
    body.includes('respondent has submitted a response for your survey') &&
    body.includes('matching notification') &&
    body.includes('quota notification');
  const legacySubject = subject.startsWith('response received for survey');
  return legacyBody || legacySubject;
}

function ensureRespondentAcknowledgmentDefaults(
  item: SurveyNotificationItem
): SurveyNotificationItem {
  if (!isRespondentAcknowledgmentNotification(item)) return item;
  if (!isLegacyRespondentAcknowledgmentBody(item.body)) return item;
  return {
    ...item,
    body: RESPONDENT_ACKNOWLEDGMENT_DEFAULT_BODY,
  };
}

function ensureQuotaNotificationDefaults(
  item: SurveyNotificationItem
): SurveyNotificationItem {
  if (!isQuotaNotification(item)) return item;
  if (!isLegacyQuotaNotificationContent(item)) return item;
  return {
    ...item,
    subject: QUOTA_NOTIFICATION_DEFAULT_SUBJECT,
    body: QUOTA_NOTIFICATION_DEFAULT_BODY,
  };
}

/** System notifications with a fixed trigger: clear criteria blocks and lock the list label. */
function ensureFixedTriggerNotificationDefaults(
  item: SurveyNotificationItem
): SurveyNotificationItem {
  const fixedCriteria = getFixedNotificationCriteriaLabel(item);
  if (!fixedCriteria) return item;
  const emailRespondent =
    isQuotaNotification(item) || isAdminConfirmationNotification(item)
      ? false
      : item.emailRespondent;
  return {
    ...item,
    criteria: fixedCriteria,
    criteriaBlocks: [],
    executionWhen: 'criteria-met',
    emailRespondent,
    sendTo: deriveNotificationSendTo(item.emailAdministrator, emailRespondent),
  };
}

function isLegacyAdvancedQuotaNotificationRow(
  item: Pick<SurveyNotificationItem, 'id' | 'name'>
): boolean {
  return (
    item.id === 'notification-advanced-quota' ||
    item.name === 'Advanced quota notifications'
  );
}

function ensureUniqueNotificationIds(
  items: SurveyNotificationItem[]
): SurveyNotificationItem[] {
  const seen = new Set<string>();
  return items.map((item) => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      return item;
    }
    const nextId = nextNotificationId();
    seen.add(nextId);
    return { ...item, id: nextId };
  });
}

export function normalizeSurveyNotificationSettings(
  value: unknown
): SurveyNotificationSettings {
  const fallback = {
    items: createDefaultSurveyNotificationItems(),
    listView: 'compact' as SurveyNotificationListView,
  };

  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const parsed = value as Partial<SurveyNotificationSettings> & {
    emailOnComplete?: boolean;
    emailOnQuotaReached?: boolean;
    emailOnPartialResponse?: boolean;
  };

  const listView =
    parsed.listView === 'expanded' || parsed.listView === 'compact'
      ? parsed.listView
      : fallback.listView;

  if (Array.isArray(parsed.items)) {
    const items = ensureUniqueNotificationIds(
      parsed.items
        .map(normalizeNotificationItem)
        .filter((item): item is SurveyNotificationItem => item !== null)
        .filter((item) => !isLegacyAdvancedQuotaNotificationRow(item))
    );

    return {
      items: items.length > 0 ? items : fallback.items,
      listView,
    };
  }

  // Migrate legacy toggle-only settings into list rows.
  const items = createDefaultSurveyNotificationItems().map((item) => {
    if (
      item.name === 'Respondent acknowledgment' ||
      item.name === 'Thank You Email' ||
      item.name === 'Admin Confirmation'
    ) {
      return { ...item, enabled: Boolean(parsed.emailOnComplete) };
    }
    if (item.name === 'Quota Notification') {
      return { ...item, enabled: Boolean(parsed.emailOnQuotaReached) };
    }
    return item;
  });

  if (parsed.emailOnPartialResponse) {
    items.push(
      createSurveyNotificationItem({
        name: 'Partial Response Email',
        enabled: true,
        emailAdministrator: true,
        emailRespondent: false,
        criteria: 'Partial responses',
        criteriaBlocks: [
          createSurveyNotificationCriterion({
            name: 'Partial responses',
          }),
        ],
      })
    );
  }

  return { items, listView };
}

/** Notification email delivery history shown from the Notifications footer. */
export type SurveyNotificationEmailSendStatus =
  | 'Delivered'
  | 'Sent'
  | 'Queued'
  | 'Failed'
  | 'Bounced'
  | 'Deferred';

export interface SurveyNotificationEmailSendLog {
  id: string;
  responseId: string;
  emailType: string;
  toEmail: string;
  fromEmail: string;
  sentOn: string;
  smtpStatus: SurveyNotificationEmailSendStatus;
  logs: string;
}

export const MOCK_SURVEY_NOTIFICATION_EMAIL_SEND_LOGS: SurveyNotificationEmailSendLog[] = [
  {
    id: 'nlog-1',
    responseId: '12894021',
    emailType: 'Thank You Email',
    toEmail: 'alex.morgan@northstar-bank.com',
    fromEmail: 'survey@qp-mail.com',
    sentOn: '2026-07-24T09:12:00.000Z',
    smtpStatus: 'Delivered',
    logs: '250 2.0.0 OK message accepted',
  },
  {
    id: 'nlog-2',
    responseId: '12893988',
    emailType: 'Admin Confirmation',
    toEmail: 'kartik.bhat@questionpro.com',
    fromEmail: 'survey@qp-mail.com',
    sentOn: '2026-07-24T08:47:00.000Z',
    smtpStatus: 'Delivered',
    logs: '250 2.0.0 OK message accepted',
  },
  {
    id: 'nlog-3',
    responseId: '12893102',
    emailType: 'Quota Notification',
    toEmail: 'ops-alerts@questionpro.com',
    fromEmail: 'survey@qp-mail.com',
    sentOn: '2026-07-23T16:22:00.000Z',
    smtpStatus: 'Sent',
    logs: 'Queued for delivery',
  },
  {
    id: 'nlog-4',
    responseId: '12892855',
    emailType: 'Thank You Email',
    toEmail: 'jordan.lee@example.com',
    fromEmail: 'survey@qp-mail.com',
    sentOn: '2026-07-23T14:05:00.000Z',
    smtpStatus: 'Bounced',
    logs: '550 5.1.1 User unknown',
  },
  {
    id: 'nlog-5',
    responseId: '12892014',
    emailType: 'Admin Confirmation',
    toEmail: 'research.team@questionpro.com',
    fromEmail: 'survey@qp-mail.com',
    sentOn: '2026-07-22T19:41:00.000Z',
    smtpStatus: 'Delivered',
    logs: '250 2.0.0 OK message accepted',
  },
  {
    id: 'nlog-6',
    responseId: '12891567',
    emailType: 'Thank You Email',
    toEmail: 'priya.shah@fintech.io',
    fromEmail: 'survey@qp-mail.com',
    sentOn: '2026-07-22T11:18:00.000Z',
    smtpStatus: 'Queued',
    logs: 'Waiting in outbound queue',
  },
  {
    id: 'nlog-7',
    responseId: '12890112',
    emailType: 'New test notification',
    toEmail: 'qa.automation@questionpro.com',
    fromEmail: 'survey@qp-mail.com',
    sentOn: '2026-07-21T21:03:00.000Z',
    smtpStatus: 'Failed',
    logs: '421 4.7.0 Temporary system problem',
  },
  {
    id: 'nlog-8',
    responseId: '12889440',
    emailType: 'Thank You Email',
    toEmail: 'casey.nguyen@retailco.com',
    fromEmail: 'survey@qp-mail.com',
    sentOn: '2026-07-21T10:55:00.000Z',
    smtpStatus: 'Delivered',
    logs: '250 2.0.0 OK message accepted',
  },
  {
    id: 'nlog-9',
    responseId: '12888003',
    emailType: 'Admin Confirmation',
    toEmail: 'kartik.bhat@questionpro.com',
    fromEmail: 'survey@qp-mail.com',
    sentOn: '2026-07-20T15:30:00.000Z',
    smtpStatus: 'Deferred',
    logs: '451 4.4.1 Connection timed out',
  },
  {
    id: 'nlog-10',
    responseId: '12887291',
    emailType: 'Quota Notification',
    toEmail: 'quota-watch@questionpro.com',
    fromEmail: 'survey@qp-mail.com',
    sentOn: '2026-07-19T08:14:00.000Z',
    smtpStatus: 'Delivered',
    logs: '250 2.0.0 OK message accepted',
  },
];

export function filterNotificationEmailSendLogs(
  logs: SurveyNotificationEmailSendLog[],
  query: string
): SurveyNotificationEmailSendLog[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return logs;
  return logs.filter(
    (log) =>
      log.responseId.toLowerCase().includes(trimmed) ||
      log.toEmail.toLowerCase().includes(trimmed)
  );
}

export interface SurveyNotificationGroupMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface SurveyNotificationGroup {
  id: string;
  name: string;
  members: SurveyNotificationGroupMember[];
}

export const NOTIFICATION_GROUPS_STORAGE_KEY = 'survey-notification-groups';

export function createNotificationGroupMember(
  partial?: Partial<SurveyNotificationGroupMember>
): SurveyNotificationGroupMember {
  return {
    id: partial?.id ?? uniqueId('ng-member'),
    email: partial?.email ?? '',
    firstName: partial?.firstName ?? '',
    lastName: partial?.lastName ?? '',
  };
}

export function createNotificationGroup(
  partial?: Partial<SurveyNotificationGroup>
): SurveyNotificationGroup {
  return {
    id: partial?.id ?? uniqueId('ng'),
    name: partial?.name ?? '',
    members: partial?.members ?? [createNotificationGroupMember()],
  };
}

export const DEFAULT_SURVEY_NOTIFICATION_GROUPS: SurveyNotificationGroup[] = [
  {
    id: 'ng-research-ops',
    name: 'Research Operations',
    members: [
      createNotificationGroupMember({
        id: 'ngm-1',
        email: 'kartik.bhat@questionpro.com',
        firstName: 'Kartik',
        lastName: 'Bhat',
      }),
      createNotificationGroupMember({
        id: 'ngm-2',
        email: 'research.team@questionpro.com',
        firstName: 'Research',
        lastName: 'Team',
      }),
      createNotificationGroupMember({
        id: 'ngm-3',
        email: 'ops-alerts@questionpro.com',
        firstName: 'Ops',
        lastName: 'Alerts',
      }),
    ],
  },
  {
    id: 'ng-branch-managers',
    name: 'Branch Managers',
    members: [
      createNotificationGroupMember({
        id: 'ngm-4',
        email: 'alex.morgan@northstar-bank.com',
        firstName: 'Alex',
        lastName: 'Morgan',
      }),
      createNotificationGroupMember({
        id: 'ngm-5',
        email: 'sam.rivera@northstar-bank.com',
        firstName: 'Sam',
        lastName: 'Rivera',
      }),
    ],
  },
  {
    id: 'ng-qa-reviewers',
    name: 'QA Reviewers',
    members: [
      createNotificationGroupMember({
        id: 'ngm-6',
        email: 'qa.automation@questionpro.com',
        firstName: 'QA',
        lastName: 'Automation',
      }),
    ],
  },
];

export function formatNotificationEmailSendTimestamp(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
