'use client';

import { WarningNotice } from '@/components/ui/WarningNotice';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useEssentialsAccountActionsLocked } from '@/hooks/useEssentialsAccountUnderReview';
import {
  ESSENTIALS_ACCOUNT_REVIEW_COPY,
  ESSENTIALS_ACCOUNT_REVIEW_SUPPORT_LABEL,
} from '@/data/mock-essentials-phishing-review';
import styles from './EssentialsAccountUnderReviewBanner.module.css';

export function EssentialsAccountUnderReviewBanner() {
  const underReview = useEssentialsAccountActionsLocked();
  const { showToast } = useWuShowToast();

  if (!underReview) return null;

  return (
    <div className={styles.bar} role="status" aria-live="polite">
      <WarningNotice
        className={styles.alert}
        Icon={<span className={`wm-warning ${styles.icon}`} aria-hidden />}
      >
        <span className={styles.title}>Account under review</span>
        <span className={styles.copy}>
          {ESSENTIALS_ACCOUNT_REVIEW_COPY}{' '}
          <button
            type="button"
            className={styles.supportLink}
            onClick={() =>
              showToast({
                message: 'Connecting you with support…',
                variant: 'info',
              })
            }
          >
            {ESSENTIALS_ACCOUNT_REVIEW_SUPPORT_LABEL}
          </button>
        </span>
      </WarningNotice>
    </div>
  );
}
