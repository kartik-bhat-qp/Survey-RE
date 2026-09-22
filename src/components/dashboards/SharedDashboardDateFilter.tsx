'use client';

import dynamic from 'next/dynamic';
import styles from './SharedDashboardDateFilter.module.css';

const WuDateRangePicker = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDateRangePicker })),
  { ssr: false }
);

const asDate = (value: string) =>
  value ? new Date(`${value}T00:00:00`) : undefined;

const asString = (date: Date | undefined) =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : '';

interface SharedDashboardDateFilterProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
}

/** Compact date-range control shared by dashboard and Text AI filters. */
export function SharedDashboardDateFilter({
  startDate,
  endDate,
  onChange,
}: SharedDashboardDateFilterProps) {
  const from = asDate(startDate);
  const to = asDate(endDate);

  return (
    <div className={styles.wrap}>
      <WuDateRangePicker
        aria-label="Date range"
        variant="outlined"
        placeholder="Select date range"
        value={from || to ? { from, to } : undefined}
        minDate={new Date(2020, 0, 1)}
        maxDate={new Date(new Date().getFullYear() + 1, 11, 31)}
        required
        append
        onChange={(range) => {
          onChange({
            startDate: asString(range?.from),
            endDate: asString(range?.to),
          });
        }}
        onReset={() => onChange({ startDate: '', endDate: '' })}
        position={{ align: 'start', side: 'bottom', sideOffset: -1 }}
      />
    </div>
  );
}
