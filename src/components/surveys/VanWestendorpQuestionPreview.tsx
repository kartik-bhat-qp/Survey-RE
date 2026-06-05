'use client';

import type { VanWestendorpPreviewData } from '@/data/mock-add-question-previews';
import styles from './VanWestendorpQuestionPreview.module.css';

interface VanWestendorpQuestionPreviewProps {
  data: VanWestendorpPreviewData;
  /** When false, only price rows render (workspace uses QuestionRichTextField for the title). */
  showTitle?: boolean;
  /** When true, hides the meter from assistive tech (e.g. add-question menu hover). */
  decorative?: boolean;
  variant?: 'preview' | 'workspace';
}

export function VanWestendorpQuestionPreview({
  data,
  showTitle = true,
  decorative = false,
  variant = 'preview',
}: VanWestendorpQuestionPreviewProps) {
  const rootClassName =
    variant === 'workspace' ? `${styles.root} ${styles.rootWorkspace}` : styles.root;

  return (
    <div className={rootClassName} {...(decorative ? { 'aria-hidden': true } : {})}>
      {showTitle && data.title ? <p className={styles.title}>{data.title}</p> : null}
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
