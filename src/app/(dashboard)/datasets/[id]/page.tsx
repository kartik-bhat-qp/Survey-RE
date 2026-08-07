'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { IWuTableColumnDef, IWuTableRowSelection } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  getDatasetDetailData,
  type DatasetVariable,
  type DatasetVariableKind,
} from '@/data/mock-dataset-detail';
import { MOCK_DATASETS } from '@/data/mock-datasets';
import { useBiProductBasePath, withBiProductBasePath } from '@/hooks/useBiProductBasePath';
import styles from './DatasetDetail.module.css';

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

function VariableTypeIcon({ kind }: { kind: DatasetVariableKind }) {
  if (kind === 'numeric') {
    return (
      <span className={`${styles.typeIcon} ${styles.typeIconNumeric}`} aria-hidden>
        123
      </span>
    );
  }
  if (kind === 'category') {
    return (
      <span className={`${styles.typeIcon} ${styles.typeIconCategory}`} aria-hidden>
        ▣
      </span>
    );
  }
  return (
    <span className={`${styles.typeIcon} ${styles.typeIconQuestion}`} aria-hidden>
      Σ
    </span>
  );
}

export default function DatasetDetailPage() {
  const params = useParams();
  const { showToast } = useWuShowToast();
  const basePath = useBiProductBasePath();
  const datasetsPath = withBiProductBasePath(basePath, '/datasets');
  const datasetId = Number(params.id);
  const dataset = MOCK_DATASETS.find((item) => item.id === datasetId);
  const detail = useMemo(() => getDatasetDetailData(datasetId), [datasetId]);

  const [variableSearch, setVariableSearch] = useState('');
  const [responseSearch, setResponseSearch] = useState('');
  const [variables, setVariables] = useState<DatasetVariable[]>(detail?.variables ?? []);
  const [selectedRows, setSelectedRows] = useState<DatasetVariable[]>(() => {
    if (!detail) return [];
    return detail.variables.filter((variable) =>
      detail.defaultSelectedVariableIds.includes(variable.id)
    );
  });
  const [deleteTarget, setDeleteTarget] = useState<DatasetVariable | null>(null);

  useEffect(() => {
    const nextDetail = getDatasetDetailData(datasetId);
    if (!nextDetail) {
      setVariables([]);
      setSelectedRows([]);
      return;
    }
    setVariableSearch('');
    setResponseSearch('');
    setVariables(nextDetail.variables);
    setSelectedRows(
      nextDetail.variables.filter((variable) =>
        nextDetail.defaultSelectedVariableIds.includes(variable.id)
      )
    );
    setDeleteTarget(null);
  }, [datasetId]);

  const selectedVariables = selectedRows;

  const previewRows = useMemo(() => {
    if (!detail) return [];
    const term = responseSearch.trim().toLowerCase();
    return detail.rows.filter((row) => {
      if (!term) return true;
      return String(row.responseId).includes(term);
    });
  }, [detail, responseSearch]);

  const rowSelection: IWuTableRowSelection<DatasetVariable> = {
    isEnabled: true,
    selectedRows,
    onRowSelect: setSelectedRows,
    rowUniqueKey: 'id',
  };

  function handleUpload(): void {
    showToast({
      message: 'Upload data will be available in a future update.',
      variant: 'info',
    });
  }

  function handleEditVariable(variable: DatasetVariable): void {
    showToast({
      message: `Editing "${variable.name}" will be available in a future update.`,
      variant: 'info',
    });
  }

  function handleConfirmDelete(): void {
    if (!deleteTarget) return;
    setVariables((prev) => prev.filter((variable) => variable.id !== deleteTarget.id));
    setSelectedRows((prev) => prev.filter((variable) => variable.id !== deleteTarget.id));
    showToast({
      message: `"${deleteTarget.name}" deleted`,
      variant: 'success',
    });
    setDeleteTarget(null);
  }

  const variableColumns: IWuTableColumnDef<DatasetVariable>[] = [
    {
      accessorKey: 'name',
      header: 'Variable name',
      filterable: true,
      enableSorting: false,
      size: 148,
      cell: ({ row }) => (
        <div className={styles.variableNameCell}>
          <VariableTypeIcon kind={row.original.kind} />
          <span className={styles.variableLabel}>{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'responses',
      header: 'Responses',
      headerAlign: 'left',
      cellAlign: 'left',
      enableSorting: false,
      size: 120,
      cell: ({ row }) => (
        <div className={styles.responsesCell}>
          <span className={styles.responsesValue}>{row.original.responses}</span>
          <div className={styles.rowActions}>
            <WuTooltip content="Edit" position="top">
              <button
                type="button"
                className={styles.rowActionButton}
                aria-label={`Edit ${row.original.name}`}
                onClick={() => handleEditVariable(row.original)}
              >
                <span className="wm-edit" aria-hidden />
              </button>
            </WuTooltip>
            <WuTooltip content="Delete" position="top">
              <button
                type="button"
                className={`${styles.rowActionButton} ${styles.rowActionButtonDelete}`}
                aria-label={`Delete ${row.original.name}`}
                onClick={() => setDeleteTarget(row.original)}
              >
                <span className="wm-delete" aria-hidden />
              </button>
            </WuTooltip>
          </div>
        </div>
      ),
    },
  ];

  const previewColumns: IWuTableColumnDef<Record<string, string | number>>[] = [
    {
      accessorKey: 'responseId',
      header: 'Response ID',
      enableSorting: false,
      cell: ({ row }) => row.original.responseId,
    },
    ...selectedVariables.map((variable) => ({
      accessorKey: variable.id,
      header: variable.name,
      enableSorting: false,
      cell: ({
        row,
      }: {
        row: { original: Record<string, string | number> };
      }) => (
        <span className={styles.previewCell} title={String(row.original[variable.id] ?? '')}>
          {row.original[variable.id] ?? ''}
        </span>
      ),
    })),
  ];

  const previewTableData = previewRows.map((row) => {
    const record: Record<string, string | number> = { responseId: row.responseId };
    for (const variable of selectedVariables) {
      record[variable.id] = row.values[variable.id] ?? '';
    }
    return record;
  });

  if (!dataset || !detail) {
    return (
      <div className={styles.page}>
        <div className="px-8 pt-8">
          <EmptyState
            icon="wm-search-off"
            title="Dataset not found"
            description="This dataset may have been deleted or you do not have access."
            action={
              <Link href={datasetsPath}>
                <WuButton>Back to Datasets</WuButton>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{dataset.name}</h1>
        <WuButton
          className={styles.uploadBtn}
          Icon={<span className="wm-cloud-upload" aria-hidden />}
          onClick={handleUpload}
        >
          Upload data
        </WuButton>
      </header>

      <div className={styles.metaRow}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Datasource type</span>
          <span className={styles.metaPill}>{dataset.dataType}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Datasource name</span>
          <span className={styles.metaPill}>{dataset.name}</span>
        </div>
      </div>

      <div className={styles.content}>
        <section className={styles.panel} aria-label="Variables">
          <div className={styles.panelSearch}>
            <WuInput
              type="search"
              value={variableSearch}
              onChange={(event) => setVariableSearch(event.target.value)}
              placeholder="Search variables"
              aria-label="Search variables"
              variant="outlined"
              Icon={<span className="wm-search" aria-hidden />}
              iconPosition="left"
            />
          </div>
          <div className={styles.tableWrap}>
            <WuTable
              data={variables as unknown[]}
              columns={variableColumns as unknown as IWuTableColumnDef<unknown>[]}
              variant="striped"
              size="compact"
              sort={{ enabled: false }}
              filterText={variableSearch}
              tableLayout="fixed"
              className={styles.variablesTable}
              rowSelection={
                rowSelection as unknown as IWuTableRowSelection<unknown>
              }
              NoDataContent={
                <EmptyState
                  title="No variables found"
                  description="Try a different search term."
                />
              }
            />
          </div>
        </section>

        <section className={styles.panel} aria-label="Data preview">
          <div className={styles.panelSearch}>
            <WuInput
              type="search"
              value={responseSearch}
              onChange={(event) => setResponseSearch(event.target.value)}
              placeholder="Search by Response ID"
              aria-label="Search by Response ID"
              variant="outlined"
              Icon={<span className="wm-search" aria-hidden />}
              iconPosition="left"
            />
          </div>
          <div className={styles.tableWrap}>
            {selectedVariables.length === 0 ? (
              <EmptyState
                title="Select variables"
                description="Choose one or more variables on the left to preview responses."
              />
            ) : (
              <WuTable
                data={previewTableData as unknown[]}
                columns={previewColumns as unknown as IWuTableColumnDef<unknown>[]}
                variant="striped"
                size="compact"
                sort={{ enabled: false }}
                tableLayout="fixed"
                className={styles.previewTable}
                NoDataContent={
                  <EmptyState
                    title="No responses found"
                    description="Try a different Response ID."
                  />
                }
              />
            )}
          </div>
        </section>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete variable?"
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
