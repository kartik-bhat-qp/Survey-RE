'use client';

import { useEffect, useState } from 'react';
import { QUOTA_AI_THINKING_STEPS } from '@/data/mock-quota-ai-agent';
import styles from './QuotaAiThinkingOverlay.module.css';

const STEP_INTERVAL_MS = 1200;

interface QuotaAiThinkingOverlayProps {
  open: boolean;
}

export function QuotaAiThinkingOverlay({ open }: QuotaAiThinkingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setStepIndex((current) =>
        current >= QUOTA_AI_THINKING_STEPS.length - 1 ? current : current + 1
      );
    }, STEP_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [open]);

  if (!open) {
    return null;
  }

  const stepMessage = QUOTA_AI_THINKING_STEPS[stepIndex] ?? QUOTA_AI_THINKING_STEPS[0];

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quota-ai-thinking-title"
      aria-busy="true"
    >
      <div className={styles.panel}>
        <div className={styles.iconWrap}>
          <span className={`wc-ai ${styles.aiIcon}`} aria-hidden />
        </div>
        <h2 id="quota-ai-thinking-title" className={styles.title}>
          QuestionPro AI is building quotas
        </h2>
        <p className={styles.step}>{stepMessage}</p>
        <div className={styles.progressTrack} aria-hidden>
          <div className={styles.progressFill} />
        </div>
      </div>
    </div>
  );
}
