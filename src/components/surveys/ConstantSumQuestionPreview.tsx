'use client';

import type { ConstantSumPreviewData } from '@/data/mock-add-question-previews';
import styles from './ConstantSumQuestionPreview.module.css';

interface ConstantSumQuestionPreviewProps {
  data: ConstantSumPreviewData;
}

export function ConstantSumQuestionPreview({ data }: ConstantSumQuestionPreviewProps) {
  return (
    <ul className={styles.rows} aria-hidden>
      {data.rows.map((row) => (
        <li key={row.label} className={styles.row}>
          <span className={styles.rowLabel}>{row.label}</span>
          <div className={styles.track}>
            <span className={styles.thumb} />
          </div>
          <span className={styles.valueBox}>{row.value}</span>
        </li>
      ))}
    </ul>
  );
}
