'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { SurveyQuestion } from '@/data/mock-survey-questions';
import { getQuestionsBySurvey } from '@/data/mock-survey-questions';
import { AdvanceQuotaOverLimitSelect } from '@/components/surveys/AdvanceQuotaOverLimitSelect';
import { NO_BRANCHING_OPTION } from '@/data/mock-question-logic';
import styles from './QuotaDimensionStep.module.css';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

export type QuotaScopeType = 'max-count' | 'min-count' | 'min-pct';

const SCOPE_OPTIONS: { id: QuotaScopeType; label: string }[] = [
  { id: 'max-count', label: 'Maximum count' },
  { id: 'min-count', label: 'Minimum quota (count)' },
  { id: 'min-pct', label: 'Minimum quota (Percentage)' },
];

function scopeLabel(scope: QuotaScopeType): string {
  return SCOPE_OPTIONS.find((s) => s.id === scope)?.label ?? '';
}

function isPercentScope(scope: QuotaScopeType): boolean {
  return scope === 'min-pct';
}

function formatNumber(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function parseFormattedNumber(raw: string, decimals: number): number {
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return 0;
  const parsed = decimals > 0 ? parseFloat(cleaned) : parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toEditableString(value: number, decimals: number): string {
  if (!Number.isFinite(value) || value === 0) return '';
  if (decimals === 0) return formatNumber(value, 0);
  return String(value);
}

function isValidNumberDraft(raw: string, decimals: number): boolean {
  if (raw === '') return true;
  if (decimals === 0) return /^\d*$/.test(raw);
  return /^\d*\.?\d*$/.test(raw);
}

interface FormattedNumberInputProps {
  value: number;
  onChange: (next: number) => void;
  decimals?: number;
  className?: string;
  ariaLabel?: string;
}

function FormattedNumberInput({
  value,
  onChange,
  decimals = 0,
  className,
  ariaLabel,
}: FormattedNumberInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!isFocused) {
      setDraft('');
      return;
    }
    if (draft.endsWith('.') || draft === '') return;
    const parsedDraft = parseFormattedNumber(draft, decimals);
    if (Math.abs(parsedDraft - value) > 0.001) {
      setDraft(toEditableString(value, decimals));
    }
  }, [value, isFocused, draft, decimals]);

  const displayValue = isFocused ? draft : formatNumber(value, decimals);

  return (
    <input
      type="text"
      inputMode={decimals > 0 ? 'decimal' : 'numeric'}
      value={displayValue}
      onFocus={() => {
        setIsFocused(true);
        setDraft(toEditableString(value, decimals));
      }}
      onChange={(event) => {
        const raw = event.target.value.replace(/,/g, '');
        if (!isValidNumberDraft(raw, decimals)) return;
        setDraft(raw);
        onChange(parseFormattedNumber(raw, decimals));
      }}
      onBlur={() => {
        const parsed = parseFormattedNumber(draft, decimals);
        onChange(parsed);
        setIsFocused(false);
        setDraft('');
      }}
      className={className}
      aria-label={ariaLabel}
    />
  );
}

export interface QuotaDimensionEntry {
  scope: QuotaScopeType;
  /** Option label → numeric value (percentage 0-100 or absolute count). */
  values: Record<string, number>;
  /** Per-option action when quota is met / over limit. */
  overLimitActions: Record<string, string>;
  /** Sample-size target for the `min-count` scope. */
  target?: number;
}

export interface QuotaDimensionState {
  [questionId: number]: QuotaDimensionEntry;
}

interface QuotaDimensionStepProps {
  surveyId: number;
  questions: SurveyQuestion[];
  distribution: QuotaDimensionState;
  onDistributionChange: (next: QuotaDimensionState) => void;
  onRemoveQuestion: (questionId: number) => void;
}

function evenDistribute(count: number): number[] {
  if (count === 0) return [];
  const base = Math.floor(10000 / count) / 100;
  const head = +(100 - base * (count - 1)).toFixed(2);
  return Array.from({ length: count }, (_, i) => (i === 0 ? head : base));
}

function evenCountDistribute(count: number, total: number): number[] {
  if (count === 0) return [];
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, i) => (i < remainder ? base + 1 : base));
}

function buildValuesForScope(options: string[], scope: QuotaScopeType): Record<string, number> {
  const map: Record<string, number> = {};
  if (options.length === 0) return map;
  if (isPercentScope(scope)) {
    const distributed = evenDistribute(options.length);
    options.forEach((opt, i) => {
      map[opt] = distributed[i];
    });
  } else {
    const distributed = evenCountDistribute(options.length, 100);
    options.forEach((opt, i) => {
      map[opt] = distributed[i];
    });
  }
  return map;
}

function clampPercentValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return +Math.min(100, Math.max(0, value)).toFixed(2);
}

export function isQuotaDistributionValid(
  questions: SurveyQuestion[],
  distribution: QuotaDimensionState
): boolean {
  for (const question of questions) {
    const entry = distribution[question.id];
    if (!entry) return false;
    const options = resolveOptionsFor(question);
    if (options.length === 0) continue;

    if (entry.scope === 'min-pct') {
      let total = 0;
      for (const opt of options) {
        const v = entry.values[opt] ?? 0;
        total += v;
      }
      if (total > 100 + 0.01) return false;
    }

    if (entry.scope === 'min-count') {
      const target = Number.isFinite(entry.target) ? (entry.target as number) : 0;
      const total = options.reduce(
        (acc, opt) => acc + (Number.isFinite(entry.values[opt]) ? entry.values[opt] : 0),
        0
      );
      if (total > target) return false;
    }
  }
  return true;
}

function buildOverLimitActions(
  options: string[],
  previous?: Record<string, string>
): Record<string, string> {
  const actions: Record<string, string> = {};
  for (const option of options) {
    actions[option] = previous?.[option] ?? 'quota-overlimit';
  }
  return actions;
}

function buildEntryForScope(
  options: string[],
  scope: QuotaScopeType,
  previousActions?: Record<string, string>
): QuotaDimensionEntry {
  const values = buildValuesForScope(options, scope);
  const overLimitActions = buildOverLimitActions(options, previousActions);
  if (scope === 'min-count') {
    const sum = Object.values(values).reduce((a, b) => a + b, 0);
    return { scope, values, overLimitActions, target: Math.max(sum * 2, 100) };
  }
  if (scope === 'min-pct') {
    return { scope, values, overLimitActions, target: 100 };
  }
  return { scope, values, overLimitActions };
}

export function buildInitialDistribution(questions: SurveyQuestion[]): QuotaDimensionState {
  const state: QuotaDimensionState = {};
  for (const question of questions) {
    const options = resolveOptionsFor(question);
    if (options.length === 0) continue;
    state[question.id] = buildEntryForScope(options, 'max-count');
  }
  return state;
}

/** Rebuilds dimension editor state from a saved question-based quota. */
export function buildDistributionFromQuota(
  quota: {
    questionCode?: string;
    questionQuotaScope?: QuotaScopeType;
    questionQuotaTotalTarget?: number;
    target: number;
    options?: { label: string; target: number; overLimitAction?: string }[];
  },
  questions: SurveyQuestion[]
): QuotaDimensionState | null {
  if (!quota.questionCode || !quota.options?.length) return null;
  const question = questions.find((q) => q.code === quota.questionCode);
  if (!question) return null;

  const scope = quota.questionQuotaScope ?? 'max-count';
  const values: Record<string, number> = {};
  const overLimitActions: Record<string, string> = {};
  const sampleTarget = quota.questionQuotaTotalTarget ?? quota.target;

  for (const option of quota.options) {
    if (scope === 'min-pct') {
      values[option.label] =
        sampleTarget > 0 ? (option.target / sampleTarget) * 100 : 0;
    } else {
      values[option.label] = option.target;
    }
    overLimitActions[option.label] = option.overLimitAction ?? 'quota-overlimit';
  }

  const entry: QuotaDimensionEntry = {
    scope,
    values,
    overLimitActions,
  };
  if (scope === 'min-count' || scope === 'min-pct') {
    entry.target = sampleTarget;
  }

  return { [question.id]: entry };
}

function resolveOptionsFor(question: SurveyQuestion): string[] {
  if (question.options && question.options.length > 0) return question.options;
  if (question.parentQuestionId !== undefined) {
    const siblings = getQuestionsBySurvey(question.surveyId);
    const parent = siblings.find((q) => q.id === question.parentQuestionId);
    return parent?.options ?? [];
  }
  return [];
}

function questionTitle(question: SurveyQuestion): string {
  if (question.parentQuestionId !== undefined) {
    return `${question.code} - ${question.text}`;
  }
  return `${question.code} - ${question.text}`;
}

interface QuestionCardProps {
  question: SurveyQuestion;
  surveyId: number;
  entry: QuotaDimensionEntry;
  onValueChange: (option: string, value: number) => void;
  onOverLimitActionChange: (option: string, action: string) => void;
  onScopeChange: (scope: QuotaScopeType) => void;
  onTargetChange: (target: number) => void;
  onRemove: () => void;
  removable: boolean;
}

function QuestionCard({
  question,
  surveyId,
  entry,
  onValueChange,
  onOverLimitActionChange,
  onScopeChange,
  onTargetChange,
  onRemove,
  removable,
}: QuestionCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const options = useMemo(() => resolveOptionsFor(question), [question]);
  const isPercent = isPercentScope(entry.scope);
  const isMinCount = entry.scope === 'min-count';
  const total = useMemo(() => {
    const sum = options.reduce(
      (acc, opt) => acc + (Number.isFinite(entry.values[opt]) ? entry.values[opt] : 0),
      0
    );
    return isPercent ? +sum.toFixed(2) : Math.round(sum);
  }, [options, entry.values, isPercent]);
  const targetValue = Number.isFinite(entry.target) ? (entry.target as number) : 0;
  const minCountInvalid = isMinCount && total > targetValue;
  const minPctTotalInvalid = isPercent && total > 100 + 0.01;
  const minPctInvalid = minPctTotalInvalid;
  const totalIsValid = isPercent
    ? !minPctInvalid
    : isMinCount
      ? !minCountInvalid
      : true;

  const scopeDropdown = (
    <WuMenu
      Trigger={
        <button type="button" className={styles.scopeTrigger}>
          <span className={styles.scopeTriggerLabel}>{scopeLabel(entry.scope)}</span>
          <span className={`wm-keyboard-arrow-up ${styles.scopeTriggerCaret}`} aria-hidden />
        </button>
      }
      align="end"
    >
      {SCOPE_OPTIONS.map((option) => (
        <WuMenuItem key={option.id} onSelect={() => onScopeChange(option.id)}>
          {option.label}
        </WuMenuItem>
      ))}
    </WuMenu>
  );

  if (options.length === 0) {
    return (
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{questionTitle(question)}</h3>
          <div className={styles.cardActions}>
            {scopeDropdown}
            {removable ? (
              <button
                type="button"
                className={styles.iconBtn}
                onClick={onRemove}
                aria-label={`Remove ${question.code}`}
              >
                <span className="wm-delete" aria-hidden />
              </button>
            ) : null}
          </div>
        </header>
        <div className={styles.emptyOptions}>
          No options available for this question type.
        </div>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{questionTitle(question)}</h3>
        <div className={styles.cardActions}>
          {scopeDropdown}
          {removable ? (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onRemove}
              aria-label={`Remove ${question.code}`}
            >
              <span className="wm-delete" aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setCollapsed((prev) => !prev)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            <span
              className={`wm-keyboard-arrow-up ${styles.chevron} ${collapsed ? styles.chevronCollapsed : ''}`}
              aria-hidden
            />
          </button>
        </div>
      </header>
      {collapsed ? null : (
        <div className={styles.cardBody}>
          {isMinCount ? (
            <div
              className={`${styles.totalRow} ${styles.totalRowAtTop} ${
                totalIsValid ? '' : styles.totalInvalid
              }`}
            >
              <span className={styles.totalLabel}>Target (count)</span>
              <FormattedNumberInput
                value={targetValue}
                onChange={onTargetChange}
                decimals={0}
                className={`${styles.percentInput} ${
                  minCountInvalid ? styles.percentInputInvalid : ''
                }`}
                ariaLabel="Target count"
              />
              <span className={styles.totalRowSpacer} aria-hidden />
            </div>
          ) : isPercent ? (
            <div className={`${styles.totalRow} ${styles.totalRowAtTop}`}>
              <span className={styles.totalLabel}>Target (count)</span>
              <FormattedNumberInput
                value={targetValue}
                onChange={onTargetChange}
                decimals={0}
                className={styles.percentInput}
                ariaLabel="Target count"
              />
              <span className={styles.totalRowSpacer} aria-hidden />
            </div>
          ) : null}
          <div className={styles.optionHeaderRow}>
            <span className={styles.optionHeaderLabel} />
            <span className={styles.optionHeaderCount}>Quota</span>
            <span className={styles.optionHeaderAction}>If over limit: jump to</span>
          </div>
          {options.map((option) => {
            const value = entry.values[option] ?? 0;
            const actionValue = entry.overLimitActions[option] ?? NO_BRANCHING_OPTION.value;
            return (
              <div key={option} className={styles.optionRow}>
                <span className={styles.optionLabel}>{option}</span>
                <FormattedNumberInput
                  value={Number.isFinite(value) ? value : 0}
                  onChange={(next) => onValueChange(option, next)}
                  decimals={isPercent ? 2 : 0}
                  className={styles.percentInput}
                  ariaLabel={`${option} ${isPercent ? 'percentage' : 'count'}`}
                />
                <div className={styles.actionSelect}>
                  <AdvanceQuotaOverLimitSelect
                    surveyId={surveyId}
                    currentQuestionId={question.id}
                    value={actionValue}
                    onChange={(next) => onOverLimitActionChange(option, next)}
                  />
                </div>
              </div>
            );
          })}
          {isMinCount ? (
            <div className={styles.helperRow}>
              <div className={styles.helperSummary}>
                <span className={styles.helperLabel}>Sum of minimums:</span>
                <span
                  className={`${styles.helperValue} ${
                    minCountInvalid ? styles.helperTextInvalid : ''
                  }`}
                >
                  {formatNumber(total)}
                  {minCountInvalid
                    ? ` (exceeds by ${formatNumber(total - targetValue)})`
                    : ''}
                </span>
              </div>
              <span className={styles.helperRowSpacer} aria-hidden />
            </div>
          ) : isPercent ? (
            <div className={styles.helperRow}>
              <div className={styles.helperSummary}>
                <span className={styles.helperLabel}>Sum of minimums:</span>
                <span
                  className={`${styles.helperValue} ${
                    minPctTotalInvalid ? styles.helperTextInvalid : ''
                  }`}
                >
                  {formatNumber(total, 2)}%
                  {minPctTotalInvalid
                    ? ` (exceeds by ${formatNumber(total - 100, 2)}%)`
                    : ''}
                </span>
              </div>
              <span className={styles.helperRowSpacer} aria-hidden />
            </div>
          ) : (
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalValue}>{formatNumber(total)}</span>
              <span className={styles.totalRowSpacer} aria-hidden />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function QuotaDimensionStep({
  surveyId,
  questions,
  distribution,
  onDistributionChange,
  onRemoveQuestion,
}: QuotaDimensionStepProps) {
  const [search, setSearch] = useState('');

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return questions;
    return questions.filter((q) => {
      return (
        q.code.toLowerCase().includes(term) ||
        q.text.toLowerCase().includes(term) ||
        q.type.toLowerCase().includes(term)
      );
    });
  }, [questions, search]);

  function entryFor(question: SurveyQuestion): QuotaDimensionEntry {
    const existing = distribution[question.id];
    if (existing) return existing;
    const options = resolveOptionsFor(question);
    return buildEntryForScope(options, 'max-count');
  }

  function handleValueChange(questionId: number, option: string, value: number): void {
    const existing = distribution[questionId];
    if (!existing) return;
    let nextValue = value;
    if (existing.scope === 'min-pct') {
      nextValue = clampPercentValue(value);
    } else {
      nextValue = Math.max(0, Math.round(value));
    }
    const nextActions = { ...existing.overLimitActions };
    if (nextValue > 0 && nextActions[option] === NO_BRANCHING_OPTION.value) {
      nextActions[option] = 'quota-overlimit';
    }
    const next: QuotaDimensionState = {
      ...distribution,
      [questionId]: {
        ...existing,
        values: { ...existing.values, [option]: nextValue },
        overLimitActions: nextActions,
      },
    };
    onDistributionChange(next);
  }

  function handleOverLimitActionChange(
    questionId: number,
    option: string,
    action: string
  ): void {
    const existing = distribution[questionId];
    if (!existing) return;
    onDistributionChange({
      ...distribution,
      [questionId]: {
        ...existing,
        overLimitActions: { ...existing.overLimitActions, [option]: action },
      },
    });
  }

  function handleScopeChange(
    question: SurveyQuestion,
    scope: QuotaScopeType
  ): void {
    const options = resolveOptionsFor(question);
    const existing = distribution[question.id];
    const next: QuotaDimensionState = {
      ...distribution,
      [question.id]: buildEntryForScope(options, scope, existing?.overLimitActions),
    };
    onDistributionChange(next);
  }

  function handleTargetChange(questionId: number, target: number): void {
    const existing = distribution[questionId];
    if (!existing) return;
    const next: QuotaDimensionState = {
      ...distribution,
      [questionId]: { ...existing, target },
    };
    onDistributionChange(next);
  }

  return (
    <div className={styles.root}>
      <div className={styles.searchSection}>
        <WuInput
          variant="outlined"
          placeholder="Search question"
          Icon={<span className="wm-search" />}
          iconPosition="left"
          value={search}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(event.target.value)
          }
          className={styles.searchInput}
        />
      </div>

      <div className={styles.dimensionHeader}>Quota distribution</div>

      <div className={styles.cardsList}>
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              surveyId={surveyId}
              entry={entryFor(question)}
              onValueChange={(option, value) => handleValueChange(question.id, option, value)}
              onOverLimitActionChange={(option, action) =>
                handleOverLimitActionChange(question.id, option, action)
              }
              onScopeChange={(scope) => handleScopeChange(question, scope)}
              onTargetChange={(target) => handleTargetChange(question.id, target)}
              onRemove={() => onRemoveQuestion(question.id)}
              removable={questions.length > 1}
            />
          ))
        ) : (
          <div className={styles.emptySearch}>
            No questions match &ldquo;{search}&rdquo;.
          </div>
        )}
      </div>
    </div>
  );
}
