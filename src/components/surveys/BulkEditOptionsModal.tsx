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

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

export interface BulkEditOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  optionLabels: string[];
  otherOption: boolean;
  notApplicableOption: boolean;
  onSave: (payload: {
    optionLabels: string[];
    otherOption: boolean;
    notApplicableOption: boolean;
  }) => 'saved' | 'converted' | 'blocked' | void;
}

function parseBulkLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function detectOtherOption(labels: string[]): boolean {
  return labels.some((label) => /^other$/i.test(label.trim()));
}

function detectNotApplicableOption(labels: string[]): boolean {
  return labels.some((label) =>
    /^(na|n\/a|not applicable)$/i.test(label.trim())
  );
}

export function BulkEditOptionsModal({
  open,
  onOpenChange,
  optionLabels,
  otherOption,
  notApplicableOption,
  onSave,
}: BulkEditOptionsModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [bulkText, setBulkText] = useState('');
  const [scaleId, setScaleId] = useState<string>('');
  const [otherEnabled, setOtherEnabled] = useState(false);
  const [notApplicableEnabled, setNotApplicableEnabled] = useState(false);

  const initialText = useMemo(() => optionLabels.join('\n'), [optionLabels]);

  useEffect(() => {
    if (!open) return;
    setBulkText(initialText);
    setScaleId('');
    setOtherEnabled(otherOption);
    setNotApplicableEnabled(notApplicableOption);
  }, [open, initialText, otherOption, notApplicableOption]);

  const parsedLines = useMemo(() => parseBulkLines(bulkText), [bulkText]);
  const canSave = parsedLines.length > 0;
  const isDirty =
    bulkText !== initialText ||
    otherEnabled !== otherOption ||
    notApplicableEnabled !== notApplicableOption ||
    scaleId !== '';

  function handleScaleSelect(item: ScaleLibrarySelectItem | null): void {
    const nextId = item?.value ?? '';
    setScaleId(nextId);
    if (!nextId) return;
    const entry = MOCK_SCALE_LIBRARY.find((scale) => scale.id === nextId);
    if (entry) {
      setBulkText(entry.options.join('\n'));
      setOtherEnabled(detectOtherOption(entry.options));
      setNotApplicableEnabled(detectNotApplicableOption(entry.options));
    }
  }

  function handleSave(): void {
    if (!canSave) {
      showToast({ message: 'Add at least one answer option', variant: 'error' });
      return;
    }
    const result = onSave({
      optionLabels: parsedLines,
      otherOption: otherEnabled,
      notApplicableOption: notApplicableEnabled,
    });
    if (result === 'blocked') return;
    onOpenChange(false);
    showToast({
      message:
        result === 'converted'
          ? 'Question converted to Lookup Table with answer options updated'
          : 'Answer options updated',
      variant: 'success',
    });
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
            <p className={styles.fieldLabel}>Answer Options - (one per line)</p>
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
            aria-label="Answer options, one per line"
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

          <div className={styles.toggles}>
            <WuToggle
              Label="Other Option"
              labelPosition="left"
              checked={otherEnabled}
              onChange={setOtherEnabled}
            />
            <WuToggle
              Label="Not Applicable Option"
              labelPosition="left"
              checked={notApplicableEnabled}
              onChange={setNotApplicableEnabled}
            />
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
