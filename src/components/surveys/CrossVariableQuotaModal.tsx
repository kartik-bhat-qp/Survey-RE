'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { StandardLoader } from '@/components/ui/StandardLoader';
import {
  flattenQuestionsForPicker,
  getQuestionsBySurvey,
  questionHasExpandableRows,
  type SurveyQuestion,
} from '@/data/mock-survey-questions';
import type { QuestionQuotaScope } from '@/data/mock-advance-quotas';
import {
  buildCombinationRows,
  buildCrossVariableColumns,
  buildCrossVariableQuotas,
  type CrossVariableQuotaSaveResult,
  buildInitialCrossVariableMatrix,
  buildPrimaryDimensions,
  CROSS_VARIABLE_MATRIX_INSTRUCTIONS,
  CROSS_VARIABLE_PRIMARY_VARIABLES_INSTRUCTIONS,
  CROSS_VARIABLE_QUOTA_TYPE_INSTRUCTIONS,
  CROSS_VARIABLE_SECONDARY_VARIABLES_INSTRUCTIONS,
  formatCrossVariableQuotaScope,
  getSelectedQuestionsByIds,
  type CrossVariableMatrixState,
} from '@/data/mock-cross-variable-quota';
import { CrossVariableQuotaMatrixStep } from '@/components/surveys/CrossVariableQuotaMatrixStep';
import { CrossVariableQuotaTypeStep } from '@/components/surveys/CrossVariableQuotaTypeStep';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  CROSS_VARIABLE_QUOTA_STEPS,
  QuotaStepBreadcrumb,
  type QuotaStep,
} from '@/components/surveys/QuotaStepBreadcrumb';
import styles from './CrossVariableQuotaModal.module.css';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false, loading: () => <StandardLoader className="min-h-[320px]" /> }
);

type ModalStep = 'quota-type' | 'primary-variables' | 'secondary-variables' | 'dimension';

interface CrossVariableQuotaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: number;
  onBack?: () => void;
  onSave?: (result: CrossVariableQuotaSaveResult) => void;
}

export function CrossVariableQuotaModal({
  open,
  onOpenChange,
  surveyId,
  onBack,
  onSave,
}: CrossVariableQuotaModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [step, setStep] = useState<ModalStep>('quota-type');
  const [quotaScope, setQuotaScope] = useState<QuestionQuotaScope>('max-count');
  const [search, setSearch] = useState('');
  const [expandedParentIds, setExpandedParentIds] = useState<Set<number>>(() => new Set());
  const [primarySelectedIds, setPrimarySelectedIds] = useState<Set<number>>(() => new Set());
  const [secondarySelectedIds, setSecondarySelectedIds] = useState<Set<number>>(() => new Set());
  const [matrix, setMatrix] = useState<CrossVariableMatrixState>({ cells: {} });

  const questions = useMemo(() => getQuestionsBySurvey(surveyId), [surveyId]);

  const displayQuestions = useMemo(
    () => flattenQuestionsForPicker(questions, expandedParentIds),
    [questions, expandedParentIds]
  );

  const primaryQuestions = useMemo(
    () => getSelectedQuestionsByIds(questions, primarySelectedIds),
    [questions, primarySelectedIds]
  );

  const secondaryQuestions = useMemo(
    () => getSelectedQuestionsByIds(questions, secondarySelectedIds),
    [questions, secondarySelectedIds]
  );

  const primaryDimensions = useMemo(
    () => buildPrimaryDimensions(primaryQuestions),
    [primaryQuestions]
  );

  const combinationRows = useMemo(
    () => buildCombinationRows(primaryDimensions),
    [primaryDimensions]
  );

  const matrixColumns = useMemo(
    () => buildCrossVariableColumns(secondaryQuestions),
    [secondaryQuestions]
  );

  const selectableTotal = useMemo(
    () =>
      questions.reduce(
        (total, question) =>
          total + (questionHasExpandableRows(question) ? (question.matrixRows?.length ?? 0) : 1),
        0
      ),
    [questions]
  );

  const activeSelectedIds =
    step === 'primary-variables' ? primarySelectedIds : secondarySelectedIds;
  const setActiveSelectedIds =
    step === 'primary-variables' ? setPrimarySelectedIds : setSecondarySelectedIds;

  const excludedIds =
    step === 'secondary-variables' ? primarySelectedIds : new Set<number>();

  const selectedVariables = useMemo(
    () => displayQuestions.filter((q) => activeSelectedIds.has(q.id)),
    [displayQuestions, activeSelectedIds]
  );

  const toggleExpand = useCallback((parentId: number) => {
    setExpandedParentIds((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  }, []);

  const toggleSelect = useCallback(
    (questionId: number) => {
      if (excludedIds.has(questionId)) return;
      setActiveSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(questionId)) {
          next.delete(questionId);
        } else {
          next.add(questionId);
        }
        return next;
      });
    },
    [excludedIds, setActiveSelectedIds]
  );

  const columns: IWuTableColumnDef<SurveyQuestion>[] = useMemo(
    () => [
      {
        accessorKey: 'select',
        header: '',
        size: 56,
        enableSorting: false,
        cell: ({ row }) => {
          const question = row.original;
          const isExpandable = questionHasExpandableRows(question);
          const isExpanded = expandedParentIds.has(question.id);
          const isSubRow = question.parentQuestionId !== undefined;
          const isExcluded = excludedIds.has(question.id);

          if (isExpandable) {
            return (
              <button
                type="button"
                className={styles.expandButton}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Collapse matrix rows' : 'Expand matrix rows'}
                onClick={() => toggleExpand(question.id)}
              >
                <span
                  className={`wm-keyboard-arrow-down ${styles.expandIcon} ${
                    isExpanded ? styles.expandIconExpanded : ''
                  }`}
                  aria-hidden
                />
              </button>
            );
          }

          const isSelected = activeSelectedIds.has(question.id);
          return (
            <input
              type="checkbox"
              className={`${styles.checkbox} ${isSubRow ? styles.checkboxSub : ''}`}
              checked={isSelected}
              disabled={isExcluded}
              onChange={() => toggleSelect(question.id)}
              aria-label={`Select ${question.code}`}
            />
          );
        },
      },
      {
        accessorKey: 'code',
        header: 'Code',
        enableSorting: true,
        size: 100,
        cell: ({ row }) =>
          row.original.parentQuestionId !== undefined ? null : row.original.code,
      },
      {
        accessorKey: 'text',
        header: 'Variables',
        filterable: true,
        enableSorting: true,
        cell: ({ row }) => {
          const question = row.original;
          const isSubRow = question.parentQuestionId !== undefined;
          return (
            <span
              className={`${styles.questionText} ${isSubRow ? styles.questionTextSub : ''}`}
              title={question.text}
            >
              {question.text}
            </span>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        enableSorting: true,
        size: 170,
        cell: ({ row }) =>
          row.original.parentQuestionId !== undefined ? null : row.original.type,
      },
    ],
    [activeSelectedIds, excludedIds, expandedParentIds, toggleExpand, toggleSelect]
  );

  function resetState(): void {
    setStep('quota-type');
    setQuotaScope('max-count');
    setSearch('');
    setExpandedParentIds(new Set());
    setPrimarySelectedIds(new Set());
    setSecondarySelectedIds(new Set());
    setMatrix({ cells: {} });
  }

  function handleOpenChange(nextOpen: boolean): void {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  }

  function initializeMatrix(): void {
    setMatrix(buildInitialCrossVariableMatrix(combinationRows, matrixColumns));
  }

  function handleNext(): void {
    if (step === 'quota-type') {
      setSearch('');
      setStep('primary-variables');
      return;
    }
    if (step === 'primary-variables') {
      if (primarySelectedIds.size === 0 || primaryDimensions.length === 0) return;
      setSearch('');
      setStep('secondary-variables');
      return;
    }
    if (step === 'secondary-variables') {
      if (secondarySelectedIds.size === 0 || matrixColumns.length === 0) return;
      initializeMatrix();
      setStep('dimension');
      return;
    }
    if (combinationRows.length === 0 || matrixColumns.length === 0) return;
    const primaryVariableLabels = primaryDimensions.map((dimension) => dimension.questionText);
    const secondaryVariableLabels = Array.from(
      new Set(matrixColumns.map((column) => column.questionText))
    );
    const result = buildCrossVariableQuotas(
      combinationRows,
      matrixColumns,
      matrix,
      'NA',
      {
        quotaScope,
        primaryVariableLabels,
        secondaryVariableLabels,
      }
    );
    onSave?.(result);
    showToast({
      message: `Created ${result.quotas.length} cross variable ${result.quotas.length === 1 ? 'quota' : 'quotas'}`,
      variant: 'success',
    });
    resetState();
    onOpenChange(false);
  }

  function handleBack(): void {
    if (step === 'dimension') {
      setStep('secondary-variables');
      return;
    }
    if (step === 'secondary-variables') {
      setSearch('');
      setStep('primary-variables');
      return;
    }
    if (step === 'primary-variables') {
      setSearch('');
      setStep('quota-type');
      return;
    }
    if (onBack) {
      resetState();
      onBack();
      return;
    }
    handleOpenChange(false);
  }

  function handleBreadcrumbClick(target: QuotaStep): void {
    if (target === 'quota-type') {
      setSearch('');
      setStep('quota-type');
      return;
    }
    if (target === 'primary-variables') {
      setSearch('');
      setStep('primary-variables');
    }
    if (target === 'secondary-variables' && primarySelectedIds.size > 0) {
      setSearch('');
      setStep('secondary-variables');
    }
    if (target === 'dimension' && secondarySelectedIds.size > 0) {
      initializeMatrix();
      setStep('dimension');
    }
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalContent, WuModalHeader, WuModalFooter, WuButton } = wick;
  const selectedCount = activeSelectedIds.size;
  const instructions =
    step === 'quota-type'
      ? CROSS_VARIABLE_QUOTA_TYPE_INSTRUCTIONS
      : step === 'primary-variables'
      ? CROSS_VARIABLE_PRIMARY_VARIABLES_INSTRUCTIONS
      : step === 'secondary-variables'
        ? CROSS_VARIABLE_SECONDARY_VARIABLES_INSTRUCTIONS
        : CROSS_VARIABLE_MATRIX_INSTRUCTIONS;
  const selectionLabel =
    step === 'primary-variables' ? 'Primary variables' : 'Secondary variables';
  const canProceed =
    step === 'quota-type'
      ? true
      : step === 'primary-variables'
      ? primarySelectedIds.size > 0 && primaryDimensions.length > 0
      : step === 'secondary-variables'
        ? secondarySelectedIds.size > 0 && matrixColumns.length > 0
        : combinationRows.length > 0 && matrixColumns.length > 0;
  const breadcrumbStep: QuotaStep = step;

  return (
    <WuModal
      open
      onOpenChange={handleOpenChange}
      className={`${styles.modal} ${step === 'dimension' ? styles.modalWide : ''}`}
      variant="action"
    >
      <WuModalHeader className={styles.header}>
        {step === 'dimension' ? 'Cross variable quota matrix' : 'Cross variable quota'}
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        {step === 'quota-type' ? (
          <div className={styles.body}>
            <p className={styles.instructions}>{instructions}</p>
            <CrossVariableQuotaTypeStep value={quotaScope} onChange={setQuotaScope} />
          </div>
        ) : step === 'dimension' ? (
          <div className={styles.body}>
            <CrossVariableQuotaTypeStep
              value={quotaScope}
              onChange={setQuotaScope}
              variant="inline"
            />
            <p className={styles.instructions}>{instructions}</p>
            <p className={styles.matrixSummary}>
              <strong>{formatCrossVariableQuotaScope(quotaScope)}</strong> ·{' '}
              <strong>{combinationRows.length}</strong> primary combinations ·{' '}
              <strong>{matrixColumns.length}</strong> column options across{' '}
              <strong>{secondaryQuestions.length}</strong> secondary{' '}
              {secondaryQuestions.length === 1 ? 'variable' : 'variables'}
            </p>
            <CrossVariableQuotaMatrixStep
              rows={combinationRows}
              columns={matrixColumns}
              matrix={matrix}
              onMatrixChange={setMatrix}
            />
          </div>
        ) : (
          <div className={styles.body}>
            <p className={styles.instructions}>{instructions}</p>
            <div className={styles.searchRow}>
              <WuInput
                variant="outlined"
                placeholder="Search"
                Icon={<span className="wm-search" />}
                iconPosition="left"
                value={search}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setSearch(event.target.value)
                }
                className={styles.searchInput}
              />
            </div>
            <div className={styles.tableArea}>
              <WuTable
                data={displayQuestions as unknown[]}
                columns={columns as unknown as IWuTableColumnDef<unknown>[]}
                variant="striped"
                sort={{ enabled: true }}
                filterText={search}
              />
            </div>
            <div className={styles.selectionCount}>
              <strong>{selectedCount}</strong> / {selectableTotal} {selectionLabel} selected
            </div>
            {selectedVariables.length > 0 ? (
              <div className={styles.selectedChips}>
                {selectedVariables.map((question) => (
                  <span
                    key={question.id}
                    className={styles.selectedChip}
                    title={question.text}
                  >
                    <span className={styles.selectedChipText}>{question.text}</span>
                    <button
                      type="button"
                      className={styles.selectedChipClear}
                      aria-label={`Remove ${question.text}`}
                      onClick={() => toggleSelect(question.id)}
                    >
                      <span className="wm-close" aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </WuModalContent>
      <WuModalFooter>
        <div className={styles.footerActions}>
          <QuotaStepBreadcrumb
            currentStep={breadcrumbStep}
            steps={CROSS_VARIABLE_QUOTA_STEPS}
            onStepClick={handleBreadcrumbClick}
          />
          <div className={styles.footerButtons}>
            <WuButton variant="secondary" onClick={handleBack}>
              Back
            </WuButton>
            <WuButton onClick={handleNext} disabled={!canProceed}>
              {step === 'dimension' ? 'Save' : 'Next'}
            </WuButton>
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
