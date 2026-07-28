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
  onSelectQuestion,
  onToggleQuestion,
  excludeQuestionIds = [],
}: WidgetQuestionSelectionProps) {
  const [search, setSearch] = useState('');
  const [expandedParentIds, setExpandedParentIds] = useState<Set<number>>(() => new Set());

  const excludedIds = useMemo(() => new Set(excludeQuestionIds), [excludeQuestionIds]);
  const selectedIds = useMemo(() => new Set(selectedQuestionIds), [selectedQuestionIds]);

  const questions = useMemo(
    () => getQuestionsBySurvey(surveyId).filter((q) => !excludedIds.has(q.id)),
    [surveyId, excludedIds]
  );

  const displayQuestions = useMemo(
    () => flattenQuestionsForPicker(questions, expandedParentIds),
    [questions, expandedParentIds]
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

  const allVisibleSelected =
    multiSelect &&
    displayQuestions.length > 0 &&
    displayQuestions.every((q) => selectedIds.has(q.parentQuestionId ?? q.id));

  const toggleAllVisible = useCallback(
    (checked: boolean): void => {
      if (!onToggleQuestion) return;
      const seen = new Set<number>();
      for (const question of displayQuestions) {
        const key = question.parentQuestionId ?? question.id;
        if (seen.has(key)) continue;
        seen.add(key);
        const isSelected = selectedIds.has(key);
        if (checked && !isSelected) onToggleQuestion(question, true);
        if (!checked && isSelected) onToggleQuestion(question, false);
      }
    },
    [displayQuestions, onToggleQuestion, selectedIds]
  );

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
          const isExpandable = questionHasExpandableRows(question);
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
                style={isSelected ? { fontWeight: 600 } : undefined}
                onClick={() => {
                  if (multiSelect) {
                    onToggleQuestion?.(question, !selectedIds.has(selectionKey));
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
                checked={checked}
                onChange={(nextChecked) => onToggleQuestion?.(question, nextChecked)}
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
    onToggleQuestion,
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
          placeholder="Search by Question nar"
          Icon={<span className="wm-search" />}
          iconPosition="left"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
    </div>
  );
}
