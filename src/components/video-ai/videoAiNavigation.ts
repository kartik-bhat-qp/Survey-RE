import type { AnalyticsTabId } from '@/data/mock-survey-analytics';

export const VIDEO_AI_RESTORE_KEY = 'videoAiRestoreState';

export interface VideoAiRestoreState {
  surveyId: number;
  tab: AnalyticsTabId;
  subView: string;
}

export function saveVideoAiReturnState(surveyId: number): void {
  if (typeof window === 'undefined') return;
  const state: VideoAiRestoreState = {
    surveyId,
    tab: 'analysis',
    subView: 'video-ai-analysis',
  };
  sessionStorage.setItem(VIDEO_AI_RESTORE_KEY, JSON.stringify(state));
}

export function readVideoAiReturnState(): VideoAiRestoreState | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(VIDEO_AI_RESTORE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VideoAiRestoreState;
  } catch {
    return null;
  }
}

/** Read and clear restore state when it matches the target survey. */
export function consumeVideoAiRestoreState(surveyId: number): VideoAiRestoreState | null {
  const state = readVideoAiReturnState();
  if (!state || state.surveyId !== surveyId) return null;
  sessionStorage.removeItem(VIDEO_AI_RESTORE_KEY);
  return state;
}

export function videoAiDetailHref(questionId: string, surveyId: number): string {
  return `/video-ai/${questionId}?surveyId=${surveyId}`;
}

export function videoAiListHref(surveyId: number): string {
  return `/surveys/${surveyId}`;
}
