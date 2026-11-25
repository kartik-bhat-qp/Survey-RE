export type CommunitySendToolId =
  | 'send'
  | 'history'
  | 'templates'
  | 'broadcast'
  | 'preferences'
  | 'sms-logs'
  | 'whatsapp-logs';

export interface CommunitySendTool {
  id: CommunitySendToolId;
  label: string;
  icon: string;
}

export const COMMUNITY_SEND_TOOLS: CommunitySendTool[] = [
  { id: 'send', label: 'Send', icon: 'wm-mail' },
  { id: 'history', label: 'History', icon: 'wm-history' },
  { id: 'templates', label: 'Templates', icon: 'wm-view-quilt' },
  { id: 'broadcast', label: 'Broadcast', icon: 'wm-campaign' },
  { id: 'preferences', label: 'Preferences', icon: 'wm-tune' },
  { id: 'sms-logs', label: 'SMS logs', icon: 'wm-sms' },
  { id: 'whatsapp-logs', label: 'WhatsApp logs', icon: 'wm-chat' },
];

export const COMMUNITY_SEND_STEPS = [
  { id: 'compose', label: 'Compose email', icon: 'wm-description' },
  { id: 'recipients', label: 'Select recipients', icon: 'wm-person' },
  { id: 'incentives', label: 'Incentives', icon: 'wm-redeem' },
  { id: 'send', label: 'Send', icon: 'wm-check' },
] as const;

export type CommunitySendStepId = (typeof COMMUNITY_SEND_STEPS)[number]['id'];

export interface CommunitySendOption {
  value: string;
  label: string;
}

export const COMMUNITY_EMAIL_TEMPLATES: CommunitySendOption[] = [
  { value: 'new-template-karishma', label: 'New template Karishma' },
  { value: 'survey-invitation', label: 'Survey invitation — standard' },
  { value: 'reminder', label: 'Friendly reminder' },
  { value: 'incentive', label: 'Incentive announcement' },
  {
    value: 'quarterly-panel',
    label: 'Quarterly panel check-in with points balance and community highlights',
  },
];

export const COMMUNITY_TEMPLATE_LANGUAGES: CommunitySendOption[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
];

export interface CommunityRecipientSegment {
  id: string;
  label: string;
  members: number;
  description: string;
}

export const COMMUNITY_RECIPIENT_SEGMENTS: CommunityRecipientSegment[] = [
  {
    id: 'all-members',
    label: 'All members',
    members: 1284,
    description: 'Every verified member of this community',
  },
  {
    id: 'active-30',
    label: 'Active in last 30 days',
    members: 642,
    description: 'Members who logged in or responded recently',
  },
  {
    id: 'not-responded',
    label: 'Not responded to last survey',
    members: 418,
    description: 'Members who skipped the most recent invitation',
  },
  {
    id: 'new-signups',
    label: 'New sign-ups',
    members: 96,
    description: 'Joined in the last 14 days',
  },
  {
    id: 'high-points',
    label: 'Members with 500+ points',
    members: 57,
    description: 'Eligible for the next reward redemption',
  },
];

export const DEFAULT_COMMUNITY_EMAIL_BODY =
  '<p>Hello [FirstName],</p><p>We would love your feedback. Please take a few minutes to complete our latest survey.</p><p>[SurveyLink]</p><p>Thank you for being part of our community!</p>';

export const DEFAULT_COMMUNITY_SMS_BODY =
  'Hi [FirstName], a new survey is waiting for you: [SurveyLink]';
