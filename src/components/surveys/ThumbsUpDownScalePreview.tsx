'use client';

import type { SyntheticEvent } from 'react';
import type { SurveyThumbsChoice } from '@/data/mock-survey-detail';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import styles from './ThumbsUpDownScalePreview.module.css';

const THUMB_ICON_BY_DIRECTION: Record<SurveyThumbsChoice['direction'], string> = {
  up: 'wm-thumb-up',
  down: 'wm-thumb-down',
};

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

interface ThumbsUpDownScalePreviewProps {
  choices: SurveyThumbsChoice[];
  onChoiceLabelChange?: (choiceId: string, label: string) => void;
}

export function ThumbsUpDownScalePreview({
  choices,
  onChoiceLabelChange,
}: ThumbsUpDownScalePreviewProps) {
  return (
    <ul className={styles.scale} aria-label="Thumbs up down scale">
      {choices.map((choice) => (
        <li key={choice.id} className={styles.scaleItem}>
          <span
            className={`${THUMB_ICON_BY_DIRECTION[choice.direction]} ${styles.thumbIcon}`}
            aria-hidden
          />
          <div className={styles.labelWrap}>
            {onChoiceLabelChange ? (
              <QuestionRichTextField
                variant="option"
                value={choice.label}
                onChange={(label) => onChoiceLabelChange(choice.id, label)}
                ariaLabel="Choice label"
                placeholder="Label"
                onPointerDown={stopQuestionEvent}
              />
            ) : (
              <span className={styles.labelText}>{choice.label}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
