'use client';

import styles from './QuotaControlOptionTag.module.css';

interface QuotaControlOptionTagProps {
  label: string;
}

export function QuotaControlOptionTag({ label }: QuotaControlOptionTagProps) {
  return (
    <span className={styles.tag}>
      <span className={`wm-science ${styles.icon}`} aria-hidden />
      {label}
    </span>
  );
}
