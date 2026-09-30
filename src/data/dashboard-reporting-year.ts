import { isReportingYear, reportingYearEnd, reportingYearLabel, type ReportingYear, type DashboardDateSelection } from './reporting-year';

export type ReportingStartMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export function reportingYearForMonth(month: ReportingStartMonth, year = new Date().getFullYear(), id = 'reporting-year'): ReportingYear {
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError('Choose a month from January to December.');
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = reportingYearEnd(startDate);
  if (!endDate) throw new RangeError('Choose a valid reporting year.');
  return { id, name:reportingYearLabel(startDate), startDate, endDate };
}

export interface DashboardReportingYearSetting { year?: ReportingYear; enabled: boolean; }
export function defaultReportingYearSetting(year = new Date().getFullYear()): DashboardReportingYearSetting {
  return { enabled: true, year: { id: `calendar-year-${year}`, name: `Calendar year ${year}`, startDate: `${year}-01-01`, endDate: `${year}-12-31` } };
}
export function normalizeReportingYearSetting(value: unknown): DashboardReportingYearSetting {
  if (!value || typeof value !== 'object') return defaultReportingYearSetting();
  const item = value as Partial<DashboardReportingYearSetting>;
  if (!isReportingYear(item.year) || item.enabled === false) return defaultReportingYearSetting();
  // Migrate earlier day-based selections to the first day of their saved start month.
  return { year: item.year.startDate.endsWith('-01') ? item.year : reportingYearForMonth(Number(item.year.startDate.slice(5,7)) as ReportingStartMonth, Number(item.year.startDate.slice(0,4)), item.year.id), enabled:true };
}
export function resolveReportingYearSelection(manual: DashboardDateSelection | undefined, setting: DashboardReportingYearSetting): DashboardDateSelection {
  if (setting.enabled && setting.year) return { startDate: setting.year.startDate, endDate: setting.year.endDate, reportingYear: setting.year };
  return { startDate: manual?.startDate ?? '', endDate: manual?.endDate ?? '' };
}
