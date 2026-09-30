import { MOCK_EXISTING_CRITERIA } from '@/data/mock-existing-criteria';

export type SurveyFinishOptionType =
  | 'thank-you-page'
  | 'automatic-redirect'
  | 'spotlight-report'
  | 'forward-to-friend'
  | 'review-print'
  | 'rewards'
  | 'panel-integration';

export interface SpotlightCustomCriteria {
  id: string;
  name: string;
}

export interface SurveyFinishOptions {
  finishType: SurveyFinishOptionType;
  thankYouMessage: string;
  terminatedRespondentMessage: string;
  quotaOverlimitMessage: string;
  redirectWebsiteAddress: string;
  spotlightCompareAgainst: string;
  spotlightCustomCriteria: SpotlightCustomCriteria[];
  reviewPrintEditResponse: boolean;
  rewardQualifyingCriteria: string;
  rewardId: string;
  rewardPublicContactEmail: string;
}

export const FINISH_OPTIONS_HELP =
  'Configure what respondents see when they complete, are terminated from, or are over quota for the survey.';

export interface FinishOptionTypeOption {
  value: SurveyFinishOptionType;
  label: string;
}

export type FinishOptionTypeSelectEntry =
  | FinishOptionTypeOption
  | { type: 'group'; label: string; options: FinishOptionTypeOption[] }
  | { type: 'divider' };

export const STANDARD_FINISH_OPTION_TYPES: FinishOptionTypeOption[] = [
  { value: 'thank-you-page', label: 'Thank You Page' },
];

export const ADVANCED_FINISH_OPTION_TYPES: FinishOptionTypeOption[] = [
  { value: 'automatic-redirect', label: 'Automatic Redirect' },
  { value: 'spotlight-report', label: 'Spotlight Report ™' },
  { value: 'forward-to-friend', label: 'Forward To Friend' },
  { value: 'review-print', label: 'Review/Print' },
  { value: 'rewards', label: 'Rewards' },
  { value: 'panel-integration', label: 'Panel Integration' },
];

export const FINISH_OPTION_TYPE_OPTIONS: FinishOptionTypeOption[] = [
  ...STANDARD_FINISH_OPTION_TYPES,
  ...ADVANCED_FINISH_OPTION_TYPES,
];

export const FINISH_OPTION_TYPE_SELECT_DATA: FinishOptionTypeSelectEntry[] = [
  { type: 'group', label: 'Standard Options', options: STANDARD_FINISH_OPTION_TYPES },
  { type: 'divider' },
  { type: 'group', label: 'Advanced Options', options: ADVANCED_FINISH_OPTION_TYPES },
];

export const THANK_YOU_MESSAGE_HELP =
  'Message shown to respondents after they successfully complete the survey.';

export const TERMINATED_RESPONDENT_MESSAGE_HELP =
  'Message shown when a respondent is terminated before completing the survey.';

export const QUOTA_OVERLIMIT_MESSAGE_HELP =
  'Message shown when a respondent qualifies for a quota that has already been filled.';

export const SPOTLIGHT_REPORT_DESCRIPTION =
  'Spotlight Report ™: Display respondent answers compared to the overall results.';

export const SPOTLIGHT_REPORT_HELP =
  'When respondents finish the survey, they see their own answers next to the results of the group selected in Compare Results Against.';

export const FORWARD_TO_FRIEND_DESCRIPTION =
  'Forward to a friend: Allow respondents to forward survey to others.';

export const FORWARD_TO_FRIEND_HELP =
  'When respondents finish the survey, they can send the survey link to friends by email.';

export const REVIEW_PRINT_EDIT_RESPONSE_HELP =
  'Let respondents edit their answers from the review page after finishing the survey.';

export const REVIEW_PRINT_LOGIC_WARNING = 'Logic will be ignored when editing responses.';

export const REWARD_PUBLIC_CONTACT_HELP = 'This will be shown to reward winners.';

export const REWARD_PUBLIC_CONTACT_TOOLTIP =
  'Winners see this email if they need help claiming or redeeming the reward.';

export const DEFAULT_REWARD_PUBLIC_CONTACT_EMAIL = 'kartik.khat@questionpro.com';

export interface RewardSelectOption {
  value: string;
  label: string;
}

export const REWARD_QUALIFYING_CRITERIA_OPTIONS: RewardSelectOption[] = MOCK_EXISTING_CRITERIA.map(
  (template) => ({ value: template.id, label: template.name })
);

export const REWARD_CATALOG: RewardSelectOption[] = [
  { value: 'amazon-10', label: 'Amazon.com Gift Card — $10' },
  { value: 'amazon-25', label: 'Amazon.com Gift Card — $25' },
  { value: 'starbucks-5', label: 'Starbucks eGift — $5' },
  { value: 'visa-15', label: 'Visa Virtual Reward — $15' },
  { value: 'charity-10', label: 'Charity donation — $10' },
  {
    value: 'long-name-experience',
    label:
      'Premium multi-brand experience voucher for respondents who complete the full research study',
  },
];

export const SPOTLIGHT_OVERALL_RESULTS_VALUE = 'overall-results';

export interface SpotlightCompareOption {
  value: string;
  label: string;
}

export function buildSpotlightCompareOptions(
  customCriteria: SpotlightCustomCriteria[]
): SpotlightCompareOption[] {
  return [
    { value: SPOTLIGHT_OVERALL_RESULTS_VALUE, label: 'Overall Results' },
    ...customCriteria.map((criteria) => ({ value: criteria.id, label: criteria.name })),
    ...MOCK_EXISTING_CRITERIA.map((template) => ({ value: template.id, label: template.name })),
  ];
}

export const DEFAULT_THANK_YOU_MESSAGE =
  '<p style="text-align: center">Thank you for completing this survey.</p>';

export const DEFAULT_TERMINATED_RESPONDENT_MESSAGE =
  '<p style="text-align: center">Your profile does not fit our criteria. Thank you for your time.</p>';

export const DEFAULT_QUOTA_OVERLIMIT_MESSAGE =
  '<p style="text-align: center">Thank you for your time but we have already received the required responses.</p>';

export const DEFAULT_REDIRECT_WEBSITE_ADDRESS =
  'https://www.questionpro.com/a/showEntry.do?utm_source=QuestionPro&utm_medium=thankyoulink&utm_campaign=QPsurveys&utm_content=2084457-512';

export const DEFAULT_SURVEY_FINISH_OPTIONS: SurveyFinishOptions = {
  finishType: 'thank-you-page',
  thankYouMessage: DEFAULT_THANK_YOU_MESSAGE,
  terminatedRespondentMessage: DEFAULT_TERMINATED_RESPONDENT_MESSAGE,
  quotaOverlimitMessage: DEFAULT_QUOTA_OVERLIMIT_MESSAGE,
  redirectWebsiteAddress: DEFAULT_REDIRECT_WEBSITE_ADDRESS,
  spotlightCompareAgainst: SPOTLIGHT_OVERALL_RESULTS_VALUE,
  spotlightCustomCriteria: [],
  reviewPrintEditResponse: false,
  rewardQualifyingCriteria: '',
  rewardId: '',
  rewardPublicContactEmail: DEFAULT_REWARD_PUBLIC_CONTACT_EMAIL,
};

export function surveyFinishOptionsStorageKey(surveyId: number): string {
  return `survey-finish-options-${surveyId}`;
}

function normalizeSpotlightCustomCriteria(value: unknown): SpotlightCustomCriteria[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is SpotlightCustomCriteria =>
      typeof item?.id === 'string' && typeof item?.name === 'string'
  );
}

export function normalizeSurveyFinishOptions(
  parsed: Partial<SurveyFinishOptions>
): SurveyFinishOptions {
  const fallback = DEFAULT_SURVEY_FINISH_OPTIONS;
  const spotlightCustomCriteria = normalizeSpotlightCustomCriteria(parsed.spotlightCustomCriteria);
  const compareOptions = buildSpotlightCompareOptions(spotlightCustomCriteria);
  return {
    finishType: FINISH_OPTION_TYPE_OPTIONS.some((option) => option.value === parsed.finishType)
      ? (parsed.finishType as SurveyFinishOptionType)
      : fallback.finishType,
    thankYouMessage: parsed.thankYouMessage || fallback.thankYouMessage,
    terminatedRespondentMessage:
      parsed.terminatedRespondentMessage || fallback.terminatedRespondentMessage,
    quotaOverlimitMessage: parsed.quotaOverlimitMessage || fallback.quotaOverlimitMessage,
    redirectWebsiteAddress:
      typeof parsed.redirectWebsiteAddress === 'string'
        ? parsed.redirectWebsiteAddress
        : fallback.redirectWebsiteAddress,
    spotlightCompareAgainst: compareOptions.some(
      (option) => option.value === parsed.spotlightCompareAgainst
    )
      ? (parsed.spotlightCompareAgainst as string)
      : fallback.spotlightCompareAgainst,
    spotlightCustomCriteria,
    reviewPrintEditResponse:
      typeof parsed.reviewPrintEditResponse === 'boolean'
        ? parsed.reviewPrintEditResponse
        : fallback.reviewPrintEditResponse,
    rewardQualifyingCriteria: REWARD_QUALIFYING_CRITERIA_OPTIONS.some(
      (option) => option.value === parsed.rewardQualifyingCriteria
    )
      ? (parsed.rewardQualifyingCriteria as string)
      : fallback.rewardQualifyingCriteria,
    rewardId: REWARD_CATALOG.some((option) => option.value === parsed.rewardId)
      ? (parsed.rewardId as string)
      : fallback.rewardId,
    rewardPublicContactEmail:
      typeof parsed.rewardPublicContactEmail === 'string'
        ? parsed.rewardPublicContactEmail
        : fallback.rewardPublicContactEmail,
  };
}
