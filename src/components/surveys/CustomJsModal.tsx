'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './CustomJsModal.module.css';

interface CustomJsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSave: (value: string) => void;
}

export function CustomJsModal({ open, onOpenChange, value, onSave }: CustomJsModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
  }, [open, value]);

  const handleModalOpenChange = useCallback(
    (nextOpen: boolean) => {
      queueMicrotask(() => onOpenChange(nextOpen));
    },
    [onOpenChange]
  );

  function handleSave(): void {
    onSave(draft);
    showToast({ message: 'Custom JS saved', variant: 'success' });
    handleModalOpenChange(false);
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } =
    wick;

  return (
    <WuModal
      open
      onOpenChange={handleModalOpenChange}
      className={styles.modal}
      variant="action"
      size="md"
    >
      <WuModalHeader className={styles.header}>
        <span className={styles.headerTitle}>Custom JS</span>
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        <textarea
          className={styles.textarea}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add javascript here"
          aria-label="Custom JavaScript"
          spellCheck={false}
        />
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton onClick={handleSave}>Save Changes</WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
