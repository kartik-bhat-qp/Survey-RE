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

export type CommunityRecipientFilterTab = 'custom' | 'existing' | 'email';

export const COMMUNITY_RECIPIENT_FILTER_TABS: {
  id: CommunityRecipientFilterTab;
  label: string;
}[] = [
  { id: 'custom', label: 'Custom filter' },
  { id: 'existing', label: 'Existing filter' },
  { id: 'email', label: 'Email filter' },
];

export const COMMUNITY_FILTER_FIELDS: CommunitySendOption[] = [
  { value: '', label: 'Select field' },
  { value: 'first-name', label: 'First name' },
  { value: 'last-name', label: 'Last name' },
  { value: 'email', label: 'Email' },
  { value: 'points-balance', label: 'Points balance' },
  { value: 'member-status', label: 'Member status' },
  { value: 'last-login', label: 'Last login' },
  { value: 'join-date', label: 'Join date' },
  { value: 'city', label: 'City' },
  { value: 'country', label: 'Country' },
];

export interface CommunityExistingFilter {
  id: string;
  label: string;
  recipients: number;
  description: string;
}

export const COMMUNITY_EXISTING_FILTERS: CommunityExistingFilter[] = [
  {
    id: 'active-verified',
    label: 'Active verified members',
    recipients: 842,
    description: 'Verified members who logged in during the last 90 days',
  },
  {
    id: 'high-engagement',
    label: 'High engagement panel',
    recipients: 216,
    description: 'Completed 3 or more surveys in the past quarter',
  },
  {
    id: 'new-members',
    label: 'New members — last 30 days',
    recipients: 64,
    description: 'Joined recently and completed profile',
  },
  {
    id: 'points-eligible',
    label: 'Points redemption eligible',
    recipients: 118,
    description: 'Members with 500 or more redeemable points',
  },
  {
    id: 'never-surveyed',
    label: 'Never invited to a survey',
    recipients: 39,
    description: 'Verified members with no prior invitation',
  },
];

export const COMMUNITY_EMAIL_FILTERS: CommunitySendOption[] = [
  { value: 'all-valid', label: 'All valid emails' },
  { value: 'opened-last', label: 'Opened last invitation' },
  { value: 'clicked-last', label: 'Clicked last invitation' },
  { value: 'never-opened', label: 'Never opened an invitation' },
  { value: 'bounced-excluded', label: 'Exclude hard bounces' },
];

export const COMMUNITY_DEFAULT_VERIFIED_RECIPIENTS = 30;

export const COMMUNITY_SAMPLE_RECIPIENTS = [
  { id: '1', name: 'Priya Nair', email: 'priya.nair@example.com' },
  { id: '2', name: 'James Okonkwo', email: 'james.okonkwo@example.com' },
  { id: '3', name: 'Sofia Alvarez', email: 'sofia.alvarez@example.com' },
  { id: '4', name: 'Wei Chen', email: 'wei.chen@example.com' },
  { id: '5', name: 'Amelia Brooks', email: 'amelia.brooks@example.com' },
  { id: '6', name: 'Omar Haddad', email: 'omar.haddad@example.com' },
  { id: '7', name: 'Elena Petrova', email: 'elena.petrova@example.com' },
  { id: '8', name: 'Noah Patel', email: 'noah.patel@example.com' },
];

export const DEFAULT_COMMUNITY_EMAIL_BODY =
  '<p>Hello [FirstName],</p><p>We would love your feedback. Please take a few minutes to complete our latest survey.</p><p>[SurveyLink]</p><p>Thank you for being part of our community!</p>';

export const DEFAULT_COMMUNITY_SMS_BODY =
  'Hi [FirstName], a new survey is waiting for you: [SurveyLink]';

export type CommunityIncentiveKey = 'complete' | 'quota' | 'terminate';

export interface CommunityPointsTag {
  tag: string;
  incentive: CommunityIncentiveKey;
  label: string;
}

export const COMMUNITY_POINTS_TAGS: CommunityPointsTag[] = [
  { tag: '{SURVEY_POINTS_COMPLETE}', incentive: 'complete', label: 'Complete' },
  { tag: '{SURVEY_POINTS_QUOTA}', incentive: 'quota', label: 'Quota' },
  { tag: '{SURVEY_POINTS_TERMINATE}', incentive: 'terminate', label: 'Terminate' },
];

export type CommunityIncentivePoints = Record<CommunityIncentiveKey, string>;

export interface CommunityIncentiveCriterionValue {
  id: string;
  label: string;
  /** Share of verified recipients matching this value, used to estimate rule reach. */
  share: number;
}

export interface CommunityIncentiveCriterionField {
  id: string;
  label: string;
  values: CommunityIncentiveCriterionValue[];
}

/** Profile fields, matching the community sample viewer. */
export const COMMUNITY_INCENTIVE_CRITERIA: CommunityIncentiveCriterionField[] = [
  {
    id: 'gender',
    label: 'Gender',
    values: [
      { id: 'male', label: 'Male', share: 0.48 },
      { id: 'female', label: 'Female', share: 0.47 },
      { id: 'non-binary', label: 'Non-binary', share: 0.03 },
      { id: 'prefer-not', label: 'Prefer not to say', share: 0.02 },
    ],
  },
  {
    id: 'age',
    label: 'age',
    values: [
      { id: '18', label: '18', share: 0.04 },
      { id: '25', label: '25', share: 0.12 },
      { id: '35', label: '35', share: 0.18 },
      { id: '45', label: '45', share: 0.16 },
      { id: '55', label: '55', share: 0.1 },
      { id: '65', label: '65', share: 0.06 },
    ],
  },
  {
    id: 'age-bracket',
    label: 'Age bracket',
    values: [
      { id: '18-24', label: '18–24', share: 0.14 },
      { id: '25-34', label: '25–34', share: 0.28 },
      { id: '35-44', label: '35–44', share: 0.24 },
      { id: '45-54', label: '45–54', share: 0.18 },
      { id: '55-64', label: '55–64', share: 0.1 },
      { id: '65-plus', label: '65+', share: 0.06 },
    ],
  },
  {
    id: 'annual-income',
    label: 'Annual income',
    values: [
      { id: 'under-25', label: 'Under $25,000', share: 0.12 },
      { id: '25-49', label: '$25,000–$49,999', share: 0.22 },
      { id: '50-74', label: '$50,000–$74,999', share: 0.24 },
      { id: '75-99', label: '$75,000–$99,999', share: 0.18 },
      { id: '100-149', label: '$100,000–$149,999', share: 0.14 },
      { id: '150-plus', label: '$150,000+', share: 0.1 },
    ],
  },
  {
    id: 'favourite',
    label: '* Please select your favourite...',
    values: [
      { id: 'option-a', label: 'Option A', share: 0.3 },
      { id: 'option-b', label: 'Option B', share: 0.25 },
      { id: 'option-c', label: 'Option C', share: 0.2 },
      { id: 'option-d', label: 'Option D', share: 0.15 },
      { id: 'other', label: 'Other', share: 0.1 },
    ],
  },
  {
    id: 'credit',
    label: 'Which of the following credit ...',
    values: [
      { id: 'visa', label: 'Visa', share: 0.42 },
      { id: 'mastercard', label: 'Mastercard', share: 0.28 },
      { id: 'amex', label: 'American Express', share: 0.12 },
      { id: 'discover', label: 'Discover', share: 0.08 },
      { id: 'none', label: 'None', share: 0.1 },
    ],
  },
  {
    id: 'ethnicity',
    label: 'Ethnicity',
    values: [
      { id: 'asian', label: 'Asian', share: 0.18 },
      { id: 'black', label: 'Black or African American', share: 0.12 },
      { id: 'hispanic', label: 'Hispanic or Latino', share: 0.16 },
      { id: 'white', label: 'White', share: 0.42 },
      { id: 'two-or-more', label: 'Two or more', share: 0.07 },
      { id: 'prefer-not', label: 'Prefer not to say', share: 0.05 },
    ],
  },
  {
    id: 'designation',
    label: 'Designation',
    values: [
      { id: 'individual', label: 'Individual contributor', share: 0.4 },
      { id: 'manager', label: 'Manager', share: 0.22 },
      { id: 'director', label: 'Director', share: 0.12 },
      { id: 'executive', label: 'Executive', share: 0.06 },
      { id: 'student', label: 'Student', share: 0.12 },
      { id: 'other', label: 'Other', share: 0.08 },
    ],
  },
  {
    id: 'household-income',
    label: 'What is your household income?',
    values: [
      { id: 'under-25', label: 'Under $25,000', share: 0.1 },
      { id: '25-49', label: '$25,000–$49,999', share: 0.18 },
      { id: '50-74', label: '$50,000–$74,999', share: 0.22 },
      { id: '75-99', label: '$75,000–$99,999', share: 0.2 },
      { id: '100-149', label: '$100,000–$149,999', share: 0.16 },
      { id: '150-plus', label: '$150,000+', share: 0.14 },
    ],
  },
];

export const COMMUNITY_INCENTIVE_OPERATORS = [
  { id: 'equals', label: 'Equals' },
  { id: 'not-equals', label: 'Does not equal' },
] as const;

export type CommunityIncentiveOperatorId = (typeof COMMUNITY_INCENTIVE_OPERATORS)[number]['id'];

export const COMMUNITY_INCENTIVE_FIELD_PLACEHOLDER: CommunityIncentiveCriterionField = {
  id: '',
  label: 'Select field',
  values: [],
};

export interface CommunityIncentiveCondition {
  id: string;
  fieldId: string;
  operatorId: CommunityIncentiveOperatorId;
  valueId: string;
}

export interface CommunityIncentiveRule {
  id: string;
  /** Every condition must match (Gender and age, and so on). */
  conditions: CommunityIncentiveCondition[];
  points: CommunityIncentivePoints;
}

/** Points already attached to a sent invitation, used when composing a reminder. */
export const REMINDER_DEFAULT_POINTS: CommunityIncentivePoints = {
  complete: '50',
  quota: '10',
  terminate: '0',
};

export const REMINDER_DEFAULT_RULES: CommunityIncentiveRule[] = [
  {
    id: 'reminder-gender',
    conditions: [
      { id: 'reminder-gender-1', fieldId: 'gender', operatorId: 'equals', valueId: 'female' },
    ],
    points: { complete: '75', quota: '15', terminate: '0' },
  },
  {
    id: 'reminder-age',
    conditions: [
      { id: 'reminder-age-1', fieldId: 'age', operatorId: 'equals', valueId: '25' },
    ],
    points: { complete: '40', quota: '10', terminate: '0' },
  },
];

export const REMINDER_EMAIL_BODY =
  '<p>Hello [FirstName],</p><p>This is a reminder to finish the survey. You will earn {SURVEY_POINTS_COMPLETE} points when you complete it, {SURVEY_POINTS_QUOTA} points if you are screened out on quota, or {SURVEY_POINTS_TERMINATE} points if the survey ends early.</p><p>[SurveyLink]</p>';

export const REMINDER_SMS_BODY =
  'Reminder: your survey is still open. Finish it to earn {SURVEY_POINTS_COMPLETE} points. [SurveyLink]';

export const COMMUNITY_REPLACEMENT_VARIABLES = [
  '{FIRST_NAME}',
  '{MIDDLE_NAME}',
  '{LAST_NAME}',
  '{EMAIL}',
  '{PANEL_MEMBER_ID}',
  '{SURVEY_LINK}',
  '{COMMUNITY_NAME}',
  '{POINTS_BALANCE}',
  '{UNSUBSCRIBE_LINK}',
] as const;
