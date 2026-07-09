'use client';

import styles from './TextAiCreateDashboardStepBreadcrumb.module.css';

export type TextAiCreateStep =
  | 'dashboard'
  | 'survey'
  | 'model-setup'
  | 'segment'
  | 'select-questions';

const STEPS: { id: TextAiCreateStep; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'wm-dashboard' },
  { id: 'survey', label: 'Survey', icon: 'wm-description' },
  { id: 'model-setup', label: 'Model set up', icon: 'wm-settings' },
  { id: 'segment', label: 'Segment', icon: 'wm-filter-list' },
  { id: 'select-questions', label: 'Select questions', icon: 'wm-chat' },
];

interface TextAiCreateDashboardStepBreadcrumbProps {
  currentStep: TextAiCreateStep;
  onStepClick?: (step: TextAiCreateStep) => void;
}

export function TextAiCreateDashboardStepBreadcrumb({
  currentStep,
  onStepClick,
}: TextAiCreateDashboardStepBreadcrumbProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav className={styles.nav} aria-label="Create TextAI dashboard progress">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = index < currentIndex;
        const isClickable = isComplete && onStepClick;

        return (
          <span key={step.id} className={styles.segment}>
            {index > 0 && (
              <span className={`wm-chevron-right ${styles.separator}`} aria-hidden />
            )}
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
