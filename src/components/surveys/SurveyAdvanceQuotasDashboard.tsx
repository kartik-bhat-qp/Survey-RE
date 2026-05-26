'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { MOCK_ADVANCE_QUOTAS, type AdvanceQuota } from '@/data/mock-advance-quotas';
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

function QuotaTargetCell({ quota }: { quota: AdvanceQuota }) {
  const progress = quota.current !== undefined ? Math.min(quota.current / quota.target, 1) : 1;
  const label =
    quota.current !== undefined ? `${quota.current}/${quota.target}` : String(quota.target);

  return (
    <div className={styles.targetCell}>
      <div className={styles.progressTrack}>
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

export function SurveyAdvanceQuotasDashboard() {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();

  const columns: IWuTableColumnDef<AdvanceQuota>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: () => <ColumnHeader label="NAME" icons={['sort']} />,
        enableSorting: true,
        cell: ({ row }) => <span className={styles.nameCell}>{row.original.name}</span>,
      },
      {
        accessorKey: 'quotaType',
        header: () => <ColumnHeader label="QUOTA TYPE" icons={['filter']} />,
        enableSorting: true,
      },
      {
        accessorKey: 'description',
        header: () => <ColumnHeader label="DESCRIPTION" icons={['info']} />,
        cell: ({ row }) => <span className={styles.descriptionCell}>{row.original.description}</span>,
      },
      {
        accessorKey: 'quotaGroup',
        header: () => (
          <span className={styles.columnHeader}>
            <span className="wm-group" aria-hidden />
            QUOTA GROUP
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'multipleQuotaHandling',
        header: 'MULTIPLE QUOTA HANDLING',
        enableSorting: true,
      },
      {
        accessorKey: 'target',
        header: () => <ColumnHeader label="TARGET" icons={['settings', 'filter']} />,
        cellAlign: 'right',
        cell: ({ row }) => <QuotaTargetCell quota={row.original} />,
      },
    ],
    []
  );

  if (!wick) {
    return null;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.headerSide} />
        <h2 className={styles.title}>Dashboard</h2>
        <div className={styles.headerSide}>
          <WuButton
            size="sm"
            variant="primary"
            onClick={() => showToast({ message: 'Add quota', variant: 'success' })}
          >
            Add Quota
            <span className="wm-add" />
          </WuButton>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <WuTable
          data={MOCK_ADVANCE_QUOTAS as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          variant="striped"
          sort={{ enabled: true }}
          filterText=""
        />
      </div>
    </div>
  );
}
