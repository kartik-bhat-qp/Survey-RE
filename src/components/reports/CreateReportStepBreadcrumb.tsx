'use client';

import styles from './CreateReportStepBreadcrumb.module.css';

export type CreateReportWizardStep = 'report' | 'survey';

const STEPS: { id: CreateReportWizardStep; label: string; icon: string }[] = [
  { id: 'report', label: 'Report', icon: 'wm-description' },
  { id: 'survey', label: 'Survey', icon: 'wm-description' },
];

interface CreateReportStepBreadcrumbProps {
  currentStep: CreateReportWizardStep;
  onStepClick?: (step: CreateReportWizardStep) => void;
}

export function CreateReportStepBreadcrumb({
  currentStep,
  onStepClick,
}: CreateReportStepBreadcrumbProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep);

  return (
    <nav className={styles.nav} aria-label="Create report progress">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = index < currentIndex;
        const isClickable = Boolean(isComplete && onStepClick);

        return (
          <span key={step.id} className="flex items-center gap-1">
            {index > 0 ? (
              <span className="wm-chevron-right mx-0.5 text-xs text-gray-300" aria-hidden />
            ) : null}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => {
                if (isClickable) onStepClick?.(step.id);
              }}
              className={`${styles.stepButton} ${
                isActive
                  ? 'font-medium text-[#1b87e6]'
                  : isComplete
                    ? 'cursor-pointer text-[#1b87e6] hover:underline'
                    : 'cursor-default text-gray-400'
              }`}
            >
              <span className={`${step.icon} text-base`} aria-hidden />
              <span className={styles.stepLabel}>{step.label}</span>
            </button>
          </span>
        );
      })}
    </nav>
  );
}
