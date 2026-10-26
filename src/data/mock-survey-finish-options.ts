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
  couponCompanyName: string;
  couponHeadline: string;
  couponDetails: string;
  couponList: string;
  rewardPageHeadline: string;
  rewardPageMessage: string;
  giftCardValue: string;
  giftCardCount: string;
  starbucksGiftCardValue: string;
  prepaidVisaGiftCardValue: string;
  emailRewardsToRespondent: boolean;
  displayRewardOnThankYouPage: boolean;
  emailAdminOnEachReward: boolean;
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

export const DEFAULT_COUPON_COMPANY_NAME = "Bob's Ski Haus";

export const DEFAULT_COUPON_HEADLINE = '50% off all skis!';

export const DEFAULT_COUPON_DETAILS =
  'Thank you for participating in our market research! Bring this into our store to redeem!\n\nCoupon code: ${couponCode}';

export const COUPON_LIST_HINT = 'One per Line';

export const REWARD_PAGE_PREVIEW_HINT = 'Preview shows the last saved reward page.';

export const GIFT_CARD_VALUE_HINT = '$1 to $1000 (USD)';

export const GIFT_CARD_FULFILLMENT_NOTE =
  'Gift cards are added within 24 hours. They will not show up in your inventory right away.';

export const TANGO_GIFT_CARD_VALUE_HINT = '$1 to $2000 (USD)';

export const AMAZON_GIFT_CARD_DISCLAIMER =
  'Amazon.com is not a sponsor of this promotion. Amazon.com Gift Cards may be used only for purchases of eligible goods at Amazon.com or certain of its affiliated websites. For complete terms and conditions, see www.amazon.com/gc-legal. Gift cards are issued by ACI Gift Cards, Inc., a Washington corporation.';

export const AMAZON_REWARD_TEST_MODE_MESSAGE =
  'The order total and payment details could not be loaded, so this reward cannot be taken out of test mode right now. Try again shortly.';

export const STARBUCKS_GIFT_CARD_DISCLAIMER =
  'The Starbucks word mark and logo are trademarks of Starbucks Corporation. Starbucks is not a participating partner or sponsor in this offer.';

export const STARBUCKS_GIFT_CARD_VALUE_OPTIONS: RewardSelectOption[] = [
  { value: '5', label: '$5' },
  { value: '25', label: '$25' },
  { value: '50', label: '$50' },
  { value: '100', label: '$100' },
  { value: '250', label: '$250' },
  { value: '500', label: '$500' },
];

export const PREPAID_VISA_DISCLAIMER =
  'Prepaid Visa cards are issued pursuant to a license from Visa. The merchants represented are not sponsors of the rewards or otherwise affiliated with this promotion.';

export const PREPAID_VISA_GIFT_CARD_VALUE_OPTIONS: RewardSelectOption[] = [
  { value: '5', label: '$5' },
  { value: '10', label: '$10' },
  { value: '25', label: '$25' },
  { value: '50', label: '$50' },
  { value: '100', label: '$100' },
  { value: '250', label: '$250' },
  { value: '500', label: '$500' },
];

export interface RewardSelectOption {
  value: string;
  label: string;
}

export const REWARD_QUALIFYING_CRITERIA_OPTIONS: RewardSelectOption[] = [
  { value: 'all-complete-respondents', label: 'All Complete Respondents' },
  { value: 'survey-quiz-score', label: 'Based on Survey Quiz Score' },
  { value: 'first-n-completes', label: 'First N Number of Completes' },
  { value: 'drawing-random-winners', label: 'Drawing - Random Winner(s)' },
];

export const REWARD_CATALOG: RewardSelectOption[] = [
  { value: 'coupon', label: 'Coupon' },
  { value: 'user-defined', label: 'User Defined and Fulfilled' },
  { value: 'amazon', label: 'Amazon.com Gift Card' },
  { value: 'starbucks', label: 'Starbucks Gift Card' },
  { value: 'tango', label: 'Tango Gift Card' },
  { value: 'prepaid-visa', label: 'Prepaid Visa Reward' },
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
  couponCompanyName: DEFAULT_COUPON_COMPANY_NAME,
  couponHeadline: DEFAULT_COUPON_HEADLINE,
  couponDetails: DEFAULT_COUPON_DETAILS,
  couponList: '',
  rewardPageHeadline: '',
  rewardPageMessage: '',
  giftCardValue: '',
  giftCardCount: '',
  starbucksGiftCardValue: '',
  prepaidVisaGiftCardValue: '',
  emailRewardsToRespondent: false,
  displayRewardOnThankYouPage: true,
  emailAdminOnEachReward: false,
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
    couponCompanyName:
      typeof parsed.couponCompanyName === 'string'
        ? parsed.couponCompanyName
        : fallback.couponCompanyName,
    couponHeadline:
      typeof parsed.couponHeadline === 'string' ? parsed.couponHeadline : fallback.couponHeadline,
    couponDetails:
      typeof parsed.couponDetails === 'string' ? parsed.couponDetails : fallback.couponDetails,
    couponList: typeof parsed.couponList === 'string' ? parsed.couponList : fallback.couponList,
    rewardPageHeadline:
      typeof parsed.rewardPageHeadline === 'string'
        ? parsed.rewardPageHeadline
        : fallback.rewardPageHeadline,
    rewardPageMessage:
      typeof parsed.rewardPageMessage === 'string'
        ? parsed.rewardPageMessage
        : fallback.rewardPageMessage,
    giftCardValue:
      typeof parsed.giftCardValue === 'string' ? parsed.giftCardValue : fallback.giftCardValue,
    giftCardCount:
      typeof parsed.giftCardCount === 'string' ? parsed.giftCardCount : fallback.giftCardCount,
    starbucksGiftCardValue: STARBUCKS_GIFT_CARD_VALUE_OPTIONS.some(
      (option) => option.value === parsed.starbucksGiftCardValue
    )
      ? (parsed.starbucksGiftCardValue as string)
      : fallback.starbucksGiftCardValue,
    prepaidVisaGiftCardValue: PREPAID_VISA_GIFT_CARD_VALUE_OPTIONS.some(
      (option) => option.value === parsed.prepaidVisaGiftCardValue
    )
      ? (parsed.prepaidVisaGiftCardValue as string)
      : fallback.prepaidVisaGiftCardValue,
    emailRewardsToRespondent:
      typeof parsed.emailRewardsToRespondent === 'boolean'
        ? parsed.emailRewardsToRespondent
        : fallback.emailRewardsToRespondent,
    displayRewardOnThankYouPage:
      typeof parsed.displayRewardOnThankYouPage === 'boolean'
        ? parsed.displayRewardOnThankYouPage
        : fallback.displayRewardOnThankYouPage,
    emailAdminOnEachReward:
      typeof parsed.emailAdminOnEachReward === 'boolean'
        ? parsed.emailAdminOnEachReward
        : fallback.emailAdminOnEachReward,
  };
}
