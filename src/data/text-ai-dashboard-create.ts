import type { SurveyListItem } from '@/data/mock-survey-folders';
import type { TextAiSegmentFilterState } from '@/data/mock-text-ai-segment-filters';

export interface TextAiDashboardCreatePayload {
  name: string;
  survey: SurveyListItem;
  questionIds: number[];
  separateDashboardPerQuestion: boolean;
  expertReviewRequested: boolean;
  segmentFilters: TextAiSegmentFilterState;
}
