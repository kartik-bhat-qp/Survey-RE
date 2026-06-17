'use client';

import type { SyntheticEvent } from 'react';
import type { SurveyMatrix } from '@/data/mock-survey-detail';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import styles from './DragDropQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface DragDropMatrixPreviewProps {
  matrix: SurveyMatrix;
  onMatrixAnchorChange: (
    anchor: 'leftAnchor' | 'rightAnchor',
    value: string
  ) => void;
  onMatrixRowLabelChange: (rowId: string, label: string) => void;
}

export function DragDropMatrixPreview({
  matrix,
  onMatrixAnchorChange,
  onMatrixRowLabelChange,
}: DragDropMatrixPreviewProps) {
  return (
    <div className={styles.layout}>
      <ul className={styles.items}>
        {matrix.rows.map((row, index) => (
          <li key={row.id} className={styles.card}>
            <div className={styles.itemLabel} onPointerDown={stopQuestionEvent}>
              <QuestionRichTextField
                variant="option"
                value={row.label}
                onChange={(label) => onMatrixRowLabelChange(row.id, label)}
                ariaLabel="Drag and drop item label"
                placeholder="Item"
              />
            </div>
            <div className={styles.rankControl}>
              <span className={styles.rankBadge}>{index + 1}</span>
              <span className={`wm-arrow-drop-down ${styles.rankArrow}`} aria-hidden />
            </div>
          </li>
        ))}
      </ul>
      <div className={styles.anchors}>
        <div className={styles.anchorField}>
          <QuestionRichTextField
            variant="option"
            value={matrix.leftAnchor}
            onChange={(value) => onMatrixAnchorChange('leftAnchor', value)}
            ariaLabel="Top anchor"
            placeholder="Top Anchor"
            onPointerDown={stopQuestionEvent}
          />
        </div>
        <div className={styles.anchorField}>
          <QuestionRichTextField
            variant="option"
            value={matrix.rightAnchor}
            onChange={(value) => onMatrixAnchorChange('rightAnchor', value)}
            ariaLabel="Bottom anchor"
            placeholder="Bottom Anchor"
            toolbarAlign="end"
            onPointerDown={stopQuestionEvent}
          />
        </div>
      </div>
    </div>
  );
}
