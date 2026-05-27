'use client';

import styles from './QuotaStepBreadcrumb.module.css';

export type QuotaStep =
  | 'quota-type'
  | 'question'
  | 'dimension'
  | 'criteria'
  | 'advanced'
  | 'quota-group';

const STEP_META: Record<QuotaStep, { label: string; icon: string }> = {
  'quota-type': { label: 'Quota type', icon: 'wm-grid-view' },
  question: { label: 'Question', icon: 'wm-list' },
  dimension: { label: 'Quota #', icon: 'wm-tune' },
  criteria: { label: 'Criteria', icon: 'wm-call-split' },
  advanced: { label: 'Advanced quota', icon: 'wm-tune' },
  'quota-group': { label: 'Quota group', icon: 'wm-group' },
};

const DEFAULT_STEPS: QuotaStep[] = ['quota-type', 'question', 'dimension'];

interface QuotaStepBreadcrumbProps {
  currentStep: QuotaStep;
  steps?: QuotaStep[];
  onStepClick?: (step: QuotaStep) => void;
}

export function QuotaStepBreadcrumb({
  currentStep,
  steps = DEFAULT_STEPS,
  onStepClick,
}: QuotaStepBreadcrumbProps) {
  const resolvedSteps = steps.map((id) => ({ id, ...STEP_META[id] }));
  const currentIndex = resolvedSteps.findIndex((s) => s.id === currentStep);

  return (
    <nav className={styles.nav} aria-label="Add quota progress">
      {resolvedSteps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = index < currentIndex;
        const isClickable = isComplete && Boolean(onStepClick);

        return (
          <span key={step.id} className={styles.stepWrapper}>
            {index > 0 ? (
              <span className={`wm-chevron-right ${styles.separator}`} aria-hidden />
            ) : null}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(step.id)}
              className={`${styles.stepButton} ${
                isActive
                  ? styles.stepActive
                  : isComplete
                    ? styles.stepComplete
                    : styles.stepPending
              }`}
            >
              <span className={`${step.icon} ${styles.stepIcon}`} aria-hidden />
              <span className={styles.stepLabel}>{step.label}</span>
            </button>
          </span>
        );
      })}
    </nav>
  );
}
