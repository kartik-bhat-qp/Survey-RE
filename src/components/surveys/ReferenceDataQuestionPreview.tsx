'use client';

import type { ReferenceDataPreviewData } from '@/data/mock-add-question-previews';
import styles from './ReferenceDataQuestionPreview.module.css';

interface ReferenceDataQuestionPreviewProps {
  data: ReferenceDataPreviewData;
}

export function ReferenceDataQuestionPreview({ data }: ReferenceDataQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <p className={styles.placeholder}>{data.inputPlaceholder}</p>
      <div className={styles.inputLine} />
    </div>
  );
}
