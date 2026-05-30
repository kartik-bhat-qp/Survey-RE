'use client';

import { useEffect, useState } from 'react';
import { SURVEY_AI_THINKING_STEPS } from '@/data/mock-survey-creation-flow';
import styles from './SurveyCreationAiThinkingOverlay.module.css';

const STEP_INTERVAL_MS = 1400;

interface SurveyCreationAiThinkingOverlayProps {
  open: boolean;
}

export function SurveyCreationAiThinkingOverlay({ open }: SurveyCreationAiThinkingOverlayProps) {
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
        current >= SURVEY_AI_THINKING_STEPS.length - 1 ? current : current + 1
      );
    }, STEP_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [open]);

  if (!open) {
    return null;
  }

  const stepMessage = SURVEY_AI_THINKING_STEPS[stepIndex] ?? SURVEY_AI_THINKING_STEPS[0];

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="survey-ai-thinking-title"
      aria-busy="true"
    >
      <div className={styles.panel}>
        <div className={styles.iconWrap}>
          <span className={`wc-ai ${styles.aiIcon}`} aria-hidden />
        </div>
        <h2 id="survey-ai-thinking-title" className={styles.title}>
          QuestionPro AI is thinking
        </h2>
        <p className={styles.step}>{stepMessage}</p>
        <div className={styles.progressTrack} aria-hidden>
          <div className={styles.progressFill} />
        </div>
      </div>
    </div>
  );
}
