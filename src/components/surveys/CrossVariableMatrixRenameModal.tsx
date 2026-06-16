'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './CrossVariableMatrixRenameModal.module.css';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

interface CrossVariableMatrixRenameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onSave: (name: string) => void;
}

export function CrossVariableMatrixRenameModal({
  open,
  onOpenChange,
  currentName,
  onSave,
}: CrossVariableMatrixRenameModalProps) {
  const wick = useWickUILib();
  const [name, setName] = useState(currentName);

  useEffect(() => {
    if (!open) return;
    setName(currentName);
  }, [currentName, open]);

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } =
    wick;
  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && trimmedName !== currentName.trim();

  function handleSave(): void {
    if (!canSave) return;
    onSave(trimmedName);
    onOpenChange(false);
  }

  return (
    <WuModal open onOpenChange={onOpenChange} variant="action" size="sm">
      <WuModalHeader>Rename matrix</WuModalHeader>
      <WuModalContent>
        <p className={styles.intro}>
          Give this matrix a short label that describes the variables it tracks.
        </p>
        <WuInput
          variant="outlined"
          value={name}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setName(event.target.value)
          }
          aria-label="Matrix name"
          className={styles.input}
        />
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton onClick={handleSave} disabled={!canSave}>
          Save
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
