'use client';

import type { MatrixSpreadsheetPreviewData } from '@/data/mock-add-question-previews';
import styles from './MatrixSpreadsheetQuestionPreview.module.css';

interface MatrixSpreadsheetQuestionPreviewProps {
  data: MatrixSpreadsheetPreviewData;
}

export function MatrixSpreadsheetQuestionPreview({
  data,
}: MatrixSpreadsheetQuestionPreviewProps) {
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
                  <div className={styles.textInput} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
