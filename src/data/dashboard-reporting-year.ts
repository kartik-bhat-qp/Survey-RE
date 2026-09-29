import { isReportingYear, type ReportingYear, type DashboardDateSelection } from './reporting-year';

export interface DashboardReportingYearSetting { year?: ReportingYear; enabled: boolean; }
export function defaultReportingYearSetting(year = new Date().getFullYear()): DashboardReportingYearSetting {
  return { enabled: true, year: { id: `calendar-year-${year}`, name: `Calendar year ${year}`, startDate: `${year}-01-01`, endDate: `${year}-12-31` } };
}
export function normalizeReportingYearSetting(value: unknown): DashboardReportingYearSetting {
  if (!value || typeof value !== 'object') return defaultReportingYearSetting();
  const item = value as Partial<DashboardReportingYearSetting>;
  return isReportingYear(item.year) && item.enabled !== false ? { year: item.year, enabled: true } : defaultReportingYearSetting();
}
export function resolveReportingYearSelection(manual: DashboardDateSelection | undefined, setting: DashboardReportingYearSetting): DashboardDateSelection {
  if (setting.enabled && setting.year) return { startDate: setting.year.startDate, endDate: setting.year.endDate, reportingYear: setting.year };
  return { startDate: manual?.startDate ?? '', endDate: manual?.endDate ?? '' };
}
