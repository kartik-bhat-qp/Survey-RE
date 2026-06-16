'use client';

import styles from './DropdownQuestionPreview.module.css';

interface DropdownQuestionPreviewProps {
  selectedValue: string;
}

export function DropdownQuestionPreview({ selectedValue }: DropdownQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.select}>
        <span className={styles.selectValue}>{selectedValue}</span>
        <span className={`wm-arrow-drop-down ${styles.selectCaret}`} aria-hidden />
      </div>
    </div>
  );
}
