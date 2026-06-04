'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import {
  SURVEY_AI_THINKING_STEPS,
  SURVEY_TEMPLATE_BUILD_DELAY_MS,
  SURVEY_TEMPLATE_BUILD_STEPS,
  type SurveyCreationAiOverlayVariant,
} from '@/data/mock-survey-creation-flow';
import styles from './SurveyCreationAiThinkingOverlay.module.css';

const WORKING_STEP_INTERVAL_MS = 1400;
const BUILDING_STEP_INTERVAL_MS = 1000;

interface SurveyCreationAiThinkingOverlayProps {
  open: boolean;
  variant?: SurveyCreationAiOverlayVariant;
}

export function SurveyCreationAiThinkingOverlay({
  open,
  variant = 'working',
}: SurveyCreationAiThinkingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const isBuilding = variant === 'building';
  const steps = isBuilding ? SURVEY_TEMPLATE_BUILD_STEPS : SURVEY_AI_THINKING_STEPS;
  const title = isBuilding ? 'Your survey is being built' : 'AI is working';
  const stepIntervalMs = isBuilding ? BUILDING_STEP_INTERVAL_MS : WORKING_STEP_INTERVAL_MS;

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setStepIndex((current) => (current >= steps.length - 1 ? current : current + 1));
    }, stepIntervalMs);

    return () => window.clearInterval(timer);
  }, [open, steps.length, stepIntervalMs]);

  if (!open) {
    return null;
  }

  const stepMessage = steps[stepIndex] ?? steps[0];

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
          {title}
        </h2>
        <p className={styles.step}>{stepMessage}</p>
        <div className={styles.progressTrack} aria-hidden>
          <div
            className={`${styles.progressFill} ${
              isBuilding ? styles.progressFillBuilding : ''
            }`}
            style={
              isBuilding
                ? ({ '--build-duration-ms': `${SURVEY_TEMPLATE_BUILD_DELAY_MS}ms` } as CSSProperties)
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
