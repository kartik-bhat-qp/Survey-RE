'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  getAiLensFixPreview,
  type AiLensFinding,
} from '@/data/mock-ai-lens';
import styles from './AiLensApplyFixExpanded.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

interface AiLensApplyFixExpandedProps {
  finding: AiLensFinding;
  onCancel: () => void;
  onApply: (finding: AiLensFinding) => void;
}

type FixPhase = 'preparing' | 'ready';

const PREPARE_MS = 900;

export function AiLensApplyFixExpanded({
  finding,
  onCancel,
  onApply,
}: AiLensApplyFixExpandedProps) {
  const [phase, setPhase] = useState<FixPhase>('preparing');

  useEffect(() => {
    setPhase('preparing');
    const timer = window.setTimeout(() => setPhase('ready'), PREPARE_MS);
    return () => window.clearTimeout(timer);
  }, [finding.id]);

  const preview = getAiLensFixPreview(finding);
  const isPreparing = phase === 'preparing';

  return (
    <div className={styles.panel} aria-live="polite">
      <div className={styles.headerRow}>
        <h4 className={styles.title}>Apply this fix?</h4>
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="Cancel apply fix"
          onClick={onCancel}
        >
          <span className="wm-close" aria-hidden />
        </button>
      </div>

      {isPreparing ? (
        <div className={styles.preparing}>
          <div className={styles.dots} aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <p className={styles.preparingLabel}>Preparing the change</p>
        </div>
      ) : (
        <div className={styles.ready}>
          <p className={styles.rationale}>{preview.rationale}</p>
          <div className={styles.compare}>
            <div className={styles.compareCol}>
              <span className={styles.compareLabel}>NOW</span>
              <div className={`${styles.compareBox} ${styles.compareBoxNow}`}>
                {preview.before}
              </div>
            </div>
            <div className={styles.compareCol}>
              <span className={styles.compareLabel}>AFTER THE FIX</span>
              <div className={`${styles.compareBox} ${styles.compareBoxAfter}`}>
                {preview.after}
              </div>
            </div>
          </div>
          <p className={styles.warning}>
            This is applied to the survey immediately, and there is no undo.
          </p>
        </div>
      )}

      <div className={styles.footer}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <WuButton
          variant="primary"
          disabled={isPreparing}
          Icon={<span className="wm-check" aria-hidden />}
          onClick={() => onApply(finding)}
        >
          Apply fix
        </WuButton>
      </div>
    </div>
  );
}
