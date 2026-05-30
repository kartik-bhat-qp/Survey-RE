'use client';

import type { MatrixMultiSelectPreviewData } from '@/data/mock-add-question-previews';
import styles from './MatrixMultiPointScalesQuestionPreview.module.css';

interface MatrixMultiSelectQuestionPreviewProps {
  data: MatrixMultiSelectPreviewData;
}

export function MatrixMultiSelectQuestionPreview({
  data,
}: MatrixMultiSelectQuestionPreviewProps) {
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

      <ul className={styles.matrixRows}>
        {data.rows.map((row) => (
          <li key={row} className={styles.matrixRow}>
            <span className={styles.rowLabel}>{row}</span>
            <ul className={styles.cells}>
              {data.scaleLabels.map((column) => (
                <li key={`${row}-${column}`} className={styles.cell}>
                  <input type="checkbox" disabled tabIndex={-1} aria-hidden />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
