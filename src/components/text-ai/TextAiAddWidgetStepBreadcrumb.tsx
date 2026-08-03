'use client';

import styles from './TextAiAddWidgetStepBreadcrumb.module.css';

export type TextAiAddWidgetStep = 'question' | 'chart';

const STEPS: { id: TextAiAddWidgetStep; label: string; icon: string }[] = [
  { id: 'question', label: 'Question', icon: 'wm-chat' },
  { id: 'chart', label: 'Chart', icon: 'wm-pie-chart' },
];

interface TextAiAddWidgetStepBreadcrumbProps {
  currentStep: TextAiAddWidgetStep;
  onStepClick?: (step: TextAiAddWidgetStep) => void;
}

export function TextAiAddWidgetStepBreadcrumb({
  currentStep,
  onStepClick,
}: TextAiAddWidgetStepBreadcrumbProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep);

  return (
    <nav className={styles.nav} aria-label="Add widget progress">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = index < currentIndex;
        const isClickable = isComplete && onStepClick;

        return (
          <span key={step.id} className={styles.segment}>
            {index > 0 ? (
              <span className={`wm-chevron-right ${styles.separator}`} aria-hidden />
            ) : null}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.id)}
              className={`${styles.stepButton} ${
                isActive
                  ? styles.stepActive
                  : isComplete
                    ? styles.stepComplete
                    : styles.stepUpcoming
              }`}
            >
              <span className={step.icon} aria-hidden />
              <span className={styles.stepLabel}>{step.label}</span>
            </button>
          </span>
        );
      })}
    </nav>
  );
}
