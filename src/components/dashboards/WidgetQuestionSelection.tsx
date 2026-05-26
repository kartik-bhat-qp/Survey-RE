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
  selectedQuestionId: number | null;
  onSelectQuestion: (question: SurveyQuestion) => void;
}

export function WidgetQuestionSelection({
  surveyId,
  selectedQuestionId,
  onSelectQuestion,
}: WidgetQuestionSelectionProps) {
  const [search, setSearch] = useState('');
  const [expandedParentIds, setExpandedParentIds] = useState<Set<number>>(() => new Set());

  const questions = useMemo(() => getQuestionsBySurvey(surveyId), [surveyId]);

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

  const columns: IWuTableColumnDef<SurveyQuestion>[] = useMemo(
    () => [
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
          const isSelected = selectedQuestionId === question.id;

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
                onClick={() => onSelectQuestion(question)}
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
    ],
    [expandedParentIds, selectedQuestionId, onSelectQuestion, toggleExpand]
  );

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
