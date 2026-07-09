'use client';

import styles from './DeepDiveAttachedBadge.module.css';

export function DeepDiveAttachedBadge() {
  return (
    <span className={styles.badge} aria-label="DeepDive attached">
      <span className={`wm-chat ${styles.icon}`} aria-hidden />
      Deep dive
    </span>
  );
}
