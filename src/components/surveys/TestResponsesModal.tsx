'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { CREDITS_WALLET_PATH } from '@/data/mock-credits-wallet';
import { formatNumber } from '@/data/mock-utils';
import {
  DEFAULT_TEST_RESPONSE_COUNT,
  DEFAULT_TEST_RESPONSE_MODE,
  DEFAULT_TEST_RESPONSE_PANEL,
  getTestResponseCreditCost,
  hasSufficientTestResponseCredits,
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

export const TEST_RESPONSES_HELP_TEXT =
  'Generate mock survey responses for testing logic, quotas, and reporting.';

export interface SyntheticTestGenerationRequest {
  count: string;
  panelLabel: string;
}

interface TestResponsesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartSynthetic: (request: SyntheticTestGenerationRequest) => void;
}

function ResponseCountSelect({
  id,
  labelledBy,
  value,
  onChange,
}: {
  id?: string;
  labelledBy?: string;
  value: TestResponseCountOption;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.countSelect}>
      <WuSelect
        id={id}
        data={TEST_RESPONSE_COUNT_OPTIONS}
        accessorKey={{ value: 'value', label: 'label' }}
        value={value}
        onSelect={(next) => onChange((next as TestResponseCountOption).value)}
        variant="outlined"
        aria-labelledby={labelledBy}
        maxContentWidth="5.5rem"
        CustomTrigger={
          <span className={styles.countTrigger}>
            <span className={styles.countValue}>{value.label}</span>
            <span className={`wm-keyboard-arrow-down ${styles.countCaret}`} aria-hidden />
          </span>
        }
      />
    </div>
  );
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
  const hasSufficientCredits = useMemo(
    () => hasSufficientTestResponseCredits(responseCount),
    [responseCount]
  );
  const showBuyNow = isSynthetic && !hasSufficientCredits;

  function handleStartTest(): void {
    if (isSynthetic && !hasSufficientCredits) {
      showToast({
        message: 'Add credits to generate synthetic responses',
        variant: 'error',
      });
      return;
    }

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
        <button
          type="button"
          className={styles.helpBtn}
          aria-label="Help"
          title={TEST_RESPONSES_HELP_TEXT}
        >
          <span className="wm-help-outline" aria-hidden />
        </button>
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        <div
          className={`${styles.syntheticHero} ${isSynthetic ? styles.syntheticHeroActive : ''}`}
        >
          <button
            type="button"
            className={styles.syntheticHeroButton}
            aria-pressed={isSynthetic}
            onClick={() => setMode('synthetic')}
          >
            <span
              className={`${styles.modeRadio} ${isSynthetic ? styles.modeRadioActive : ''}`}
              aria-hidden
            />
            <span className={styles.syntheticHeroBody}>
              <span className={styles.syntheticHeroTitleRow}>
                <span className={styles.syntheticHeroTitle}>Synthetic Responses</span>
                <span className={styles.recommendedBadge}>Recommended</span>
              </span>
              <span className={styles.syntheticHeroDescription}>
                Simulated respondents from a real panel profile answer like people do —
                consistent across the whole survey, with believable open text and realistic
                distributions.
              </span>
              <span className={styles.featureList}>
                <span className={styles.featureItem}>✓ Report-ready data</span>
                <span className={styles.featureItem}>✓ Realistic open text</span>
                <span className={styles.featureItem}>✓ Consistent personas</span>
              </span>
            </span>
            <span className={styles.syntheticHeroPrice}>
              <span className={styles.syntheticHeroPriceAmount}>
                {TEST_RESPONSE_CREDITS_PER_RESPONSE}
              </span>
              <span className={styles.syntheticHeroPriceLabel}>credits / response</span>
            </span>
          </button>

          {isSynthetic ? (
            <div className={styles.syntheticHeroExpanded}>
              <div className={styles.inlineFieldRow}>
                <label className={styles.inlineFieldLabel} htmlFor="test-response-panel">
                  Panel
                </label>
                <div id="test-response-panel" className={styles.panelSelect}>
                  <WuSelect
                    data={TEST_RESPONSE_PANEL_OPTIONS}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={selectedPanel}
                    onSelect={(value) => setPanelId((value as TestResponsePanelOption).value)}
                    variant="outlined"
                  />
                </div>
              </div>
              <div className={styles.inlineFieldRow}>
                <span className={styles.inlineFieldLabel} id="test-response-synthetic-count-label">
                  Responses
                </span>
                <ResponseCountSelect
                  labelledBy="test-response-synthetic-count-label"
                  value={selectedCount}
                  onChange={setResponseCount}
                />
                <span className={styles.inlineFieldNote}>
                  {formatNumber(creditCost)} credits total
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.modeDivider} aria-hidden>
          <span className={styles.modeDividerLine} />
          <span className={styles.modeDividerLabel}>or</span>
          <span className={styles.modeDividerLine} />
        </div>

        <div className={styles.randomSection}>
          <button
            type="button"
            className={`${styles.randomCard} ${!isSynthetic ? styles.randomCardActive : ''}`}
            aria-pressed={!isSynthetic}
            onClick={() => setMode('random')}
          >
            <span
              className={`${styles.modeRadio} ${!isSynthetic ? styles.modeRadioActive : ''}`}
              aria-hidden
            />
            <span className={styles.randomCardBody}>
              <span className={styles.randomCardTitle}>Random Responses</span>
              <span className={styles.randomCardDescription}>
                Answers picked at random. Fine for checking logic, piping and quotas — not for
                reviewing results.
              </span>
            </span>
            <span className={styles.randomCardPrice}>Free</span>
          </button>

          {!isSynthetic ? (
            <div className={styles.randomExpanded}>
              <span className={styles.inlineFieldLabel} id="test-response-random-count-label">
                Responses
              </span>
              <ResponseCountSelect
                labelledBy="test-response-random-count-label"
                value={selectedCount}
                onChange={setResponseCount}
              />
              <span className={styles.inlineFieldNote}>No credits used</span>
            </div>
          ) : null}
        </div>
      </WuModalContent>
      <WuModalFooter className={styles.footer}>
        <span className={styles.footerBalanceGroup}>
          <span
            className={`${styles.footerBalance} ${showBuyNow ? styles.footerBalanceInsufficient : ''}`}
          >
            Balance {formatNumber(TEST_RESPONSE_CREDIT_BALANCE)} credits
          </span>
          {showBuyNow ? (
            <Link href={CREDITS_WALLET_PATH} className={styles.buyNowBtn}>
              Buy Now
            </Link>
          ) : null}
        </span>
        <span className={styles.footerActions}>
          <WuModalClose variant="secondary">Cancel</WuModalClose>
          <WuButton onClick={handleStartTest} disabled={showBuyNow}>
            Generate
          </WuButton>
        </span>
      </WuModalFooter>
    </WuModal>
  );
}
