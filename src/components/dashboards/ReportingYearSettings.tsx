'use client';
import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { DateRangeCalendar } from './SharedDashboardDateFilter';
import { formatReportingDate, reportingYearLabel } from '@/data/reporting-year';
import { defaultReportingYearSetting, normalizeReportingYearSetting, type DashboardReportingYearSetting } from '@/data/dashboard-reporting-year';
import styles from './ReportingYearDateFilter.module.css';
import calendarStyles from './SharedDashboardDateFilter.module.css';

export interface ReportingYearSettingsProps {
  reportingYearSetting?: DashboardReportingYearSetting;
  onReportingYearChange?: (setting: DashboardReportingYearSetting) => void;
}
export function ReportingYearSettings({ reportingYearSetting, onReportingYearChange }: ReportingYearSettingsProps) {
  const [editing, setEditing] = useState(false);
  const year = normalizeReportingYearSetting(reportingYearSetting).year!;
  return <section className={styles.settings} aria-label="Reporting year settings">
    <div className={styles.settingsHeading}><strong>Reporting year</strong><p className={styles.settingsDescription}>Align quarters and years to this 12-month period.</p></div>
    <Popover.Root open={editing} onOpenChange={setEditing}>
      <Popover.Trigger asChild><button type="button" className={`${styles.savedDateButton} ${styles.reportingYearTrigger}`} aria-label={`Reporting year: ${formatReportingDate(year.startDate)} – ${formatReportingDate(year.endDate)}`}>{formatReportingDate(year.startDate)} – {formatReportingDate(year.endDate)}</button></Popover.Trigger>
      <Popover.Portal><Popover.Content className={`${calendarStyles.popover} ${calendarStyles.reportingYearPopover}`} align="end" sideOffset={8} aria-label="Reporting year calendar">
        <DateRangeCalendar startDate={year.startDate} endDate={year.endDate} reportingYear hidePresets
          onReset={() => { onReportingYearChange?.(defaultReportingYearSetting()); setEditing(false); }}
          onChange={({ startDate, endDate }) => {
            onReportingYearChange?.({ enabled:true, year:{ id:year.id, name:reportingYearLabel(startDate), startDate, endDate } });
            setEditing(false);
          }} />
      </Popover.Content></Popover.Portal>
    </Popover.Root>
  </section>;
}
