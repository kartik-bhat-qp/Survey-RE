'use client';

import type { LinkedCommunityDisplay } from '@/data/mock-question-communities';
import styles from './LinkedCommunityBanner.module.css';

interface LinkedCommunityBannerProps {
  link: LinkedCommunityDisplay;
}

export function LinkedCommunityBanner({ link }: LinkedCommunityBannerProps) {
  return (
    <p className={styles.banner}>
      <span className={styles.prefix}>Linked Community</span>
      <span className={styles.separator} aria-hidden>
        »
      </span>
      <span className={styles.segment}>{link.communityLabel}</span>
      <span className={styles.separator} aria-hidden>
        »
      </span>
      <span className={styles.segment}>{link.profileFieldLabel}</span>
    </p>
  );
}
