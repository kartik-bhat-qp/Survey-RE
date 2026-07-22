import {
  DEFAULT_SURVEY_NOTIFICATION_SETTINGS,
  normalizeSurveyNotificationSettings,
  type SurveyNotificationSettings,
} from '@/data/mock-survey-notifications';

export type { SurveyNotificationSettings } from '@/data/mock-survey-notifications';
export {
  DEFAULT_SURVEY_NOTIFICATION_SETTINGS,
  normalizeSurveyNotificationSettings,
} from '@/data/mock-survey-notifications';

export type SurveySettingsTab = 'settings' | 'security' | 'privacy' | 'notifications';

export type SurveySettingsNavItemId = SurveySettingsTab | 'advanced-quota-notifications';

export interface SurveySettingsNavItem {
  id: SurveySettingsNavItemId;
  label: string;
  comingSoon?: boolean;
}

export type SurveySettingsStatus = 'Draft' | 'Published' | 'Inactive' | 'Closed';

const LEGACY_SURVEY_STATUS_MAP: Record<string, SurveySettingsStatus> = {
  Active: 'Published',
  'Active - Published': 'Published',
  'Active - Draft': 'Draft',
};

export function normalizeSurveySettingsStatus(
  status: string | undefined,
  fallback: SurveySettingsStatus
): SurveySettingsStatus {
  if (!status) return fallback;
  if (status === 'Draft' || status === 'Published' || status === 'Inactive' || status === 'Closed') {
    return status;
  }
  return LEGACY_SURVEY_STATUS_MAP[status] ?? fallback;
}

export type ParticipationLogic = 'allow-multiple' | 'once-only';

export type CustomVariableIdentificationId = 'cv-1' | 'cv-2' | 'cv-3' | 'cv-4' | 'cv-5';

export type SurveyAuthenticationMethod =
  | 'none'
  | 'global-password'
  | 'email-invites'
  | 'email-password'
  | 'username-password'
  | 'participant-id'
  | 'password-email-detected'
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

export interface SaveAndContinueEmailSettings {
  fromSenderId: string;
  subject: string;
  body: string;
}

export type SurveyTimerExpiryAction = 'terminate-survey' | 'auto-submit-response';

export type AgeVerificationFailedAction = 'terminate-survey' | 'automatic-redirect';

export interface AgeVerificationCountryRule {
  id: string;
  minimumAge: number;
  countryCodes: string[];
}

export interface AgeVerificationSettings {
  message: string;
  minimumAge: number;
  buttonText: string;
  failedVerificationAction: AgeVerificationFailedAction;
  failedVerificationRedirectUrl: string;
  geolocationLogicEnabled: boolean;
  countryRules: AgeVerificationCountryRule[];
}

export interface SurveySecuritySettings {
  status: SurveySettingsStatus;
  responseQuotaEnabled: boolean;
  responseQuota: number;
  closeDateTimeEnabled: boolean;
  closeDate: string;
  closeTime: string;
  closedMessage: string;
  participationLogic: ParticipationLogic;
  customVariableIdentification: boolean;
  customVariableIdentificationVariable: CustomVariableIdentificationId;
  multipleRespondingMessage: string;
  saveAndContinue: boolean;
  saveAndContinueButtonText: string;
  saveAndContinueEmail: SaveAndContinueEmailSettings;
  surveyTimer: boolean;
  surveyTimerDuration: string;
  surveyTimerExpiryAction: SurveyTimerExpiryAction;
  seo: boolean;
  captureLocationData: boolean;
  respondentAnonymityAssurance: boolean;
  respondentAnonymity: RespondentAnonymityConfig;
  ageVerification: boolean;
  ageVerificationSettings: AgeVerificationSettings;
}

export interface SurveySettings {
  security: SurveySecuritySettings;
  authenticationMethod: SurveyAuthenticationMethod;
  globalPassword: string;
  emailPasswordAuth: EmailPasswordAuthenticationSettings;
  usernamePasswordAuth: UsernamePasswordAuthenticationSettings;
  participantIdAuth: ParticipantIdAuthenticationSettings;
  notifications: SurveyNotificationSettings;
}

export interface EmailPasswordAuthenticationSettings {
  emailAddress: string;
  password: string;
  invalidCredentialsMessage: string;
  emailListId: string;
}

export interface UsernamePasswordAuthenticationSettings {
  username: string;
  password: string;
  invalidCredentialsMessage: string;
  emailListId: string;
}

export interface ParticipantIdAuthenticationSettings {
  uniqueKey: string;
  invalidValueMessage: string;
  emailListId: string;
}

export const SURVEY_STATUS_OPTIONS: { value: SurveySettingsStatus; label: string }[] = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Published', label: 'Published' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Closed', label: 'Closed' },
];

export const SURVEY_SETTINGS_TABS: SurveySettingsNavItem[] = [
  { id: 'settings', label: 'General' },
  { id: 'security', label: 'Security' },
  { id: 'privacy', label: 'Privacy and compliance' },
  { id: 'notifications', label: 'Notifications' },
  {
    id: 'advanced-quota-notifications',
    label: 'Advanced quota notifications',
    comingSoon: true,
  },
];

export const SURVEY_AUTHENTICATION_HELP =
  'Choose how respondents authenticate before taking this survey.';

export const DEFAULT_EMAIL_PASSWORD_AUTH: EmailPasswordAuthenticationSettings = {
  emailAddress: '',
  password: '',
  invalidCredentialsMessage: 'Invalid email or password. Please try again.',
  emailListId: '',
};

export const DEFAULT_USERNAME_PASSWORD_AUTH: UsernamePasswordAuthenticationSettings = {
  username: '',
  password: '',
  invalidCredentialsMessage: '',
  emailListId: '',
};

export const DEFAULT_PARTICIPANT_ID_AUTH: ParticipantIdAuthenticationSettings = {
  uniqueKey: '',
  invalidValueMessage: '',
  emailListId: '',
};

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

export const CUSTOM_VARIABLE_IDENTIFICATION_OPTIONS: {
  value: CustomVariableIdentificationId;
  label: string;
}[] = [
  { value: 'cv-1', label: 'Custom Variable 1' },
  { value: 'cv-2', label: 'Custom Variable 2' },
  { value: 'cv-3', label: 'Custom Variable 3' },
  { value: 'cv-4', label: 'Custom Variable 4' },
  { value: 'cv-5', label: 'Custom Variable 5' },
];

export const DEFAULT_MULTIPLE_RESPONDING_MESSAGE =
  'The owner of this survey has disabled users from taking the survey multiple times. Since we already have a response from you we cannot accept your response at this time.';

export const DEFAULT_SAVE_AND_CONTINUE_BUTTON_TEXT = 'Save & Continue Later';

export const DEFAULT_SAVE_AND_CONTINUE_EMAIL_BODY = `Hello,

We have a partial response saved for you. To start the survey from where you saved, please click on the link below:

<SAVED_SURVEY_LINK>

Thank you.`;

export const SAVE_AND_CONTINUE_EMAIL_HELP =
  'Customize the email sent when respondents save their progress and continue later.';

export const DEFAULT_SAVE_AND_CONTINUE_EMAIL: SaveAndContinueEmailSettings = {
  fromSenderId: 'kartik-bhat',
  subject: 'Your Saved Survey',
  body: DEFAULT_SAVE_AND_CONTINUE_EMAIL_BODY,
};

export const DEFAULT_SURVEY_TIMER_DURATION = '00:05';

export const SURVEY_TIMER_EXPIRY_OPTIONS: {
  value: SurveyTimerExpiryAction;
  label: string;
}[] = [
  { value: 'terminate-survey', label: 'Terminate Survey' },
  { value: 'auto-submit-response', label: 'Auto Submit Response' },
];

export const DEFAULT_AGE_VERIFICATION_MESSAGE = `<p style="text-align: center">You must be 18 years of age or older to enter this survey.</p><p style="text-align: center">Please enter your date of birth.</p>`;

export const AGE_VERIFICATION_HELP =
  'Configure the age gate shown before respondents can enter the survey.';

export const AGE_VERIFICATION_FAILED_OPTIONS: {
  value: AgeVerificationFailedAction;
  label: string;
}[] = [
  { value: 'terminate-survey', label: 'Terminate Survey' },
  { value: 'automatic-redirect', label: 'Automatic Redirect' },
];

export const AGE_VERIFICATION_COUNTRIES: { value: string; label: string }[] = [
  { value: 'AD', label: 'Andorra' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'AF', label: 'Afghanistan' },
  { value: 'AG', label: 'Antigua and Barbuda' },
  { value: 'AI', label: 'Anguilla' },
  { value: 'AL', label: 'Albania' },
  { value: 'AM', label: 'Armenia' },
  { value: 'AO', label: 'Angola' },
  { value: 'AQ', label: 'Antarctica' },
  { value: 'AR', label: 'Argentina' },
  { value: 'AT', label: 'Austria' },
  { value: 'AU', label: 'Australia' },
  { value: 'BD', label: 'Bangladesh' },
  { value: 'BE', label: 'Belgium' },
  { value: 'BR', label: 'Brazil' },
  { value: 'CA', label: 'Canada' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'CN', label: 'China' },
  { value: 'DE', label: 'Germany' },
  { value: 'DK', label: 'Denmark' },
  { value: 'ES', label: 'Spain' },
  { value: 'FI', label: 'Finland' },
  { value: 'FR', label: 'France' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'IE', label: 'Ireland' },
  { value: 'IN', label: 'India' },
  { value: 'IT', label: 'Italy' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'MX', label: 'Mexico' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'NO', label: 'Norway' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'PL', label: 'Poland' },
  { value: 'PT', label: 'Portugal' },
  { value: 'SE', label: 'Sweden' },
  { value: 'SG', label: 'Singapore' },
  { value: 'US', label: 'United States' },
  { value: 'ZA', label: 'South Africa' },
];

export function createAgeVerificationCountryRule(
  overrides?: Partial<AgeVerificationCountryRule>
): AgeVerificationCountryRule {
  return {
    id: `age-country-rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    minimumAge: 18,
    countryCodes: [],
    ...overrides,
  };
}

export const DEFAULT_AGE_VERIFICATION_SETTINGS: AgeVerificationSettings = {
  message: DEFAULT_AGE_VERIFICATION_MESSAGE,
  minimumAge: 18,
  buttonText: 'Submit',
  failedVerificationAction: 'terminate-survey',
  failedVerificationRedirectUrl: '',
  geolocationLogicEnabled: false,
  countryRules: [],
};

export const DEFAULT_CLOSED_MESSAGE =
  'This Survey has been deactivated by the owner.';

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
  status: 'Published',
  responseQuotaEnabled: false,
  responseQuota: 1000,
  closeDateTimeEnabled: false,
  closeDate: '',
  closeTime: '00:00',
  closedMessage: DEFAULT_CLOSED_MESSAGE,
  participationLogic: 'once-only',
  customVariableIdentification: false,
  customVariableIdentificationVariable: 'cv-1',
  multipleRespondingMessage: DEFAULT_MULTIPLE_RESPONDING_MESSAGE,
  saveAndContinue: false,
  saveAndContinueButtonText: DEFAULT_SAVE_AND_CONTINUE_BUTTON_TEXT,
  saveAndContinueEmail: { ...DEFAULT_SAVE_AND_CONTINUE_EMAIL },
  surveyTimer: false,
  surveyTimerDuration: DEFAULT_SURVEY_TIMER_DURATION,
  surveyTimerExpiryAction: 'terminate-survey',
  seo: false,
  captureLocationData: true,
  respondentAnonymityAssurance: false,
  respondentAnonymity: { ...DEFAULT_RESPONDENT_ANONYMITY },
  ageVerification: false,
  ageVerificationSettings: { ...DEFAULT_AGE_VERIFICATION_SETTINGS },
};

export function getDefaultSurveySettings(): SurveySettings {
  return {
    security: {
      ...DEFAULT_SURVEY_SECURITY_SETTINGS,
      ageVerificationSettings: {
        ...DEFAULT_AGE_VERIFICATION_SETTINGS,
        countryRules: DEFAULT_AGE_VERIFICATION_SETTINGS.countryRules.map((rule) => ({
          ...rule,
          countryCodes: [...rule.countryCodes],
        })),
      },
      respondentAnonymity: {
        standardFields: [...DEFAULT_RESPONDENT_ANONYMITY.standardFields],
        customVariableIds: [...DEFAULT_RESPONDENT_ANONYMITY.customVariableIds],
      },
    },
    authenticationMethod: 'none',
    globalPassword: '',
    emailPasswordAuth: { ...DEFAULT_EMAIL_PASSWORD_AUTH },
    usernamePasswordAuth: { ...DEFAULT_USERNAME_PASSWORD_AUTH },
    participantIdAuth: { ...DEFAULT_PARTICIPANT_ID_AUTH },
    notifications: {
      listView: DEFAULT_SURVEY_NOTIFICATION_SETTINGS.listView,
      items: DEFAULT_SURVEY_NOTIFICATION_SETTINGS.items.map((item) => ({ ...item })),
    },
  };
}

export function getSurveyDisplayId(surveyId: number): string {
  return String(10425000 + surveyId);
}

export function surveySettingsStorageKey(surveyId: number): string {
  return `survey-settings-${surveyId}`;
}

const PERSIST_PREFIX = 'survey-re:';

const SURVEY_AUTHENTICATION_METHODS = new Set<SurveyAuthenticationMethod>(
  SURVEY_AUTHENTICATION_OPTIONS.map((option) => option.id)
);

export function normalizeSurveyAuthenticationMethod(
  method: unknown,
  fallback: SurveyAuthenticationMethod
): SurveyAuthenticationMethod {
  if (method === 'facebook-connect') return 'none';
  if (
    typeof method === 'string' &&
    SURVEY_AUTHENTICATION_METHODS.has(method as SurveyAuthenticationMethod)
  ) {
    return method as SurveyAuthenticationMethod;
  }
  return fallback;
}

export function normalizeSurveySettings(parsed: Partial<SurveySettings>): SurveySettings {
  const fallback = getDefaultSurveySettings();
  const legacyCloseDateTime =
    typeof (parsed.security as { closeDateTime?: unknown } | undefined)?.closeDateTime ===
    'string'
      ? ((parsed.security as unknown as { closeDateTime: string }).closeDateTime)
      : '';
  const [legacyDate = '', legacyTime = ''] = legacyCloseDateTime.includes('T')
    ? legacyCloseDateTime.split('T')
    : ['', ''];

  return {
    security: {
      ...fallback.security,
      ...parsed.security,
      status: normalizeSurveySettingsStatus(parsed.security?.status, fallback.security.status),
      closeDate: parsed.security?.closeDate || legacyDate || fallback.security.closeDate,
      closeTime:
        parsed.security?.closeTime ||
        legacyTime.slice(0, 5) ||
        fallback.security.closeTime,
      closedMessage:
        parsed.security?.closedMessage || fallback.security.closedMessage,
      customVariableIdentificationVariable:
        parsed.security?.customVariableIdentificationVariable ||
        fallback.security.customVariableIdentificationVariable,
      saveAndContinueButtonText:
        parsed.security?.saveAndContinueButtonText ||
        fallback.security.saveAndContinueButtonText,
      saveAndContinueEmail: {
        ...fallback.security.saveAndContinueEmail,
        ...parsed.security?.saveAndContinueEmail,
        fromSenderId:
          parsed.security?.saveAndContinueEmail?.fromSenderId ||
          fallback.security.saveAndContinueEmail.fromSenderId,
        subject:
          parsed.security?.saveAndContinueEmail?.subject ||
          fallback.security.saveAndContinueEmail.subject,
        body:
          parsed.security?.saveAndContinueEmail?.body ||
          fallback.security.saveAndContinueEmail.body,
      },
      surveyTimerDuration:
        parsed.security?.surveyTimerDuration || fallback.security.surveyTimerDuration,
      surveyTimerExpiryAction:
        parsed.security?.surveyTimerExpiryAction ||
        fallback.security.surveyTimerExpiryAction,
      ageVerificationSettings: {
        ...fallback.security.ageVerificationSettings,
        ...parsed.security?.ageVerificationSettings,
        message:
          parsed.security?.ageVerificationSettings?.message ||
          fallback.security.ageVerificationSettings.message,
        minimumAge:
          parsed.security?.ageVerificationSettings?.minimumAge ??
          fallback.security.ageVerificationSettings.minimumAge,
        buttonText:
          parsed.security?.ageVerificationSettings?.buttonText ||
          fallback.security.ageVerificationSettings.buttonText,
        failedVerificationAction:
          parsed.security?.ageVerificationSettings?.failedVerificationAction ||
          fallback.security.ageVerificationSettings.failedVerificationAction,
        failedVerificationRedirectUrl:
          parsed.security?.ageVerificationSettings?.failedVerificationRedirectUrl ??
          fallback.security.ageVerificationSettings.failedVerificationRedirectUrl,
        geolocationLogicEnabled:
          parsed.security?.ageVerificationSettings?.geolocationLogicEnabled ??
          fallback.security.ageVerificationSettings.geolocationLogicEnabled,
        countryRules: Array.isArray(parsed.security?.ageVerificationSettings?.countryRules)
          ? parsed.security.ageVerificationSettings.countryRules.map((rule) => ({
              id: rule.id || createAgeVerificationCountryRule().id,
              minimumAge:
                typeof rule.minimumAge === 'number' && Number.isFinite(rule.minimumAge)
                  ? rule.minimumAge
                  : fallback.security.ageVerificationSettings.minimumAge,
              countryCodes: Array.isArray(rule.countryCodes)
                ? rule.countryCodes.filter((code): code is string => typeof code === 'string')
                : [],
            }))
          : fallback.security.ageVerificationSettings.countryRules,
      },
      respondentAnonymity: ensureRequiredAnonymityFields(
        parsed.security?.respondentAnonymity ?? fallback.security.respondentAnonymity
      ),
    },
    authenticationMethod: normalizeSurveyAuthenticationMethod(
      parsed.authenticationMethod,
      fallback.authenticationMethod
    ),
    globalPassword:
      typeof parsed.globalPassword === 'string'
        ? parsed.globalPassword
        : fallback.globalPassword,
    emailPasswordAuth: {
      ...fallback.emailPasswordAuth,
      ...parsed.emailPasswordAuth,
      emailAddress:
        parsed.emailPasswordAuth?.emailAddress ?? fallback.emailPasswordAuth.emailAddress,
      password: parsed.emailPasswordAuth?.password ?? fallback.emailPasswordAuth.password,
      invalidCredentialsMessage:
        parsed.emailPasswordAuth?.invalidCredentialsMessage ??
        fallback.emailPasswordAuth.invalidCredentialsMessage,
      emailListId:
        parsed.emailPasswordAuth?.emailListId ?? fallback.emailPasswordAuth.emailListId,
    },
    usernamePasswordAuth: {
      ...fallback.usernamePasswordAuth,
      ...parsed.usernamePasswordAuth,
      username: parsed.usernamePasswordAuth?.username ?? fallback.usernamePasswordAuth.username,
      password: parsed.usernamePasswordAuth?.password ?? fallback.usernamePasswordAuth.password,
      invalidCredentialsMessage:
        parsed.usernamePasswordAuth?.invalidCredentialsMessage ??
        fallback.usernamePasswordAuth.invalidCredentialsMessage,
      emailListId:
        parsed.usernamePasswordAuth?.emailListId ?? fallback.usernamePasswordAuth.emailListId,
    },
    participantIdAuth: {
      ...fallback.participantIdAuth,
      ...parsed.participantIdAuth,
      uniqueKey: parsed.participantIdAuth?.uniqueKey ?? fallback.participantIdAuth.uniqueKey,
      invalidValueMessage:
        parsed.participantIdAuth?.invalidValueMessage ??
        fallback.participantIdAuth.invalidValueMessage,
      emailListId:
        parsed.participantIdAuth?.emailListId ?? fallback.participantIdAuth.emailListId,
    },
    notifications: normalizeSurveyNotificationSettings(parsed.notifications),
  };
}

export function readSurveySettings(surveyId: number): SurveySettings {
  const fallback = getDefaultSurveySettings();
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(PERSIST_PREFIX + surveySettingsStorageKey(surveyId));
    if (raw === null || raw.trim() === '') return fallback;
    return normalizeSurveySettings(JSON.parse(raw) as Partial<SurveySettings>);
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
