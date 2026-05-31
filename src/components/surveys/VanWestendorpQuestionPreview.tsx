'use client';

import type { VanWestendorpPreviewData } from '@/data/mock-add-question-previews';
import styles from './VanWestendorpQuestionPreview.module.css';

interface VanWestendorpQuestionPreviewProps {
  data: VanWestendorpPreviewData;
}

export function VanWestendorpQuestionPreview({ data }: VanWestendorpQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <p className={styles.title}>{data.title}</p>
      <ul className={styles.rowList}>
        {data.rows.map((row) => (
          <li key={row.id} className={styles.row}>
            <p className={styles.prompt}>{row.prompt}</p>
            <div className={styles.priceCol}>
              <span className={styles.priceLabel}>{data.priceLabel}</span>
              <div className={styles.priceLine} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
