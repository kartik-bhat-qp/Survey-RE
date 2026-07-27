import type { SurveyListItem } from '@/data/mock-survey-folders';
import type { TextAiSegmentFilterState } from '@/data/mock-text-ai-segment-filters';
import type {
  TextAiCodebookSource,
  TextAiLanguageOption,
  TextAiReportCodebookOption,
} from '@/data/mock-text-ai-model-setup';

export interface TextAiDashboardCreatePayload {
  codebookSource: TextAiCodebookSource;
  name: string;
  modelingGoal: string;
  outputLanguage: TextAiLanguageOption;
  questionContexts: Record<number, string>;
  survey: SurveyListItem;
  questionIds: number[];
  reportCodebook: TextAiReportCodebookOption | null;
  separateDashboardPerQuestion: boolean;
  expertReviewRequested: boolean;
  segmentFilters: TextAiSegmentFilterState;
}
