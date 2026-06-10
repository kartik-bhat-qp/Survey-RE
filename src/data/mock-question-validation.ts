export type QuestionValidationType = 'none' | 'request-response' | 'force-response';

export interface QuestionValidationState {
  validationType: QuestionValidationType;
  forceResponseMessage: string;
  requestResponseMessage: string;
}

export const QUESTION_VALIDATION_TYPE_OPTIONS: {
  value: QuestionValidationType;
  label: string;
}[] = [
  { value: 'none', label: 'None' },
  { value: 'request-response', label: 'Request Response' },
  { value: 'force-response', label: 'Force Response' },
];

export const DEFAULT_QUESTION_VALIDATION: QuestionValidationState = {
  validationType: 'force-response',
  forceResponseMessage: 'There was an error in the response to the following question.',
  requestResponseMessage: 'We request that you answer the following question.',
};

export function createDefaultQuestionValidation(
  required?: boolean
): QuestionValidationState {
  return {
    ...DEFAULT_QUESTION_VALIDATION,
    validationType: required ? 'force-response' : 'none',
  };
}
