'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  resolveCrossVariableEditState,
  type CrossVariableQuotaBatch,
  type CrossVariableQuotaSaveResult,
  type CrossVariableTrackingSet,
} from '@/data/mock-cross-variable-quota';
import type { AdvanceQuota } from '@/data/mock-advance-quotas';
import { CrossVariableQuotaTrackingMatrix } from '@/components/surveys/CrossVariableQuotaTrackingMatrix';
import { CrossVariableQuotaEditModal } from '@/components/surveys/CrossVariableQuotaEditModal';
import { CrossVariableExcelImportModal } from '@/components/surveys/CrossVariableExcelImportModal';
import styles from './CrossVariableQuotaTrackingPanel.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

interface CrossVariableQuotaTrackingPanelProps {
  trackingSets: CrossVariableTrackingSet[];
  batches: CrossVariableQuotaBatch[];
  clientView?: boolean;
  onUpdateBatch?: (result: CrossVariableQuotaSaveResult) => void;
  onImportCurrents?: (batchId: string, quotas: AdvanceQuota[]) => void;
}

export function CrossVariableQuotaTrackingPanel({
  trackingSets,
  batches,
  clientView = false,
  onUpdateBatch,
  onImportCurrents,
}: CrossVariableQuotaTrackingPanelProps) {
  const { showToast } = useWuShowToast();
  const [activeBatchId, setActiveBatchId] = useState(trackingSets[0]?.batchId ?? '');
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const batchOptions = useMemo(
    () =>
      trackingSets.map((set, index) => {
        const batchNum = trackingSets.length - index;
        return {
          value: set.batchId,
          label: `Matrix ${batchNum} · ${set.rows.length} combinations`,
        };
      }),
    [trackingSets]
  );

  const activeSet = useMemo(
    () => trackingSets.find((set) => set.batchId === activeBatchId) ?? trackingSets[0],
    [activeBatchId, trackingSets]
  );

  const activeBatch = useMemo(
    () => batches.find((batch) => batch.id === activeSet?.batchId),
    [activeSet?.batchId, batches]
  );

  const importEditState = useMemo(() => {
    if (!activeSet) return null;
    return resolveCrossVariableEditState(activeSet.rows, activeBatch);
  }, [activeBatch, activeSet]);

  const summary = useMemo(() => {
    if (!activeSet) {
      return { current: 0, target: 0, pct: 0 };
    }

    const target = activeSet.rows.reduce((sum, row) => sum + row.target, 0);
    const current = activeSet.rows.reduce((sum, row) => sum + (row.current ?? 0), 0);
    const pct = target === 0 ? 0 : Math.min((current / target) * 100, 100);

    return { current, target, pct };
  }, [activeSet]);

  if (trackingSets.length === 0) {
    return (
      <div className={styles.emptyPanel}>
        <p className={styles.emptyTitle}>No cross variable matrix to track</p>
        <p className={styles.emptyDescription}>
          Add a cross variable quota and save the matrix to see fill progress in this view.
        </p>
      </div>
    );
  }

  if (!activeSet || !importEditState) {
    return null;
  }

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.totalProgress}>
          <span className={styles.totalProgressLabel}>Total progress</span>
          <span className={styles.totalProgressValue}>
            {summary.current.toLocaleString()}/{summary.target.toLocaleString()}
          </span>
          <span className={styles.totalProgressMeta}>({Math.round(summary.pct)}%)</span>
          <span className={styles.totalProgressBar} aria-hidden>
            <span
              className={styles.totalProgressBarFill}
              style={{ width: `${summary.pct}%` }}
            />
          </span>
        </div>
        <div className={styles.toolbarActions}>
          {trackingSets.length > 1 ? (
            <div className={styles.batchSelect}>
              <WuSelect
                data={batchOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={batchOptions.find((option) => option.value === activeSet.batchId)}
                variant="outlined"
                onSelect={(option) => {
                  if (option && typeof option === 'object' && 'value' in option) {
                    setActiveBatchId(String(option.value));
                  }
                }}
              />
            </div>
          ) : null}
          {!clientView ? (
            <div className={styles.iconActions}>
              <button
                type="button"
                className={styles.iconBtn}
                title="Edit matrix"
                aria-label="Edit matrix"
                onClick={() => setEditOpen(true)}
              >
                <span className="wm-edit" aria-hidden />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                title="Import from Excel"
                aria-label="Import from Excel"
                onClick={() => setImportOpen(true)}
              >
                <span className="wm-cloud-upload" aria-hidden />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <CrossVariableQuotaTrackingMatrix trackingSet={activeSet} />

      {!clientView ? (
        <>
          <CrossVariableQuotaEditModal
            open={editOpen}
            onOpenChange={setEditOpen}
            trackingSet={activeSet}
            batch={activeBatch}
            onSave={onUpdateBatch}
          />
          <CrossVariableExcelImportModal
            open={importOpen}
            onOpenChange={setImportOpen}
            mode="current"
            combinationRows={importEditState.combinationRows}
            columns={importEditState.columns}
            quotas={activeSet.rows}
            onImportCurrents={(quotas, result) => {
              onImportCurrents?.(activeSet.batchId, quotas);
              showToast({
                message: `Imported fill counts for ${result.updated} row${
                  result.updated === 1 ? '' : 's'
                }${result.skipped > 0 ? ` (${result.skipped} skipped)` : ''}`,
                variant: 'success',
              });
            }}
          />
        </>
      ) : null}
    </div>
  );
}
