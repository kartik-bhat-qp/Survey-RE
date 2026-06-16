'use client';

import { STAR_RATING_STAR_COUNT } from '@/data/mock-survey-detail';
import styles from './StarRatingStarsPreview.module.css';

interface StarRatingStarsPreviewProps {
  starCount?: number;
}

export function StarRatingStarsPreview({
  starCount = STAR_RATING_STAR_COUNT,
}: StarRatingStarsPreviewProps) {
  return (
    <div className={styles.starRow} aria-hidden>
      {Array.from({ length: starCount }, (_, index) => (
        <span key={index} className={`wm-star ${styles.star}`} />
      ))}
    </div>
  );
}
