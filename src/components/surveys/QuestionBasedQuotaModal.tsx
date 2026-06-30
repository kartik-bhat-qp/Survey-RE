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
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  buildInitialDistribution,
  QuotaDimensionStep,
  type QuotaDimensionState,
} from '@/components/surveys/QuotaDimensionStep';
import {
  QuotaStepBreadcrumb,
  type QuotaStep,
} from '@/components/surveys/QuotaStepBreadcrumb';
import styles from './QuestionBasedQuotaModal.module.css';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false, loading: () => <StandardLoader className="min-h-[320px]" /> }
);

type ModalStep = 'question' | 'dimension';

interface QuestionBasedQuotaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: number;
  onBack?: () => void;
  onSave?: (
    questions: SurveyQuestion[],
    distribution: QuotaDimensionState
  ) => void;
}

export function QuestionBasedQuotaModal({
  open,
  onOpenChange,
  surveyId,
  onBack,
  onSave,
}: QuestionBasedQuotaModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [step, setStep] = useState<ModalStep>('question');
  const [search, setSearch] = useState('');
  const [expandedParentIds, setExpandedParentIds] = useState<Set<number>>(() => new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [distribution, setDistribution] = useState<QuotaDimensionState>({});

  const questions = useMemo(() => getQuestionsBySurvey(surveyId), [surveyId]);

  const displayQuestions = useMemo(
    () => flattenQuestionsForPicker(questions, expandedParentIds),
    [questions, expandedParentIds]
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

  const selectedQuestions = useMemo(
    () => displayQuestions.filter((q) => selectedIds.has(q.id)),
    [displayQuestions, selectedIds]
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

  const toggleSelect = useCallback((questionId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }, []);

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

          const isSelected = selectedIds.has(question.id);
          return (
            <input
              type="checkbox"
              className={`${styles.checkbox} ${isSubRow ? styles.checkboxSub : ''}`}
              checked={isSelected}
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
        header: 'Questions',
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
    [expandedParentIds, selectedIds, toggleExpand, toggleSelect]
  );

  function resetState(): void {
    setStep('question');
    setSearch('');
    setExpandedParentIds(new Set());
    setSelectedIds(new Set());
    setDistribution({});
  }

  function handleOpenChange(nextOpen: boolean): void {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  }

  function handleNext(): void {
    if (selectedQuestions.length === 0) return;
    setDistribution(buildInitialDistribution(selectedQuestions));
    setStep('dimension');
  }

  function handleSave(): void {
    if (selectedQuestions.length === 0) return;
    onSave?.(selectedQuestions, distribution);
    showToast({
      message: `Quota created with ${selectedQuestions.length} ${
        selectedQuestions.length === 1 ? 'question' : 'questions'
      }`,
      variant: 'success',
    });
    resetState();
    onOpenChange(false);
  }

  function handleBack(): void {
    if (step === 'dimension') {
      setStep('question');
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
      if (onBack) {
        resetState();
        onBack();
      } else {
        handleOpenChange(false);
      }
      return;
    }
    if (target === 'question') {
      setStep('question');
    }
  }

  function handleRemoveQuestion(questionId: number): void {
    const remaining = selectedQuestions.filter((q) => q.id !== questionId);
    if (remaining.length === 0) {
      setStep('question');
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });
    setDistribution((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalContent, WuModalHeader, WuModalFooter, WuButton } = wick;
  const selectedCount = selectedIds.size;
  const breadcrumbStep: QuotaStep = step === 'question' ? 'question' : 'dimension';

  return (
    <WuModal
      open
      onOpenChange={handleOpenChange}
      className={styles.modal}
      variant="action"
    >
      <WuModalHeader className={styles.header}>
        {step === 'question' ? 'Question Based Quota' : 'Create Quota'}
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        {step === 'question' ? (
          <div className={styles.body}>
            <p className={styles.instructions}>
              Select the question you would like to add quota for.
            </p>
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
              <strong>{selectedCount}</strong> / {selectableTotal} Questions selected
            </div>
            {selectedQuestions.length > 0 ? (
              <div className={styles.selectedChips}>
                {selectedQuestions.map((question) => (
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
        ) : (
          <QuotaDimensionStep
            surveyId={surveyId}
            questions={selectedQuestions}
            distribution={distribution}
            onDistributionChange={setDistribution}
            onRemoveQuestion={handleRemoveQuestion}
          />
        )}
      </WuModalContent>
      <WuModalFooter>
        <div className={styles.footerActions}>
          <QuotaStepBreadcrumb
            currentStep={breadcrumbStep}
            onStepClick={handleBreadcrumbClick}
          />
          <div className={styles.footerButtons}>
            <WuButton variant="secondary" onClick={handleBack}>
              Back
            </WuButton>
            {step === 'question' ? (
              <WuButton onClick={handleNext} disabled={selectedCount === 0}>
                Next
              </WuButton>
            ) : (
              <WuButton onClick={handleSave} disabled={selectedQuestions.length === 0}>
                Save
              </WuButton>
            )}
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
