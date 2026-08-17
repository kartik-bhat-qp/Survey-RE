'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  MOCK_SCALE_LIBRARY,
  SCALE_LIBRARY_SELECT_OPTIONS,
  type ScaleLibrarySelectItem,
} from '@/data/mock-survey-scale-library';
import styles from './BulkEditOptionsModal.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

export interface FlexMatrixEditAnswersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  optionLabels: string[];
  onSave: (optionLabels: string[]) => void;
}

function parseBulkLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function FlexMatrixEditAnswersModal({
  open,
  onOpenChange,
  optionLabels,
  onSave,
}: FlexMatrixEditAnswersModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [bulkText, setBulkText] = useState('');
  const [scaleId, setScaleId] = useState('');

  const initialText = useMemo(() => optionLabels.join('\n'), [optionLabels]);

  useEffect(() => {
    if (!open) return;
    setBulkText(initialText);
    setScaleId('');
  }, [open, initialText]);

  const parsedLines = useMemo(() => parseBulkLines(bulkText), [bulkText]);
  const canSave = parsedLines.length > 0;
  const isDirty = bulkText !== initialText || scaleId !== '';

  function handleScaleSelect(item: ScaleLibrarySelectItem | null): void {
    const nextId = item?.value ?? '';
    setScaleId(nextId);
    if (!nextId) return;
    const entry = MOCK_SCALE_LIBRARY.find((scale) => scale.id === nextId);
    if (entry) {
      setBulkText(entry.options.join('\n'));
    }
  }

  function handleSave(): void {
    if (!canSave) {
      showToast({ message: 'Add at least one answer', variant: 'error' });
      return;
    }
    onSave(parsedLines);
    onOpenChange(false);
    showToast({ message: 'Answers updated', variant: 'success' });
  }

  function handleAddToScaleLibrary(): void {
    showToast({ message: 'Scale saved to library', variant: 'success' });
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton } = wick;
  const selectedScale =
    SCALE_LIBRARY_SELECT_OPTIONS.find((item) => item.value === scaleId) ?? null;

  return (
    <WuModal
      open
      onOpenChange={onOpenChange}
      size="lg"
      className={styles.modalWide}
      variant="action"
    >
      <WuModalHeader className={styles.modalTitle}>Edit in Bulk</WuModalHeader>
      <WuModalContent>
        <div className={styles.modalContent}>
          <div className={styles.labelRow}>
            <p className={styles.fieldLabel}>Answers - (one per line)</p>
            <div className={styles.scaleLibraryField}>
              <span className={styles.scaleLibraryLabel}>Scale Library</span>
              <div className={styles.scaleLibrarySelect}>
                <WuSelect
                  data={SCALE_LIBRARY_SELECT_OPTIONS}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={selectedScale}
                  onSelect={(v) => handleScaleSelect(v as ScaleLibrarySelectItem)}
                  variant="outlined"
                />
              </div>
            </div>
          </div>

          <textarea
            className={styles.bulkTextarea}
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            aria-label="Answers, one per line"
            rows={8}
          />

          <div className={styles.addToLibraryRow}>
            <button
              type="button"
              className={styles.addToLibraryLink}
              onClick={handleAddToScaleLibrary}
            >
              Add to Scale Library
            </button>
          </div>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.cancelLink}
            onClick={() => onOpenChange(false)}
          >
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
