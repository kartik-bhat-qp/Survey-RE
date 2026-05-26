'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  QuotaStepBreadcrumb,
  type QuotaStep,
} from '@/components/surveys/QuotaStepBreadcrumb';
import { getQuestionsBySurvey } from '@/data/mock-survey-questions';
import styles from './CriteriaBasedQuotaModal.module.css';

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

const OPERATORS = ['is', 'is not', 'contains', 'does not contain'] as const;

type Operator = (typeof OPERATORS)[number];

interface CriteriaRow {
  id: string;
  questionId: number | null;
  operator: Operator;
  value: string;
}

export interface CriteriaQuotaCheck {
  questionId: number;
  questionCode: string;
  questionText: string;
}

export interface CriteriaQuotaSubmit {
  name: string;
  target: number;
  criteria: Array<{
    questionCode: string;
    questionText: string;
    operator: Operator;
    value: string;
  }>;
  firstCheck: CriteriaQuotaCheck;
  secondCheck?: CriteriaQuotaCheck;
}

interface CriteriaBasedQuotaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: number;
  onBack?: () => void;
  onSave?: (data: CriteriaQuotaSubmit) => void;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('en-US');
}

function parseFormattedNumber(raw: string): number {
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned === '') return 0;
  const parsed = parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function newCriteriaRow(): CriteriaRow {
  return {
    id: `crit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    questionId: null,
    operator: 'is',
    value: '',
  };
}

export function CriteriaBasedQuotaModal({
  open,
  onOpenChange,
  surveyId,
  onBack,
  onSave,
}: CriteriaBasedQuotaModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [name, setName] = useState('');
  const [target, setTarget] = useState(100);
  const [criteria, setCriteria] = useState<CriteriaRow[]>([]);
  const [firstCheckId, setFirstCheckId] = useState<number | null>(null);
  const [secondCheckId, setSecondCheckId] = useState<number | null>(null);

  const questions = useMemo(
    () => getQuestionsBySurvey(surveyId).filter((q) => q.parentQuestionId === undefined),
    [surveyId]
  );

  const firstCheckIndex = useMemo(
    () => (firstCheckId === null ? -1 : questions.findIndex((q) => q.id === firstCheckId)),
    [firstCheckId, questions]
  );

  const secondCheckOptions = useMemo(
    () => (firstCheckIndex < 0 ? [] : questions.slice(firstCheckIndex)),
    [firstCheckIndex, questions]
  );

  const resetState = useCallback(() => {
    setName('');
    setTarget(100);
    setCriteria([]);
    setFirstCheckId(null);
    setSecondCheckId(null);
  }, []);

  const handleFirstCheckChange = useCallback(
    (nextId: number) => {
      setFirstCheckId(nextId);
      const newIndex = questions.findIndex((q) => q.id === nextId);
      if (secondCheckId !== null) {
        const currentIdx = questions.findIndex((q) => q.id === secondCheckId);
        if (currentIdx < newIndex) {
          setSecondCheckId(null);
        }
      }
    },
    [questions, secondCheckId]
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetState();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetState]
  );

  function handleBack(): void {
    if (onBack) {
      resetState();
      onBack();
      return;
    }
    handleOpenChange(false);
  }

  function handleBreadcrumbClick(step: QuotaStep): void {
    if (step === 'quota-type') {
      handleBack();
    }
  }

  function handleAddCriteria(): void {
    setCriteria((prev) => [...prev, newCriteriaRow()]);
  }

  function handleRemoveCriteria(id: string): void {
    setCriteria((prev) => prev.filter((row) => row.id !== id));
  }

  function handleUpdateCriteria(id: string, patch: Partial<CriteriaRow>): void {
    setCriteria((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  const trimmedName = name.trim();
  const validCriteria = useMemo(
    () =>
      criteria
        .filter((row) => row.questionId !== null && row.value.trim() !== '')
        .map((row) => {
          const question = questions.find((q) => q.id === row.questionId);
          return {
            questionCode: question?.code ?? '',
            questionText: question?.text ?? '',
            operator: row.operator,
            value: row.value.trim(),
          };
        }),
    [criteria, questions]
  );

  const firstCheckQuestion =
    firstCheckId === null ? null : questions.find((q) => q.id === firstCheckId) ?? null;
  const secondCheckQuestion =
    secondCheckId === null ? null : questions.find((q) => q.id === secondCheckId) ?? null;

  const canSave =
    trimmedName.length > 0 && target > 0 && firstCheckQuestion !== null;

  function handleSave(): void {
    if (!canSave || !firstCheckQuestion) return;
    onSave?.({
      name: trimmedName,
      target,
      criteria: validCriteria,
      firstCheck: {
        questionId: firstCheckQuestion.id,
        questionCode: firstCheckQuestion.code,
        questionText: firstCheckQuestion.text,
      },
      secondCheck: secondCheckQuestion
        ? {
            questionId: secondCheckQuestion.id,
            questionCode: secondCheckQuestion.code,
            questionText: secondCheckQuestion.text,
          }
        : undefined,
    });
    showToast({
      message: `Criteria based quota "${trimmedName}" created`,
      variant: 'success',
    });
    resetState();
    onOpenChange(false);
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalContent, WuModalHeader, WuModalFooter, WuButton } = wick;

  return (
    <WuModal
      open
      onOpenChange={handleOpenChange}
      className={styles.modal}
      variant="action"
    >
      <WuModalHeader className={styles.header}>Criteria Based Quota</WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.body}>
          <p className={styles.instructions}>
            Define a criteria comprising one or more conditions and set a sample target.
          </p>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="quota-name">
              Quota name
            </label>
            <WuInput
              id="quota-name"
              variant="outlined"
              placeholder="e.g. Female non-drinkers"
              value={name}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setName(event.target.value)
              }
              className={styles.fieldInput}
            />
          </div>

          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Response status</label>
              <WuMenu
                Trigger={
                  <button type="button" className={styles.menuTrigger}>
                    <span className={styles.menuTriggerLabel}>{responseStatus}</span>
                    <span
                      className={`wm-keyboard-arrow-down ${styles.menuCaret}`}
                      aria-hidden
                    />
                  </button>
                }
                align="start"
              >
                {RESPONSE_STATUS_OPTIONS.map((option) => (
                  <WuMenuItem key={option} onSelect={() => setResponseStatus(option)}>
                    {option}
                  </WuMenuItem>
                ))}
              </WuMenu>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Filter by date</label>
              <div className={styles.dateRange}>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  aria-label="Start date"
                />
                <span className={styles.dateSeparator} aria-hidden>
                  —
                </span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(event) => setDateTo(event.target.value)}
                  aria-label="End date"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="quota-target">
                Target (count)
              </label>
              <input
                id="quota-target"
                type="text"
                inputMode="numeric"
                className={styles.numberInput}
                value={formatNumber(target)}
                onChange={(event) => setTarget(parseFormattedNumber(event.target.value))}
                aria-label="Target count"
              />
            </div>
          </div>

          <div className={styles.criteriaSection}>
            <div className={styles.criteriaHeader}>
              <span className={styles.criteriaTitle}>Criteria</span>
              <button
                type="button"
                className={styles.addCriteriaBtn}
                onClick={handleAddCriteria}
              >
                <span className="wm-add-circle-outline" aria-hidden />
                <span>Add criteria</span>
              </button>
            </div>

            {criteria.length === 0 ? (
              <div className={styles.criteriaEmpty}>
                No criteria added yet. Click <strong>Add criteria</strong> to define a
                condition.
              </div>
            ) : (
              <div className={styles.criteriaList}>
                {criteria.map((row, index) => {
                  const selectedQuestion = questions.find((q) => q.id === row.questionId);
                  const questionLabel = selectedQuestion
                    ? `${selectedQuestion.code} – ${selectedQuestion.text}`
                    : 'Select question';
                  return (
                    <div key={row.id} className={styles.criteriaRow}>
                      <span className={styles.criteriaIndex}>{index + 1}.</span>
                      <WuMenu
                        Trigger={
                          <button
                            type="button"
                            className={`${styles.menuTrigger} ${styles.criteriaQuestion}`}
                          >
                            <span className={styles.menuTriggerLabel}>{questionLabel}</span>
                            <span
                              className={`wm-keyboard-arrow-down ${styles.menuCaret}`}
                              aria-hidden
                            />
                          </button>
                        }
                        align="start"
                      >
                        {questions.map((question) => (
                          <WuMenuItem
                            key={question.id}
                            onSelect={() =>
                              handleUpdateCriteria(row.id, { questionId: question.id })
                            }
                          >
                            {question.code} – {question.text}
                          </WuMenuItem>
                        ))}
                      </WuMenu>
                      <WuMenu
                        Trigger={
                          <button
                            type="button"
                            className={`${styles.menuTrigger} ${styles.criteriaOperator}`}
                          >
                            <span className={styles.menuTriggerLabel}>{row.operator}</span>
                            <span
                              className={`wm-keyboard-arrow-down ${styles.menuCaret}`}
                              aria-hidden
                            />
                          </button>
                        }
                        align="start"
                      >
                        {OPERATORS.map((op) => (
                          <WuMenuItem
                            key={op}
                            onSelect={() => handleUpdateCriteria(row.id, { operator: op })}
                          >
                            {op}
                          </WuMenuItem>
                        ))}
                      </WuMenu>
                      <WuInput
                        variant="outlined"
                        placeholder="Value"
                        value={row.value}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          handleUpdateCriteria(row.id, { value: event.target.value })
                        }
                        className={styles.criteriaValue}
                      />
                      <button
                        type="button"
                        className={styles.criteriaRemove}
                        onClick={() => handleRemoveCriteria(row.id)}
                        aria-label={`Remove criterion ${index + 1}`}
                      >
                        <span className="wm-delete" aria-hidden />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className={styles.footerActions}>
          <QuotaStepBreadcrumb
            steps={['quota-type', 'criteria']}
            currentStep="criteria"
            onStepClick={handleBreadcrumbClick}
          />
          <div className={styles.footerButtons}>
            <WuButton variant="secondary" onClick={handleBack}>
              Back
            </WuButton>
            <WuButton onClick={handleSave} disabled={!canSave}>
              Save
            </WuButton>
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
