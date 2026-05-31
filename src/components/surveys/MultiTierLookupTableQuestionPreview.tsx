'use client';

import type { MultiTierLookupPreviewData } from '@/data/mock-add-question-previews';
import styles from './MultiTierLookupTableQuestionPreview.module.css';

interface MultiTierLookupTableQuestionPreviewProps {
  data: MultiTierLookupPreviewData;
}

export function MultiTierLookupTableQuestionPreview({
  data,
}: MultiTierLookupTableQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <p className={styles.instructions}>{data.instructions}</p>
      <div className={styles.select}>
        <span className={styles.selectPlaceholder}>{data.selectPlaceholder}</span>
        <span className={`wm-arrow-drop-down ${styles.selectCaret}`} aria-hidden />
      </div>
    </div>
  );
}
