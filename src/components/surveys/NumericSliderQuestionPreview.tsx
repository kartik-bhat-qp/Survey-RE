'use client';

import type { NumericSliderPreviewData } from '@/data/mock-add-question-previews';
import styles from './NumericSliderQuestionPreview.module.css';

interface NumericSliderQuestionPreviewProps {
  data: NumericSliderPreviewData;
}

export function NumericSliderQuestionPreview({ data }: NumericSliderQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.anchorHeader}>
        <span className={styles.rowLabelSpacer} />
        <span className={styles.valueSpacer} />
        <div className={styles.anchors}>
          <span className={styles.anchorLabel}>{data.leftAnchor}</span>
          <span className={styles.anchorLabel}>{data.rightAnchor}</span>
        </div>
      </div>

      <ul className={styles.sliderRows}>
        {data.rows.map((row) => (
          <li key={row} className={styles.sliderRow}>
            <span className={styles.rowLabel}>{row}</span>
            <span className={styles.valueBox}>{data.valuePlaceholder}</span>
            <div className={styles.track}>
              <span className={styles.thumb} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
