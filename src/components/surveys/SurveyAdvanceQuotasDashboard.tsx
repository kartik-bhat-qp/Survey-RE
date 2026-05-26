'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { AddQuotaModal } from '@/components/surveys/AddQuotaModal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ADVANCE_QUOTA_TYPE_OPTIONS,
  getAdvanceQuotaGroupOptions,
  MOCK_ADVANCE_QUOTAS,
  type AdvanceQuota,
} from '@/data/mock-advance-quotas';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './SurveyAdvanceQuotasDashboard.module.css';

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
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

const ALL_FILTER = 'all';

function QuotaTargetCell({ quota }: { quota: AdvanceQuota }) {
  const current = quota.current;
  const hasCurrent = current !== undefined;
  const progress = hasCurrent ? Math.min(current / quota.target, 1) : 1;
  const label = hasCurrent ? `${current}/${quota.target}` : String(quota.target);

  return (
    <div className={styles.targetCell}>
      <div className={styles.progressTrack} aria-hidden>
        <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
      </div>
      <span className={styles.targetLabel}>{label}</span>
    </div>
  );
}

function ColumnHeader({
  label,
  icons,
}: {
  label: string;
  icons?: ('sort' | 'filter' | 'info' | 'settings')[];
}) {
  return (
    <span className={styles.columnHeader}>
      {label}
      {icons?.includes('sort') ? <span className="wm-unfold-more" aria-hidden /> : null}
      {icons?.includes('filter') ? <span className="wm-filter-list" aria-hidden /> : null}
      {icons?.includes('info') ? <span className="wm-info-outline" aria-hidden /> : null}
      {icons?.includes('settings') ? <span className="wm-settings" aria-hidden /> : null}
    </span>
  );
}

function FilterableColumnHeader({
  label,
  value,
  options,
  onChange,
  leadingIcon,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  leadingIcon?: string;
}) {
  const isActive = value !== ALL_FILTER;

  return (
    <span className={styles.columnHeader}>
      {leadingIcon ? <span className={leadingIcon} aria-hidden /> : null}
      {label}
      <WuMenu
        Trigger={
          <button
            type="button"
            className={styles.filterBtn}
            data-active={isActive ? 'true' : undefined}
            aria-label={`Filter ${label}`}
          >
            <span className="wm-filter-list" aria-hidden />
          </button>
        }
        align="start"
      >
        <WuMenuItem onSelect={() => onChange(ALL_FILTER)}>All</WuMenuItem>
        {options.map((option) => (
          <WuMenuItem key={option} onSelect={() => onChange(option)}>
            {option}
          </WuMenuItem>
        ))}
      </WuMenu>
    </span>
  );
}

export function SurveyAdvanceQuotasDashboard() {
  const wick = useWickUILib();
  const [addQuotaOpen, setAddQuotaOpen] = useState(false);
  const [quotaTypeFilter, setQuotaTypeFilter] = useState(ALL_FILTER);
  const [quotaGroupFilter, setQuotaGroupFilter] = useState(ALL_FILTER);

  const quotaGroupOptions = useMemo(() => getAdvanceQuotaGroupOptions(), []);

  const filteredQuotas = useMemo(() => {
    return MOCK_ADVANCE_QUOTAS.filter((quota) => {
      if (quotaTypeFilter !== ALL_FILTER && quota.quotaType !== quotaTypeFilter) {
        return false;
      }
      if (quotaGroupFilter !== ALL_FILTER && quota.quotaGroup !== quotaGroupFilter) {
        return false;
      }
      return true;
    });
  }, [quotaTypeFilter, quotaGroupFilter]);

  const columns: IWuTableColumnDef<AdvanceQuota>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: () => <ColumnHeader label="NAME" icons={['sort']} />,
        enableSorting: true,
        size: 180,
        cell: ({ row }) => <span className={styles.nameCell}>{row.original.name}</span>,
      },
      {
        accessorKey: 'quotaType',
        header: () => (
          <FilterableColumnHeader
            label="QUOTA TYPE"
            value={quotaTypeFilter}
            options={ADVANCE_QUOTA_TYPE_OPTIONS}
            onChange={setQuotaTypeFilter}
          />
        ),
        filterable: true,
        enableSorting: true,
        size: 140,
      },
      {
        accessorKey: 'description',
        header: () => <ColumnHeader label="DESCRIPTION" icons={['info']} />,
        size: 320,
        cell: ({ row }) => <span className={styles.descriptionCell}>{row.original.description}</span>,
      },
      {
        accessorKey: 'quotaGroup',
        header: () => (
          <FilterableColumnHeader
            label="QUOTA GROUP"
            value={quotaGroupFilter}
            options={quotaGroupOptions}
            onChange={setQuotaGroupFilter}
            leadingIcon="wm-group"
          />
        ),
        filterable: true,
        enableSorting: true,
        size: 150,
      },
      {
        accessorKey: 'multipleQuotaHandling',
        header: () => (
          <span className={styles.columnHeader}>MULTIPLE QUOTA HANDLING</span>
        ),
        enableSorting: true,
        size: 190,
      },
      {
        accessorKey: 'target',
        header: () => <ColumnHeader label="TARGET" icons={['settings', 'filter']} />,
        headerAlign: 'right',
        cellAlign: 'right',
        size: 130,
        cell: ({ row }) => <QuotaTargetCell quota={row.original} />,
      },
    ],
    [quotaGroupFilter, quotaGroupOptions, quotaTypeFilter]
  );

  if (!wick) {
    return null;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h2 className={styles.title}>Dashboard</h2>
        <div className={styles.headerActions}>
          <WuButton
            size="sm"
            variant="primary"
            onClick={() => setAddQuotaOpen(true)}
          >
            Add Quota
            <span className="wm-add" />
          </WuButton>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <WuTable
          data={filteredQuotas as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          className={styles.quotaTable}
          tableLayout="fixed"
          sort={{ enabled: true }}
          filterText=""
          NoDataContent={
            <EmptyState
              icon="wm-filter-list"
              title="No quotas match your filters"
              description="Try changing the Quota Type or Quota Group filters"
            />
          }
        />
      </div>

      <AddQuotaModal open={addQuotaOpen} onOpenChange={setAddQuotaOpen} />
    </div>
  );
}
