'use client';

import type { CSSProperties } from 'react';
import type { FlexMatrixPreviewData } from '@/data/mock-add-question-previews';
import styles from './FlexMatrixQuestionPreview.module.css';

interface FlexMatrixQuestionPreviewProps {
  data: FlexMatrixPreviewData;
}

export function FlexMatrixQuestionPreview({ data }: FlexMatrixQuestionPreviewProps) {
  const columnCount = Math.max(data.columns.length, 1);

  return (
    <div
      className={styles.root}
      style={{ '--flex-matrix-cols': columnCount } as CSSProperties}
      aria-hidden
    >
      <div className={styles.headerRow}>
        <span className={styles.rowLabelSpacer} />
        {data.columns.map((column) => (
          <span key={column.label} className={styles.columnLabel}>
            {column.label}
          </span>
        ))}
      </div>
      {data.rows.map((row) => (
        <div key={row} className={styles.bodyRow}>
          <span className={styles.rowLabel}>{row}</span>
          {data.columns.map((column) => (
            <span key={`${row}-${column.label}`} className={styles.cell}>
              {column.cellType === 'radio' || column.cellType === 'checkbox' ? (
                <input type={column.cellType} disabled tabIndex={-1} aria-hidden />
              ) : (
                <span className={styles.textInput} />
              )}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
