'use client';

import { usePersistedState } from './usePersistedState';
import { DEFAULT_TEXT_AI_SHARING, textAiSharingStorageKey } from '@/data/text-ai-sharing';

export function useTextAiDashboardShare(dashboardId: number) {
  return usePersistedState(textAiSharingStorageKey(dashboardId), DEFAULT_TEXT_AI_SHARING);
}
