export type SurveyFinishOptionType = 'thank-you-page';

export interface SurveyFinishOptions {
  finishType: SurveyFinishOptionType;
  thankYouMessage: string;
  terminatedRespondentMessage: string;
}

export const FINISH_OPTIONS_HELP =
  'Configure what respondents see when they complete or are terminated from the survey.';

export const FINISH_OPTION_TYPE_OPTIONS: {
  value: SurveyFinishOptionType;
  label: string;
}[] = [{ value: 'thank-you-page', label: 'Thank You Page' }];

export const THANK_YOU_MESSAGE_HELP =
  'Message shown to respondents after they successfully complete the survey.';

export const TERMINATED_RESPONDENT_MESSAGE_HELP =
  'Message shown when a respondent is terminated before completing the survey.';

export const DEFAULT_THANK_YOU_MESSAGE =
  '<p style="text-align: center">Thank you for completing this survey.</p>';

export const DEFAULT_TERMINATED_RESPONDENT_MESSAGE =
  '<p style="text-align: center">Your profile does not fit our criteria. Thank you for your time.</p>';

export const DEFAULT_SURVEY_FINISH_OPTIONS: SurveyFinishOptions = {
  finishType: 'thank-you-page',
  thankYouMessage: DEFAULT_THANK_YOU_MESSAGE,
  terminatedRespondentMessage: DEFAULT_TERMINATED_RESPONDENT_MESSAGE,
};

export function surveyFinishOptionsStorageKey(surveyId: number): string {
  return `survey-finish-options-${surveyId}`;
}

export function normalizeSurveyFinishOptions(
  parsed: Partial<SurveyFinishOptions>
): SurveyFinishOptions {
  const fallback = DEFAULT_SURVEY_FINISH_OPTIONS;
  return {
    finishType:
      parsed.finishType === 'thank-you-page' ? parsed.finishType : fallback.finishType,
    thankYouMessage: parsed.thankYouMessage || fallback.thankYouMessage,
    terminatedRespondentMessage:
      parsed.terminatedRespondentMessage || fallback.terminatedRespondentMessage,
  };
}
