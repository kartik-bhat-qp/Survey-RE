'use client';
import { useId } from 'react';
import dynamic from 'next/dynamic';
import { formatReportingDate } from '@/data/reporting-year';
import { normalizeReportingYearSetting, reportingYearForMonth, type DashboardReportingYearSetting, type ReportingStartMonth } from '@/data/dashboard-reporting-year';
import styles from './ReportingYearDateFilter.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((module) => ({ default: module.WuSelect })),
  { ssr: false }
);

interface ReportingMonthOption {
  value: ReportingStartMonth;
  label: string;
}

const MONTHS: ReportingMonthOption[] = ['January','February','March','April','May','June','July','August','September','October','November','December']
  .map((label, index) => ({ value: (index + 1) as ReportingStartMonth, label }));

export interface ReportingYearSettingsProps {
  reportingYearSetting?: DashboardReportingYearSetting;
  onReportingYearChange?: (setting: DashboardReportingYearSetting) => void;
}
export function ReportingYearSettings({ reportingYearSetting, onReportingYearChange }: ReportingYearSettingsProps) {
  const helpId = useId();
  const year = normalizeReportingYearSetting(reportingYearSetting).year!;
  const selectedMonth = MONTHS.find(month => month.value === Number(year.startDate.slice(5,7)))!;
  return <section className={styles.settings} aria-label="Reporting year settings">
    <div className={styles.settingsHeading}>
      <div className={styles.monthHeading}><span>Reporting year</span>
        <span className={styles.badgeHint} tabIndex={0} aria-label="About reporting year" aria-describedby={helpId}>
          <span className={`wm-info ${styles.infoIcon}`} aria-hidden />
          <span id={helpId} role="tooltip" className={styles.badgeTooltip}>Uses the first day of the selected month and runs for 12 months.</span>
        </span>
      </div>
      <p className={styles.settingsDescription}>Align quarters and years to the start month.</p>
    </div>
    <div className={styles.monthControls}>
      <div className={styles.monthSelect}>
        <WuSelect
          aria-label="Reporting year start month"
          data={MONTHS}
          accessorKey={{ value: 'value', label: 'label' }}
          value={selectedMonth}
          variant="outlined"
          onSelect={value => {
            const month = value as ReportingMonthOption;
            const next = reportingYearForMonth(month.value, Number(year.startDate.slice(0,4)), year.id);
            onReportingYearChange?.({ enabled:true, year:next });
          }}
        />
      </div>
      <p className={styles.settingsDescription}>{formatReportingDate(year.startDate)} – {formatReportingDate(year.endDate)}</p>
    </div>
  </section>;
}
