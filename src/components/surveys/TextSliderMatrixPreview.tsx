'use client';

import type { SyntheticEvent } from 'react';
import type { SurveyMatrix } from '@/data/mock-survey-detail';
import { TEXT_SLIDER_VALUE_PLACEHOLDER } from '@/data/mock-survey-detail';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import styles from './TextSliderQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface TextSliderMatrixPreviewProps {
  matrix: SurveyMatrix;
  onMatrixAnchorChange: (
    anchor: 'leftAnchor' | 'rightAnchor',
    value: string
  ) => void;
  onMatrixColumnLabelChange: (columnId: string, label: string) => void;
  onMatrixRowLabelChange: (rowId: string, label: string) => void;
}

export function TextSliderMatrixPreview({
  matrix,
  onMatrixAnchorChange,
  onMatrixColumnLabelChange,
  onMatrixRowLabelChange,
}: TextSliderMatrixPreviewProps) {
  return (
    <div className={styles.matrixWrap}>
      <div className={`${styles.matrixRowLine} ${styles.anchorRow}`}>
        <span className={styles.rowLabelSpacer} aria-hidden />
        <span className={styles.valueSpacer} aria-hidden />
        <div className={styles.anchorTrack}>
          <div className={styles.anchorField}>
            <QuestionRichTextField
              variant="option"
              value={matrix.leftAnchor}
              onChange={(value) => onMatrixAnchorChange('leftAnchor', value)}
              ariaLabel="Left anchor"
              placeholder="Left Anchor"
              onPointerDown={stopQuestionEvent}
            />
          </div>
          <div className={styles.anchorField}>
            <QuestionRichTextField
              variant="option"
              value={matrix.rightAnchor}
              onChange={(value) => onMatrixAnchorChange('rightAnchor', value)}
              ariaLabel="Right anchor"
              placeholder="Right Anchor"
              toolbarAlign="end"
              onPointerDown={stopQuestionEvent}
            />
          </div>
        </div>
      </div>

      <div className={styles.matrixRowLine}>
        <span className={styles.rowLabelSpacer} aria-hidden />
        <span className={styles.valueSpacer} aria-hidden />
        <ul className={styles.scaleLabels}>
          {matrix.columns.map((column) => (
            <li key={column.id} className={styles.scaleLabelCell}>
              <QuestionRichTextField
                variant="option"
                value={column.label}
                onChange={(label) => onMatrixColumnLabelChange(column.id, label)}
                ariaLabel="Scale label"
                placeholder="Label"
                onPointerDown={stopQuestionEvent}
              />
            </li>
          ))}
        </ul>
      </div>

      <ul className={styles.sliderRows}>
        {matrix.rows.map((row) => (
          <li key={row.id} className={styles.sliderRow}>
            <div className={styles.rowLabelCell}>
              <QuestionRichTextField
                variant="option"
                value={row.label}
                onChange={(label) => onMatrixRowLabelChange(row.id, label)}
                ariaLabel="Row label"
                placeholder="Row"
                onPointerDown={stopQuestionEvent}
              />
            </div>
            <span className={styles.valueBox}>{TEXT_SLIDER_VALUE_PLACEHOLDER}</span>
            <div className={styles.track}>
              <span className={styles.thumb} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
