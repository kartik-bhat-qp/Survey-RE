'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './SectionBlockOptionsButton.module.css';

const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);

const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

const BLOCK_FLOW_HINT_DISMISSED_KEY = 'survey-block-flow-hint-dismissed';

interface SectionBlockOptionsButtonProps {
  sectionTitle: string;
  showBlockFlowHint?: boolean;
  onBlockFlowSelect: () => void;
  onLearnMore?: () => void;
}

export function SectionBlockOptionsButton({
  sectionTitle,
  showBlockFlowHint = false,
  onBlockFlowSelect,
  onLearnMore,
}: SectionBlockOptionsButtonProps) {
  const [hintVisible, setHintVisible] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(true);

  useEffect(() => {
    setHintDismissed(
      window.sessionStorage.getItem(BLOCK_FLOW_HINT_DISMISSED_KEY) === 'true'
    );
  }, []);

  const canShowHint = showBlockFlowHint && !hintDismissed;

  const handleDismiss = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    window.sessionStorage.setItem(BLOCK_FLOW_HINT_DISMISSED_KEY, 'true');
    setHintDismissed(true);
    setHintVisible(false);
  }, []);

  const handleLearnMore = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onLearnMore?.();
    },
    [onLearnMore]
  );

  const handleBlockFlowSelect = useCallback(() => {
    queueMicrotask(() => onBlockFlowSelect());
  }, [onBlockFlowSelect]);

  return (
    <div
      className={styles.blockOptionsWrap}
      onMouseEnter={() => {
        if (canShowHint) setHintVisible(true);
      }}
      onMouseLeave={() => setHintVisible(false)}
    >
      {hintVisible && canShowHint ? (
        <div className={styles.hint} role="tooltip">
          <div className={styles.hintHeader}>
            <div className={styles.hintTitleRow}>
              <span className={styles.hintTitle}>Block flow</span>
              <span className={styles.hintBadge}>New</span>
            </div>
            <button
              type="button"
              className={styles.dismissBtn}
              aria-label="Dismiss Block flow hint"
              onClick={handleDismiss}
            >
              <span className="wm-close" aria-hidden />
            </button>
          </div>
          <p className={styles.hintBody}>
            Now you can reorder your survey blocks from here.
          </p>
          <div className={styles.hintFooter}>
            <button type="button" className={styles.learnMoreBtn} onClick={handleLearnMore}>
              Learn more
            </button>
          </div>
        </div>
      ) : null}
      <WuMenu
        align="end"
        Trigger={
          <button
            type="button"
            className={styles.menuBtn}
            aria-label={`${sectionTitle} block options`}
          >
            <span className="wm-more-vert" aria-hidden />
          </button>
        }
      >
        <WuMenuItem className={styles.menuItem} onSelect={handleBlockFlowSelect}>
          Block Flow
        </WuMenuItem>
      </WuMenu>
    </div>
  );
}
