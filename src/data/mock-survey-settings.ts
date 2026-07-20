export type SurveySettingsTab = 'settings' | 'security' | 'notifications';

export type SurveySettingsStatus = 'Active' | 'Inactive' | 'Closed';

export type ParticipationLogic = 'allow-multiple' | 'once-only';

export type SurveyAuthenticationMethod =
  | 'none'
  | 'global-password'
  | 'email-invites'
  | 'email-password'
  | 'username-password'
  | 'participant-id'
  | 'password-email-detected'
  | 'facebook-connect'
  | 'des-encrypted'
  | 'communities-invites';

export type AnonymityStandardFieldId =
  | 'respondent-email'
  | 'ip-address'
  | 'country-code'
  | 'region';

export interface AnonymityStandardField {
  id: AnonymityStandardFieldId;
  label: string;
}

export interface AnonymityCustomVariable {
  id: string;
  label: string;
}

export interface RespondentAnonymityConfig {
  standardFields: AnonymityStandardFieldId[];
  customVariableIds: string[];
}

export interface SurveySecuritySettings {
  status: SurveySettingsStatus;
  responseQuotaEnabled: boolean;
  responseQuota: number;
  closeDateTimeEnabled: boolean;
  closeDateTime: string;
  participationLogic: ParticipationLogic;
  customVariableIdentification: boolean;
  multipleRespondingMessage: string;
  saveAndContinue: boolean;
  surveyTimer: boolean;
  seo: boolean;
  captureLocationData: boolean;
  respondentAnonymityAssurance: boolean;
  respondentAnonymity: RespondentAnonymityConfig;
  ageVerification: boolean;
}

export interface SurveyNotificationSettings {
  emailOnComplete: boolean;
  emailOnQuotaReached: boolean;
  emailOnPartialResponse: boolean;
}

export interface SurveySettings {
  security: SurveySecuritySettings;
  authenticationMethod: SurveyAuthenticationMethod;
  notifications: SurveyNotificationSettings;
}

export const SURVEY_STATUS_OPTIONS: { value: SurveySettingsStatus; label: string }[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Closed', label: 'Closed' },
];

export const SURVEY_SETTINGS_TABS: { id: SurveySettingsTab; label: string }[] = [
  { id: 'settings', label: 'Settings' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
];

export const SURVEY_AUTHENTICATION_HELP =
  'Choose how respondents authenticate before taking this survey.';

export const SURVEY_AUTHENTICATION_OPTIONS: {
  id: SurveyAuthenticationMethod;
  label: string;
}[] = [
  { id: 'none', label: 'None' },
  { id: 'global-password', label: 'Global Password Protect' },
  { id: 'email-invites', label: 'Email Invites Only' },
  { id: 'email-password', label: 'Email/Password' },
  { id: 'username-password', label: 'Username/Password' },
  { id: 'participant-id', label: 'Participant ID' },
  { id: 'password-email-detected', label: 'Password (Email detected automatically)' },
  { id: 'facebook-connect', label: 'Facebook Connect' },
  { id: 'des-encrypted', label: 'DES Encrypted Custom Variables' },
  { id: 'communities-invites', label: 'Communities Invites Only' },
];

export const ANONYMITY_STANDARD_FIELDS: AnonymityStandardField[] = [
  { id: 'respondent-email', label: 'Respondent Email' },
  { id: 'ip-address', label: 'IP Address' },
  { id: 'country-code', label: 'Country Code' },
  { id: 'region', label: 'Region' },
];

export const ANONYMITY_CUSTOM_VARIABLES: AnonymityCustomVariable[] = [
  { id: 'cv-1', label: 'Custom Variable 1' },
  { id: 'cv-2', label: 'Custom Variable 2' },
  { id: 'cv-3', label: 'Custom Variable 3' },
  { id: 'cv-4', label: 'Custom Variable 4' },
  { id: 'cv-5', label: 'Custom Variable 5' },
];

export const DEFAULT_MULTIPLE_RESPONDING_MESSAGE =
  'The owner of this survey has disabled users from taking the survey multiple times. Since we already have a response from you we cannot accept your response at this time.';

export const ANONYMITY_REQUIRED_STANDARD_FIELD: AnonymityStandardFieldId =
  'respondent-email';

export const RAA_CANNOT_DISABLE_MESSAGE =
  'RAA cannot be disabled for this survey in accordance with our privacy policy.';

export const RESPONDENT_EMAIL_LOCKED_MESSAGE = 'Respondent email cannot be disabled';

export const CUSTOM_VARIABLE_MAPPING_TOOLTIP =
  'The custom variable name will be populated from the Variable Mapping configured in the survey.';

export const DEFAULT_RESPONDENT_ANONYMITY: RespondentAnonymityConfig = {
  standardFields: ['respondent-email', 'ip-address', 'country-code', 'region'],
  customVariableIds: ['cv-1'],
};

export function ensureRequiredAnonymityFields(
  config: RespondentAnonymityConfig
): RespondentAnonymityConfig {
  const standardFields = config.standardFields.includes(ANONYMITY_REQUIRED_STANDARD_FIELD)
    ? config.standardFields
    : [ANONYMITY_REQUIRED_STANDARD_FIELD, ...config.standardFields];
  return {
    standardFields,
    customVariableIds: [...config.customVariableIds],
  };
}

export const DEFAULT_SURVEY_SECURITY_SETTINGS: SurveySecuritySettings = {
  status: 'Active',
  responseQuotaEnabled: false,
  responseQuota: 1000,
  closeDateTimeEnabled: false,
  closeDateTime: '',
  participationLogic: 'once-only',
  customVariableIdentification: false,
  multipleRespondingMessage: DEFAULT_MULTIPLE_RESPONDING_MESSAGE,
  saveAndContinue: false,
  surveyTimer: false,
  seo: false,
  captureLocationData: true,
  respondentAnonymityAssurance: false,
  respondentAnonymity: { ...DEFAULT_RESPONDENT_ANONYMITY },
  ageVerification: false,
};

export const DEFAULT_SURVEY_NOTIFICATION_SETTINGS: SurveyNotificationSettings = {
  emailOnComplete: true,
  emailOnQuotaReached: true,
  emailOnPartialResponse: false,
};

export function getDefaultSurveySettings(): SurveySettings {
  return {
    security: {
      ...DEFAULT_SURVEY_SECURITY_SETTINGS,
      respondentAnonymity: {
        standardFields: [...DEFAULT_RESPONDENT_ANONYMITY.standardFields],
        customVariableIds: [...DEFAULT_RESPONDENT_ANONYMITY.customVariableIds],
      },
    },
    authenticationMethod: 'none',
    notifications: { ...DEFAULT_SURVEY_NOTIFICATION_SETTINGS },
  };
}

export function getSurveyDisplayId(surveyId: number): string {
  return String(10425000 + surveyId);
}

export function surveySettingsStorageKey(surveyId: number): string {
  return `survey-settings-${surveyId}`;
}

const PERSIST_PREFIX = 'survey-re:';

export function readSurveySettings(surveyId: number): SurveySettings {
  const fallback = getDefaultSurveySettings();
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(PERSIST_PREFIX + surveySettingsStorageKey(surveyId));
    if (raw === null || raw.trim() === '') return fallback;
    const parsed = JSON.parse(raw) as Partial<SurveySettings>;
    return {
      security: {
        ...fallback.security,
        ...parsed.security,
        respondentAnonymity: ensureRequiredAnonymityFields(
          parsed.security?.respondentAnonymity ?? fallback.security.respondentAnonymity
        ),
      },
      notifications: {
        ...fallback.notifications,
        ...parsed.notifications,
      },
    };
  } catch {
    return fallback;
  }
}

export function getEnabledAnonymityFieldLabels(
  config: RespondentAnonymityConfig
): string[] {
  const ensured = ensureRequiredAnonymityFields(config);
  const standardLabels = ANONYMITY_STANDARD_FIELDS.filter((field) =>
    ensured.standardFields.includes(field.id)
  ).map((field) => field.label);
  const customLabels = ANONYMITY_CUSTOM_VARIABLES.filter((variable) =>
    ensured.customVariableIds.includes(variable.id)
  ).map((variable) => variable.label);
  return [...standardLabels, ...customLabels];
}
