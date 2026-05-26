'use client';

import styles from './AdvancedWidgetStepBreadcrumb.module.css';

export type AdvancedWidgetStep = 'widget' | 'chart' | 'details';

const STEPS: { id: AdvancedWidgetStep; label: string; icon: string }[] = [
  { id: 'widget', label: 'Widget', icon: 'wm-grid-view' },
  { id: 'chart', label: 'Chart', icon: 'wm-forum' },
  { id: 'details', label: 'Details', icon: 'wm-bar-chart' },
];

interface AdvancedWidgetStepBreadcrumbProps {
  currentStep: AdvancedWidgetStep;
  onStepClick?: (step: AdvancedWidgetStep) => void;
}

export function AdvancedWidgetStepBreadcrumb({
  currentStep,
  onStepClick,
}: AdvancedWidgetStepBreadcrumbProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav className={styles.nav} aria-label="Add advanced widget progress">
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
