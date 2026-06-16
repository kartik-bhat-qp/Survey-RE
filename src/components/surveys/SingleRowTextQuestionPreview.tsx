'use client';

import styles from './SingleRowTextQuestionPreview.module.css';

interface SingleRowTextQuestionPreviewProps {
  placeholder?: string;
}

export function SingleRowTextQuestionPreview({
  placeholder = 'Single Row Answer Text',
}: SingleRowTextQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.inputRow}>
        <span className={styles.placeholder}>{placeholder}</span>
        <span className={styles.dottedLine} />
      </div>
    </div>
  );
}
