'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { StandardLoader } from '@/components/ui/StandardLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import type { TextAiDashboard } from '@/data/mock-text-ai-dashboards';
import {
  getTextAiDashboardQuestions,
  textAiDashboardHasQuestions,
  type TextAiDashboardQuestion,
} from '@/data/mock-text-ai-dashboard-questions';
import { formatSmartDate, formatTextAiCredits } from '@/data/mock-utils';
import styles from './TextAiDashboardsTable.module.css';

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false, loading: () => <StandardLoader className="min-h-[240px]" /> }
);

type DashboardListRow =
  | { rowKind: 'dashboard'; dashboard: TextAiDashboard }
  | { rowKind: 'question'; dashboardId: number; question: TextAiDashboardQuestion };

function buildDisplayRows(
  dashboards: TextAiDashboard[],
  expandedDashboardIds: ReadonlySet<number>
): DashboardListRow[] {
  const rows: DashboardListRow[] = [];

  for (const dashboard of dashboards) {
    rows.push({ rowKind: 'dashboard', dashboard });
    if (!expandedDashboardIds.has(dashboard.id)) continue;

    for (const question of getTextAiDashboardQuestions(dashboard.id)) {
      rows.push({ rowKind: 'question', dashboardId: dashboard.id, question });
    }
  }

  return rows;
}

interface TextAiDashboardsTableProps {
  dashboards: TextAiDashboard[];
}

export function TextAiDashboardsTable({ dashboards }: TextAiDashboardsTableProps) {
  const [expandedDashboardIds, setExpandedDashboardIds] = useState<Set<number>>(() => new Set());

  const displayRows = useMemo(
    () => buildDisplayRows(dashboards, expandedDashboardIds),
    [dashboards, expandedDashboardIds]
  );

  const toggleExpand = useCallback((dashboardId: number) => {
    setExpandedDashboardIds((prev) => {
      const next = new Set(prev);
      if (next.has(dashboardId)) {
        next.delete(dashboardId);
      } else {
        next.add(dashboardId);
      }
      return next;
    });
  }, []);

  const columns: IWuTableColumnDef<DashboardListRow>[] = useMemo(
    () => [
      {
        id: 'name',
        accessorKey: 'rowKind',
        header: 'Dashboards',
        enableSorting: true,
        cell: ({ row }) => {
          if (row.original.rowKind === 'dashboard') {
            const dashboard = row.original.dashboard;
            const isExpandable = textAiDashboardHasQuestions(dashboard.id);
            const isExpanded = expandedDashboardIds.has(dashboard.id);

            return (
              <span className={styles.dashboardNameRow}>
                {isExpandable ? (
                  <button
                    type="button"
                    className={styles.dashboardLink}
                    aria-expanded={isExpanded}
                    onClick={() => toggleExpand(dashboard.id)}
                  >
                    {dashboard.name}
                  </button>
                ) : (
                  <Link href={`/text-ai/${dashboard.id}`} className={styles.dashboardLink}>
                    {dashboard.name}
                  </Link>
                )}
                {isExpandable ? (
                  <button
                    type="button"
                    className={styles.expandButton}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? 'Collapse questions' : 'Expand questions'}
                    onClick={() => toggleExpand(dashboard.id)}
                  >
                    <span
                      className={`wm-chevron-right ${styles.expandIcon} ${isExpanded ? styles.expandIconExpanded : ''}`}
                      aria-hidden
                    />
                  </button>
                ) : null}
              </span>
            );
          }

          const { question, dashboardId } = row.original;
          return (
            <Link
              href={`/text-ai/${dashboardId}`}
              className={styles.questionLink}
              title={question.text}
            >
              {question.text}
            </Link>
          );
        },
      },
      {
        id: 'creationDate',
        accessorKey: 'rowKind',
        header: 'Created on',
        enableSorting: true,
        cell: ({ row }) => {
          if (row.original.rowKind === 'question') {
            return formatSmartDate(row.original.question.creationDate);
          }
          return formatSmartDate(row.original.dashboard.creationDate);
        },
      },
      {
        id: 'commentCount',
        accessorKey: 'rowKind',
        header: 'Credits used',
        headerAlign: 'center',
        cellAlign: 'center',
        enableSorting: true,
        cell: ({ row }) => {
          const credits =
            row.original.rowKind === 'question'
              ? row.original.question.commentCount
              : row.original.dashboard.commentCount;

          return (
            <span className={styles.commentCountCell}>{formatTextAiCredits(credits)}</span>
          );
        },
      },
      {
        id: 'status',
        accessorKey: 'rowKind',
        header: 'Status',
        cell: ({ row }) => {
          if (row.original.rowKind === 'question') {
            return row.original.question.status;
          }
          return row.original.dashboard.status;
        },
      },
    ],
    [expandedDashboardIds, toggleExpand]
  );

  return (
    <WuTable
      data={displayRows as unknown[]}
      columns={columns as unknown as IWuTableColumnDef<unknown>[]}
      variant="striped"
      sort={{ enabled: true }}
      filterText=""
      tableLayout="auto"
      NoDataContent={
        <EmptyState
          icon="wm-search-off"
          title="No dashboards found"
          description="Try adjusting your search"
        />
      }
    />
  );
}
