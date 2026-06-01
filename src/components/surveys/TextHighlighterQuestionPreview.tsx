'use client';

import type { TextHighlighterPreviewData } from '@/data/mock-add-question-previews';
import styles from './TextHighlighterQuestionPreview.module.css';

interface TextHighlighterQuestionPreviewProps {
  data: TextHighlighterPreviewData;
}

export function TextHighlighterQuestionPreview({ data }: TextHighlighterQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <p className={styles.passage}>
        {data.segments.map((segment, index) =>
          segment.highlight ? (
            <mark
              key={`${index}-${segment.text}`}
              className={
                segment.highlight === 'like' ? styles.highlightLike : styles.highlightDislike
              }
            >
              {segment.text}
            </mark>
          ) : (
            <span key={`${index}-${segment.text}`}>{segment.text}</span>
          )
        )}
      </p>

      <ul className={styles.legend}>
        <li className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotLike}`} />
          <span>{data.likeLabel}</span>
        </li>
        <li className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotDislike}`} />
          <span>{data.dislikeLabel}</span>
        </li>
      </ul>
    </div>
  );
}
