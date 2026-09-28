'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardCalendar, DateRangeCalendar } from './SharedDashboardDateFilter';
import { formatReportingDate, reportingYearEnd, reportingYearLabel, reportingYearTooltip, type DashboardDateSelection, type ReportingYear } from '@/data/reporting-year';
import styles from './ReportingYearDateFilter.module.css';

const WuPopover = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => ({ default: m.WuPopover })), { ssr: false });
const WuButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => ({ default: m.WuButton })), { ssr: false });
const WuTooltip = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => ({ default: m.WuTooltip })), { ssr: false });

interface Props {
  selection: DashboardDateSelection;
  years: ReportingYear[];
  onChange: (selection: DashboardDateSelection) => void;
  onSave: (year: ReportingYear) => void;
  onDelete: (year: ReportingYear) => void;
}

export function ReportingYearDateFilter({ selection, years, onChange, onSave, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'menu' | 'date' | 'year'>('menu');
  const [editing, setEditing] = useState<ReportingYear>();
  const [deleting, setDeleting] = useState<ReportingYear>();
  const [start, setStart] = useState('');
  const [name, setName] = useState('');
  const [month, setMonth] = useState(() => new Date());
  const end = reportingYearEnd(start);
  const effectiveName = name.trim();
  const duplicate = years.some(year => year.id !== editing?.id && year.name.toLowerCase() === effectiveName.toLowerCase());
  const canSave = !!effectiveName && !!end && start >= '2020-01-01' && start <= '2098-12-31' && !duplicate;
  const activeYear = selection.reportingYear;
  const manualApplied = !activeYear && !!selection.startDate && !!selection.endDate;
  const rangeText = selection.startDate && selection.endDate ? `${formatReportingDate(selection.startDate)} – ${formatReportingDate(selection.endDate)}` : 'Select date range';

  function openYear(year?: ReportingYear) {
    const initialStart = year?.startDate || selection.startDate || `${new Date().getFullYear()}-04-01`;
    setEditing(year); setName(year?.name ?? ''); setStart(initialStart);
    setMonth(new Date(`${initialStart}T00:00:00`)); setView('year');
  }
  function applyYear(year: ReportingYear) {
    onChange({ startDate: year.startDate, endDate: year.endDate, reportingYear: year }); setOpen(false);
  }
  function saveYear() {
    if (!canSave) return;
    const year = { id: editing?.id ?? `reporting-year-${crypto.randomUUID()}`, name: effectiveName, startDate: start, endDate: end };
    onSave(year);
    if (!editing || activeYear?.id === editing.id) applyYear(year);
    else setOpen(false);
  }

  return <div className={styles.root}>
    <WuPopover open={open} onOpenChange={next => { setOpen(next); setDeleting(undefined); if (next) setView('menu'); }} align="start" sideOffset={6}
      className={`${styles.popover} ${view === 'date' ? styles.calendarPopover : ''}`}
      Trigger={<button type="button" className={styles.trigger} aria-label="Filter by date">
        <span className="wm-date-range" aria-hidden />
        {activeYear && <WuTooltip content={reportingYearTooltip(activeYear)} position="bottom"><span className={styles.badge} tabIndex={0} aria-label="Reporting year calendar">FY</span></WuTooltip>}
        <span className={styles.triggerText}>{activeYear ? activeYear.name : rangeText}</span><span className="wm-arrow-drop-down" aria-hidden />
      </button>}>
      {deleting ? <div className={styles.calendarBody} role="alertdialog" aria-label="Delete reporting year" aria-describedby="delete-reporting-year-description">
        <header className={styles.header}><strong>Delete reporting year?</strong></header>
        <p id="delete-reporting-year-description" className={styles.guidance}>Delete “{deleting.name}”?{activeYear?.id === deleting.id ? ' Its dates will remain applied as a normal date range, using calendar quarters and years.' : ' Your current date selection will stay unchanged.'}</p>
        <footer className={styles.footer}>
          <button type="button" className={styles.cancelDelete} onClick={() => setDeleting(undefined)}>Cancel</button>
          <button type="button" className={styles.confirmDelete} onClick={() => {
            onDelete(deleting);
            if (activeYear?.id === deleting.id) onChange({ startDate: selection.startDate, endDate: selection.endDate });
            setDeleting(undefined); setView('menu');
          }}>Delete reporting year</button>
        </footer>
      </div> : view === 'menu' ? <div className={styles.menu}>
        <button type="button" className={`${styles.option} ${manualApplied ? styles.selected : ''}`} aria-pressed={manualApplied} onClick={() => setView('date')}>
          <span className="wm-date-range" aria-hidden /><span className={styles.optionText}>Date range<small>{manualApplied ? rangeText : 'Custom dates & quick ranges'}</small></span>
          {manualApplied && <span className="wm-check" aria-label="Applied" />}
        </button>
        <p className={styles.eyebrow}>REPORTING YEARS</p><div className={styles.savedList}>
          {years.map(year => <div key={year.id} className={`${styles.savedRow} ${activeYear?.id === year.id ? styles.selected : ''}`}>
            <button type="button" className={styles.savedYear} aria-pressed={activeYear?.id === year.id} onClick={() => applyYear(year)}>
              <WuTooltip content={reportingYearTooltip(year)} position="bottom"><span className={styles.badge} tabIndex={0} aria-label="Reporting year calendar">FY</span></WuTooltip><span className={styles.optionText}>{year.name}<small>{formatReportingDate(year.startDate)} – {formatReportingDate(year.endDate)}</small></span>
              {activeYear?.id === year.id && <span className="wm-check" aria-label="Applied" />}
            </button>
            <button type="button" className={styles.editButton} aria-label={`Edit ${year.name}`} title="Edit reporting year" onClick={() => openYear(year)}><span className="wm-edit" aria-hidden /></button>
            <button type="button" className={`${styles.editButton} ${styles.deleteButton}`} aria-label={`Delete ${year.name}`} title="Delete reporting year" onClick={() => setDeleting(year)}><span className="wm-delete" aria-hidden /></button>
          </div>)}
        </div>
        <button type="button" className={styles.option} onClick={() => openYear()}><span className="wm-add" aria-hidden /><span>Create reporting year</span></button>
      </div> : <div className={styles.calendarBody}>
        <header className={styles.header}><button type="button" aria-label="Back to date options" onClick={() => setView('menu')}>←</button><strong>{view === 'date' ? 'Date range' : editing ? 'Edit reporting year' : 'Create reporting year'}</strong></header>
        {view === 'date' ? <DateRangeCalendar startDate={selection.startDate} endDate={selection.endDate} onChange={range => { onChange(range); setOpen(false); }} /> : <>
          <p className={styles.guidance}>Set the start of your 12-month reporting year.</p>
          <label className={styles.nameField}>Name <span aria-hidden="true">*</span><input required aria-label="Reporting year name" maxLength={60} value={name} placeholder={reportingYearLabel(start)} onChange={event => setName(event.target.value)} /></label>
          <DashboardCalendar single startDate={start} month={month} onMonthChange={setMonth} onChange={date => setStart(date)} />
          <div className={styles.dateRow}>
            <label>Start date<input type="date" aria-label="Reporting year start date" min="2020-01-01" max="2098-12-31" value={start} onInput={event => { const value = event.currentTarget.value; setStart(value); if (value) setMonth(new Date(`${value}T00:00:00`)); }} /></label>
            <div>End date <span className={styles.muted}>(automatic)</span><output aria-label="Automatic end date">{formatReportingDate(end) || 'Select a start date'}</output></div>
          </div>
          {duplicate && <p className={styles.error} role="alert">A reporting year with this name already exists.</p>}
          <footer className={styles.footer}><WuButton size="sm" variant="secondary" onClick={() => setView('menu')}>Cancel</WuButton><WuButton size="sm" disabled={!canSave} onClick={saveYear}>{editing ? 'Save changes' : 'Save & apply'}</WuButton></footer>
        </>}
      </div>}
    </WuPopover>
  </div>;
}
