'use client';

import Image from 'next/image';
import type { ImageChooserSelectOnePreviewData } from '@/data/mock-add-question-previews';
import styles from './ImageChooserSelectOneQuestionPreview.module.css';

interface ImageChooserSelectOneQuestionPreviewProps {
  data: ImageChooserSelectOnePreviewData;
  /** Fits four image options in one row (Select Many). */
  compactLayout?: boolean;
}

export function ImageChooserSelectOneQuestionPreview({
  data,
  compactLayout = false,
}: ImageChooserSelectOneQuestionPreviewProps) {
  return (
    <ul
      className={`${styles.options} ${compactLayout ? styles.optionsCompact : ''}`}
      aria-hidden
    >
      {data.options.map((option) => (
        <li
          key={option.label}
          className={`${styles.option} ${compactLayout ? styles.optionCompact : ''}`}
        >
          <div className={styles.imageFrame}>
            <Image
              src={option.imageSrc}
              alt={option.imageAlt}
              width={160}
              height={120}
              className={styles.image}
            />
          </div>
          <span className={styles.optionLabel}>{option.label}</span>
        </li>
      ))}
    </ul>
  );
}
