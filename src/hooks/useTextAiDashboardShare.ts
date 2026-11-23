'use client';

import { usePersistedState } from './usePersistedState';
import { DEFAULT_TEXT_AI_SHARING, textAiSharingStorageKey } from '@/data/text-ai-sharing';
import { getTextAiLanguageDemo } from '@/data/mock-text-ai-language-demos';

const LANGUAGE_DEMO_SHARING = { ...DEFAULT_TEXT_AI_SHARING, showOriginalResponses: true };

export function useTextAiDashboardShare(dashboardId: number) {
  const defaults = getTextAiLanguageDemo(dashboardId) ? LANGUAGE_DEMO_SHARING : DEFAULT_TEXT_AI_SHARING;
  return usePersistedState(textAiSharingStorageKey(dashboardId), defaults);
}
