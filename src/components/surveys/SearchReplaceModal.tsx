'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './SearchReplaceModal.module.css';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

interface SearchReplaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchReplaceModal({ open, onOpenChange }: SearchReplaceModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  useEffect(() => {
    if (!open) return;
    setSearchText('');
    setReplaceText('');
  }, [open]);

  const handleModalOpenChange = useCallback(
    (nextOpen: boolean) => {
      queueMicrotask(() => onOpenChange(nextOpen));
    },
    [onOpenChange]
  );

  function handleSubmit() {
    if (!searchText.trim()) return;
    showToast({
      message: `Replaced all occurrences of "${searchText}" with "${replaceText}"`,
      variant: 'success',
    });
    handleModalOpenChange(false);
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } =
    wick;
  const canSubmit = searchText.trim().length > 0;

  return (
    <WuModal open onOpenChange={handleModalOpenChange} variant="action" size="sm">
      <WuModalHeader>Search &amp; Replace</WuModalHeader>
      <WuModalContent>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="search-replace-find">
            Replace all occurrences of (Case sensitive)
          </label>
          <WuInput
            id="search-replace-find"
            variant="outlined"
            value={searchText}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setSearchText(event.target.value)
            }
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="search-replace-with">
            With
          </label>
          <WuInput
            id="search-replace-with"
            variant="outlined"
            value={replaceText}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setReplaceText(event.target.value)
            }
            className={styles.input}
          />
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton onClick={handleSubmit} disabled={!canSubmit}>
          Search &amp; Replace
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
