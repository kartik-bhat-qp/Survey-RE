'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useIsMobile } from '@/hooks/useIsMobile';
import styles from './SharedDashboardDateFilter.module.css';

const WuPopover = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuPopover })), { ssr: false });
const WuCalender = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCalender })), { ssr: false });
const WuSelect = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })), { ssr: false });
const WuButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })), { ssr: false });

const PRESETS = ['Custom range', 'Last week', 'Last month', 'Last quarter', 'Last year', 'Last 30 days', 'Last 90 days'].map((label) => ({ label, value: label }));
const asDate = (value: string) => value ? new Date(`${value}T00:00:00`) : undefined;
const asString = (date: Date | undefined) => date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
const displayDate = (value: string) => asDate(value)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

interface SharedDashboardDateFilterProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
}

/** Production's compact calendar layout, using the installed WickUI primitives. */
export function SharedDashboardDateFilter({ startDate, endDate, onChange }: SharedDashboardDateFilterProps) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);
  const [preset, setPreset] = useState('Custom range');
  const [month, setMonth] = useState(() => new Date());
  const isMobile = useIsMobile();
  const invalid = !!(draftStart && draftEnd && draftStart > draftEnd);

  function changeOpen(next: boolean) {
    if (next) {
      setDraftStart(startDate); setDraftEnd(endDate); setPreset('Custom range');
      const first = asDate(startDate) ?? new Date();
      setMonth(startDate ? first : new Date(first.getFullYear(), first.getMonth() - 1, 1));
    }
    setOpen(next);
  }

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

  return <WuPopover open={open} onOpenChange={changeOpen} align="start" sideOffset={-1}
    className={styles.popover} aria-label="Date range" Trigger={<button type="button" className={styles.trigger} aria-label="Date range">
      <span className="wm-date-range" aria-hidden /><span>{startDate && endDate ? `${displayDate(startDate)} - ${displayDate(endDate)}` : 'Select date range'}</span>
      <span className="wm-arrow-drop-down" aria-hidden />
    </button>}>
    <WuSelect aria-label="Date preset" variant="outlined" data={PRESETS} accessorKey={{ value: 'value', label: 'label' }}
      value={PRESETS.find((option) => option.value === preset)} onSelect={(option) => selectPreset((option as { value: string }).value)} />
    <WuCalender className={styles.calendar} mode="range" numberOfMonths={isMobile ? 1 : 2}
      month={month} onMonthChange={setMonth} captionLayout="dropdown"
      startMonth={new Date(2020, 0, 1)} endMonth={new Date(new Date().getFullYear() + 1, 11, 31)}
      selected={draftStart ? { from: asDate(draftStart), to: asDate(draftEnd) } : undefined}
      onSelect={(range) => { setDraftStart(asString(range?.from)); setDraftEnd(asString(range?.to)); setPreset('Custom range'); }}
      classNames={{
        months: styles.months, month: styles.month, month_caption: styles.monthCaption,
        month_grid: styles.monthGrid, weekdays: styles.weekdays, weekday: styles.weekday,
        day: styles.day, day_button: styles.dayButton, selected: styles.selected,
        range_start: styles.rangeEdge, range_end: styles.rangeEdge, range_middle: styles.rangeMiddle,
        today: styles.today, nav: styles.navigation, button_previous: styles.previous, button_next: styles.next,
        dropdowns: styles.dropdowns, dropdown: styles.dropdown, caption_label: styles.captionLabel,
      }} />
    <footer className={styles.footer}>
      <div className={styles.dateInputs}>
        <input type="date" aria-label="Start date" value={draftStart} onInput={(event) => { setDraftStart(event.currentTarget.value); setPreset('Custom range'); }} />
        <input type="date" aria-label="End date" value={draftEnd} onInput={(event) => { setDraftEnd(event.currentTarget.value); setPreset('Custom range'); }} />
      </div>
      <button type="button" className={styles.reset} onClick={() => { onChange({ startDate: '', endDate: '' }); setOpen(false); }}><span className="wm-refresh" aria-hidden />Reset</button>
      <WuButton size="sm" disabled={!draftStart || !draftEnd || invalid} onClick={() => { onChange({ startDate: draftStart, endDate: draftEnd }); setOpen(false); }}>Apply</WuButton>
    </footer>
    {invalid && <p role="alert" className={styles.error}>The start date must be on or before the end date.</p>}
  </WuPopover>;
}
