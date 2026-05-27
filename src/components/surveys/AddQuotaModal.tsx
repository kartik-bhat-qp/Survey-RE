'use client';

import { useCallback } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { ADD_QUOTA_OPTIONS, type AddQuotaType } from '@/data/mock-add-quota-options';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './AddQuotaModal.module.css';

interface AddQuotaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType?: (type: AddQuotaType) => void;
}

export function AddQuotaModal({ open, onOpenChange, onSelectType }: AddQuotaModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  function handleSelect(type: AddQuotaType, title: string) {
    if (onSelectType) {
      onSelectType(type);
      handleOpenChange(false);
      return;
    }
    handleOpenChange(false);
    showToast({ message: `Selected ${title}`, variant: 'success' });
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalContent, WuModalHeader } = wick;

  return (
    <WuModal open onOpenChange={handleOpenChange} className={styles.modal} variant="action">
      <WuModalContent className={styles.content}>
        <WuModalHeader className={styles.header}>Add Quota</WuModalHeader>
        <div className={styles.body}>
          <p className={styles.instructions}>
            Select the type of quota you would like to add.
          </p>
          <div className={styles.cardGrid}>
            {ADD_QUOTA_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={styles.card}
                onClick={() => handleSelect(option.id, option.title)}
              >
                <div className={styles.cardTitleRow}>
                  <span className={styles.cardTitle}>
                    {option.title}
                    {option.id === 'advanced' ? (
                      <span className={styles.comingSoonBadge}>Coming soon</span>
                    ) : null}
                  </span>
                  <span className={`${option.icon} ${styles.cardIcon}`} aria-hidden />
                </div>
                <p className={styles.cardDescription}>{option.description}</p>
              </button>
            ))}
          </div>
        </div>
      </WuModalContent>
    </WuModal>
  );
}
