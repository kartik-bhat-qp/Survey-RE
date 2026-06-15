'use client';

import dynamic from 'next/dynamic';
import { useWickUILib } from '@/components/ui/useWickUILib';
import type { LookupTableConversionLogicConflict } from '@/data/mock-question-logic';
import modalStyles from './LookupTableBulkConversionModal.module.css';
import styles from './PublishLicenseConflictModal.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

export interface LookupTableBulkConversionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: LookupTableConversionLogicConflict[];
  canSaveAsLookupTable: boolean;
  onRemoveLogic: (conflict: LookupTableConversionLogicConflict) => void;
  onSaveAsLookupTable: () => void;
}

export function LookupTableBulkConversionModal({
  open,
  onOpenChange,
  conflicts,
  canSaveAsLookupTable,
  onRemoveLogic,
  onSaveAsLookupTable,
}: LookupTableBulkConversionModalProps) {
  const wick = useWickUILib();

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose } = wick;

  return (
    <WuModal open onOpenChange={onOpenChange} variant="action" size="md">
      <WuModalHeader>Lookup Table required</WuModalHeader>
      <WuModalContent>
        <p className={styles.intro}>
          To add more than 300 options, this question needs to be converted to a lookup table.
          However, the following is not supported in lookup tables. Please delete them and click on
          save to add the options.
        </p>
        {conflicts.length > 0 ? (
          <ul className={styles.list}>
            {conflicts.map((conflict) => (
              <li key={conflict.logicType} className={styles.item}>
                <div className={styles.itemBody}>
                  <span className={styles.itemMain}>
                    <span className={styles.typeLabel}>{conflict.typeLabel}</span>
                  </span>
                  <span className={styles.requirement}>Not supported on Lookup Table</span>
                </div>
                <WuButton
                  size="sm"
                  variant="iconOnly"
                  className={styles.deleteBtn}
                  aria-label={`Remove ${conflict.typeLabel} logic`}
                  Icon={<span className="wm-delete" />}
                  onClick={() => onRemoveLogic(conflict)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className={modalStyles.emptyState}>
            <span className={`wm-check-circle ${modalStyles.emptyIcon}`} aria-hidden />
            <p className={modalStyles.emptyTitle}>No unsupported logic remaining</p>
            <p className={modalStyles.emptyDescription}>
              Click Save as lookup table to convert this question and add your options.
            </p>
          </div>
        )}
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Close</WuModalClose>
        {canSaveAsLookupTable ? (
          <WuButton onClick={onSaveAsLookupTable}>Save as lookup table</WuButton>
        ) : null}
      </WuModalFooter>
    </WuModal>
  );
}
