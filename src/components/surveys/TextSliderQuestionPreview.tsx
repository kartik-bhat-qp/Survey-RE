'use client';

import type { TextSliderPreviewData } from '@/data/mock-add-question-previews';
import styles from './TextSliderQuestionPreview.module.css';

interface TextSliderQuestionPreviewProps {
  data: TextSliderPreviewData;
}

export function TextSliderQuestionPreview({ data }: TextSliderQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.scaleHeader}>
        <span className={styles.rowLabelSpacer} />
        <ul className={styles.scaleLabels}>
          {data.scaleLabels.map((label) => (
            <li key={label} className={styles.scaleLabel}>
              {label}
            </li>
          ))}
        </ul>
      </div>

      <ul className={styles.sliderRows}>
        {data.rows.map((row) => (
          <li key={row} className={styles.sliderRow}>
            <span className={styles.rowLabel}>{row}</span>
            <div className={styles.track}>
              <span className={styles.thumb} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
