'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  applyExcelImportToMatrix,
  applyExcelImportToQuotaCurrents,
  downloadCrossVariableTemplate,
  readSpreadsheetFile,
  type CrossVariableExcelImportMode,
  type CrossVariableExcelImportResult,
} from '@/data/cross-variable-excel';
import type {
  CrossVariableCombinationRow,
  CrossVariableColumn,
  CrossVariableMatrixState,
} from '@/data/mock-cross-variable-quota';
import type { AdvanceQuota } from '@/data/mock-advance-quotas';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './CrossVariableExcelImportModal.module.css';

interface CrossVariableExcelImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CrossVariableExcelImportMode;
  combinationRows: CrossVariableCombinationRow[];
  columns: CrossVariableColumn[];
  matrix?: CrossVariableMatrixState;
  quotas?: AdvanceQuota[];
  onImportTargets?: (
    matrix: CrossVariableMatrixState,
    result: CrossVariableExcelImportResult
  ) => void;
  onImportCurrents?: (
    quotas: AdvanceQuota[],
    result: CrossVariableExcelImportResult
  ) => void;
}

export function CrossVariableExcelImportModal({
  open,
  onOpenChange,
  mode,
  combinationRows,
  columns,
  matrix,
  quotas = [],
  onImportTargets,
  onImportCurrents,
}: CrossVariableExcelImportModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsProcessing(true);
    try {
      const sheet = await readSpreadsheetFile(file);

      if (mode === 'targets' && matrix && onImportTargets) {
        const { matrix: nextMatrix, result } = applyExcelImportToMatrix(
          combinationRows,
          columns,
          matrix,
          sheet
        );
        onImportTargets(nextMatrix, result);
        onOpenChange(false);
        return;
      }

      if (mode === 'current' && onImportCurrents) {
        const { quotas: nextQuotas, result } = applyExcelImportToQuotaCurrents(
          quotas,
          columns,
          sheet
        );
        onImportCurrents(nextQuotas, result);
        onOpenChange(false);
        return;
      }

      showToast({ message: 'Unable to apply import', variant: 'error' });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Failed to read file',
        variant: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalContent, WuModalHeader, WuModalFooter, WuButton } = wick;
  const title =
    mode === 'targets' ? 'Import quota targets from Excel' : 'Import fill counts from Excel';

  return (
    <WuModal open onOpenChange={onOpenChange} variant="action" className={styles.modal}>
      <WuModalHeader>{title}</WuModalHeader>
      <WuModalContent>
        <div className={styles.body}>
          <p className={styles.description}>
            Upload a CSV file (or Excel saved as CSV). The first row must include{' '}
            <strong>Primary combination</strong>, <strong>Overall</strong>, and column headers
            matching your matrix options.
          </p>
          <p className={styles.hint}>
            {mode === 'targets'
              ? 'Values update overall targets and per-column targets in the matrix.'
              : 'Values update current fill counts shown in the tracking dashboard.'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.tsv"
            className={styles.fileInput}
            onChange={handleFileChange}
          />
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className={styles.footer}>
          <WuButton
            variant="secondary"
            onClick={() =>
              downloadCrossVariableTemplate(
                combinationRows,
                columns,
                mode === 'targets'
                  ? 'cross-variable-targets-template.csv'
                  : 'cross-variable-fills-template.csv'
              )
            }
          >
            Download template
          </WuButton>
          <div className={styles.footerRight}>
            <WuButton variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </WuButton>
            <WuButton
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              {isProcessing ? 'Importing…' : 'Choose file'}
            </WuButton>
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
