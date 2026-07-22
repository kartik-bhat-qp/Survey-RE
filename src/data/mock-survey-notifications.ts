export type SurveyNotificationSendTo = 'Respondent' | 'Survey Administrator';

export type SurveyNotificationCriteria =
  | 'Completed response'
  | 'Quota Reached'
  | 'Partial response'
  | '';

export type SurveyNotificationListView = 'compact' | 'expanded';

export interface SurveyNotificationItem {
  id: string;
  name: string;
  enabled: boolean;
  sendTo: SurveyNotificationSendTo;
  criteria: SurveyNotificationCriteria;
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

let notificationIdCounter = 0;

function nextNotificationId(): string {
  notificationIdCounter += 1;
  return `notification-${notificationIdCounter}`;
}

export function createSurveyNotificationItem(
  partial?: Partial<SurveyNotificationItem>
): SurveyNotificationItem {
  return {
    id: nextNotificationId(),
    name: 'New Notification',
    enabled: false,
    sendTo: 'Survey Administrator',
    criteria: 'Completed response',
    ...partial,
  };
}

export function createDefaultSurveyNotificationItems(): SurveyNotificationItem[] {
  notificationIdCounter = 0;
  return [
    createSurveyNotificationItem({
      name: 'Thank You Email',
      enabled: false,
      sendTo: 'Respondent',
      criteria: 'Completed response',
    }),
    createSurveyNotificationItem({
      name: 'Admin Confirmation',
      enabled: false,
      sendTo: 'Survey Administrator',
      criteria: 'Completed response',
    }),
    createSurveyNotificationItem({
      name: 'Quota Notification',
      enabled: false,
      sendTo: 'Survey Administrator',
      criteria: 'Quota Reached',
    }),
  ];
}

export const DEFAULT_SURVEY_NOTIFICATION_SETTINGS: SurveyNotificationSettings = {
  items: createDefaultSurveyNotificationItems(),
  listView: 'compact',
};

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
    const items = parsed.items
      .filter((item): item is SurveyNotificationItem => Boolean(item && typeof item === 'object'))
      .map((item) =>
        createSurveyNotificationItem({
          id: typeof item.id === 'string' && item.id ? item.id : undefined,
          name: typeof item.name === 'string' ? item.name : 'New Notification',
          enabled: Boolean(item.enabled),
          sendTo:
            item.sendTo === 'Respondent' || item.sendTo === 'Survey Administrator'
              ? item.sendTo
              : 'Survey Administrator',
          criteria:
            item.criteria === 'Completed response' ||
            item.criteria === 'Quota Reached' ||
            item.criteria === 'Partial response' ||
            item.criteria === ''
              ? item.criteria
              : 'Completed response',
        })
      );

    return {
      items: items.length > 0 ? items : fallback.items,
      listView,
    };
  }

  // Migrate legacy toggle-only settings into list rows.
  const items = createDefaultSurveyNotificationItems().map((item) => {
    if (item.name === 'Thank You Email' || item.name === 'Admin Confirmation') {
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
        sendTo: 'Survey Administrator',
        criteria: 'Partial response',
      })
    );
  }

  return { items, listView };
}
