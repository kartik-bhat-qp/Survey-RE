'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  MOCK_SURVEY_RESPONSES,
  RESPONSE_FILTER_OPTIONS,
  RAA_BLOCKED,
  type SurveyResponse,
  type ResponseStatus,
} from '@/data/mock-survey-responses';
import styles from './SurveyAnalyticsResponses.module.css';

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

const STATUS_CLASS: Record<ResponseStatus, string> = {
  Completed: styles.statusCompleted,
  Partial: styles.statusPartial,
  Disqualified: styles.statusDisqualified,
};

function RaaCell({ value }: { value: string | null }) {
  if (!value) return <span className={styles.emptyCell}>—</span>;
  if (value === RAA_BLOCKED) return <span className={styles.raaBlocked}>{value}</span>;
  return <span>{value}</span>;
}

export function SurveyAnalyticsResponses() {
  const { showToast } = useWuShowToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [questionsVisible, setQuestionsVisible] = useState(false);

  const filtered = useMemo(() => {
    return MOCK_SURVEY_RESPONSES.filter((r) => {
      const matchesFilter =
        filter === 'all' || r.status.toLowerCase() === filter;
      const matchesSearch =
        !search ||
        r.id.includes(search) ||
        r.status.toLowerCase().includes(search.toLowerCase()) ||
        r.timestamp.includes(search);
      return matchesFilter && matchesSearch;
    });
  }, [search, filter]);

  const columns = useMemo<IWuTableColumnDef<SurveyResponse>[]>(
    () => [
      {
        id: '#',
        header: '#',
        accessorKey: 'id',
        cell: ({ row }) => (
          <span className={styles.rowNum}>{row.index + 1}</span>
        ),
        size: 40,
      },
      {
        id: 'id',
        header: 'Response ID',
        accessorKey: 'id',
        cell: ({ row }) => (
          <button
            type="button"
            className={styles.responseLink}
            onClick={() => showToast({ message: `Viewing response ${row.original.id}`, variant: 'info' })}
          >
            {row.original.id}
          </button>
        ),
        size: 110,
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => (
          <span className={STATUS_CLASS[row.original.status]}>
            {row.original.status}
          </span>
        ),
        size: 100,
      },
      {
        id: 'timestamp',
        header: 'Timestamp (mm/dd/yyyy)',
        accessorKey: 'timestamp',
        size: 180,
      },
      {
        id: 'timeTaken',
        header: 'Time Taken (Seconds)',
        accessorKey: 'timeTaken',
        cell: ({ row }) => (
          <span className={styles.numericCell}>{row.original.timeTaken}</span>
        ),
        size: 160,
      },
      {
        id: 'respondentEmail',
        header: 'Respondent Email',
        accessorKey: 'respondentEmail',
        cell: ({ row }) => <RaaCell value={row.original.respondentEmail} />,
        size: 160,
      },
      {
        id: 'emailList',
        header: 'Email List',
        accessorKey: 'emailList',
        cell: ({ row }) => <RaaCell value={row.original.emailList} />,
        size: 100,
      },
      {
        id: 'externalReference',
        header: 'External Reference',
        accessorKey: 'externalReference',
        cell: ({ row }) => <RaaCell value={row.original.externalReference} />,
        size: 150,
      },
      {
        id: 'customerId',
        header: 'Customer ID',
        accessorKey: 'customerId',
        cell: ({ row }) => <RaaCell value={row.original.customerId} />,
        size: 120,
      },
      {
        id: 'employeeId',
        header: 'Employee ID',
        accessorKey: 'employeeId',
        cell: ({ row }) => <RaaCell value={row.original.employeeId} />,
        size: 110,
      },
      {
        id: 'department',
        header: 'Department',
        accessorKey: 'department',
        cell: ({ row }) => <RaaCell value={row.original.department} />,
        size: 120,
      },
      {
        id: 'jobTitle',
        header: 'Job Title',
        accessorKey: 'jobTitle',
        cell: ({ row }) => <RaaCell value={row.original.jobTitle} />,
        size: 120,
      },
    ],
    [showToast]
  );

  return (
    <div className={styles.shell}>
      <div className={styles.panel}>
        {/* Header row */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>Response Viewer</h2>
            <button
              type="button"
              className={styles.helpBtn}
              aria-label="Response Viewer help"
              onClick={() => showToast({ message: 'Response Viewer help', variant: 'info' })}
            >
              ?
            </button>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.searchWrap}>
              <WuInput
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <WuSelect
              data={RESPONSE_FILTER_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={RESPONSE_FILTER_OPTIONS.find((o) => o.value === filter)}
              onSelect={(opt) => {
                if (!opt) return;
                setFilter((opt as { value: string }).value);
              }}
              variant="outlined"
              className={styles.filterSelect}
            />
          </div>
        </div>

        {/* Controls row */}
        <div className={styles.controls}>
          <div className={styles.controlsLeft}>
            <span className={styles.questionsLabel}>Questions</span>
            <WuToggle
              checked={questionsVisible}
              onChange={(checked) => setQuestionsVisible(checked)}
              aria-label="Show question columns"
            />
          </div>
          <div className={styles.controlsRight}>
            <button
              type="button"
              className={styles.settingsBtn}
              onClick={() => showToast({ message: 'Settings', variant: 'info' })}
            >
              <span className="wm-settings" aria-hidden />
              <span>Settings</span>
            </button>
            <button
              type="button"
              className={styles.xlBtn}
              aria-label="Export to Excel"
              onClick={() => showToast({ message: 'Exporting to Excel…', variant: 'success' })}
            >
              XL
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          <WuTable
            data={filtered as unknown[]}
            columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          />
        </div>
      </div>
    </div>
  );
}
