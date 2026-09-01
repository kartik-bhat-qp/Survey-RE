'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { formatNumber } from '@/data/mock-utils';
import {
  DEFAULT_TEST_RESPONSE_COUNT,
  DEFAULT_TEST_RESPONSE_MODE,
  DEFAULT_TEST_RESPONSE_PANEL,
  getTestResponseCreditCost,
  TEST_RESPONSE_COUNT_OPTIONS,
  TEST_RESPONSE_CREDIT_BALANCE,
  TEST_RESPONSE_CREDITS_PER_RESPONSE,
  TEST_RESPONSE_PANEL_OPTIONS,
  type TestResponseCountOption,
  type TestResponseMode,
  type TestResponsePanelOption,
} from '@/data/mock-test-responses';
import styles from './TestResponsesModal.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

export interface SyntheticTestGenerationRequest {
  count: string;
  panelLabel: string;
}

interface TestResponsesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartSynthetic: (request: SyntheticTestGenerationRequest) => void;
}

export function TestResponsesModal({
  open,
  onOpenChange,
  onStartSynthetic,
}: TestResponsesModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [mode, setMode] = useState<TestResponseMode>(DEFAULT_TEST_RESPONSE_MODE);
  const [responseCount, setResponseCount] = useState(DEFAULT_TEST_RESPONSE_COUNT);
  const [panelId, setPanelId] = useState(DEFAULT_TEST_RESPONSE_PANEL);

  useEffect(() => {
    if (!open) return;
    setMode(DEFAULT_TEST_RESPONSE_MODE);
    setResponseCount(DEFAULT_TEST_RESPONSE_COUNT);
    setPanelId(DEFAULT_TEST_RESPONSE_PANEL);
  }, [open]);

  const handleModalOpenChange = useCallback(
    (nextOpen: boolean) => {
      queueMicrotask(() => onOpenChange(nextOpen));
    },
    [onOpenChange]
  );

  const selectedCount = useMemo(
    () =>
      TEST_RESPONSE_COUNT_OPTIONS.find((option) => option.value === responseCount) ??
      TEST_RESPONSE_COUNT_OPTIONS.find((option) => option.value === DEFAULT_TEST_RESPONSE_COUNT)!,
    [responseCount]
  );

  const selectedPanel = useMemo(
    () =>
      TEST_RESPONSE_PANEL_OPTIONS.find((option) => option.value === panelId) ??
      TEST_RESPONSE_PANEL_OPTIONS[0],
    [panelId]
  );

  const creditCost = useMemo(() => getTestResponseCreditCost(responseCount), [responseCount]);
  const isSynthetic = mode === 'synthetic';
  const startTestLabel = isSynthetic
    ? `Start Test — ${formatNumber(creditCost)} credits`
    : 'Start Test';

  function handleStartTest(): void {
    if (isSynthetic) {
      onStartSynthetic({
        count: responseCount,
        panelLabel: selectedPanel.label,
      });
      handleModalOpenChange(false);
      return;
    }

    showToast({
      message: `Generating ${responseCount} random test response${responseCount === '1' ? '' : 's'}`,
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
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.modeSwitch} role="group" aria-label="Test response mode">
          <button
            type="button"
            className={`${styles.modeOption} ${mode === 'random' ? styles.modeOptionActive : ''}`}
            aria-pressed={mode === 'random'}
            onClick={() => setMode('random')}
          >
            <span className={styles.modeTitle}>Random</span>
            <span className={styles.modeDescription}>Fills every question at random</span>
            <span className={`${styles.modeMeta} ${styles.modeMetaFree}`}>Free</span>
          </button>
          <button
            type="button"
            className={`${styles.modeOption} ${mode === 'synthetic' ? styles.modeOptionActive : ''}`}
            aria-pressed={mode === 'synthetic'}
            onClick={() => setMode('synthetic')}
          >
            <span className={styles.modeTitle}>
              Synthetic
              <span className={styles.modeBadge}>New</span>
            </span>
            <span className={styles.modeDescription}>
              Realistic answers from simulated respondents
            </span>
            <span className={styles.modeMeta}>
              {TEST_RESPONSE_CREDITS_PER_RESPONSE} credits / response
            </span>
          </button>
        </div>

        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel} id="test-response-count-label">
            Number Of Test Responses
          </span>
          <div className={styles.countSelect}>
            <WuSelect
              data={TEST_RESPONSE_COUNT_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={selectedCount}
              onSelect={(value) => setResponseCount((value as TestResponseCountOption).value)}
              variant="outlined"
              aria-labelledby="test-response-count-label"
              maxContentWidth="5.5rem"
              CustomTrigger={
                <span className={styles.countTrigger}>
                  <span className={styles.countValue}>{selectedCount.label}</span>
                  <span className={`wm-keyboard-arrow-down ${styles.countCaret}`} aria-hidden />
                </span>
              }
            />
          </div>
        </div>

        {isSynthetic ? (
          <div className={styles.syntheticSection}>
            <div className={styles.panelRow}>
              <label className={styles.fieldLabel} htmlFor="test-response-panel">
                Panel
              </label>
              <div className={styles.panelField}>
                <div id="test-response-panel" className={styles.panelSelect}>
                  <WuSelect
                    data={TEST_RESPONSE_PANEL_OPTIONS}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={selectedPanel}
                    onSelect={(value) => setPanelId((value as TestResponsePanelOption).value)}
                    variant="outlined"
                  />
                </div>
                <p className={styles.panelHelp}>
                  Simulated respondents are drawn from this profile, so answers stay consistent
                  across questions.
                </p>
              </div>
            </div>

            <div className={styles.costSummary}>
              <span className={styles.costSummaryLine}>
                {responseCount} responses &times; {TEST_RESPONSE_CREDITS_PER_RESPONSE} credits
              </span>
              <span className={styles.costSummaryTotal}>
                <span className={styles.costSummaryAmount}>
                  {formatNumber(creditCost)} credits
                </span>
                <span className={styles.costSummaryBalance}>
                  Balance {formatNumber(TEST_RESPONSE_CREDIT_BALANCE)}
                </span>
              </span>
            </div>
          </div>
        ) : null}
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton onClick={handleStartTest}>{startTestLabel}</WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
