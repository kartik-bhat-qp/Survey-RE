'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { CreateTextAiDashboardModal } from '@/components/text-ai/CreateTextAiDashboardModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import {
  MOCK_TEXT_AI_DASHBOARDS,
  type TextAiDashboard,
} from '@/data/mock-text-ai-dashboards';
import { saveRuntimeTextAiDashboard } from '@/data/text-ai-dashboard-runtime';
import type { TextAiDashboardCreatePayload } from '@/data/text-ai-dashboard-create';
import { getTextAiQuestionById } from '@/data/mock-text-ai-questions';
import { formatSmartDate, formatTextAiCredits } from '@/data/mock-utils';
import styles from './TextAiDashboards.module.css';

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

type TextAiDashboardRow = TextAiDashboard & {
  /** When set, this row represents a question listed under the parent dashboard. */
  parentDashboardId?: number;
  questionText?: string;
};

function hasExpandableQuestions(dashboard: TextAiDashboard): boolean {
  return Array.isArray(dashboard.questions) && dashboard.questions.length > 0;
}

function flattenDashboardsForTable(
  dashboards: TextAiDashboard[],
  expandedIds: ReadonlySet<number>
): TextAiDashboardRow[] {
  const rows: TextAiDashboardRow[] = [];
  for (const dashboard of dashboards) {
    rows.push(dashboard);
    if (!expandedIds.has(dashboard.id)) continue;
    const questions = dashboard.questions ?? [];
    questions.forEach((question, index) => {
      rows.push({
        ...dashboard,
        id: dashboard.id * 100000 + index + 1,
        parentDashboardId: dashboard.id,
        questionText: question.text,
        commentCount: question.creditsUsed,
      });
    });
  }
  return rows;
}

export default function TextAiPage() {
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const [dashboards, setDashboards] = useState<TextAiDashboard[]>(MOCK_TEXT_AI_DASHBOARDS);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedDashboardIds, setExpandedDashboardIds] = useState<Set<number>>(
    () => new Set()
  );

  const filteredDashboards = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return dashboards;
    return dashboards.filter((d) => d.name.toLowerCase().includes(term));
  }, [dashboards, search]);

  const tableRows = useMemo(
    () => flattenDashboardsForTable(filteredDashboards, expandedDashboardIds),
    [filteredDashboards, expandedDashboardIds]
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

  const columns: IWuTableColumnDef<TextAiDashboardRow>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Dashboards',
        enableSorting: true,
        cell: ({ row }) => {
          const item = row.original;
          const isQuestionRow = item.parentDashboardId !== undefined;

          if (isQuestionRow) {
            return (
              <span className={`${styles.nameCell} ${styles.nameCellSub}`}>
                <span className={styles.expandSpacer} aria-hidden />
                <Link
                  href={`/text-ai/${item.parentDashboardId}`}
                  className={`${styles.questionLink} ${styles.questionLinkWide}`}
                >
                  {item.questionText}
                </Link>
              </span>
            );
          }

          const isExpandable = hasExpandableQuestions(item);
          const isExpanded = expandedDashboardIds.has(item.id);

          return (
            <span className={styles.nameCell}>
              {isExpandable ? (
                <button
                  type="button"
                  className={styles.expandButton}
                  aria-expanded={isExpanded}
                  aria-label={
                    isExpanded ? 'Collapse dashboard questions' : 'Expand dashboard questions'
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(item.id);
                  }}
                >
                  <span
                    className={`wm-chevron-right ${styles.expandIcon} ${
                      isExpanded ? styles.expandIconOpen : ''
                    }`}
                    aria-hidden
                  />
                </button>
              ) : (
                <span className={styles.expandSpacer} aria-hidden />
              )}
              {isExpandable ? (
                <button
                  type="button"
                  className={styles.dashboardNameButton}
                  aria-expanded={isExpanded}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(item.id);
                  }}
                >
                  {item.name}
                </button>
              ) : (
                <Link
                  href={`/text-ai/${item.id}`}
                  className="font-medium text-[#1B87E6] hover:underline"
                >
                  {item.name}
                </Link>
              )}
            </span>
          );
        },
      },
      {
        accessorKey: 'creationDate',
        header: 'Created on',
        enableSorting: true,
        cell: ({ row }) =>
          row.original.parentDashboardId !== undefined
            ? null
            : formatSmartDate(row.original.creationDate),
      },
      {
        accessorKey: 'commentCount',
        header: 'Credits used',
        headerAlign: 'center',
        cellAlign: 'center',
        enableSorting: true,
        cell: ({ row }) => (
          <span className={styles.commentCountCell}>
            {formatTextAiCredits(row.original.commentCount)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) =>
          row.original.parentDashboardId !== undefined ? null : row.original.status,
      },
      {
        accessorKey: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          if (item.parentDashboardId !== undefined) return null;

          return (
            <div className={styles.rowActions} aria-label={`Actions for ${item.name}`}>
              <WuTooltip content="Edit dashboard" position="top">
                <WuButton
                  type="button"
                  variant="iconOnly"
                  size="sm"
                  className={styles.rowActionButton}
                  aria-label="Edit dashboard"
                  onClick={(event) => {
                    event.stopPropagation();
                    showToast({ message: `Edit '${item.name}'`, variant: 'info' });
                  }}
                  Icon={<span className="wm-edit" aria-hidden />}
                />
              </WuTooltip>
              <WuTooltip content="Theme configuration" position="top">
                <WuButton
                  type="button"
                  variant="iconOnly"
                  size="sm"
                  className={styles.rowActionButton}
                  aria-label="Theme configuration"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(`/text-ai/${item.id}/theme-configuration`);
                  }}
                  Icon={<span className="wm-table-edit" aria-hidden />}
                />
              </WuTooltip>
              <WuTooltip content="Delete dashboard" position="top">
                <WuButton
                  type="button"
                  variant="iconOnly"
                  size="sm"
                  className={styles.rowActionButton}
                  aria-label="Delete dashboard"
                  onClick={(event) => {
                    event.stopPropagation();
                    showToast({ message: `Delete '${item.name}'`, variant: 'info' });
                  }}
                  Icon={<span className="wm-delete" aria-hidden />}
                />
              </WuTooltip>
            </div>
          );
        },
      },
    ],
    [expandedDashboardIds, router, showToast, toggleExpand]
  );

  function handleCreate({
    name,
    survey,
    questionIds,
    separateDashboardPerQuestion,
    expertReviewRequested,
    segmentFilters,
  }: TextAiDashboardCreatePayload): void {
    const baseTimestamp = Date.now();
    const estimatedComments = questionIds.length * 964;
    const selectedQuestions = questionIds.map((questionId, index) => {
      const question = getTextAiQuestionById(questionId);
      return {
        id: `question-${question?.id ?? questionId}`,
        text: question?.text ?? `Question ${index + 1}`,
        creditsUsed: 964,
      };
    });
    const createdDashboards: TextAiDashboard[] = separateDashboardPerQuestion
      ? questionIds.map((questionId, index) => {
          const question = getTextAiQuestionById(questionId);
          const suffix = question?.code ?? `Q${index + 1}`;
          return {
            id: baseTimestamp + index,
            name: `${name} — ${suffix}`,
            creationDate: new Date().toISOString(),
            commentCount: 964,
            status: 'Completed',
            questions: [selectedQuestions[index]],
            segmentFilters,
          };
        })
      : [
          {
            id: baseTimestamp,
            name,
            creationDate: new Date().toISOString(),
            commentCount: estimatedComments,
            status: 'Completed',
            questions: selectedQuestions,
            segmentFilters,
          },
        ];

    createdDashboards.forEach((dashboard) => saveRuntimeTextAiDashboard(dashboard));
    setDashboards((prev) => [...createdDashboards, ...prev]);

    if (createdDashboards.length > 1) {
      showToast({
        message: `${createdDashboards.length} TextAI dashboards created from "${survey.name}"`,
        variant: 'success',
      });
    } else {
      showToast({
        message: `TextAI dashboard '${name}' created from "${survey.name}"`,
        variant: 'success',
      });
    }

    if (expertReviewRequested) {
      showToast({
        message: 'QuestionPro Expert Review requested — a research expert will review your model setup',
        variant: 'info',
      });
    }

    const appliedSegmentFilters =
      segmentFilters.criteriaGroups.length > 0 || segmentFilters.dateRangeLabel;
    if (appliedSegmentFilters) {
      showToast({
        message: 'Segment filters applied to the selected responses',
        variant: 'success',
      });
    }

    router.push(`/text-ai/${createdDashboards[0].id}`);
  }

  return (
    <PageContainer className={styles.page}>
      <header className={styles.headerBlock}>
        <h1 className={styles.title}>TextAI dashboards</h1>
        <WuButton
          className={styles.createBtn}
          onClick={() => setCreateOpen(true)}
          Icon={<span className="wm-add-2" />}
        >
          Create dashboard
        </WuButton>
      </header>

      <div className={styles.toolbar}>
        <WuInput
          variant="outlined"
          placeholder="Search"
          Icon={<span className="wm-search" />}
          iconPosition="left"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableWrap}>
        <WuTable
          data={tableRows as unknown[]}
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
      </div>

      <CreateTextAiDashboardModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultName={`TextAI dashboard ${dashboards.length + 1}`}
        onCreate={handleCreate}
      />
    </PageContainer>
  );
}
