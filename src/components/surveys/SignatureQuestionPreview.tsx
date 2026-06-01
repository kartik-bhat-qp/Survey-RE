'use client';

import type { SignaturePreviewData } from '@/data/mock-add-question-previews';
import styles from './SignatureQuestionPreview.module.css';

interface SignatureQuestionPreviewProps {
  data: SignaturePreviewData;
}

export function SignatureQuestionPreview({ data }: SignatureQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.boxWrap}>
        <div className={styles.clearRow}>
          <span className={styles.clearLink}>{data.clearLabel}</span>
        </div>
        <div className={styles.signatureBox} />
      </div>
    </div>
  );
}
