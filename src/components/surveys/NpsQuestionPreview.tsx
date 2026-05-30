'use client';

import type { NpsPreviewData } from '@/data/mock-add-question-previews';
import styles from './NpsQuestionPreview.module.css';

interface NpsQuestionPreviewProps {
  data: NpsPreviewData;
}

const DEFAULT_SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function NpsQuestionPreview({ data }: NpsQuestionPreviewProps) {
  const scores = data.scores ?? DEFAULT_SCORES;

  return (
    <div className={styles.root} aria-hidden>
      <ul className={styles.scale}>
        {scores.map((score) => (
          <li key={score} className={styles.box}>
            {score}
          </li>
        ))}
      </ul>
      <div className={styles.anchorLabels}>
        <span className={styles.minLabel}>{data.minLabel}</span>
        <span className={styles.maxLabel}>{data.maxLabel}</span>
      </div>
    </div>
  );
}
