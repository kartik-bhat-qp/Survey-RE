'use client';

import styles from './EmailAddressQuestionPreview.module.css';

interface EmailAddressQuestionPreviewProps {
  fieldLabel?: string;
}

export function EmailAddressQuestionPreview({
  fieldLabel = 'Email Address',
}: EmailAddressQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <p className={styles.fieldLabel}>{fieldLabel}</p>
      <div className={styles.dottedLine} />
    </div>
  );
}
