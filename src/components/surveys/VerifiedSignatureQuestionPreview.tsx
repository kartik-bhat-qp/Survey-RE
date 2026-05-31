'use client';

import type { VerifiedSignaturePreviewData } from '@/data/mock-add-question-previews';
import styles from './VerifiedSignatureQuestionPreview.module.css';

interface VerifiedSignatureQuestionPreviewProps {
  data: VerifiedSignaturePreviewData;
}

export function VerifiedSignatureQuestionPreview({ data }: VerifiedSignatureQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <p className={styles.declaration}>{data.declaration}</p>
      <ul className={styles.fieldList}>
        <li className={styles.field}>
          <span className={styles.fieldLabel}>{data.fullNameLabel}</span>
          <div className={styles.fieldLine} />
        </li>
        <li className={styles.field}>
          <span className={styles.fieldLabel}>{data.emailLabel}</span>
          <div className={styles.fieldLine} />
        </li>
      </ul>
      <p className={styles.signaturePrompt}>{data.signaturePrompt}</p>
      <div className={styles.signatureBox}>
        <span className={styles.signaturePlaceholder}>{data.signaturePlaceholder}</span>
        <div className={styles.signatureLine} />
      </div>
      <p className={styles.agreeRow}>
        <span className={styles.fakeCheckbox} />
        {data.agreeLabel}
      </p>
    </div>
  );
}
