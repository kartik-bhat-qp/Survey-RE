'use client';

import dynamic from 'next/dynamic';
import { useEffect, useId, useRef, useState } from 'react';
import { HEADER_BRAND_COLOR } from '@/data/mock-header-categories';
import {
  buildCustomDateFilter,
  buildDateFilterFromPreset,
  formatFetchedAtLabel,
  formatUsageCount,
  QUESTION_TYPE_USAGE_DATE_PRESETS,
  QUESTION_TYPE_USAGE_DEFAULT_DATE_FILTER,
  QUESTION_TYPE_USAGE_MIN_PRESETS,
  QUESTION_TYPE_USAGE_SUMMARY,
  type QuestionTypeUsageDateFilter,
  type QuestionTypeUsageDatePresetId,
} from '@/data/mock-question-type-usage';
import styles from './QuestionTypeUsageFilterBar.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuPopover = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuPopover })),
  { ssr: false }
);
const WuDatePicker = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDatePicker })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

const DEFAULT_MIN = QUESTION_TYPE_USAGE_SUMMARY.defaultMinCompletes;
const FILTER_REFETCH_MS = 400;

export interface QuestionTypeUsageFilterBarProps {
  surveysInScope: number;
  typesLoaded: number;
  dataCenterCode: string;
  onFiltersApplied?: (next: {
    dateFilter: QuestionTypeUsageDateFilter;
    minCompletes: number;
  }) => void;
  onLoadingChange?: (loading: boolean) => void;
}

function parseIso(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toIso(date?: Date): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function QuestionTypeUsageFilterBar({
  surveysInScope,
  typesLoaded,
  dataCenterCode,
  onFiltersApplied,
  onLoadingChange,
}: QuestionTypeUsageFilterBarProps) {
  const [dateFilter, setDateFilter] = useState(QUESTION_TYPE_USAGE_DEFAULT_DATE_FILTER);
  const [minCompletes, setMinCompletes] = useState(DEFAULT_MIN);
  const [fetchedAtLabel, setFetchedAtLabel] = useState(QUESTION_TYPE_USAGE_SUMMARY.fetchedAtLabel);
  const [loading, setLoading] = useState(false);

  const [dateOpen, setDateOpen] = useState(false);
  const [minOpen, setMinOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(QUESTION_TYPE_USAGE_DEFAULT_DATE_FILTER.startIso);
  const [draftTo, setDraftTo] = useState(QUESTION_TYPE_USAGE_DEFAULT_DATE_FILTER.endIso);
  const [draftPreset, setDraftPreset] = useState<QuestionTypeUsageDatePresetId>(
    QUESTION_TYPE_USAGE_DEFAULT_DATE_FILTER.preset ?? 'last-90'
  );
  const [draftMin, setDraftMin] = useState(String(DEFAULT_MIN));

  const dateTriggerRef = useRef<HTMLButtonElement>(null);
  const minTriggerRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const datePanelId = useId();
  const minPanelId = useId();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function setLoadingState(next: boolean): void {
    setLoading(next);
    onLoadingChange?.(next);
  }

  function simulateRefetch(
    nextDate: QuestionTypeUsageDateFilter,
    nextMin: number,
    focus: 'date' | 'min' | null
  ): void {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoadingState(true);
    timerRef.current = setTimeout(() => {
      setDateFilter(nextDate);
      setMinCompletes(nextMin);
      setFetchedAtLabel(formatFetchedAtLabel());
      setLoadingState(false);
      onFiltersApplied?.({ dateFilter: nextDate, minCompletes: nextMin });
      requestAnimationFrame(() => {
        if (focus === 'date') dateTriggerRef.current?.focus();
        if (focus === 'min') minTriggerRef.current?.focus();
      });
    }, FILTER_REFETCH_MS);
  }

  function handleDateOpenChange(open: boolean): void {
    if (loading) return;
    setDateOpen(open);
    if (open) {
      setDraftFrom(dateFilter.startIso);
      setDraftTo(dateFilter.endIso);
      setDraftPreset(dateFilter.preset ?? 'custom');
      return;
    }
    setDraftFrom(dateFilter.startIso);
    setDraftTo(dateFilter.endIso);
    setDraftPreset(dateFilter.preset ?? 'custom');
    requestAnimationFrame(() => dateTriggerRef.current?.focus());
  }

  function handleMinOpenChange(open: boolean): void {
    if (loading) return;
    setMinOpen(open);
    setDraftMin(String(minCompletes));
    if (!open) {
      requestAnimationFrame(() => minTriggerRef.current?.focus());
    }
  }

  function applyDatePreset(presetId: Exclude<QuestionTypeUsageDatePresetId, 'custom'>): void {
    const next = buildDateFilterFromPreset(presetId);
    setDraftPreset(presetId);
    setDraftFrom(next.startIso);
    setDraftTo(next.endIso);
  }

  function clearDateDraft(): void {
    setDraftFrom('');
    setDraftTo('');
    setDraftPreset('custom');
  }

  function applyDateDone(): void {
    if (!draftFrom || !draftTo || draftFrom > draftTo) return;
    const next =
      draftPreset !== 'custom'
        ? { ...buildCustomDateFilter(draftFrom, draftTo), preset: draftPreset }
        : buildCustomDateFilter(draftFrom, draftTo);
    setDateOpen(false);
    simulateRefetch(next, minCompletes, 'date');
  }

  function applyMinDone(value = draftMin): void {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 0) return;
    setMinOpen(false);
    simulateRefetch(dateFilter, parsed, 'min');
  }

  return (
    <section
      className={styles.root}
      aria-label="Data set filters"
      style={{ ['--qtu-accent' as string]: HEADER_BRAND_COLOR.base }}
    >
      <div className={styles.card}>
        <div className={styles.fields}>
          <WuPopover
            open={dateOpen}
            onOpenChange={handleDateOpenChange}
            align="start"
            side="bottom"
            Trigger={
              <button
                ref={dateTriggerRef}
                type="button"
                className={`${styles.field} ${dateOpen ? styles.fieldActive : ''}`}
                aria-haspopup="dialog"
                aria-expanded={dateOpen}
                aria-controls={datePanelId}
                disabled={loading}
              >
                <span className={styles.fieldLabel}>Surveys created</span>
                <span className={styles.fieldValueRow}>
                  <span className={styles.fieldValue}>{dateFilter.label}</span>
                  <span className={`wm-keyboard-arrow-down ${styles.fieldCaret}`} aria-hidden />
                </span>
              </button>
            }
          >
            <div
              id={datePanelId}
              className={styles.datePopover}
              role="dialog"
              aria-label="Surveys created date range"
            >
              <div className={styles.presetList} role="listbox" aria-label="Date presets">
                {QUESTION_TYPE_USAGE_DATE_PRESETS.map((preset) => {
                  const selected = draftPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={selected ? styles.presetSelected : styles.preset}
                      onClick={() => applyDatePreset(preset.id)}
                    >
                      {preset.label}
                      {selected ? <span className="wm-check" aria-hidden /> : null}
                    </button>
                  );
                })}
              </div>
              <div className={styles.dateField}>
                <span className={styles.dateFieldLabel}>From</span>
                <WuDatePicker
                  value={parseIso(draftFrom)}
                  onChange={(date) => {
                    setDraftPreset('custom');
                    setDraftFrom(toIso(date));
                  }}
                  formatString="MMM dd, yyyy"
                  placeholder="From date"
                  variant="outlined"
                  aria-label="From date"
                />
              </div>
              <div className={styles.dateField}>
                <span className={styles.dateFieldLabel}>To</span>
                <WuDatePicker
                  value={parseIso(draftTo)}
                  onChange={(date) => {
                    setDraftPreset('custom');
                    setDraftTo(toIso(date));
                  }}
                  formatString="MMM dd, yyyy"
                  placeholder="To date"
                  variant="outlined"
                  aria-label="To date"
                />
              </div>
              <div className={styles.dateFooter}>
                <WuButton variant="link" size="sm" onClick={clearDateDraft}>
                  Clear
                </WuButton>
                <WuButton
                  size="sm"
                  onClick={applyDateDone}
                  disabled={!draftFrom || !draftTo || draftFrom > draftTo}
                >
                  Done
                </WuButton>
              </div>
            </div>
          </WuPopover>

          <WuPopover
            open={minOpen}
            onOpenChange={handleMinOpenChange}
            align="start"
            side="bottom"
            Trigger={
              <button
                ref={minTriggerRef}
                type="button"
                className={`${styles.field} ${minOpen ? styles.fieldActive : ''}`}
                aria-haspopup="dialog"
                aria-expanded={minOpen}
                aria-controls={minPanelId}
                disabled={loading}
              >
                <span className={styles.fieldLabel}>Min completes</span>
                <span className={styles.fieldValueRow}>
                  <span className={styles.fieldValue}>{minCompletes}</span>
                  <span className={`wm-keyboard-arrow-down ${styles.fieldCaret}`} aria-hidden />
                </span>
              </button>
            }
          >
            <div
              id={minPanelId}
              className={styles.minPopover}
              role="dialog"
              aria-label="Min completes filter"
            >
              <div className={styles.minPresets} role="group" aria-label="Quick min completes">
                {QUESTION_TYPE_USAGE_MIN_PRESETS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      Number(draftMin) === value ? styles.minPresetOn : styles.minPreset
                    }
                    onClick={() => setDraftMin(String(value))}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <WuInput
                Label="Minimum completes"
                type="number"
                min={0}
                value={draftMin}
                onChange={(event) => setDraftMin(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    applyMinDone();
                  }
                }}
                aria-label="Minimum completes"
              />
              <div className={styles.minFooter}>
                <WuButton size="sm" onClick={() => applyMinDone()}>
                  Done
                </WuButton>
              </div>
            </div>
          </WuPopover>
        </div>

        <div className={styles.stats} aria-live="polite">
          <span>
            {formatUsageCount(surveysInScope)} surveys · {typesLoaded} types
          </span>
          <span className={styles.statsDot} aria-hidden>
            ·
          </span>
          <span>
            {dataCenterCode} · {fetchedAtLabel}
          </span>
          {loading ? <span className={styles.updating}>Updating…</span> : null}
        </div>
      </div>
    </section>
  );
}
