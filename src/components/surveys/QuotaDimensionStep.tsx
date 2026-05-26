'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { SurveyQuestion } from '@/data/mock-survey-questions';
import { getQuestionsBySurvey } from '@/data/mock-survey-questions';
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
  if (cleaned === '' || cleaned === '-') return 0;
  const parsed = decimals > 0 ? parseFloat(cleaned) : parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : 0;
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
  return (
    <input
      type="text"
      inputMode={decimals > 0 ? 'decimal' : 'numeric'}
      value={formatNumber(value, decimals)}
      onChange={(event) => onChange(parseFormattedNumber(event.target.value, decimals))}
      className={className}
      aria-label={ariaLabel}
    />
  );
}

export interface QuotaDimensionEntry {
  scope: QuotaScopeType;
  /** Option label → numeric value (percentage 0-100 or absolute count). */
  values: Record<string, number>;
  /** Sample-size target for the `min-count` scope. */
  target?: number;
}

export interface QuotaDimensionState {
  [questionId: number]: QuotaDimensionEntry;
}

interface QuotaDimensionStepProps {
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

function buildEntryForScope(options: string[], scope: QuotaScopeType): QuotaDimensionEntry {
  const values = buildValuesForScope(options, scope);
  if (scope === 'min-count') {
    const sum = Object.values(values).reduce((a, b) => a + b, 0);
    return { scope, values, target: Math.max(sum * 2, 100) };
  }
  if (scope === 'min-pct') {
    return { scope, values, target: 100 };
  }
  return { scope, values };
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
  entry: QuotaDimensionEntry;
  onValueChange: (option: string, value: number) => void;
  onScopeChange: (scope: QuotaScopeType) => void;
  onTargetChange: (target: number) => void;
  onRemove: () => void;
  removable: boolean;
}

function QuestionCard({
  question,
  entry,
  onValueChange,
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
  const minPctInvalid = isPercent && total > 100 + 0.01;
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
          {options.map((option) => {
            const value = entry.values[option] ?? 0;
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
              </div>
            );
          })}
          {isMinCount ? (
            <>
              <div
                className={`${styles.totalRow} ${totalIsValid ? '' : styles.totalInvalid}`}
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
              </div>
              <div className={styles.helperRow}>
                <span
                  className={`${styles.helperText} ${
                    minCountInvalid ? styles.helperTextInvalid : ''
                  }`}
                >
                  Sum of minimums: {formatNumber(total)}
                  {minCountInvalid
                    ? ` — exceeds target by ${formatNumber(total - targetValue)}`
                    : ''}
                </span>
              </div>
            </>
          ) : isPercent ? (
            <>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Target (count)</span>
                <FormattedNumberInput
                  value={targetValue}
                  onChange={onTargetChange}
                  decimals={0}
                  className={styles.percentInput}
                  ariaLabel="Target count"
                />
              </div>
              <div className={styles.helperRow}>
                <span
                  className={`${styles.helperText} ${
                    minPctInvalid ? styles.helperTextInvalid : ''
                  }`}
                >
                  Sum of minimums: {formatNumber(total, 2)}%
                  {minPctInvalid
                    ? ` — exceeds 100% by ${formatNumber(total - 100, 2)}%`
                    : ''}
                </span>
              </div>
            </>
          ) : (
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Target (count)</span>
              <span className={styles.totalValue}>{formatNumber(total)}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function QuotaDimensionStep({
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
    const next: QuotaDimensionState = {
      ...distribution,
      [questionId]: {
        ...existing,
        values: { ...existing.values, [option]: value },
      },
    };
    onDistributionChange(next);
  }

  function handleScopeChange(
    question: SurveyQuestion,
    scope: QuotaScopeType
  ): void {
    const options = resolveOptionsFor(question);
    const next: QuotaDimensionState = {
      ...distribution,
      [question.id]: buildEntryForScope(options, scope),
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
              entry={entryFor(question)}
              onValueChange={(option, value) => handleValueChange(question.id, option, value)}
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
