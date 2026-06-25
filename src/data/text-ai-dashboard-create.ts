import type { SurveyListItem } from '@/data/mock-survey-folders';

export interface TextAiDashboardCreatePayload {
  name: string;
  survey: SurveyListItem;
  questionIds: number[];
  separateDashboardPerQuestion: boolean;
  expertReviewRequested: boolean;
}
