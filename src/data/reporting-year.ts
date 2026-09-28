export interface ReportingYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface DashboardDateSelection {
  startDate: string;
  endDate: string;
  reportingYear?: ReportingYear;
}

export type ReportingInterval = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
export interface ReportingBucket {
  label: string;
  startDate: string;
  endDate: string;
  partial: boolean;
  segment1: number;
  segment2: number;
}

const DAY = 86400000;
export function parseReportingDate(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : undefined;
}
const iso = (date: Date) => date.toISOString().slice(0, 10);
const shiftDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY);

/** Anchor every boundary to the original date, avoiding cumulative month-end drift. */
export function reportingBoundary(startDate: string, months: number): string {
  const start = parseReportingDate(startDate);
  if (!start) return '';
  const target = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  // A leap-day year runs through February 28, with the next year beginning March 1.
  if (months === 12 && start.getUTCMonth() === 1 && start.getUTCDate() === 29 && lastDay === 28) {
    return iso(new Date(Date.UTC(target.getUTCFullYear(), 2, 1)));
  }
  target.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return iso(target);
}

export function reportingYearEnd(startDate: string): string {
  const end = parseReportingDate(reportingBoundary(startDate, 12));
  return end ? iso(shiftDays(end, -1)) : '';
}

export function formatReportingDate(value: string): string {
  return parseReportingDate(value)?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) ?? '';
}

export function reportingYearLabel(startDate: string): string {
  const end = reportingYearEnd(startDate);
  return end ? `FY ${startDate.slice(0, 4)}${end.slice(0, 4) === startDate.slice(0, 4) ? '' : `–${end.slice(2, 4)}`}` : '';
}

export function reportingQuarters(startDate: string) {
  return Array.from({ length: 4 }, (_, i) => {
    const next = parseReportingDate(reportingBoundary(startDate, (i + 1) * 3));
    return { label: `Q${i + 1}`, startDate: reportingBoundary(startDate, i * 3), endDate: next ? iso(shiftDays(next, -1)) : '' };
  });
}

export function isReportingYear(value: unknown): value is ReportingYear {
  if (!value || typeof value !== 'object') return false;
  const year = value as ReportingYear;
  return typeof year.id === 'string' && typeof year.name === 'string' && !!year.name.trim() &&
    typeof year.startDate === 'string' && !!parseReportingDate(year.startDate) && year.endDate === reportingYearEnd(year.startDate);
}

export function reportingYearTooltip(year: ReportingYear): string {
  return `${formatReportingDate(year.startDate)} – ${formatReportingDate(year.endDate)}. Quarters and years align to this start date.`;
}

/** Deterministic daily synthetic counts: regrouping preserves the same response base. */
export function reportingBuckets(selection: DashboardDateSelection, interval: ReportingInterval): ReportingBucket[] {
  const start = parseReportingDate(selection.startDate);
  const end = parseReportingDate(selection.endDate);
  if (!start || !end || start > end || end.getTime() - start.getTime() > 3660 * DAY) return [];
  const fiscal = selection.reportingYear;
  let cursor = new Date(start);
  if (interval === 'Daily') { /* Keep the selected day. */ }
  else if (interval === 'Weekly') cursor = shiftDays(cursor, -cursor.getUTCDay());
  else if (interval === 'Monthly') cursor.setUTCDate(1);
  else if (!fiscal && interval === 'Quarterly') cursor = new Date(Date.UTC(start.getUTCFullYear(), Math.floor(start.getUTCMonth() / 3) * 3, 1));
  else if (!fiscal && interval === 'Yearly') cursor = new Date(Date.UTC(start.getUTCFullYear(), 0, 1));
  else if (fiscal) cursor = parseReportingDate(fiscal.startDate)!;
  const buckets: ReportingBucket[] = [];
  let index = 0;
  while (cursor <= end && index < 3661) {
    let next: Date;
    if (interval === 'Daily') next = shiftDays(cursor, 1);
    else if (interval === 'Weekly') next = shiftDays(cursor, 7);
    else if (interval === 'Monthly') next = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    else if (fiscal) next = parseReportingDate(reportingBoundary(fiscal.startDate, (index + 1) * (interval === 'Quarterly' ? 3 : 12)))!;
    else next = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + (interval === 'Quarterly' ? 3 : 12), 1));
    const coveredStart = cursor < start ? start : cursor;
    const periodEnd = shiftDays(next, -1);
    const coveredEnd = periodEnd > end ? end : periodEnd;
    let segment1 = 0;
    let segment2 = 0;
    for (let date = coveredStart; date <= coveredEnd; date = shiftDays(date, 1)) {
      const dayNumber = Math.floor(date.getTime() / DAY);
      segment1 += 3 + dayNumber % 11;
      segment2 += 4 + dayNumber % 17;
    }
    const yearLabel = fiscal ? reportingYearLabel(fiscal.startDate) : String(cursor.getUTCFullYear());
    const label = interval === 'Daily' ? formatReportingDate(iso(cursor)) : interval === 'Quarterly' ? `${fiscal ? `Q${index + 1}` : `Q${Math.floor(cursor.getUTCMonth() / 3) + 1}`} ${yearLabel}`
      : interval === 'Yearly' ? yearLabel
      : interval === 'Monthly' ? cursor.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
      : `${formatReportingDate(iso(coveredStart))} – ${formatReportingDate(iso(coveredEnd))}`;
    if (coveredStart <= coveredEnd) buckets.push({ label, startDate: iso(coveredStart), endDate: iso(coveredEnd), partial: cursor < start || periodEnd > end, segment1, segment2 });
    cursor = next;
    index++;
  }
  return buckets;
}
