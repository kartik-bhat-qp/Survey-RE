'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  DEFAULT_TEST_RESPONSE_COUNT,
  TEST_RESPONSE_COUNT_OPTIONS,
  type TestResponseCountOption,
} from '@/data/mock-test-responses';
import styles from './TestResponsesModal.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface TestResponsesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestResponsesModal({ open, onOpenChange }: TestResponsesModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [responseCount, setResponseCount] = useState(DEFAULT_TEST_RESPONSE_COUNT);

  useEffect(() => {
    if (!open) return;
    setResponseCount(DEFAULT_TEST_RESPONSE_COUNT);
  }, [open]);

  const selectedCountOption = useMemo(
    () =>
      TEST_RESPONSE_COUNT_OPTIONS.find((option) => option.value === responseCount) ??
      TEST_RESPONSE_COUNT_OPTIONS.find((option) => option.value === DEFAULT_TEST_RESPONSE_COUNT)!,
    [responseCount]
  );

  const handleModalOpenChange = useCallback(
    (nextOpen: boolean) => {
      queueMicrotask(() => onOpenChange(nextOpen));
    },
    [onOpenChange]
  );

  function handleStartTest(): void {
    showToast({
      message: `Generating ${responseCount} test response${responseCount === '1' ? '' : 's'}`,
      variant: 'success',
    });
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
        <span className={styles.headerTitle}>Generate Test Responses</span>
        <WuTooltip
          content="Generate mock survey responses for testing logic, quotas, and reporting."
          position="bottom"
        >
          <button type="button" className={styles.helpBtn} aria-label="Help">
            <span className="wm-help-outline" aria-hidden />
          </button>
        </WuTooltip>
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel} htmlFor="test-response-count">
            Number Of Test Responses
          </label>
          <div className={styles.selectWrap}>
            <WuSelect
              id="test-response-count"
              data={TEST_RESPONSE_COUNT_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={selectedCountOption}
              onSelect={(item) => {
                const next = item as TestResponseCountOption | null;
                if (!next) return;
                setResponseCount(next.value);
              }}
              variant="outlined"
            />
          </div>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton onClick={handleStartTest}>Start Test</WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
