'use client';

import type { LookupTablePreviewData } from '@/data/mock-add-question-previews';
import styles from './LookupTableQuestionPreview.module.css';

interface LookupTableQuestionPreviewProps {
  data: LookupTablePreviewData;
  showQuestion?: boolean;
}

export function LookupTableQuestionPreview({
  data,
  showQuestion = true,
}: LookupTableQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      {showQuestion ? <p className={styles.question}>{data.question}</p> : null}
      <div className={styles.select}>
        <span className={styles.selectValue}>{data.selectedValue}</span>
        <span className={`wm-arrow-drop-down ${styles.selectCaret}`} aria-hidden />
      </div>
    </div>
  );
}
