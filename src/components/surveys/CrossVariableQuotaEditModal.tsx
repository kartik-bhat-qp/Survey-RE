'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  buildCrossVariableQuotas,
  CROSS_VARIABLE_MATRIX_INSTRUCTIONS,
  resolveCrossVariableEditState,
  type CrossVariableMatrixState,
  type CrossVariableQuotaBatch,
  type CrossVariableQuotaSaveResult,
  type CrossVariableTrackingSet,
} from '@/data/mock-cross-variable-quota';
import { CrossVariableQuotaMatrixStep } from '@/components/surveys/CrossVariableQuotaMatrixStep';
import { CrossVariableExcelImportModal } from '@/components/surveys/CrossVariableExcelImportModal';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './CrossVariableQuotaModal.module.css';

interface CrossVariableQuotaEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackingSet: CrossVariableTrackingSet | null;
  batch?: CrossVariableQuotaBatch;
  onSave?: (result: CrossVariableQuotaSaveResult) => void;
}

export function CrossVariableQuotaEditModal({
  open,
  onOpenChange,
  trackingSet,
  batch,
  onSave,
}: CrossVariableQuotaEditModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [matrix, setMatrix] = useState<CrossVariableMatrixState>({ cells: {} });
  const [importOpen, setImportOpen] = useState(false);

  const editState = useMemo(() => {
    if (!trackingSet) return null;
    return resolveCrossVariableEditState(trackingSet.rows, batch);
  }, [batch, trackingSet]);

  useEffect(() => {
    if (!open || !editState) return;
    setMatrix(editState.matrix);
  }, [editState, open]);

  function handleClose(nextOpen: boolean): void {
    if (!nextOpen) {
      setImportOpen(false);
    }
    onOpenChange(nextOpen);
  }

  function handleSave(): void {
    if (!trackingSet || !editState) return;

    const result = buildCrossVariableQuotas(
      editState.combinationRows,
      editState.columns,
      matrix,
      trackingSet.quotaGroup,
      {
        batchId: trackingSet.batchId,
        existingQuotas: trackingSet.rows,
      }
    );

    onSave?.(result);
    showToast({ message: 'Cross variable quota matrix updated', variant: 'success' });
    handleClose(false);
  }

  if (!open || !wick || !trackingSet || !editState) {
    return null;
  }

  const { WuModal, WuModalContent, WuModalHeader, WuModalFooter, WuButton } = wick;
  const { combinationRows, columns } = editState;

  return (
    <>
      <WuModal
        open
        onOpenChange={handleClose}
        className={`${styles.modal} ${styles.modalWide}`}
        variant="action"
      >
        <WuModalHeader className={styles.header}>Edit cross variable quota matrix</WuModalHeader>
        <WuModalContent className={styles.content}>
          <div className={styles.body}>
            <p className={styles.instructions}>{CROSS_VARIABLE_MATRIX_INSTRUCTIONS}</p>
            <p className={styles.matrixSummary}>
              <strong>{combinationRows.length}</strong> primary combinations ·{' '}
              <strong>{columns.length}</strong> column options
            </p>
            <CrossVariableQuotaMatrixStep
              rows={combinationRows}
              columns={columns}
              matrix={matrix}
              onMatrixChange={setMatrix}
            />
          </div>
        </WuModalContent>
        <WuModalFooter>
          <div className={styles.footerActions}>
            <WuButton variant="secondary" onClick={() => setImportOpen(true)}>
              Import from Excel
            </WuButton>
            <div className={styles.footerButtons}>
              <WuButton variant="secondary" onClick={() => handleClose(false)}>
                Cancel
              </WuButton>
              <WuButton onClick={handleSave}>Save</WuButton>
            </div>
          </div>
        </WuModalFooter>
      </WuModal>

      <CrossVariableExcelImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        mode="targets"
        combinationRows={combinationRows}
        columns={columns}
        matrix={matrix}
        onImportTargets={(nextMatrix, result) => {
          setMatrix(nextMatrix);
          showToast({
            message: `Imported ${result.updated} row${result.updated === 1 ? '' : 's'}${
              result.skipped > 0 ? ` (${result.skipped} skipped)` : ''
            }`,
            variant: 'success',
          });
        }}
      />
    </>
  );
}
