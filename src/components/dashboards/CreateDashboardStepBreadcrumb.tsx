'use client';

import styles from './CreateDashboardStepBreadcrumb.module.css';

type Step = 'dashboard' | 'survey' | 'confirmation';

const STEPS: { id: Step; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'wm-dashboard' },
  { id: 'survey', label: 'Survey', icon: 'wm-description' },
  { id: 'confirmation', label: 'Confirmation', icon: 'wm-bar-chart' },
];

interface CreateDashboardStepBreadcrumbProps {
  currentStep: Step;
  onStepClick?: (step: Step) => void;
}

export function CreateDashboardStepBreadcrumb({
  currentStep,
  onStepClick,
}: CreateDashboardStepBreadcrumbProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav className={styles.nav} aria-label="Create dashboard progress">
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
