'use client';

import Image from 'next/image';
import type { SyntheticEvent } from 'react';
import type { SurveyMatrix } from '@/data/mock-survey-detail';
import { plainTextFromRichValue } from '@/components/surveys/rich-text-utils';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import styles from './ImageChooserRatingQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface ImageChooserRatingMatrixPreviewProps {
  matrix: SurveyMatrix;
  onMatrixRowLabelChange: (rowId: string, label: string) => void;
  onEditImage: (rowId: string) => void;
}

export function ImageChooserRatingMatrixPreview({
  matrix,
  onMatrixRowLabelChange,
  onEditImage,
}: ImageChooserRatingMatrixPreviewProps) {
  return (
    <ul className={styles.options}>
      {matrix.rows.map((row) => (
        <li key={row.id} className={styles.option}>
          <button
            type="button"
            className={styles.imageButton}
            aria-label={`Edit image for ${plainTextFromRichValue(row.label)}`}
            onClick={(event) => {
              event.stopPropagation();
              onEditImage(row.id);
            }}
          >
            {row.imageSrc ? (
              <Image
                src={row.imageSrc}
                alt={row.imageAlt ?? plainTextFromRichValue(row.label)}
                width={120}
                height={90}
                className={styles.image}
              />
            ) : (
              <span className={styles.placeholder}>
                <span className={`wm-image ${styles.placeholderIcon}`} aria-hidden />
              </span>
            )}
            <span className={styles.editOverlay}>
              <span className={styles.editLabel}>Click to Edit Image</span>
            </span>
          </button>
          <div className={styles.rowLabel} onPointerDown={stopQuestionEvent}>
            <QuestionRichTextField
              variant="option"
              value={row.label}
              onChange={(label) => onMatrixRowLabelChange(row.id, label)}
              ariaLabel="Row label"
              placeholder="Row"
            />
          </div>
          <div className={styles.selectList}>
            {matrix.columns.map((column) => (
              <div key={column.id} className={styles.selectBlock}>
                <div className={styles.select}>
                  <span className={styles.selectText}>
                    {plainTextFromRichValue(column.label) || 'Column'}
                  </span>
                  <span className={`wm-arrow-drop-down ${styles.selectArrow}`} aria-hidden />
                </div>
                <div className={styles.selectUnderline} />
              </div>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
