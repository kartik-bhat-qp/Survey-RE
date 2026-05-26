'use client';

import styles from './AddWidgetStepBreadcrumb.module.css';

export type AddWidgetStep = 'widget' | 'survey' | 'question' | 'chart';

const STEPS: { id: AddWidgetStep; label: string; icon: string }[] = [
  { id: 'widget', label: 'Widget', icon: 'wm-grid-view' },
  { id: 'survey', label: 'Survey', icon: 'wm-description' },
  { id: 'question', label: 'Question', icon: 'wm-list' },
  { id: 'chart', label: 'Chart', icon: 'wm-bar-chart' },
];

interface AddWidgetStepBreadcrumbProps {
  currentStep: AddWidgetStep;
  onStepClick?: (step: AddWidgetStep) => void;
}

export function AddWidgetStepBreadcrumb({
  currentStep,
  onStepClick,
}: AddWidgetStepBreadcrumbProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav className={styles.nav} aria-label="Add widget progress">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = index < currentIndex;
        const isClickable = isComplete && onStepClick;

        return (
          <span key={step.id} className="flex items-center gap-1">
            {index > 0 && (
              <span className="wm-chevron-right mx-0.5 text-xs text-gray-300" />
            )}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.id)}
              className={`${styles.stepButton} ${
                isActive
                  ? 'font-medium text-[#1b87e6]'
                  : isComplete
                    ? 'cursor-pointer text-[#1b87e6] hover:underline'
                    : 'cursor-default text-gray-400'
              }`}
            >
              <span className={`${step.icon} text-base`} />
              <span className={styles.stepLabel}>{step.label}</span>
            </button>
          </span>
        );
      })}
    </nav>
  );
}
