'use client';

import type { QuestionQuotaScope } from '@/data/mock-advance-quotas';
import { CROSS_VARIABLE_QUOTA_TYPE_OPTIONS } from '@/data/mock-cross-variable-quota';
import styles from './CrossVariableQuotaTypeStep.module.css';

interface CrossVariableQuotaTypeStepProps {
  value: QuestionQuotaScope;
  onChange: (next: QuestionQuotaScope) => void;
  variant?: 'cards' | 'inline';
  readOnly?: boolean;
}

export function CrossVariableQuotaTypeStep({
  value,
  onChange,
  variant = 'cards',
  readOnly = false,
}: CrossVariableQuotaTypeStepProps) {
  if (variant === 'inline') {
    return (
      <fieldset className={styles.inlineFieldset}>
        <legend className={styles.inlineLegend}>Quota type</legend>
        <div className={styles.inlineOptions} role="radiogroup" aria-label="Quota type">
          {CROSS_VARIABLE_QUOTA_TYPE_OPTIONS.map((option) => {
            const selected = value === option.id;
            return (
              <label
                key={option.id}
                className={`${styles.inlineOption} ${selected ? styles.inlineOptionSelected : ''} ${
                  readOnly ? styles.inlineOptionReadOnly : ''
                }`}
              >
                <input
                  type="radio"
                  name="cross-variable-quota-type"
                  className={styles.inlineRadio}
                  checked={selected}
                  disabled={readOnly}
                  onChange={() => {
                    if (!readOnly) onChange(option.id);
                  }}
                />
                <span className={styles.inlineOptionLabel}>{option.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  return (
    <div className={styles.cards} role="radiogroup" aria-label="Quota type">
      {CROSS_VARIABLE_QUOTA_TYPE_OPTIONS.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`${styles.card} ${selected ? styles.cardSelected : ''}`}
            onClick={() => onChange(option.id)}
          >
            <span className={styles.cardHeader}>
              <span className={styles.cardTitle}>{option.label}</span>
              <span
                className={`${styles.cardIndicator} ${selected ? styles.cardIndicatorSelected : ''}`}
                aria-hidden
              />
            </span>
            <span className={styles.cardDescription}>{option.description}</span>
          </button>
        );
      })}
    </div>
  );
}
