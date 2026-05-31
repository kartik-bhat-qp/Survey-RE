'use client';

import type { LookupTablePreviewData } from '@/data/mock-add-question-previews';
import styles from './LookupTableQuestionPreview.module.css';

interface LookupTableQuestionPreviewProps {
  data: LookupTablePreviewData;
}

export function LookupTableQuestionPreview({ data }: LookupTableQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <p className={styles.question}>{data.question}</p>
      <div className={styles.select}>
        <span className={styles.selectValue}>{data.selectedValue}</span>
        <span className={`wm-arrow-drop-down ${styles.selectCaret}`} aria-hidden />
      </div>
    </div>
  );
}
