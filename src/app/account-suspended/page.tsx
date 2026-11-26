'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  PHISHING_SUSPENDED_BODY,
  PHISHING_SUSPENDED_TITLE,
  requestSuspensionReview,
} from '@/data/mock-phishing-publish-hold';
import styles from './AccountSuspendedPage.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

export default function AccountSuspendedPage() {
  const { showToast } = useWuShowToast();
  const [note, setNote] = useState('');
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  function handleRequestReview(): void {
    const caseId = requestSuspensionReview();
    setSubmittedId(caseId);
    showToast({
      message: `Review requested (${caseId})`,
      variant: 'success',
    });
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={`wm-warning ${styles.icon}`} aria-hidden />
        <h1 className={styles.title}>{PHISHING_SUSPENDED_TITLE}</h1>
        <p className={styles.body}>{PHISHING_SUSPENDED_BODY}</p>

        {submittedId ? (
          <p className={styles.confirm}>
            Review requested. Case <strong>{submittedId}</strong>. We’ll follow up by email.
          </p>
        ) : (
          <div className={styles.form}>
            <label className={styles.label} htmlFor="review-note">
              Tell us why this should be reviewed (optional)
            </label>
            <textarea
              id="review-note"
              className={styles.textarea}
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Brief context for the review team"
            />
            <div className={styles.actions}>
              <WuButton color="primary" onClick={handleRequestReview}>
                Request a review
              </WuButton>
              <WuButton
                variant="secondary"
                onClick={() =>
                  showToast({
                    message: 'Acceptable Use Policy opened',
                    variant: 'info',
                  })
                }
              >
                Read policy
              </WuButton>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
