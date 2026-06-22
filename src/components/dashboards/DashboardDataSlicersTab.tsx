'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  DATA_SLICER_LICENSE_LIMIT,
  DATA_SLICER_LIMIT_TOOLTIP,
  MOCK_DATA_SLICERS,
  type DataSlicer,
} from '@/data/mock-data-slicers';
import styles from './DashboardDataSlicersTab.module.css';

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
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

function CreateDataSlicerButton({ disabled }: { disabled: boolean }) {
  const button = (
    <WuButton Icon={<span className="wm-add" />} disabled={disabled}>
      Create data slicer
    </WuButton>
  );

  if (!disabled) {
    return button;
  }

  return (
    <WuTooltip content={DATA_SLICER_LIMIT_TOOLTIP} position="bottom">
      <span className={styles.createBtnWrap} aria-label={DATA_SLICER_LIMIT_TOOLTIP}>
        {button}
      </span>
    </WuTooltip>
  );
}

export function DashboardDataSlicersTab() {
  const { showToast } = useWuShowToast();
  const [slicers, setSlicers] = useState<DataSlicer[]>(MOCK_DATA_SLICERS);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const atSlicerLimit = slicers.length >= DATA_SLICER_LICENSE_LIMIT;

  const filteredSlicers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return slicers;
    return slicers.filter((s) => s.name.toLowerCase().includes(term));
  }, [search, slicers]);

  const columns: IWuTableColumnDef<DataSlicer>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Slicer name',
        cell: ({ row }) => (
          <span className={styles.slicerName}>{row.original.name}</span>
        ),
      },
      {
        id: 'details',
        accessorKey: 'description',
        header: 'Details',
        cell: ({ row }) => {
          const slicer = row.original;
          const isExpanded = expandedId === slicer.id;
          return (
            <div>
              <button
                type="button"
                className={styles.detailsBtn}
                aria-expanded={isExpanded}
                onClick={() =>
                  setExpandedId((prev) => (prev === slicer.id ? null : slicer.id))
                }
              >
                Show details
                <span
                  className={`wm-expand-${isExpanded ? 'less' : 'more'} text-base`}
                  aria-hidden
                />
              </button>
              {isExpanded && slicer.description ? (
                <p className={styles.detailsPanel}>{slicer.description}</p>
              ) : null}
              {isExpanded && !slicer.description ? (
                <p className={styles.detailsPanel}>No additional details for this slicer.</p>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: 'applyToDashboard',
        header: 'Apply to dashboard',
        headerAlign: 'center',
        cellAlign: 'center',
        cell: ({ row }) => (
          <div className={styles.checkboxCell}>
            <WuCheckbox
              checked={row.original.applyToDashboard}
              onChange={(checked) => {
                setSlicers((prev) =>
                  prev.map((s) =>
                    s.id === row.original.id ? { ...s, applyToDashboard: checked } : s
                  )
                );
                showToast({
                  message: checked
                    ? `'${row.original.name}' will apply to this dashboard`
                    : `'${row.original.name}' removed from this dashboard`,
                  variant: 'success',
                });
              }}
              aria-label={`Apply ${row.original.name} to dashboard`}
            />
          </div>
        ),
      },
      {
        accessorKey: 'id',
        id: 'actions',
        header: 'Actions',
        cellAlign: 'right',
        cell: () => null,
      },
    ],
    [expandedId, showToast]
  );

  return (
    <div className={`${styles.panel} dashboard-settings-data-slicers-panel`}>
      <div className={styles.toolbarRow}>
        <div className={styles.searchWrap}>
          <WuInput
            variant="outlined"
            placeholder="Search by data slicer name"
            Icon={<span className="wm-search" />}
            iconPosition="left"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.actionsRow}>
        <CreateDataSlicerButton disabled={atSlicerLimit} />
        <button
          type="button"
          className={styles.manageLink}
          onClick={() =>
            showToast({ message: 'Manage data slicer', variant: 'success' })
          }
        >
          <span className="wm-menu" aria-hidden />
          Manage data slicer
        </button>
      </div>

      <div className={styles.tableWrap}>
        <WuTable
          data={filteredSlicers as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          variant="striped"
          sort={{ enabled: false }}
          filterText=""
          NoDataContent={
            <EmptyState
              icon="wm-search-off"
              title="No data slicers found"
              description={
                search.trim()
                  ? 'Try adjusting your search'
                  : 'Create a data slicer to filter dashboard widgets'
              }
              action={!search.trim() ? <CreateDataSlicerButton disabled={atSlicerLimit} /> : undefined}
            />
          }
        />
      </div>
    </div>
  );
}
