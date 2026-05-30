'use client';

import type { DragDropPreviewData } from '@/data/mock-add-question-previews';
import styles from './DragDropQuestionPreview.module.css';

interface DragDropQuestionPreviewProps {
  data: DragDropPreviewData;
}

export function DragDropQuestionPreview({ data }: DragDropQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <ul className={styles.items}>
        {data.items.map((item) => (
          <li key={item.label} className={styles.card}>
            <span className={styles.itemLabel}>{item.label}</span>
            <span className={styles.rankBadge}>{item.rank}</span>
          </li>
        ))}
      </ul>
      <div className={styles.anchors}>
        <span className={styles.anchorLabel}>{data.leftAnchor}</span>
        <span className={styles.anchorLabel}>{data.rightAnchor}</span>
      </div>
    </div>
  );
}
