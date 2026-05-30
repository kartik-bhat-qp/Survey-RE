'use client';

import type { RankOrderPreviewData } from '@/data/mock-add-question-previews';
import styles from './RankOrderQuestionPreview.module.css';

interface RankOrderQuestionPreviewProps {
  data: RankOrderPreviewData;
}

export function RankOrderQuestionPreview({ data }: RankOrderQuestionPreviewProps) {
  return (
    <ul className={styles.rows} aria-hidden>
      {data.items.map((item) => (
        <li key={item} className={styles.row}>
          <span className={styles.itemLabel}>{item}</span>
          <div className={styles.selectBlock}>
            <div className={styles.select}>
              <span className={styles.selectText}>{data.selectPlaceholder}</span>
              <span className={`wm-arrow-drop-down ${styles.selectArrow}`} aria-hidden />
            </div>
            <div className={styles.selectUnderline} />
          </div>
        </li>
      ))}
    </ul>
  );
}
