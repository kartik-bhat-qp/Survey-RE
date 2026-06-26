/** Standalone VideoAI navigation — list at /video-ai, detail at /video-ai/[id]. */

export function saveVideoAiReturnState(_surveyId: number): void {
  // No-op: standalone export does not restore survey analytics sub-view.
}

export function readVideoAiReturnState(): null {
  return null;
}

export function consumeVideoAiRestoreState(_surveyId: number): null {
  return null;
}

export function videoAiDetailHref(questionId: string, surveyId: number): string {
  return `/video-ai/${questionId}?surveyId=${surveyId}`;
}

export function videoAiListHref(_surveyId?: number): string {
  return '/video-ai';
}
