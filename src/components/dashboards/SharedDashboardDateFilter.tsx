'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useIsMobile } from '@/hooks/useIsMobile';
import styles from './SharedDashboardDateFilter.module.css';

const WuDateRangePicker = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDateRangePicker })), { ssr: false });
const WuCalender = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCalender })), { ssr: false });
const WuSelect = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })), { ssr: false });
const WuButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })), { ssr: false });

const PRESETS = ['Custom range', 'Last week', 'Last month', 'Last quarter', 'Last year', 'Last 30 days', 'Last 90 days'].map((label) => ({ label, value: label }));
const asDate = (value: string) => value ? new Date(`${value}T00:00:00`) : undefined;
const asString = (date: Date | undefined) => date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';

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
        onChange={(range) => {
          onChange({
            startDate: asString(range?.from),
            endDate: asString(range?.to),
          });
        }}
        onReset={() => onChange({ startDate: '', endDate: '' })}
      />
    </div>
  );
}

/** Calendar body shared by standalone and reporting-year menus. */
export function DateRangeCalendar({ startDate, endDate, onChange }: SharedDashboardDateFilterProps) {
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);
  const [preset, setPreset] = useState('Custom range');
  const [month, setMonth] = useState(() => asDate(startDate) ?? new Date());
  const invalid = !!(draftStart && draftEnd && draftStart > draftEnd);

  function selectPreset(value: string) {
    setPreset(value);
    if (value === 'Custom range') return;
    const today = new Date();
    let end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let start = new Date(end);
    if (value === 'Last week') {
      end.setDate(end.getDate() - end.getDay() - 1);
      start = new Date(end); start.setDate(start.getDate() - 6);
    } else if (value === 'Last month') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (value === 'Last quarter') {
      const quarterStart = Math.floor(today.getMonth() / 3) * 3;
      start = new Date(today.getFullYear(), quarterStart - 3, 1);
      end = new Date(today.getFullYear(), quarterStart, 0);
    } else if (value === 'Last year') {
      start = new Date(today.getFullYear() - 1, 0, 1);
      end = new Date(today.getFullYear() - 1, 11, 31);
    } else start.setDate(start.getDate() - (value === 'Last 30 days' ? 29 : 89));
    setDraftStart(asString(start)); setDraftEnd(asString(end)); setMonth(start);
  }

  return <>
    <WuSelect aria-label="Date preset" variant="outlined" data={PRESETS} accessorKey={{ value: 'value', label: 'label' }}
      value={PRESETS.find((option) => option.value === preset)} onSelect={(option) => selectPreset((option as { value: string }).value)} />
    <DashboardCalendar startDate={draftStart} endDate={draftEnd} month={month} onMonthChange={setMonth}
      onChange={(start, end) => { setDraftStart(start); setDraftEnd(end); setPreset('Custom range'); }} />
    <footer className={styles.footer}>
      <div className={styles.dateInputs}>
        <input type="date" aria-label="Start date" value={draftStart} onInput={(event) => { setDraftStart(event.currentTarget.value); const date = asDate(event.currentTarget.value); if (date) setMonth(date); setPreset('Custom range'); }} />
        <input type="date" aria-label="End date" value={draftEnd} onInput={(event) => { setDraftEnd(event.currentTarget.value); const date = asDate(event.currentTarget.value); if (date) setMonth(date); setPreset('Custom range'); }} />
      </div>
      <button type="button" className={styles.reset} onClick={() => { onChange({ startDate: '', endDate: '' }); }}><span className="wm-refresh" aria-hidden />Reset</button>
      <WuButton size="sm" disabled={!draftStart || !draftEnd || invalid} onClick={() => { onChange({ startDate: draftStart, endDate: draftEnd }); }}>Apply</WuButton>
    </footer>
    {invalid && <p role="alert" className={styles.error}>The start date must be on or before the end date.</p>}
  </>;
}


export function DashboardCalendar({ startDate, endDate, month, onMonthChange, onChange, single = false }: {
  startDate: string; endDate?: string; month: Date; onMonthChange: (month: Date) => void;
  onChange: (start: string, end: string) => void; single?: boolean;
}) {
  const isMobile = useIsMobile();
  const common = {
    className: styles.calendar, numberOfMonths: single || isMobile ? 1 : 2, month, onMonthChange,
    captionLayout: 'dropdown' as const, startMonth: new Date(2020, 0, 1), endMonth: new Date(2098, 11, 31),
    classNames: {
      months: styles.months, month: styles.month, month_caption: styles.monthCaption,
      month_grid: styles.monthGrid, weekdays: styles.weekdays, weekday: styles.weekday,
      day: styles.day, day_button: styles.dayButton, selected: styles.selected,
      range_start: styles.rangeEdge, range_end: styles.rangeEdge, range_middle: styles.rangeMiddle,
      today: styles.today, nav: styles.navigation, button_previous: styles.previous, button_next: styles.next,
      dropdowns: styles.dropdowns, dropdown: styles.dropdown, caption_label: styles.captionLabel,
    },
  };
  return single
    ? <WuCalender {...common} mode="single" selected={asDate(startDate)} onSelect={date => onChange(asString(date), '')} />
    : <WuCalender {...common} mode="range" selected={startDate ? { from: asDate(startDate), to: asDate(endDate ?? '') } : undefined}
        onSelect={range => onChange(asString(range?.from), asString(range?.to))} />;
}
