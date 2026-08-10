'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { CreateDatasetsModal } from '@/components/datasets/CreateDatasetsModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import type { CreateDatasetPayload } from '@/data/mock-create-dataset';
import { MOCK_DATASETS, type Dataset } from '@/data/mock-datasets';
import { useBiProductBasePath, withBiProductBasePath } from '@/hooks/useBiProductBasePath';
import styles from './DatasetsTable.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

function formatCreatedOn(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
    .format(new Date(date))
    .replace(',', '');
}

function RowActions({
  dataset,
  onEdit,
  onDelete,
}: {
  dataset: Dataset;
  onEdit: (dataset: Dataset) => void;
  onDelete: (dataset: Dataset) => void;
}) {
  return (
    <div className={styles.rowActions}>
      <WuTooltip content="Edit" position="top">
        <button
          type="button"
          className={styles.rowActionButton}
          aria-label={`Edit ${dataset.name}`}
          onClick={() => onEdit(dataset)}
        >
          <span className="wm-edit" aria-hidden />
        </button>
      </WuTooltip>
      <WuTooltip content="Delete" position="top">
        <button
          type="button"
          className={`${styles.rowActionButton} ${styles.rowActionButtonDelete}`}
          aria-label={`Delete ${dataset.name}`}
          onClick={() => onDelete(dataset)}
        >
          <span className="wm-delete" aria-hidden />
        </button>
      </WuTooltip>
    </div>
  );
}

export default function DatasetsPage() {
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const basePath = useBiProductBasePath();
  const datasetsPath = withBiProductBasePath(basePath, '/datasets');
  const [datasets, setDatasets] = useState<Dataset[]>(MOCK_DATASETS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Dataset | null>(null);

  function handleCreateDataset(payload: CreateDatasetPayload): void {
    const nextId =
      Math.max(
        0,
        ...datasets.map((dataset) => dataset.id),
        ...MOCK_DATASETS.map((dataset) => dataset.id)
      ) + 1;
    const isImport = payload.subType === 'import';
    const nextDataset: Dataset = {
      id: nextId,
      name: payload.name,
      variableCount: isImport ? 0 : 12,
      rowCount: isImport ? 0 : 8400,
      dataType: isImport ? 'External' : 'Survey (Composite)',
      createdOn: new Date().toISOString().slice(0, 10),
      surveyName: payload.surveyName,
    };
    setDatasets((prev) => [nextDataset, ...prev]);
    MOCK_DATASETS.unshift(nextDataset);
    router.push(`${datasetsPath}/${nextId}`);
  }

  function handleEdit(dataset: Dataset): void {
    showToast({
      message: `Editing "${dataset.name}" will be available in a future update.`,
      variant: 'info',
    });
  }

  function handleConfirmDelete(): void {
    if (!deleteTarget) return;
    setDatasets((prev) => prev.filter((dataset) => dataset.id !== deleteTarget.id));
    showToast({
      message: `"${deleteTarget.name}" deleted`,
      variant: 'success',
    });
    setDeleteTarget(null);
  }

  const columns: IWuTableColumnDef<Dataset>[] = [
    {
      accessorKey: 'name',
      header: 'Datasets',
      filterable: true,
      enableSorting: true,
      cell: ({ row }) => (
        <Link
          href={`${datasetsPath}/${row.original.id}`}
          className={styles.datasetNameLink}
          title={row.original.name}
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'variableCount',
      header: 'Variable count',
      headerAlign: 'right',
      cellAlign: 'right',
      enableSorting: false,
      cell: ({ row }) => row.original.variableCount,
    },
    {
      accessorKey: 'rowCount',
      header: 'Row count',
      headerAlign: 'right',
      cellAlign: 'right',
      enableSorting: false,
      cell: ({ row }) => row.original.rowCount.toLocaleString('en-US'),
    },
    {
      accessorKey: 'dataType',
      header: 'Data type',
      filterable: true,
      enableSorting: false,
      cell: ({ row }) => row.original.dataType,
    },
    {
      accessorKey: 'createdOn',
      header: 'Created on',
      enableSorting: true,
      cell: ({ row }) => formatCreatedOn(row.original.createdOn),
    },
    {
      accessorKey: 'id',
      header: '',
      headerAlign: 'right',
      cellAlign: 'right',
      enableSorting: false,
      cell: ({ row }) => (
        <RowActions
          dataset={row.original}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
        />
      ),
    },
  ];

  return (
    <div className="min-h-[calc(100vh-46px)] bg-white font-['Fira_Sans',sans-serif] text-[#253449]">
      <div className="flex h-[66px] items-center justify-between border-b border-[#e7eaf0] px-[15px]">
        <h1 className="text-[18px] font-semibold leading-none text-[#515b6b]">Datasets</h1>
        <WuButton
          className="inline-flex h-8 items-center gap-2 rounded-[4px] bg-[#1e88e5] px-3 text-[13px] font-medium text-white shadow-sm transition hover:bg-[#1976d2]"
          Icon={<span className="wm-add text-[16px]" aria-hidden />}
          onClick={() => setIsCreateOpen(true)}
        >
          New Dataset
        </WuButton>
      </div>

      <section className="px-[31px] pt-[33px]">
        <WuInput
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search"
          aria-label="Search datasets"
          variant="outlined"
          Icon={<span className="wm-search" aria-hidden />}
          iconPosition="left"
          className="w-full sm:max-w-xs"
        />

        <div className={styles.tableWrap}>
          <WuTable
            data={datasets as unknown[]}
            columns={columns as unknown as IWuTableColumnDef<unknown>[]}
            variant="striped"
            size="default"
            sort={{ enabled: true }}
            stickyHeader
            filterText={searchTerm}
            NoDataContent={
              <EmptyState
                icon="wm-search-off"
                title="No datasets found"
                description={
                  searchTerm.trim()
                    ? 'Try a different search term.'
                    : 'Create a dataset to get started.'
                }
                action={
                  searchTerm.trim() ? undefined : (
                    <WuButton onClick={() => setIsCreateOpen(true)}>New Dataset</WuButton>
                  )
                }
              />
            }
          />
        </div>
      </section>

      <CreateDatasetsModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreateDataset}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete dataset?"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="critical"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
