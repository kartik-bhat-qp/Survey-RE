'use client';
import { useCallback, useEffect, useState } from 'react';
import { defaultReportingYearSetting, normalizeReportingYearSetting, type DashboardReportingYearSetting } from '@/data/dashboard-reporting-year';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';

export function useDashboardReportingYear(dashboardId: number) {
  const key = `survey-re:dashboard:${dashboardId}:reporting-year:v2`;
  const { showToast } = useWuShowToast();
  const [setting, setSetting] = useState<DashboardReportingYearSetting>(() => defaultReportingYearSetting());
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = localStorage.getItem(key);
        if (saved) { setSetting(normalizeReportingYearSetting(JSON.parse(saved))); return; }
        setSetting(defaultReportingYearSetting());
      } catch { setSetting(defaultReportingYearSetting()); }
    });
    return () => { active = false; };
  }, [dashboardId, key]);
  const save = useCallback((next: DashboardReportingYearSetting) => {
    const normalized = normalizeReportingYearSetting(next);
    setSetting(normalized);
    try { localStorage.setItem(key, JSON.stringify(normalized)); }
    catch { showToast({ message: 'Reporting year updated for this session. Browser storage is unavailable.', variant: 'info' }); }
  }, [key, showToast]);
  return [setting, save] as const;
}
