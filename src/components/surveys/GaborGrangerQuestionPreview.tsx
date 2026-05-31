'use client';

import type { GaborGrangerPreviewData } from '@/data/mock-add-question-previews';
import styles from './GaborGrangerQuestionPreview.module.css';

interface GaborGrangerQuestionPreviewProps {
  data: GaborGrangerPreviewData;
}

export function GaborGrangerQuestionPreview({ data }: GaborGrangerQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <p className={styles.price}>{data.priceDisplay}</p>
      <ul className={styles.choiceList}>
        {data.choices.map((label) => (
          <li key={label} className={styles.choice}>
            <input type="radio" disabled tabIndex={-1} />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
