'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './BulkEditOptionsModal.module.css';

export interface BulkEditLinesModalProps {
  open: boolean;
  title: string;
  fieldLabel: string;
  lines: string[];
  onOpenChange: (open: boolean) => void;
  onSave: (lines: string[]) => void;
}

function parseLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function BulkEditLinesModal({
  open,
  title,
  fieldLabel,
  lines,
  onOpenChange,
  onSave,
}: BulkEditLinesModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [bulkText, setBulkText] = useState('');
  const initialText = useMemo(() => lines.join('\n'), [lines]);

  useEffect(() => {
    if (!open) return;
    setBulkText(initialText);
  }, [open, initialText]);

  const parsedLines = useMemo(() => parseLines(bulkText), [bulkText]);
  const canSave = parsedLines.length > 0;
  const isDirty = bulkText !== initialText;

  function handleSave(): void {
    if (!canSave) {
      showToast({ message: 'Add at least one line', variant: 'error' });
      return;
    }
    onSave(parsedLines);
    onOpenChange(false);
    showToast({ message: 'Labels updated', variant: 'success' });
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton } = wick;

  return (
    <WuModal open onOpenChange={onOpenChange} size="lg" className={styles.modalWide} variant="action">
      <WuModalHeader className={styles.modalTitle}>{title}</WuModalHeader>
      <WuModalContent>
        <div className={styles.modalContent}>
          <p className={styles.fieldLabel}>{fieldLabel}</p>
          <textarea
            className={styles.bulkTextarea}
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            aria-label={fieldLabel}
            rows={8}
          />
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className={styles.footerActions}>
          <button type="button" className={styles.cancelLink} onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <WuButton onClick={handleSave} disabled={!canSave || !isDirty}>
            Save
          </WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
