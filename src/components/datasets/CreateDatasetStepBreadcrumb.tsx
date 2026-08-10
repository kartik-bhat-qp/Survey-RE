'use client';

import {
  CREATE_DATASET_WIZARD_STEPS,
  type CreateDatasetWizardStep,
} from '@/data/mock-create-dataset';
import styles from './CreateDatasetStepBreadcrumb.module.css';

interface CreateDatasetStepBreadcrumbProps {
  currentStep: CreateDatasetWizardStep;
  onStepClick?: (step: CreateDatasetWizardStep) => void;
}

export function CreateDatasetStepBreadcrumb({
  currentStep,
  onStepClick,
}: CreateDatasetStepBreadcrumbProps) {
  const currentIndex = CREATE_DATASET_WIZARD_STEPS.findIndex(
    (step) => step.id === currentStep
  );

  return (
    <nav className={styles.nav} aria-label="Create dataset progress">
      {CREATE_DATASET_WIZARD_STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = index < currentIndex;
        const isClickable = Boolean(isComplete && onStepClick);

        return (
          <span key={step.id} className={styles.stepWrap}>
            {index > 0 ? (
              <span className={`wm-chevron-right ${styles.chevron}`} aria-hidden />
            ) : null}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => {
                if (isClickable) onStepClick?.(step.id);
              }}
              className={`${styles.stepButton} ${
                isActive
                  ? styles.stepActive
                  : isComplete
                    ? styles.stepComplete
                    : styles.stepUpcoming
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
