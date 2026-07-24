'use client';

import { useMemo, useState } from 'react';
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

export default function TextAiPage() {
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const [dashboards, setDashboards] = useState<TextAiDashboard[]>(MOCK_TEXT_AI_DASHBOARDS);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const filteredDashboards = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return dashboards;
    return dashboards.filter((d) => d.name.toLowerCase().includes(term));
  }, [dashboards, search]);

  const columns: IWuTableColumnDef<TextAiDashboard>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Dashboards',
        enableSorting: true,
        cell: ({ row }) => (
          <Link
            href={`/text-ai/${row.original.id}`}
            className={styles.dashboardNameLink}
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'creationDate',
        header: 'Created on',
        enableSorting: true,
        cell: ({ row }) => formatSmartDate(row.original.creationDate),
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
        cell: ({ row }) => row.original.status,
      },
      {
        accessorKey: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;

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
    [router, showToast]
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
          data={filteredDashboards as unknown[]}
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
