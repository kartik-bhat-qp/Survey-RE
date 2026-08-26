'use client';

import { usePersistedState } from './usePersistedState';
import { DEFAULT_DASHBOARD_SHARING, dashboardSharingStorageKey } from '@/data/mock-shared-urls';

/** Local prototype state only; no production sharing settings are changed. */
export function useDashboardSharing(dashboardId: number) {
  return usePersistedState(dashboardSharingStorageKey(dashboardId), DEFAULT_DASHBOARD_SHARING);
}
