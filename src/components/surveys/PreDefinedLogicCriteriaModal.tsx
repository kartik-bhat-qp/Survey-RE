'use client';

import { useCallback } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { MOCK_PRE_DEFINED_LOGIC_CRITERIA } from '@/data/mock-pre-defined-logic-criteria';
import styles from './PreDefinedLogicCriteriaModal.module.css';

interface PreDefinedLogicCriteriaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreDefinedLogicCriteriaModal({
  open,
  onOpenChange,
}: PreDefinedLogicCriteriaModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const criteria = MOCK_PRE_DEFINED_LOGIC_CRITERIA;

  const handleModalOpenChange = useCallback(
    (nextOpen: boolean) => {
      queueMicrotask(() => onOpenChange(nextOpen));
    },
    [onOpenChange]
  );

  function handleAddNewCriteria(): void {
    showToast({
      message: 'Add New Criteria is coming soon.',
      variant: 'info',
    });
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuButton } = wick;

  return (
    <WuModal
      open
      onOpenChange={handleModalOpenChange}
      className={styles.modal}
      variant="action"
      size="md"
    >
      <WuModalHeader className={styles.header}>
        <span className={styles.headerTitle}>Pre-Defined Logic Criteria</span>
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.toolbar}>
          <WuButton onClick={handleAddNewCriteria}>+ Add New Criteria</WuButton>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.nameCol} scope="col">
                  Name
                </th>
                <th className={styles.detailsCol} scope="col">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {criteria.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={2}>
                    No data to display...
                  </td>
                </tr>
              ) : (
                criteria.map((criterion) => (
                  <tr key={criterion.id} className={styles.dataRow}>
                    <td>{criterion.name}</td>
                    <td>{criterion.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </WuModalContent>
    </WuModal>
  );
}
