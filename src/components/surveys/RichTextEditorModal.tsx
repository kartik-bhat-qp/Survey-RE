'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { RichTextEditor } from '@/components/surveys/RichTextEditor';
import { toEditorHtml } from '@/components/surveys/rich-text-utils';
import styles from './RichTextEditorModal.module.css';

export interface RichTextEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSave: (value: string) => void;
}

export function RichTextEditorModal({
  open,
  onOpenChange,
  value,
  onSave,
}: RichTextEditorModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!open) return;
    setDraft(toEditorHtml(value));
  }, [open, value]);

  const handleSave = useCallback(() => {
    onSave(draft);
    onOpenChange(false);
    showToast({ message: 'Rich text saved', variant: 'success' });
  }, [draft, onOpenChange, onSave, showToast]);

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton } = wick;

  return (
    <WuModal
      open
      onOpenChange={onOpenChange}
      size="lg"
      className={styles.modalWide}
      variant="action"
    >
      <WuModalHeader className={styles.modalTitle}>Rich Text Editor</WuModalHeader>
      <WuModalContent>
        <RichTextEditor
          value={draft}
          onChange={setDraft}
          ariaLabel="Rich text content"
        />
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
          <WuButton onClick={handleSave}>Save</WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
