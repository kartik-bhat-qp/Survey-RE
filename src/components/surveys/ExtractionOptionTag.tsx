'use client';

import styles from './ExtractionOptionTag.module.css';

interface ExtractionOptionTagProps {
  label: string;
}

export function ExtractionOptionTag({ label }: ExtractionOptionTagProps) {
  return (
    <span className={styles.tag}>
      <span className={`wm-call-split ${styles.icon}`} aria-hidden />
      {label}
    </span>
  );
}
