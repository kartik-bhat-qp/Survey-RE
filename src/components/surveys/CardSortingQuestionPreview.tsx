'use client';

import type { CardSortingPreviewData } from '@/data/mock-add-question-previews';
import styles from './CardSortingQuestionPreview.module.css';

interface CardSortingQuestionPreviewProps {
  data: CardSortingPreviewData;
}

export function CardSortingQuestionPreview({ data }: CardSortingQuestionPreviewProps) {
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

      <div className={styles.categories}>
        <p className={styles.categoriesHeading}>{data.categoriesHeading}</p>
        <ul className={styles.categoryList}>
          {data.categories.map((category) => (
            <li key={category} className={styles.categoryLabel}>
              {category}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
