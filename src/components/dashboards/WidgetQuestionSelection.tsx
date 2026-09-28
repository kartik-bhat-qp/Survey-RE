'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { StandardLoader } from '@/components/ui/StandardLoader';
import {
  flattenQuestionsForPicker,
  getQuestionsBySurvey,
  questionHasExpandableRows,
  type SurveyQuestion,
} from '@/data/mock-survey-questions';
import styles from './WidgetQuestionSelection.module.css';

const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false, loading: () => <StandardLoader className="min-h-[320px]" /> }
);

interface WidgetQuestionSelectionProps {
  surveyId: number;
  selectedQuestionId?: number | null;
  /** When set with multiSelect, rows can be toggled independently. */
  selectedQuestionIds?: number[];
  multiSelect?: boolean;
  wholeQuestionsOnly?: boolean;
  unavailableQuestionIds?: number[];
  showSelectionCount?: boolean;
  onSelectionChange?: (ids: number[]) => void;
  onSelectQuestion?: (question: SurveyQuestion) => void;
  onToggleQuestion?: (question: SurveyQuestion, selected: boolean) => void;
  /** Question ids hidden from the picker (e.g. already chosen as primary). */
  excludeQuestionIds?: number[];
}

export function WidgetQuestionSelection({
  surveyId,
  selectedQuestionId = null,
  selectedQuestionIds = [],
  multiSelect = false,
  wholeQuestionsOnly = false,
  unavailableQuestionIds = [],
  showSelectionCount = false,
  onSelectionChange,
  onSelectQuestion,
  onToggleQuestion,
  excludeQuestionIds = [],
}: WidgetQuestionSelectionProps) {
  const [search, setSearch] = useState('');
  const [expandedParentIds, setExpandedParentIds] = useState<Set<number>>(() => new Set());

  const excludedIds = useMemo(() => new Set(excludeQuestionIds), [excludeQuestionIds]);
  const unavailableIds = useMemo(() => new Set(unavailableQuestionIds), [unavailableQuestionIds]);
  const selectedIds = useMemo(() => new Set(selectedQuestionIds), [selectedQuestionIds]);

  const questions = useMemo(
    () => getQuestionsBySurvey(surveyId).filter((q) => !excludedIds.has(q.id)),
    [surveyId, excludedIds]
  );

  const displayQuestions = useMemo(
    () => wholeQuestionsOnly ? questions : flattenQuestionsForPicker(questions, expandedParentIds),
    [questions, expandedParentIds, wholeQuestionsOnly]
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

  const selectableVisible = useMemo(() => displayQuestions.filter(q => !unavailableIds.has(q.parentQuestionId ?? q.id) && q.text.toLowerCase().includes(search.toLowerCase())), [displayQuestions, unavailableIds, search]);
  const allVisibleSelected = multiSelect && selectableVisible.length > 0 && selectableVisible.every(q => selectedIds.has(q.parentQuestionId ?? q.id));
  const toggleQuestion = useCallback((question: SurveyQuestion, checked: boolean) => {
    const key = question.parentQuestionId ?? question.id;
    if (unavailableIds.has(key)) return;
    if (onSelectionChange) {
      const next = new Set(selectedIds);
      if (checked) next.add(key); else next.delete(key);
      onSelectionChange([...next]);
    } else onToggleQuestion?.(question, checked);
  }, [onSelectionChange, onToggleQuestion, selectedIds, unavailableIds]);
  const toggleAllVisible = useCallback((checked: boolean) => {
    const next = new Set(selectedIds);
    const seen = new Set<number>();
    for (const question of selectableVisible) {
      const key = question.parentQuestionId ?? question.id;
      if (seen.has(key)) continue;
      seen.add(key);
      if (checked) next.add(key); else next.delete(key);
      if (!onSelectionChange && selectedIds.has(key) !== checked) onToggleQuestion?.(question, checked);
    }
    onSelectionChange?.([...next]);
  }, [selectableVisible, selectedIds, onSelectionChange, onToggleQuestion]);

  const columns: IWuTableColumnDef<SurveyQuestion>[] = useMemo(() => {
    const questionColumns: IWuTableColumnDef<SurveyQuestion>[] = [
      {
        accessorKey: 'code',
        header: 'Code',
        enableSorting: true,
        size: 80,
      },
      {
        accessorKey: 'text',
        header: 'Questions',
        filterable: true,
        enableSorting: true,
        cell: ({ row }) => {
          const question = row.original;
          const isSubRow = question.parentQuestionId !== undefined;
          const isExpandable = !wholeQuestionsOnly && questionHasExpandableRows(question);
          const isExpanded = expandedParentIds.has(question.id);
          const selectionKey = question.parentQuestionId ?? question.id;
          const isSelected = multiSelect
            ? selectedIds.has(selectionKey)
            : selectedQuestionId === question.id;

          return (
            <span
              className={`${styles.questionRow} ${isSubRow ? styles.questionRowSub : ''}`}
            >
              {isExpandable ? (
                <button
                  type="button"
                  className={styles.expandButton}
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? 'Collapse matrix rows' : 'Expand matrix rows'}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(question.id);
                  }}
                >
                  <span
                    className={`wm-chevron-right ${styles.subIcon} ${isExpanded ? styles.subIconExpanded : ''}`}
                    aria-hidden
                  />
                </button>
              ) : isSubRow ? (
                <span className={styles.subRowSpacer} aria-hidden />
              ) : null}
              <button
                type="button"
                className={styles.questionLink}
                disabled={unavailableIds.has(selectionKey)}
                style={isSelected ? { fontWeight: 600 } : undefined}
                onClick={() => {
                  if (multiSelect) {
                    toggleQuestion(question, !selectedIds.has(selectionKey));
                    return;
                  }
                  onSelectQuestion?.(question);
                }}
              >
                {question.text}
              </button>
            </span>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <span>{row.original.type}{unavailableIds.has(row.original.id) && <small className={styles.unavailable}>Unavailable</small>}</span>,
        enableSorting: true,
        size: 140,
      },
    ];

    if (!multiSelect) {
      return questionColumns;
    }

    return [
      {
        id: 'select',
        accessorKey: 'id',
        header: () => (
          <div className={styles.checkboxHeader}>
            <WuCheckbox
              checked={allVisibleSelected}
              onChange={toggleAllVisible}
              aria-label="Select all questions"
            />
          </div>
        ),
        cell: ({ row }) => {
          const question = row.original;
          const selectionKey = question.parentQuestionId ?? question.id;
          const checked = selectedIds.has(selectionKey);
          return (
            <div className={styles.checkboxCell}>
              <WuCheckbox
                disabled={unavailableIds.has(selectionKey)}
                checked={checked}
                onChange={(nextChecked) => toggleQuestion(question, nextChecked)}
                aria-label={`Select ${question.code}`}
              />
            </div>
          );
        },
        size: 48,
      },
      ...questionColumns,
    ];
  }, [
    allVisibleSelected,
    expandedParentIds,
    multiSelect,
    onSelectQuestion,
    toggleQuestion,
    unavailableIds,
    wholeQuestionsOnly,
    selectedIds,
    selectedQuestionId,
    toggleAllVisible,
    toggleExpand,
  ]);

  return (
    <div className={styles.root}>
      <div className={styles.searchRow}>
        <WuInput
          variant="outlined"
          placeholder="Search by question name"
          Icon={<span className="wm-search" />}
          iconPosition="left"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        {showSelectionCount && <span className={styles.selectionCount} aria-live="polite">{questions.filter(q => !unavailableIds.has(q.id) && selectedIds.has(q.id)).length} out of {questions.filter(q => !unavailableIds.has(q.id)).length}</span>}
      </div>
      <div className={styles.tableArea}>
        <WuTable
          data={displayQuestions as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          variant="unstyled"
          sort={{ enabled: true }}
          filterText={search}
        />
      </div>
    </div>
  );
}
