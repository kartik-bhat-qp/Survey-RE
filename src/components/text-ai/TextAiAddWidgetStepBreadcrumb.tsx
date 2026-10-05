'use client';

import styles from './TextAiAddWidgetStepBreadcrumb.module.css';

export type TextAiAddWidgetStep = 'question' | 'chart' | 'kpi';

const STEPS: { id: TextAiAddWidgetStep; label: string; icon: string }[] = [
  { id: 'chart', label: 'Widget', icon: 'wm-pie-chart' },
  { id: 'question', label: 'Data source', icon: 'wm-chat' },
  { id: 'kpi', label: 'KPI setup', icon: 'wm-poll' },
];

interface TextAiAddWidgetStepBreadcrumbProps {
  currentStep: TextAiAddWidgetStep;
  includeKpi?: boolean;
  onStepClick?: (step: TextAiAddWidgetStep) => void;
}

export function TextAiAddWidgetStepBreadcrumb({
  currentStep,
  includeKpi = false,
  onStepClick,
}: TextAiAddWidgetStepBreadcrumbProps) {
  const steps = STEPS.filter(step => includeKpi || step.id !== 'kpi');
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <nav className={styles.nav} aria-label="Add widget progress">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = index < currentIndex;
        const isClickable = isComplete && onStepClick;

        return (
          <span key={step.id} className={styles.segment}>
            {index > 0 ? (
              <span className={styles.separator} aria-hidden>
                ›
              </span>
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
