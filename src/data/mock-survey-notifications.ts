import {
  CONNECTORS,
  newCondition,
  newCriterion,
  NOTIFICATION_CONDITION_SOURCES,
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

function nextNotificationId(): string {
  return uniqueId('notification');
}

function createResponseStatusCondition(
  value: string,
  partial?: Partial<CriterionCondition>
): CriterionCondition {
  return {
    ...newCondition(),
    ...partial,
    id: partial?.id ?? uniqueId('cond'),
    source: 'Response Status',
    operator: 'is',
    value,
    valueEnd: '',
    questionId: null,
    systemVariable: null,
    connector: partial?.connector ?? 'AND',
  };
}

function createCompletedResponseCriterion(
  name = 'Completed response'
): Criterion {
  return createSurveyNotificationCriterion({
    name,
    conditions: [createResponseStatusCondition('Completed')],
  });
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
  } else if (cond.source === 'System Variable' || cond.source === 'Geo Location') {
    subject = cond.systemVariable ?? '';
  }

  return {
    source: cond.source,
    questionCode: question?.code,
    questionText: question?.text,
    subject,
    operator: cond.operator,
    value: cond.value,
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
      criteriaBlocks: [createCompletedResponseCriterion('Completed response')],
    }),
    createSurveyNotificationItem({
      id: 'notification-admin-confirmation',
      name: 'Admin Confirmation',
      isSystem: true,
      enabled: false,
      emailAdministrator: true,
      emailRespondent: false,
      criteria: 'Completed response',
      criteriaBlocks: [createCompletedResponseCriterion('Completed response')],
    }),
    createSurveyNotificationItem({
      id: 'notification-quota',
      name: 'Quota Notification',
      isSystem: true,
      enabled: false,
      emailAdministrator: true,
      emailRespondent: false,
      criteria: 'Quota reached',
      criteriaBlocks: [
        createSurveyNotificationCriterion({
          name: 'Quota reached',
        }),
      ],
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

  return ensureCompletedResponseDefaults(item);
}

function isThankYouOrAdminConfirmation(item: SurveyNotificationItem): boolean {
  return (
    item.id === 'notification-thank-you' ||
    item.id === 'notification-admin-confirmation' ||
    item.name === 'Respondent acknowledgment' ||
    item.name === 'Thank You Email' ||
    item.name === 'Admin Confirmation'
  );
}

function hasCompletedResponseStatus(blocks: Criterion[]): boolean {
  return blocks.some((block) =>
    block.conditions.some((cond) => {
      if (cond.source !== 'Response Status') return false;
      return cond.value
        .split(',')
        .map((part) => part.trim())
        .includes('Completed');
    })
  );
}

function looksLikeUnsetDefaultCriteria(blocks: Criterion[]): boolean {
  if (blocks.length === 0) return true;
  return blocks.every((block) =>
    block.conditions.every((cond) => {
      if (cond.source === 'Question') {
        return cond.questionId === null && cond.value.trim() === '';
      }
      if (cond.source === 'Response Status') {
        return cond.value.trim() === '';
      }
      return false;
    })
  );
}

/** Ensure Thank You / Admin Confirmation use Response Status → Completed by default. */
function ensureCompletedResponseDefaults(
  item: SurveyNotificationItem
): SurveyNotificationItem {
  if (!isThankYouOrAdminConfirmation(item)) return item;
  if (hasCompletedResponseStatus(item.criteriaBlocks)) {
    return {
      ...item,
      criteria: deriveNotificationCriteriaLabel(item.criteriaBlocks),
    };
  }
  if (!looksLikeUnsetDefaultCriteria(item.criteriaBlocks)) {
    return item;
  }
  const criteriaBlocks = [createCompletedResponseCriterion('Completed response')];
  return {
    ...item,
    criteriaBlocks,
    criteria: 'Completed response',
  };
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
