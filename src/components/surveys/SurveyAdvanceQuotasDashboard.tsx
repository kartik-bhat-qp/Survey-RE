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
const WuMenuCheckboxItem = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuCheckboxItem })),
  { ssr: false }
);
const WuMenuSeparatorItem = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuSeparatorItem })),
  { ssr: false }
);

function QuotaTargetCell({ quota }: { quota: AdvanceQuota }) {
  const current = quota.current ?? quota.target;
  const progress = Math.min(current / quota.target, 1);
  const label = `${current}/${quota.target}`;

  return (
    <div
      className={styles.targetCell}
      title={label}
      aria-label={`Target ${label}`}
      tabIndex={0}
    >
      <div className={styles.progressTrack} aria-hidden>
        <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
      </div>
      <span className={styles.targetLabel} aria-hidden>
        {label}
      </span>
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
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
  leadingIcon?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);
  const isActive = value.length > 0;
  const chipTitle = isActive ? `Filtered by ${value.join(', ')}` : '';
  const draftChanged =
    draft.length !== value.length || draft.some((v) => !value.includes(v));

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(value);
    }
    setOpen(next);
  }

  function toggleDraft(option: string) {
    setDraft((prev) =>
      prev.includes(option) ? prev.filter((v) => v !== option) : [...prev, option]
    );
  }

  function resetDraft() {
    setDraft([]);
  }

  function applyDraft() {
    onChange(draft);
    setOpen(false);
  }

  function clearAppliedFilter() {
    onChange([]);
    setDraft([]);
  }

  return (
    <span
      className={styles.columnHeader}
      data-filtered={isActive ? 'true' : undefined}
    >
      {leadingIcon ? <span className={leadingIcon} aria-hidden /> : null}
      {label}
      {isActive ? (
        <span className={styles.filterChip} title={chipTitle}>
          <span className={styles.filterChipCount}>{value.length}</span>
          <span
            role="button"
            tabIndex={0}
            aria-label={`Clear ${label} filter`}
            className={styles.filterChipClear}
            onClick={(event) => {
              event.stopPropagation();
              clearAppliedFilter();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                clearAppliedFilter();
              }
            }}
          >
            <span className="wm-close" aria-hidden />
          </span>
        </span>
      ) : null}
      <WuMenu
        open={open}
        onOpenChange={handleOpenChange}
        Trigger={
          <span
            role="button"
            tabIndex={0}
            className={styles.filterBtn}
            data-active={isActive ? 'true' : undefined}
            aria-label={`Filter ${label}`}
          >
            <span className="wm-filter-list" aria-hidden />
          </span>
        }
        align="start"
      >
        {options.map((option) => (
          <WuMenuCheckboxItem
            key={option}
            checked={draft.includes(option)}
            onSelect={() => toggleDraft(option)}
            preventCloseOnSelect
          >
            {option}
          </WuMenuCheckboxItem>
        ))}
        <WuMenuSeparatorItem />
        <div className={styles.filterMenuFooter}>
          <button
            type="button"
            className={styles.filterMenuClearBtn}
            onClick={resetDraft}
            disabled={draft.length === 0}
          >
            Clear
          </button>
          <button
            type="button"
            className={styles.filterMenuApplyBtn}
            onClick={applyDraft}
            disabled={!draftChanged}
          >
            Apply
          </button>
        </div>
      </WuMenu>
    </span>
  );
}

export function SurveyAdvanceQuotasDashboard() {
  const wick = useWickUILib();
  const [addQuotaOpen, setAddQuotaOpen] = useState(false);
  const [quotaTypeFilter, setQuotaTypeFilter] = useState<string[]>([]);
  const [quotaGroupFilter, setQuotaGroupFilter] = useState<string[]>([]);

  const quotaGroupOptions = useMemo(() => getAdvanceQuotaGroupOptions(), []);

  const filteredQuotas = useMemo(() => {
    return MOCK_ADVANCE_QUOTAS.filter((quota) => {
      if (quotaTypeFilter.length > 0 && !quotaTypeFilter.includes(quota.quotaType)) {
        return false;
      }
      if (quotaGroupFilter.length > 0 && !quotaGroupFilter.includes(quota.quotaGroup)) {
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
        cell: ({ row }) => (
          <span className={styles.nameCell} title={row.original.name}>
            {row.original.name}
          </span>
        ),
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
        enableSorting: false,
        size: 140,
        cell: ({ row }) => (
          <span className={styles.clamp} title={row.original.quotaType}>
            {row.original.quotaType}
          </span>
        ),
      },
      {
        accessorKey: 'description',
        header: () => <ColumnHeader label="DESCRIPTION" icons={['info']} />,
        size: 320,
        cell: ({ row }) => (
          <span className={styles.descriptionCell} title={row.original.description}>
            {row.original.description}
          </span>
        ),
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
        enableSorting: false,
        size: 150,
        cell: ({ row }) => (
          <span className={styles.clamp} title={row.original.quotaGroup}>
            {row.original.quotaGroup}
          </span>
        ),
      },
      {
        accessorKey: 'multipleQuotaHandling',
        header: () => (
          <span className={styles.columnHeader}>MULTIPLE QUOTA HANDLING</span>
        ),
        enableSorting: true,
        size: 190,
        cell: ({ row }) => (
          <span className={styles.clamp} title={row.original.multipleQuotaHandling}>
            {row.original.multipleQuotaHandling}
          </span>
        ),
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
