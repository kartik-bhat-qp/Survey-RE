'use client';

import Image from 'next/image';
import type { ImageChooserRatingPreviewData } from '@/data/mock-add-question-previews';
import styles from './ImageChooserRatingQuestionPreview.module.css';

interface ImageChooserRatingQuestionPreviewProps {
  data: ImageChooserRatingPreviewData;
}

export function ImageChooserRatingQuestionPreview({
  data,
}: ImageChooserRatingQuestionPreviewProps) {
  return (
    <ul className={styles.options} aria-hidden>
      {data.options.map((option) => (
        <li key={option.imageAlt} className={styles.option}>
          <div className={styles.imageFrame}>
            <Image
              src={option.imageSrc}
              alt={option.imageAlt}
              width={120}
              height={90}
              className={styles.image}
            />
          </div>
          <div className={styles.selectBlock}>
            <div className={styles.select}>
              <span className={styles.selectText}>{data.ratingPlaceholder}</span>
              <span className={`wm-arrow-drop-down ${styles.selectArrow}`} aria-hidden />
            </div>
            <div className={styles.selectUnderline} />
          </div>
        </li>
      ))}
    </ul>
  );
}
