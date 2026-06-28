export type DistributeChannelId = 'email' | 'community' | 'mobile-app' | 'audience';

export type EmailSidebarId = 'compose' | 'sent' | 'scheduled' | 'lists' | 'templates';

export interface DistributeChannel {
  id: DistributeChannelId;
  label: string;
  icon: string;
}

export interface EmailSidebarItem {
  id: EmailSidebarId;
  label: string;
}

export interface EmailListOption {
  value: string;
  label: string;
}

export interface EmailSenderOption {
  value: string;
  label: string;
}

export interface EmailTemplateOption {
  value: string;
  label: string;
}

export interface EmailComposeDefaults {
  subject: string;
  body: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
}

export const DISTRIBUTE_CHANNELS: DistributeChannel[] = [
  { id: 'email', label: 'Email', icon: 'wm-email' },
  { id: 'community', label: 'Community', icon: 'wm-groups' },
  { id: 'mobile-app', label: 'Mobile App', icon: 'wm-smartphone' },
  { id: 'audience', label: 'Audience', icon: 'wm-group' },
];

export const EMAIL_SIDEBAR_ITEMS: EmailSidebarItem[] = [
  { id: 'compose', label: 'Compose' },
  { id: 'sent', label: 'Sent' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'lists', label: 'Lists' },
  { id: 'templates', label: 'Templates' },
];

export const MOCK_EMAIL_LISTS: EmailListOption[] = [
  { value: 'list-panel', label: 'Customer Experience Panel' },
  { value: 'list-newsletter', label: 'Monthly Newsletter Subscribers' },
  { value: 'list-beta', label: 'Product Beta Testers — West Region' },
];

export const MOCK_EMAIL_SENDERS: EmailSenderOption[] = [
  {
    value: 'kartik-bhat',
    label: 'Kartik Bhat (kartik.bhat@questionpro.com)',
  },
  {
    value: 'research-team',
    label: 'Research Team (research@questionpro.com)',
  },
];

export const MOCK_REPLY_TO_OPTIONS: EmailSenderOption[] = [
  { value: 'kartik-bhat', label: 'kartik.bhat@questionpro.com' },
  { value: 'noreply', label: 'noreply@questionpro.com' },
];

export const MOCK_EMAIL_TEMPLATES: EmailTemplateOption[] = [
  { value: 'default', label: 'Default Template' },
  { value: 'formal', label: 'Formal Invitation' },
  { value: 'reminder', label: 'Friendly Reminder' },
];

export const DEFAULT_EMAIL_COMPOSE: EmailComposeDefaults = {
  subject: 'Survey Invitation',
  body:
    'Hello,\n\nWe would appreciate your feedback...\n\n<SURVEY_LINK>\n\nThank You',
  emailEnabled: true,
  smsEnabled: false,
};

export const MOCK_DISTRIBUTE_CREDITS = {
  available: 50.38,
};

export function getSurveyDistributionUrl(surveyId: number): string {
  return `https://productteam26.questionpro.com/a/TakeSurvey?id=${surveyId}`;
}

export function getDefaultEmailSidebarItem(): EmailSidebarId {
  return 'compose';
}

export function getDefaultDistributeChannel(): DistributeChannelId {
  return 'email';
}
