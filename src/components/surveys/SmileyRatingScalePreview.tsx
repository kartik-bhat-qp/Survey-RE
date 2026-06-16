'use client';

import type { SyntheticEvent } from 'react';
import type { SurveySmileyRatingOption } from '@/data/mock-survey-detail';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import styles from './SmileyRatingScalePreview.module.css';

const SMILEY_ICON_BY_TONE: Record<SurveySmileyRatingOption['tone'], string> = {
  'very-unsatisfied': 'wm-sentiment-very-dissatisfied',
  unsatisfied: 'wm-sentiment-dissatisfied',
  neutral: 'wm-sentiment-neutral',
  satisfied: 'wm-sentiment-satisfied',
  'very-satisfied': 'wm-sentiment-very-satisfied',
};

const SMILEY_FACE_CLASS_BY_TONE: Record<SurveySmileyRatingOption['tone'], string> = {
  'very-unsatisfied': styles.faceVeryUnsatisfied,
  unsatisfied: styles.faceUnsatisfied,
  neutral: styles.faceNeutral,
  satisfied: styles.faceSatisfied,
  'very-satisfied': styles.faceVerySatisfied,
};

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

interface SmileyRatingScalePreviewProps {
  options: SurveySmileyRatingOption[];
  onOptionLabelChange?: (
    optionId: string,
    label: string
  ) => void;
}

export function SmileyRatingScalePreview({
  options,
  onOptionLabelChange,
}: SmileyRatingScalePreviewProps) {
  return (
    <ul className={styles.scale} aria-label="Smiley rating scale">
      {options.map((option) => (
        <li key={option.id} className={styles.scaleItem}>
          <span
            className={`${SMILEY_ICON_BY_TONE[option.tone]} ${styles.face} ${SMILEY_FACE_CLASS_BY_TONE[option.tone]}`}
            aria-hidden
          />
          <div className={styles.labelRow}>
            {onOptionLabelChange ? (
              <QuestionRichTextField
                variant="option"
                value={option.label}
                onChange={(label) => onOptionLabelChange(option.id, label)}
                ariaLabel="Scale label"
                placeholder="Label"
                onPointerDown={stopQuestionEvent}
              />
            ) : (
              <span className={styles.labelText}>{option.label}</span>
            )}
            <span className={`wm-arrow-drop-down ${styles.labelCaret}`} aria-hidden />
          </div>
        </li>
      ))}
    </ul>
  );
}
