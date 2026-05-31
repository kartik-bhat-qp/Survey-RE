'use client';

import type { TubePulsePreviewData } from '@/data/mock-add-question-previews';
import styles from './TubePulseQuestionPreview.module.css';

interface TubePulseQuestionPreviewProps {
  data: TubePulsePreviewData;
}

export function TubePulseQuestionPreview({ data }: TubePulseQuestionPreviewProps) {
  const [badLabel, goodLabel, excellentLabel] = data.scaleLabels;

  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.videoFrame}>
        <div className={styles.playButton}>
          <span className={styles.playTriangle} />
        </div>
      </div>

      <div className={styles.ratingBlock}>
        <ul className={styles.scaleLabels}>
          <li className={styles.scaleLabel}>{badLabel}</li>
          <li className={`${styles.scaleLabel} ${styles.scaleLabelCenter}`}>{goodLabel}</li>
          <li className={`${styles.scaleLabel} ${styles.scaleLabelEnd}`}>{excellentLabel}</li>
        </ul>

        <div className={styles.track}>
          <span
            className={styles.thumb}
            style={{ left: `${data.thumbPositionPercent}%` }}
          />
        </div>

        <div className={styles.thumbIcons}>
          <span className={`wm-thumb-down ${styles.thumbDown}`} aria-hidden />
          <span className={`wm-thumb-up ${styles.thumbUp}`} aria-hidden />
        </div>
      </div>
    </div>
  );
}
