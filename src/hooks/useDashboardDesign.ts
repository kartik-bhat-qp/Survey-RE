'use client';

import { useCallback, useEffect, useState } from 'react';
import { normalizeDashboardDesign, type DashboardDesign } from '@/data/dashboard-design';

/** Saves one dashboard's design configuration; never stores a widget collection. */
export function useDashboardDesign(dashboardId: number) {
  const key = `survey-re:dashboard:${dashboardId}:design:v1`;
  const [design, setDesign] = useState<DashboardDesign>(() => normalizeDashboardDesign({ themeColor: '#0d2163' }));
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try { setDesign(normalizeDashboardDesign(JSON.parse(localStorage.getItem(key) ?? '{"themeColor":"#0d2163"}'))); }
      catch { setDesign(normalizeDashboardDesign({ themeColor: '#0d2163' })); }
    });
    return () => { active = false; };
  }, [key]);
  const save = useCallback((next: DashboardDesign) => {
    const normalized = normalizeDashboardDesign(next);
    setDesign(normalized);
    try { localStorage.setItem(key, JSON.stringify(normalized)); } catch { /* Current-session design still applies. */ }
  }, [key]);
  return [design, save] as const;
}
