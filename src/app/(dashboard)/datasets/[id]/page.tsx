'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type { IWuTableColumnDef, IWuTableRowSelection } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { CreateVariableModal } from '@/components/datasets/CreateVariableModal';
import { DatasetImportSourceView } from '@/components/datasets/DatasetImportSourceView';
import { UploadDataModal } from '@/components/datasets/UploadDataModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  getDatasetDetailData,
  type DatasetResponseRow,
  type DatasetVariable,
  type DatasetVariableKind,
} from '@/data/mock-dataset-detail';
import {
  TEXT_AI_PROCESS_MS,
  buildTextAiColumnValues,
  createTextAiProcessingVariables,
  createTextAiReadyVariables,
  expandVariablesForPreview,
  getTextAiOptionCount,
  isTextAiExpandableVariable,
  isTextAiProcessingVariable,
  isTextAiVariableId,
} from '@/data/mock-dataset-textai';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useWuShowToast();
  const basePath = useBiProductBasePath();
  const datasetsPath = withBiProductBasePath(basePath, '/datasets');
  const datasetId = Number(params.id);
  const dataset = MOCK_DATASETS.find((item) => item.id === datasetId);
  const detail = useMemo(() => getDatasetDetailData(datasetId), [datasetId]);
  const textAiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const responseRowsRef = useRef<DatasetResponseRow[]>(detail?.rows ?? []);
  const textAiImportStartedRef = useRef(false);

  const [variableSearch, setVariableSearch] = useState('');
  const [responseSearch, setResponseSearch] = useState('');
  const [variables, setVariables] = useState<DatasetVariable[]>(detail?.variables ?? []);
  const [responseRows, setResponseRows] = useState<DatasetResponseRow[]>(detail?.rows ?? []);
  const [selectedRows, setSelectedRows] = useState<DatasetVariable[]>(() => {
    if (!detail) return [];
    return detail.variables.filter((variable) =>
      detail.defaultSelectedVariableIds.includes(variable.id)
    );
  });
  const [deleteTarget, setDeleteTarget] = useState<DatasetVariable | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadSource, setUploadSource] = useState<'manual' | 'textai'>('manual');
  const [isCreateVariableOpen, setIsCreateVariableOpen] = useState(false);
  const [datasetName, setDatasetName] = useState(dataset?.name ?? '');

  function clearTextAiTimer(): void {
    if (textAiTimerRef.current) {
      clearTimeout(textAiTimerRef.current);
      textAiTimerRef.current = null;
    }
  }

  useEffect(() => {
    responseRowsRef.current = responseRows;
  }, [responseRows]);

  useEffect(() => {
    const nextDetail = getDatasetDetailData(datasetId);
    clearTextAiTimer();
    textAiImportStartedRef.current = false;
    if (!nextDetail) {
      setVariables([]);
      setResponseRows([]);
      responseRowsRef.current = [];
      setSelectedRows([]);
      return;
    }
    setVariableSearch('');
    setResponseSearch('');
    setVariables(nextDetail.variables);
    setResponseRows(nextDetail.rows);
    responseRowsRef.current = nextDetail.rows;
    setSelectedRows(
      nextDetail.variables.filter((variable) =>
        nextDetail.defaultSelectedVariableIds.includes(variable.id)
      )
    );
    setDeleteTarget(null);
    setIsUploadOpen(false);
    setUploadSource('manual');
    setIsCreateVariableOpen(false);
    const nextDataset = MOCK_DATASETS.find((item) => item.id === datasetId);
    setDatasetName(nextDataset?.name ?? '');
  }, [datasetId]);

  useEffect(() => {
    return () => {
      clearTextAiTimer();
    };
  }, []);

  const selectedVariables = selectedRows.filter(
    (variable) => !isTextAiProcessingVariable(variable)
  );

  const previewRows = useMemo(() => {
    const term = responseSearch.trim().toLowerCase();
    return responseRows.filter((row) => {
      if (!term) return true;
      return String(row.responseId).includes(term);
    });
  }, [responseRows, responseSearch]);

  const rowSelection: IWuTableRowSelection<DatasetVariable> = {
    isEnabled: true,
    selectedRows,
    onRowSelect: (next) => {
      setSelectedRows((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        return resolved.filter((variable) => !isTextAiProcessingVariable(variable));
      });
    },
    rowUniqueKey: 'id',
  };

  function startTextAiImport(sourceLabel: string): void {
    clearTextAiTimer();
    const processingVariables = createTextAiProcessingVariables();
    const existingSurveyVariables = variables.filter(
      (variable) => !isTextAiVariableId(variable.id)
    );
    let surveyVariables = existingSurveyVariables;
    let surveyRows = responseRowsRef.current;

    if (surveyVariables.length === 0) {
      const target = MOCK_DATASETS.find((item) => item.id === datasetId);
      if (target) {
        target.variableCount = Math.max(target.variableCount, 12);
        target.rowCount = Math.max(target.rowCount, 8400);
      }
      const seeded = getDatasetDetailData(datasetId);
      surveyVariables = seeded?.variables ?? [];
      surveyRows = seeded?.rows ?? [];
      setResponseRows(surveyRows);
      responseRowsRef.current = surveyRows;
      setSelectedRows(surveyVariables.slice(0, 2));
    }

    setVariables([...surveyVariables, ...processingVariables]);
    setSelectedRows((prev) => {
      const withoutTextAi = prev.filter((variable) => !isTextAiVariableId(variable.id));
      return withoutTextAi.length > 0 ? withoutTextAi : surveyVariables.slice(0, 2);
    });
    showToast({
      message: `Importing themes, sub-themes and sentiment from "${sourceLabel}". Processing…`,
      variant: 'info',
    });

    textAiTimerRef.current = setTimeout(() => {
      const currentRows = responseRowsRef.current;
      const responseCount = currentRows.length;
      const readyVariables = createTextAiReadyVariables(responseCount);
      const nextRows = currentRows.map((row) => ({
        ...row,
        values: {
          ...row.values,
          ...buildTextAiColumnValues(row.responseId),
        },
      }));

      setVariables((prev) => {
        const withoutTextAi = prev.filter((variable) => !isTextAiVariableId(variable.id));
        return [...withoutTextAi, ...readyVariables];
      });
      setResponseRows(nextRows);
      responseRowsRef.current = nextRows;
      setSelectedRows((prev) => prev.filter((variable) => !isTextAiVariableId(variable.id)));
      showToast({
        message: 'Themes, sub-themes and sentiment are ready.',
        variant: 'success',
      });
      textAiTimerRef.current = null;
    }, TEXT_AI_PROCESS_MS);
  }

  useEffect(() => {
    const report = searchParams.get('textAiReport');
    if (!report || !detail || textAiImportStartedRef.current) return;
    textAiImportStartedRef.current = true;
    startTextAiImport(report);
    router.replace(`${datasetsPath}/${datasetId}`);
  }, [datasetId, datasetsPath, detail, router, searchParams]);

  function handleManualImport(_fileName: string): void {
    const seeded: DatasetVariable[] = [
      { id: `col-1-${datasetId}`, name: 'Response ID', kind: 'numeric', responses: 12 },
      { id: `col-2-${datasetId}`, name: 'Q1', kind: 'question', responses: 12 },
      { id: `col-3-${datasetId}`, name: 'Q2', kind: 'question', responses: 11 },
      { id: `col-4-${datasetId}`, name: 'Segment', kind: 'category', responses: 12 },
    ];
    const rows: DatasetResponseRow[] = Array.from({ length: 8 }, (_, index) => {
      const responseId = index + 1;
      return {
        responseId,
        values: {
          [seeded[0].id]: String(responseId),
          [seeded[1].id]: `Answer ${responseId}A`,
          [seeded[2].id]: `Answer ${responseId}B`,
          [seeded[3].id]: ['A', 'B', 'C', 'D'][index % 4],
        },
      };
    });
    setVariables(seeded);
    setResponseRows(rows);
    responseRowsRef.current = rows;
    setSelectedRows(seeded.slice(0, 2));
    const target = MOCK_DATASETS.find((item) => item.id === datasetId);
    if (target) {
      target.variableCount = seeded.length;
      target.rowCount = rows.length;
    }
  }

  function handleUpload(source: 'manual' | 'textai' = 'manual'): void {
    setUploadSource(source);
    setIsUploadOpen(true);
  }

  function handleSyncAll(): void {
    const isExternalWithTextAi =
      dataset?.dataType === 'External' && variables.some((variable) => isTextAiVariableId(variable.id));
    if (isExternalWithTextAi) {
      startTextAiImport('TextAI');
      return;
    }
    showToast({
      message: `Syncing all data for "${dataset?.name ?? 'dataset'}"…`,
      variant: 'success',
    });
  }

  function handleCreateVariable(): void {
    setIsCreateVariableOpen(true);
  }

  function handleVariableCreated(payload: {
    source: 'composite' | 'textai';
    name: string;
  }): void {
    if (payload.source === 'textai') {
      startTextAiImport(payload.name);
      return;
    }
    const newVariable: DatasetVariable = {
      id: `custom-${Date.now()}`,
      name: payload.name,
      kind: 'category',
      responses: 0,
      status: 'ready',
    };
    setVariables((prev) => [...prev, newVariable]);
    showToast({
      message: `"${payload.name}" created`,
      variant: 'success',
    });
  }

  function handleEditVariable(variable: DatasetVariable): void {
    if (isTextAiProcessingVariable(variable)) return;
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
      cell: ({ row }) => {
        const isProcessing = isTextAiProcessingVariable(row.original);
        const optionCount = isTextAiExpandableVariable(row.original)
          ? getTextAiOptionCount(row.original.id)
          : null;
        return (
          <div className={styles.variableNameCell}>
            {isProcessing ? (
              <span className={`${styles.typeIcon} ${styles.typeIconProcessing}`} aria-hidden>
                <span className={`wm-sync ${styles.processingSpinner}`} />
              </span>
            ) : (
              <VariableTypeIcon kind={row.original.kind} />
            )}
            <span className={styles.variableLabel}>{row.original.name}</span>
            {isProcessing ? (
              <span className={styles.processingBadge}>Processing</span>
            ) : null}
            {optionCount ? (
              <span className={styles.optionCountBadge}>{optionCount} options</span>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: 'responses',
      header: 'Responses',
      headerAlign: 'left',
      cellAlign: 'left',
      enableSorting: false,
      size: 120,
      cell: ({ row }) => {
        const isProcessing = isTextAiProcessingVariable(row.original);
        return (
          <div className={styles.responsesCell}>
            <span className={styles.responsesValue}>
              {isProcessing ? '…' : row.original.responses}
            </span>
            {!isProcessing ? (
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
            ) : null}
          </div>
        );
      },
    },
  ];

  const previewColumns: IWuTableColumnDef<Record<string, string | number>>[] = [
    {
      accessorKey: 'responseId',
      header: 'Response ID',
      enableSorting: false,
      cell: ({ row }) => row.original.responseId,
    },
    ...expandVariablesForPreview(selectedVariables).map((column) => ({
      accessorKey: column.id,
      header: column.name,
      enableSorting: false,
      cell: ({
        row,
      }: {
        row: { original: Record<string, string | number> };
      }) => (
        <span className={styles.previewCell} title={String(row.original[column.id] ?? '')}>
          {row.original[column.id] ?? ''}
        </span>
      ),
    })),
  ];

  const previewTableData = previewRows.map((row) => {
    const record: Record<string, string | number> = { responseId: row.responseId };
    for (const column of expandVariablesForPreview(selectedVariables)) {
      record[column.id] = row.values[column.id] ?? '';
    }
    return record;
  });

  const isComposite = dataset?.dataType === 'Survey (Composite)';
  const isExternal = dataset?.dataType === 'External';
  const hasTextAiData = variables.some((variable) => isTextAiVariableId(variable.id));
  const showImportSetup = Boolean(isExternal && variables.length === 0);

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

  if (showImportSetup) {
    return (
      <>
        <DatasetImportSourceView
          datasetName={datasetName}
          surveyName={dataset.surveyName ?? dataset.name}
          onSyncAll={handleSyncAll}
          onUploadData={() => handleUpload('manual')}
          onManualImport={() => handleUpload('manual')}
          onTextAiImport={() => handleUpload('textai')}
        />

        <UploadDataModal
          key={`setup-upload-${uploadSource}`}
          open={isUploadOpen}
          onOpenChange={setIsUploadOpen}
          datasetName={datasetName.trim() || dataset.name}
          initialSource={uploadSource}
          showSourcePicker={false}
          showUploadMode={false}
          onManualImport={handleManualImport}
          onTextAiImport={() => startTextAiImport('TextAI')}
        />
      </>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{datasetName || dataset.name}</h1>
        {isComposite ? (
          <div className={styles.headerActions}>
            <button type="button" className={styles.syncAllBtn} onClick={handleSyncAll}>
              <span className="wm-sync" aria-hidden />
              Sync all
            </button>
            <WuButton
              className={styles.createVariableBtn}
              Icon={<span className="wm-add" aria-hidden />}
              onClick={handleCreateVariable}
            >
              Create variable
            </WuButton>
          </div>
        ) : (
          <div className={styles.headerActions}>
            {hasTextAiData ? (
              <button type="button" className={styles.syncAllBtn} onClick={handleSyncAll}>
                <span className="wm-sync" aria-hidden />
                Sync all
              </button>
            ) : null}
            <WuButton
              className={styles.uploadBtn}
              Icon={<span className="wm-cloud-upload" aria-hidden />}
              onClick={() => handleUpload('manual')}
            >
              Upload data
            </WuButton>
          </div>
        )}
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
              stickyHeader
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
                stickyHeader
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

      <CreateVariableModal
        open={isCreateVariableOpen}
        onOpenChange={setIsCreateVariableOpen}
        onCreate={handleVariableCreated}
      />

      <UploadDataModal
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        datasetName={datasetName.trim() || dataset.name}
        initialSource={uploadSource}
        showSourcePicker
        showUploadMode
        onManualImport={handleManualImport}
        onTextAiImport={() => startTextAiImport('TextAI')}
      />

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
