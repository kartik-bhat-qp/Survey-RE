'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { QuestionQuotaScope } from '@/data/mock-advance-quotas';
import {
  buildCrossVariableQuotas,
  CROSS_VARIABLE_MATRIX_INSTRUCTIONS,
  formatCrossVariableQuotaScope,
  inferCrossVariableMatrixName,
  resolveCrossVariableEditState,
  type CrossVariableMatrixState,
  type CrossVariableQuotaBatch,
  type CrossVariableQuotaSaveResult,
  type CrossVariableTrackingSet,
} from '@/data/mock-cross-variable-quota';
import { CrossVariableQuotaMatrixStep } from '@/components/surveys/CrossVariableQuotaMatrixStep';
import { CrossVariableQuotaTypeStep } from '@/components/surveys/CrossVariableQuotaTypeStep';
import { CrossVariableExcelImportModal } from '@/components/surveys/CrossVariableExcelImportModal';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './CrossVariableQuotaModal.module.css';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

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
  const [quotaScope, setQuotaScope] = useState<QuestionQuotaScope>('max-count');
  const [matrixName, setMatrixName] = useState('');
  const [importOpen, setImportOpen] = useState(false);

  const editState = useMemo(() => {
    if (!trackingSet) return null;
    return resolveCrossVariableEditState(trackingSet.rows, batch);
  }, [batch, trackingSet]);

  useEffect(() => {
    if (!open) return;
    setQuotaScope(
      batch?.quotaScope ??
        trackingSet?.rows.find((quota) => quota.questionQuotaScope)?.questionQuotaScope ??
        'max-count'
    );
    setMatrixName(batch ? inferCrossVariableMatrixName(batch) : 'Cross variable matrix');
  }, [batch, open, trackingSet]);

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
        quotaScope,
        matrixName,
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
            <div className={styles.matrixNameField}>
              <label className={styles.matrixNameLabel} htmlFor="cross-variable-matrix-name">
                Matrix name
              </label>
              <WuInput
                id="cross-variable-matrix-name"
                variant="outlined"
                value={matrixName}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setMatrixName(event.target.value)
                }
                aria-label="Matrix name"
                className={styles.matrixNameInput}
              />
            </div>
            <CrossVariableQuotaTypeStep
              value={quotaScope}
              onChange={setQuotaScope}
              variant="inline"
            />
            <p className={styles.instructions}>{CROSS_VARIABLE_MATRIX_INSTRUCTIONS}</p>
            <p className={styles.matrixSummary}>
              <strong>{formatCrossVariableQuotaScope(quotaScope)}</strong> ·{' '}
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
