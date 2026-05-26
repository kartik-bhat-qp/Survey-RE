'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { SurveyFolderSidebar } from '@/components/surveys/SurveyFolderSidebar';
import { SurveysSubNav } from '@/components/surveys/SurveysSubNav';
import { EmptyState } from '@/components/ui/EmptyState';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  MOCK_SURVEY_FOLDERS,
  MOCK_SURVEYS,
  SURVEY_TOTAL_COUNT,
  SURVEYS_PAGE_SIZE,
  type Survey,
} from '@/data/mock-surveys';
import styles from './SurveysPage.module.css';

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
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

function formatSurveyDate(date: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).formatToParts(new Date(date));
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  return `${month} ${day} ${year}`;
}

function SurveyRowActions({ survey }: { survey: Survey }) {
  const router = useRouter();
  const { showToast } = useWuShowToast();

  function action(label: string) {
    showToast({ message: `${label}: ${survey.name}`, variant: 'success' });
  }

  return (
    <div className={styles.rowActions}>
      <WuButton
        size="sm"
        variant="iconOnly"
        Icon={<span className="wm-edit" />}
        aria-label="Edit"
        onClick={() => router.push(`/surveys/${survey.id}`)}
      />
      <WuButton
        size="sm"
        variant="iconOnly"
        Icon={<span className="wm-send" />}
        aria-label="Distribute"
        onClick={() => action('Distribute')}
      />
      <WuButton
        size="sm"
        variant="iconOnly"
        Icon={<span className="wm-bar-chart" />}
        aria-label="Analytics"
        onClick={() => action('Analytics')}
      />
      <WuButton
        size="sm"
        variant="iconOnly"
        Icon={<span className="wm-content-copy" />}
        aria-label="Copy"
        onClick={() => action('Copy')}
      />
      <WuButton
        size="sm"
        variant="iconOnly"
        Icon={<span className="wm-delete" />}
        aria-label="Delete"
        onClick={() => action('Delete')}
      />
      <WuMenu
        Trigger={
          <button type="button" className={styles.moreBtn} aria-label="More actions">
            <span className="wm-more-vert" />
          </button>
        }
        align="end"
      >
        <WuMenuItem onSelect={() => action('Move to folder')}>Move to folder</WuMenuItem>
        <WuMenuItem onSelect={() => action('Export')}>Export</WuMenuItem>
      </WuMenu>
    </div>
  );
}

export default function SurveysPage() {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [selectedFolderId, setSelectedFolderId] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const filteredSurveys = useMemo(() => {
    if (selectedFolderId === 'all') return MOCK_SURVEYS;
    return MOCK_SURVEYS.filter((survey) => survey.folderId === selectedFolderId);
  }, [selectedFolderId]);

  const allSelected =
    filteredSurveys.length > 0 && filteredSurveys.every((s) => selectedIds.has(s.id));

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(filteredSurveys.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  function toggleOne(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const columns: IWuTableColumnDef<Survey>[] = [
    {
      accessorKey: 'id',
      header: () => (
        <WuCheckbox
          checked={allSelected}
          onChange={(checked) => toggleAll(checked)}
          aria-label="Select all surveys"
        />
      ),
      cell: ({ row }) => (
        <WuCheckbox
          checked={selectedIds.has(row.original.id)}
          onChange={(checked) => toggleOne(row.original.id, checked)}
          aria-label={`Select ${row.original.name}`}
        />
      ),
      size: 48,
    },
    {
      accessorKey: 'name',
      header: 'Survey Name',
      filterable: true,
      enableSorting: true,
      cell: ({ row }) => (
        <Link href={`/surveys/${row.original.id}`} className={styles.surveyName}>
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      enableSorting: true,
      cell: ({ row }) => formatSurveyDate(row.original.createdAt),
    },
    {
      accessorKey: 'modifiedAt',
      header: 'Modified',
      enableSorting: true,
      cell: ({ row }) => formatSurveyDate(row.original.modifiedAt),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      enableSorting: true,
      cell: ({ row }) => <span className={styles.status}>{row.original.status}</span>,
    },
    {
      accessorKey: 'responses',
      header: 'Responses',
      enableSorting: true,
      cellAlign: 'right',
      cell: ({ row }) => row.original.responses,
    },
    {
      accessorKey: 'actions',
      header: '',
      cellAlign: 'right',
      cell: ({ row }) => <SurveyRowActions survey={row.original} />,
    },
  ];

  if (!wick) {
    return null;
  }

  const displayTotal = selectedFolderId === 'all' ? SURVEY_TOTAL_COUNT : filteredSurveys.length;
  const rangeEnd = Math.min(SURVEYS_PAGE_SIZE, displayTotal);

  return (
    <div className={styles.page}>
      <SurveysSubNav activeTab="surveys" />
      <div className={styles.workspaceBody}>
        <SurveyFolderSidebar
          folders={MOCK_SURVEY_FOLDERS}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
        />
        <div className={styles.main}>
          <div className={styles.toolbar}>
            <WuButton
              Icon={<span className="wm-add-2" />}
              onClick={() => showToast({ message: 'New survey', variant: 'success' })}
            >
              New Survey
            </WuButton>
            <div className={styles.pagination}>
              <span className={styles.paginationLabel}>
                1 - {rangeEnd} of {displayTotal}
              </span>
              <button type="button" className={styles.pageBtn} aria-label="Previous page" disabled>
                <span className="wm-chevron-left" />
              </button>
              <button type="button" className={styles.pageBtn} aria-label="Next page">
                <span className="wm-chevron-right" />
              </button>
              <button type="button" className={styles.pageBtn} aria-label="Page size">
                <span className="wm-arrow-drop-down" />
              </button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <WuTable
              data={filteredSurveys as unknown[]}
              columns={columns as unknown as IWuTableColumnDef<unknown>[]}
              variant="striped"
              sort={{ enabled: true }}
              filterText=""
              NoDataContent={
                <EmptyState
                  icon="wm-folder-open"
                  title="No surveys in this folder"
                  description="Create a new survey or choose another folder"
                />
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
