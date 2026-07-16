'use client';

import { MOCK_HEADER_DATA_CENTER } from '@/data/mock-header-user';
import styles from './HeaderDataCenter.module.css';

export function HeaderDataCenter() {
  return (
    <div className={styles.root} aria-label={MOCK_HEADER_DATA_CENTER.locationLabel}>
      <div className={styles.icons} aria-hidden>
        <span className={`wm-account-balance ${styles.icon}`} />
        <span className={`wm-public ${styles.icon}`} />
      </div>
      <span className={styles.label}>{MOCK_HEADER_DATA_CENTER.locationLabel}</span>
    </div>
  );
}
