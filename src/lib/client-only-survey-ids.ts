import { NEW_AI_SURVEY_ID } from '@/data/ai-survey-draft';
import { NEW_BLANK_SURVEY_ID } from '@/data/mock-survey-creation-flow';

/** Survey ids backed by sessionStorage — must not be read during SSR. */
export function isClientOnlySurveyId(id: number): boolean {
  return id === NEW_AI_SURVEY_ID || id === NEW_BLANK_SURVEY_ID;
}
